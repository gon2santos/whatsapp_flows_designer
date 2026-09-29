// Turns free text into a safe WhatsApp Flow field/screen name (snake_case, alphanumeric only).
export const slugify = (text) => (
    (text ?? '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '') || 'field'
);
