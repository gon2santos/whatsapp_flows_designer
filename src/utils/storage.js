// Autosaves the designer's full state (screens + which one is active) to localStorage, so work survives reloads/crashes.
const STORAGE_KEY = 'whatsapp_flows_designer.state.v1';

// Drops transient drag-preview nodes before persisting; they're UI-only and never meant to survive a reload.
const stripPreviewItems = (screens) => screens.map((screen) => ({
    ...screen,
    items: screen.items.filter((item) => !item.isPreview),
}));

export const loadPersistedState = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed?.screens) ? parsed : null;
    } catch {
        return null;
    }
};

export const savePersistedState = (screens, activeScreenId) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ screens: stripPreviewItems(screens), activeScreenId }));
    } catch {
        // Storage can fail (quota exceeded, private browsing): losing the autosave isn't fatal.
    }
};
