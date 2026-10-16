// WhatsApp Flow "NavigationList" (Flow JSON v6.2+), exposed in this app as the "Nav Menu" node.
export const NAV_MENU_TYPE = 'nav-menu';
export const NAV_MENU_WA_TYPE = 'NavigationList';

// Limits and restrictions from the NavigationList documentation.
export const NAV_MENU_LIMITS = {
    minItems: 1,
    maxItems: 20,
    label: 80,
    description: 300,
    mainTitle: 30,
    mainDescription: 20,
    mainMetadata: 80,
    endText: 10,
    badge: 15,
    tag: 15,
    maxTags: 3,
    imageBytes: 100 * 1024,
};

// A Nav Menu can't be combined with any other component on its screen, and a screen holds at most 2 of them.
export const MAX_NAV_MENUS_PER_SCREEN = 2;

export const createNavMenuItem = () => ({
    title: '', description: '', metadata: '',
    endTitle: '', endDescription: '',
    image: '', imageMimeType: '', imageName: '', altText: '',
    badge: '', tags: [],
    screenId: '',
});

export const NAV_MENU_DEFAULT_CONFIG = {
    label: '',
    description: '',
    mediaSize: 'regular',
    actionLevel: 'item',
    screenId: '',
    items: [createNavMenuItem()],
};

const itemTitle = (item, index) => (item.title?.trim() || `Item ${index + 1}`);

// Item ids are the item's title (like option ids elsewhere), with a "_2", "_3"... suffix on duplicates.
export const navMenuItemIds = (items = []) => {
    const used = new Set();
    return items.map((item, index) => {
        const base = itemTitle(item, index).replace(/"/g, '');
        let id = base;
        let suffix = 2;
        while (used.has(id)) { id = `${base}_${suffix}`; suffix += 1; }
        used.add(id);
        return id;
    });
};

// "end" can't be combined with a large media size, and only one item per list may carry a badge.
export const navMenuToJson = (config, { name }) => {
    const items = config.items?.length ? config.items : [createNavMenuItem()];
    const ids = navMenuItemIds(items);
    const isLarge = config.mediaSize === 'large';
    const badgeIndex = items.findIndex((item) => item.badge?.trim());

    const listItems = items.map((item, index) => {
        const mainContent = {
            title: itemTitle(item, index),
            ...(item.description?.trim() ? { description: item.description } : {}),
            ...(item.metadata?.trim() ? { metadata: item.metadata } : {}),
        };
        const end = {
            ...(item.endTitle?.trim() ? { title: item.endTitle } : {}),
            ...(item.endDescription?.trim() ? { description: item.endDescription } : {}),
        };
        const tags = (item.tags ?? []).map((tag) => tag.trim()).filter(Boolean).slice(0, NAV_MENU_LIMITS.maxTags);
        return {
            id: ids[index],
            'main-content': mainContent,
            ...(!isLarge && Object.keys(end).length ? { end } : {}),
            ...(item.image ? { start: { image: item.image, ...(item.altText?.trim() ? { 'alt-text': item.altText } : {}) } } : {}),
            ...(index === badgeIndex ? { badge: item.badge } : {}),
            ...(tags.length ? { tags } : {}),
        };
    });

    return {
        type: NAV_MENU_WA_TYPE,
        name,
        'list-items': listItems,
        ...(config.label?.trim() ? { label: config.label } : {}),
        ...(config.description?.trim() ? { description: config.description } : {}),
        'media-size': isLarge ? 'large' : 'regular',
    };
};

export const isNavMenuScreen = (screen) => screen.items.some((item) => !item.isPreview && item.type === NAV_MENU_TYPE);

// Returns a Spanish message when dropping `draggedType` on a screen holding `screenItems` would break a Nav Menu rule.
export const navMenuDropRestriction = (screenItems, draggedType) => {
    const realItems = screenItems.filter((item) => !item.isPreview);
    const navMenuCount = realItems.filter((item) => item.type === NAV_MENU_TYPE).length;
    if (draggedType === NAV_MENU_TYPE) {
        if (realItems.length > navMenuCount) return 'Un Nav Menu no se puede combinar con otros nodos en la misma pantalla.';
        if (navMenuCount >= MAX_NAV_MENUS_PER_SCREEN) return `No se pueden agregar más de ${MAX_NAV_MENUS_PER_SCREEN} Nav Menu en una misma pantalla.`;
        return null;
    }
    if (navMenuCount > 0) return 'Una pantalla con un Nav Menu no puede contener otros nodos.';
    return null;
};

// Reverse of navMenuToJson (+ the action fields buildFlowJson adds), used when importing a Flow JSON.
export const navMenuConfigFromNode = (node, stripScreenId = (id) => id) => {
    const componentAction = node['on-click-action'];
    const actionOf = (entry) => entry?.['on-click-action'];
    const targetOf = (action) => (action?.next?.name ? stripScreenId(action.next.name) : '');

    const items = (Array.isArray(node['list-items']) ? node['list-items'] : []).map((raw) => ({
        ...createNavMenuItem(),
        title: raw?.['main-content']?.title ?? '',
        description: raw?.['main-content']?.description ?? '',
        metadata: raw?.['main-content']?.metadata ?? '',
        endTitle: raw?.end?.title ?? '',
        endDescription: raw?.end?.description ?? '',
        image: raw?.start?.image ?? '',
        imageMimeType: raw?.start?.image ? 'image/png' : '',
        altText: raw?.start?.['alt-text'] ?? '',
        badge: raw?.badge ?? '',
        tags: Array.isArray(raw?.tags) ? raw.tags : [],
        screenId: componentAction ? '' : targetOf(actionOf(raw)),
    }));

    return {
        label: node.label ?? '',
        description: node.description ?? '',
        mediaSize: node['media-size'] === 'large' ? 'large' : 'regular',
        actionLevel: componentAction ? 'component' : 'item',
        screenId: targetOf(componentAction),
        items: items.length ? items : [createNavMenuItem()],
    };
};
