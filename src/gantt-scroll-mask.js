let currentScroll = null;
let currentHandler = null;
let raf = 0;

function bindGanttScrollMask() {
  const el = document.querySelector('.gantt-scroll');
  if (!el || el === currentScroll) return;

  if (currentScroll && currentHandler) {
    currentScroll.removeEventListener('scroll', currentHandler);
  }

  currentScroll = el;
  currentHandler = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      el.style.setProperty('--gantt-scroll-left', `${Math.max(0, el.scrollLeft)}px`);
      raf = 0;
    });
  };

  el.addEventListener('scroll', currentHandler, { passive: true });
  currentHandler();
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindGanttScrollMask, { once: true });
  } else {
    bindGanttScrollMask();
  }

  const observer = new MutationObserver(bindGanttScrollMask);
  observer.observe(document.documentElement, { childList: true, subtree: true });
}
