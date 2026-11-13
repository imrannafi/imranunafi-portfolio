/* NAFI.DEV — interactions */
(() => {
  const root = document.documentElement;

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  /* ---------- Theme ---------- */
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* ignore */ } },
  };
  const savedTheme = store.get("theme");
  if (savedTheme) root.dataset.theme = savedTheme;

  $("#themeToggle").addEventListener("click", () => {
    const next = root.dataset.theme === "light" ? "dark" : "light";
    root.dataset.theme = next;
    store.set("theme", next);
  });

  /* ---------- Header + scroll rail ---------- */
  const header = $("#header");
  const rail = $("#scrollRail");
  const about = $("#about");
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle("is-scrolled", y > 30);
    rail.classList.toggle("is-hidden", y > about.offsetTop + about.offsetHeight * 0.5);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile nav ---------- */
  const burger = $("#burger");
  const nav = $("#nav");
  const closeNav = () => { nav.classList.remove("is-open"); burger.classList.remove("is-open"); };
  burger.addEventListener("click", () => {
    nav.classList.toggle("is-open");
    burger.classList.toggle("is-open");
  });
  $$(".nav__link").forEach((a) => a.addEventListener("click", closeNav));

  /* ---------- Scroll spy ---------- */
  const links = $$(".nav__link");
  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        links.forEach((l) => l.classList.toggle("is-active", l.getAttribute("href") === "#" + e.target.id));
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  ["home", "about", "leadership", "projects", "research", "skills", "services", "contact"].forEach((id) => spy.observe(document.getElementById(id)));

  /* ---------- Reveal on scroll ---------- */
  const revealer = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("is-in"); revealer.unobserve(e.target); }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  // stagger siblings in grids
  $$(".cards, .stack, .info, .about__grid, .hero__bottom, .venture").forEach((group) => {
    $$(".reveal", group).forEach((el, i) => (el.style.transitionDelay = `${Math.min(i, 8) * 70}ms`));
  });
  $$(".reveal").forEach((el) => revealer.observe(el));

  /* ---------- Skill bars ---------- */
  const bars = $("#bars");
  const barObserver = new IntersectionObserver(
    (entries) => {
      if (!entries[0].isIntersecting) return;
      $$(".bar__fill", bars).forEach((f) => (f.style.width = f.dataset.value + "%"));
      $$(".bar__pct", bars).forEach((p) => {
        const target = +p.dataset.value;
        const start = performance.now();
        const dur = 1400;
        const tick = (t) => {
          const k = Math.min((t - start) / dur, 1);
          p.textContent = Math.round(target * (1 - Math.pow(1 - k, 3))) + "%";
          if (k < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
      barObserver.disconnect();
    },
    { threshold: 0.3 }
  );
  barObserver.observe(bars);

  /* ---------- Tech stack marquee ---------- */
  const stack = $("#stack");
  // Duplicate each row once so translating the track by -50% loops seamlessly.
  $$(".marquee__track", stack).forEach((track) => {
    $$(".tile", track).forEach((t) => {
      const c = t.cloneNode(true);
      c.classList.add("is-clone");
      c.setAttribute("aria-hidden", "true");
      track.appendChild(c);
    });
  });
  // "View All" switches between the moving marquee and a static grid.
  const explore = $("#exploreMore");
  explore.addEventListener("click", (e) => {
    e.preventDefault();
    const grid = stack.classList.toggle("is-grid");
    explore.firstChild.textContent = grid ? "Show Marquee " : "View All ";
  });

  /* ---------- Projects / Research tabs ---------- */
  const research = $("#research");
  $$(".tab").forEach((tab) =>
    tab.addEventListener("click", () => {
      if (tab.dataset.tab === "papers") research.scrollIntoView({ behavior: "smooth" });
    })
  );

  /* ---------- Search ---------- */
  const search = $("#search");
  const input = $("#searchInput");
  const results = $("#searchResults");

  const index = [
    ...$$(".pcard").map((el) => ({ el, type: "Project", title: $("h3", el).textContent })),
    ...$$(".pub").map((el) => ({ el, type: "Research", title: $("h3", el).textContent })),
    ...$$(".scard").map((el) => ({ el, type: "Service", title: $("h3", el).textContent })),
    ...$$(".tile:not(.is-clone)").map((el) => ({ el, type: "Skill", title: $("span", el).textContent })),
  ].map((item) => ({ ...item, text: (item.title + " " + (item.el.dataset.search || "")).toLowerCase() }));

  const render = (q) => {
    q = q.trim().toLowerCase();
    const hits = q ? index.filter((i) => q.split(/\s+/).every((w) => i.text.includes(w))) : index.slice(0, 9);
    results.innerHTML = hits.length
      ? ""
      : `<li class="search__empty">No results for “${q.replace(/[<>&"]/g, "")}”</li>`;
    hits.slice(0, 12).forEach((h, n) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = "#";
      a.innerHTML = `<span></span><small>${h.type}</small>`;
      a.firstChild.textContent = h.title;
      a.addEventListener("click", (e) => {
        e.preventDefault();
        closeSearch();
        if (h.type === "Skill" && !stack.classList.contains("is-grid")) explore.click();
        h.el.scrollIntoView({ behavior: "smooth", block: "center" });
        h.el.animate(
          [{ boxShadow: "0 0 0 2px currentColor" }, { boxShadow: "0 0 0 2px transparent" }],
          { duration: 1600, delay: 500, easing: "ease-out" }
        );
      });
      li.appendChild(a);
      results.appendChild(li);
    });
  };

  const openSearch = () => {
    search.classList.add("is-open");
    search.setAttribute("aria-hidden", "false");
    render(input.value);
    setTimeout(() => input.focus(), 60);
  };
  const closeSearch = () => {
    search.classList.remove("is-open");
    search.setAttribute("aria-hidden", "true");
  };

  $("#searchOpen").addEventListener("click", openSearch);
  $("#searchClose").addEventListener("click", closeSearch);
  search.addEventListener("click", (e) => { if (e.target === search) closeSearch(); });
  input.addEventListener("input", () => render(input.value));
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { const first = $("a", results); if (first) first.click(); }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { closeSearch(); closeNav(); }
    if ((e.key === "/" || (e.key === "k" && (e.ctrlKey || e.metaKey))) && !/input|textarea/i.test(document.activeElement.tagName)) {
      e.preventDefault();
      openSearch();
    }
  });

  /* ---------- Contact form ---------- */
  const form = $("#contactForm");
  const status = $("#formStatus");
  const CONTACT_EMAIL = "imrannafi226@gmail.com";

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    let ok = true;
    $$("input, textarea", form).forEach((f) => {
      const bad = !f.value.trim() || (f.type === "email" && !/^\S+@\S+\.\S+$/.test(f.value));
      f.closest(".field").classList.toggle("is-invalid", bad);
      if (bad) ok = false;
    });
    if (!ok) {
      status.className = "form__status err";
      status.textContent = "Please fill in all required fields with a valid email.";
      return;
    }
    const d = Object.fromEntries(new FormData(form));
    const body = `${d.message}\n\n— ${d.name} (${d.email})`;
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(d.subject)}&body=${encodeURIComponent(body)}`;
    status.className = "form__status ok";
    status.textContent = "Thanks! Your email app should open with the message ready to send.";
    form.reset();
  });
  $$("input, textarea", form).forEach((f) =>
    f.addEventListener("input", () => f.closest(".field").classList.remove("is-invalid"))
  );

  /* ---------- Download CV modal ---------- */
  const dl = $("#dlModal");
  const dlNote = $("#dlNote");
  let lastFocus = null;
  const openDl = () => {
    lastFocus = document.activeElement;
    dlNote.textContent = "";
    $$(".dl-opt", dl).forEach((o) => o.classList.remove("is-done"));
    dl.classList.add("is-open");
    dl.setAttribute("aria-hidden", "false");
    root.classList.add("modal-open");
    setTimeout(() => $(".dl-modal__dialog", dl).focus({ preventScroll: true }), 80);
  };
  const closeDl = () => {
    if (!dl.classList.contains("is-open")) return;
    dl.classList.remove("is-open");
    dl.setAttribute("aria-hidden", "true");
    root.classList.remove("modal-open");
    if (lastFocus) lastFocus.focus();
  };
  $("#cvOpen").addEventListener("click", (e) => { e.preventDefault(); openDl(); });
  $$("[data-close]", dl).forEach((el) => el.addEventListener("click", closeDl));
  dl.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { e.stopPropagation(); closeDl(); }
    if (e.key !== "Tab") return; // keep focus inside the dialog
    const f = $$("button, a[href]", dl);
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  // Native <a download> starts the download; we only confirm it and tidy up.
  $$(".dl-opt", dl).forEach((opt) => {
    opt.addEventListener("click", () => {
      opt.classList.add("is-done");
      dlNote.textContent = `Downloading ${$("b", opt).textContent}…`;
      setTimeout(closeDl, 900);
    });
    // subtle 3D tilt that follows the pointer (mouse / pen only)
    opt.addEventListener("pointermove", (e) => {
      if (e.pointerType === "touch") return;
      const r = opt.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      opt.style.setProperty("--ry", (x * 8).toFixed(2) + "deg");
      opt.style.setProperty("--rx", (-y * 10).toFixed(2) + "deg");
    });
    opt.addEventListener("pointerleave", () => { opt.style.setProperty("--rx", "0deg"); opt.style.setProperty("--ry", "0deg"); });
  });

  /* ---------- Footer year ---------- */
  $("#year").textContent = new Date().getFullYear();
})();
