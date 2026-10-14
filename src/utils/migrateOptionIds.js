import { toDataSource } from '../data/nodeDefinitions'
import { slugify } from './slugify'

// Older versions of this tool generated option ids as "<index>_<title>" (e.g. "0_Sí"); current ones are plain
// slugs (e.g. "s"). Stored/imported Jump and Visibility conditions may still hold the old form, which no longer
// matches any data-source id (and a leading digit in a Switch "cases" key crashes Meta's validator).
const LEGACY_ID_PATTERN = /^(\d+)_(.*)$/;

// Ids from when slugify dropped accented letters instead of transliterating them (e.g. "Sí" -> "s", now "si").
const dropAccentsSlug = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

const resolveOptionId = (optionId, validOptions) => {
    const validIds = validOptions.map((option) => option.id);
    if (!optionId || validIds.includes(optionId)) return optionId;
    const bare = LEGACY_ID_PATTERN.exec(optionId)?.[2] ?? optionId;
    const slugged = slugify(bare);
    if (validIds.includes(slugged)) return slugged;
    const accentDropped = validOptions.find((option) => dropAccentsSlug(option.title) === dropAccentsSlug(bare));
    if (accentDropped) return accentDropped.id;
    const index = LEGACY_ID_PATTERN.exec(optionId)?.[1];
    return index !== undefined ? (validIds[Number(index)] ?? optionId) : optionId;
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
