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
    const aff = affectations.find(a => a.id === affectationId);
    if (!aff) return;

    // Fonction pour convertir date en string JJ/MM/AAAA
    const dateToString = (date) => {
      return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
    };

    // Créer la string du jour à supprimer
    const dayToDeleteNorm = new Date(dayToDelete);
    dayToDeleteNorm.setHours(0, 0, 0, 0);
    const dayToDeleteStr = dateToString(dayToDeleteNorm);

    // Normaliser les dates de l'affectation
    // Les dates brutes peuvent être en JJ/MM/AAAA déjà
    let dateDebutStr = aff.dateDebut;
    let dateFinStr = aff.dateFin;

    // Si c'est au format ISO, convertir en JJ/MM/AAAA
    if (aff.dateDebut && aff.dateDebut.includes('-')) {
      const d = new Date(aff.dateDebut);
      dateDebutStr = dateToString(d);
    }
    if (aff.dateFin && aff.dateFin.includes('-')) {
      const d = new Date(aff.dateFin);
      dateFinStr = dateToString(d);
    }

    console.log("=== COMPARAISON STRINGS ===");
    console.log("dateDebut:", dateDebutStr);
    console.log("dateFin:", dateFinStr);
    console.log("dayToDelete:", dayToDeleteStr);

    // Si c'est le seul jour → Supprimer complètement
    if (dateDebutStr === dateFinStr && dateDebutStr === dayToDeleteStr) {
      console.log("✓ Suppression complète (seul jour)");
      const result = await deleteAffectation(affectationId);
      if (!result.success) {
        alert("Erreur: " + (result.error || "Impossible de supprimer l'affectation"));
      }
      return;
    }

    // Si c'est le premier jour → Avancer la date de début
    if (dateDebutStr === dayToDeleteStr) {
      console.log("✓ Suppression du premier jour");
      const dateDebutDate = new Date(dayToDelete);
      const newStart = new Date(dateDebutDate);
      newStart.setDate(newStart.getDate() + 1);
      const newStartStr = dateToString(newStart);
      
      const result = await updateAffectation(
        affectationId,
        newStartStr,
        dateFinStr,
        aff.tache,
        "Actif"
      );
      if (!result.success) {
        alert("Erreur: " + (result.error || "Impossible de mettre à jour l'affectation"));
      }
      return;
    }

    // Si c'est le dernier jour → Reculer la date de fin
    if (dateFinStr === dayToDeleteStr) {
      console.log("✓ Suppression du dernier jour");
      const dateFinDate = new Date(dayToDelete);
      const newEnd = new Date(dateFinDate);
      newEnd.setDate(newEnd.getDate() - 1);
      const newEndStr = dateToString(newEnd);
      
      const result = await updateAffectation(
        affectationId,
        dateDebutStr,
        newEndStr,
        aff.tache,
        "Actif"
      );
      if (!result.success) {
        alert("Erreur: " + (result.error || "Impossible de mettre à jour l'affectation"));
      }
      return;
    }

    // Si c'est au milieu → Message erreur
    console.log("✗ Jour au milieu");
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
