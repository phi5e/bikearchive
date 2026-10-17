// Media queries shared by the modules.

export const phoneQuery = window.matchMedia("(max-width: 600px)");
export const isPhone = () => phoneQuery.matches;
export const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
