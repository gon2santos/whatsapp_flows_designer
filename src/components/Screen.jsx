import '../assets/CSS/Screen.css'
import { useDroppable } from '@dnd-kit/react'
import FormItem from '../views/FormItem'
import FormItemPreview from '../views/FormItemPreview'

const Screen = ({ items, onConfigChange, screens, activeScreenId, onPruneLinkedScreen }) => {
    const { ref } = useDroppable({ id: 'screen-drop-zone' });

    return (
        <div className="screen" ref={ref}>
            {items.map((item, index) => (
                item.isPreview
                    ? <FormItemPreview key={item.id} type={item.type} title={item.title} />
                    : (
                        <FormItem
                            key={item.id}
                            id={item.id}
                            index={index}
                            type={item.type}
                            title={item.title}
                            config={item.config}
                            onConfigChange={onConfigChange}
                            screens={screens}
                            activeScreenId={activeScreenId}
                            onPruneLinkedScreen={onPruneLinkedScreen}
                        />
                    )
            ))}
        </div>
    )
}

export default Screen;
