// The archive scroller: parallax, which poster is current, preloading,
// and when a poster's entrance plays.

import { GLIDE, PLAY_AT, SETTLE_MS } from "./config.js";
import { isPhone, reduceMotion } from "./media.js";

const PRELOAD_AHEAD = 2;
function parallax(rec, p) {
  rec.poster.style.transform = isPhone() ? "" : `translate3d(0, ${p * -6}vh, 0)`;
  rec.name.style.transform = `translate3d(0, ${p * 14}vh, 0)`;
  rec.year.style.transform = `translate3d(0, ${p * 26}vh, 0)`;
}
export function setupScroll({ scroller, records, entrances }) {
  let armed = false;
  let current = -1;
  let restIndex = 0;
  let touches = 0;
  let jumping = false;
  let queued = false;
  let settleTimer = 0;
  let glide = null;
  function setCurrent(index) {
    if (index === current) return;
    current = index;
    records.forEach((rec, i) => rec.item.classList.toggle("is-current", i === index));
    for (let i = index; i <= index + PRELOAD_AHEAD && i < records.length; i++) records[i].poster.loading = "eager";
    if (index > 0) records[index - 1].poster.loading = "eager";
  }
  function update() {
    queued = false;
    const top = scroller.scrollTop;
    const h = scroller.clientHeight || 1;
    if (Math.abs(Math.round(top / h) - restIndex) >= 2) jumping = true;
    let best = 0;
    let bestVisible = -1;
    records.forEach((rec, i) => {
      const y = rec.section.offsetTop - top;
      const visible = Math.max(0, Math.min(y + h, h) - Math.max(y, 0));
      if (visible > bestVisible) {
        best = i;
        bestVisible = visible;
      }
      if (!reduceMotion && y < h && y > -h) parallax(rec, y / h);
      rec.section.classList.toggle("is-near", visible > 1);
      const entrance = entrances?.[i];
      if (!entrance) return;
      if (visible <= 1) {
        if (entrance.state !== "hidden") entrance.hide();
      } else if (armed && !jumping && !isPhone() && visible >= h * PLAY_AT) {
        entrance.play();
      }
    });
    setCurrent(best);
  }
  function settle() {
    clearTimeout(settleTimer);
    if (!armed || touches > 0 || glide) return;
    update();
    const rec = records[current];
    if (!rec) return;
    const h = scroller.clientHeight;
    if (Math.abs(rec.section.offsetTop - scroller.scrollTop) > h * 0.1) return;
    jumping = false;
    restIndex = current;
    entrances?.[current].play();
  }
  const settleSoon = () => {
    clearTimeout(settleTimer);
    settleTimer = setTimeout(settle, SETTLE_MS);
  };
  scroller.addEventListener("scroll", () => {
    if (!queued) {
      queued = true;
      requestAnimationFrame(update);
    }
    settleSoon();
  }, { passive: true });
  if ("onscrollend" in window) scroller.addEventListener("scrollend", settle);
  const stopGlide = (e) => {
    if (!glide) return;
    glide.kill();
    glide = null;
    const finger = touches > 0 || e?.pointerType === "touch" || e?.type === "touchstart";
    if (!finger) scroller.classList.remove("is-gliding");
  };
  ["wheel", "pointerdown", "keydown"].forEach((type) => scroller.addEventListener(type, stopGlide, { passive: true }));
  const onTouch = (e) => {
    touches = e.touches.length;
    if (e.type === "touchstart") stopGlide(e);
    else if (touches === 0 && !glide) scroller.classList.remove("is-gliding");
    if (touches === 0) settleSoon();
  };
  ["touchstart", "touchend", "touchcancel"].forEach((type) => scroller.addEventListener(type, onTouch, { passive: true }));
  return {
    update,
    arm() {
      armed = true;
      settle();
    },
    // Glide to a poster without the ones on the way playing.
    jumpTo(section) {
      stopGlide();
      jumping = true;
      const to = section.offsetTop;
      const posters = Math.abs(to - scroller.scrollTop) / (scroller.clientHeight || 1);
      if (reduceMotion || !window.gsap || posters < 0.01) {
        scroller.scrollTop = to;
        settleSoon();
        return;
      }
      scroller.classList.add("is-gliding");
      glide = gsap.to(scroller, {
        scrollTop: to,
        duration: Math.min(GLIDE.max, GLIDE.base + GLIDE.perPoster * posters),
        ease: "power3.inOut",
        onComplete() {
          glide = null;
          scroller.classList.remove("is-gliding");
          settle();
        }
      });
    }
  };
}
