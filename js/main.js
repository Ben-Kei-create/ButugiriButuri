// ========================================
// ButugiriButuri — Main JS
// ========================================

const MOTION_SELECTOR = [
  '.category-card',
  '.article-card',
  '.curriculum-category',
  '.chapter-block',
  '.chapter-unit-item',
  '.textbook-section',
  '.textbook-panel',
  '.sidebar-card',
  '.article-item',
  '.figure-block'
].join(', ');

let motionObserver = null;

// --- Theme Toggle ---
(function () {
  const toggle = document.getElementById('themeToggle');
  const stored = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (stored) {
    document.documentElement.setAttribute('data-theme', stored);
  } else if (prefersDark) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }

  if (toggle) {
    toggle.addEventListener('click', function () {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    });
  }
})();

function setupMotionObserver() {
  if (motionObserver || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  motionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      entry.target.classList.add('is-visible');
      motionObserver.unobserve(entry.target);
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -8% 0px'
  });
}

function getMotionTargets(root = document) {
  const targets = [];

  if (root instanceof Element && root.matches(MOTION_SELECTOR)) {
    targets.push(root);
  }

  if (root.querySelectorAll) {
    targets.push(...root.querySelectorAll(MOTION_SELECTOR));
  }

  return targets;
}

function initMotionSystem(root = document) {
  const targets = getMotionTargets(root);

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    targets.forEach(element => element.classList.add('is-visible'));
    return;
  }

  setupMotionObserver();

  targets.forEach((element, index) => {
    if (element.dataset.motionReady === 'true') return;

    element.dataset.motionReady = 'true';
    element.classList.add('motion-reveal');
    element.style.setProperty('--motion-delay', `${Math.min(index * 40, 240)}ms`);
    motionObserver?.observe(element);
  });
}

window.initMotionSystem = initMotionSystem;

// --- KaTeX Auto-render + motion ---
document.addEventListener('DOMContentLoaded', function () {
  document.body.classList.add('page-ready');

  if (typeof renderMathInElement === 'function') {
    renderMathInElement(document.body, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false },
        { left: '\\[', right: '\\]', display: true },
        { left: '\\(', right: '\\)', display: false }
      ],
      throwOnError: false
    });
  }

  initMotionSystem(document);
});
