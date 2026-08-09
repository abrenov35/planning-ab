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

  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const parseDate = (dateStr) => {
    if (typeof dateStr === "string" && dateStr.includes("/")) {
      const [d, m, y] = dateStr.split("/");
      return new Date(Number(y), Number(m) - 1, Number(d));
    }

    return new Date(dateStr);
  };

  const dateToString = (d) =>
    `${String(d.getDate()).padStart(2, "0")}/${String(
      d.getMonth() + 1
    ).padStart(2, "0")}/${d.getFullYear()}`;

  const formatDateLongue = (dateValue) => {
    const date = parseDate(dateValue);
    if (Number.isNaN(date.getTime())) return "Date inconnue";

    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  const getDeleteDetails = (aff, date = null) => {
    const ouvrier = ouvriers.find(
      o => Number(o.id) === Number(aff?.ouvrierID)
    );

    const chantier = chantiers.find(
      c => Number(c.id) === Number(aff?.chantierId)
    );

    const horsGantt =
      String(aff?.typeAffectation || "").toUpperCase() === "HORS_GANTT" ||
      !chantier;

    return {
      ouvrierNom: ouvrier?.nom || "Ouvrier inconnu",
      cibleNom: horsGantt
        ? aff?.nomExterne || "Événement Google"
        : chantier?.nom || "Affectation",
      dateTexte: date
        ? formatDateLongue(date)
        : aff?.dateDebut === aff?.dateFin
        ? formatDateLongue(aff?.dateDebut)
        : `${formatDateLongue(aff?.dateDebut)} → ${formatDateLongue(aff?.dateFin)}`,
      horsGantt
    };
  };

  const executeDeleteAffectationDay = async (affectationId, dayToDelete) => {
    const aff = affectations.find(
      a => Number(a.id) === Number(affectationId)
    );

    if (!aff) return;

    const affStart = parseDate(aff.dateDebut);
    const affEnd = parseDate(aff.dateFin);
    const deleteDate = new Date(dayToDelete);

    if (
      Number.isNaN(affStart.getTime()) ||
      Number.isNaN(affEnd.getTime()) ||
      Number.isNaN(deleteDate.getTime())
    ) {
      console.error("Date invalide pour suppression", aff);
      return;
    }

    affStart.setHours(0, 0, 0, 0);
    affEnd.setHours(0, 0, 0, 0);
    deleteDate.setHours(0, 0, 0, 0);

    if (deleteDate < affStart || deleteDate > affEnd) return;

    // SEUL JOUR
    if (
      affStart.getTime() === affEnd.getTime() &&
      affStart.getTime() === deleteDate.getTime()
    ) {
      await deleteAffectation(affectationId);
      return;
    }

    // PREMIER JOUR
    if (affStart.getTime() === deleteDate.getTime()) {
      const newStart = new Date(deleteDate);
      newStart.setDate(newStart.getDate() + 1);

      await updateAffectation(
        affectationId,
        dateToString(newStart),
        dateToString(affEnd),
        aff.tache || "",
        "Actif"
      );
      return;
    }

    // DERNIER JOUR
    if (affEnd.getTime() === deleteDate.getTime()) {
      const newEnd = new Date(deleteDate);
      newEnd.setDate(newEnd.getDate() - 1);

      await updateAffectation(
        affectationId,
        dateToString(affStart),
        dateToString(newEnd),
        aff.tache || "",
        "Actif"
      );
      return;
    }

    // HORS_GANTT : la scission en deux nécessiterait une création
    // spéciale sans chantier. On ne la fait pas silencieusement.
    if (
      String(aff.typeAffectation || "").toUpperCase() === "HORS_GANTT"
    ) {
      console.warn(
        "Scission HORS_GANTT non exécutée : supprimer/modifier depuis Google Agenda."
      );
      return;
    }

    // AU MILIEU - SCINDER
    const part1End = new Date(deleteDate);
    part1End.setDate(part1End.getDate() - 1);

    const part2Start = new Date(deleteDate);
    part2Start.setDate(part2Start.getDate() + 1);

    const res1 = await addAffectation(
      aff.ouvrierID,
      aff.chantierId,
      dateToString(affStart),
      dateToString(part1End),
      aff.tache || "ND"
    );

    if (!res1.success) return;

    const res2 = await addAffectation(
      aff.ouvrierID,
      aff.chantierId,
      dateToString(part2Start),
      dateToString(affEnd),
      aff.tache || "ND"
    );

    if (!res2.success) {
      if (res1.id) {
        await deleteAffectation(res1.id);
      }
      return;
    }

    await deleteAffectation(affectationId);
  };

  // ===== CROIX : demander confirmation avant suppression d'un jour =====
  const handleDeleteAffectationDay = (affectationId, dayToDelete) => {
    const aff = affectations.find(
      a => Number(a.id) === Number(affectationId)
    );

    if (!aff) return;

    setDeleteConfirm({
      mode: "day",
      affectation: aff,
      date: dayToDelete,
      details: getDeleteDetails(aff, dayToDelete)
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

  // ===== CLIC SUR AFFECTATION : demander confirmation avant suppression =====
  const handleAffectationClick = (affectation) => {
    if (!affectation) return;

    setDeleteConfirm({
      mode: "full",
      affectation,
      date: null,
      details: getDeleteDetails(affectation)
    });
  };

  const closeDeleteConfirm = () => {
    if (deleting) return;
    setDeleteConfirm(null);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm || deleting) return;

    setDeleting(true);

    try {
      if (deleteConfirm.mode === "day") {
        await executeDeleteAffectationDay(
          deleteConfirm.affectation.id,
          deleteConfirm.date
        );
      } else {
        await deleteAffectation(deleteConfirm.affectation.id);
      }

      setDeleteConfirm(null);
    } catch (error) {
      console.error("Erreur suppression affectation:", error);
      alert("La suppression n'a pas pu être effectuée.");
    } finally {
      setDeleting(false);
    }
  };

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
        onDeleteAffectationDay={handleDeleteAffectationDay}
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
        isOpen={Boolean(deleteConfirm)}
        title={
          deleteConfirm?.mode === "day"
            ? "Supprimer ce jour ?"
            : "Supprimer cette affectation ?"
        }
        onClose={closeDeleteConfirm}
      >
        {deleteConfirm && (
          <div style={{ minWidth: 320, maxWidth: 440 }}>
            <div
              style={{
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                padding: "12px 14px",
                marginBottom: 14
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
                {deleteConfirm.details.ouvrierNom} — {deleteConfirm.details.cibleNom}
              </div>
              <div style={{ marginTop: 6, fontSize: 12, color: "#4b5563" }}>
                {deleteConfirm.details.dateTexte}
              </div>
            </div>

            <div
              style={{
                fontSize: 12,
                color: "#991b1b",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 8,
                padding: "10px 12px",
                marginBottom: 16,
                lineHeight: 1.4
              }}
            >
              {deleteConfirm.mode === "day"
                ? "Ce jour sera retiré de l'affectation. La synchronisation Google sera mise à jour automatiquement."
                : "Cette affectation sera supprimée du Gantt et de Google Calendar lorsqu'elle est synchronisée."}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 8
              }}
            >
              <button
                type="button"
                onClick={closeDeleteConfirm}
                disabled={deleting}
                style={{
                  padding: "8px 14px",
                  border: "1px solid #d1d5db",
                  background: "white",
                  color: "#374151",
                  borderRadius: 6,
                  cursor: deleting ? "not-allowed" : "pointer",
                  fontWeight: 600
                }}
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                style={{
                  padding: "8px 14px",
                  border: "1px solid #dc2626",
                  background: deleting ? "#fca5a5" : "#dc2626",
                  color: "white",
                  borderRadius: 6,
                  cursor: deleting ? "not-allowed" : "pointer",
                  fontWeight: 700
                }}
              >
                {deleting ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
