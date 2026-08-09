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

  // ===== CROIX : Supprimer un jour =====
  const handleDeleteAffectationDay = async (affectationId, dayToDelete) => {
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

    try {
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
    } catch (error) {
      console.error("Erreur suppression jour:", error);
    }
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

  const handleAffectationClick = async (affectation) => {
    try {
      await deleteAffectation(affectation.id);
    } catch (error) {
      console.error("Erreur suppression affectation:", error);
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
    </div>
  );
};
