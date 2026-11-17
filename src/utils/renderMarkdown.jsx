const INLINE_MARKDOWN = /(\*\*[^*]+\*\*|\*[^*\n]+\*|(?<![\w])_[^_\n]+_(?![\w])|~~[^~]+~~|\[[^\]]+\]\([^)]+\))/g;

const renderInline = (text) => text.split(INLINE_MARKDOWN).map((part, index) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (/^\*[^*\n]+\*$/.test(part) || /^_[^_\n]+_$/.test(part)) return <em key={index}>{part.slice(1, -1)}</em>;
    if (/^~~[^~]+~~$/.test(part)) return <s key={index}>{part.slice(2, -2)}</s>;
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) return <u key={index} style={{ color: '#1a73e8' }}>{link[1]}</u>;
    return part;
});

// Renders the WhatsApp markdown subset (bold, italic, strikethrough, links, lists) line by line.
export const renderMarkdown = (text) => text.split('\n').map((line, index) => {
    const list = line.match(/^\s*(-|\d+\.)\s+(.*)$/);
    return (
        <div className="node-details-top" key={index}>
            {list ? <>{list[1] === '-' ? '\u2022' : list[1]} {renderInline(list[2])}</> : renderInline(line)}
        </div>
    );
});
