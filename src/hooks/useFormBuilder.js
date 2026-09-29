import { useState } from 'react'
import { isSortable } from '@dnd-kit/react/sortable'

// Placeholder id used to preview where a node dragged from the palette will land.
const PREVIEW_ID = '__palette-preview__';

// The gray drop zone is the actual boundary for keeping/deleting a node, regardless of which collision target is reported.
const isPointerInsideFormContainer = (position) => {
    if (!position) return false;
    const container = document.querySelector('.form-container');
    if (!container) return false;
    const rect = container.getBoundingClientRect();
    return position.x >= rect.left && position.x <= rect.right && position.y >= rect.top && position.y <= rect.bottom;
};

export const useFormBuilder = () => {
    const [items, setItems] = useState([]);

    const handleDragOver = (event) => {
        const { source, target, position } = event.operation;
        if (!source?.data?.fromPalette) return;

        setItems((currentItems) => {
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
                // Hovering the container itself (e.g. the empty gap above the first or below the last card):
                // use the pointer position instead of always appending, so it agrees with the nearest card's own logic.
                const rect = target?.shape?.boundingRectangle;
                if (rect && position?.current) {
                    const midY = (rect.top + rect.bottom) / 2;
                    targetIndex = position.current.y > midY ? withoutPreview.length : 0;
                } else {
                    targetIndex = withoutPreview.length;
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
        if (event.canceled) {
            setItems((currentItems) => currentItems.filter((item) => item.id !== PREVIEW_ID));
            return;
        }

        const { source, position } = event.operation;
        if (!source) return;

        if (source.data?.fromPalette) {
            const shouldCommit = isPointerInsideFormContainer(position?.current);
            setItems((currentItems) => (
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
            if (!isPointerInsideFormContainer(position?.current)) {
                // Dropped outside the gray form zone: remove the node instead of leaving it in place.
                setItems((currentItems) => currentItems.filter((item) => item.id !== source.id));
                return;
            }

            const { initialIndex, index } = source;
            if (initialIndex !== index) {
                setItems((currentItems) => {
                    const newItems = [...currentItems];
                    const [removed] = newItems.splice(initialIndex, 1);
                    newItems.splice(index, 0, removed);
                    return newItems;
                });
            }
        }
    };

    return { items, handleDragOver, handleDragEnd };
};

