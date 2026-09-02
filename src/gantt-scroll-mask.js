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

function parseIsoLocal(value) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  date.setHours(0, 0, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
}

function mondayOf(value) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  const dow = date.getDay();
  date.setDate(date.getDate() - (dow === 0 ? 6 : dow - 1));
  return date;
}

function snapToWeekday(value) {
  const date = new Date(value);
  const dow = date.getDay();
  if (dow === 6) date.setDate(date.getDate() - 1);
  if (dow === 0) date.setDate(date.getDate() + 1);
  return date;
}

function businessDayIndex(startMonday, targetDate) {
  const target = snapToWeekday(targetDate);
  let index = 0;
  const cursor = new Date(startMonday);
  cursor.setHours(0, 0, 0, 0);
  while (cursor < target) {
    const dow = cursor.getDay();
    if (dow >= 1 && dow <= 5) index += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return index;
}

function highlightSearchHit(row, dayIndex, chantierName) {
  const workerLine = row?.firstElementChild;
  const timeline = workerLine?.children?.[1];
  const cell = timeline?.children?.[dayIndex];
  if (!cell) return;
  const titled = Array.from(cell.querySelectorAll('[title]'));
  const searched = String(chantierName || '').trim().toUpperCase();
  const hit = titled.find(node => String(node.getAttribute('title') || '').trim().toUpperCase().startsWith(searched)) || titled[0];
  if (!hit || typeof hit.animate !== 'function') return;
  hit.animate([
    { boxShadow: '0 0 0 0 rgba(245,158,11,0)', filter: 'brightness(1)' },
    { boxShadow: '0 0 0 5px rgba(245,158,11,.95)', filter: 'brightness(1.2)' },
    { boxShadow: '0 0 0 0 rgba(245,158,11,0)', filter: 'brightness(1)' }
  ], { duration: 2400, easing: 'ease-in-out' });
}

function scrollToNearestAssignment(event) {
  const detail = event?.detail || {};
  const targetDate = parseIsoLocal(detail.targetDate);
  if (!targetDate) return;

  const attempt = () => {
    const el = document.querySelector('.gantt-scroll');
    if (!el) return false;
    const header = el.firstElementChild;
    const headerTimeline = header?.children?.[1];
    const dayRow = headerTimeline?.children?.[1];
    const firstDay = dayRow?.children?.[0];
    if (!header || !firstDay) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentMonday = mondayOf(today);
    const rangeMonday = new Date(currentMonday);
    rangeMonday.setDate(rangeMonday.getDate() - Math.max(0, Number(detail.pastWeeks || 0)) * 7);

    const dayIndex = businessDayIndex(rangeMonday, targetDate);
    const dayWidth = firstDay.getBoundingClientRect().width || firstDay.offsetWidth || 1;
    const row = el.querySelector(`[data-worker-id="${String(detail.workerId)}"]`);
    const left = Math.max(0, dayIndex * dayWidth - dayWidth * 2);
    const top = row ? Math.max(0, row.offsetTop - header.offsetHeight - 4) : el.scrollTop;
    el.scrollTo({ left, top, behavior: 'smooth' });
    window.setTimeout(() => highlightSearchHit(row, dayIndex, detail.chantierName), 280);
    return true;
  };

  let tries = 0;
  const retry = () => {
    tries += 1;
    if (attempt() || tries >= 8) return;
    window.setTimeout(retry, 70);
  };
  requestAnimationFrame(() => requestAnimationFrame(retry));
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindGanttScrollMask, { once: true });
  } else {
    bindGanttScrollMask();
  }

  const observer = new MutationObserver(bindGanttScrollMask);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('ab-planning-nearest-search', scrollToNearestAssignment);
}
