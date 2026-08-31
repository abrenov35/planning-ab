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

const memeAffectationSouple = (a, b) =>
  String(a?.ouvrierID || "") === String(b?.ouvrierID || "") &&
  String(a?.chantierId || "") === String(b?.chantierId || "") &&
  normaliserDate(a?.dateDebut) === normaliserDate(b?.dateDebut) &&
  normaliserDate(a?.dateFin) === normaliserDate(b?.dateFin) &&
  tacheAffectation(a) === tacheAffectation(b);

const cleAffectation = a => [
  String(a?.ouvrierID || ""),
  String(a?.chantierId || ""),
  normaliserDate(a?.dateDebut),
  normaliserDate(a?.dateFin),
  tacheAffectation(a),
  nomAffectation(a)
].join("¦");

const LS_DELETED = "abPlanningDeletedAssignmentsV2";

const lireSuppressionsPersistantes = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(LS_DELETED) || "[]");
    return Array.isArray(raw) ? raw.filter(x => x && x.key) : [];
  } catch (_) {
    return [];
  }
};

export const AppProvider = ({ children }) => {
  const [ouvriers, setOuvriers] = useState([]);
  const [chantiers, setChantiers] = useState([]);
  const [affectations, setAffectations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [lastDeletedAffectation, setLastDeletedAffectation] = useState(null);
  const [undoingDelete, setUndoingDelete] = useState(false);

  const undoTimerRef = useRef(null);
  const pendingAffectationsRef = useRef(new Map());
  const pendingDeletionsRef = useRef(new Map());
  const deletedKeysRef = useRef(new Map(lireSuppressionsPersistantes().map(x => [x.key, x])));
  const workerColorCacheRef = useRef((() => {
    try {
      return JSON.parse(localStorage.getItem("abPlanningWorkerColors") || "{}") || {};
    } catch (_) {
      return {};
    }
  })());

  const saveWorkerColorCache = () => {
    try {
      localStorage.setItem("abPlanningWorkerColors", JSON.stringify(workerColorCacheRef.current));
    } catch (_) {}
  };

  const saveDeletedKeys = () => {
    try {
      localStorage.setItem(LS_DELETED, JSON.stringify(Array.from(deletedKeysRef.current.values())));
    } catch (_) {}
  };

  const rememberDeleted = affectation => {
    if (!affectation) return;
    const key = cleAffectation(affectation);
    deletedKeysRef.current.set(key, { key, deletedAt: Date.now() });
    saveDeletedKeys();
  };

  const forgetDeleted = affectation => {
    if (!affectation) return;
    const key = cleAffectation(affectation);
    if (deletedKeysRef.current.delete(key)) saveDeletedKeys();
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

  const clearUndo = () => {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
    setLastDeletedAffectation(null);
  };

  const armUndo = a => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setLastDeletedAffectation({ ...a });
    undoTimerRef.current = setTimeout(() => {
      setLastDeletedAffectation(null);
      undoTimerRef.current = null;
    }, 20000);
  };

  useEffect(() => () => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
  }, []);

  const doitMasquerSuppression = affectation => {
    const id = String(affectation?.id || "");
    for (const [pendingId, pending] of pendingDeletionsRef.current.entries()) {
      if (id && id === String(pendingId)) return true;
      if (pending?.affectation && memeAffectationSouple(affectation, pending.affectation)) return true;
    }
    return deletedKeysRef.current.has(cleAffectation(affectation));
  };

  const loadData = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const data = await api.getAll();
      if (data?.error) throw new Error(data.error);

      const serveurBrut = Array.isArray(data?.affectations) ? data.affectations : [];
      const maintenant = Date.now();

      pendingDeletionsRef.current.forEach((pending, id) => {
        if (pending?.releaseAt && maintenant >= pending.releaseAt) {
          pendingDeletionsRef.current.delete(id);
        } else if (maintenant - Number(pending?.createdAt || maintenant) > 90000) {
          pendingDeletionsRef.current.delete(id);
        }
      });

      const serveur = serveurBrut.filter(a => !doitMasquerSuppression(a));

      const temporaires = [];
      pendingAffectationsRef.current.forEach((pending, tempId) => {
        if (serveur.some(a => memeAffectation(a, pending.affectation))) {
          pendingAffectationsRef.current.delete(tempId);
          return;
        }
        if (maintenant - pending.createdAt < 60000) temporaires.push(pending.affectation);
        else pendingAffectationsRef.current.delete(tempId);
      });

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
    } catch (err) {
      console.error("Error loading data:", err);
      setError(err.message);
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let actif = true;
    (async () => { if (actif) await loadData(true); })();
    const interval = setInterval(() => { if (actif) loadData(false); }, 30000);
    return () => {
      actif = false;
      clearInterval(interval);
    };
  }, [loadData]);

  const refreshLater = (delay = 1200) => setTimeout(() => loadData(false), delay);

  const verifierCreationAffectation = async (tempId, optimistic, messageErreur) => {
    for (const attente of [1000, 3000, 6000]) {
      await new Promise(resolve => setTimeout(resolve, attente));
      try {
        const data = await api.getAll();
        const serveur = Array.isArray(data?.affectations) ? data.affectations : [];
        if (serveur.some(a => memeAffectation(a, optimistic))) {
          pendingAffectationsRef.current.delete(tempId);
          await loadData(false);
          setError(null);
          return true;
        }
      } catch (err) {
        console.error("Vérification affectation:", err);
      }
    }
    pendingAffectationsRef.current.delete(tempId);
    setAffectations(prev => prev.filter(a => String(a.id) !== String(tempId)));
    setError(messageErreur || "Impossible de créer l'affectation");
    return false;
  };

  const verifierSuppressionAffectation = async (id, removed) => {
    const key = String(id);
    let absencesConsecutives = 0;

    for (const attente of [500, 1000, 1800, 3000]) {
      await new Promise(resolve => setTimeout(resolve, attente));
      try {
        const data = await api.getAll();
        const serveur = Array.isArray(data?.affectations) ? data.affectations : [];
        const existe = serveur.some(a =>
          String(a.id) === key ||
          (removed && memeAffectationSouple(a, removed))
        );

        absencesConsecutives = existe ? 0 : absencesConsecutives + 1;
        if (absencesConsecutives >= 2) {
          const pending = pendingDeletionsRef.current.get(key);
          if (pending) {
            pending.confirmedAt = Date.now();
            pending.releaseAt = Date.now() + 15000;
            pendingDeletionsRef.current.set(key, pending);
          }
          setError(null);
          return true;
        }
      } catch (err) {
        console.error("Vérification suppression affectation:", err);
      }
    }
    return false;
  };

  const addOuvrier = async (nom, type, metier, refresh = true) => {
    const r = await api.createOuvrier(nom, type, metier);
    if (r.success && refresh) refreshLater();
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
      return { ...o, nom: nom || o.nom, type: type || o.type, metier: metier || o.metier, statut: statut || o.statut, ordre: ordre === "" ? o.ordre : Number(ordre), separateurApres: !!separateurApres, couleurCellule: couleur };
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
      setError(err?.message || "Impossible de modifier l'ouvrier");
      return { success: false, error: err?.message || "Impossible de modifier l'ouvrier" };
    }
  };

  const addChantier = async (nom, dateDebut, dateFin, description, couleur = "", dateSignature = "", typeChantier = "Rénovation") => {
    const r = await api.createChantier(nom, dateDebut, dateFin, description, couleur, dateSignature, typeChantier);
    if (r.success) refreshLater();
    return r;
  };

  const updateChantier = async (id, nom, dateDebut, dateFin, description, statut, couleur = "", dateSignature = "", typeChantier = "Rénovation") => {
    const r = await api.updateChantier(id, nom, dateDebut, dateFin, description, statut, couleur, dateSignature, typeChantier);
    if (r.success) refreshLater();
    return r;
  };

  const deleteChantier = async id => {
    const r = await api.deleteChantier(id);
    if (r.success) {
      setChantiers(prev => prev.filter(c => String(c.id) !== String(id)));
      refreshLater(250);
    }
    return r;
  };

  const addAffectation = (ouvrierID, chantierId, dateDebut, dateFin, tache, nomLibre = "", typeAffectation = "CHANTIER") => {
    let cid = chantierId || "";
    let nom = nomLibre || "";
    let type = typeAffectation || "CHANTIER";
    if (String(cid).startsWith("__LIBRE__:")) {
      nom = String(cid).slice(10).trim();
      cid = "";
      type = "HORS_GANTT";
    }

    const tempId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const optimistic = { id: tempId, ouvrierID, chantierId: cid, dateDebut, dateFin, tache: tache || "", nomAffectation: nom, affectationNom: nom, nomExterne: nom, typeAffectation: type, statut: "Actif" };

    forgetDeleted(optimistic);

    pendingAffectationsRef.current.set(tempId, { affectation: optimistic, createdAt: Date.now() });
    setAffectations(prev => [...prev, optimistic]);

    api.createAffectation(ouvrierID, cid, dateDebut, dateFin, tache, nom, type)
      .then(r => {
        if (!r?.success) {
          verifierCreationAffectation(tempId, optimistic, r?.error);
          return;
        }
        setError(null);
      })
      .catch(err => verifierCreationAffectation(tempId, optimistic, err?.message));

    return { success: true, pending: true, id: tempId };
  };

  const updateAffectation = (id, dateDebut, dateFin, tache, statut, nomLibre = "", chantierId = "") => {
    let previous = null;
    setAffectations(prev => prev.map(a => {
      if (String(a.id) !== String(id)) return a;
      previous = { ...a };
      const next = { ...a, dateDebut: dateDebut || a.dateDebut, dateFin: dateFin || a.dateFin, tache: tache || "", statut: statut || a.statut };
      if (chantierId !== "") next.chantierId = chantierId;
      if (nomLibre !== "") {
        next.nomAffectation = nomLibre;
        next.affectationNom = nomLibre;
        next.nomExterne = nomLibre;
      }
      return next;
    }));

    api.updateAffectation(id, dateDebut, dateFin, tache, statut, nomLibre, chantierId)
      .then(r => {
        if (!r?.success) {
          if (previous) setAffectations(prev => prev.map(a => String(a.id) === String(id) ? previous : a));
          setError(r?.error || "Impossible de modifier l'affectation");
          return;
        }
        setError(null);
        refreshLater(250);
      })
      .catch(err => {
        if (previous) setAffectations(prev => prev.map(a => String(a.id) === String(id) ? previous : a));
        setError(err?.message || "Impossible de modifier l'affectation");
      });

    return { success: true, pending: true };
  };

  const deleteAffectation = (id, allowUndo = true) => {
    const key = String(id);
    const removed = affectations.find(a => String(a.id) === key);
    const removedIndex = affectations.findIndex(a => String(a.id) === key);

    if (removed && allowUndo) armUndo(removed);
    if (removed) {
      pendingDeletionsRef.current.set(key, {
        affectation: { ...removed },
        createdAt: Date.now(),
        confirmedAt: null,
        releaseAt: null
      });
      rememberDeleted(removed);
    }

    setAffectations(prev => prev.filter(a => String(a.id) !== key));

    api.deleteAffectation(id)
      .then(r => {
        if (!r?.success) {
          pendingDeletionsRef.current.delete(key);
          if (removed) {
            forgetDeleted(removed);
            setAffectations(prev => {
              if (prev.some(a => String(a.id) === key)) return prev;
              const copy = [...prev];
              copy.splice(Math.max(0, Math.min(removedIndex, copy.length)), 0, removed);
              return copy;
            });
          }
          if (allowUndo) clearUndo();
          setError(r?.error || "Impossible de supprimer l'affectation");
          return;
        }
        setError(null);
        verifierSuppressionAffectation(id, removed);
      })
      .catch(err => {
        pendingDeletionsRef.current.delete(key);
        if (removed) {
          forgetDeleted(removed);
          setAffectations(prev => {
            if (prev.some(a => String(a.id) === key)) return prev;
            const copy = [...prev];
            copy.splice(Math.max(0, Math.min(removedIndex, copy.length)), 0, removed);
            return copy;
          });
        }
        if (allowUndo) clearUndo();
        setError(err?.message || "Impossible de supprimer l'affectation");
      });

    return { success: true, pending: true };
  };

  const undoLastDelete = async () => {
    const a = lastDeletedAffectation;
    if (!a || undoingDelete) return { success: false };
    setUndoingDelete(true);
    try {
      forgetDeleted(a);
      for (const [id, pending] of pendingDeletionsRef.current.entries()) {
        if (pending?.affectation && memeAffectationSouple(pending.affectation, a)) {
          pendingDeletionsRef.current.delete(id);
        }
      }
      const nom = a.nomExterne || a.affectationNom || a.nomAffectation || "";
      const type = a.typeAffectation || (!a.chantierId ? "HORS_GANTT" : "CHANTIER");
      const r = await api.createAffectation(a.ouvrierID, a.chantierId || "", a.dateDebut, a.dateFin, a.tache || "", nom, type);
      if (!r?.success) {
        rememberDeleted(a);
        throw new Error(r?.error || "Impossible de restaurer l'affectation");
      }
      clearUndo();
      setError(null);
      await loadData(false);
      return { success: true };
    } catch (err) {
      setError(err?.message || "Impossible de restaurer l'affectation");
      return { success: false, error: err?.message };
    } finally {
      setUndoingDelete(false);
    }
  };

  const getOuvrierById = id => ouvriers.find(o => Number(o.id) === Number(id));
  const getChantierId = id => chantiers.find(c => Number(c.id) === Number(id));
  const getAffectationsByOuvrier = ouvrierID => affectations.filter(a => Number(a.ouvrierID) === Number(ouvrierID));
  const getAffectationsByChantier = chantierId => affectations.filter(a => Number(a.chantierId) === Number(chantierId));

  return (
    <AppContext.Provider value={{
      ouvriers, chantiers, affectations, loading, error, lastUpdated,
      addOuvrier, updateOuvrier, addChantier, updateChantier, deleteChantier,
      addAffectation, updateAffectation, deleteAffectation,
      lastDeletedAffectation, undoLastDelete, undoingDelete,
      getOuvrierById, getChantierId, getAffectationsByOuvrier, getAffectationsByChantier,
      loadData
    }}>
      {children}
    </AppContext.Provider>
  );
};
