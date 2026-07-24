import React, { useState } from "react";

export const FormAffectation = ({ 
  affectation, 
  ouvrier,
  chantiers, 
  onSubmit, 
  onCancel, 
  mode = "add" 
}) => {
  const chantiersActifs = chantiers.filter(c => c.statut === "Actif");
  
  const [formData, setFormData] = useState({
    chantierId: affectation?.chantierId || "",
    dateDebut: affectation?.dateDebut || "",
    dateFin: affectation?.dateFin || "",
    tache: affectation?.tache || ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.chantierId || !formData.dateDebut || !formData.dateFin) {
      alert("Veuillez remplir tous les champs");
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* OUVRIER - LU SEUL */}
      <div>
        <label style={{ fontSize: 11, fontWeight: 600, color: "#1f2937", display: "block", marginBottom: 4 }}>
          Ouvrier
        </label>
        <div style={{
          padding: "8px",
          background: "#f9fafb",
          borderRadius: 4,
          border: "1px solid #e5e7eb",
          fontSize: 12,
          color: "#6b7280"
        }}>
          {ouvrier.nom} • {ouvrier.metier}
        </div>
      </div>

      {/* CHANTIER */}
      <div>
        <label style={{ fontSize: 11, fontWeight: 600, color: "#1f2937", display: "block", marginBottom: 4 }}>
          Chantier *
        </label>
        <select
          value={formData.chantierId}
          onChange={(e) => setFormData({ ...formData, chantierId: e.target.value })}
          style={{
            width: "100%",
            padding: "8px",
            borderRadius: 4,
            border: "1px solid #d1d5db",
            fontSize: 12,
            fontFamily: "inherit"
          }}
        >
          <option value="">-- Sélectionner --</option>
          {chantiersActifs.map(c => (
            <option key={c.id} value={c.id}>
              {c.nom}
            </option>
          ))}
        </select>
      </div>

      {/* DATE DÉBUT */}
      <div>
        <label style={{ fontSize: 11, fontWeight: 600, color: "#1f2937", display: "block", marginBottom: 4 }}>
          Date début (JJ/MM/AAAA) *
        </label>
        <input
          type="text"
          placeholder="01/01/2025"
          value={formData.dateDebut}
          onChange={(e) => setFormData({ ...formData, dateDebut: e.target.value })}
          style={{
            width: "100%",
            padding: "8px",
            borderRadius: 4,
            border: "1px solid #d1d5db",
            fontSize: 12,
            fontFamily: "inherit",
            boxSizing: "border-box"
          }}
        />
      </div>

      {/* DATE FIN */}
      <div>
        <label style={{ fontSize: 11, fontWeight: 600, color: "#1f2937", display: "block", marginBottom: 4 }}>
          Date fin (JJ/MM/AAAA) *
        </label>
        <input
          type="text"
          placeholder="31/01/2025"
          value={formData.dateFin}
          onChange={(e) => setFormData({ ...formData, dateFin: e.target.value })}
          style={{
            width: "100%",
            padding: "8px",
            borderRadius: 4,
            border: "1px solid #d1d5db",
            fontSize: 12,
            fontFamily: "inherit",
            boxSizing: "border-box"
          }}
        />
      </div>

      {/* TÂCHE */}
      <div>
        <label style={{ fontSize: 11, fontWeight: 600, color: "#1f2937", display: "block", marginBottom: 4 }}>
          Tâche / Description
        </label>
        <input
          type="text"
          placeholder="Ex: Démolition, Gros oeuvre..."
          value={formData.tache}
          onChange={(e) => setFormData({ ...formData, tache: e.target.value })}
          style={{
            width: "100%",
            padding: "8px",
            borderRadius: 4,
            border: "1px solid #d1d5db",
            fontSize: 12,
            fontFamily: "inherit",
            boxSizing: "border-box"
          }}
        />
      </div>

      {/* BOUTONS */}
      <div style={{ display: "flex", gap: "8px", marginTop: "0.5rem" }}>
        <button
          type="submit"
          style={{
            flex: 1,
            padding: "8px",
            background: "#1e3a8a",
            color: "white",
            border: "none",
            borderRadius: 4,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          {mode === "add" ? "Ajouter" : "Enregistrer"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            flex: 1,
            padding: "8px",
            background: "#e5e7eb",
            color: "#374151",
            border: "none",
            borderRadius: 4,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          Annuler
        </button>
      </div>
    </form>
  );
};
