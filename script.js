// ====== Config ======
const KIWIFY_URL = "https://pay.kiwify.com.br/1KigeG6?afid=9CPRLwto";

// ====== Motion / Perf ======
const mqReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
let prefersReducedMotion = mqReduced.matches;
mqReduced.addEventListener?.("change", (e) => (prefersReducedMotion = e.matches));

const rafThrottle = (fn) => {
  let raf = 0;
  return (...args) => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      fn(...args);
    });
  };
};

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

// ====== Helpers ======
function setAllCtasToKiwify() {
  // Atualiza links já existentes
  const anchors = document.querySelectorAll('a[href*="pay.kiwify.com.br"]');
  anchors.forEach((a) => {
    a.href = KIWIFY_URL;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
  });

  // Atualiza links adicionados depois (caso você injete algo via JS)
  const mo = new MutationObserver(
    rafThrottle(() => {
      const newAnchors = document.querySelectorAll('a[href*="pay.kiwify.com.br"]');
      newAnchors.forEach((a) => {
        if (a.__kiwifyBound) return;
        a.__kiwifyBound = true;
        a.href = KIWIFY_URL;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
      });
    })
  );
  mo.observe(document.body, { childList: true, subtree: true });
}

function hideLoader() {
  const loader = document.getElementById("loader");
  if (!loader) return;

  loader.classList.add("is-hidden");

  // remove do DOM depois para não atrapalhar tabulação
  const removeDelay = prefersReducedMotion ? 0 : 450;
  window.setTimeout(() => loader.remove(), removeDelay);
}

// ====== Smooth anchor scroll (melhor UX) ======
function smoothAnchors() {
  const isLocalAnchor = (href) => href && href.startsWith("#") && href.length > 1;

  document.addEventListener("click", (e) => {
    const a = e.target.closest?.("a");
    if (!a) return;

    const href = a.getAttribute("href");
    if (!isLocalAnchor(href)) return;

    const target = document.querySelector(href);
    if (!target) return;

    e.preventDefault();

    const topbar = document.querySelector(".topbar");
    const offset = topbar ? topbar.getBoundingClientRect().height + 12 : 12;

    const y = window.scrollY + target.getBoundingClientRect().top - offset;

    if (prefersReducedMotion) {
      window.scrollTo(0, y);
      return;
    }

    window.scrollTo({ top: y, behavior: "smooth" });
    // acessibilidade: foco no destino
    target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
    window.setTimeout(() => target.removeAttribute("tabindex"), 600);
  });
}

// ====== Reveal / Stagger (mais suave e consistente) ======
function revealOnScroll() {
  const revealEls = document.querySelectorAll(".reveal, .stagger");
  if (!revealEls.length) return;

  if (prefersReducedMotion) {
    revealEls.forEach((el) => el.classList.add("is-in"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const el = entry.target;
        el.classList.add("is-in");

        // Stagger: aplica delay nos filhos (com clamp)
        if (el.classList.contains("stagger")) {
          const step = clamp(Number(el.getAttribute("data-stagger") || "70"), 35, 140);
          const kids = Array.from(el.children);
          kids.forEach((kid, i) => {
            kid.style.transitionDelay = `${i * step}ms`;
          });
        }

        io.unobserve(el);
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
  );

  revealEls.forEach((el) => io.observe(el));
}

// ====== Counters (mais estável, com formatação) ======
function animateCounters() {
  const counters = document.querySelectorAll(".counter");
  if (!counters.length) return;

  const format = (num) => {
    // respeita pt-BR com separador (ex: 12.345)
    return new Intl.NumberFormat("pt-BR").format(num);
  };

  if (prefersReducedMotion) {
    counters.forEach((c) => {
      const to = Number(c.dataset.to || "0");
      const suffix = c.dataset.suffix || "";
      c.textContent = `${format(to)}${suffix}`;
    });
    return;
  }

  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const el = entry.target;
        const to = Number(el.dataset.to || "0");
        const suffix = el.dataset.suffix || "";
        const duration = clamp(Number(el.dataset.duration || "900"), 450, 2200);
        const start = performance.now();

        const tick = (now) => {
          const t = Math.min(1, (now - start) / duration);
          const eased = easeOutCubic(t);
          const value = Math.round(to * eased);
          el.textContent = `${format(value)}${suffix}`;
          if (t < 1) requestAnimationFrame(tick);
        };

        requestAnimationFrame(tick);
        io.unobserve(el);
      });
    },
    { threshold: 0.35, rootMargin: "0px 0px -10% 0px" }
  );

  counters.forEach((el) => io.observe(el));
}

// ====== Microinterações (glow/hover mais “premium”) ======
function enhanceHoverPop() {
  if (prefersReducedMotion) return;

  // Aplica tilt sutil (desktop) em elementos marcados com .hover-pop
  const items = document.querySelectorAll(".hover-pop");
  if (!items.length) return;

  const isFinePointer = window.matchMedia("(pointer:fine)").matches;
  if (!isFinePointer) return;

  const onMove = (el, e) => {
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width; // 0..1
    const py = (e.clientY - r.top) / r.height; // 0..1
    const rx = (py - 0.5) * -4; // tilt
    const ry = (px - 0.5) * 6;
    el.style.transform = `translateY(-3px) rotateX(${rx}deg) rotateY(${ry}deg)`;
  };

  items.forEach((el) => {
    el.style.transformStyle = "preserve-3d";
    el.addEventListener(
      "mousemove",
      rafThrottle((e) => onMove(el, e))
    );
    el.addEventListener("mouseleave", () => {
      el.style.transform = "";
    });
  });
}

// ====== Mobile UX: auto-centra item ativo no menu rolável ======
function navAutoScroll() {
  const nav = document.querySelector(".nav");
  if (!nav) return;

  // Só faz sentido quando o nav está rolável
  const maybeCenter = (a) => {
    if (!a) return;
    if (nav.scrollWidth <= nav.clientWidth + 2) return;

    const aRect = a.getBoundingClientRect();
    const nRect = nav.getBoundingClientRect();
    const aCenter = aRect.left + aRect.width / 2;
    const nCenter = nRect.left + nRect.width / 2;
    nav.scrollLeft += aCenter - nCenter;
  };

  // marca link ativo por hash
  const setActive = () => {
    const hash = window.location.hash;
    const links = Array.from(nav.querySelectorAll("a"));
    links.forEach((l) => l.classList.remove("is-active"));

    if (!hash) return;
    const active = links.find((l) => l.getAttribute("href") === hash);
    if (active) {
      active.classList.add("is-active");
      maybeCenter(active);
    }
  };

  window.addEventListener("hashchange", setActive, { passive: true });
  setActive();
}

// ====== Init ======
document.addEventListener("DOMContentLoaded", () => {
  // Ano
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  // Links dos CTAs
  setAllCtasToKiwify();

  // Scroll suave (âncoras)
  smoothAnchors();

  // Revelar seções
  revealOnScroll();

  // Contadores
  animateCounters();

  // Microinterações
  enhanceHoverPop();

  // Melhor UX do menu no mobile
  navAutoScroll();
});

// Loader some depois de carregar tudo (inclui imagem)
window.addEventListener("load", () => {
  hideLoader();
});