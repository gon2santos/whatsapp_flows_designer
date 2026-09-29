const TextLargeHeading = ({ config, onChange }) => {
    return (
        <div className="config-panel">
            <label>
                Heading
                <input
                    type="text"
                    value={config.text ?? ''}
                    onChange={(event) => onChange({ ...config, text: event.target.value })}
                    placeholder="Large heading"
                />
            </label>
        </div>
    );
}

export default TextLargeHeading;
