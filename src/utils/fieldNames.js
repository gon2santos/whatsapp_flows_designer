// The field/payload key WhatsApp Flow actually uses for a node: an explicit "Id" override, or its auto-generated name.
export const effectiveFieldName = (item) => item.config?.id || item.name;

// True when another node (on this screen or any other) already resolves to the same effective field name.
export const hasDuplicateFieldName = (screens, itemId, fieldName) => (
    !!fieldName && screens.some((screen) => screen.items.some((item) => (
        item.id !== itemId && !item.isPreview && effectiveFieldName(item) === fieldName
    )))
);
