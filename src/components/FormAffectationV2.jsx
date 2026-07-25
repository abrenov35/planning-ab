import React, { useState, useEffect } from "react";

export const FormAffectationV2 = ({ 
  affectation, 
  ouvrier,
  chantiers, 
  onSubmit, 
  onCancel,
  onDelete,
  mode = "add",
  selectedDate = null // La date du jour cliqué
}) => {
  const chantiersActifs = chantiers.filter(c => c.statut === "Actif");
  
  // État pour les checkboxes
  const [days, setDays] = useState({
    lundi: false,
    mardi: false,
    mercredi: false,
    jeudi: false,
    vendredi: false
  });

  const [formData, setFormData] = useState({
    chantierId: affectation?.chantierId || "",
    tache: affectation?.tache || ""
  });

  const [tacheHistory, setTacheHistory] = useState([]);

  // Charger historique des tâches
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

  // Si on edit, pré-cocher les jours de l'affectation existante
  useEffect(() => {
    if (affectation && mode === "edit") {
      // Calculer quels jours sont cochés
      const parseDate = (dateStr) => {
        if (typeof dateStr === 'string' && dateStr.includes('/')) {
          const [d, m, y] = dateStr.split('/');
          return new Date(parseInt(y), parseInt(m)-1, parseInt(d));
        }
        return new Date(dateStr);
      };

      const start = parseDate(affectation.dateDebut);
      const end = parseDate(affectation.dateFin);
      start.setHours(0,0,0,0);
      end.setHours(0,0,0,0);

      // Déterminer le lundi de la semaine de start
      const dayOfWeek = start.getDay(); // 0=dim, 1=lun
      const daysToMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 0 : dayOfWeek - 1;
      const monday = new Date(start);
      monday.setDate(monday.getDate() - daysToMonday);
      monday.setHours(0,0,0,0);

      // Cocher les jours de start à end
      const dayNames = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'];
      const newDays = { lundi: false, mardi: false, mercredi: false, jeudi: false, vendredi: false };

      for (let i = 0; i < 5; i++) {
        const dayDate = new Date(monday);
        dayDate.setDate(dayDate.getDate() + i);
        dayDate.setHours(0,0,0,0);
        
        if (dayDate >= start && dayDate <= end) {
          newDays[dayNames[i]] = true;
        }
      }

      setDays(newDays);
    }
  }, [affectation, mode]);

  // Convertir les jours cochés en dates début/fin
  const getDateRange = () => {
    const dayOrder = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'];
    const checkedDays = dayOrder.filter(day => days[day]);

    if (checkedDays.length === 0) {
      alert("Sélectionnez au moins un jour");
      return null;
    }

    // Utiliser selectedDate si fournie, sinon aujourd'hui
    const clickedDate = selectedDate ? new Date(selectedDate) : new Date();
    clickedDate.setHours(0,0,0,0);

    // Trouver le lundi de la semaine
    const dayOfWeek = clickedDate.getDay();
    const daysToMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 0 : dayOfWeek - 1;
    const monday = new Date(clickedDate);
    monday.setDate(monday.getDate() - daysToMonday);
    monday.setHours(0,0,0,0);

    // Min et max des jours cochés
    const dayIndices = checkedDays.map(day => dayOrder.indexOf(day));
    const minDay = Math.min(...dayIndices);
    const maxDay = Math.max(...dayIndices);

    const dateDebut = new Date(monday);
    dateDebut.setDate(dateDebut.getDate() + minDay);

    const dateFin = new Date(monday);
    dateFin.setDate(dateFin.getDate() + maxDay);

    const dateToString = (d) => 
      `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;

    return {
      dateDebut: dateToString(dateDebut),
      dateFin: dateToString(dateFin)
    };
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.chantierId || !formData.tache) {
      alert("Veuillez remplir tous les champs");
      return;
    }

    const dateRange = getDateRange();
    if (!dateRange) return;

    // Sauvegarder la tâche
    if (formData.tache.trim()) {
      const updated = [formData.tache, ...tacheHistory.filter(t => t !== formData.tache)].slice(0, 10);
      setTacheHistory(updated);
      localStorage.setItem("tacheHistory", JSON.stringify(updated));
    }

    onSubmit({
      chantierId: formData.chantierId,
      dateDebut: dateRange.dateDebut,
      dateFin: dateRange.dateFin,
      tache: formData.tache
    });
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

      {/* JOURS DE LA SEMAINE */}
      <div>
        <label style={{ fontSize: 11, fontWeight: 600, color: "#1f2937", display: "block", marginBottom: 8 }}>
          Jours de la semaine *
        </label>
        <div style={{ display: "flex", gap: "12px" }}>
          {[
            { key: 'lundi', label: 'Lun' },
            { key: 'mardi', label: 'Mar' },
            { key: 'mercredi', label: 'Mer' },
            { key: 'jeudi', label: 'Jeu' },
            { key: 'vendredi', label: 'Ven' }
          ].map(day => (
            <button
              key={day.key}
              type="button"
              onClick={() => setDays(prev => ({ ...prev, [day.key]: !prev[day.key] }))}
              style={{
                flex: 1,
                padding: "8px",
                borderRadius: 4,
                border: "2px solid #d1d5db",
                background: days[day.key] ? "#1e3a8a" : "white",
                color: days[day.key] ? "white" : "#1f2937",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              {day.label}
            </button>
          ))}
        </div>
      </div>

      {/* TÂCHE / DESCRIPTION */}
      <div>
        <label style={{ fontSize: 11, fontWeight: 600, color: "#1f2937", display: "block", marginBottom: 4 }}>
          Tâche / Description *
        </label>
        <input
          type="text"
          placeholder="Ex: Démolition, Gros œuvre..."
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
              <button
                key={idx}
                type="button"
                onClick={() => setFormData({ ...formData, tache })}
                style={{
                  background: formData.tache === tache ? "#1e3a8a" : "white",
                  border: formData.tache === tache ? "1px solid #1e3a8a" : "1px solid #d1d5db",
                  borderRadius: 3,
                  padding: "4px 8px",
                  fontSize: 10,
                  color: formData.tache === tache ? "white" : "#374151",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                {tache}
              </button>
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
              if (window.confirm("Supprimer cette affectation ?")) {
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
