import MarkdownTextarea from '../MarkdownTextarea';

const TextBody = ({ config, onChange }) => {
    return (
        <div className="config-panel">
            <MarkdownTextarea
                label="Text"
                rows={4}
                value={config.text ?? ''}
                onChange={(text) => onChange({ ...config, text })}
                placeholder="Body text"
            />
        </div>
    );
}

export default TextBody;
