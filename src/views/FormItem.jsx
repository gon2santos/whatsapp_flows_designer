import { useSortable } from '@dnd-kit/react/sortable'
import { closestCenter } from '@dnd-kit/collision'
import Node from './Node'
import nodeDefinitions from '../data/nodeDefinitions'

// A node placed inside the form; sortable within the 'form' group so it can be reordered.
// closestCenter avoids the tiny/erratic hit zones of pure shape-overlap detection.
const FormItem = ({ id, index, type, title }) => {
    const { ref } = useSortable({ id, index, group: 'form', collisionDetector: closestCenter });

    const definition = nodeDefinitions.find((item) => item.type === type);

    return (
        <Node ref={ref} title={title}>
            {definition && <definition.Icon />}
        </Node>
    );
}

export default FormItem;
