import React, { useState } from "react";

export const FormChantier = ({ chantier, onSubmit, onCancel, mode = "add" }) => {
  const [formData, setFormData] = useState(
    chantier || { nom: "", dateDebut: "", dateFin: "", description: "", statut: "Actif" }
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (!formData.nom || !formData.dateDebut) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }
    onSubmit(formData);
  };

  return (
    <div>
      {/* NOM */}
      <div style={{ marginBottom: "1.25rem" }}>
        <label style={{
          display: "block",
          fontWeight: 600,
          fontSize: 13,
          color: "#1f2937",
          marginBottom: 6
        }}>
          Nom du chantier *
        </label>
        <input
          type="text"
          name="nom"
          value={formData.nom}
          onChange={handleChange}
          placeholder="Ex: Rénovation Maison Petit"
          style={{
            width: "100%",
            padding: "8px 12px",
            border: "1px solid #d1d5db",
            borderRadius: 6,
            fontSize: 13,
            fontFamily: "inherit"
          }}
        />
      </div>

      {/* DATE DÉBUT */}
      <div style={{ marginBottom: "1.25rem" }}>
        <label style={{
          display: "block",
          fontWeight: 600,
          fontSize: 13,
          color: "#1f2937",
          marginBottom: 6
        }}>
          Date de début *
        </label>
        <input
          type="date"
          name="dateDebut"
          value={formData.dateDebut}
          onChange={handleChange}
          style={{
            width: "100%",
            padding: "8px 12px",
            border: "1px solid #d1d5db",
            borderRadius: 6,
            fontSize: 13,
            fontFamily: "inherit"
          }}
        />
      </div>

      {/* DESCRIPTION */}
      <div style={{ marginBottom: mode === "edit" ? "1.25rem" : "2rem" }}>
        <label style={{
          display: "block",
          fontWeight: 600,
          fontSize: 13,
          color: "#1f2937",
          marginBottom: 6
        }}>
          Description (optionnel)
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Ex: Rénovation complète du rez-de-chaussée"
          style={{
            width: "100%",
            padding: "8px 12px",
            border: "1px solid #d1d5db",
            borderRadius: 6,
            fontSize: 13,
            fontFamily: "inherit",
            resize: "vertical",
            minHeight: 80
          }}
        />
      </div>

      {/* STATUT - Seulement en mode edit */}
      {mode === "edit" && (
        <div style={{ marginBottom: "2rem" }}>
          <label style={{
            display: "block",
            fontWeight: 600,
            fontSize: 13,
            color: "#1f2937",
            marginBottom: 8
          }}>
            Statut
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <label style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              padding: 10,
              border: "1px solid #d1d5db",
              borderRadius: 6,
              cursor: "pointer",
              background: formData.statut === "Actif" ? "#dcfce7" : "white"
            }}>
              <input
                type="radio"
                name="statut"
                value="Actif"
                checked={formData.statut === "Actif"}
                onChange={handleChange}
                style={{ marginRight: 8 }}
              />
              <span style={{ fontSize: 13, color: "#1f2937" }}>Actif</span>
            </label>
            <label style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              padding: 10,
              border: "1px solid #d1d5db",
              borderRadius: 6,
              cursor: "pointer",
              background: formData.statut === "Archivé" ? "#fecaca" : "white"
            }}>
              <input
                type="radio"
                name="statut"
                value="Archivé"
                checked={formData.statut === "Archivé"}
                onChange={handleChange}
                style={{ marginRight: 8 }}
              />
              <span style={{ fontSize: 13, color: "#1f2937" }}>Archivé</span>
            </label>
          </div>
        </div>
      )}

      {/* BOUTONS */}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={onCancel}
          style={{
            flex: 1,
            padding: 10,
            border: "1px solid #d1d5db",
            background: "white",
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            color: "#1f2937"
          }}
        >
          Annuler
        </button>
        <button
          onClick={handleSubmit}
          style={{
            flex: 1,
            padding: 10,
            background: mode === "edit" ? "#1e3a8a" : "#10b981",
            color: "white",
            border: "none",
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          {mode === "edit" ? "Enregistrer" : "Créer"}
        </button>
      </div>
    </div>
  );
};
