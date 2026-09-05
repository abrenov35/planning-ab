const boundLegends = new WeakSet();

function bindLegend(legend) {
  if (!legend || boundLegends.has(legend)) return;
  boundLegends.add(legend);

  if (!legend.hasAttribute("tabindex")) legend.tabIndex = 0;
  legend.setAttribute("aria-label", "Liste des chantiers — glisser horizontalement ou utiliser les flèches gauche et droite");
  legend.style.cursor = "grab";
  legend.style.userSelect = "none";
  legend.style.WebkitUserSelect = "none";

  let dragging = false;
  let startX = 0;
  let startScrollLeft = 0;
  let pointerId = null;

  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    legend.style.cursor = "grab";
    if (pointerId !== null && legend.hasPointerCapture?.(pointerId)) {
      try { legend.releasePointerCapture(pointerId); } catch (_) {}
    }
    pointerId = null;
  };

  legend.addEventListener("pointerdown", event => {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    dragging = true;
    pointerId = event.pointerId;
    startX = event.clientX;
    startScrollLeft = legend.scrollLeft;
    legend.style.cursor = "grabbing";
    legend.focus({ preventScroll: true });
    try { legend.setPointerCapture(event.pointerId); } catch (_) {}
    event.preventDefault();
  });

  legend.addEventListener("pointermove", event => {
    if (!dragging || event.pointerId !== pointerId) return;
    const dx = event.clientX - startX;
    legend.scrollLeft = startScrollLeft - dx;
    event.preventDefault();
  });

  legend.addEventListener("pointerup", endDrag);
  legend.addEventListener("pointercancel", endDrag);
  legend.addEventListener("lostpointercapture", endDrag);

  legend.addEventListener("wheel", event => {
    if (legend.scrollWidth <= legend.clientWidth + 1) return;
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    if (!delta) return;
    legend.scrollLeft += delta;
    event.preventDefault();
  }, { passive: false });

  legend.addEventListener("keydown", event => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    const step = Math.max(120, Math.round(legend.clientWidth * 0.35));
    legend.scrollBy({
      left: event.key === "ArrowRight" ? step : -step,
      behavior: "smooth"
    });
    event.preventDefault();
    event.stopPropagation();
  });
}

function bindAllLegends() {
  document.querySelectorAll(".gantt-legend").forEach(bindLegend);
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindAllLegends, { once: true });
  } else {
    bindAllLegends();
  }

  const observer = new MutationObserver(bindAllLegends);
  observer.observe(document.documentElement, { childList: true, subtree: true });
}
