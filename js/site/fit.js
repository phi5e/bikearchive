// Fits the names to the screen width.

import { isPhone } from "./media.js";

let metrics = null;
function nameMetrics(el) {
  if (metrics) return metrics;
  const cs = getComputedStyle(el);
  const ctx = document.createElement("canvas").getContext("2d");
  ctx.font = `${cs.fontWeight} 100px ${cs.fontFamily}`;
  const h = ctx.measureText("H");
  const found = {
    cap: h.actualBoundingBoxAscent / 100,
    ascent: h.fontBoundingBoxAscent / 100,
    descent: h.fontBoundingBoxDescent / 100
  };
  if (document.fonts.status === "loaded") metrics = found;
  return found;
}
const floor2 = (n) => Math.floor(n * 100) / 100;
// The caps of one line end `gap` px above the caps of the next; the top
// is padded so the first line's caps aren't cut off.
function spaceLines(name, size, gap) {
  const m = nameMetrics(name);
  const lineHeight = m.cap * size + gap;
  name.style.lineHeight = `${lineHeight.toFixed(2)}px`;
  const capTop = (lineHeight - (m.ascent + m.descent) * size) / 2 + (m.ascent - m.cap) * size;
  name.style.paddingTop = capTop < 0 ? `${Math.ceil(-capTop)}px` : "";
}
// Phones: 60% of the desktop size, wrapping between words; smaller only
// if the longest word doesn't fit.
const PHONE_SHARE = 0.6;
const PHONE_GAP = 5;
function fitPhone(rec, cap) {
  const { name, words } = rec;
  const size = cap * PHONE_SHARE;
  name.style.fontSize = `${size}px`;
  const available = name.parentElement.clientWidth;
  const widest = Math.max(1, ...words.map((w) => w.offsetWidth));
  const fitted = floor2(widest > available ? size * (available / widest) : size);
  name.style.fontSize = `${fitted}px`;
  spaceLines(name, fitted, PHONE_GAP);
}
// Desktop: the make on one line, the rest on the next, as big as the
// longer line allows (capped); the lines as far apart as on a phone,
// scaled up with the size.
function fitDesktop(rec, cap) {
  const { name, inner } = rec;
  name.style.fontSize = `${cap}px`;
  const available = name.parentElement.clientWidth;
  const needed = inner.offsetWidth;
  const fitted = floor2(needed > available ? cap * (available / needed) : cap);
  name.style.fontSize = `${fitted}px`;
  spaceLines(name, fitted, PHONE_GAP * fitted / (cap * PHONE_SHARE));
}
export function fitNames(records) {
  const cap = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--name-max")) || 160;
  const fit = isPhone() ? fitPhone : fitDesktop;
  records.forEach((rec) => fit(rec, cap));
}
