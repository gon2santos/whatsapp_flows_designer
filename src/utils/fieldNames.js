// The field/payload key WhatsApp Flow actually uses for a node: an explicit "Id" override, or its auto-generated name.
export const effectiveFieldName = (item) => item.config?.id || item.name;

// Gives every node sharing a field name a unique "<name>_1", "_2"... id so the output has no conflicts; they get merged outside the flow.
export const dedupeFieldNames = (screens) => {
    const counts = new Map();
    screens.forEach((screen) => screen.items.forEach((item) => {
        if (item.isPreview) return;
        const name = effectiveFieldName(item);
        if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
    }));
    if (![...counts.values()].some((count) => count > 1)) return screens;

    const seen = new Map();
    return screens.map((screen) => ({
        ...screen,
        items: screen.items.map((item) => {
            const name = item.isPreview ? null : effectiveFieldName(item);
            if (!name || counts.get(name) < 2) return item;
            const index = (seen.get(name) ?? 0) + 1;
            seen.set(name, index);
            return { ...item, config: { ...item.config, id: `${name}_${index}` } };
        }),
    }));
};

// True when another node (on this screen or any other) already resolves to the same effective field name.
export const hasDuplicateFieldName = (screens, itemId, fieldName) => (
    !!fieldName && screens.some((screen) => screen.items.some((item) => (
        item.id !== itemId && !item.isPreview && effectiveFieldName(item) === fieldName
    )))
);
