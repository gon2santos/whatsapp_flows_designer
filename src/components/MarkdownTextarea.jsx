import { useRef } from 'react';
import { applyMarkdownAction, handleMarkdownShortcut } from '../utils/markdownShortcuts';

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

    return (
        <label>
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
            <textarea
                ref={textareaRef}
                rows={rows}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                onKeyDown={(event) => handleMarkdownShortcut(event, value, onChange)}
                placeholder={placeholder}
            />
        </label>
    );
};

export default MarkdownTextarea;
