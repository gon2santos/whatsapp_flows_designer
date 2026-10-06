import { useEffect, useMemo, useState } from 'react'
import Editor from '@monaco-editor/react'
import '../assets/CSS/JsonPreview.css'
import { buildFlowJson } from '../utils/buildFlowJson'
import { parseFlowJson } from '../utils/parseFlowJson'
import Modal from '../components/Modal'
import copyIcon from '../assets/UIIcons/copy.png'
import downloadIcon from '../assets/UIIcons/direct-download.png'
import applyIcon from '../assets/UIIcons/upload.png'

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

    const handleDownload = () => {
        const blob = new Blob([draft], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'flow.json';
        link.click();
        URL.revokeObjectURL(url);
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
                <button type="button" className="json-icon-button json-icon-button--copy" onClick={handleCopy}>
                    <img src={copyIcon} alt="" />
                    <span>{copied ? 'Copiado!' : 'Copiar JSON'}</span>
                </button>
                <button type="button" className="json-icon-button json-icon-button--download" onClick={handleDownload}>
                    <img src={downloadIcon} alt="" />
                    <span>Descargar JSON</span>
                </button>
                <button type="button" className="json-icon-button json-icon-button--apply" onClick={handleApply} disabled={!isDirty}>
                    <img src={applyIcon} alt="" />
                    <span>Aplicar JSON</span>
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
