// Media queries shared by the modules.

import { PHONE_BROWSING } from "./config.js";

export const phoneQuery = window.matchMedia("(max-width: 600px)");
export const isPhone = () => phoneQuery.matches;
// Touch screens (phones, tablets): a name only starts once the poster
// has snapped and no finger is on the screen.
export const touchQuery = window.matchMedia("(hover: none) and (pointer: coarse)");
export const waitsForFinger = () => phoneQuery.matches || touchQuery.matches;
// Safari itself, not the other iPhone browsers (they share its engine but
// draw their own bars) or apps showing a page.
const ua = navigator.userAgent;
export const isSafari = /AppleWebKit/.test(ua) && /Version\/[\d.]+.* Safari\//.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|OPT\/|GSA\/|DuckDuckGo|Ddg\/|YaBrowser|Chrome|Android/.test(ua);
// Swipe mode (config.js), on touch screens only; decided once at load.
export const swipes = PHONE_BROWSING[isSafari ? "safari" : "other"] === "swipe" && touchQuery.matches;
export const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
