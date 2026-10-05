import { handleMarkdownShortcut } from '../../utils/markdownShortcuts'

const INPUT_TYPE_OPTIONS = [
    { value: 'text', label: 'Text' },
    { value: 'password', label: 'Password' },
    { value: 'email', label: 'Email' },
    { value: 'number', label: 'Number' },
    { value: 'passcode', label: 'Passcode' },
    { value: 'phone', label: 'Phone' },
];

const INSTRUCTIONS_MAX_LENGTH = 80;
const LABEL_MAX_LENGTH = 20;

const ShortAnswer = ({ config, onChange }) => {
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
                    placeholder="e.g. What's your name?"
                />
            </label>
            <label>
                Top text: <span className="label-optional">(optional)</span>
                <textarea
                    rows={3}
                    value={config.topText ?? ''}
                    onChange={(event) => onChange({ ...config, topText: event.target.value })}
                    onKeyDown={(event) => handleMarkdownShortcut(event, config.topText ?? '', (topText) => onChange({ ...config, topText }))}
                    placeholder="Text shown above this field"
                />
            </label>
            <label>
                Type
                <select
                    value={config.inputType ?? 'text'}
                    onChange={(event) => onChange({ ...config, inputType: event.target.value })}
                >
                    {INPUT_TYPE_OPTIONS.map(({ value, label }) => (
                        <option key={value} value={value}>{label}</option>
                    ))}
                </select>
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

export default ShortAnswer;
