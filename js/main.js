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
      <img class="bike__poster" alt="" loading="${i < 2 ? "eager" : "lazy"}" />
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
    Array.from(bike.name).forEach((ch) => {
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
      inner.appendChild(c);
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
  function fitNames() {
    const cap = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--name-max")) || 160;
    names.forEach((el) => {
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
  function layout() {
    fitNames();
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
  // With MORPH_FROM_SERIF, the letters slide in as serif and melt into
  // the sans: the two cross-fade under a "goo" filter (blur + hard alpha
  // threshold), which blends their outlines into one changing shape.
  const blurDev = document.getElementById("name-blur-dev");
  const gooDev = document.getElementById("name-goo-dev");
  const MORPH_FROM = 0.3; // morph starts at this share of the wave
  const MORPH_TAIL = 0.35; // and ends this long after the wave
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
    name.querySelectorAll(".bike__serif").forEach((s) => { s.style.opacity = e === null ? "" : String(1 - e); });
    name.querySelectorAll(".bike__sans").forEach((s) => { s.style.opacity = e === null ? "" : String(e); });
  }

  function hideName(name) {
    const inner = name.firstElementChild;
    inner.style.visibility = "hidden";
    inner.style.filter = "none";
    name.style.filter = "";
    if (MORPH_FROM_SERIF) setMorph(name, 0);
    Array.from(inner.children).forEach((c) => {
      c.style.transform = "";
      c.firstElementChild.style.transform = "translate3d(110%, 0, 0)";
    });
  }

  function restName(name) {
    const inner = name.firstElementChild;
    inner.style.visibility = "";
    inner.style.filter = "none";
    name.style.filter = "";
    if (MORPH_FROM_SERIF) setMorph(name, null);
    Array.from(inner.children).forEach((c) => {
      c.style.transform = "";
      c.firstElementChild.style.transform = "";
    });
  }

  function playName(name) {
    const inner = name.firstElementChild;
    const chars = Array.from(inner.children);
    const glyphs = chars.map((c) => c.firstElementChild);
    entrances.get(name)?.kill();
    restName(name);

    // Resting geometry: each letter's width and centre (0..1 of the name).
    const widths = chars.map((c) => c.offsetWidth);
    const total = widths.reduce((a, b) => a + b, 0) || 1;
    let acc = 0;
    const centres = widths.map((w) => { const m = (acc + w / 2) / total; acc += w; return m; });
    const sigma = Math.max(0.09, 1.2 / chars.length);
    const n = chars.length;
    // Last letter first.
    const starts = chars.map((_, i) => (n - 1 - i) * STAGGER);
    const slideEnd = (n - 1) * STAGGER + SLIDE;
    // The wave crosses the word in the time all letters take to land.
    const wave = Math.max(slideEnd, 0.6);
    const span = 1 + 2 * LEAD;

    inner.style.filter = "url(#name-blur)";
    const state = { t: 0 };
    const duration = MORPH_FROM_SERIF ? wave + MORPH_TAIL : wave;

    // Morph: stretch each serif glyph over its sans slot.
    const serifs = MORPH_FROM_SERIF ? chars.map((c) => c.querySelector(".bike__serif")) : [];
    serifs.forEach((s, i) => {
      s.style.transform = `scaleX(${(widths[i] / (s.offsetWidth || 1)).toFixed(4)})`;
    });
    const fontSize = parseFloat(getComputedStyle(name).fontSize) || 160;
    const morphStart = wave * MORPH_FROM;
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
      const amp = 1.6 * Math.sin(Math.PI * life ** 0.8) ** 2;

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
        const m = Math.min(Math.max((t - morphStart) / (duration - morphStart), 0), 1);
        const e = m * m * (3 - 2 * m);
        setMorph(name, e);
        const goo = fontSize * 0.05 * Math.sin(Math.PI * m) ** 3;
        gooDev.setAttribute("stdDeviation", goo.toFixed(2));
        name.style.filter = goo > 0.05 ? "url(#name-goo)" : "";
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

  if (window.gsap && !reduceMotion) {
    names.forEach(hideName);
    const nameSections = sections.map((s) => ({ section: s, name: s.querySelector(".bike__name") }));
    // Checked on every scroll frame (an IntersectionObserver misses a
    // poster that ends exactly at the screen edge, which scroll snap
    // makes the normal case).
    function checkNames() {
      const vh = window.innerHeight;
      nameSections.forEach(({ section, name }) => {
        const r = section.getBoundingClientRect();
        const visible = Math.min(r.bottom, vh) - Math.max(r.top, 0);
        if (visible >= vh * 0.55) {
          if (!entrances.has(name)) playName(name);
        } else if (visible <= 1 && entrances.has(name)) {
          // Off screen: reset, so it plays from scratch next time.
          entrances.get(name).kill();
          entrances.delete(name);
          hideName(name);
        }
      });
    }
    let nameTick = false;
    window.addEventListener("scroll", () => {
      if (!nameTick) {
        nameTick = true;
        requestAnimationFrame(() => { nameTick = false; checkNames(); });
      }
    }, { passive: true });
    document.fonts.ready.then(() => {
      layout();
      names.forEach((n) => { if (!entrances.has(n)) hideName(n); });
      checkNames();
    });
    window.addEventListener("resize", () => {
      names.forEach((n) => { if (!entrances.has(n)) hideName(n); });
      checkNames();
    });
  }

  // view list ↔ close list. On opening, the current bike's name is
  // scrolled onto the toggle's line, with the others above and below.
  const listNav = document.getElementById("bike-list");
  function setOpen(open) {
    if (open) {
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
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });

  listItems.addEventListener("click", (e) => {
    const li = e.target.closest(".bike-list__item");
    if (!li) return;
    e.preventDefault();
    document.getElementById(li.dataset.target).scrollIntoView({ behavior: "smooth" });
    history.replaceState(null, "", `#${li.dataset.target}`);
    setOpen(false);
  });

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
