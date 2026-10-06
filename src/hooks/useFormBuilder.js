import { useState } from 'react'
import { isSortable } from '@dnd-kit/react/sortable'
import nodeDefinitions from '../data/nodeDefinitions'
import { slugify } from '../utils/slugify'
import { collectLinkedScreenIds, LINKED_SCREEN_ALLOWED_TYPES } from '../utils/linkedScreens'

// Placeholder id used to preview where a node dragged from the palette will land.
const PREVIEW_ID = '__palette-preview__';

// WhatsApp Flow screens are capped at 50 components.
export const MAX_NODES_PER_SCREEN = 50;

// A node with a filled-in "Top text" also emits a hidden TextBody, so it counts as 2 toward the screen's limit.
export const countNodeSlots = (items) => items.reduce((total, item) => total + (item.config?.topText?.trim() ? 2 : 1), 0);

// A screen linked from an OptIn's "Leer más" only renders alongside the main flow, so it may only hold static content.
const LINKED_SCREEN_RESTRICTION_MESSAGE = 'En una pantalla enlazada a un Opt In solo se pueden agregar nodos de Text Caption, Text Body, Small Header, Large Header e Image.';

// WhatsApp Flow screens can't hold more than 5 OptIn nodes.
const MAX_OPTIN_PER_SCREEN = 5;
const OPTIN_TYPE = 'opt-in';
const OPTIN_LIMIT_MESSAGE = `No se pueden agregar más de ${MAX_OPTIN_PER_SCREEN} nodos OptIn en una misma pantalla.`;
const countOptInNodes = (items) => items.filter((item) => item.type === OPTIN_TYPE).length;

// Builds a real node from a committed preview: stable field name + the type's default editable config.
const createNodeFromPreview = (preview) => {
    const id = crypto.randomUUID();
    const defaultConfig = nodeDefinitions.find((definition) => definition.type === preview.type)?.defaultConfig ?? {};
    return {
        id,
        type: preview.type,
        title: preview.title,
        name: `${slugify(preview.title)}_${id.slice(0, 8)}`,
        config: { ...defaultConfig },
    };
};

// Builds a copy of an existing node (Alt-drag clone): keeps every config value, only the id/name are regenerated.
const createClonedNode = (preview) => {
    const id = crypto.randomUUID();
    return {
        id,
        type: preview.type,
        title: preview.title,
        name: `${slugify(preview.title)}_${id.slice(0, 8)}`,
        config: { ...preview.cloneConfig },
    };
};

// A dropped preview came either from the palette (fresh default config) or from an Alt-drag clone of an existing node.
const createItemFromPreview = (preview) => (preview.cloneConfig ? createClonedNode(preview) : createNodeFromPreview(preview));

// The white screen area is the actual boundary for keeping/deleting a node, regardless of which collision target is reported.
const isPointerInsideScreen = (position) => {
    if (!position) return false;
    const screen = document.querySelector('.screen');
    if (!screen) return false;
    const rect = screen.getBoundingClientRect();
    return position.x >= rect.left && position.x <= rect.right && position.y >= rect.top && position.y <= rect.bottom;
};

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz';
const randomLetters = (length) => Array.from({ length }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('');

// WhatsApp Flow screen ids must only contain letters and underscores (no digits, hyphens, etc.).
const createScreenId = () => `screen_${randomLetters(10)}`;

const createScreen = (name) => ({ id: createScreenId(), name, items: [], footerLabel: null });

export const useFormBuilder = () => {
    const [screens, setScreens] = useState([]);
    const [activeScreenId, setActiveScreenId] = useState(null);
    const [restrictedDropMessage, setRestrictedDropMessage] = useState(null);

    const activeScreen = screens.find((screen) => screen.id === activeScreenId) ?? null;
    const items = activeScreen?.items ?? [];
    const dismissRestrictedDropMessage = () => setRestrictedDropMessage(null);

    // Nodes are only ever added/reordered on the active screen; there is nothing to drop into without one.
    const updateActiveScreenItems = (updater) => {
        setScreens((currentScreens) => currentScreens.map((screen) => (
            screen.id === activeScreenId
                ? { ...screen, items: typeof updater === 'function' ? updater(screen.items) : updater }
                : screen
        )));
    };

    const addScreen = () => {
        const newScreen = createScreen(`Screen ${screens.length + 1}`);
        setScreens((currentScreens) => [...currentScreens, newScreen]);
        setActiveScreenId(newScreen.id);
    };

    const removeScreen = (screenId) => {
        const remainingScreens = screens.filter((screen) => screen.id !== screenId);
        setScreens(remainingScreens);
        setActiveScreenId((currentActiveId) => (
            currentActiveId === screenId ? (remainingScreens[0]?.id ?? null) : currentActiveId
        ));
    };

    const selectScreen = (screenId) => setActiveScreenId(screenId);

    // Replaces the whole design with the screens/items parsed from a pasted WhatsApp Flow JSON document.
    const importFlowJson = (parsedScreens) => {
        setScreens(parsedScreens);
        setActiveScreenId(parsedScreens[0]?.id ?? null);
    };

    const renameScreen = (screenId, newName) => {
        setScreens((currentScreens) => currentScreens.map((screen) => (
            screen.id === screenId ? { ...screen, name: newName } : screen
        )));
    };

    // null footerLabel means "use the Finalizar/Continuar default" computed from the screen's terminal status.
    const setFooterLabel = (screenId, label) => {
        setScreens((currentScreens) => currentScreens.map((screen) => (
            screen.id === screenId ? { ...screen, footerLabel: label } : screen
        )));
    };

    // Stores the modal's edits for a single node back into that node's screen, keyed by node id.
    const updateItemConfig = (itemId, newConfig) => {
        setScreens((currentScreens) => currentScreens.map((screen) => (
            screen.items.some((item) => item.id === itemId)
                ? { ...screen, items: screen.items.map((item) => (item.id === itemId ? { ...item, config: newConfig } : item)) }
                : screen
        )));
    };

    // Drops any node type that isn't allowed once a screen becomes an OptIn's "Leer más" target.
    const pruneDisallowedNodes = (screenId) => {
        setScreens((currentScreens) => currentScreens.map((screen) => (
            screen.id === screenId
                ? { ...screen, items: screen.items.filter((item) => LINKED_SCREEN_ALLOWED_TYPES.includes(item.type)) }
                : screen
        )));
    };

    const handleDragOver = (event) => {
        if (!activeScreenId) return;

        const { source, target, position } = event.operation;
        const cloneSource = source?.data?.cloneSource;
        if (!source?.data?.fromPalette && !cloneSource) return;
        const draggedType = cloneSource ? cloneSource.type : source.data.type;

        updateActiveScreenItems((currentItems) => {
            const previewIndex = currentItems.findIndex((item) => item.id === PREVIEW_ID);
            const withoutPreview = currentItems.filter((item) => item.id !== PREVIEW_ID);

            // Screen is already full: don't even preview the incoming node, it would be banished on drop anyway.
            if (countNodeSlots(withoutPreview) >= MAX_NODES_PER_SCREEN) return withoutPreview;

            // Same for the OptIn-specific cap: no point previewing a 6th OptIn node.
            if (draggedType === OPTIN_TYPE && countOptInNodes(withoutPreview) >= MAX_OPTIN_PER_SCREEN) return withoutPreview;

            if (!target) return withoutPreview;

            let targetIndex;
            if (isSortable(target)) {
                targetIndex = target.index;

                // Insert after the hovered card once the pointer crosses its vertical midpoint.
                const rect = target.shape?.boundingRectangle;
                if (rect && position?.current && position.current.y > (rect.top + rect.bottom) / 2) {
                    targetIndex += 1;
                }
            } else {
                // Hovering empty space in the screen (no card underneath): anchor to the existing cards' own
                // span instead of the screen's full height, which can be much taller than its content.
                const cardElements = Array.from(document.querySelectorAll('.screen [data-node-id]'));
                if (cardElements.length === 0 || !position?.current) {
                    targetIndex = withoutPreview.length;
                } else {
                    const firstRect = cardElements[0].getBoundingClientRect();
                    const lastRect = cardElements[cardElements.length - 1].getBoundingClientRect();
                    if (position.current.y <= firstRect.top) {
                        targetIndex = 0;
                    } else if (position.current.y >= lastRect.bottom) {
                        targetIndex = withoutPreview.length;
                    } else {
                        // Between cards but not over any of them: keep the current spot instead of jumping.
                        targetIndex = previewIndex !== -1 ? previewIndex : withoutPreview.length;
                    }
                }
            }

            if (previewIndex !== -1 && targetIndex > previewIndex) targetIndex -= 1;
            targetIndex = Math.max(0, Math.min(targetIndex, withoutPreview.length));

            // Skip the update when the insertion point hasn't actually changed, to avoid jerky re-renders.
            if (targetIndex === previewIndex) return currentItems;

            const preview = cloneSource
                ? { id: PREVIEW_ID, type: cloneSource.type, title: cloneSource.title, cloneConfig: cloneSource.config, isPreview: true }
                : { id: PREVIEW_ID, type: source.data.type, title: source.data.title, isPreview: true };
            const newItems = [...withoutPreview];
            newItems.splice(targetIndex, 0, preview);
            return newItems;
        });
    };

    const handleDragEnd = (event) => {
        if (!activeScreenId) return;

        if (event.canceled) {
            updateActiveScreenItems((currentItems) => currentItems.filter((item) => item.id !== PREVIEW_ID));
            return;
        }

        const { source, position } = event.operation;
        if (!source) return;

        const cloneSource = source.data?.cloneSource;
        if (source.data?.fromPalette || cloneSource) {
            const draggedType = cloneSource ? cloneSource.type : source.data.type;
            const shouldCommit = isPointerInsideScreen(position?.current);
            const isActiveScreenLinked = collectLinkedScreenIds(screens).has(activeScreenId);
            const isTypeAllowed = !isActiveScreenLinked || LINKED_SCREEN_ALLOWED_TYPES.includes(draggedType);
            const screenItems = (screens.find((screen) => screen.id === activeScreenId)?.items ?? [])
                .filter((item) => item.id !== PREVIEW_ID);
            const realItemCount = countNodeSlots(screenItems);
            const hasRoom = realItemCount < MAX_NODES_PER_SCREEN;
            const isOptInAllowed = draggedType !== OPTIN_TYPE || countOptInNodes(screenItems) < MAX_OPTIN_PER_SCREEN;
            if (shouldCommit && !isTypeAllowed) setRestrictedDropMessage(LINKED_SCREEN_RESTRICTION_MESSAGE);
            else if (shouldCommit && !isOptInAllowed) setRestrictedDropMessage(OPTIN_LIMIT_MESSAGE);

            updateActiveScreenItems((currentItems) => (
                shouldCommit && isTypeAllowed && hasRoom && isOptInAllowed
                    ? currentItems.map((item) => (
                        item.id === PREVIEW_ID ? createItemFromPreview(item) : item
                    ))
                    : currentItems.filter((item) => item.id !== PREVIEW_ID)
            ));
            return;
        }

        if (isSortable(source)) {
            if (!isPointerInsideScreen(position?.current)) {
                // Dropped outside the white screen zone: remove the node instead of leaving it in place.
                updateActiveScreenItems((currentItems) => currentItems.filter((item) => item.id !== source.id));
                return;
            }

            const { initialIndex, index } = source;
            if (initialIndex !== index) {
                updateActiveScreenItems((currentItems) => {
                    const newItems = [...currentItems];
                    const [removed] = newItems.splice(initialIndex, 1);
                    newItems.splice(index, 0, removed);
                    return newItems;
                });
            }
        }
    };

    return {
        screens,
        activeScreenId,
        items,
        addScreen,
        removeScreen,
        selectScreen,
        renameScreen,
        setFooterLabel,
        updateItemConfig,
        pruneDisallowedNodes,
        handleDragOver,
        handleDragEnd,
        restrictedDropMessage,
        dismissRestrictedDropMessage,
        importFlowJson,
    };
};


