const TextBody = ({ config, onChange }) => {
    return (
        <div className="config-panel">
            <label>
                Text
                <textarea
                    rows={4}
                    value={config.text ?? ''}
                    onChange={(event) => onChange({ ...config, text: event.target.value })}
                    placeholder="Body text"
                />
            </label>
        </div>
    );
}

export default TextBody;
