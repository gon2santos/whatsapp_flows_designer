import { useRef } from 'react'
import '../assets/CSS/Modal.css'

const Modal = ({ title, headerExtra, onClose, children }) => {
    // Dragging (e.g. resizing a textarea) out of the modal ends with a click on the overlay; ignore it.
    const pressStartedOnOverlay = useRef(false);

    return (
        <div
            className="modal-overlay"
            onMouseDown={(event) => { pressStartedOnOverlay.current = event.target === event.currentTarget; }}
            onClick={(event) => { if (pressStartedOnOverlay.current && event.target === event.currentTarget) onClose(); }}
        >
            <div className="modal-content">
                <div className="modal-header">
                    <div className="modal-title">
                        <h2>{title}</h2>
                        {headerExtra}
                    </div>
                    <button type="button" className="modal-close" onClick={onClose} aria-label="Close">×</button>
                </div>
                <div className="modal-body">{children}</div>
            </div>
        </div>
    );
}

export default Modal;
