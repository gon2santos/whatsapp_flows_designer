import '../assets/CSS/Modal.css'

const Modal = ({ title, headerExtra, onClose, children }) => {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(event) => event.stopPropagation()}>
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
