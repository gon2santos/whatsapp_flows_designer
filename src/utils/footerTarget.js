// Sentinel stored in screen.footerTarget meaning "Finalizar": the flow completes on this screen instead of navigating onward.
export const COMPLETE_TARGET = '__complete__';

// Where a main screen's footer navigates to. An explicit choice (a screen id, or COMPLETE_TARGET) takes
// priority as long as it still points at a real screen; otherwise it defaults to the next screen in array
// order, or completion when this is the last one — preserving the original implicit-chaining behavior.
export const resolveFooterTarget = (screen, mainScreens, screenIndex) => {
    if (screen.footerTarget === COMPLETE_TARGET) return undefined;
    if (screen.footerTarget && mainScreens.some((candidate) => candidate.id === screen.footerTarget)) {
        return screen.footerTarget;
    }
    return mainScreens[screenIndex + 1]?.id;
};
