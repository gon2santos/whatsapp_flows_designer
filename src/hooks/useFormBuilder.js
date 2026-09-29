import { useState } from 'react'
import { isSortable } from '@dnd-kit/react/sortable'

// Placeholder id used to preview where a node dragged from the palette will land.
const PREVIEW_ID = '__palette-preview__';

// The white screen area is the actual boundary for keeping/deleting a node, regardless of which collision target is reported.
const isPointerInsideScreen = (position) => {
    if (!position) return false;
    const screen = document.querySelector('.screen');
    if (!screen) return false;
    const rect = screen.getBoundingClientRect();
    return position.x >= rect.left && position.x <= rect.right && position.y >= rect.top && position.y <= rect.bottom;
};

const createScreen = (name) => ({ id: crypto.randomUUID(), name, items: [] });

export const useFormBuilder = () => {
    const [screens, setScreens] = useState([]);
    const [activeScreenId, setActiveScreenId] = useState(null);

    const activeScreen = screens.find((screen) => screen.id === activeScreenId) ?? null;
    const items = activeScreen?.items ?? [];

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

    const handleDragOver = (event) => {
        if (!activeScreenId) return;

        const { source, target, position } = event.operation;
        if (!source?.data?.fromPalette) return;

        updateActiveScreenItems((currentItems) => {
            const previewIndex = currentItems.findIndex((item) => item.id === PREVIEW_ID);
            const withoutPreview = currentItems.filter((item) => item.id !== PREVIEW_ID);

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

            const preview = { id: PREVIEW_ID, type: source.data.type, title: source.data.title, isPreview: true };
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

        if (source.data?.fromPalette) {
            const shouldCommit = isPointerInsideScreen(position?.current);
            updateActiveScreenItems((currentItems) => (
                shouldCommit
                    ? currentItems.map((item) => (
                        item.id === PREVIEW_ID
                            ? { id: crypto.randomUUID(), type: item.type, title: item.title }
                            : item
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
        handleDragOver,
        handleDragEnd,
    };
};


