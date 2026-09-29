import { useMemo, useState } from 'react'
import Editor from '@monaco-editor/react'
import '../assets/CSS/JsonPreview.css'
import { buildFlowJson } from '../utils/buildFlowJson'

// Live JSON output for the whole flow, rebuilt from the current screens/items/config state.
// Monaco (the VS Code editor) gives us formatting, syntax highlighting and error markers for free.
const JsonPreview = ({ screens }) => {
    const json = useMemo(() => JSON.stringify(buildFlowJson(screens), null, 2), [screens]);
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(json);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <div className="json-preview">
            <Editor
                height="100%"
                width="100%"
                language="json"
                theme="vs"
                value={json}
                options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    fontSize: 12,
                    scrollBeyondLastLine: false,
                    wordWrap: 'on',
                }}
            />
            <button type="button" className="json-copy-button" onClick={handleCopy}>
                {copied ? 'Copiado!' : 'Copiar JSON'}
            </button>
        </div>
    )
}

export default JsonPreview;
