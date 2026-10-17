// Builds the posters and the list from js/bikes.js.

import { MORPH_FROM_SERIF } from "./config.js";

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function buildYear(year, text) {
  year.setAttribute("aria-label", text);
  return Array.from(text).map((ch) => {
    const slot = el("span", "bike__ychar");
    slot.setAttribute("aria-hidden", "true");
    const glyph = el("span", "bike__yglyph", ch);
    slot.appendChild(glyph);
    year.appendChild(slot);
    return glyph;
  });
}
function buildName(name, text) {
  name.setAttribute("aria-label", text);
  const inner = el("span", "bike__name-inner");
  inner.setAttribute("aria-hidden", "true");
  const chars = [];
  const words = [];
  let word = null;
  Array.from(text).forEach((ch) => {
    if (ch === " ") {
      word = null;
      inner.appendChild(document.createTextNode(" "));
      return;
    }
    const slot = el("span", "bike__char");
    const glyph = el("span", "bike__glyph");
    if (MORPH_FROM_SERIF) {
      glyph.classList.add("bike__glyph--morph");
      const wrap = el("span", "bike__serif-wrap");
      wrap.appendChild(el("span", "bike__serif", ch));
      glyph.append(el("span", "bike__sans", ch), wrap);
    } else {
      glyph.textContent = ch;
    }
    slot.appendChild(glyph);
    if (!word) {
      word = el("span", "bike__word");
      words.push(word);
      inner.appendChild(word);
    }
    word.appendChild(slot);
    chars.push(slot);
  });
  name.appendChild(inner);
  return { inner, chars, words };
}
export function buildArchive(bikes, archive, list) {
  return bikes.map((bike, i) => {
    const id = `bike-${String(i + 1).padStart(2, "0")}`;
    const section = el("section", "bike");
    section.id = id;
    const poster = el("img", "bike__poster");
    poster.alt = `Plakat: ${bike.name}`;
    poster.decoding = "async";
    poster.loading = i < 3 ? "eager" : "lazy";
    poster.src = bike.image;
    const caption = el("div", "bike__caption");
    const year = el("span", "bike__year");
    const name = el("span", "bike__name");
    caption.append(year, name);
    // What the page snaps to (see .bike__snap in the css).
    const snap = el("span", "bike__snap");
    snap.setAttribute("aria-hidden", "true");
    section.append(snap, poster, caption);
    archive.appendChild(section);
    const item = el("li", "bike-list__item");
    item.dataset.target = id;
    item.style.setProperty("--i", i);
    const link = el("a", "", bike.name);
    link.href = `#${id}`;
    item.appendChild(link);
    list.appendChild(item);
    return {
      id,
      section,
      poster,
      year,
      yearGlyphs: buildYear(year, String(bike.year)),
      name,
      ...buildName(name, bike.name),
      item
    };
  });
}
