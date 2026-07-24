import React, { createContext, useState, useEffect } from "react";
import * as api from "../utils/api";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [ouvriers, setOuvriers] = useState([]);
  const [chantiers, setChantiers] = useState([]);
  const [affectations, setAffectations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger les données au démarrage
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getAll();
      if (data.ouvriers) setOuvriers(data.ouvriers);
      if (data.chantiers) setChantiers(data.chantiers);
      if (data.affectations) setAffectations(data.affectations);
      setError(null);
    } catch (err) {
      console.error("Error loading data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // OUVRIERS
  const addOuvrier = async (nom, type, metier) => {
    const result = await api.createOuvrier(nom, type, metier);
    if (result.success) {
      await loadData();
    }
    return result;
  };

  const updateOuvrier = async (id, nom, type, metier, statut) => {
    const result = await api.updateOuvrier(id, nom, type, metier, statut);
    if (result.success) {
      await loadData();
    }
    return result;
  };

  // CHANTIERS
  const addChantier = async (nom, dateDebut, dateFin, description) => {
    const result = await api.createChantier(nom, dateDebut, dateFin, description);
    if (result.success) {
      await loadData();
    }
    return result;
  };

  const updateChantier = async (id, nom, dateDebut, dateFin, description, statut) => {
    const result = await api.updateChantier(id, nom, dateDebut, dateFin, description, statut);
    if (result.success) {
      await loadData();
    }
    return result;
  };

  // Utilitaires
  const getOuvrierById = (id) => ouvriers.find(o => o.id === parseInt(id));
  const getChantierId = (id) => chantiers.find(c => c.id === parseInt(id));
  const getAffectationsByOuvrier = (ouvrierID) => affectations.filter(a => a.ouvrierID === parseInt(ouvrierID));
  const getAffectationsByChantier = (chantierId) => affectations.filter(a => a.chantierId === parseInt(chantierId));

  const value = {
    ouvriers,
    chantiers,
    affectations,
    loading,
    error,
    addOuvrier,
    updateOuvrier,
    addChantier,
    updateChantier,
    getOuvrierById,
    getChantierId,
    getAffectationsByOuvrier,
    getAffectationsByChantier,
    loadData
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
