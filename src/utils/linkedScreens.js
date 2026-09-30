// Screens reachable only through an OptIn's "Leer más" link, not part of the main navigate/terminal flow.
export const collectLinkedScreenIds = (screens) => {
    const linkedIds = new Set();
    screens.forEach((screen) => {
        screen.items
            .filter((item) => item.type === 'opt-in' && item.config?.linkedScreenId)
            .forEach((item) => linkedIds.add(item.config.linkedScreenId));
    });
    return linkedIds;
};

// A screen linked from an OptIn's "Leer más" only renders alongside the main flow, so it may only hold static content.
export const LINKED_SCREEN_ALLOWED_TYPES = ['text-caption', 'text-body', 'text-small-heading', 'text-large-heading', 'image'];

export const hasDisallowedNodes = (screen) => screen.items.some((item) => !LINKED_SCREEN_ALLOWED_TYPES.includes(item.type));
