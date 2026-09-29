import Editor from '@monaco-editor/react'
import '../assets/CSS/JsonPreview.css'
import { buildFlowJson } from '../utils/buildFlowJson'

// Live JSON output for the whole flow, rebuilt from the current screens/items/config state.
// Monaco (the VS Code editor) gives us formatting, syntax highlighting and error markers for free.
const JsonPreview = ({ screens }) => {
    return (
        <div className="json-preview">
            <Editor
                height="100%"
                width="100%"
                language="json"
                theme="vs"
                value={JSON.stringify(buildFlowJson(screens), null, 2)}
                options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    fontSize: 12,
                    scrollBeyondLastLine: false,
                    wordWrap: 'on',
                }}
            />
        </div>
    )
}

export default JsonPreview;
