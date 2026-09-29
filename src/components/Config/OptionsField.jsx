import { useState } from 'react'

// Reusable label + editable option list, shared by Dropdown/Radio/MultipleChoice configs.
const OptionsField = ({ addLabel }) => {
    const [label, setLabel] = useState('');
    const [options, setOptions] = useState(['']);

    const updateOption = (index, value) => {
        setOptions((current) => current.map((option, i) => (i === index ? value : option)));
    };

    const addOption = () => setOptions((current) => [...current, '']);
    const removeOption = (index) => setOptions((current) => current.filter((_, i) => i !== index));

    return (
        <div className="config-panel">
            <label>
                Label
                <input type="text" value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Question label" />
            </label>
            <div className="config-options">
                {options.map((option, index) => (
                    <div className="config-option-row" key={index}>
                        <input
                            type="text"
                            value={option}
                            onChange={(event) => updateOption(index, event.target.value)}
                            placeholder={`Option ${index + 1}`}
                        />
                        <button type="button" onClick={() => removeOption(index)} disabled={options.length === 1}>×</button>
                    </div>
                ))}
            </div>
            <button type="button" onClick={addOption}>{addLabel}</button>
        </div>
    );
}

export default OptionsField;
