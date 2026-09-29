import { useState } from 'react'
import '../assets/CSS/Screens.css'
import Screen from '../components/Screen'
import Modal from '../components/Modal'

const ScreensContainer = ({ screens, activeScreenId, items, onAddScreen, onRemoveScreen, onSelectScreen, onRenameScreen, onConfigChange }) => {
    const [renamingScreenId, setRenamingScreenId] = useState(null);
    const [renameValue, setRenameValue] = useState('');

    const startRenaming = (screen) => {
        setRenamingScreenId(screen.id);
        setRenameValue(screen.name);
    };

    const confirmRename = (event) => {
        event.preventDefault();
        if (renameValue.trim()) onRenameScreen(renamingScreenId, renameValue.trim());
        setRenamingScreenId(null);
    };

    return (
        <div className="screens-container">
            <div className="screens-tabs">
                {screens.map((screen) => (
                    <div key={screen.id} className={`screen-tab ${screen.id === activeScreenId ? 'active' : ''}`}>
                        <button
                            type="button"
                            className="screen-tab-label"
                            onClick={() => onSelectScreen(screen.id)}
                            onDoubleClick={() => startRenaming(screen)}
                        >
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

            {renamingScreenId && (
                <Modal title="Rename Screen" onClose={() => setRenamingScreenId(null)}>
                    <form className="config-panel" onSubmit={confirmRename}>
                        <label>
                            Name
                            <input
                                type="text"
                                value={renameValue}
                                onChange={(event) => setRenameValue(event.target.value)}
                                autoFocus
                            />
                        </label>
                        <button type="submit">Save</button>
                    </form>
                </Modal>
            )}
        </div>
    )
}

export default ScreensContainer;
