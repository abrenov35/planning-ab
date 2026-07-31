import React, { useContext, useState } from "react";
import { AppContext } from "../context/AppContext";
import { GanttChart } from "../components/GanttChart";
import { Modal } from "../components/Modal";
import { FormAffectation } from "../components/FormAffectation";
import { ConfirmModal } from "../components/ConfirmModal";

export const GanttPage = ({ onGanttControlsReady }) => {
  const { ouvriers, chantiers, affectations, addAffectation, updateAffectation, deleteAffectation, loading } = useContext(AppContext);

  // STATES
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteDayConfirm, setShowDeleteDayConfirm] = useState(null);
  const [selectedOuvrier, setSelectedOuvrier] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isLoadingDeleteDay, setIsLoadingDeleteDay] = useState(false);

  // ===== CROIX : Supprimer un jour =====
  const handleDeleteAffectationDay = (affectationId, dayToDelete) => {
    // Éviter les appels multiples
    if (showDeleteDayConfirm) return;

    const aff = affectations.find(a => a.id === affectationId);
    if (!aff) return;

    const parseDate = (dateStr) => {
      if (typeof dateStr === 'string' && dateStr.includes('/')) {
        const [d, m, y] = dateStr.split('/');
        return new Date(parseInt(y), parseInt(m)-1, parseInt(d));
      }
      return new Date(dateStr);
    };

    const dateToString = (d) => 
      `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;

    const affStart = parseDate(aff.dateDebut);
    const affEnd = parseDate(aff.dateFin);
    const deleteDate = new Date(dayToDelete);
    
    affStart.setHours(0,0,0,0);
    affEnd.setHours(0,0,0,0);
    deleteDate.setHours(0,0,0,0);

    // Vérif
    if (deleteDate < affStart || deleteDate > affEnd) {
      alert(`Le ${dateToString(deleteDate)} n'est pas dans cette affectation`);
      return;
    }

    // Ouvrir le modal JUSTE UNE FOIS
    setShowDeleteDayConfirm({
      affectationId,
      dayString: dateToString(deleteDate),
      affStart,
      affEnd,
      deleteDate,
      aff
    });
  };

  const confirmDeleteDay = async () => {
    if (!showDeleteDayConfirm || isLoadingDeleteDay) return;

    setIsLoadingDeleteDay(true);
    
    // Fermer le modal IMMÉDIATEMENT
    const confirm = showDeleteDayConfirm;
    setShowDeleteDayConfirm(null);

    const { affectationId, affStart, affEnd, deleteDate, aff } = confirm;

    const dateToString = (d) => 
      `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;

    try {
      // SEUL JOUR
      if (affStart.getTime() === affEnd.getTime() && affStart.getTime() === deleteDate.getTime()) {
        await deleteAffectation(affectationId);
        setIsLoadingDeleteDay(false);
        return;
      }

      // PREMIER JOUR
      if (affStart.getTime() === deleteDate.getTime()) {
        const newStart = new Date(deleteDate);
        newStart.setDate(newStart.getDate() + 1);
        await updateAffectation(affectationId, dateToString(newStart), dateToString(affEnd), aff.tache, "Actif");
        setIsLoadingDeleteDay(false);
        return;
      }

      // DERNIER JOUR
      if (affEnd.getTime() === deleteDate.getTime()) {
        const newEnd = new Date(deleteDate);
        newEnd.setDate(newEnd.getDate() - 1);
        await updateAffectation(affectationId, dateToString(affStart), dateToString(newEnd), aff.tache, "Actif");
        setIsLoadingDeleteDay(false);
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
        aff.tache
      );
      
      if (!res1.success) {
        console.error("Erreur création affectation 1");
        setIsLoadingDeleteDay(false);
        return;
      }

      const res2 = await addAffectation(
        aff.ouvrierID,
        aff.chantierId,
        dateToString(part2Start),
        dateToString(affEnd),
        aff.tache
      );
      
      if (!res2.success) {
        console.error("Erreur création affectation 2");
        await deleteAffectation(res1.data.id);
        setIsLoadingDeleteDay(false);
        return;
      }

      await deleteAffectation(affectationId);
      setIsLoadingDeleteDay(false);
    } catch (error) {
      console.error("Erreur suppression jour:", error);
      setIsLoadingDeleteDay(false);
    }
  };

  // ===== CRÉATION AFFECTATION : Ouvrir formulaire =====
  const handleAddAffectation = (ouvrierID, date) => {
    setSelectedOuvrier(ouvriers.find(o => o.id === ouvrierID));
    setSelectedDate(date);
    setShowCreateModal(true);
  };

  // Submit du formulaire de création
  const handleSubmitAffectation = async (formData) => {
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
      alert("Erreur: " + (result.error || "Impossible de créer l'affectation"));
    }
  };

  const handleAffectationClick = async (affectation) => {
    // Supprimer directement sans confirmation
    try {
      await deleteAffectation(affectation.id);
    } catch (error) {
      console.error("Erreur suppression affectation:", error);
    }
  };

  if (loading) return <div style={{ padding: "1rem" }}>Chargement...</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", flex: 1 }}>
      <GanttChart
        ouvriers={ouvriers}
        chantiers={chantiers}
        affectations={affectations}
        onAddAffectation={handleAddAffectation}
        onAffectationClick={handleAffectationClick}
        onDeleteAffectationDay={handleDeleteAffectationDay}
        onControlsReady={onGanttControlsReady}
      />

      {/* MODAL CRÉATION AFFECTATION */}
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

      {/* MODAL CONFIRMATION - Supprimer un jour */}
      <ConfirmModal
        isOpen={!!showDeleteDayConfirm}
        title="Supprimer ce jour ?"
        message={`Êtes-vous sûr de vouloir supprimer le ${showDeleteDayConfirm?.dayString} ?`}
        onConfirm={confirmDeleteDay}
        onCancel={() => !isLoadingDeleteDay && setShowDeleteDayConfirm(null)}
        confirmText="Supprimer"
        cancelText="Annuler"
        isDangerous={true}
        isLoading={isLoadingDeleteDay}
      />
    </div>
  );
};
