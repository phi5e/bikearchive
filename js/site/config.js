// Switches and timings for the whole site.

export const MORPH_FROM_SERIF = true;
export const LOGO_ROLL = false;
// Phones and tablets: "scroll" (the page scrolls and snaps to each
// poster) or "swipe" (the page never moves, so the browser bars never come
// and go; a swipe, the arrows, the wheel or the keys slide to the next bike).
export const PHONE_BROWSING = "scroll";
// Swipe mode: how far (share of the screen) or how fast (px per ms) a
// swipe must go to move on, how long the slide after it takes, and
// whether the up/down arrows show.
export const SWIPE = { distance: 0.12, speed: 0.35, duration: 0.5, arrows: true };
// Phones: where the name sits. "bottom": at the bottom of the poster (the
// browser bars may cover it); "above-bars": at the bottom of the screen
// as it is with the bars showing, so they never cover it; "middle": in
// the middle of the screen.
export const NAME_SPOT = "bottom";
export const ENTRANCE_FPS = 18;
export const PLAY_AT = 0.45;
export const SETTLE_MS = 120;
export const LIST_FADE_MS = 600;
export const GLIDE = { base: 0.7, perPoster: 0.1, max: 1.6 };
