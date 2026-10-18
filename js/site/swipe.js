// Swipe mode (PHONE_BROWSING in config.js): the page never scrolls, so
// the browser bars never come and go. A swipe, the arrows, the wheel or
// the keys slide the strip of posters (scroll.js) one bike on.

import { SWIPE } from "./config.js";

// Past the first or last poster the strip follows the finger this much.
const EDGE_GIVE = 0.3;
// A finger has to move this far (px) before it drags the posters.
const DRAG_START = 8;
// Speed only counts if the finger was still moving this recently (ms).
const SPEED_FRESH = 100;
// After a wheel step, more wheel events within this time (ms) belong to
// the same flick of the wheel or trackpad.
const WHEEL_QUIET = 250;
const KEYS = { ArrowDown: 1, PageDown: 1, " ": 1, ArrowUp: -1, PageUp: -1 };
const STEP_SLIDE = { duration: SWIPE.duration, ease: "power3.out" };
const ARROW = '<svg viewBox="0 0 14 22" aria-hidden="true"><path d="M7 21V2M1 8l6-6 6 6"/></svg>';

const overlayOpen = () => document.body.matches(".is-list-open, .is-info-open, .is-lightbox-open");

function buildArrows(step) {
  const nav = document.createElement("nav");
  nav.className = "swipe-arrows";
  nav.setAttribute("aria-label", "Bikes");
  const button = (dir, label) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "swipe-arrows__button";
    b.setAttribute("aria-label", label);
    b.innerHTML = ARROW;
    if (dir > 0) b.firstChild.style.transform = "rotate(180deg)";
    b.addEventListener("click", () => step(dir));
    nav.append(b);
    return b;
  };
  const up = button(-1, "Previous bike");
  const down = button(1, "Next bike");
  document.body.append(nav);
  return { up, down };
}

export function setupSwipe({ count, position, place, posterHeight, nearest, heading, topOf, stop, go }) {
  const step = (dir) => go(heading() + dir, STEP_SLIDE);
  const arrows = SWIPE.arrows ? buildArrows(step) : null;
  // Touches on the overlays and the arrows are theirs, not a swipe.
  const theirs = (e) => e.target.closest?.(".bike-list, .info, .lightbox, .swipe-arrows");

  let from = null;
  let dragging = false;
  let lastY = 0;
  let lastT = 0;
  let speed = 0;
  // A tap that only stopped the moving posters doesn't open the poster.
  let swallowClick = false;
  window.addEventListener("touchstart", (e) => {
    from = null;
    swallowClick = false;
    if (e.touches.length !== 1 || theirs(e) || overlayOpen()) return;
    // Stopping the posters stops them; a tap on the menu still works.
    swallowClick = stop() && !!e.target.closest?.(".archive");
    const y = e.touches[0].clientY;
    from = { y, top: position(), index: nearest() };
    dragging = false;
    lastY = y;
    lastT = e.timeStamp;
    speed = 0;
  }, { passive: true });
  window.addEventListener("touchmove", (e) => {
    if (!from || e.touches.length !== 1) return;
    const y = e.touches[0].clientY;
    if (!dragging && Math.abs(y - from.y) < DRAG_START) return;
    dragging = true;
    // A drag never opens a poster, however short.
    swallowClick = true;
    if (e.cancelable) e.preventDefault();
    const dt = e.timeStamp - lastT;
    if (dt > 0) speed = (lastY - y) / dt;
    lastY = y;
    lastT = e.timeStamp;
    const last = topOf(count - 1);
    let top = from.top + from.y - y;
    if (top < 0) top *= EDGE_GIVE;
    else if (top > last) top = last + (top - last) * EDGE_GIVE;
    place(top);
  }, { passive: false });
  const release = (e) => {
    if (!from || e.touches.length) return;
    const start = from;
    from = null;
    // A tap: scroll.js lands the posters if it stopped them mid-way.
    if (!dragging) return;
    if (e.timeStamp - lastT > SPEED_FRESH) speed = 0;
    const moved = position() - topOf(start.index);
    let dir = 0;
    if (Math.abs(speed) > SWIPE.speed) dir = Math.sign(speed);
    else if (Math.abs(moved) > posterHeight() * SWIPE.distance) dir = Math.sign(moved);
    go(start.index + dir, STEP_SLIDE);
  };
  window.addEventListener("touchend", release, { passive: true });
  window.addEventListener("touchcancel", release, { passive: true });
  window.addEventListener("click", (e) => {
    if (!swallowClick) return;
    swallowClick = false;
    e.preventDefault();
    e.stopPropagation();
  }, true);

  let wheelUntil = 0;
  window.addEventListener("wheel", (e) => {
    if (overlayOpen() || theirs(e) || Math.abs(e.deltaY) < 4) return;
    const now = performance.now();
    const quiet = now > wheelUntil;
    wheelUntil = now + WHEEL_QUIET;
    if (quiet) step(Math.sign(e.deltaY));
  }, { passive: true });
  document.addEventListener("keydown", (e) => {
    if (!(e.key in KEYS) || overlayOpen() || e.target.closest?.("button, a, input")) return;
    e.preventDefault();
    step(KEYS[e.key]);
  });

  return {
    // The poster on screen (or being glided to): grey out an arrow at
    // either end.
    current(index) {
      if (!arrows) return;
      arrows.up.disabled = index <= 0;
      arrows.down.disabled = index >= count - 1;
    }
  };
}
