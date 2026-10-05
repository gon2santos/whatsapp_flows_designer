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

// Markdown is only relevant to WhatsApp Flow's JSON when the text actually contains bold/italics markers.
export const hasMarkdown = (text) => /\*/.test(text ?? '');
