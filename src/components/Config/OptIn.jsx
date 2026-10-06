import { useState } from 'react'
import Modal from '../Modal'
import { hasDisallowedNodes } from '../../utils/linkedScreens'

const OptIn = ({ config, onChange, screens = [], activeScreenId, onPruneLinkedScreen }) => {
    const [isPickingScreen, setIsPickingScreen] = useState(false);
    const [pendingScreenId, setPendingScreenId] = useState(null);
    const otherScreens = screens.filter((screen) => screen.id !== activeScreenId);
    const linkedScreen = screens.find((screen) => screen.id === config.linkedScreenId);
    const pendingScreen = screens.find((screen) => screen.id === pendingScreenId);

    const applyLink = (screenId) => {
        onChange({ ...config, linkedScreenId: screenId });
        setIsPickingScreen(false);
    };

    const selectLinkedScreen = (screenId) => {
        const targetScreen = screens.find((screen) => screen.id === screenId);
        if (targetScreen && hasDisallowedNodes(targetScreen)) {
            setPendingScreenId(screenId);
            return;
        }
        applyLink(screenId);
    };

    const confirmPendingLink = () => {
        onPruneLinkedScreen?.(pendingScreenId);
        applyLink(pendingScreenId);
        setPendingScreenId(null);
    };

    const cancelPendingLink = () => setPendingScreenId(null);

    const removeLink = () => onChange({ ...config, linkedScreenId: undefined });

    return (
        <div className="config-panel">
            <label>
                Text
                <textarea
                    rows={3}
                    value={config.label ?? ''}
                    onChange={(event) => onChange({ ...config, label: event.target.value })}
                    placeholder="e.g. I agree to the terms"
                />
            </label>
            <label className="config-checkbox">
                <input
                    type="checkbox"
                    checked={!!config.required}
                    onChange={(event) => onChange({ ...config, required: event.target.checked })}
                />
                Required
            </label>

            {linkedScreen ? (
                <>
                    <p>Enlazado a: <strong>{linkedScreen.name}</strong></p>
                    <button type="button" onClick={removeLink}>Eliminar enlace</button>
                </>
            ) : (
                <>
                    <button type="button" onClick={() => setIsPickingScreen((current) => !current)}>
                        Agregar sección <span style={{ color: 'var(--color-primary)' }}>Leer más</span>
                    </button>
                    {isPickingScreen && (
                        <label>
                            Pantalla
                            <select
                                value=""
                                onChange={(event) => selectLinkedScreen(event.target.value)}
                                disabled={otherScreens.length === 0}
                            >
                                <option value="" disabled>
                                    {otherScreens.length ? 'Selecciona una pantalla' : 'No hay otras pantallas disponibles'}
                                </option>
                                {otherScreens.map((screen) => (
                                    <option key={screen.id} value={screen.id}>{screen.name}</option>
                                ))}
                            </select>
                        </label>
                    )}
                </>
            )}

            {pendingScreen && (
                <Modal title="Pantalla con nodos no permitidos" onClose={cancelPendingLink}>
                    <p>
                        La pantalla <strong>{pendingScreen.name}</strong> tiene nodos que no están permitidos en una
                        sección de Opt In (solo se permiten Text Caption, Text Body, Small Header, Large Header e Image).
                        Si continúas, esos nodos se eliminarán de esa pantalla. ¿Enlazar de todas formas?
                    </p>
                    <div className="modal-actions">
                        <button type="button" className='modal-button' onClick={confirmPendingLink}>Sí</button>
                        <button type="button" className='modal-button' onClick={cancelPendingLink}>No</button>
                    </div>
                </Modal>
            )}
        </div>
    );
}

export default OptIn;
