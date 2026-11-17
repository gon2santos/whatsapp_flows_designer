import { useEffect, useRef, useState } from 'react';
import { applyMarkdownAction, handleMarkdownShortcut } from '../utils/markdownShortcuts';
import { renderMarkdown } from '../utils/renderMarkdown';

const ACTIONS = [
    { action: 'bold', label: 'B', title: 'Bold (Ctrl+B)', style: { fontWeight: 700 } },
    { action: 'italic', label: 'I', title: 'Italic (Ctrl+I)', style: { fontStyle: 'italic' } },
    { action: 'strikethrough', label: 'S', title: 'Strikethrough', style: { textDecoration: 'line-through' } },
    { action: 'link', label: 'Link', title: 'Link' },
    { action: 'bullet', label: '• List', title: 'Bulleted list' },
    { action: 'ordered', label: '1. List', title: 'Numbered list' },
];

// Label + markdown formatting toolbar + textarea, writing the syntax straight into the value.
const MarkdownTextarea = ({ label, value, onChange, rows = 3, placeholder }) => {
    const textareaRef = useRef(null);
    const [isEditing, setIsEditing] = useState(() => !value?.trim());
    const showPreview = !isEditing && !!value?.trim();

    // Entering edit mode from the formatted preview moves focus into the textarea.
    useEffect(() => {
        if (isEditing) textareaRef.current?.focus();
    }, [isEditing]);

    // The default size becomes the floor for manual resizing.
    useEffect(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        textarea.style.minHeight = `${textarea.offsetHeight}px`;
        textarea.style.minWidth = `${textarea.offsetWidth}px`;
    }, []);

    const runAction = (action) => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        const result = applyMarkdownAction(action, value, textarea.selectionStart, textarea.selectionEnd);
        onChange(result.value);
        requestAnimationFrame(() => {
            textarea.focus();
            textarea.setSelectionRange(result.start, result.end);
        });
    };

    // The toolbar buttons sit inside the label, so a click on the label text would otherwise activate the first button (Bold).
    const handleLabelClick = (event) => {
        if (event.target.closest('button, textarea')) return;
        event.preventDefault();
        setIsEditing(true);
        textareaRef.current?.focus();
    };

    return (
        <label onClick={handleLabelClick}>
            {label}
            <div className="markdown-toolbar">
                {ACTIONS.map(({ action, label: text, title, style }) => (
                    <button
                        key={action}
                        type="button"
                        title={title}
                        style={style}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={(event) => { event.preventDefault(); runAction(action); }}
                    >
                        {text}
                    </button>
                ))}
            </div>
            <div className="markdown-field">
                {showPreview && <div className="markdown-preview">{renderMarkdown(value)}</div>}
                <textarea
                    ref={textareaRef}
                    rows={rows}
                    value={value}
                    style={showPreview ? { visibility: 'hidden' } : undefined}
                    onChange={(event) => onChange(event.target.value)}
                    onBlur={() => setIsEditing(false)}
                    onKeyDown={(event) => handleMarkdownShortcut(event, value, onChange)}
                    placeholder={placeholder}
                />
            </div>
        </label>
    );
};

export default MarkdownTextarea;
