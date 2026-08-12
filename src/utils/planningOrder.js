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

const DEFAULT_SEPARATORS = ["KEVIN #2", "ABOUL", "MORVAN", "NORDINE"];

export const normalizeWorkerName = (name) =>
  String(name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();

export const getWorkerPositions = () => ({});
export const saveWorkerPosition = () => {};
export const getWorkerPosition = () => "";

export const getWorkerSeparators = () => DEFAULT_SEPARATORS;

export const hasWorkerSeparator = (workerName) =>
  DEFAULT_SEPARATORS.includes(normalizeWorkerName(workerName));

export const saveWorkerSeparator = () => {};

export const buildWorkerOrder = (workers = []) => {
  const names = workers.map(w => normalizeWorkerName(w.nom)).filter(Boolean);
  const order = BASE_ORDER.filter(name => names.includes(name));
  names.forEach(name => {
    if (!order.includes(name)) order.push(name);
  });
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
