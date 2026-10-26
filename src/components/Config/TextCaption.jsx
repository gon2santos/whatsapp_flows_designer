import MarkdownTextarea from '../MarkdownTextarea';

const TextCaption = ({ config, onChange }) => {
    return (
        <div className="config-panel">
            <MarkdownTextarea
                label="Text"
                rows={2}
                value={config.text ?? ''}
                onChange={(text) => onChange({ ...config, text })}
                placeholder="Caption text"
            />
        </div>
    );
}

export default TextCaption;
