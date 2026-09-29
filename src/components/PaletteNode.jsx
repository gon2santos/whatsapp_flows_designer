import { useDraggable } from '@dnd-kit/react'
import { Feedback } from '@dnd-kit/dom'
import Node from '../views/Node'

// Wraps a palette node so it can be dragged; 'clone' feedback keeps the original in the palette while a visual clone follows the pointer.
const PaletteNode = ({ definition }) => {
    const { ref } = useDraggable({
        id: `palette-${definition.type}`,
        data: { type: definition.type, title: definition.title, fromPalette: true },
        plugins: [Feedback.configure({ feedback: 'clone' })],
    });

    const { Icon } = definition;

    return (
        <Node ref={ref} title={definition.title}>
            <Icon />
        </Node>
    );
}

export default PaletteNode;
