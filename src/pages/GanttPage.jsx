import React, { useContext, useState } from "react";
import { AppContext } from "../context/AppContext";
import { GanttChart } from "../components/GanttChart";
import { Modal } from "../components/Modal";
import { FormAffectation } from "../components/FormAffectation";

export const GanttPage = ({ onGanttControlsReady }) => {
  const {
    ouvriers,
    chantiers,
    affectations,
    addAffectation,
    updateAffectation,
    deleteAffectation,
    loading
  } = useContext(AppContext);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOuvrier, setSelectedOuvrier] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  const [editAffectation, setEditAffectation] = useState(null);
  const [editForm, setEditForm] = useState({
    dateDebut: "",
    dateFin: "",
    tache: ""
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleteStep, setDeleteStep] = useState(false);

  const parseDate = (dateStr) => {
    if (!dateStr) return null;

    if (typeof dateStr === "string" && dateStr.includes("/")) {
      const [d, m, y] = dateStr.split("/");
      return new Date(Number(y), Number(m) - 1, Number(d));
    }

    if (typeof dateStr === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [y, m, d] = dateStr.split("-");
      return new Date(Number(y), Number(m) - 1, Number(d));
    }

    return new Date(dateStr);
  };

  const toInputDate = (dateValue) => {
    const d = parseDate(dateValue);
    if (!d || Number.isNaN(d.getTime())) return "";

    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
  };

  const toApiDate = (isoDate) => {
    if (!isoDate) return "";
    const [y, m, d] = isoDate.split("-");
    return `${d}/${m}/${y}`;
  };

  const formatDateLongue = (dateValue) => {
    const date = parseDate(dateValue);
    if (!date || Number.isNaN(date.getTime())) return "Date inconnue";

    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  const handleAddAffectation = (ouvrierID, date) => {
    setSelectedOuvrier(
      ouvriers.find(o => Number(o.id) === Number(ouvrierID)) || null
    );
    setSelectedDate(date);
    setShowCreateModal(true);
  };

  const handleSubmitAffectation = async (formData) => {
    if (!selectedOuvrier) return;

    const result = await addAffectation(
      selectedOuvrier.id,
      formData.chantierId,
      formData.dateDebut,
      formData.dateFin,
      formData.tache
    );

    if (result.success) {
      setShowCreateModal(false);
      setSelectedOuvrier(null);
      setSelectedDate(null);
    } else {
      alert(
        "Erreur: " +
          (result.error || "Impossible de créer l'affectation")
      );
    }
  };

  const handleAffectationClick = (affectation) => {
    if (!affectation) return;

    setEditAffectation(affectation);
    setEditForm({
      dateDebut: toInputDate(affectation.dateDebut),
      dateFin: toInputDate(affectation.dateFin),
      tache: affectation.tache || ""
    });
    setDeleteStep(false);
  };

  const closeEditModal = () => {
    if (savingEdit) return;
    setEditAffectation(null);
    setDeleteStep(false);
  };

  const handleSaveEdit = async () => {
    if (!editAffectation || savingEdit) return;

    if (!editForm.dateDebut || !editForm.dateFin) {
      alert("Les dates de début et de fin sont obligatoires.");
      return;
    }

    if (editForm.dateFin < editForm.dateDebut) {
      alert("La date de fin ne peut pas être avant la date de début.");
      return;
    }

    setSavingEdit(true);

    try {
      const result = await updateAffectation(
        editAffectation.id,
        toApiDate(editForm.dateDebut),
        toApiDate(editForm.dateFin),
        editForm.tache || "ND",
        "Actif"
      );

      if (result?.error) {
        throw new Error(result.error);
      }

      setEditAffectation(null);
      setDeleteStep(false);
    } catch (error) {
      console.error("Erreur modification affectation:", error);
      alert("La modification n'a pas pu être enregistrée.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteEdit = async () => {
    if (!editAffectation || savingEdit) return;

    if (!deleteStep) {
      setDeleteStep(true);
      return;
    }

    setSavingEdit(true);

    try {
      const result = await deleteAffectation(editAffectation.id);

      if (result?.error) {
        throw new Error(result.error);
      }

      setEditAffectation(null);
      setDeleteStep(false);
    } catch (error) {
      console.error("Erreur suppression affectation:", error);
      alert("La suppression n'a pas pu être effectuée.");
    } finally {
      setSavingEdit(false);
    }
  };

  const editOuvrier = editAffectation
    ? ouvriers.find(o => Number(o.id) === Number(editAffectation.ouvrierID))
    : null;

  const editChantier = editAffectation
    ? chantiers.find(c => Number(c.id) === Number(editAffectation.chantierId))
    : null;

  const editHorsGantt =
    editAffectation &&
    (String(editAffectation.typeAffectation || "").toUpperCase() === "HORS_GANTT" ||
      !editChantier);

  if (loading) {
    return <div style={{ padding: "1rem" }}>Chargement...</div>;
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        flex: 1
      }}
    >
      <GanttChart
        ouvriers={ouvriers}
        chantiers={chantiers}
        affectations={affectations}
        onAddAffectation={handleAddAffectation}
        onAffectationClick={handleAffectationClick}
        onControlsReady={onGanttControlsReady}
      />

      <Modal
        isOpen={showCreateModal}
        title="Ajouter une affectation"
        onClose={() => {
          setShowCreateModal(false);
          setSelectedOuvrier(null);
          setSelectedDate(null);
        }}
      >
        {selectedOuvrier && (
          <FormAffectation
            ouvrier={selectedOuvrier}
            chantiers={chantiers}
            onSubmit={handleSubmitAffectation}
            onCancel={() => {
              setShowCreateModal(false);
              setSelectedOuvrier(null);
              setSelectedDate(null);
            }}
            selectedDate={selectedDate}
          />
        )}
      </Modal>

      <Modal
        isOpen={Boolean(editAffectation)}
        title="Modifier l'affectation"
        onClose={closeEditModal}
      >
        {editAffectation && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10
              }}
            >
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#374151" }}>
                  Ouvrier
                </label>
                <div
                  style={{
                    marginTop: 4,
                    padding: "8px 10px",
                    borderRadius: 6,
                    background: "#f3f4f6",
                    border: "1px solid #e5e7eb",
                    fontSize: 12
                  }}
                >
                  {editOuvrier?.nom || "Ouvrier inconnu"}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#374151" }}>
                  Affectation
                </label>
                <div
                  style={{
                    marginTop: 4,
                    padding: "8px 10px",
                    borderRadius: 6,
                    background: "#f3f4f6",
                    border: "1px solid #e5e7eb",
                    fontSize: 12
                  }}
                >
                  {editHorsGantt
                    ? editAffectation.nomExterne || "Événement Google"
                    : editChantier?.nom || "Chantier inconnu"}
                </div>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10
              }}
            >
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#374151" }}>
                  Date début
                </label>
                <input
                  type="date"
                  value={editForm.dateDebut}
                  onChange={e =>
                    setEditForm(prev => ({ ...prev, dateDebut: e.target.value }))
                  }
                  disabled={savingEdit}
                  style={{
                    width: "100%",
                    marginTop: 4,
                    padding: 8,
                    border: "1px solid #d1d5db",
                    borderRadius: 6,
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#374151" }}>
                  Date fin
                </label>
                <input
                  type="date"
                  value={editForm.dateFin}
                  onChange={e =>
                    setEditForm(prev => ({ ...prev, dateFin: e.target.value }))
                  }
                  disabled={savingEdit}
                  style={{
                    width: "100%",
                    marginTop: 4,
                    padding: 8,
                    border: "1px solid #d1d5db",
                    borderRadius: 6,
                    boxSizing: "border-box"
                  }}
                />
              </div>
            </div>

            {!editHorsGantt && (
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#374151" }}>
                  Tâche / description
                </label>
                <input
                  type="text"
                  value={editForm.tache}
                  onChange={e =>
                    setEditForm(prev => ({ ...prev, tache: e.target.value }))
                  }
                  disabled={savingEdit}
                  style={{
                    width: "100%",
                    marginTop: 4,
                    padding: 8,
                    border: "1px solid #d1d5db",
                    borderRadius: 6,
                    boxSizing: "border-box"
                  }}
                />
              </div>
            )}

            <div
              style={{
                padding: "9px 10px",
                borderRadius: 6,
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                color: "#1e40af",
                fontSize: 11,
                lineHeight: 1.4
              }}
            >
              Période actuelle : {formatDateLongue(editAffectation.dateDebut)}
              {String(editAffectation.dateDebut) !== String(editAffectation.dateFin)
                ? ` → ${formatDateLongue(editAffectation.dateFin)}`
                : ""}
            </div>

            {deleteStep && (
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: 6,
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#991b1b",
                  fontSize: 12,
                  fontWeight: 600
                }}
              >
                Confirmer la suppression de cette affectation ? Elle sera également supprimée de Google Calendar.
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 8,
                marginTop: 4
              }}
            >
              <button
                type="button"
                onClick={handleDeleteEdit}
                disabled={savingEdit}
                style={{
                  padding: "9px 14px",
                  borderRadius: 6,
                  border: "1px solid #dc2626",
                  background: deleteStep ? "#991b1b" : "#dc2626",
                  color: "white",
                  fontWeight: 700,
                  cursor: savingEdit ? "not-allowed" : "pointer"
                }}
              >
                {savingEdit && deleteStep
                  ? "Suppression..."
                  : deleteStep
                  ? "Confirmer la suppression"
                  : "Supprimer"}
              </button>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={savingEdit}
                  style={{
                    padding: "9px 14px",
                    borderRadius: 6,
                    border: "1px solid #d1d5db",
                    background: "white",
                    color: "#374151",
                    fontWeight: 600,
                    cursor: savingEdit ? "not-allowed" : "pointer"
                  }}
                >
                  Annuler
                </button>

                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={savingEdit || deleteStep}
                  style={{
                    padding: "9px 14px",
                    borderRadius: 6,
                    border: "none",
                    background: savingEdit || deleteStep ? "#9ca3af" : "#1e3a8a",
                    color: "white",
                    fontWeight: 700,
                    cursor: savingEdit || deleteStep ? "not-allowed" : "pointer"
                  }}
                >
                  {savingEdit && !deleteStep ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
