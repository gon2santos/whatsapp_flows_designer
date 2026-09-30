import { useState } from 'react'
import '../assets/CSS/Screens.css'
import Screen from '../components/Screen'
import Modal from '../components/Modal'
import { collectLinkedScreenIds } from '../utils/linkedScreens'

const LinkIcon = () => (
    <svg className="screen-tab-link-icon" viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
        <path
            fill="currentColor"
            d="M3.9 12a5 5 0 0 1 5-5h3v2h-3a3 3 0 0 0 0 6h3v2h-3a5 5 0 0 1-5-5Zm7-1h6v2h-6v-2Zm3.1-4h3a5 5 0 0 1 0 10h-3v-2h3a3 3 0 0 0 0-6h-3V7Z"
        />
    </svg>
);

const ScreensContainer = ({ screens, activeScreenId, items, onAddScreen, onRemoveScreen, onSelectScreen, onRenameScreen, onConfigChange, onPruneLinkedScreen }) => {
    const [renamingScreenId, setRenamingScreenId] = useState(null);
    const [renameValue, setRenameValue] = useState('');
    const linkedScreenIds = collectLinkedScreenIds(screens);

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
                            {linkedScreenIds.has(screen.id) && <LinkIcon />}
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
                ? (
                    <Screen
                        items={items}
                        onConfigChange={onConfigChange}
                        screens={screens}
                        activeScreenId={activeScreenId}
                        onPruneLinkedScreen={onPruneLinkedScreen}
                    />
                )
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
