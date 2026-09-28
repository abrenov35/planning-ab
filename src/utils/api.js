const API_URL = "https://script.google.com/macros/s/AKfycbxOE2bAsnGKn1TvOlxBK1qJpe2nblhC4l8YWmAxTUe3VM383YaNrPmH3i1U2g-Sp7LJxA/exec";

const jsonp = (params = {}) => new Promise((resolve, reject) => {
  const callbackName = `abPlanningJsonp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const query = new URLSearchParams({ ...params, callback: callbackName, _ts: String(Date.now()) });
  const script = document.createElement("script");
  let termine = false;

  const nettoyer = () => {
    if (script.parentNode) script.parentNode.removeChild(script);
    try { delete window[callbackName]; } catch (_) { window[callbackName] = undefined; }
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

const appeler = async (params, fallback = { error: "Erreur API" }) => {
  try {
    return await jsonp(params);
  } catch (err) {
    console.error("AB Planning API:", err);
    return { ...fallback, error: err?.message || "Erreur API" };
  }
};

const normaliserDate = value => {
  const str = String(value || "").trim();
  if (!str) return "";
  const brut = str.split("T")[0];
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(brut)) {
    const [d, m, y] = brut.split("/");
    return `${y}-${m}-${d}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(brut)) return brut;
  return brut;
};

const nomAffectation = a => String(a?.nomExterne || a?.affectationNom || a?.nomAffectation || "").trim();
const signatureKey = a => [
  String(a?.ouvrierID || ""),
  String(a?.chantierId || ""),
  normaliserDate(a?.dateDebut),
  normaliserDate(a?.dateFin),
  String(a?.tache || "").trim(),
  String(a?.chantierId || "") ? "" : nomAffectation(a),
  String(a?.typeAffectation || "CHANTIER").toUpperCase()
].join("¦");

const creationEnCours = new Map();
let fileCreations = Promise.resolve();

const attendre = ms => new Promise(resolve => window.setTimeout(resolve, ms));

const empreinteAffectations = liste => {
  const rows = Array.isArray(liste) ? liste : [];
  const ids = rows
    .map(a => String(a?.id || "").trim())
    .filter(Boolean)
    .sort((a, b) => {
      const na = Number(a);
      const nb = Number(b);
      if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
      return a.localeCompare(b);
    });
  return `${rows.length}|${ids.slice(-20).join(",")}`;
};

const attendreCreneauCreationStable = async () => {
  let precedent = await getAffectationsStrict();

  // Verrou coopératif multi-PC : on n'écrit que si la base est restée stable
  // pendant plusieurs contrôles. Ce n'est pas un LockService serveur, mais cela
  // évite que deux postes qui saisissent au même moment partent ensemble.
  for (let tentative = 0; tentative < 8; tentative += 1) {
    await attendre(500 + Math.floor(Math.random() * 700));
    const courant = await getAffectationsStrict();

    if (empreinteAffectations(courant) === empreinteAffectations(precedent)) {
      // Dernier délai aléatoire : si un autre PC écrit pendant ce créneau,
      // le contrôle final le détecte et on recommence.
      await attendre(350 + Math.floor(Math.random() * 850));
      const final = await getAffectationsStrict();
      if (empreinteAffectations(final) === empreinteAffectations(courant)) {
        return final;
      }
      precedent = final;
      continue;
    }

    precedent = courant;
  }

  throw new Error("Planning très actif : création mise en attente pour éviter un conflit entre plusieurs postes.");
};

const serialiserCreation = operation => {
  const precedente = fileCreations.catch(() => undefined);
  const courante = precedente.then(operation);
  fileCreations = courante.catch(() => undefined);
  return courante;
};

export const getAll = async () => appeler({ action: "getAll" });
export const getOuvriers = async () => {
  const r = await appeler({ action: "getOuvriers" }, { error: "Erreur ouvriers" });
  return Array.isArray(r) ? r : [];
};
export const getChantiers = async () => {
  const r = await appeler({ action: "getChantiers" }, { error: "Erreur chantiers" });
  return Array.isArray(r) ? r : [];
};
export const getAffectations = async () => {
  const r = await appeler({ action: "getAffectations" }, { error: "Erreur affectations" });
  return Array.isArray(r) ? r : [];
};
export const getAffectationsStrict = async () => {
  const r = await jsonp({ action: "getAffectations" });
  if (!Array.isArray(r)) throw new Error(r?.error || "Réponse affectations invalide");
  return r;
};

export const createOuvrier = async (nom, type, metier) =>
  appeler({ action: "createOuvrier", nom, type, metier });

export const createChantier = async (nom, dateDebut, dateFin, description, couleur = "", dateSignature = "", typeChantier = "Rénovation") =>
  appeler({
    action: "createChantier",
    nom,
    dateDebut,
    dateFin,
    description: description || "",
    couleur: couleur || "",
    dateSignature: dateSignature || "",
    typeChantier: typeChantier || "Rénovation"
  });

export const updateOuvrier = async (id, nom, type, metier, statut, ordre = "", separateurApres = false, couleurCellule = "") =>
  appeler({
    action: "updateOuvrier",
    id,
    nom: nom || "",
    type: type || "",
    metier: metier || "",
    statut: statut || "",
    ordre: ordre === "" ? "" : String(ordre),
    separateurApres: separateurApres ? "TRUE" : "FALSE",
    couleurCellule: couleurCellule || ""
  });

export const updateChantier = async (id, nom, dateDebut, dateFin, description, statut, couleur = "", dateSignature = "", typeChantier = "Rénovation") =>
  appeler({
    action: "updateChantier",
    id,
    nom: nom || "",
    dateDebut: dateDebut || "",
    dateFin: dateFin || "",
    description: description || "",
    statut: statut || "",
    couleur: couleur || "",
    dateSignature: dateSignature || "",
    typeChantier: typeChantier || "Rénovation"
  });

export const deleteChantier = async id => appeler({ action: "deleteChantier", id });

export const createAffectation = async (ouvrierID, chantierId, dateDebut, dateFin, tache, nomAffectation = "", typeAffectation = "CHANTIER") => {
  const payload = {
    ouvrierID,
    chantierId: chantierId || "",
    dateDebut,
    dateFin,
    tache: tache || "",
    nomAffectation: nomAffectation || "",
    nomExterne: nomAffectation || "",
    typeAffectation: typeAffectation || "CHANTIER",
    clientMutationId: (window.crypto?.randomUUID?.() || `mut-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  };
  const signature = signatureKey(payload);

  // Deux clics rapides strictement identiques partagent la même promesse.
  if (creationEnCours.has(signature)) return creationEnCours.get(signature);

  // Toutes les créations du même navigateur sont sérialisées, même si elles
  // concernent des ouvriers/chantiers différents.
  const operation = serialiserCreation(async () => {
    try {
      const existantes = await attendreCreneauCreationStable();
      const dejaLa = existantes.find(a => signatureKey(a) === signature);
      if (dejaLa) {
        return {
          success: true,
          id: dejaLa.id,
          confirmed: true,
          duplicatePrevented: true,
          existing: true
        };
      }

      return await appeler(
        { action: "createAffectation", ...payload },
        { success: false, error: "Erreur création affectation" }
      );
    } finally {
      creationEnCours.delete(signature);
    }
  });

  creationEnCours.set(signature, operation);
  return operation;
};

export const updateAffectation = async (id, dateDebut, dateFin, tache, statut, nomAffectation = "", chantierId = "") =>
  appeler({
    action: "updateAffectation",
    id,
    dateDebut: dateDebut || "",
    dateFin: dateFin || "",
    tache: tache || "",
    statut: statut || "",
    nomAffectation: nomAffectation || "",
    chantierId: chantierId || ""
  }, { success: false, error: "Erreur modification affectation" });

export const deleteAffectation = async id => {
  const idString = String(id || "").trim();
  if (!idString || idString.startsWith("tmp-")) {
    return { success: false, error: "Suppression refusée : identifiant serveur invalide" };
  }

  // Un seul appel, sur l'ID exact. Aucun retry automatique, aucune recherche
  // par signature, aucune file persistante, aucune suppression différée.
  return appeler(
    { action: "deleteAffectation", id: idString },
    { success: false, error: "Erreur suppression affectation" }
  );
};
