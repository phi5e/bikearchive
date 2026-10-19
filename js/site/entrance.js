// Name and year entrance: letters slide in from behind a curtain while a
// wave runs over the name, line by line, and the serif melts into the sans.

import { ENTRANCE_FPS, MORPH_FROM_SERIF } from "./config.js";

const SLIDE = 0.75;
const STAGGER = 0.045;
const LEAD = 0.18;
const MORPH_AHEAD = 0.12;
const MORPH_SPAN = 0.32;
const HIDDEN = "translate3d(110%, 0, 0)";
const frameScale = ENTRANCE_FPS ? ENTRANCE_FPS / 60 : 1;
const legEase = (p) => 0.7 * p + 0.3 * (1 - (1 - p) ** 4);
const clamp01 = (v) => Math.min(Math.max(v, 0), 1);
export function createEntrance(rec, blurDev) {
  const { name, inner, chars, yearGlyphs } = rec;
  const glyphs = chars.map((c) => c.firstElementChild);
  const serifs = MORPH_FROM_SERIF ? chars.map((c) => c.querySelector(".bike__serif")) : [];
  const sanses = MORPH_FROM_SERIF ? chars.map((c) => c.querySelector(".bike__sans")) : [];
  const slideEase = gsap.parseEase("expo.out");
  let state = "shown";
  let timeline = null;
  let driver = null;
  function setMorph(e) {
    glyphs.forEach((g) => {
      g.style.filter = "";
    });
    serifs.forEach((s) => {
      s.style.opacity = e === null ? "" : String(1 - e);
      s.style.filter = "";
    });
    sanses.forEach((s) => {
      s.style.opacity = e === null ? "" : String(e);
      s.style.filter = "";
    });
  }
  function rest() {
    inner.style.visibility = "";
    inner.style.filter = "none";
    if (MORPH_FROM_SERIF) setMorph(null);
    chars.forEach((c, i) => {
      c.style.transform = "";
      glyphs[i].style.transform = "";
    });
  }
  function hide() {
    driver?.kill();
    timeline?.kill();
    driver = timeline = null;
    gsap.set(yearGlyphs, { xPercent: 110 });
    inner.style.visibility = "hidden";
    inner.style.filter = "none";
    if (MORPH_FROM_SERIF) setMorph(0);
    chars.forEach((c, i) => {
      c.style.transform = "";
      glyphs[i].style.transform = HIDDEN;
    });
    state = "hidden";
  }
  function play() {
    if (state !== "hidden") return;
    state = "playing";
    rest();
    const n = chars.length;
    const widths = chars.map((c) => c.offsetWidth);
    const total = widths.reduce((a, b) => a + b, 0) || 1;
    let acc = 0;
    const centres = widths.map((w) => {
      const m = (acc + w / 2) / total;
      acc += w;
      return m;
    });
    // The lines the name wraps onto: the wave keeps each one's width.
    const lineOf = [];
    let lines = 0;
    chars.forEach((c, i) => {
      if (i > 0 && Math.abs(c.offsetTop - chars[i - 1].offsetTop) > 1) lines++;
      lineOf.push(lines);
    });
    const lineWidths = new Array(lines + 1).fill(0);
    chars.forEach((_, i) => (lineWidths[lineOf[i]] += widths[i]));
    const sigma = Math.max(0.1, 1.4 / n);
    const starts = chars.map((_, i) => (n - 1 - i) * STAGGER);
    const duration = Math.max((n - 1) * STAGGER + SLIDE, 0.6);
    const span = 1 + 2 * LEAD;
    const fontSize = parseFloat(getComputedStyle(name).fontSize) || 160;
    serifs.forEach((s, i) => {
      s.style.transform = `scaleX(${(widths[i] / (s.offsetWidth || 1)).toFixed(4)})`;
    });
    inner.style.filter = "url(#name-blur)";
    const clock = { t: 0 };
    let lastCentre = null;
    let lastSlide = null;
    function render() {
      const t = clock.t;
      let slideSum = 0;
      glyphs.forEach((g, i) => {
        const dx = 110 * (1 - slideEase(clamp01((t - starts[i]) / SLIDE)));
        slideSum += dx * widths[i];
        g.style.transform = dx > 0.01 ? `translate3d(${dx.toFixed(2)}%, 0, 0)` : "";
      });
      const life = clamp01(t / duration);
      const centre = 1 + LEAD - span * legEase(life);
      const amp = 2.8 * Math.sin(Math.PI * life ** 0.8) ** 2;
      const raw = centres.map((m) => 1 + amp * Math.exp(-((m - centre) ** 2) / (2 * sigma * sigma)));
      const stretched = new Array(lines + 1).fill(0);
      raw.forEach((r, i) => (stretched[lineOf[i]] += r * widths[i]));
      let x = 0;
      let offset = 0;
      chars.forEach((c, i) => {
        if (i > 0 && lineOf[i] !== lineOf[i - 1]) x = offset = 0;
        const sx = raw[i] * lineWidths[lineOf[i]] / stretched[lineOf[i]];
        c.style.transform = amp > 0.001 ? `translate3d(${(x - offset).toFixed(2)}px, 0, 0) scaleX(${sx.toFixed(4)})` : "";
        x += widths[i] * sx;
        offset += widths[i];
      });
      if (MORPH_FROM_SERIF) {
        centres.forEach((pos, i) => {
          const m = clamp01((pos + MORPH_AHEAD - centre) / MORPH_SPAN);
          const e = m * m * (3 - 2 * m);
          const blur = fontSize * 0.045 * Math.sin(Math.PI * m) ** 2;
          const f = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : "";
          serifs[i].style.opacity = String(1 - e);
          sanses[i].style.opacity = String(e);
          serifs[i].style.filter = f;
          sanses[i].style.filter = f;
          glyphs[i].style.filter = m > 0 && m < 1 ? "url(#name-goo)" : "";
        });
      }
      const waveSpeed = lastCentre === null ? 0 : Math.abs(centre - lastCentre) * amp * 220 * frameScale;
      const slideSpeed = lastSlide === null ? 0 : Math.abs(slideSum - lastSlide) / total * 1.2 * frameScale;
      lastCentre = centre;
      lastSlide = slideSum;
      blurDev.setAttribute("stdDeviation", `${Math.min(Math.max(waveSpeed, slideSpeed), 10).toFixed(2)} 0`);
    }
    timeline = gsap.timeline({
      paused: true,
      onComplete() {
        rest();
        blurDev.setAttribute("stdDeviation", "0 0");
        state = "shown";
      }
    });
    timeline.to(clock, { t: duration, duration, ease: "none", onUpdate: render }, 0);
    timeline.fromTo(yearGlyphs, { xPercent: 110 }, {
      xPercent: 0,
      duration: SLIDE,
      ease: slideEase,
      stagger: { each: STAGGER, from: "end" }
    }, n * STAGGER);
    render();
    if (!ENTRANCE_FPS) {
      timeline.play();
      return;
    }
    const end = timeline.duration();
    const real = { t: 0 };
    let shown = -1;
    driver = gsap.to(real, {
      t: end,
      duration: end,
      ease: "none",
      onUpdate() {
        const frame = Math.floor(real.t * ENTRANCE_FPS);
        if (frame === shown) return;
        shown = frame;
        timeline.time(Math.min(frame / ENTRANCE_FPS, end));
      },
      onComplete() {
        timeline.time(end);
      }
    });
  }
  return {
    hide,
    play,
    get state() {
      return state;
    }
  };
}
