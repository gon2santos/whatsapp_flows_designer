const DatePicker = ({ config, onChange }) => {
    return (
        <div className="config-panel">
            <label>
                Label
                <input
                    type="text"
                    value={config.label ?? ''}
                    onChange={(event) => onChange({ ...config, label: event.target.value })}
                    placeholder="e.g. Select a date"
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
