import React, { useState, useEffect } from "react";

export const FormAffectation = ({ 
  affectation, 
  ouvrier,
  chantiers, 
  onSubmit, 
  onCancel, 
  onDelete,
  mode = "add" 
}) => {
  const chantiersActifs = chantiers.filter(c => c.statut === "Actif");
  
  // Convertir AAAA-MM-JJ en JJ/MM/AAAA
  const convertToSheetFormat = (dateStr) => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  };

  // Convertir JJ/MM/AAAA en AAAA-MM-JJ
  const convertToInputFormat = (dateStr) => {
    if (!dateStr) return "";
    const [d, m, y] = dateStr.split("/");
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  };
  
  const [formData, setFormData] = useState({
    chantierId: affectation?.chantierId || "",
    dateDebut: convertToInputFormat(affectation?.dateDebut) || "",
    dateFin: convertToInputFormat(affectation?.dateFin) || "",
    tache: affectation?.tache || ""
  });

  // Champ pour supprimer une case/jour spécifique
  const [dateSuppression, setDateSuppression] = useState("");

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
    
    // Mode édition avec suppression d'une case
    if (mode === "edit" && dateSuppression) {
      const dateSupprStr = dateSuppression; // AAAA-MM-JJ
      const affDebut = affectation.dateDebut; // JJ/MM/AAAA
      const affFin = affectation.dateFin; // JJ/MM/AAAA
      
      // Convertir les dates pour comparer
      const [y, m, d] = dateSupprStr.split("-");
      const dateSupprSheet = `${d}/${m}/${y}`; // JJ/MM/AAAA
      
      // Vérifier si la date est dans la plage
      const parseDate = (dateStr) => {
        const [d, m, y] = dateStr.split("/");
        return new Date(y, m - 1, d);
      };
      
      const supprDate = parseDate(dateSupprSheet);
      const debut = parseDate(affDebut);
      const fin = parseDate(affFin);
      
      // Si la date est avant le début ou après la fin, erreur
      if (supprDate < debut || supprDate > fin) {
        alert("La date sélectionnée n'est pas dans la plage de cette affectation");
        return;
      }
      
      // Si c'est le seul jour, supprimer complètement
      if (debut.getTime() === fin.getTime() && debut.getTime() === supprDate.getTime()) {
        const message = `Attention vous allez supprimer l'affectation du ${affDebut} au ${affFin}\n\nConfirmer oui ou non ?`;
        if (window.confirm(message)) {
          onDelete && onDelete();
        }
        return;
      }
      
      // Si c'est le premier jour, avancer le début
      if (debut.getTime() === supprDate.getTime()) {
        const newDebut = new Date(debut);
        newDebut.setDate(newDebut.getDate() + 1);
        const d = String(newDebut.getDate()).padStart(2, "0");
        const m = String(newDebut.getMonth() + 1).padStart(2, "0");
        const y = newDebut.getFullYear();
        setFormData({ ...formData, dateDebut: `${y}-${m}-${d}` });
        alert("Date début modifiée. Cliquez sur Enregistrer pour confirmer.");
        return;
      }
      
      // Si c'est le dernier jour, reculer la fin
      if (fin.getTime() === supprDate.getTime()) {
        const newFin = new Date(fin);
        newFin.setDate(newFin.getDate() - 1);
        const d = String(newFin.getDate()).padStart(2, "0");
        const m = String(newFin.getMonth() + 1).padStart(2, "0");
        const y = newFin.getFullYear();
        setFormData({ ...formData, dateFin: `${y}-${m}-${d}` });
        alert("Date fin modifiée. Cliquez sur Enregistrer pour confirmer.");
        return;
      }
      
      // Si c'est au milieu, c'est trop complexe
      alert("Vous pouvez supprimer les cases du début ou de la fin uniquement.\nPour supprimer une date du milieu, créez deux affectations séparées.");
      return;
    }
    
    // En mode édition, si dates vides = suppression
    if (mode === "edit" && (!formData.dateDebut || !formData.dateFin)) {
      const dateDebut = convertToSheetFormat(affectation.dateDebut);
      const dateFin = convertToSheetFormat(affectation.dateFin);
      const message = `Attention vous allez supprimer l'affectation du ${dateDebut} au ${dateFin}\n\nConfirmer oui ou non ?`;
      
      if (window.confirm(message)) {
        onDelete && onDelete();
      }
      return;
    }
    
    // En mode création, dates obligatoires
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

      {/* DATES DÉBUT ET FIN - MÊME LIGNE */}
      <div style={{ display: "flex", gap: "12px" }}>
        <div style={{ flex: 1 }}>
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

        <div style={{ flex: 1 }}>
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

      {/* SUPPRIMER UNE CASE SPÉCIFIQUE (mode edit) */}
      {mode === "edit" && (
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#1f2937", display: "block", marginBottom: 4 }}>
            Supprimer une case spécifique (optionnel)
          </label>
          <input
            type="date"
            value={dateSuppression}
            onChange={(e) => setDateSuppression(e.target.value)}
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
          <div style={{ fontSize: 9, color: "#9ca3af", marginTop: 4 }}>
            Sélectionner une date pour la supprimer de cette affectation
          </div>
        </div>
      )}

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
        {mode === "edit" && (
          <button
            type="button"
            onClick={() => {
              const dateDebut = convertToSheetFormat(affectation.dateDebut);
              const dateFin = convertToSheetFormat(affectation.dateFin);
              const message = `Attention vous allez supprimer l'affectation du ${dateDebut} au ${dateFin}\n\nConfirmer oui ou non ?`;
              
              if (window.confirm(message)) {
                onDelete && onDelete();
              }
            }}
            style={{
              flex: 1,
              padding: "8px",
              background: "#dc2626",
              color: "white",
              border: "none",
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Supprimer
          </button>
        )}
      </div>
    </form>
  );
};
