import { useState } from 'react'
import Modal from '../components/Modal'

// Fake preview of the WhatsApp Flow "Footer" component; its label mirrors the real Footer node's JSON label.
const FooterButton = ({ label, isTerminal, onLabelChange }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [draftLabel, setDraftLabel] = useState('');
    const displayLabel = label || (isTerminal ? 'Finalizar' : 'Continuar');

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
                </Modal>
            )}
        </>
    );
}

export default FooterButton;
