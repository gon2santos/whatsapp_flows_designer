import { collectLinkedScreenIds } from './linkedScreens'

// Node types whose selected option can drive another node's "Visibility" conditions.
export const VISIBILITY_SOURCE_TYPES = ['dropdown', 'radio'];

// Dropdown/Radio nodes available as "Visibility" condition sources for the item at (screenId, itemIndex):
// anything earlier in the same screen, or anywhere in an earlier (non-linked) screen.
export const collectVisibilitySources = (screens, screenId, itemIndex) => {
    const linkedScreenIds = collectLinkedScreenIds(screens);
    const mainScreens = screens.filter((screen) => !linkedScreenIds.has(screen.id));
    const currentScreenIndex = mainScreens.findIndex((screen) => screen.id === screenId);
    if (currentScreenIndex === -1) return [];

    const sources = [];
    mainScreens.forEach((screen, screenIndex) => {
        if (screenIndex > currentScreenIndex) return;
        screen.items.forEach((item, index) => {
            if (item.isPreview || !VISIBILITY_SOURCE_TYPES.includes(item.type)) return;
            if (screen.id === screenId && index >= itemIndex) return;
            sources.push(item);
        });
    });
    return sources;
};

// After screens are reordered, a Visibility condition may reference a node that now sits on a LATER screen, whose
// answer can't be available yet. Drops those conditions (empty, not-yet-filled ones are kept); returns the same
// array when nothing needed to change. Linked screens are left alone: they have no visibility sources at all.
export const pruneUnavailableVisibilityConditions = (screens) => {
    const linkedScreenIds = collectLinkedScreenIds(screens);
    let changed = false;
    const pruned = screens.map((screen) => {
        if (linkedScreenIds.has(screen.id)) return screen;
        let screenChanged = false;
        const items = screen.items.map((item, index) => {
            const conditions = item.config?.visibilityConditions;
            if (!conditions?.length) return item;
            const availableIds = new Set(collectVisibilitySources(screens, screen.id, index).map((source) => source.id));
            const kept = conditions.filter((condition) => !condition.nodeId || availableIds.has(condition.nodeId));
            if (kept.length === conditions.length) return item;
            screenChanged = true;
            return { ...item, config: { ...item.config, visibilityConditions: kept } };
        });
        if (!screenChanged) return screen;
        changed = true;
        return { ...screen, items };
    });
    return changed ? pruned : screens;
};
