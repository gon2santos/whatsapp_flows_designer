// Turns free text into a safe WhatsApp Flow field/screen name (snake_case, alphanumeric only).
// Accented letters map to their plain variant (e.g. "Sí" -> "si") instead of being dropped.
export const slugify = (text) => (
    (text ?? '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '') || 'field'
);
