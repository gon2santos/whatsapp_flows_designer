import '../assets/CSS/Screen.css'
import { useDroppable } from '@dnd-kit/react'
import FormItem from '../views/FormItem'
import FormItemPreview from '../views/FormItemPreview'
import FooterButton from '../views/FooterButton'
import { MAX_NODES_PER_SCREEN, countNodeSlots } from '../hooks/useFormBuilder'

const Screen = ({ items, onConfigChange, screens, activeScreenId, onPruneLinkedScreen, isTerminal, isLinked, footerLabel, onFooterLabelChange, mainScreens, activeScreenIndex, footerTarget, onFooterTargetChange, lockRequired, onToggleLockRequired }) => {
    const { ref } = useDroppable({ id: 'screen-drop-zone' });
    const nodeCount = countNodeSlots(items.filter((item) => !item.isPreview));
    const isAtLimit = nodeCount >= MAX_NODES_PER_SCREEN;

    return (
        <div className="screen" ref={ref}>
            <div className="screen-toolbar">
                <label className="screen-lock-required">
                    <input
                        type="checkbox"
                        checked={lockRequired}
                        onChange={onToggleLockRequired}
                    />
                    Lock required
                </label>
                <div className={`screen-node-counter${isAtLimit ? ' screen-node-counter--limit' : ''}`}>
                    {nodeCount}/{MAX_NODES_PER_SCREEN}
                </div>
            </div>
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
                            name={item.name}
                            config={item.config}
                            onConfigChange={onConfigChange}
                            screens={screens}
                            activeScreenId={activeScreenId}
                            onPruneLinkedScreen={onPruneLinkedScreen}
                        />
                    )
            ))}
            {!isLinked && (
                <FooterButton
                    label={footerLabel}
                    isTerminal={isTerminal}
                    onLabelChange={onFooterLabelChange}
                    mainScreens={mainScreens}
                    activeScreenId={activeScreenId}
                    activeScreenIndex={activeScreenIndex}
                    footerTarget={footerTarget}
                    onFooterTargetChange={onFooterTargetChange}
                />
            )}
        </div>
    )
}

export default Screen;
