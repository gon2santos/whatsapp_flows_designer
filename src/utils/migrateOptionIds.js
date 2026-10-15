import { toDataSource } from '../data/nodeDefinitions'

// Older versions of this tool generated option ids as "<index>_<title>" (e.g. "0_Sí"); current ones are plain
// slugs (e.g. "s"). Stored/imported Jump and Visibility conditions may still hold the old form, which no longer
// matches any data-source id (and a leading digit in a Switch "cases" key crashes Meta's validator).
const LEGACY_ID_PATTERN = /^(\d+)_(.*)$/;

// Ids from earlier versions were lowercased and/or had accented letters dropped (e.g. "Sí" -> "s"), so legacy
// ids are compared case-insensitively against the option's current id and its accent-dropping slug.
const dropAccentsSlug = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

const resolveOptionId = (optionId, validOptions) => {
    if (!optionId || validOptions.some((option) => option.id === optionId)) return optionId;
    const legacyMatch = LEGACY_ID_PATTERN.exec(optionId);
    const bare = legacyMatch ? legacyMatch[2] : optionId;
    const lowerBare = bare.toLowerCase();
    const byCurrentId = validOptions.find((option) => option.id.toLowerCase() === lowerBare);
    if (byCurrentId) return byCurrentId.id;
    const bySlug = validOptions.find((option) => {
        const legacySlug = dropAccentsSlug(option.title);
        return legacySlug === lowerBare || legacySlug === dropAccentsSlug(bare);
    });
    if (bySlug) return bySlug.id;
    return legacyMatch ? (validOptions[Number(legacyMatch[1])]?.id ?? optionId) : optionId;
};

// Returns screens with every Jump/Visibility condition's optionId rewritten to the source node's current ids.
export const migrateOptionIds = (screens) => {
    const optionsByItemId = new Map();
    screens.forEach((screen) => screen.items.forEach((item) => {
        if (item.isPreview || !['dropdown', 'radio'].includes(item.type)) return;
        optionsByItemId.set(item.id, toDataSource(item.config?.options));
    }));

    return screens.map((screen) => ({
        ...screen,
        items: screen.items.map((item) => {
            const { jumpConditions, visibilityConditions } = item.config ?? {};
            if (!jumpConditions?.length && !visibilityConditions?.length) return item;
            const config = { ...item.config };
            if (jumpConditions?.length) {
                const ownOptions = optionsByItemId.get(item.id) ?? [];
                config.jumpConditions = jumpConditions.map((jump) => ({ ...jump, optionId: resolveOptionId(jump.optionId, ownOptions) }));
            }
            if (visibilityConditions?.length) {
                config.visibilityConditions = visibilityConditions.map((condition) => ({
                    ...condition,
                    optionId: resolveOptionId(condition.optionId, optionsByItemId.get(condition.nodeId) ?? []),
                }));
            }
            return { ...item, config };
        }),
    }));
};
