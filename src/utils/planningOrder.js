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

export const normalizeWorkerName = (name) =>
  String(name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();

const boolValue = value =>
  value === true || value === 1 || String(value || "").trim().toUpperCase() === "TRUE";

export const getWorkerSeparators = (workers = []) =>
  workers
    .filter(worker => boolValue(worker?.separateurApres))
    .map(worker => normalizeWorkerName(worker.nom));

export const hasWorkerSeparator = (workerName, workers = []) => {
  const worker = workers.find(w => normalizeWorkerName(w.nom) === normalizeWorkerName(workerName));
  return !!worker && boolValue(worker.separateurApres);
};

export const buildWorkerOrder = (workers = []) => {
  const baseIndex = new Map(BASE_ORDER.map((name, index) => [name, index]));
  return [...workers]
    .sort((a, b) => {
      const oa = Number(a?.ordre);
      const ob = Number(b?.ordre);
      const va = Number.isFinite(oa) && oa > 0;
      const vb = Number.isFinite(ob) && ob > 0;
      if (va && vb && oa !== ob) return oa - ob;
      if (va !== vb) return va ? -1 : 1;
      const na = normalizeWorkerName(a.nom);
      const nb = normalizeWorkerName(b.nom);
      const ia = baseIndex.has(na) ? baseIndex.get(na) : 9999;
      const ib = baseIndex.has(nb) ? baseIndex.get(nb) : 9999;
      if (ia !== ib) return ia - ib;
      return na.localeCompare(nb, "fr", { sensitivity: "base" });
    })
    .map(worker => normalizeWorkerName(worker.nom));
};

export const sortWorkersPlanning = (workers = []) => {
  const order = buildWorkerOrder(workers);
  return [...workers].sort((a, b) => {
    const ia = order.indexOf(normalizeWorkerName(a.nom));
    const ib = order.indexOf(normalizeWorkerName(b.nom));
    return ia - ib;
  });
};

export const getWorkerPosition = (workerName, workers = []) => {
  const sorted = sortWorkersPlanning(workers.filter(w => w.statut === "Actif"));
  const index = sorted.findIndex(w => normalizeWorkerName(w.nom) === normalizeWorkerName(workerName));
  if (index <= 0) return "";
  return normalizeWorkerName(sorted[index - 1].nom);
};
