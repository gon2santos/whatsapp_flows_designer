import { useState } from 'react'
import Modal from '../components/Modal'
import { COMPLETE_TARGET, resolveFooterTarget } from '../utils/footerTarget'

// Fake preview of the WhatsApp Flow "Footer" component; its label mirrors the real Footer node's JSON label.
const FooterButton = ({ label, isTerminal, onLabelChange, mainScreens = [], activeScreenId, activeScreenIndex, footerTarget, onFooterTargetChange }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [draftLabel, setDraftLabel] = useState('');
    const displayLabel = label || (isTerminal ? 'Finalizar' : 'Continuar');
    const otherScreens = mainScreens.filter((screen) => screen.id !== activeScreenId);
    const resolvedTarget = resolveFooterTarget({ footerTarget }, mainScreens, activeScreenIndex) ?? COMPLETE_TARGET;

    const startEditing = () => {
        setDraftLabel(displayLabel);
        setIsEditing(true);
    };

    const confirmEdit = (event) => {
        event.preventDefault();
        onLabelChange(draftLabel.trim());
        setIsEditing(false);
    };

    return (
        <>
            <button type="button" className="screen-footer-button" onDoubleClick={startEditing}>
                {displayLabel}
            </button>
            {isEditing && (
                <Modal title="Footer" onClose={() => setIsEditing(false)}>
                    <form className="config-panel" onSubmit={confirmEdit}>
                        <label>
                            Label
                            <input
                                type="text"
                                value={draftLabel}
                                onChange={(event) => setDraftLabel(event.target.value)}
                                autoFocus
                            />
                        </label>
                        <button type="submit">Save</button>
                    </form>
                    <div className="config-panel config-jump-panel">
                        <h3 className="config-section-title">Navigate to</h3>
                        <label>
                            Pantalla
                            <select
                                value={resolvedTarget}
                                onChange={(event) => onFooterTargetChange(event.target.value)}
                            >
                                <option value={COMPLETE_TARGET}>Finalizar</option>
                                {otherScreens.map((screen) => (
                                    <option key={screen.id} value={screen.id}>{screen.name}</option>
                                ))}
                            </select>
                        </label>
                    </div>
                </Modal>
            )}
        </>
    );
}

export default FooterButton;

