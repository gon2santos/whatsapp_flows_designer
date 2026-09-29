import { useState } from 'react'

const DatePicker = () => {
    const [label, setLabel] = useState('');
    const [required, setRequired] = useState(false);

    return (
        <div className="config-panel">
            <label>
                Label
                <input type="text" value={label} onChange={(event) => setLabel(event.target.value)} placeholder="e.g. Select a date" />
            </label>
            <label className="config-checkbox">
                <input type="checkbox" checked={required} onChange={(event) => setRequired(event.target.checked)} />
                Required
            </label>
        </div>
    );
}

export default DatePicker;
