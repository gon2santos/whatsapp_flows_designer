import { useState } from 'react'

const ParagraphAnswer = () => {
    const [label, setLabel] = useState('');
    const [required, setRequired] = useState(false);

    return (
        <div className="config-panel">
            <label>
                Label
                <textarea rows={3} value={label} onChange={(event) => setLabel(event.target.value)} placeholder="e.g. Tell us more..." />
            </label>
            <label className="config-checkbox">
                <input type="checkbox" checked={required} onChange={(event) => setRequired(event.target.checked)} />
                Required
            </label>
        </div>
    );
}

export default ParagraphAnswer;
