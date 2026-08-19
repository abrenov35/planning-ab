import React, { useState } from "react";

export const FormChantier = ({ chantier, onSubmit, onCancel, onDelete, mode = "add" }) => {
  const [formData, setFormData] = useState(
    chantier
      ? { ...chantier, couleur: chantier.couleur || "" }
      : { nom: "", dateDebut: "", description: "", statut: "Actif", couleur: "" }
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  const handleDelete = async () => {
    if (!onDelete || !chantier) return;
    setIsDeleting(true);
    try {
      await onDelete(chantier);
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
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
          <button type="button" onClick={() => setFormData(prev => ({ ...prev, couleur: "" }))} style={{ height: 36, padding: "0 12px", border: "1px solid #d1d5db", borderRadius: 6, background: !formData.couleur ? "#dbeafe" : "white", color: "#1f2937", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Automatique</button>
          <input type="color" value={formData.couleur || "#2563eb"} onChange={(e) => setFormData(prev => ({ ...prev, couleur: e.target.value }))} title="Choisir une couleur" style={{ width: 48, height: 36, padding: 2, border: "1px solid #d1d5db", borderRadius: 6, background: "white", cursor: "pointer" }} />
          <span style={{ fontSize: 12, color: "#64748b" }}>{formData.couleur ? "Couleur imposée" : "Couleur gérée par le système"}</span>
        </div>
      </div>

      {mode === "edit" && (
        <div style={{ marginBottom: "1.25rem" }}>
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

      {mode === "edit" && (
        <button onClick={() => setShowDeleteConfirm(true)} disabled={isDeleting || isSubmitting} style={{ width: "100%", marginBottom: 10, padding: 10, border: "1px solid #dc2626", background: "white", color: "#b91c1c", borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: isDeleting ? "not-allowed" : "pointer", opacity: isDeleting ? 0.6 : 1 }}>
          {isDeleting ? "Suppression..." : "Supprimer"}
        </button>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onCancel} style={{ flex: 1, padding: 10, border: "1px solid #d1d5db", background: "white", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#1f2937" }}>Annuler</button>
        <button onClick={handleSubmit} disabled={isSubmitting || isDeleting} style={{ flex: 1, padding: 10, background: mode === "edit" ? "#1e3a8a" : "#10b981", color: "white", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: isSubmitting ? "not-allowed" : "pointer", opacity: isSubmitting ? 0.6 : 1, transition: "all 0.2s" }}>
          {isSubmitting ? "Enregistrement..." : (mode === "edit" ? "Enregistrer" : "Créer")}
        </button>
      </div>

      {showDeleteConfirm && (
        <div
          onClick={() => !isDeleting && setShowDeleteConfirm(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 18,
            background: "rgba(15, 23, 42, 0.42)",
            backdropFilter: "blur(2px)"
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(420px, 92vw)",
              background: "#ffffff",
              borderRadius: 14,
              boxShadow: "0 20px 60px rgba(15, 23, 42, 0.25)",
              border: "1px solid #e2e8f0",
              overflow: "hidden"
            }}
          >
            <div style={{ padding: "20px 22px 12px", textAlign: "center" }}>
              <div style={{ width: 44, height: 44, margin: "0 auto 12px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "#fee2e2", color: "#b91c1c", fontSize: 21, fontWeight: 800 }}>!</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>Supprimer ce chantier ?</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#334155", marginBottom: 10 }}>« {chantier?.nom} »</div>
              <div style={{ fontSize: 13, lineHeight: 1.5, color: "#64748b" }}>
                Suppression définitive. Elle sera refusée si une affectation existe encore sur ce chantier.
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, padding: "14px 18px 18px" }}>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                style={{ flex: 1, minHeight: 42, border: "1px solid #cbd5e1", borderRadius: 8, background: "#fff", color: "#334155", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                style={{ flex: 1, minHeight: 42, border: "none", borderRadius: 8, background: "#b91c1c", color: "#fff", fontSize: 13, fontWeight: 800, cursor: isDeleting ? "not-allowed" : "pointer", opacity: isDeleting ? 0.65 : 1 }}
              >
                {isDeleting ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
