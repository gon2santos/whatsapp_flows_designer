// Turns free text into a safe WhatsApp Flow field/screen name (snake_case, alphanumeric only).
// Accented letters map to their plain variant (e.g. "Sí" -> "si") instead of being dropped.
// With preserveCase the original letter case is kept (e.g. "Sí" -> "Si"), used for option ids.
export const slugify = (text, { preserveCase = false } = {}) => {
    const plain = (text ?? '')
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    return (preserveCase ? plain : plain.toLowerCase())
        .replace(/[^A-Za-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '') || 'field';
};
