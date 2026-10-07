import { useState } from 'react'
import '../assets/CSS/Screens.css'
import Screen from '../components/Screen'
import Modal from '../components/Modal'
import { collectLinkedScreenIds } from '../utils/linkedScreens'

const LinkIcon = () => (
    <svg className="screen-tab-link-icon" viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
        <path d="M6.188 8.719c.439-.439.926-.801 1.444-1.087 2.887-1.591 6.589-.745 8.445 2.069l-2.246 2.245c-.644-1.469-2.243-2.305-3.834-1.949-.599.134-1.168.433-1.633.898l-4.304 4.306c-1.307 1.307-1.307 3.433 0 4.74 1.307 1.307 3.433 1.307 4.74 0l1.327-1.327c1.207.479 2.501.67 3.779.575l-2.929 2.929c-2.511 2.511-6.582 2.511-9.093 0s-2.511-6.582 0-9.093l4.304-4.306zm6.836-6.836l-2.929 2.929c1.277-.096 2.572.096 3.779.574l1.326-1.326c1.307-1.307 3.433-1.307 4.74 0 1.307 1.307 1.307 3.433 0 4.74l-4.305 4.305c-1.311 1.311-3.44 1.3-4.74 0-.303-.303-.564-.68-.727-1.051l-2.246 2.245c.236.358.481.667.796.982.812.812 1.846 1.417 3.036 1.704 1.542.371 3.194.166 4.613-.617.518-.286 1.005-.648 1.444-1.087l4.304-4.305c2.512-2.511 2.512-6.582.001-9.093-2.511-2.51-6.581-2.51-9.092 0z" />
    </svg>
);

const ScreensContainer = ({ screens, activeScreenId, items, onAddScreen, onRemoveScreen, onSelectScreen, onRenameScreen, onFooterLabelChange, onConfigChange, onPruneLinkedScreen, lockRequired, onToggleLockRequired }) => {
    const [renamingScreenId, setRenamingScreenId] = useState(null);
    const [renameValue, setRenameValue] = useState('');
    const linkedScreenIds = collectLinkedScreenIds(screens);
    const activeScreen = screens.find((screen) => screen.id === activeScreenId) ?? null;
    // Terminal status mirrors buildFlowJson: the last screen among the ones not reachable only via an OptIn link.
    const mainScreens = screens.filter((screen) => !linkedScreenIds.has(screen.id));
    const isActiveScreenTerminal = mainScreens.length > 0 && mainScreens[mainScreens.length - 1].id === activeScreenId;
    const isActiveScreenLinked = linkedScreenIds.has(activeScreenId);

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
                        isTerminal={isActiveScreenTerminal}
                        isLinked={isActiveScreenLinked}
                        footerLabel={activeScreen?.footerLabel}
                        onFooterLabelChange={(label) => onFooterLabelChange(activeScreenId, label)}
                        lockRequired={lockRequired}
                        onToggleLockRequired={onToggleLockRequired}
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
