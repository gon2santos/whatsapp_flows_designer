import { useState } from 'react'
import '../assets/CSS/Screens.css'
import Screen from '../components/Screen'
import Modal from '../components/Modal'
import { collectLinkedScreenIds } from '../utils/linkedScreens'
import { resolveFooterTarget } from '../utils/footerTarget'

const LinkIcon = () => (
    <svg className="screen-tab-link-icon" viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
        <path d="M6.188 8.719c.439-.439.926-.801 1.444-1.087 2.887-1.591 6.589-.745 8.445 2.069l-2.246 2.245c-.644-1.469-2.243-2.305-3.834-1.949-.599.134-1.168.433-1.633.898l-4.304 4.306c-1.307 1.307-1.307 3.433 0 4.74 1.307 1.307 3.433 1.307 4.74 0l1.327-1.327c1.207.479 2.501.67 3.779.575l-2.929 2.929c-2.511 2.511-6.582 2.511-9.093 0s-2.511-6.582 0-9.093l4.304-4.306zm6.836-6.836l-2.929 2.929c1.277-.096 2.572.096 3.779.574l1.326-1.326c1.307-1.307 3.433-1.307 4.74 0 1.307 1.307 1.307 3.433 0 4.74l-4.305 4.305c-1.311 1.311-3.44 1.3-4.74 0-.303-.303-.564-.68-.727-1.051l-2.246 2.245c.236.358.481.667.796.982.812.812 1.846 1.417 3.036 1.704 1.542.371 3.194.166 4.613-.617.518-.286 1.005-.648 1.444-1.087l4.304-4.305c2.512-2.511 2.512-6.582.001-9.093-2.511-2.51-6.581-2.51-9.092 0z" />
    </svg>
);

const ScreensContainer = ({ screens, activeScreenId, items, onAddScreen, onRemoveScreen, onMoveScreen, onSelectScreen, onRenameScreen, onFooterLabelChange, onFooterTargetChange, onConfigChange, onPruneLinkedScreen, lockRequired, onToggleLockRequired }) => {
    const [renamingScreenId, setRenamingScreenId] = useState(null);
    const [renameValue, setRenameValue] = useState('');
    const linkedScreenIds = collectLinkedScreenIds(screens);
    const activeScreen = screens.find((screen) => screen.id === activeScreenId) ?? null;
    // Terminal status mirrors buildFlowJson: the screen's resolved footer target (explicit choice, or the
    // implicit next-in-order default) is empty.
    const mainScreens = screens.filter((screen) => !linkedScreenIds.has(screen.id));
    const activeScreenIndex = mainScreens.findIndex((screen) => screen.id === activeScreenId);
    const isActiveScreenTerminal = activeScreen != null && activeScreenIndex !== -1
        && resolveFooterTarget(activeScreen, mainScreens, activeScreenIndex) === undefined;
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
            <div className="screens-tabs-slot">
                <div className="screens-tabs">
                    <div className="screens-tabs-icon" aria-hidden="true">
                        <svg fill="#1fb556" height="25" width="25" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
                            viewBox="0 0 512.001 512.001" xml:space="preserve">
                            <g>
                                <g>
                                    <path d="M512,256.001c0-10.821-6.012-20.551-15.694-25.398l-38.122-19.061l38.122-19.06c0.001-0.001,0.004-0.002,0.004-0.002
			c9.68-4.845,15.692-14.576,15.692-25.397c0-10.819-6.013-20.55-15.694-25.397L281.09,34.08
			c-15.712-7.849-34.47-7.849-50.185,0.001L15.691,141.691C6.013,146.534,0,156.264,0,167.084c0,10.821,6.012,20.551,15.694,25.398
			l38.121,19.06l-38.126,19.063C6.012,235.45,0,245.18,0,256.001s6.012,20.551,15.694,25.397l38.121,19.061l-38.118,19.059
			C6.02,324.353,0.004,334.08,0,344.902c-0.004,10.828,6.008,20.564,15.694,25.412l215.215,107.608
			c7.856,3.925,16.471,5.886,25.09,5.886c8.619,0,17.238-1.963,25.095-5.887l215.215-107.608
			c9.682-4.845,15.695-14.582,15.691-25.41c-0.004-10.822-6.02-20.549-15.694-25.381l-38.122-19.061l38.126-19.063
			C505.988,276.552,512,266.822,512,256.001z M26.225,171.431c-2.339-1.171-2.687-3.226-2.687-4.346s0.35-3.175,2.683-4.343
			L241.429,55.138c4.563-2.28,9.568-3.418,14.573-3.418c5.003,0,10.007,1.139,14.567,3.417L485.776,162.74
			c2.337,1.17,2.687,3.225,2.687,4.345s-0.348,3.175-2.687,4.346L270.572,279.032c-9.125,4.558-20.019,4.558-29.139,0.001
			L26.225,171.431z M485.783,340.575c2.33,1.164,2.679,3.215,2.679,4.336c0.001,1.123-0.348,3.182-2.683,4.35L270.571,456.865
			c-9.125,4.558-20.019,4.559-29.139,0.001L26.225,349.262c-2.339-1.171-2.688-3.229-2.687-4.352c0-1.119,0.348-3.171,2.683-4.337
			l53.912-26.956l150.776,75.387c7.856,3.925,16.471,5.886,25.089,5.886c8.619,0,17.238-1.963,25.095-5.887l150.772-75.386
			L485.783,340.575z M485.778,260.345L270.571,367.949c-9.125,4.558-20.019,4.559-29.139,0.001L26.225,260.347
			c-2.339-1.17-2.687-3.225-2.687-4.345c0-1.122,0.348-3.175,2.683-4.344l53.912-26.956l150.776,75.387
			c7.855,3.925,16.472,5.886,25.089,5.886c8.617,0,17.237-1.962,25.094-5.888l150.774-75.386l53.908,26.954
			c2.339,1.171,2.687,3.225,2.687,4.346C488.462,257.121,488.113,259.176,485.778,260.345z"/>
                                </g>
                            </g>
                        </svg>
                    </div>
                    {screens.map((screen, screenIndex) => (
                        <div key={screen.id} className={`screen-tab ${screen.id === activeScreenId ? 'active' : ''}`}>
                            {screen.id === activeScreenId && (
                                <>
                                    <button
                                        type="button"
                                        className="screen-tab-move"
                                        onClick={() => onMoveScreen(screen.id, -1)}
                                        disabled={screenIndex === 0}
                                        aria-label={`Move ${screen.name} up`}
                                    >
                                        ▲
                                    </button>
                                    <button
                                        type="button"
                                        className="screen-tab-move"
                                        onClick={() => onMoveScreen(screen.id, 1)}
                                        disabled={screenIndex === screens.length - 1}
                                        aria-label={`Move ${screen.name} down`}
                                    >
                                        ▼
                                    </button>
                                </>
                            )}
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
                        mainScreens={mainScreens}
                        activeScreenIndex={activeScreenIndex}
                        footerTarget={activeScreen?.footerTarget}
                        onFooterTargetChange={(target) => onFooterTargetChange(activeScreenId, target)}
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
