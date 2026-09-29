import '../assets/CSS/Form.css'
import { useDroppable } from '@dnd-kit/react'
import { CollisionPriority } from '@dnd-kit/abstract'
import FormItem from './FormItem'
import FormItemPreview from './FormItemPreview'

const FormContainer = ({ items }) => {
    // Lower priority than the cards, so a card always wins collisions where it overlaps with the container.
    const { ref } = useDroppable({ id: 'form-container', collisionPriority: CollisionPriority.Low });

    return (
        <div className="form-container" ref={ref}>
            {items.map((item, index) => (
                item.isPreview
                    ? <FormItemPreview key={item.id} type={item.type} title={item.title} />
                    : <FormItem key={item.id} id={item.id} index={index} type={item.type} title={item.title} />
            ))}
        </div>
    )
}

export default FormContainer;