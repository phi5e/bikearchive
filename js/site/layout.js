// Layout that depends on measured sizes: names, list height, logo roll.

import { LOGO_ROLL } from "./config.js";
import { fitNames } from "./fit.js";
import { waitsForFinger } from "./media.js";

const root = document.documentElement;
const cssPx = (name, fallback) => parseFloat(getComputedStyle(root).getPropertyValue(name)) || fallback;
function layoutRoll(logo, nav) {
  const size = logo.offsetWidth;
  const radius = size * (0.5 - cssPx("--ring-inset", 0));
  const gap = nav.getBoundingClientRect().left - (logo.offsetLeft + size);
  const distance = Math.max(0, gap * 0.6);
  logo.style.setProperty("--roll-d", `${distance.toFixed(1)}px`);
  logo.style.setProperty("--roll-a", `${(distance / radius * 180 / Math.PI).toFixed(2)}deg`);
  logo.style.setProperty("--roll-t", `${Math.max(2.5, distance / 70).toFixed(2)}s`);
}
export function createLayout(records) {
  const toggle = document.getElementById("list-toggle");
  const logo = document.querySelector(".topbar__logo");
  const nav = document.querySelector(".topbar__nav");
  if (LOGO_ROLL) document.querySelector(".topbar").classList.add("topbar--roll");
  return function layout() {
    fitNames(records);
    if (LOGO_ROLL) layoutRoll(logo, nav);
    root.style.setProperty("--toggle-w", `${toggle.offsetWidth}px`);
    const captions = records.map((r) => r.name.parentElement);
    const tallest = Math.max(0, ...captions.map((c) => c.offsetHeight));
    const gutter = captions[0] ? parseFloat(getComputedStyle(captions[0]).bottom) : 0;
    const listBottom = Math.ceil(tallest + gutter + 16);
    const half = Math.max(80, Math.min(innerHeight / 2 - cssPx("--topbar-h", 56) - 16, innerHeight / 2 - listBottom));
    root.style.setProperty("--list-half", `${Math.floor(half)}px`);
  };
}

// Poster height in px. Phone browsers show and hide their bars while
// scrolling, which changes the screen height (and in some browsers even
// 100lvh). The posters ignore that and keep the tallest height seen at
// this width, so the bars just lie on top of them and the snap points
// never move. Only a new width (turning the phone) or, on a computer, a
// resized window sizes them again.
let probe = null;
function largeScreen() {
  if (!probe) {
    probe = document.createElement("div");
    probe.style.cssText = "position:fixed;top:0;left:0;width:0;height:100vh;height:100lvh;visibility:hidden;pointer-events:none";
    document.body.appendChild(probe);
  }
  return probe.offsetHeight;
}
// The tallest height is remembered for the visit, so a reload doesn't
// have to find it again (a browser can report it only once its bars hide).
const remembered = (width) => {
  try {
    return Number(sessionStorage.getItem(`poster-h-${width}`)) || 0;
  } catch {
    return 0;
  }
};
const remember = (width, height) => {
  try {
    sessionStorage.setItem(`poster-h-${width}`, String(height));
  } catch {}
};
let posterH = 0;
let posterW = 0;
export function sizePosters() {
  const touch = waitsForFinger();
  const keep = touch && innerWidth === posterW;
  const height = keep
    ? Math.max(posterH, innerHeight)
    : Math.max(innerHeight, touch ? Math.max(largeScreen(), remembered(innerWidth)) : 0);
  posterW = innerWidth;
  if (height === posterH) return;
  if (touch) remember(innerWidth, height);
  // Stay on the same poster when the height does change.
  const page = document.scrollingElement || root;
  const index = posterH ? Math.round(page.scrollTop / posterH) : 0;
  posterH = height;
  root.style.setProperty("--poster-h", `${height}px`);
  if (index) page.scrollTop = index * height;
}
