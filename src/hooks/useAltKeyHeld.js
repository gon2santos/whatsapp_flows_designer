import { useSyncExternalStore } from 'react'

// Single shared listener (regardless of how many components call the hook) tracking whether Alt is currently held.
let isAltHeld = false;
const listeners = new Set();

const setAltHeld = (value) => {
    if (isAltHeld === value) return;
    isAltHeld = value;
    listeners.forEach((listener) => listener());
};

if (typeof window !== 'undefined') {
    window.addEventListener('keydown', (event) => { if (event.key === 'Alt') setAltHeld(true); });
    window.addEventListener('keyup', (event) => { if (event.key === 'Alt') setAltHeld(false); });
    // Losing focus (e.g. alt-tabbing) never fires keyup, so treat it as Alt being released.
    window.addEventListener('blur', () => setAltHeld(false));
}

const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

export const useAltKeyHeld = () => useSyncExternalStore(subscribe, () => isAltHeld, () => false);
