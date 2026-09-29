import '../assets/CSS/Form.css'
import ScreensContainer from './ScreensContainer'

const FormContainer = ({ screens, activeScreenId, items, onAddScreen, onRemoveScreen, onSelectScreen, onRenameScreen, onConfigChange }) => {
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
            />
        </div>
    )
}

export default FormContainer;