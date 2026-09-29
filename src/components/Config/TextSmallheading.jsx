const TextSmallheading = ({ config, onChange }) => {
    return (
        <div className="config-panel">
            <label>
                Subheading
                <input
                    type="text"
                    value={config.text ?? ''}
                    onChange={(event) => onChange({ ...config, text: event.target.value })}
                    placeholder="Small heading"
                />
            </label>
        </div>
    );
}

export default TextSmallheading;
