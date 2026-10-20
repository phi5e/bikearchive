// Switches and timings for the whole site.

export const MORPH_FROM_SERIF = true;
export const LOGO_ROLL = false;
// Phones and tablets: "scroll" (the page scrolls and snaps to each
// poster) or "swipe" (the page never moves, so the browser bars never come
// and go; a swipe, the arrows, the wheel or the keys slide to the next bike).
// Safari (iPhone, iPad) and every other browser each get their own.
export const PHONE_BROWSING = { safari: "scroll", other: "swipe" };
// Swipe mode: how far (share of the screen) or how fast (px per ms) a
// swipe must go to move on, how long the slide after it takes, and
// whether the up/down arrows show.
export const SWIPE = { distance: 0.12, speed: 0.35, duration: 0.5, arrows: true };
// Phones: where the name sits. "bottom": at the bottom of the poster (the
// browser bars may cover it); "above-bars": at the bottom of the screen
// as it is with the bars showing, so they never cover it; "middle": in
// the middle of the screen.
export const NAME_SPOT = "bottom";
// Frames per second of the name and year entrance (a number steps it, like
// the earlier 18 fps test); null runs it smoothly at the screen's rate.
export const ENTRANCE_FPS = null;
// The background behind each poster, from its own colours (colors.js):
// "gradient" (darker at the top left, brighter at the bottom right),
// "median" (one colour, the image's median) or false (the one plain
// background, --bg in the css).
export const POSTER_BG = "gradient";
// "gradient": its two colours, picked from the image's pixels ranked from
// brightest (0) to darkest (1): bright, the bottom right end (0.5: the
// middle pixel); dark, the top left end (0.7: darker than 70% of them).
// Further apart (e.g. 0.3 and 0.6) gives more contrast.
export const GRADIENT = { bright: 0.5, dark: 0.7 };
export const PLAY_AT = 0.45;
export const SETTLE_MS = 120;
export const LIST_FADE_MS = 600;
export const GLIDE = { base: 0.7, perPoster: 0.1, max: 1.6 };
