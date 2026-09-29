import { useState } from 'react'

const OptIn = () => {
    const [text, setText] = useState('');
    const [required, setRequired] = useState(false);

    return (
        <div className="config-panel">
            <label>
                Text
                <input type="text" value={text} onChange={(event) => setText(event.target.value)} placeholder="e.g. I agree to the terms" />
            </label>
            <label className="config-checkbox">
                <input type="checkbox" checked={required} onChange={(event) => setRequired(event.target.checked)} />
                Required
            </label>
        </div>
    );
}

export default OptIn;
