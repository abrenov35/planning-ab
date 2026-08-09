const API_URL = "https://script.google.com/macros/s/AKfycbxOE2bAsnGKn1TvOlxBK1qJpe2nblhC4l8YWmAxTUe3VM383YaNrPmH3i1U2g-Sp7LJxA/exec";

const jsonp = (params = {}) => {
  return new Promise((resolve, reject) => {
    const callbackName = `abPlanningJsonp_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2)}`;

    const query = new URLSearchParams({
      ...params,
      callback: callbackName,
      _ts: String(Date.now())
    });

    const script = document.createElement("script");
    let termine = false;

    const nettoyer = () => {
      if (script.parentNode) script.parentNode.removeChild(script);
      try {
        delete window[callbackName];
      } catch (_) {
        window[callbackName] = undefined;
      }
    };

    const timeout = window.setTimeout(() => {
      if (termine) return;
      termine = true;
      nettoyer();
      reject(new Error("Délai API dépassé"));
    }, 20000);

    window[callbackName] = data => {
      if (termine) return;
      termine = true;
      window.clearTimeout(timeout);
      nettoyer();
      resolve(data);
    };

    script.onerror = () => {
      if (termine) return;
      termine = true;
      window.clearTimeout(timeout);
      nettoyer();
      reject(new Error("Impossible de joindre Apps Script"));
    };

    script.src = `${API_URL}?${query.toString()}`;
    script.async = true;
    document.head.appendChild(script);
  });
};

const appeler = async (params, fallback = { error: "Erreur API" }) => {
  try {
    return await jsonp(params);
  } catch (err) {
    console.error("AB Planning API:", err);
    return {
      ...fallback,
      error: err?.message || "Erreur API"
    };
  }
};

export const getAll = async () => appeler({ action: "getAll" });

export const getOuvriers = async () => {
  const result = await appeler({ action: "getOuvriers" }, { error: "Erreur ouvriers" });
  return Array.isArray(result) ? result : [];
};

export const getChantiers = async () => {
  const result = await appeler({ action: "getChantiers" }, { error: "Erreur chantiers" });
  return Array.isArray(result) ? result : [];
};

export const getAffectations = async () => {
  const result = await appeler({ action: "getAffectations" }, { error: "Erreur affectations" });
  return Array.isArray(result) ? result : [];
};

export const createOuvrier = async (nom, type, metier) =>
  appeler({ action: "createOuvrier", nom, type, metier });

export const createChantier = async (nom, dateDebut, dateFin, description) =>
  appeler({
    action: "createChantier",
    nom,
    dateDebut,
    dateFin,
    description: description || ""
  });

export const updateOuvrier = async (id, nom, type, metier, statut) =>
  appeler({
    action: "updateOuvrier",
    id,
    nom: nom || "",
    type: type || "",
    metier: metier || "",
    statut: statut || ""
  });

export const updateChantier = async (
  id,
  nom,
  dateDebut,
  dateFin,
  description,
  statut
) =>
  appeler({
    action: "updateChantier",
    id,
    nom: nom || "",
    dateDebut: dateDebut || "",
    dateFin: dateFin || "",
    description: description || "",
    statut: statut || ""
  });

export const createAffectation = async (
  ouvrierID,
  chantierId,
  dateDebut,
  dateFin,
  tache
) =>
  appeler({
    action: "createAffectation",
    ouvrierID,
    chantierId,
    dateDebut,
    dateFin,
    tache: tache || ""
  });

export const updateAffectation = async (
  id,
  dateDebut,
  dateFin,
  tache,
  statut,
  nomAffectation = "",
  chantierId = ""
) =>
  appeler({
    action: "updateAffectation",
    id,
    dateDebut: dateDebut || "",
    dateFin: dateFin || "",
    tache: tache || "",
    statut: statut || "",
    nomAffectation: nomAffectation || "",
    chantierId: chantierId || ""
  });

export const deleteAffectation = async id =>
  appeler({ action: "deleteAffectation", id });
