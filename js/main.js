(function () {
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
    // One span per letter (for the rise), inside one span that gets
    // squashed and stretched as a whole.
    const name = section.querySelector(".bike__name");
    name.setAttribute("aria-label", bike.name);
    const inner = document.createElement("span");
    inner.className = "bike__name-inner";
    inner.setAttribute("aria-hidden", "true");
    Array.from(bike.name).forEach((ch) => {
      const c = document.createElement("span");
      c.className = "bike__char";
      c.textContent = ch;
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
  // offsetWidth ignores the squash/stretch transform.
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
  // The list sits right of the toggle (as wide as "close list") and
  // ends where the tallest caption (year + big name) begins.
  const root = document.documentElement;
  function layout() {
    fitNames();
    root.style.setProperty("--toggle-w", `${toggle.offsetWidth}px`);
    const captions = Array.from(document.querySelectorAll(".bike__caption"));
    const tallest = Math.max(0, ...captions.map((c) => c.offsetHeight));
    const gutter = captions[0] ? parseFloat(getComputedStyle(captions[0]).bottom) : 0;
    root.style.setProperty("--list-bottom", `${Math.ceil(tallest + gutter + 16)}px`);
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

  // Name entrance, played each time a poster snaps into view:
  // 1. the letters rise from below the screen edge one after another,
  // 2. meanwhile the whole word squashes towards the left,
  // 3. then stretches like rubber across the full screen width,
  // 4. and springs back into its final shape.
  // A horizontal blur follows the squash/stretch speed (motion blur).
  const blurDev = document.getElementById("name-blur-dev");
  const entrances = new Map();

  function hideName(name) {
    const inner = name.firstElementChild;
    const chars = inner.children;
    const gutter = parseFloat(getComputedStyle(name.parentElement).bottom) || 0;
    gsap.set(inner, { scaleX: 1, filter: "none" });
    // Far enough down to start below the bottom edge of the screen.
    gsap.set(chars, { y: inner.offsetHeight + gutter + 40 });
  }

  function playName(name) {
    const inner = name.firstElementChild;
    const chars = inner.children;
    const natural = inner.offsetWidth || 1;
    const left = inner.getBoundingClientRect().left;
    // Rubber stretch reaches the right screen edge (at least +4%).
    const stretch = Math.max((window.innerWidth - left) / natural, 1.04);

    entrances.get(name)?.kill();
    hideName(name);
    inner.style.filter = "url(#name-blur)";

    let lastScale = 1;
    const tl = gsap.timeline({
      onUpdate() {
        const s = gsap.getProperty(inner, "scaleX");
        const speed = Math.abs(s - lastScale);
        lastScale = s;
        // Blur is applied before scaling, so divide it back out.
        const blur = Math.min(speed * 260, 28) / Math.max(s, 0.2);
        blurDev.setAttribute("stdDeviation", `${blur.toFixed(2)} 0`);
      },
      onComplete() {
        inner.style.filter = "none";
        blurDev.setAttribute("stdDeviation", "0 0");
      },
    });
    tl.to(chars, { y: 0, duration: 1.0, ease: "expo.out", stagger: 0.045 }, 0)
      .to(inner, { scaleX: 0.32, duration: 0.55, ease: "power3.out" }, 0.12)
      .to(inner, { scaleX: stretch, duration: 0.5, ease: "power3.inOut" }, 0.62)
      .to(inner, { scaleX: 1, duration: 1.3, ease: "elastic.out(1.1, 0.32)" }, 1.12);
    entrances.set(name, tl);
  }

  if (window.gsap && !reduceMotion) {
    names.forEach(hideName);
    const nameObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const name = entry.target.querySelector(".bike__name");
          if (entry.intersectionRatio >= 0.55) {
            if (!entrances.has(name)) playName(name);
          } else if (!entry.isIntersecting) {
            // Fully off screen: reset, so it plays again next time.
            entrances.get(name)?.kill();
            entrances.delete(name);
            hideName(name);
          }
        });
      },
      { threshold: [0, 0.55] }
    );
    document.fonts.ready.then(() => {
      layout();
      sections.forEach((s) => nameObserver.observe(s));
    });
    window.addEventListener("resize", () => {
      // Keep resting names in place; hidden ones need the new offset.
      names.forEach((n) => { if (!entrances.has(n)) hideName(n); });
    });
  }

  // "bike archive" keeps switching typefaces.
  const title = document.getElementById("topbar-title");
  const faces = [
    { family: "Instrument Serif", weight: 400, style: "normal" },
    { family: "Bodoni Moda", weight: 700, style: "italic" },
    { family: "Space Mono", weight: 400, style: "normal" },
    { family: "Syne", weight: 800, style: "normal" },
    { family: "Unbounded", weight: 600, style: "normal" },
    { family: "Fraunces", weight: 300, style: "italic" },
    { family: "Pixelify Sans", weight: 400, style: "normal" },
    { family: "Rubik Mono One", weight: 400, style: "normal" },
    { family: "Major Mono Display", weight: 400, style: "normal" },
    { family: "Inter Tight", weight: 400, style: "normal" },
  ];
  function setFace(f) {
    title.style.fontFamily = `"${f.family}", var(--font-sans)`;
    title.style.fontWeight = f.weight;
    title.style.fontStyle = f.style;
  }
  setFace(faces[0]);
  if (!reduceMotion) {
    // Only start once every face is in, so it never flashes a fallback.
    Promise.all(faces.map((f) => document.fonts.load(`${f.style} ${f.weight} 16px "${f.family}"`, "bike archive")))
      .catch(() => {})
      .then(() => {
        let i = 0;
        setInterval(() => {
          i = (i + 1) % faces.length;
          setFace(faces[i]);
        }, 320);
      });
  }

  // view list ↔ close list
  function setOpen(open) {
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
