import { useState } from 'react'
import { useDraggable } from '@dnd-kit/react'
import { useSortable } from '@dnd-kit/react/sortable'
import { Feedback } from '@dnd-kit/dom'
import { closestCenter } from '@dnd-kit/collision'
import Node from './Node'
import FormItemDetails from './FormItemDetails'
import Modal from '../components/Modal'
import VisibilityConditions from '../components/Config/VisibilityConditions'
import nodeDefinitions from '../data/nodeDefinitions'
import { collectVisibilitySources } from '../utils/visibilitySources'
import { effectiveFieldName, hasDuplicateFieldName } from '../utils/fieldNames'
import { useAltKeyHeld } from '../hooks/useAltKeyHeld'

// Strips anything but letters/digits/underscores, turning spaces into underscores to keep the "id" field usable as a WhatsApp Flow key.
const sanitizeId = (value) => value.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');

// These node types have no "name" in WhatsApp Flow's JSON, so the Id field is irrelevant for them.
const TYPES_WITHOUT_ID = ['text-caption', 'text-body', 'text-small-heading', 'text-large-heading', 'image'];

// A node placed inside the form; sortable within the 'form' group so it can be reordered.
// closestCenter avoids the tiny/erratic hit zones of pure shape-overlap detection.
const FormItem = ({ id, index, type, title, name, config, onConfigChange, screens, activeScreenId, onPruneLinkedScreen }) => {
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const isAltHeld = useAltKeyHeld();
    const currentConfig = config ?? {};
    const isDuplicateId = hasDuplicateFieldName(screens, id, effectiveFieldName({ id, name, config: currentConfig }));

    // Normal reordering is disabled while Alt is held; a parallel clone-feedback draggable takes over instead,
    // leaving the original node untouched and dragging a copy (same data, fresh id/name) to wherever it's dropped.
    const { ref: sortableRef, isDragging: isSortDragging } = useSortable({ id, index, group: 'form', collisionDetector: closestCenter, disabled: isAltHeld });
    const { ref: cloneRef, isDragging: isCloneDragging } = useDraggable({
        id: `clone-${id}`,
        data: { cloneSource: { type, title, config: currentConfig } },
        disabled: !isAltHeld,
        plugins: [Feedback.configure({ feedback: 'clone', dropAnimation: null })],
    });
    const setRefs = (element) => { sortableRef(element); cloneRef(element); };

    const definition = nodeDefinitions.find((item) => item.type === type);
    const ConfigPanel = definition?.ConfigComponent;
    const visibilitySources = collectVisibilitySources(screens, activeScreenId, index);
    // Cosmetic: the card shows the node's id (first 20 chars); types without an id show their text, falling back to the type name.
    const cardLabel = TYPES_WITHOUT_ID.includes(type)
        ? (currentConfig.text || currentConfig.label || '')
        : effectiveFieldName({ id, name, config: currentConfig });
    const displayTitle = (cardLabel || '').slice(0, 20) || title;

    // Stays expanded for the whole drag so the preview travels with the node.
    const isExpanded = (isHovered || isSortDragging || isCloneDragging) && !isConfigOpen;

    return (
        <>
            <Node
                ref={setRefs}
                title={displayTitle}
                data-node-id={id}
                details={isExpanded ? <FormItemDetails config={currentConfig} /> : null}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onDoubleClick={() => setIsConfigOpen(true)}
            >
                {definition && <definition.Icon />}
            </Node>
            {isConfigOpen && (
                <Modal
                    title={title}
                    onClose={() => setIsConfigOpen(false)}
                    headerExtra={definition && 'required' in definition.defaultConfig && (
                        <label className="config-checkbox">
                            <input
                                type="checkbox"
                                checked={!!currentConfig.required}
                                onChange={(event) => onConfigChange(id, { ...currentConfig, required: event.target.checked })}
                            />
                            Required
                        </label>
                    )}
                >
                    {!TYPES_WITHOUT_ID.includes(type) && (
                        <div className="config-panel">
                            <label>
                                Id
                                <input
                                    type="text"
                                    value={currentConfig.id ?? ''}
                                    onChange={(event) => onConfigChange(id, { ...currentConfig, id: sanitizeId(event.target.value) })}
                                    placeholder=""
                                />
                            </label>
                            {isDuplicateId && <p className="config-field-error">Este Id ya está en uso por otro nodo. Debes elegir uno diferente.</p>}
                        </div>
                    )}
                    {ConfigPanel && (
                        <ConfigPanel
                            config={currentConfig}
                            onChange={(newConfig) => onConfigChange(id, newConfig)}
                            screens={screens}
                            activeScreenId={activeScreenId}
                            onPruneLinkedScreen={onPruneLinkedScreen}
                        />
                    )}
                    {visibilitySources.length > 0 && type !== 'nav-menu' && (
                        <VisibilityConditions
                            config={currentConfig}
                            onChange={(newConfig) => onConfigChange(id, newConfig)}
                            sources={visibilitySources}
                        />
                    )}
                </Modal>
            )}
        </>
    );
}

export default FormItem;
