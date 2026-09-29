import { useState } from 'react'
import { useSortable } from '@dnd-kit/react/sortable'
import { closestCenter } from '@dnd-kit/collision'
import Node from './Node'
import Modal from '../components/Modal'
import nodeDefinitions from '../data/nodeDefinitions'

// A node placed inside the form; sortable within the 'form' group so it can be reordered.
// closestCenter avoids the tiny/erratic hit zones of pure shape-overlap detection.
const FormItem = ({ id, index, type, title }) => {
    const { ref } = useSortable({ id, index, group: 'form', collisionDetector: closestCenter });
    const [isConfigOpen, setIsConfigOpen] = useState(false);

    const definition = nodeDefinitions.find((item) => item.type === type);
    const ConfigPanel = definition?.ConfigComponent;

    return (
        <>
            <Node ref={ref} title={title} onDoubleClick={() => setIsConfigOpen(true)}>
                {definition && <definition.Icon />}
            </Node>
            {isConfigOpen && (
                <Modal title={title} onClose={() => setIsConfigOpen(false)}>
                    {ConfigPanel && <ConfigPanel />}
                </Modal>
            )}
        </>
    );
}

export default FormItem;
