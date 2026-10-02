import { useEffect, useRef } from 'react';

// Reusable label + editable option list, shared by Dropdown/Radio/MultipleChoice configs.
const OptionsField = ({ config, onChange, addLabel }) => {
    const options = config.options?.length ? config.options : [''];
    const focusIndexRef = useRef(null);
    const inputRefs = useRef([]);

    useEffect(() => {
        if (focusIndexRef.current !== null) {
            inputRefs.current[focusIndexRef.current]?.focus();
            focusIndexRef.current = null;
        }
    }, [options.length]);

    const updateOption = (index, value) => {
        onChange({ ...config, options: options.map((option, i) => (i === index ? value : option)) });
    };

    const addOption = () => onChange({ ...config, options: [...options, ''] });
    const removeOption = (index) => onChange({ ...config, options: options.filter((_, i) => i !== index) });

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            focusIndexRef.current = options.length;
            addOption();
        }
    };

    return (
        <div className="config-panel">
            <label>
                Label
                <input
                    type="text"
                    value={config.label ?? ''}
                    onChange={(event) => onChange({ ...config, label: event.target.value })}
                    placeholder="Question label"
                />
            </label>
            <div className="config-options">
                {options.map((option, index) => (
                    <div className="config-option-row" key={index}>
                        <input
                            type="text"
                            ref={(element) => { inputRefs.current[index] = element; }}
                            value={option}
                            onChange={(event) => updateOption(index, event.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={`Option ${index + 1}`}
                        />
                        <button type="button" onClick={() => removeOption(index)} disabled={options.length === 1}>×</button>
                    </div>
                ))}
            </div>
            <button type="button" onClick={addOption}>{addLabel}</button>
            <label className="config-checkbox">
                <input
                    type="checkbox"
                    checked={!!config.required}
                    onChange={(event) => onChange({ ...config, required: event.target.checked })}
                />
                Required
            </label>
        </div>
    );
}

export default OptionsField;

