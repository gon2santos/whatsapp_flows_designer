const VALUE_KEYS = ['label', 'text', 'inputType', 'helperText', 'regex', 'description', 'fileName', 'mediaSize', 'actionLevel', 'screenId', 'linkedScreenId'];

const INLINE_MARKDOWN = /(\*\*[^*]+\*\*|\*[^*]+\*|~~[^~]+~~|\[[^\]]+\]\([^)]+\))/g;

const renderInline = (text) => text.split(INLINE_MARKDOWN).map((part, index) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (/^\*[^*]+\*$/.test(part)) return <em key={index}>{part.slice(1, -1)}</em>;
    if (/^~~[^~]+~~$/.test(part)) return <s key={index}>{part.slice(2, -2)}</s>;
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) return <u key={index}>{link[1]}</u>;
    return part;
});

// Renders the WhatsApp markdown subset (bold, italic, strikethrough, links, lists) line by line.
const renderMarkdown = (text) => text.split('\n').map((line, index) => {
    const list = line.match(/^\s*(-|\d+\.)\s+(.*)$/);
    return (
        <div className="node-details-top" key={index}>
            {list ? <>{list[1] === '-' ? '\u2022' : list[1]} {renderInline(list[2])}</> : renderInline(line)}
        </div>
    );
});

// Read-only summary of a node's modal data, shown when the node is hovered.
const FormItemDetails = ({ config }) => {
    const topText = config.topText?.trim();
    const values = VALUE_KEYS.filter((key) => config[key]).map((key) => ({ key, value: String(config[key]) }));
    const options = (config.options ?? []).filter((option) => typeof option === 'string' && option.trim());
    const items = (config.items ?? []).map((item) => item?.title?.trim()).filter(Boolean);
    const list = options.length ? options : items;
    const hasLabel = values.some(({ key }) => key === 'label');
    const check = <svg className="node-details-check" viewBox="0 0 16 16" aria-label="Required"><path d="M3 8.5l3.2 3.2L13 4.8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>;

    return (
        <div className="node-details">
            {topText && <div className="node-details-top-text">{renderMarkdown(topText)}</div>}
            {config.src && <img className="node-details-image" src={config.src} alt={config.fileName || ''} />}
            {config.required && !hasLabel && <div className="node-details-row">{check}</div>}
            {values.map(({ key, value }) => (
                <div className="node-details-row" key={key}>
                    {key === 'label' && config.required && check}
                    <span>{value}</span>
                </div>
            ))}
            {list.length > 0 && (
                <ul className="node-details-list">
                    {list.map((entry, index) => <li key={index}>{entry}</li>)}
                </ul>
            )}
            {!config.src && !topText && !config.required && values.length === 0 && list.length === 0 && <em>No data yet</em>}
        </div>
    );
};

export default FormItemDetails;
