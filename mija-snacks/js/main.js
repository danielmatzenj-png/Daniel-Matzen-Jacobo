/* ============================================================
   MIJA Snacks — interactions
   ============================================================ */
(function () {
  "use strict";

  /* ---- Inline SVG assets (currentColor-aware, no fetch needed) ---- */
  const EMBLEM = `<svg viewBox="0 0 260 230" fill="currentColor" aria-hidden="true">
    <g fill="none" stroke="currentColor" stroke-width="9" stroke-linecap="round">
      <path d="M18 196 C 60 150, 100 148, 128 168"/><path d="M22 216 C 66 168, 104 166, 128 186"/>
      <path d="M242 196 C 200 150, 160 148, 132 168"/><path d="M238 216 C 194 168, 156 166, 132 186"/></g>
    <path d="M130 176 C 108 172, 96 150, 100 120 C 118 132, 130 152, 130 176 Z"/>
    <path d="M130 176 C 152 172, 164 150, 160 120 C 142 132, 130 152, 130 176 Z"/>
    <path d="M130 44 C 118 60, 116 96, 130 118 C 144 96, 142 60, 130 44 Z" opacity=".18"/>
    <circle cx="130" cy="56" r="6"/><circle cx="122" cy="66" r="5.5"/><circle cx="138" cy="66" r="5.5"/>
    <circle cx="130" cy="72" r="6"/><circle cx="121" cy="82" r="5.5"/><circle cx="139" cy="82" r="5.5"/>
    <circle cx="130" cy="88" r="6"/><circle cx="123" cy="99" r="5"/><circle cx="137" cy="99" r="5"/>
    <circle cx="130" cy="106" r="5.5"/>
    <g transform="translate(30 96)">
      <path d="M4 34 C 20 20, 44 14, 60 22 C 52 30, 40 34, 30 34 C 44 40, 56 42, 66 40 C 54 52, 34 54, 20 46 C 24 54, 30 60, 38 64 C 22 64, 8 52, 4 34 Z"/>
      <path d="M60 22 L 82 12 L 70 26 Z"/><path d="M6 8 C 14 14, 16 24, 12 32 C 4 26, 2 16, 6 8 Z"/></g>
    <g transform="translate(168 92)">
      <path d="M8 74 L 44 14 L 80 74 Z"/>
      <path d="M32 42 L 44 26 L 56 42 L 49 40 L 44 46 L 39 40 Z" fill="#fff" opacity=".85"/>
      <path d="M52 12 C 52 4, 64 2, 68 8 C 78 4, 88 12, 82 20 L 52 20 C 48 18, 48 14, 52 12 Z"/></g></svg>`;

  const KERNELS = `<svg viewBox="0 0 200 170" aria-hidden="true">
    <defs>
      <radialGradient id="kk1" cx="38%" cy="30%" r="80%"><stop offset="0%" stop-color="#ffe08a"/><stop offset="45%" stop-color="#f6b323"/><stop offset="100%" stop-color="#d98317"/></radialGradient>
      <linearGradient id="kk2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#c96a12"/><stop offset="100%" stop-color="#8a4409"/></linearGradient>
    </defs>
    <g stroke="#7a3d09" stroke-width="3">
      <g transform="translate(96 34) rotate(8)"><path d="M0 -26 C 26 -26, 32 0, 26 20 C 20 34, -20 34, -26 20 C -32 0, -26 -26, 0 -26 Z" fill="url(#kk1)"/><path d="M0 -20 C 4 -6, 4 12, 0 26" fill="none" stroke="url(#kk2)" stroke-width="4" stroke-linecap="round"/></g>
      <g transform="translate(58 92) rotate(-14)"><path d="M0 -28 C 28 -28, 34 0, 28 22 C 22 37, -22 37, -28 22 C -34 0, -28 -28, 0 -28 Z" fill="url(#kk1)"/><path d="M0 -22 C 4 -6, 4 14, 0 28" fill="none" stroke="url(#kk2)" stroke-width="4" stroke-linecap="round"/></g>
      <g transform="translate(140 96) rotate(16)"><path d="M0 -28 C 28 -28, 34 0, 28 22 C 22 37, -22 37, -28 22 C -34 0, -28 -28, 0 -28 Z" fill="url(#kk1)"/><path d="M0 -22 C 4 -6, 4 14, 0 28" fill="none" stroke="url(#kk2)" stroke-width="4" stroke-linecap="round"/></g>
      <g transform="translate(100 126) rotate(-4)"><path d="M0 -26 C 26 -26, 32 0, 26 20 C 20 34, -20 34, -26 20 C -32 0, -26 -26, 0 -26 Z" fill="url(#kk1)"/><path d="M0 -20 C 4 -6, 4 12, 0 26" fill="none" stroke="url(#kk2)" stroke-width="4" stroke-linecap="round"/></g>
    </g></svg>`;

  const KERNEL_ONE = `<svg viewBox="-40 -40 80 80" aria-hidden="true"><defs><radialGradient id="ko" cx="38%" cy="30%" r="80%"><stop offset="0%" stop-color="#ffe08a"/><stop offset="45%" stop-color="#f6b323"/><stop offset="100%" stop-color="#d98317"/></radialGradient></defs><path d="M0 -30 C 30 -30, 36 0, 30 24 C 24 40, -24 40, -30 24 C -36 0, -30 -30, 0 -30 Z" fill="url(#ko)" stroke="#7a3d09" stroke-width="3"/><path d="M0 -24 C 5 -6, 5 16, 0 30" fill="none" stroke="#9a5510" stroke-width="4" stroke-linecap="round"/></svg>`;

  const ICONS = {
    gf: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c-3 3-3 7 0 10 3-3 3-7 0-10Z"/><path d="M12 21v-8"/><path d="M12 13c2 1 4 0 5-2-2-1-4 0-5 2Z"/><path d="M4 4l16 16"/></svg>`,
    gmo: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a4 4 0 0 0 8 0V3"/><path d="M8 21v-3a4 4 0 0 1 8 0v3"/><path d="M8 8h8"/><path d="M8 16h8"/></svg>`,
    zero: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M6 6l12 12"/></svg>`,
    vegan: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20C4 12 9 5 20 4c0 11-7 16-15 16Z"/><path d="M4 20c2-5 6-8 11-9"/></svg>`
  };
  const SOCIAL = {
    ig: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none"/></svg>`,
    tt: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 3c.3 2.1 1.6 3.8 3.7 4.1v2.7c-1.4 0-2.7-.4-3.7-1.1v5.7a5.7 5.7 0 1 1-5.7-5.7c.3 0 .6 0 .9.1v2.8a2.9 2.9 0 1 0 2 2.8V3H16Z"/></svg>`,
    fb: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 22v-8h2.7l.4-3H13V9c0-.9.3-1.5 1.6-1.5H16V4.8C15.7 4.8 14.8 4.7 13.8 4.7c-2.2 0-3.8 1.4-3.8 3.9V11H7.5v3H10v8h3Z"/></svg>`
  };

  /* ---- Inject SVGs into placeholders ---- */
  document.querySelectorAll("[data-emblem]").forEach(el => el.innerHTML = EMBLEM);
  document.querySelectorAll("[data-kernels]").forEach(el => el.innerHTML = KERNELS);
  document.querySelectorAll("[data-icon]").forEach(el => el.innerHTML = ICONS[el.dataset.icon] || "");
  document.querySelectorAll("[data-social]").forEach(el => el.innerHTML = SOCIAL[el.dataset.social] || "");

  /* ---- Year ---- */
  const y = document.getElementById("year"); if (y) y.textContent = new Date().getFullYear();

  /* ---- Language ---- */
  const dict = window.MIJA_I18N || {};
  const applyLang = (lang) => {
    const t = dict[lang]; if (!t) return;
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const k = el.getAttribute("data-i18n");
      if (t[k] != null) el.textContent = t[k];
    });
    document.querySelectorAll(".lang-toggle__opt").forEach(o =>
      o.classList.toggle("is-active", o.dataset.lang === lang));
    try { localStorage.setItem("mija_lang", lang); } catch (e) {}
  };
  let savedLang = "es";
  try { savedLang = localStorage.getItem("mija_lang") || "es"; } catch (e) {}
  applyLang(savedLang);
  const langToggle = document.getElementById("langToggle");
  if (langToggle) langToggle.addEventListener("click", () => {
    const next = document.documentElement.lang === "es" ? "en" : "es";
    applyLang(next);
  });

  /* ---- Mobile menu ---- */
  const burger = document.getElementById("burger");
  if (burger) {
    burger.addEventListener("click", () => {
      const open = document.body.classList.toggle("menu-open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.querySelectorAll(".nav__links a").forEach(a =>
      a.addEventListener("click", () => {
        document.body.classList.remove("menu-open");
        burger.setAttribute("aria-expanded", "false");
      }));
  }

  /* ---- Nav scrolled state + progress bar ---- */
  const nav = document.getElementById("nav");
  const progress = document.getElementById("scrollProgress");
  const onScroll = () => {
    const sc = window.scrollY || document.documentElement.scrollTop;
    if (nav) nav.classList.toggle("is-scrolled", sc > 60);
    if (progress) {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (h > 0 ? (sc / h) * 100 : 0) + "%";
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- Reveal on scroll ---- */
  const revObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("is-in"); revObserver.unobserve(e.target); } });
  }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
  document.querySelectorAll(".reveal,.reveal-x").forEach(el => revObserver.observe(el));

  /* ---- Count-up stats ---- */
  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target, end = parseFloat(el.dataset.count) || 0, suffix = el.dataset.suffix || "";
      const dur = 1400, t0 = performance.now();
      const tick = (t) => {
        const p = Math.min((t - t0) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(end * eased) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      countObserver.unobserve(el);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll("[data-count]").forEach(el => countObserver.observe(el));

  /* ---- Marquee ---- */
  const marquee = document.getElementById("marquee");
  if (marquee) {
    const phrase = "GLUTEN FREE — NON GMO — 0% CONSERVANTES — VEGAN — MAÍZ DE VERDAD — ";
    const unit = `<span>${phrase.repeat(2)}</span>`;
    marquee.innerHTML = unit + unit;
  }

  /* ---- Floating hero kernels (parallax) ---- */
  const heroKernels = document.getElementById("heroKernels");
  const kernelEls = [];
  if (heroKernels) {
    const spots = [
      { x: 8, y: 18, s: 46, sp: 0.14 }, { x: 84, y: 14, s: 62, sp: 0.22 },
      { x: 16, y: 66, s: 54, sp: 0.10 }, { x: 90, y: 60, s: 40, sp: 0.30 },
      { x: 70, y: 78, s: 58, sp: 0.18 }, { x: 30, y: 84, s: 38, sp: 0.26 },
      { x: 50, y: 10, s: 34, sp: 0.34 }
    ];
    spots.forEach((s, i) => {
      const d = document.createElement("div");
      d.className = "hero__kernel";
      d.style.cssText = `left:${s.x}%;top:${s.y}%;--s:${s.s}px;transform:rotate(${i * 47}deg)`;
      d.innerHTML = KERNEL_ONE;
      d.dataset.sp = s.sp;
      d.dataset.rot = i * 47;
      heroKernels.appendChild(d);
      kernelEls.push(d);
    });
  }
  let ticking = false;
  const parallax = () => {
    const sc = window.scrollY;
    kernelEls.forEach(d => {
      const sp = parseFloat(d.dataset.sp), rot = parseFloat(d.dataset.rot);
      d.style.transform = `translateY(${-sc * sp}px) rotate(${rot + sc * 0.04}deg)`;
    });
    ticking = false;
  };
  if (kernelEls.length && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.addEventListener("scroll", () => {
      if (!ticking) { requestAnimationFrame(parallax); ticking = true; }
    }, { passive: true });
  }

  /* ---- Flavor theme switching ---- */
  const flavors = document.getElementById("sabores");
  const THEMES = {
    sal:   { bg: "#0f1e50", halo: "rgba(143,205,239,.40)", tag: "#bfe0f2", accent: "#7fc0e6" },
    bbq:   { bg: "#b8241a", halo: "rgba(246,203,166,.45)", tag: "#f6cba6", accent: "#f6cba6" },
    chili: { bg: "#8f9a1f", halo: "rgba(238,240,196,.5)",  tag: "#f2f4d0", accent: "#eef0c4" }
  };
  const applyTheme = (key) => {
    const th = THEMES[key]; if (!th || !flavors) return;
    flavors.style.background = th.bg;
    document.querySelectorAll(".flavor").forEach(f => {
      f.style.setProperty("--halo", th.halo);
      f.style.setProperty("--tag", th.tag);
    });
  };
  const flavorObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) applyTheme(e.target.dataset.flavor); });
  }, { threshold: 0.55 });
  document.querySelectorAll(".flavor").forEach(f => flavorObserver.observe(f));
  applyTheme("sal");

  /* ---- Pouch tilt on pointer ---- */
  if (!matchMedia("(hover: none)").matches) {
    document.querySelectorAll(".pouch").forEach(p => {
      const wrap = p.closest(".flavor__bagwrap");
      wrap.addEventListener("pointermove", (ev) => {
        const r = wrap.getBoundingClientRect();
        const rx = ((ev.clientY - r.top) / r.height - 0.5) * -10;
        const ry = ((ev.clientX - r.left) / r.width - 0.5) * 12;
        p.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
      });
      wrap.addEventListener("pointerleave", () => { p.style.transform = ""; });
    });
  }

})();
