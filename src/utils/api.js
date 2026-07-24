const API_URL = "https://script.google.com/macros/s/AKfycbxOE2bAsnGKn1TvOlxBK1qJpe2nblhC4l8YWmAxTUe3VM383YaNrPmH3i1U2g-Sp7LJxA/exec";

// GET ALL DATA
export const getAll = async () => {
  try {
    const response = await fetch(`${API_URL}?action=getAll`);
    return await response.json();
  } catch (err) {
    console.error("Error fetching data:", err);
    return { error: err.message };
  }
};

export const getOuvriers = async () => {
  try {
    const response = await fetch(`${API_URL}?action=getOuvriers`);
    return await response.json();
  } catch (err) {
    console.error("Error fetching ouvriers:", err);
    return [];
  }
};

export const getChantiers = async () => {
  try {
    const response = await fetch(`${API_URL}?action=getChantiers`);
    return await response.json();
  } catch (err) {
    console.error("Error fetching chantiers:", err);
    return [];
  }
};

export const getAffectations = async () => {
  try {
    const response = await fetch(`${API_URL}?action=getAffectations`);
    return await response.json();
  } catch (err) {
    console.error("Error fetching affectations:", err);
    return [];
  }
};

// CREATE
export const createOuvrier = async (nom, type, metier) => {
  try {
    const params = new URLSearchParams({
      action: "createOuvrier",
      nom,
      type,
      metier
    });
    const response = await fetch(`${API_URL}?${params}`);
    return await response.json();
  } catch (err) {
    return { error: err.message };
  }
};

export const createChantier = async (nom, dateDebut, dateFin, description) => {
  try {
    const params = new URLSearchParams({
      action: "createChantier",
      nom,
      dateDebut,
      dateFin,
      description: description || ""
    });
    const response = await fetch(`${API_URL}?${params}`);
    return await response.json();
  } catch (err) {
    return { error: err.message };
  }
};

// UPDATE
export const updateOuvrier = async (id, nom, type, metier, statut) => {
  try {
    const params = new URLSearchParams({
      action: "updateOuvrier",
      id,
      nom: nom || "",
      type: type || "",
      metier: metier || "",
      statut: statut || ""
    });
    const response = await fetch(`${API_URL}?${params}`);
    return await response.json();
  } catch (err) {
    return { error: err.message };
  }
};

export const updateChantier = async (id, nom, dateDebut, dateFin, description, statut) => {
  try {
    const params = new URLSearchParams({
      action: "updateChantier",
      id,
      nom: nom || "",
      dateDebut: dateDebut || "",
      dateFin: dateFin || "",
      description: description || "",
      statut: statut || ""
    });
    const response = await fetch(`${API_URL}?${params}`);
    return await response.json();
  } catch (err) {
    return { error: err.message };
  }
};

// AFFECTATIONS
export const createAffectation = async (ouvrierID, chantierId, dateDebut, dateFin, tache) => {
  try {
    const params = new URLSearchParams({
      action: "createAffectation",
      ouvrierID,
      chantierId,
      dateDebut,
      dateFin,
      tache: tache || ""
    });
    const response = await fetch(`${API_URL}?${params}`);
    return await response.json();
  } catch (err) {
    return { error: err.message };
  }
};

export const updateAffectation = async (id, dateDebut, dateFin, tache, statut) => {
  try {
    const params = new URLSearchParams({
      action: "updateAffectation",
      id,
      dateDebut: dateDebut || "",
      dateFin: dateFin || "",
      tache: tache || "",
      statut: statut || ""
    });
    const response = await fetch(`${API_URL}?${params}`);
    return await response.json();
  } catch (err) {
    return { error: err.message };
  }
};

export const deleteAffectation = async (id) => {
  try {
    const params = new URLSearchParams({
      action: "deleteAffectation",
      id
    });
    const response = await fetch(`${API_URL}?${params}`);
    return await response.json();
  } catch (err) {
    return { error: err.message };
  }
};
