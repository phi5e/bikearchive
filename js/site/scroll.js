// Page scrolling: parallax, which poster is current, preloading, and when
// a poster's entrance plays. The page itself scrolls (not a box inside
// it), so phone browsers can shrink their bars while scrolling.

import { GLIDE, PLAY_AT, SETTLE_MS } from "./config.js";
import { isPhone, reduceMotion, waitsForFinger } from "./media.js";

const PRELOAD_AHEAD = 2;
// A poster counts as snapped when it is within this share of a screen
// of its place (the old 10% let names start while still sliding in).
const SNAP_SLACK = 0.01;

const page = document.scrollingElement || document.documentElement;

// Load and decode a poster before it scrolls in, so it never appears late.
function warm(rec) {
  if (!rec || rec.warm) return;
  rec.warm = true;
  rec.poster.loading = "eager";
  rec.poster.decode?.().catch(() => {});
}
function parallax(rec, p) {
  rec.poster.style.transform = isPhone() ? "" : `translate3d(0, ${p * -6}vh, 0)`;
  rec.name.style.transform = `translate3d(0, ${p * 14}vh, 0)`;
  rec.year.style.transform = `translate3d(0, ${p * 26}vh, 0)`;
}
export function setupScroll({ records, entrances }) {
  let armed = false;
  let current = -1;
  let restIndex = 0;
  let touches = 0;
  let jumping = false;
  let queued = false;
  let settleTimer = 0;
  let glide = null;
  let lastScroll = 0;
  // Work that must wait until no finger is down and the page has stopped.
  const waiting = new Set();
  // Posters are as tall as the screen with the browser bars hidden, so
  // they can be taller than what is visible while the bars are shown.
  const posterHeight = () => records[0]?.section.offsetHeight || innerHeight;
  // Where the page rests on a poster (the last one may not reach the top).
  const restingTop = (section) => Math.min(section.offsetTop, page.scrollHeight - innerHeight);
  function setCurrent(index) {
    if (index === current) return;
    current = index;
    records.forEach((rec, i) => rec.item.classList.toggle("is-current", i === index));
    for (let i = index - 1; i <= index + PRELOAD_AHEAD; i++) warm(records[i]);
  }
  function update() {
    queued = false;
    const top = page.scrollTop;
    const h = posterHeight();
    const vh = innerHeight;
    if (Math.abs(Math.round(top / h) - restIndex) >= 2) jumping = true;
    let best = 0;
    let bestVisible = -1;
    records.forEach((rec, i) => {
      const y = rec.section.offsetTop - top;
      const visible = Math.max(0, Math.min(y + h, vh) - Math.max(y, 0));
      if (visible > bestVisible) {
        best = i;
        bestVisible = visible;
      }
      if (!reduceMotion && y < vh && y > -h) parallax(rec, y / h);
      rec.section.classList.toggle("is-near", visible > 1);
      const entrance = entrances?.[i];
      if (!entrance) return;
      if (visible <= 1) {
        if (entrance.state !== "hidden") entrance.hide();
      } else if (armed && !jumping && !waitsForFinger() && visible >= vh * PLAY_AT) {
        entrance.play();
      }
    });
    setCurrent(best);
  }
  function settle() {
    clearTimeout(settleTimer);
    if (touches > 0 || glide) return;
    if (waiting.size) {
      const jobs = [...waiting];
      waiting.clear();
      jobs.forEach((job) => job());
    }
    if (!armed) return;
    update();
    const rec = records[current];
    if (!rec) return;
    if (Math.abs(restingTop(rec.section) - page.scrollTop) > posterHeight() * SNAP_SLACK) return;
    jumping = false;
    restIndex = current;
    entrances?.[current].play();
  }
  const settleSoon = () => {
    clearTimeout(settleTimer);
    settleTimer = setTimeout(settle, SETTLE_MS);
  };
  window.addEventListener("scroll", () => {
    lastScroll = performance.now();
    if (!queued) {
      queued = true;
      requestAnimationFrame(update);
    }
    settleSoon();
  }, { passive: true });
  if ("onscrollend" in window) window.addEventListener("scrollend", settle);
  const stopGlide = (e) => {
    if (!glide) return;
    glide.kill();
    glide = null;
    const finger = touches > 0 || e?.pointerType === "touch" || e?.type === "touchstart";
    if (!finger) page.classList.remove("is-gliding");
  };
  ["wheel", "pointerdown", "keydown"].forEach((type) => window.addEventListener(type, stopGlide, { passive: true }));
  const onTouch = (e) => {
    touches = e.touches.length;
    if (e.type === "touchstart") stopGlide(e);
    else if (touches === 0 && !glide) page.classList.remove("is-gliding");
    if (touches === 0) settleSoon();
  };
  ["touchstart", "touchend", "touchcancel"].forEach((type) => window.addEventListener(type, onTouch, { passive: true }));
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) touches = 0;
  });
  return {
    update,
    atRest(job) {
      if (touches === 0 && !glide && performance.now() - lastScroll > SETTLE_MS) job();
      else {
        waiting.add(job);
        settleSoon();
      }
    },
    arm() {
      armed = true;
      settle();
    },
    // Glide to a poster without the ones on the way playing.
    jumpTo(section) {
      stopGlide();
      jumping = true;
      const i = records.findIndex((r) => r.section === section);
      for (let k = i - 1; k <= i + 1; k++) warm(records[k]);
      const to = restingTop(section);
      const posters = Math.abs(to - page.scrollTop) / posterHeight();
      if (reduceMotion || !window.gsap || posters < 0.01) {
        page.scrollTop = to;
        settleSoon();
        return;
      }
      // Snapping would catch every frame of the glide.
      page.classList.add("is-gliding");
      glide = gsap.to(page, {
        scrollTop: to,
        duration: Math.min(GLIDE.max, GLIDE.base + GLIDE.perPoster * posters),
        ease: "power3.inOut",
        onComplete() {
          glide = null;
          // The posters may have been resized on the way.
          page.scrollTop = restingTop(section);
          page.classList.remove("is-gliding");
          settle();
        }
      });
    }
  };
}
