// Reusable label + editable option list, shared by Dropdown/Radio/MultipleChoice configs.
const OptionsField = ({ config, onChange, addLabel }) => {
    const options = config.options?.length ? config.options : [''];

    const updateOption = (index, value) => {
        onChange({ ...config, options: options.map((option, i) => (i === index ? value : option)) });
    };

    const addOption = () => onChange({ ...config, options: [...options, ''] });
    const removeOption = (index) => onChange({ ...config, options: options.filter((_, i) => i !== index) });

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
                            value={option}
                            onChange={(event) => updateOption(index, event.target.value)}
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
