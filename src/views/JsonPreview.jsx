import { useEffect, useMemo, useState } from 'react'
import Editor from '@monaco-editor/react'
import '../assets/CSS/JsonPreview.css'
import { buildFlowJson } from '../utils/buildFlowJson'
import { parseFlowJson } from '../utils/parseFlowJson'
import Modal from '../components/Modal'

// Live JSON output for the whole flow, rebuilt from the current screens/items/config state.
// Monaco (the VS Code editor) gives us formatting, syntax highlighting and error markers for free.
// The editor also doubles as an importer: pasting a WhatsApp Flow JSON and applying it rebuilds the
// screens/nodes from scratch, following the same rules used to generate this output.
const JsonPreview = ({ screens, onImport }) => {
    const json = useMemo(() => JSON.stringify(buildFlowJson(screens), null, 2), [screens]);
    const [draft, setDraft] = useState(json);
    const [isDirty, setIsDirty] = useState(false);
    const [error, setError] = useState('');
    const [pendingScreens, setPendingScreens] = useState(null);
    const [copied, setCopied] = useState(false);

    // Keeps the editor mirroring the live flow until the user starts typing their own JSON to apply.
    useEffect(() => {
        if (!isDirty) setDraft(json);
    }, [json, isDirty]);

    const handleCopy = () => {
        navigator.clipboard.writeText(draft);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const handleChange = (value) => {
        setDraft(value ?? '');
        setIsDirty(true);
        setError('');
    };

    const handleApply = () => {
        let parsedJson;
        try {
            parsedJson = JSON.parse(draft);
        } catch {
            setError('JSON inválido: revisa la sintaxis.');
            return;
        }
        try {
            setPendingScreens(parseFlowJson(parsedJson));
            setError('');
        } catch (parseError) {
            setError(parseError.message);
        }
    };

    const confirmApply = () => {
        onImport?.(pendingScreens);
        setPendingScreens(null);
        setIsDirty(false);
    };

    const cancelApply = () => setPendingScreens(null);

    return (
        <div className="json-preview">
            <Editor
                height="100%"
                width="100%"
                language="json"
                theme="vs"
                value={draft}
                onChange={handleChange}
                options={{
                    minimap: { enabled: false },
                    fontSize: 12,
                    scrollBeyondLastLine: false,
                    wordWrap: 'on',
                }}
            />
            {error && <p className="json-preview-error">{error}</p>}
            <div className="json-preview-actions">
                <button type="button" className="json-copy-button" onClick={handleCopy}>
                    {copied ? 'Copiado!' : 'Copiar JSON'}
                </button>
                <button type="button" className="json-apply-button" onClick={handleApply} disabled={!isDirty}>
                    Aplicar JSON
                </button>
            </div>
            {pendingScreens && (
                <Modal title="Reemplazar diseño actual" onClose={cancelApply}>
                    <p>Esto reemplazará todas las pantallas y nodos actuales por el contenido del JSON pegado. ¿Deseas continuar?</p>
                    <button type="button" onClick={confirmApply}>Sí, reemplazar</button>
                    <button type="button" onClick={cancelApply}>Cancelar</button>
                </Modal>
            )}
        </div>
    )
}

export default JsonPreview;
