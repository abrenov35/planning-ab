const BASE_ORDER = [
  "KEVIN",
  "JIMMY",
  "ALEXANDRE",
  "KEVIN #2",
  "ALEXIS",
  "MOMO",
  "MOHAMED",
  "ABOUL",
  "MORVAN",
  "MATHIEU",
  "BRAHIM",
  "MARTIN",
  "STEPHANE",
  "EQUIPE UMAR",
  "NORDINE"
];

const DEFAULT_SEPARATORS = ["KEVIN #2", "ABOUL", "MATHIEU", "NORDINE"];
const POSITIONS_KEY = "abplanning_worker_positions_v1";
const SEPARATORS_KEY = "abplanning_worker_separators_v1";

export const normalizeWorkerName = (name) =>
  String(name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();

const readJson = (key, fallback) => {
  try {
    if (typeof window === "undefined") return fallback;
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key, value) => {
  try {
    if (typeof window !== "undefined") window.localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};

export const getWorkerPositions = () => readJson(POSITIONS_KEY, {});

export const saveWorkerPosition = (workerName, afterWorkerName = "") => {
  const worker = normalizeWorkerName(workerName);
  if (!worker) return;
  const positions = getWorkerPositions();
  const after = normalizeWorkerName(afterWorkerName);
  if (after && after !== worker) positions[worker] = after;
  else delete positions[worker];
  writeJson(POSITIONS_KEY, positions);
};

export const getWorkerPosition = (workerName) => {
  const worker = normalizeWorkerName(workerName);
  return getWorkerPositions()[worker] || "";
};

export const getWorkerSeparators = () => {
  const stored = readJson(SEPARATORS_KEY, null);
  return Array.isArray(stored) ? stored : DEFAULT_SEPARATORS;
};

export const hasWorkerSeparator = (workerName) =>
  getWorkerSeparators().includes(normalizeWorkerName(workerName));

export const saveWorkerSeparator = (workerName, enabled) => {
  const worker = normalizeWorkerName(workerName);
  if (!worker) return;
  const current = new Set(getWorkerSeparators());
  if (enabled) current.add(worker);
  else current.delete(worker);
  writeJson(SEPARATORS_KEY, [...current]);
};

export const buildWorkerOrder = (workers = []) => {
  const names = workers.map(w => normalizeWorkerName(w.nom)).filter(Boolean);
  const order = BASE_ORDER.filter(name => names.includes(name));
  names.forEach(name => {
    if (!order.includes(name)) order.push(name);
  });

  const positions = getWorkerPositions();
  const maxPasses = Math.max(1, order.length * 2);
  for (let pass = 0; pass < maxPasses; pass++) {
    let changed = false;
    for (const worker of [...order]) {
      const after = positions[worker];
      if (!after || after === worker || !order.includes(after)) continue;
      const currentIndex = order.indexOf(worker);
      const afterIndex = order.indexOf(after);
      if (currentIndex === afterIndex + 1) continue;
      order.splice(currentIndex, 1);
      const newAfterIndex = order.indexOf(after);
      order.splice(newAfterIndex + 1, 0, worker);
      changed = true;
    }
    if (!changed) break;
  }
  return order;
};

export const sortWorkersPlanning = (workers = []) => {
  const order = buildWorkerOrder(workers);
  return [...workers].sort((a, b) => {
    const aName = normalizeWorkerName(a.nom);
    const bName = normalizeWorkerName(b.nom);
    const ia = order.indexOf(aName);
    const ib = order.indexOf(bName);
    if (ia !== ib) return ia - ib;
    return aName.localeCompare(bName, "fr", { sensitivity: "base" });
  });
};
