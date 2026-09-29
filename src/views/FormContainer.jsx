import '../assets/CSS/Form.css'
import ScreensContainer from './ScreensContainer'

const FormContainer = ({ screens, activeScreenId, items, onAddScreen, onRemoveScreen, onSelectScreen }) => {
    return (
        <div className="form-container">
            <ScreensContainer
                screens={screens}
                activeScreenId={activeScreenId}
                items={items}
                onAddScreen={onAddScreen}
                onRemoveScreen={onRemoveScreen}
                onSelectScreen={onSelectScreen}
            />
        </div>
    )
}

export default FormContainer;