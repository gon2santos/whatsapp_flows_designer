const TextCaption = ({ config, onChange }) => {
    return (
        <div className="config-panel">
            <label>
                Text
                <input
                    type="text"
                    value={config.text ?? ''}
                    onChange={(event) => onChange({ ...config, text: event.target.value })}
                    placeholder="Caption text"
                />
            </label>
        </div>
    );
}

export default TextCaption;
