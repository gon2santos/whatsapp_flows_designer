import { toDataSource } from '../data/nodeDefinitions'
import { slugify } from './slugify'

// Older versions of this tool generated option ids as "<index>_<title>" (e.g. "0_Sí"); current ones are plain
// slugs (e.g. "s"). Stored/imported Jump and Visibility conditions may still hold the old form, which no longer
// matches any data-source id (and a leading digit in a Switch "cases" key crashes Meta's validator).
const LEGACY_ID_PATTERN = /^(\d+)_(.*)$/;

const resolveOptionId = (optionId, validIds) => {
    if (!optionId || validIds.includes(optionId)) return optionId;
    const match = LEGACY_ID_PATTERN.exec(optionId);
    if (!match) return optionId;
    const [, index, title] = match;
    const slugged = slugify(title);
    if (validIds.includes(slugged)) return slugged;
    return validIds[Number(index)] ?? optionId;
};

// Returns screens with every Jump/Visibility condition's optionId rewritten to the source node's current ids.
export const migrateOptionIds = (screens) => {
    const validIdsByItemId = new Map();
    screens.forEach((screen) => screen.items.forEach((item) => {
        if (item.isPreview || !['dropdown', 'radio'].includes(item.type)) return;
        validIdsByItemId.set(item.id, toDataSource(item.config?.options).map((option) => option.id));
    }));

    return screens.map((screen) => ({
        ...screen,
        items: screen.items.map((item) => {
            const { jumpConditions, visibilityConditions } = item.config ?? {};
            if (!jumpConditions?.length && !visibilityConditions?.length) return item;
            const config = { ...item.config };
            if (jumpConditions?.length) {
                const ownIds = validIdsByItemId.get(item.id) ?? [];
                config.jumpConditions = jumpConditions.map((jump) => ({ ...jump, optionId: resolveOptionId(jump.optionId, ownIds) }));
            }
            if (visibilityConditions?.length) {
                config.visibilityConditions = visibilityConditions.map((condition) => ({
                    ...condition,
                    optionId: resolveOptionId(condition.optionId, validIdsByItemId.get(condition.nodeId) ?? []),
                }));
            }
            return { ...item, config };
        }),
    }));
};
