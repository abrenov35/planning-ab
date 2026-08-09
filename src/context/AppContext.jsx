import React, { createContext, useState, useEffect, useCallback } from "react";
import * as api from "../utils/api";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [ouvriers, setOuvriers] = useState([]);
  const [chantiers, setChantiers] = useState([]);
  const [affectations, setAffectations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadData = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);

    try {
      const data = await api.getAll();

      if (data?.error) {
        throw new Error(data.error);
      }

      setOuvriers(Array.isArray(data?.ouvriers) ? data.ouvriers : []);
      setChantiers(Array.isArray(data?.chantiers) ? data.chantiers : []);
      setAffectations(Array.isArray(data?.affectations) ? data.affectations : []);
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

    const initialiser = async () => {
      if (!actif) return;
      await loadData(true);
    };

    initialiser();

    const interval = setInterval(() => {
      if (actif) {
        loadData(false);
      }
    }, 30000);

    return () => {
      actif = false;
      clearInterval(interval);
    };
  }, [loadData]);

  const addOuvrier = async (nom, type, metier) => {
    const result = await api.createOuvrier(nom, type, metier);
    if (result.success) await loadData(false);
    return result;
  };

  const updateOuvrier = async (id, nom, type, metier, statut) => {
    const result = await api.updateOuvrier(id, nom, type, metier, statut);
    if (result.success) await loadData(false);
    return result;
  };

  const addChantier = async (nom, dateDebut, dateFin, description) => {
    const result = await api.createChantier(nom, dateDebut, dateFin, description);
    if (result.success) await loadData(false);
    return result;
  };

  const updateChantier = async (id, nom, dateDebut, dateFin, description, statut) => {
    const result = await api.updateChantier(
      id,
      nom,
      dateDebut,
      dateFin,
      description,
      statut
    );
    if (result.success) await loadData(false);
    return result;
  };

  const addAffectation = async (ouvrierID, chantierId, dateDebut, dateFin, tache) => {
    const result = await api.createAffectation(
      ouvrierID,
      chantierId,
      dateDebut,
      dateFin,
      tache
    );
    if (result.success) await loadData(false);
    return result;
  };

  const updateAffectation = async (
    id,
    dateDebut,
    dateFin,
    tache,
    statut,
    nomAffectation = "",
    chantierId = ""
  ) => {
    const result = await api.updateAffectation(
      id,
      dateDebut,
      dateFin,
      tache,
      statut,
      nomAffectation,
      chantierId
    );
    if (result.success) await loadData(false);
    return result;
  };

  const deleteAffectation = async (id) => {
    const result = await api.deleteAffectation(id);
    if (result.success) await loadData(false);
    return result;
  };

  const getOuvrierById = (id) =>
    ouvriers.find(o => Number(o.id) === Number(id));

  const getChantierId = (id) =>
    chantiers.find(c => Number(c.id) === Number(id));

  const getAffectationsByOuvrier = (ouvrierID) =>
    affectations.filter(a => Number(a.ouvrierID) === Number(ouvrierID));

  const getAffectationsByChantier = (chantierId) =>
    affectations.filter(a => Number(a.chantierId) === Number(chantierId));

  const value = {
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
    addAffectation,
    updateAffectation,
    deleteAffectation,
    getOuvrierById,
    getChantierId,
    getAffectationsByOuvrier,
    getAffectationsByChantier,
    loadData
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
