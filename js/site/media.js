// Media queries shared by the modules.

export const phoneQuery = window.matchMedia("(max-width: 600px)");
export const isPhone = () => phoneQuery.matches;
// Touch screens (phones, tablets): a name only starts once the poster
// has snapped and no finger is on the screen.
export const touchQuery = window.matchMedia("(hover: none) and (pointer: coarse)");
export const waitsForFinger = () => phoneQuery.matches || touchQuery.matches;
export const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
