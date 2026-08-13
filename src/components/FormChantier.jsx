import React, { useState } from "react";

export const FormChantier = ({ chantier, onSubmit, onCancel, mode = "add" }) => {
  const [formData, setFormData] = useState(
    chantier
      ? { ...chantier, couleur: chantier.couleur || "" }
      : { nom: "", dateDebut: "", description: "", statut: "Actif", couleur: "" }
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.nom || !formData.dateDebut) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Erreur lors de la soumission:", error);
      setIsSubmitting(false);
    }
  };

  const labelStyle = { display: "block", fontWeight: 600, fontSize: 13, color: "#1f2937", marginBottom: 6 };
  const fieldStyle = { width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, fontFamily: "inherit" };

  return (
    <div>
      <div style={{ marginBottom: "1.25rem" }}>
        <label style={labelStyle}>Nom du chantier *</label>
        <input type="text" name="nom" value={formData.nom} onChange={handleChange} placeholder="Ex: Rénovation Maison Petit" style={fieldStyle} />
      </div>

      <div style={{ marginBottom: "1.25rem" }}>
        <label style={labelStyle}>Date de début *</label>
        <input type="date" name="dateDebut" value={formData.dateDebut} onChange={handleChange} style={fieldStyle} />
      </div>

      <div style={{ marginBottom: "1.25rem" }}>
        <label style={labelStyle}>Description (optionnel)</label>
        <textarea name="description" value={formData.description || ""} onChange={handleChange} placeholder="Ex: Rénovation complète du rez-de-chaussée" style={{ ...fieldStyle, resize: "vertical", minHeight: 80 }} />
      </div>

      <div style={{ marginBottom: "1.25rem" }}>
        <label style={labelStyle}>Couleur du chantier</label>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, couleur: "" }))}
            style={{ height: 36, padding: "0 12px", border: "1px solid #d1d5db", borderRadius: 6, background: !formData.couleur ? "#dbeafe" : "white", color: "#1f2937", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            Automatique
          </button>
          <input
            type="color"
            value={formData.couleur || "#2563eb"}
            onChange={(e) => setFormData(prev => ({ ...prev, couleur: e.target.value }))}
            title="Choisir une couleur"
            style={{ width: 48, height: 36, padding: 2, border: "1px solid #d1d5db", borderRadius: 6, background: "white", cursor: "pointer" }}
          />
          <span style={{ fontSize: 12, color: "#64748b" }}>
            {formData.couleur ? "Couleur imposée" : "Couleur gérée par le système"}
          </span>
        </div>
      </div>

      {mode === "edit" && (
        <div style={{ marginBottom: "2rem" }}>
          <label style={{ ...labelStyle, marginBottom: 8 }}>Statut</label>
          <div style={{ display: "flex", gap: 8 }}>
            {["Actif", "Archivé"].map(statut => (
              <label key={statut} style={{ flex: 1, display: "flex", alignItems: "center", padding: 10, border: "1px solid #d1d5db", borderRadius: 6, cursor: "pointer", background: formData.statut === statut ? (statut === "Actif" ? "#dcfce7" : "#fecaca") : "white" }}>
                <input type="radio" name="statut" value={statut} checked={formData.statut === statut} onChange={handleChange} style={{ marginRight: 8 }} />
                <span style={{ fontSize: 13, color: "#1f2937" }}>{statut}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onCancel} style={{ flex: 1, padding: 10, border: "1px solid #d1d5db", background: "white", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#1f2937" }}>Annuler</button>
        <button onClick={handleSubmit} disabled={isSubmitting} style={{ flex: 1, padding: 10, background: mode === "edit" ? "#1e3a8a" : "#10b981", color: "white", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: isSubmitting ? "not-allowed" : "pointer", opacity: isSubmitting ? 0.6 : 1, transition: "all 0.2s" }}>
          {isSubmitting ? "Enregistrement..." : (mode === "edit" ? "Enregistrer" : "Créer")}
        </button>
      </div>
    </div>
  );
};
