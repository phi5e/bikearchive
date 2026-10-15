(function () {
  // Variant: the names start in Instrument Serif (the earlier face) and
  // melt into the wide sans during the entrance. Set to false to go back
  // to sans only.
  const MORPH_FROM_SERIF = true;

  const bikes = window.BIKES || [];
  const archive = document.getElementById("archive");
  const listItems = document.getElementById("bike-list-items");
  const toggle = document.getElementById("list-toggle");
  const openWord = toggle.querySelector('[data-word="open"]');
  const closeWord = toggle.querySelector('[data-word="close"]');

  // Build the posters and the list from js/bikes.js.
  bikes.forEach((bike, i) => {
    const id = `bike-${String(i + 1).padStart(2, "0")}`;

    const section = document.createElement("section");
    section.className = "bike";
    section.id = id;
    section.innerHTML = `
      <img class="bike__poster" alt="" loading="${i < 3 ? "eager" : "lazy"}" />
      <div class="bike__caption">
        <span class="bike__year"></span>
        <span class="bike__name"></span>
      </div>
    `;
    const img = section.querySelector(".bike__poster");
    img.src = bike.image;
    img.alt = `Plakat: ${bike.name}`;
    section.querySelector(".bike__year").textContent = bike.year;
    // One masked cell per letter (wave) holding the glyph (slide-in), inside one span that holds
    // them (the outer span keeps the parallax).
    const name = section.querySelector(".bike__name");
    name.setAttribute("aria-label", bike.name);
    const inner = document.createElement("span");
    inner.className = "bike__name-inner";
    inner.setAttribute("aria-hidden", "true");
    // Letters are grouped per word, so a wrapped name (phones) only breaks
    // between words.
    let word = null;
    Array.from(bike.name).forEach((ch) => {
      if (ch === " ") {
        // A plain space between words: it disappears at a line break
        // instead of indenting the next line.
        word = null;
        inner.appendChild(document.createTextNode(" "));
        return;
      }
      const c = document.createElement("span");
      c.className = "bike__char";
      const g = document.createElement("span");
      g.className = "bike__glyph";
      if (MORPH_FROM_SERIF) {
        // Sans and serif share one baseline; the serif takes no width
        // and is stretched over the sans's slot while it morphs.
        g.classList.add("bike__glyph--morph");
        g.innerHTML = '<span class="bike__sans"></span><span class="bike__serif-wrap"><span class="bike__serif"></span></span>';
        g.querySelector(".bike__sans").textContent = ch;
        g.querySelector(".bike__serif").textContent = ch;
      } else {
        g.textContent = ch;
      }
      c.appendChild(g);
      if (!word) {
        word = document.createElement("span");
        word.className = "bike__word";
        inner.appendChild(word);
      }
      word.appendChild(c);
    });
    name.appendChild(inner);
    archive.appendChild(section);

    const li = document.createElement("li");
    li.className = "bike-list__item";
    li.dataset.target = id;
    li.style.setProperty("--i", i);
    li.innerHTML = `<a href="#${id}"></a>`;
    li.querySelector("a").textContent = bike.name;
    listItems.appendChild(li);
  });

  // Fit every name to one line: as large as the width allows, never
  // above the CSS cap (160px). Measured on the inner span, whose
  // offsetWidth ignores the letters' wave transforms.
  const names = Array.from(document.querySelectorAll(".bike__name"));
  const phoneQuery = window.matchMedia("(max-width: 600px)");
  const isPhone = () => phoneQuery.matches;
  // Cap height, ascent and descent of the name face, as fractions of
  // the font size (measured once, after the fonts have loaded).
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
      descent: h.fontBoundingBoxDescent / 100,
    };
    if (document.fonts.status === "loaded") metrics = found;
    return found;
  }
  function fitNames() {
    const cap = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--name-max")) || 160;
    if (isPhone()) {
      // Phones: 60% of the desktop cap, wrapping between words; only a
      // single word wider than the screen makes the name smaller.
      const size = cap * 0.6;
      names.forEach((el) => {
        el.style.fontSize = `${size}px`;
        const available = el.parentElement.clientWidth;
        const widest = Math.max(1, ...Array.from(el.querySelectorAll(".bike__word")).map((w) => w.offsetWidth));
        const fitted = Math.floor((widest > available ? size * (available / widest) : size) * 100) / 100;
        el.style.fontSize = `${fitted}px`;
        // Caps of one line end 5px above the next line's caps.
        const m = nameMetrics(el);
        const lineHeight = m.cap * fitted + 5;
        el.style.lineHeight = `${lineHeight.toFixed(2)}px`;
        // Where the first line's caps start inside its (squeezed) box.
        const capTop = (lineHeight - (m.ascent + m.descent) * fitted) / 2 + (m.ascent - m.cap) * fitted;
        el.style.paddingTop = capTop < 0 ? `${Math.ceil(-capTop)}px` : "";
      });
      return;
    }
    names.forEach((el) => {
      el.style.lineHeight = "";
      el.style.paddingTop = "";
      el.style.fontSize = `${cap}px`;
      const available = el.parentElement.clientWidth;
      const needed = el.firstElementChild.offsetWidth;
      const size = needed > available ? cap * (available / needed) : cap;
      el.style.fontSize = `${Math.floor(size * 100) / 100}px`;
    });
  }
  // The list sits right of the toggle (as wide as "close list"),
  // centred on the toggle's line: it reaches as far up as down, limited
  // by the menu above and the tallest caption (year + big name) below.
  const root = document.documentElement;
  // The ring rolls from its spot towards the right-hand words and back,
  // stopping 40% short of them. Its turn is the distance over its radius
  // (the outer edge of the lettering), so it rolls without slipping.
  const logo = document.querySelector(".topbar__logo");
  const nav = document.querySelector(".topbar__nav");
  function layoutRoll() {
    const size = logo.offsetWidth;
    const inset = parseFloat(getComputedStyle(root).getPropertyValue("--ring-inset")) || 0;
    const radius = size * (0.5 - inset);
    const gap = nav.getBoundingClientRect().left - (logo.offsetLeft + size);
    const distance = Math.max(0, gap * 0.6);
    logo.style.setProperty("--roll-d", `${distance.toFixed(1)}px`);
    logo.style.setProperty("--roll-a", `${((distance / radius) * 180 / Math.PI).toFixed(2)}deg`);
    // About 70px per second on average, whatever the screen width.
    logo.style.setProperty("--roll-t", `${Math.max(2.5, distance / 70).toFixed(2)}s`);
  }
  function layout() {
    fitNames();
    layoutRoll();
    root.style.setProperty("--toggle-w", `${toggle.offsetWidth}px`);
    const captions = Array.from(document.querySelectorAll(".bike__caption"));
    const tallest = Math.max(0, ...captions.map((c) => c.offsetHeight));
    const gutter = captions[0] ? parseFloat(getComputedStyle(captions[0]).bottom) : 0;
    const listBottom = Math.ceil(tallest + gutter + 16);
    const topbarH = parseFloat(getComputedStyle(root).getPropertyValue("--topbar-h")) || 56;
    const half = Math.max(80, Math.min(innerHeight / 2 - topbarH - 16, innerHeight / 2 - listBottom));
    root.style.setProperty("--list-half", `${Math.floor(half)}px`);
  }
  layout();
  document.fonts.ready.then(layout);
  window.addEventListener("resize", layout);

  // Parallax: while a poster passes through the screen, the poster,
  // the name and the year drift at different speeds.
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sections = Array.from(document.querySelectorAll(".bike"));
  const layers = sections.map((s) => ({
    section: s,
    poster: s.querySelector(".bike__poster"),
    year: s.querySelector(".bike__year"),
    name: s.querySelector(".bike__name"),
  }));
  let ticking = false;
  function parallax() {
    ticking = false;
    const vh = window.innerHeight;
    layers.forEach(({ section, poster, year, name }) => {
      const top = section.getBoundingClientRect().top;
      if (top > vh || top < -vh) return;
      const p = top / vh; // 0 when the poster fills the screen, ±1 one screen away
      poster.style.transform = `translate3d(0, ${p * -6}vh, 0)`;
      name.style.transform = `translate3d(0, ${p * 14}vh, 0)`;
      year.style.transform = `translate3d(0, ${p * 26}vh, 0)`;
    });
  }
  if (!reduceMotion) {
    window.addEventListener("scroll", () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(parallax);
      }
    }, { passive: true });
    window.addEventListener("resize", parallax);
    parallax();
  }

  // Name entrance, played each time a poster comes into view (from
  // either direction). Everything moves on the x axis only.
  // Two motions at once:
  // - Slide-in: each letter slides in from the right into its own slot,
  //   as if from behind an invisible curtain, one after another from
  //   the last letter to the first.
  // - Wave: with the left edge of the first letter and the right edge
  //   of the last letter fixed, a wave runs once over the word from
  //   right to left, following the curtain. Letters under it stretch
  //   and the others squeeze, like looking through moving glass.
  // A horizontal blur follows the movement (motion blur).
  // With MORPH_FROM_SERIF, the letters slide in as serif and each one
  // melts into the sans once, as the wave's crest passes over it (so the
  // morph sweeps right to left and only ever moves forward). Serif and
  // sans cross-fade while both are blurred, and a hard alpha threshold
  // (the "goo" filter) turns that into one solid,
  // changing outline. The threshold sits on each letter (not the whole
  // name) so the motion blur on top of it stays soft.
  const blurDev = document.getElementById("name-blur-dev");
  const MORPH_AHEAD = 0.12; // a letter starts morphing when the crest is this far (0..1) to its right
  const MORPH_SPAN = 0.32; // and has finished when the crest has moved this much further
  const entrances = new Map();

  const SLIDE = 0.75; // seconds per letter slide-in
  const STAGGER = 0.045;
  const LEAD = 0.18; // wave starts/ends this far (0..1) outside the word
  // Long, soft landing: most of the travel early, the last pixels
  // creep in over the final frames.
  const slideEase = gsap.parseEase("expo.out");
  // Linear through the middle, eased out hard over the last stretch.
  const legEase = (p) => 0.7 * p + 0.3 * (1 - (1 - p) ** 4);

  function setMorph(name, e) {
    name.querySelectorAll(".bike__glyph").forEach((g) => { g.style.filter = ""; });
    name.querySelectorAll(".bike__serif").forEach((s) => { s.style.opacity = e === null ? "" : String(1 - e); s.style.filter = ""; });
    name.querySelectorAll(".bike__sans").forEach((s) => { s.style.opacity = e === null ? "" : String(e); s.style.filter = ""; });
  }

  // Posters blend in as they come into view, together with the name.
  const FADE_TIME = 0.9;
  const fades = new Map();
  const posterOf = (name) => name.closest(".bike").querySelector(".bike__poster");

  function hidePoster(name) {
    fades.get(name)?.kill();
    fades.delete(name);
    gsap.set(posterOf(name), { opacity: 0 });
  }

  function playPoster(name) {
    fades.get(name)?.kill();
    fades.set(name, gsap.to(posterOf(name), { opacity: 1, duration: FADE_TIME, ease: "power2.out" }));
  }

  function hideName(name) {
    hidePoster(name);
    const inner = name.firstElementChild;
    inner.style.visibility = "hidden";
    inner.style.filter = "none";
    if (MORPH_FROM_SERIF) setMorph(name, 0);
    inner.querySelectorAll(".bike__char").forEach((c) => {
      c.style.transform = "";
      c.firstElementChild.style.transform = "translate3d(110%, 0, 0)";
    });
  }

  function restName(name) {
    const inner = name.firstElementChild;
    inner.style.visibility = "";
    inner.style.filter = "none";
    if (MORPH_FROM_SERIF) setMorph(name, null);
    inner.querySelectorAll(".bike__char").forEach((c) => {
      c.style.transform = "";
      c.firstElementChild.style.transform = "";
    });
  }

  function playName(name) {
    const inner = name.firstElementChild;
    const chars = Array.from(inner.querySelectorAll(".bike__char"));
    const glyphs = chars.map((c) => c.firstElementChild);
    entrances.get(name)?.kill();
    restName(name);
    playPoster(name);

    // Resting geometry: each letter's width and centre (0..1 of the name).
    const widths = chars.map((c) => c.offsetWidth);
    const total = widths.reduce((a, b) => a + b, 0) || 1;
    let acc = 0;
    const centres = widths.map((w) => { const m = (acc + w / 2) / total; acc += w; return m; });
    const sigma = Math.max(0.1, 1.4 / chars.length);
    const n = chars.length;
    // Last letter first.
    const starts = chars.map((_, i) => (n - 1 - i) * STAGGER);
    const slideEnd = (n - 1) * STAGGER + SLIDE;
    // The wave crosses the word in the time all letters take to land.
    const wave = Math.max(slideEnd, 0.6);
    const span = 1 + 2 * LEAD;

    inner.style.filter = "url(#name-blur)";
    const state = { t: 0 };
    const duration = wave;

    // Morph: stretch each serif glyph over its sans slot.
    const serifs = MORPH_FROM_SERIF ? chars.map((c) => c.querySelector(".bike__serif")) : [];
    serifs.forEach((s, i) => {
      s.style.transform = `scaleX(${(widths[i] / (s.offsetWidth || 1)).toFixed(4)})`;
    });
    const sanses = MORPH_FROM_SERIF ? chars.map((c) => c.querySelector(".bike__sans")) : [];
    const fontSize = parseFloat(getComputedStyle(name).fontSize) || 160;
    let lastCentre = null;
    let lastSlide = null;

    function render() {
      const t = state.t;

      // 1. Slide-in, per letter, inside its own masked slot.
      let slideSum = 0;
      glyphs.forEach((g, i) => {
        const p = Math.min(Math.max((t - starts[i]) / SLIDE, 0), 1);
        const x = 110 * (1 - slideEase(p));
        slideSum += x * widths[i];
        g.style.transform = x > 0.01 ? `translate3d(${x.toFixed(2)}%, 0, 0)` : "";
      });

      // 2. Wave: centre goes right -> left, strength swells in and dies
      //    out smoothly (zero slope at both ends).
      const life = Math.min(Math.max(t / wave, 0), 1);
      const centre = 1 + LEAD - span * legEase(life);
      // The tail is stretched (life ** 0.8) so the wave dies out slowly.
      // No wave on phones: it assumes the name is one line.
      const amp = isPhone() ? 0 : 2.8 * Math.sin(Math.PI * life ** 0.8) ** 2;

      // Stretch under the wave, then rescale so the widths still add up
      // to the resting width: the letters elsewhere get squeezed.
      const raw = centres.map((m) => 1 + amp * Math.exp(-((m - centre) ** 2) / (2 * sigma * sigma)));
      const sum = raw.reduce((a, r, i) => a + r * widths[i], 0);
      const k = total / sum;
      let x = 0;
      let offset = 0;
      chars.forEach((c, i) => {
        const sx = raw[i] * k;
        c.style.transform = amp > 0.001
          ? `translate3d(${(x - offset).toFixed(2)}px, 0, 0) scaleX(${sx.toFixed(4)})`
          : "";
        x += widths[i] * sx;
        offset += widths[i];
      });

      // 3. Morph serif -> sans.
      if (MORPH_FROM_SERIF) {
        centres.forEach((pos, i) => {
          // The crest only moves right to left, so this only grows.
          const m = Math.min(Math.max((pos + MORPH_AHEAD - centre) / MORPH_SPAN, 0), 1);
          const e = m * m * (3 - 2 * m);
          const blur = fontSize * 0.045 * Math.sin(Math.PI * m) ** 2;
          serifs[i].style.opacity = String(1 - e);
          sanses[i].style.opacity = String(e);
          const f = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : "";
          serifs[i].style.filter = f;
          sanses[i].style.filter = f;
          // Threshold per letter, only while it melts (inside the motion
          // blur, which is applied to the whole name afterwards).
          glyphs[i].style.filter = m > 0 && m < 1 ? "url(#name-goo)" : "";
        });
      }

      // Motion blur from both movements.
      const waveSpeed = lastCentre === null ? 0 : Math.abs(centre - lastCentre) * amp * 220;
      const slideSpeed = lastSlide === null ? 0 : Math.abs(slideSum - lastSlide) / total * 1.2;
      lastCentre = centre;
      lastSlide = slideSum;
      const blur = Math.min(Math.max(waveSpeed, slideSpeed), 10);
      blurDev.setAttribute("stdDeviation", `${blur.toFixed(2)} 0`);
    }

    const tween = gsap.to(state, {
      t: duration,
      duration,
      ease: "none",
      onUpdate: render,
      onComplete() {
        restName(name);
        blurDev.setAttribute("stdDeviation", "0 0");
      },
    });
    render();
    entrances.set(name, tween);
  }

  // Called before a jump from the list, so no poster animates on the way.
  let deferNames = () => {};

  if (window.gsap && !reduceMotion) {
    names.forEach(hideName);
    const nameSections = sections.map((s) => ({ section: s, name: s.querySelector(".bike__name") }));
    // Checked on every scroll frame (an IntersectionObserver misses a
    // poster that ends exactly at the screen edge, which scroll snap
    // makes the normal case).
    // When a scroll travels 2+ posters from where it started (a fast
    // flick, a jump from the list), the posters flying past don't
    // animate; the one it lands on waits until the scroll has come to
    // rest, plus a short delay.
    const JUMP_DELAY = 0.15; // seconds after the scroll stops
    const IDLE_MS = 60; // no scroll events for this long = at rest
    let restIndex = -1; // poster on screen when the scroll last stopped
    let idleTimer = 0;
    let jumping = false;
    const pending = new Set();
    deferNames = () => { jumping = true; };

    function onScreen(section) {
      const r = section.getBoundingClientRect();
      const vh = window.innerHeight;
      return Math.min(r.bottom, vh) - Math.max(r.top, 0);
    }

    function checkNames(atRest) {
      const vh = window.innerHeight;
      nameSections.forEach(({ section, name }, i) => {
        const visible = onScreen(section);
        if (visible >= vh * 0.55) {
          if (restIndex < 0) restIndex = i;
          if (entrances.has(name)) return;
          if (!jumping && Math.abs(i - restIndex) < 2) {
            playName(name);
          } else if (atRest) {
            pending.delete(name);
            entrances.set(name, gsap.delayedCall(JUMP_DELAY, () => {
              entrances.delete(name);
              if (onScreen(section) >= vh * 0.55) playName(name);
            }));
          } else {
            pending.add(name);
          }
        } else if (visible <= 1 && (entrances.has(name) || pending.has(name))) {
          // Off screen: reset, so it plays from scratch next time.
          entrances.get(name)?.kill();
          entrances.delete(name);
          pending.delete(name);
          hideName(name);
        }
      });
      if (atRest) {
        const current = nameSections.findIndex(({ section }) => onScreen(section) >= vh * 0.55);
        if (current >= 0) restIndex = current;
        jumping = false;
      }
    }
    let nameTick = false;
    window.addEventListener("scroll", () => {
      if (!nameTick) {
        nameTick = true;
        requestAnimationFrame(() => { nameTick = false; checkNames(false); });
      }
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => checkNames(true), IDLE_MS);
    }, { passive: true });
    document.fonts.ready.then(() => {
      layout();
      names.forEach((n) => { if (!entrances.has(n)) hideName(n); });
      checkNames(true);
    });
    window.addEventListener("resize", () => {
      names.forEach((n) => { if (!entrances.has(n)) hideName(n); });
      checkNames(true);
    });
  }

  // view list ↔ close list. On opening, the current bike's name is
  // scrolled onto the toggle's line, with the others above and below.
  const listNav = document.getElementById("bike-list");
  function setOpen(open) {
    if (open && isPhone()) {
      listItems.scrollTop = 0;
    } else if (open) {
      const li = listItems.querySelector(".is-current") || listItems.children[Math.floor(listItems.children.length / 2)];
      if (li) listNav.scrollTop = li.offsetTop + li.offsetHeight / 2 - listNav.clientHeight / 2;
    }
    document.body.classList.toggle("is-list-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    openWord.setAttribute("aria-hidden", String(open));
    closeWord.setAttribute("aria-hidden", String(!open));
  }
  toggle.addEventListener("click", () => {
    setOpen(!document.body.classList.contains("is-list-open"));
  });
  document.getElementById("list-close").addEventListener("click", () => setOpen(false));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { setOpen(false); setInfo(false); setLightbox(null); }
  });

  // manifesto ↔ close: the garage text over the whole screen.
  const infoToggle = document.getElementById("info-toggle");
  const info = document.getElementById("info");
  function setInfo(open) {
    if (open) setOpen(false);
    document.body.classList.toggle("is-info-open", open);
    infoToggle.textContent = open ? "close" : "manifesto";
    infoToggle.setAttribute("aria-expanded", String(open));
    info.setAttribute("aria-hidden", String(!open));
  }
  infoToggle.addEventListener("click", (e) => {
    e.preventDefault();
    setInfo(!document.body.classList.contains("is-info-open"));
  });

  listItems.addEventListener("click", (e) => {
    const li = e.target.closest(".bike-list__item");
    if (!li) return;
    e.preventDefault();
    const target = document.getElementById(li.dataset.target);
    history.replaceState(null, "", `#${li.dataset.target}`);
    setOpen(false);
    const go = () => {
      deferNames();
      target.scrollIntoView({ behavior: "smooth" });
    };
    // Phones: let the overlay fade out first, then scroll.
    if (isPhone()) setTimeout(go, 450);
    else go();
  });

  // Lightbox: tap a poster to see the whole image; "close" or a tap
  // anywhere on it closes it again.
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  function setLightbox(poster) {
    if (poster) {
      lightboxImg.src = poster.currentSrc || poster.src;
      lightboxImg.alt = poster.alt;
    }
    document.body.classList.toggle("is-lightbox-open", !!poster);
    lightbox.setAttribute("aria-hidden", String(!poster));
  }
  archive.addEventListener("click", (e) => {
    const section = e.target.closest(".bike");
    if (section) setLightbox(section.querySelector(".bike__poster"));
  });
  lightbox.addEventListener("click", () => setLightbox(null));

  // Mark the poster currently on screen in the list.
  const byTarget = new Map(Array.from(listItems.children).map((li) => [li.dataset.target, li]));
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        byTarget.forEach((li, id) => li.classList.toggle("is-current", id === entry.target.id));
      });
    },
    { threshold: 0.6 }
  );
  document.querySelectorAll(".bike").forEach((s) => observer.observe(s));
})();
