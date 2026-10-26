// Wraps a textarea's current selection with ** (bold) or * (italics) on Ctrl/Cmd+B / Ctrl/Cmd+I,
// writing the markdown syntax directly into the field's value and keeping the same text selected.
export const handleMarkdownShortcut = (event, value, onValueChange) => {
    const isBold = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'b';
    const isItalic = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'i';
    if (!isBold && !isItalic) return;

    const textarea = event.target;
    const { selectionStart, selectionEnd } = textarea;
    if (selectionStart === selectionEnd) return;

    event.preventDefault();
    const marker = isBold ? '**' : '*';
    const selected = value.slice(selectionStart, selectionEnd);
    const newValue = `${value.slice(0, selectionStart)}${marker}${selected}${marker}${value.slice(selectionEnd)}`;
    onValueChange(newValue);

    requestAnimationFrame(() => {
        textarea.setSelectionRange(selectionStart + marker.length, selectionEnd + marker.length);
    });
};

// Markdown is only relevant to WhatsApp Flow's JSON when the text actually contains formatting syntax.
export const hasMarkdown = (text) => /\*|~~|\[[^\]]+\]\([^)]+\)|^\s*(-|\d+\.)\s/m.test(text ?? '');

// WhatsApp Flow text props: markdown text adds "markdown": true; lines stay joined by "\n" in a single string.
export const textProps = (text) => (hasMarkdown(text) ? { markdown: true, text } : { text });

const WRAP_MARKERS = { bold: '**', italic: '*', strikethrough: '~~' };

// Applies a toolbar action to the selection; returns the new value and selection range.
export const applyMarkdownAction = (action, value, start, end) => {
    const selected = value.slice(start, end);
    if (WRAP_MARKERS[action]) {
        const marker = WRAP_MARKERS[action];
        return {
            value: `${value.slice(0, start)}${marker}${selected}${marker}${value.slice(end)}`,
            start: start + marker.length,
            end: end + marker.length,
        };
    }
    if (action === 'link') {
        const label = selected || 'text';
        const insert = `[${label}](https://)`;
        const urlStart = start + label.length + 3;
        return { value: `${value.slice(0, start)}${insert}${value.slice(end)}`, start: urlStart, end: urlStart + 8 };
    }
    // Lists: prefix every line touched by the selection.
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const block = value.slice(lineStart, end);
    const prefixed = block.split('\n').map((line, index) => `${action === 'ordered' ? `${index + 1}.` : '-'} ${line}`).join('\n');
    return { value: `${value.slice(0, lineStart)}${prefixed}${value.slice(end)}`, start: lineStart, end: lineStart + prefixed.length };
};
