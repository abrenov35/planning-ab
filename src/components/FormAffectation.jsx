import React, { useState, useEffect } from "react";

export const FormAffectation = ({ 
  affectation, 
  ouvrier,
  chantiers, 
  onSubmit, 
  onCancel, 
  mode = "add" 
}) => {
  const chantiersActifs = chantiers.filter(c => c.statut === "Actif");
  
  // Convertir JJ/MM/AAAA en AAAA-MM-JJ
  const convertToInputFormat = (dateStr) => {
    if (!dateStr) return "";
    const [d, m, y] = dateStr.split("/");
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  };

  // Convertir AAAA-MM-JJ en JJ/MM/AAAA
  const convertToSheetFormat = (dateStr) => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  };
  
  const [formData, setFormData] = useState({
    chantierId: affectation?.chantierId || "",
    dateDebut: convertToInputFormat(affectation?.dateDebut) || "",
    dateFin: convertToInputFormat(affectation?.dateFin) || "",
    tache: affectation?.tache || ""
  });

  // Charger l'historique des tâches depuis localStorage
  const [tacheHistory, setTacheHistory] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem("tacheHistory");
    if (saved) {
      try {
        setTacheHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Erreur chargement historique", e);
      }
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.chantierId || !formData.dateDebut || !formData.dateFin) {
      alert("Veuillez remplir tous les champs");
      return;
    }
    
    // Sauvegarder la tâche dans l'historique
    if (formData.tache.trim()) {
      const updated = [formData.tache, ...tacheHistory.filter(t => t !== formData.tache)].slice(0, 10);
      setTacheHistory(updated);
      localStorage.setItem("tacheHistory", JSON.stringify(updated));
    }
    
    // Convertir les dates au format JJ/MM/AAAA
    const data = {
      ...formData,
      dateDebut: convertToSheetFormat(formData.dateDebut),
      dateFin: convertToSheetFormat(formData.dateFin)
    };
    
    onSubmit(data);
  };

  const handleTacheSelect = (tache) => {
    setFormData({ ...formData, tache });
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
            fontFamily: "inherit",
            boxSizing: "border-box"
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

      {/* DATE DÉBUT - CALENDRIER */}
      <div>
        <label style={{ fontSize: 11, fontWeight: 600, color: "#1f2937", display: "block", marginBottom: 4 }}>
          Date début *
        </label>
        <input
          type="date"
          value={formData.dateDebut}
          onChange={(e) => setFormData({ ...formData, dateDebut: e.target.value })}
          style={{
            width: "100%",
            padding: "8px",
            borderRadius: 4,
            border: "1px solid #d1d5db",
            fontSize: 12,
            fontFamily: "inherit",
            boxSizing: "border-box",
            cursor: "pointer"
          }}
        />
      </div>

      {/* DATE FIN - CALENDRIER */}
      <div>
        <label style={{ fontSize: 11, fontWeight: 600, color: "#1f2937", display: "block", marginBottom: 4 }}>
          Date fin *
        </label>
        <input
          type="date"
          value={formData.dateFin}
          onChange={(e) => setFormData({ ...formData, dateFin: e.target.value })}
          style={{
            width: "100%",
            padding: "8px",
            borderRadius: 4,
            border: "1px solid #d1d5db",
            fontSize: 12,
            fontFamily: "inherit",
            boxSizing: "border-box",
            cursor: "pointer"
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

      {/* HISTORIQUE DES TÂCHES */}
      {tacheHistory.length > 0 && (
        <div style={{
          background: "#f9fafb",
          padding: "8px",
          borderRadius: 4,
          border: "1px solid #e5e7eb"
        }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "#6b7280", marginBottom: 6 }}>
            Tâches récentes :
          </div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {tacheHistory.map((tache, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  background: formData.tache === tache ? "#1e3a8a" : "white",
                  border: formData.tache === tache ? "1px solid #1e3a8a" : "1px solid #d1d5db",
                  borderRadius: 3,
                  padding: "4px 8px",
                  transition: "all 0.2s"
                }}
              >
                {/* BOUTON SÉLECTIONNER */}
                <button
                  type="button"
                  onClick={() => handleTacheSelect(tache)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: formData.tache === tache ? "white" : "#374151",
                    fontSize: 10,
                    cursor: "pointer",
                    fontWeight: 500,
                    padding: 0,
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={e => {
                    if (formData.tache !== tache) {
                      e.currentTarget.style.opacity = "0.7";
                    }
                  }}
                  onMouseLeave={e => {
                    if (formData.tache !== tache) {
                      e.currentTarget.style.opacity = "1";
                    }
                  }}
                >
                  {tache}
                </button>

                {/* BOUTON MODIFIER */}
                <button
                  type="button"
                  onClick={() => {
                    const newTache = prompt("Modifier la tâche :", tache);
                    if (newTache && newTache.trim()) {
                      const updated = tacheHistory.map((t, i) => i === idx ? newTache : t);
                      setTacheHistory(updated);
                      localStorage.setItem("tacheHistory", JSON.stringify(updated));
                      setFormData({ ...formData, tache: newTache });
                    }
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: formData.tache === tache ? "white" : "#6b7280",
                    fontSize: 11,
                    cursor: "pointer",
                    padding: 0,
                    width: "16px",
                    height: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s"
                  }}
                  title="Modifier la tâche"
                  onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
                  onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                >
                  ✎
                </button>

                {/* BOUTON SUPPRIMER */}
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Supprimer la tâche "${tache}" ?`)) {
                      const updated = tacheHistory.filter((_, i) => i !== idx);
                      setTacheHistory(updated);
                      localStorage.setItem("tacheHistory", JSON.stringify(updated));
                      if (formData.tache === tache) {
                        setFormData({ ...formData, tache: "" });
                      }
                    }
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: formData.tache === tache ? "white" : "#dc2626",
                    fontSize: 11,
                    cursor: "pointer",
                    padding: 0,
                    width: "16px",
                    height: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s"
                  }}
                  title="Supprimer la tâche"
                  onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
                  onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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
