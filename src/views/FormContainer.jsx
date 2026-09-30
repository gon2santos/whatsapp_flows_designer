import '../assets/CSS/Form.css'
import ScreensContainer from './ScreensContainer'

const FormContainer = ({ screens, activeScreenId, items, onAddScreen, onRemoveScreen, onSelectScreen, onRenameScreen, onConfigChange, onPruneLinkedScreen }) => {
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
                onConfigChange={onConfigChange}
                onPruneLinkedScreen={onPruneLinkedScreen}
            />
        </div>
    )
}

export default FormContainer;