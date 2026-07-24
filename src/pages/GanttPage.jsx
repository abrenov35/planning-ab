import React, { useContext, useState } from "react";
import { AppContext } from "../context/AppContext";
import { GanttChart } from "../components/GanttChart";
import { Modal } from "../components/Modal";
import { FormAffectation } from "../components/FormAffectation";

export const GanttPage = () => {
  const { ouvriers, chantiers, affectations, addAffectation, updateAffectation, deleteAffectation, loading } = useContext(AppContext);
  const [showAffectationModal, setShowAffectationModal] = useState(false);
  const [selectedOuvrier, setSelectedOuvrier] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [editingAffectation, setEditingAffectation] = useState(null);

  const handleAddAffectation = (ouvrierID, date) => {
    setSelectedOuvrier(ouvriers.find(o => o.id === ouvrierID));
    setSelectedDate(date);
    setEditingAffectation(null);
    setShowAffectationModal(true);
  };

  const handleAffectationClick = (affectation) => {
    setSelectedOuvrier(ouvriers.find(o => o.id === affectation.ouvrierID));
    setEditingAffectation(affectation);
    setShowAffectationModal(true);
  };

  const handleSubmitAffectation = async (formData) => {
    if (editingAffectation) {
      // Modification
      const result = await updateAffectation(
        editingAffectation.id,
        formData.dateDebut,
        formData.dateFin,
        formData.tache,
        "Actif"
      );
      if (result.success) {
        setShowAffectationModal(false);
        setEditingAffectation(null);
      } else {
        alert("Erreur: " + (result.error || "Impossible de modifier l'affectation"));
      }
    } else {
      // Création
      const result = await addAffectation(
        selectedOuvrier.id,
        formData.chantierId,
        formData.dateDebut,
        formData.dateFin,
        formData.tache
      );
      if (result.success) {
        setShowAffectationModal(false);
        setSelectedOuvrier(null);
        setSelectedDate(null);
      } else {
        alert("Erreur: " + (result.error || "Impossible d'ajouter l'affectation"));
      }
    }
  };

  const handleDeleteAffectation = async () => {
    if (editingAffectation) {
      const result = await deleteAffectation(editingAffectation.id);
      if (result.success) {
        setShowAffectationModal(false);
        setEditingAffectation(null);
      } else {
        alert("Erreur: " + (result.error || "Impossible de supprimer l'affectation"));
      }
    }
  };

  const handleDeleteAffectationDirect = async (affectationId) => {
    const result = await deleteAffectation(affectationId);
    if (!result.success) {
      alert("Erreur: " + (result.error || "Impossible de supprimer l'affectation"));
    }
  };

  const handleDeleteAffectationDay = async (affectationId, dayToDelete) => {
    // Trouver l'affectation
    const aff = affectations.find(a => a.id === affectationId);
    if (!aff) return;

    // Fonction pour normaliser les dates
    const parseDate = (dateStr) => {
      if (!dateStr) return null;
      let d;
      if (typeof dateStr === 'string' && dateStr.includes('/')) {
        const [day, month, year] = dateStr.split('/');
        d = new Date(year, month - 1, day);
      } else if (typeof dateStr === 'string' && dateStr.includes('-')) {
        d = new Date(dateStr); // Format ISO
      } else {
        d = new Date(dateStr);
      }
      d.setHours(0, 0, 0, 0);
      return d;
    };

    const dateDebut = parseDate(aff.dateDebut);
    const dateFin = parseDate(aff.dateFin);
    const dayToDeleteNorm = new Date(dayToDelete);
    dayToDeleteNorm.setHours(0, 0, 0, 0);

    console.log("Affectation ID:", affectationId);
    console.log("dateDebut:", dateDebut, "dateFin:", dateFin);
    console.log("dayToDelete:", dayToDeleteNorm);

    // Fonction pour convertir date en string JJ/MM/AAAA
    const dateToString = (date) => {
      return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
    };

    // Si c'est le seul jour → Supprimer complètement
    if (dateDebut.getTime() === dateFin.getTime() && dateDebut.getTime() === dayToDeleteNorm.getTime()) {
      console.log("Suppression complète (seul jour)");
      const result = await deleteAffectation(affectationId);
      if (!result.success) {
        alert("Erreur: " + (result.error || "Impossible de supprimer l'affectation"));
      }
      return;
    }

    // Si c'est le premier jour → Avancer la date de début
    if (dateDebut.getTime() === dayToDeleteNorm.getTime()) {
      console.log("Suppression du premier jour");
      const newStart = new Date(dayToDeleteNorm);
      newStart.setDate(newStart.getDate() + 1);
      const newStartStr = dateToString(newStart);
      console.log("Nouveau début:", newStartStr);
      const result = await updateAffectation(
        affectationId,
        newStartStr,
        aff.dateFin,
        aff.tache,
        "Actif"
      );
      if (!result.success) {
        alert("Erreur: " + (result.error || "Impossible de mettre à jour l'affectation"));
      }
      return;
    }

    // Si c'est le dernier jour → Reculer la date de fin
    if (dateFin.getTime() === dayToDeleteNorm.getTime()) {
      console.log("Suppression du dernier jour");
      const newEnd = new Date(dayToDeleteNorm);
      newEnd.setDate(newEnd.getDate() - 1);
      const newEndStr = dateToString(newEnd);
      console.log("Nouvelle fin:", newEndStr);
      const result = await updateAffectation(
        affectationId,
        aff.dateDebut,
        newEndStr,
        aff.tache,
        "Actif"
      );
      if (!result.success) {
        alert("Erreur: " + (result.error || "Impossible de mettre à jour l'affectation"));
      }
      return;
    }

    // Si c'est au milieu → Scinder en deux affectations
    console.log("Jour au milieu - impossible à supprimer");
    alert("Impossible de supprimer un jour au milieu de l'affectation. Vous devez créer deux affectations séparées.");
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
        onDeleteAffectation={handleDeleteAffectationDirect}
        onDeleteAffectationDay={handleDeleteAffectationDay}
      />

      {/* MODAL AFFECTATION */}
      <Modal
        isOpen={showAffectationModal}
        title={editingAffectation ? "Modifier affectation" : "Ajouter affectation"}
        onClose={() => setShowAffectationModal(false)}
      >
        {selectedOuvrier && (
          <FormAffectation
            affectation={editingAffectation}
            ouvrier={selectedOuvrier}
            chantiers={chantiers}
            onSubmit={handleSubmitAffectation}
            onCancel={() => setShowAffectationModal(false)}
            onDelete={handleDeleteAffectation}
            mode={editingAffectation ? "edit" : "add"}
          />
        )}
      </Modal>
    </div>
  );
};
