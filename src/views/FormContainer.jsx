import '../assets/CSS/Form.css'
import ScreensContainer from './ScreensContainer'

const FormContainer = ({ screens, activeScreenId, items, onAddScreen, onRemoveScreen, onSelectScreen, onRenameScreen, onFooterLabelChange, onFooterTargetChange, onConfigChange, onPruneLinkedScreen, lockRequired, onToggleLockRequired }) => {
    return (
        <div className="form-container">
            <ScreensContainer
                screens={screens}
                activeScreenId={activeScreenId}
                items={items}
                onAddScreen={onAddScreen}
                onRemoveScreen={onRemoveScreen}
                onSelectScreen={onSelectScreen}
                onRenameScreen={onRenameScreen}
                onFooterLabelChange={onFooterLabelChange}
                onFooterTargetChange={onFooterTargetChange}
                onConfigChange={onConfigChange}
                onPruneLinkedScreen={onPruneLinkedScreen}
                lockRequired={lockRequired}
                onToggleLockRequired={onToggleLockRequired}
            />
        </div>
    )
}

export default FormContainer;