import { useState } from 'react'
import { useSortable } from '@dnd-kit/react/sortable'
import { closestCenter } from '@dnd-kit/collision'
import Node from './Node'
import Modal from '../components/Modal'
import VisibilityConditions from '../components/Config/VisibilityConditions'
import nodeDefinitions from '../data/nodeDefinitions'
import { collectVisibilitySources } from '../utils/visibilitySources'

// Strips anything but letters/digits/underscores, turning spaces into underscores to keep the "id" field usable as a WhatsApp Flow key.
const sanitizeId = (value) => value.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');

// These node types have no "name" in WhatsApp Flow's JSON, so the Id field is irrelevant for them.
const TYPES_WITHOUT_ID = ['text-caption', 'text-body', 'text-small-heading', 'text-large-heading', 'image'];

// A node placed inside the form; sortable within the 'form' group so it can be reordered.
// closestCenter avoids the tiny/erratic hit zones of pure shape-overlap detection.
const FormItem = ({ id, index, type, title, config, onConfigChange, screens, activeScreenId, onPruneLinkedScreen }) => {
    const { ref } = useSortable({ id, index, group: 'form', collisionDetector: closestCenter });
    const [isConfigOpen, setIsConfigOpen] = useState(false);

    const definition = nodeDefinitions.find((item) => item.type === type);
    const ConfigPanel = definition?.ConfigComponent;
    const currentConfig = config ?? {};
    const visibilitySources = collectVisibilitySources(screens, activeScreenId, index);

    return (
        <>
            <Node ref={ref} title={title} data-node-id={id} onDoubleClick={() => setIsConfigOpen(true)}>
                {definition && <definition.Icon />}
            </Node>
            {isConfigOpen && (
                <Modal title={title} onClose={() => setIsConfigOpen(false)}>
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
                    {visibilitySources.length > 0 && (
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
