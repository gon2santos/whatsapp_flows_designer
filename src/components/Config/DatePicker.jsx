const INSTRUCTIONS_MAX_LENGTH = 80;
const LABEL_MAX_LENGTH = 20;

const DatePicker = ({ config, onChange }) => {
    return (
        <div className="config-panel">
            <label>
                <span className="label-row">
                    Label
                    <span className="field-char-counter">{(config.label ?? '').length}/{LABEL_MAX_LENGTH}</span>
                </span>
                <input
                    type="text"
                    value={config.label ?? ''}
                    maxLength={LABEL_MAX_LENGTH}
                    onChange={(event) => onChange({ ...config, label: event.target.value })}
                    placeholder="e.g. Select a date"
                />
            </label>
            <label>
                Instructions
                <input
                    type="text"
                    value={config.helperText ?? ''}
                    maxLength={INSTRUCTIONS_MAX_LENGTH}
                    onChange={(event) => onChange({ ...config, helperText: event.target.value })}
                    placeholder="e.g. Please enter the requested details"
                />
            </label>
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

export default DatePicker;
