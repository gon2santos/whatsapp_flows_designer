import '../assets/CSS/Screen.css'
import { useDroppable } from '@dnd-kit/react'
import FormItem from '../views/FormItem'
import FormItemPreview from '../views/FormItemPreview'

const Screen = ({ items }) => {
    const { ref } = useDroppable({ id: 'screen-drop-zone' });

    return (
        <div className="screen" ref={ref}>
            {items.map((item, index) => (
                item.isPreview
                    ? <FormItemPreview key={item.id} type={item.type} title={item.title} />
                    : <FormItem key={item.id} id={item.id} index={index} type={item.type} title={item.title} />
            ))}
        </div>
    )
}

export default Screen;
