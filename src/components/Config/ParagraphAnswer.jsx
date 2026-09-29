const ParagraphAnswer = ({ config, onChange }) => {
    return (
        <div className="config-panel">
            <label>
                Label
                <textarea
                    rows={3}
                    value={config.label ?? ''}
                    onChange={(event) => onChange({ ...config, label: event.target.value })}
                    placeholder="e.g. Tell us more..."
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

export default ParagraphAnswer;
