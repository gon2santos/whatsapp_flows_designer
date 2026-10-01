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
