const STORAGE_KEY = "abPlanningWorkerPositions";
const SEPARATOR_KEY = "abPlanningWorkerSeparators";

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
  "BRAHIM",
  "MARTIN",
  "STEPHANE",
  "EQUIPE UMAR",
  "NORDINE"
];

const DEFAULT_SEPARATORS = ["KEVIN #2", "ABOUL", "MORVAN", "NORDINE"];

export const normalizeWorkerName = (name) =>
  String(name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();

export const getWorkerPositions = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (_) {
    return {};
  }
};

export const saveWorkerPosition = (workerName, afterWorkerName = "") => {
  const worker = normalizeWorkerName(workerName);
  if (!worker) return;
  const positions = getWorkerPositions();
  if (afterWorkerName) positions[worker] = normalizeWorkerName(afterWorkerName);
  else delete positions[worker];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
};

export const getWorkerPosition = (workerName) => {
  const positions = getWorkerPositions();
  return positions[normalizeWorkerName(workerName)] || "";
};

export const getWorkerSeparators = () => {
  try {
    const raw = localStorage.getItem(SEPARATOR_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_SEPARATORS;
  } catch (_) {
    return DEFAULT_SEPARATORS;
  }
};

export const hasWorkerSeparator = (workerName) =>
  getWorkerSeparators().includes(normalizeWorkerName(workerName));

export const saveWorkerSeparator = (workerName, enabled) => {
  const worker = normalizeWorkerName(workerName);
  if (!worker) return;
  const separators = new Set(getWorkerSeparators());
  if (enabled) separators.add(worker);
  else separators.delete(worker);
  localStorage.setItem(SEPARATOR_KEY, JSON.stringify([...separators]));
};

export const buildWorkerOrder = (workers = []) => {
  const positions = getWorkerPositions();
  const names = workers.map(w => normalizeWorkerName(w.nom)).filter(Boolean);
  const order = BASE_ORDER.filter(name => names.includes(name));

  names.forEach(name => {
    if (!order.includes(name)) order.push(name);
  });

  for (let pass = 0; pass < 3; pass++) {
    Object.entries(positions).forEach(([worker, after]) => {
      if (!names.includes(worker)) return;
      const current = order.indexOf(worker);
      if (current !== -1) order.splice(current, 1);
      const anchor = order.indexOf(after);
      if (anchor === -1) order.push(worker);
      else order.splice(anchor + 1, 0, worker);
    });
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
