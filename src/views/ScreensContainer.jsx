import '../assets/CSS/Screens.css'
import Screen from '../components/Screen'

const ScreensContainer = ({ screens, activeScreenId, items, onAddScreen, onRemoveScreen, onSelectScreen, onConfigChange }) => {
    return (
        <div className="screens-container">
            <div className="screens-tabs">
                {screens.map((screen) => (
                    <div key={screen.id} className={`screen-tab ${screen.id === activeScreenId ? 'active' : ''}`}>
                        <button type="button" className="screen-tab-label" onClick={() => onSelectScreen(screen.id)}>
                            {screen.name}
                        </button>
                        <button
                            type="button"
                            className="screen-tab-remove"
                            onClick={() => onRemoveScreen(screen.id)}
                            aria-label={`Remove ${screen.name}`}
                        >
                            ×
                        </button>
                    </div>
                ))}
                <button type="button" className="screen-tab-add" onClick={onAddScreen}>+ Screen</button>
            </div>

            {activeScreenId
                ? <Screen items={items} onConfigChange={onConfigChange} />
                : <div className="screens-empty">Agrega una pantalla para comenzar</div>}
        </div>
    )
}

export default ScreensContainer;
