import React, { useState, useEffect } from "react";

export const FormAffectation = ({ 
  ouvrier,
  chantiers, 
  onSubmit, 
  onCancel,
  selectedDate = null
}) => {
  const chantiersActifs = chantiers.filter(c => c.statut === "Actif");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);
  
  const [days, setDays] = useState({
    lundi: false,
    mardi: false,
    mercredi: false,
    jeudi: false,
    vendredi: false
  });

  const [formData, setFormData] = useState({
    chantierId: "",
    tache: ""
  });

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

  const showNotice = (title, message) => {
    setNotice({ title, message });
  };

  const getDateRange = () => {
    const dayOrder = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'];
    const checkedDays = dayOrder.filter(day => days[day]);

    if (checkedDays.length === 0) {
      showNotice("Jour manquant", "Sélectionnez au moins un jour dans la semaine.");
      return null;
    }

    const clickedDate = selectedDate ? new Date(selectedDate) : new Date();
    clickedDate.setHours(0,0,0,0);

    const dayOfWeek = clickedDate.getDay();
    const daysToMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 0 : dayOfWeek - 1;
    const monday = new Date(clickedDate);
    monday.setDate(monday.getDate() - daysToMonday);
    monday.setHours(0,0,0,0);

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (!formData.chantierId && !formData.tache.trim()) {
      showNotice("Informations manquantes", "Choisissez une affectation et renseignez la tâche / description.");
      return;
    }

    if (!formData.chantierId) {
      showNotice("Affectation manquante", "Choisissez le chantier ou l’affectation à planifier.");
      return;
    }

    if (!formData.tache.trim()) {
      showNotice("Description manquante", "Renseignez la tâche / description avant d’enregistrer.");
      return;
    }

    const dateRange = getDateRange();
    if (!dateRange) return;

    setIsSubmitting(true);

    if (formData.tache.trim()) {
      const updated = [formData.tache, ...tacheHistory.filter(t => t !== formData.tache)].slice(0, 10);
      setTacheHistory(updated);
      localStorage.setItem("tacheHistory", JSON.stringify(updated));
    }

    await onSubmit({
      chantierId: formData.chantierId,
      dateDebut: dateRange.dateDebut,
      dateFin: dateRange.dateFin,
      tache: formData.tache
    });

    setIsSubmitting(false);
  };

  return (
    <>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {/* OUVRIER */}
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
            color: "#374151",
            fontWeight: 600
          }}>
            {ouvrier.nom}
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

        {/* JOURS */}
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

        {/* TÂCHE */}
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

        {/* HISTORIQUE */}
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
            disabled={isSubmitting}
            style={{
              flex: 1,
              padding: "8px",
              background: isSubmitting ? "#9ca3af" : "#1e3a8a",
              color: "white",
              border: "none",
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 600,
              cursor: isSubmitting ? "not-allowed" : "pointer",
              opacity: isSubmitting ? 0.6 : 1
            }}
          >
            {isSubmitting ? "Enregistrement..." : "Ajouter"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            style={{
              flex: 1,
              padding: "8px",
              background: "#e5e7eb",
              color: "#374151",
              border: "none",
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 600,
              cursor: isSubmitting ? "not-allowed" : "pointer",
              opacity: isSubmitting ? 0.6 : 1
            }}
          >
            Annuler
          </button>
        </div>
      </form>

      {notice && (
        <div
          onClick={() => setNotice(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(15,23,42,0.42)",
            backdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(420px, 92vw)",
              background: "white",
              borderRadius: 14,
              boxShadow: "0 24px 70px rgba(15,23,42,0.28)",
              border: "1px solid #e5e7eb",
              overflow: "hidden"
            }}
          >
            <div style={{
              padding: "18px 20px 10px",
              display: "flex",
              alignItems: "center",
              gap: 12
            }}>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "#eff6ff",
                color: "#1e40af",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                fontWeight: 800,
                flexShrink: 0
              }}>
                !
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#111827" }}>
                  {notice.title}
                </div>
                <div style={{ marginTop: 4, fontSize: 12, color: "#6b7280", lineHeight: 1.45 }}>
                  {notice.message}
                </div>
              </div>
            </div>

            <div style={{
              padding: "12px 20px 18px",
              display: "flex",
              justifyContent: "flex-end"
            }}>
              <button
                type="button"
                onClick={() => setNotice(null)}
                autoFocus
                style={{
                  minWidth: 92,
                  padding: "9px 16px",
                  borderRadius: 8,
                  border: "none",
                  background: "#1e3a8a",
                  color: "white",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(30,58,138,0.25)"
                }}
              >
                Compris
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
