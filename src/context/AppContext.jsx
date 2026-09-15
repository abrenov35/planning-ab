import React, { createContext, useState, useEffect, useCallback, useRef } from "react";
import * as api from "../utils/api";

export const AppContext = createContext();

const normaliserDate = value => {
  const str = String(value || "").trim();
  if (!str) return "";
  const brut = str.split("T")[0];
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(brut)) {
    const [d, m, y] = brut.split("/");
    return `${y}-${m}-${d}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(brut)) return brut;
  const d = new Date(str);
  if (!Number.isNaN(d.getTime())) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  return brut;
};

const nomAffectation = a => String(a?.nomExterne || a?.affectationNom || a?.nomAffectation || "").trim();
const tacheAffectation = a => String(a?.tache || "").trim();

const memeAffectation = (a, b) =>
  String(a?.ouvrierID || "") === String(b?.ouvrierID || "") &&
  String(a?.chantierId || "") === String(b?.chantierId || "") &&
  normaliserDate(a?.dateDebut) === normaliserDate(b?.dateDebut) &&
  normaliserDate(a?.dateFin) === normaliserDate(b?.dateFin) &&
  tacheAffectation(a) === tacheAffectation(b) &&
  nomAffectation(a) === nomAffectation(b);

const attendre = ms => new Promise(resolve => window.setTimeout(resolve, ms));

export const AppProvider = ({ children }) => {
  // Les affectations ne sont plus initialisées depuis localStorage : au démarrage,
  // la base serveur est toujours la source de vérité.
  const [ouvriers, setOuvriers] = useState([]);
  const [chantiers, setChantiers] = useState([]);
  const [affectations, setAffectations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const pendingAffectationsRef = useRef(new Map());
  const deletingIdsRef = useRef(new Set());
  const workerColorCacheRef = useRef((() => {
    try {
      return JSON.parse(localStorage.getItem("abPlanningWorkerColors") || "{}") || {};
    } catch (_) {
      return {};
    }
  })());

  useEffect(() => {
    // Nettoyage définitif des anciens mécanismes susceptibles de masquer/rejouer
    // une suppression. Aucun de ces éléments n'est utilisé par cette version.
    try {
      localStorage.removeItem("abPlanningDeleteQueueV1");
      localStorage.removeItem("abPlanningDeletedAssignmentsV2");
      localStorage.removeItem("abPlanningDataCacheV1");
    } catch (_) {}
  }, []);

  const saveWorkerColorCache = () => {
    try {
      localStorage.setItem("abPlanningWorkerColors", JSON.stringify(workerColorCacheRef.current));
    } catch (_) {}
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      ouvriers.forEach(o => {
        const row = document.querySelector(`[data-worker-id="${o.id}"]`);
        const cell = row?.firstElementChild?.firstElementChild;
        if (!cell) return;
        const c = String(o.couleurCellule || "").trim();
        cell.style.background = /^#[0-9A-Fa-f]{6}$/.test(c) ? c : "";
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [ouvriers, affectations]);

  const loadData = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const data = await api.getAll();
      if (data?.error) throw new Error(data.error);

      const serveur = Array.isArray(data?.affectations) ? data.affectations : [];
      const maintenant = Date.now();
      const temporaires = [];

      // Une création en cours peut rester affichée pendant la confirmation serveur,
      // mais elle n'est jamais persistée localement et ne peut déclencher aucune suppression.
      for (const [tempId, pending] of pendingAffectationsRef.current.entries()) {
        if (serveur.some(a => memeAffectation(a, pending.affectation))) {
          pendingAffectationsRef.current.delete(tempId);
          continue;
        }
        if (maintenant - Number(pending.createdAt || 0) <= 5 * 60 * 1000) {
          temporaires.push(pending.affectation);
        } else {
          pendingAffectationsRef.current.delete(tempId);
        }
      }

      const ouvriersServeur = Array.isArray(data?.ouvriers) ? data.ouvriers : [];
      const ouvriersAvecCouleurs = ouvriersServeur.map(o => {
        const id = String(o.id);
        if (Object.prototype.hasOwnProperty.call(workerColorCacheRef.current, id)) {
          return { ...o, couleurCellule: workerColorCacheRef.current[id] || "" };
        }
        const c = String(o.couleurCellule || "").trim();
        if (/^#[0-9A-Fa-f]{6}$/.test(c)) {
          workerColorCacheRef.current[id] = c;
          saveWorkerColorCache();
        }
        return o;
      });

      setOuvriers(ouvriersAvecCouleurs);
      setChantiers(Array.isArray(data?.chantiers) ? data.chantiers : []);
      setAffectations([...serveur, ...temporaires]);
      setError(null);
      setLastUpdated(new Date());
      return true;
    } catch (err) {
      console.error("Error loading data:", err);
      setError(err?.message || "Impossible de charger le planning");
      return false;
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let actif = true;
    let retryTimer = null;

    const pause = delay => new Promise(resolve => {
      retryTimer = window.setTimeout(resolve, delay);
    });

    (async () => {
      if (!actif) return;
      let charge = await loadData(true);
      for (const attenteMs of [1500, 5000]) {
        if (charge || !actif) break;
        await pause(attenteMs);
        if (actif) charge = await loadData(false);
      }
    })();

    const interval = window.setInterval(() => {
      if (actif) loadData(false);
    }, 30000);

    return () => {
      actif = false;
      if (retryTimer) window.clearTimeout(retryTimer);
      window.clearInterval(interval);
    };
  }, [loadData]);

  const refreshLater = (delay = 1200) => window.setTimeout(() => loadData(false), delay);

  const verifierCreationAffectation = async (optimistic, reponseCreation) => {
    const idServeur = String(reponseCreation?.id || reponseCreation?.affectationId || "").trim();

    for (const attenteMs of [0, 500, 1500, 3000]) {
      if (attenteMs) await attendre(attenteMs);
      try {
        const serveur = await api.getAffectationsStrict();
        const trouvee = idServeur
          ? serveur.find(a => String(a?.id || "") === idServeur)
          : serveur.find(a => memeAffectation(a, optimistic));
        if (trouvee) return trouvee;
      } catch (err) {
        console.error("Vérification création affectation:", err);
      }
    }
    return null;
  };

  const verifierMiseAJourAffectation = async (id, attendu) => {
    const key = String(id);
    for (const attenteMs of [0, 500, 1500, 3000]) {
      if (attenteMs) await attendre(attenteMs);
      try {
        const serveur = await api.getAffectationsStrict();
        const ligne = serveur.find(a => String(a?.id || "") === key);
        if (ligne && memeAffectation(ligne, attendu)) return ligne;
      } catch (err) {
        console.error("Vérification modification affectation:", err);
      }
    }
    return null;
  };

  const verifierSuppressionAffectation = async id => {
    const key = String(id);
    let absencesConsecutives = 0;

    for (const attenteMs of [300, 800, 1500, 3000]) {
      await attendre(attenteMs);
      try {
        const serveur = await api.getAffectationsStrict();
        const existe = serveur.some(a => String(a?.id || "") === key);
        absencesConsecutives = existe ? 0 : absencesConsecutives + 1;
        if (absencesConsecutives >= 2) return true;
      } catch (err) {
        console.error("Vérification suppression affectation:", err);
      }
    }
    return false;
  };

  const addOuvrier = async (nom, type, metier, refresh = true) => {
    const r = await api.createOuvrier(nom, type, metier);
    if (r?.success && refresh) refreshLater();
    return r;
  };

  const updateOuvrier = async (id, nom, type, metier, statut, ordre = "", separateurApres = false, refresh = true, couleurCellule = "") => {
    const key = String(id);
    const couleur = String(couleurCellule || "").trim();
    let previous = null;

    workerColorCacheRef.current[key] = couleur;
    saveWorkerColorCache();

    setOuvriers(prev => prev.map(o => {
      if (String(o.id) !== key) return o;
      previous = { ...o };
      return {
        ...o,
        nom: nom || o.nom,
        type: type || o.type,
        metier: metier || o.metier,
        statut: statut || o.statut,
        ordre: ordre === "" ? o.ordre : Number(ordre),
        separateurApres: !!separateurApres,
        couleurCellule: couleur
      };
    }));

    try {
      const r = await api.updateOuvrier(id, nom, type, metier, statut, ordre, separateurApres, couleur);
      if (!r?.success) throw new Error(r?.error || "Impossible de modifier l'ouvrier");
      setError(null);
      if (refresh) refreshLater(1500);
      return r;
    } catch (err) {
      if (previous) {
        workerColorCacheRef.current[key] = String(previous.couleurCellule || "").trim();
        saveWorkerColorCache();
        setOuvriers(prev => prev.map(o => String(o.id) === key ? previous : o));
      }
      const message = err?.message || "Impossible de modifier l'ouvrier";
      setError(message);
      return { success: false, error: message };
    }
  };

  const addChantier = async (nom, dateDebut, dateFin, description, couleur = "", dateSignature = "", typeChantier = "Rénovation") => {
    const r = await api.createChantier(nom, dateDebut, dateFin, description, couleur, dateSignature, typeChantier);
    if (r?.success) refreshLater();
    return r;
  };

  const updateChantier = async (id, nom, dateDebut, dateFin, description, statut, couleur = "", dateSignature = "", typeChantier = "Rénovation") => {
    const r = await api.updateChantier(id, nom, dateDebut, dateFin, description, statut, couleur, dateSignature, typeChantier);
    if (r?.success) refreshLater();
    return r;
  };

  const deleteChantier = async id => {
    const r = await api.deleteChantier(id);
    if (r?.success) {
      setChantiers(prev => prev.filter(c => String(c.id) !== String(id)));
      refreshLater(250);
    }
    return r;
  };

  const addAffectation = async (ouvrierID, chantierId, dateDebut, dateFin, tache, nomLibre = "", typeAffectation = "CHANTIER") => {
    let cid = chantierId || "";
    let nom = nomLibre || "";
    let type = typeAffectation || "CHANTIER";

    if (String(cid).startsWith("__LIBRE__:")) {
      nom = String(cid).slice(10).trim();
      cid = "";
      type = "HORS_GANTT";
    }

    const tempId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const optimistic = {
      id: tempId,
      ouvrierID,
      chantierId: cid,
      dateDebut,
      dateFin,
      tache: tache || "",
      nomAffectation: nom,
      affectationNom: nom,
      nomExterne: nom,
      typeAffectation: type,
      statut: "Actif"
    };

    pendingAffectationsRef.current.set(tempId, { affectation: optimistic, createdAt: Date.now() });
    setAffectations(prev => [...prev.filter(a => String(a.id) !== tempId), optimistic]);

    try {
      const r = await api.createAffectation(ouvrierID, cid, dateDebut, dateFin, tache, nom, type);
      if (!r?.success) {
        pendingAffectationsRef.current.delete(tempId);
        setAffectations(prev => prev.filter(a => String(a.id) !== tempId));
        const message = r?.error || "Impossible de créer l'affectation";
        setError(message);
        return { success: false, error: message };
      }

      const confirmee = await verifierCreationAffectation(optimistic, r);
      if (!confirmee) {
        const message = "Création reçue mais non confirmée dans la base. L'ancienne affectation est conservée et aucune suppression ne sera lancée.";
        setError(message);
        refreshLater(3000);
        return { success: false, uncertain: true, error: message };
      }

      pendingAffectationsRef.current.delete(tempId);
      setError(null);
      await loadData(false);
      return { success: true, confirmed: true, id: confirmee.id };
    } catch (err) {
      pendingAffectationsRef.current.delete(tempId);
      setAffectations(prev => prev.filter(a => String(a.id) !== tempId));
      const message = err?.message || "Impossible de créer l'affectation";
      setError(message);
      return { success: false, error: message };
    }
  };

  const updateAffectation = async (id, dateDebut, dateFin, tache, statut, nomLibre = "", chantierId = "") => {
    const key = String(id);
    const current = affectations.find(a => String(a.id) === key);
    if (!current || key.startsWith("tmp-")) {
      const message = "Modification refusée : l'affectation n'est pas encore confirmée par le serveur.";
      setError(message);
      return { success: false, error: message };
    }

    const attendu = {
      ...current,
      dateDebut: dateDebut || current.dateDebut,
      dateFin: dateFin || current.dateFin,
      tache: tache || "",
      statut: statut || current.statut
    };
    if (chantierId !== "") attendu.chantierId = chantierId;
    if (nomLibre !== "") {
      attendu.nomAffectation = nomLibre;
      attendu.affectationNom = nomLibre;
      attendu.nomExterne = nomLibre;
    }

    try {
      const r = await api.updateAffectation(id, dateDebut, dateFin, tache, statut, nomLibre, chantierId);
      if (!r?.success) {
        const message = r?.error || "Impossible de modifier l'affectation";
        setError(message);
        return { success: false, error: message };
      }

      const confirmee = await verifierMiseAJourAffectation(id, attendu);
      if (!confirmee) {
        const message = "Modification reçue mais non confirmée dans la base. Aucune autre donnée n'a été supprimée.";
        setError(message);
        refreshLater(3000);
        return { success: false, uncertain: true, error: message };
      }

      setError(null);
      await loadData(false);
      return { success: true, confirmed: true };
    } catch (err) {
      const message = err?.message || "Impossible de modifier l'affectation";
      setError(message);
      return { success: false, error: message };
    }
  };

  const deleteAffectation = id => {
    const key = String(id || "").trim();
    if (!key || key.startsWith("tmp-")) {
      return { success: false, error: "Suppression impossible tant que l'enregistrement n'est pas confirmé." };
    }
    if (deletingIdsRef.current.has(key)) {
      return { success: true, pending: true };
    }

    const existe = affectations.some(a => String(a.id) === key);
    if (!existe) {
      return { success: false, error: "Affectation introuvable : aucune suppression envoyée." };
    }

    deletingIdsRef.current.add(key);

    void (async () => {
      try {
        const r = await api.deleteAffectation(key);
        if (!r?.success) {
          setError(r?.error || "La suppression n'a pas été enregistrée. L'affectation est conservée.");
          return;
        }

        const confirmee = await verifierSuppressionAffectation(key);
        if (!confirmee) {
          setError("Suppression non confirmée par la base. L'affectation reste affichée et aucune nouvelle tentative automatique ne sera faite.");
          await loadData(false);
          return;
        }

        // Retrait uniquement de l'ID explicitement demandé, après confirmation serveur.
        setAffectations(prev => prev.filter(a => String(a.id) !== key));
        setError(null);
        await loadData(false);
      } catch (err) {
        setError(err?.message || "La suppression a échoué. L'affectation est conservée.");
      } finally {
        deletingIdsRef.current.delete(key);
      }
    })();

    return { success: true, pending: true };
  };

  const getOuvrierById = id => ouvriers.find(o => Number(o.id) === Number(id));
  const getChantierId = id => chantiers.find(c => Number(c.id) === Number(id));
  const getAffectationsByOuvrier = ouvrierID => affectations.filter(a => Number(a.ouvrierID) === Number(ouvrierID));
  const getAffectationsByChantier = chantierId => affectations.filter(a => Number(a.chantierId) === Number(chantierId));

  return (
    <AppContext.Provider value={{
      ouvriers,
      chantiers,
      affectations,
      loading,
      error,
      lastUpdated,
      addOuvrier,
      updateOuvrier,
      addChantier,
      updateChantier,
      deleteChantier,
      addAffectation,
      updateAffectation,
      deleteAffectation,
      getOuvrierById,
      getChantierId,
      getAffectationsByOuvrier,
      getAffectationsByChantier,
      loadData
    }}>
      {children}
    </AppContext.Provider>
  );
};
