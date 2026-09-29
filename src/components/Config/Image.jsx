const Image = ({ config, onChange }) => {
    return (
        <div className="config-panel">
            <label>
                Image URL
                <input
                    type="text"
                    value={config.src ?? ''}
                    onChange={(event) => onChange({ ...config, src: event.target.value })}
                    placeholder="https://..."
                />
            </label>
            <label>
                Alt text
                <input
                    type="text"
                    value={config.altText ?? ''}
                    onChange={(event) => onChange({ ...config, altText: event.target.value })}
                    placeholder="Describe the image"
                />
            </label>
        </div>
    );
}

export default Image;
