// Each poster's colours behind it (POSTER_BG in config.js), read from the
// image itself once it has loaded, drawn small onto a canvas.
// "median": one colour, the median of red, green and blue over its pixels.
// "gradient": from a darker colour at the top left to a brighter one at
// the bottom right, both taken from the image (GRADIENT in config.js).
// On a dark background the ink turns white (css: .bike--dark, and
// .is-dark-current for the menu while that poster is the current one).

import { GRADIENT, POSTER_BG } from "./config.js";
import { isPhone, phoneQuery } from "./media.js";

// Width of the sample in px; plenty for a median, and quick to read.
const SAMPLE = 48;
// Relative luminance below which white reads better than black (where
// both contrast ratios are equal).
const DARK_BELOW = 0.179;
// "gradient": each end is the average of the pixels within this share of
// the ranking around its spot, so one odd pixel can't decide it.
const BAND = 0.03;

const body = document.body;
const idle = window.requestIdleCallback || ((job) => setTimeout(job, 1));
// sRGB value (0–255) to linear light, for the luminance.
const LINEAR = Float32Array.from({ length: 256 }, (_, v) => {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
});
const luminance = ([r, g, b]) => 0.2126 * LINEAR[r] + 0.7152 * LINEAR[g] + 0.0722 * LINEAR[b];

// The opaque pixels of a small copy of the image, as [r, g, b].
function readPixels(img) {
  const w = SAMPLE;
  const h = Math.max(1, Math.round((SAMPLE * img.naturalHeight) / img.naturalWidth));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;
  const pixels = [];
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] >= 128) pixels.push([data[i], data[i + 1], data[i + 2]]);
  }
  return pixels;
}
// The median of each channel: where its running count passes half.
function medianColor(pixels) {
  return [0, 1, 2].map((ch) => {
    const counts = new Uint32Array(256);
    pixels.forEach((p) => counts[p[ch]]++);
    let seen = 0;
    for (let v = 0; v < 256; v++) if ((seen += counts[v]) * 2 >= pixels.length) return v;
    return 255;
  });
}
// The pixels ranked from brightest to darkest: the colour at the given
// share of the way down (0.5: as bright as the middle pixel; 0.7: darker
// than 70% of them), averaged over its band.
function rankedColor(ranked, share) {
  const n = ranked.length;
  const from = Math.max(0, Math.min(n - 1, Math.round((share - BAND) * n)));
  const to = Math.max(from + 1, Math.min(n, Math.round((share + BAND) * n)));
  const sum = [0, 0, 0];
  for (let i = from; i < to; i++) for (let ch = 0; ch < 3; ch++) sum[ch] += ranked[i][ch];
  return sum.map((s) => Math.round(s / (to - from)));
}
// The colours for the top left and the bottom right.
function colorsOf(img) {
  const pixels = readPixels(img);
  if (!pixels.length) return null;
  if (POSTER_BG !== "gradient") {
    const median = medianColor(pixels);
    return [median, median];
  }
  const ranked = pixels
    .map((p) => ({ p, l: luminance(p) }))
    .sort((a, b) => b.l - a.l)
    .map((x) => x.p);
  return [rankedColor(ranked, GRADIENT.dark), rankedColor(ranked, GRADIENT.bright)];
}
// The menu takes white ink while a poster on a dark colour is current.
export function syncInk(section) {
  if (section) body.classList.toggle("is-dark-current", section.classList.contains("bike--dark"));
}
function paint(rec) {
  let ends = null;
  try {
    ends = colorsOf(rec.poster);
  } catch {
    // An image the canvas may not read keeps the plain background.
  }
  if (!ends) return;
  const [start, end] = ends;
  rec.section.style.setProperty("--bg-from", `rgb(${start.join(" ")})`);
  rec.section.style.setProperty("--bg-to", `rgb(${end.join(" ")})`);
  // The ink suits the middle of the gradient (mixed as the browser mixes
  // it), where name and menu mostly sit.
  const middle = start.map((v, ch) => Math.round((v + end[ch]) / 2));
  rec.section.classList.toggle("bike--dark", luminance(middle) < DARK_BELOW);
  if (rec.section.classList.contains("is-current")) syncInk(rec.section);
}
// Read only with the page at rest (never mid-swipe), from an image that
// is already decoded, and in a quiet moment after that. Phone posters
// fill the screen and hide the colour, so there it isn't read at all
// (unless the screen grows wider).
export function setupColors(records, stage) {
  if (!POSTER_BG) return;
  document.documentElement.classList.add("poster-bg");
  function start() {
    if (isPhone()) return;
    records.forEach((rec) => {
      if (rec.colored) return;
      rec.colored = true;
      const img = rec.poster;
      const later = () =>
        (img.decode?.() ?? Promise.resolve())
          .catch(() => {})
          .then(() => stage.atRest(() => idle(() => paint(rec))));
      if (img.complete && img.naturalWidth) later();
      else img.addEventListener("load", later, { once: true });
    });
  }
  start();
  phoneQuery.addEventListener("change", start);
}
