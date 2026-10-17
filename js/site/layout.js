// Layout that depends on measured sizes: names, list height, logo roll.

import { LOGO_ROLL } from "./config.js";
import { fitNames } from "./fit.js";

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
