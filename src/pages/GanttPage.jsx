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

    // Convertir date en string JJ/MM/AAAA
    const dateToString = (dateStr) => {
      if (!dateStr) return null;
      if (typeof dateStr === 'string' && dateStr.includes('/')) return dateStr;
      if (typeof dateStr === 'string' && dateStr.includes('-')) {
        const match = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
        if (match) {
          const [, year, month, day] = match;
          return `${day}/${month}/${year}`;
        }
      } else {
        const d = new Date(dateStr);
        return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
      }
      return null;
    };

    const dateDebutStr = dateToString(aff.dateDebut);
    const dateFinStr = dateToString(aff.dateFin);

    const dayToDeleteDate = new Date(dayToDelete);
    dayToDeleteDate.setHours(0, 0, 0, 0);
    const dayToDeleteStr = `${String(dayToDeleteDate.getDate()).padStart(2,'0')}/${String(dayToDeleteDate.getMonth()+1).padStart(2,'0')}/${dayToDeleteDate.getFullYear()}`;

    console.log("🗑️ Suppression jour:", { debut: dateDebutStr, fin: dateFinStr, delete: dayToDeleteStr });

    // ➡️ SEUL JOUR → Supprimer complètement
    if (dateDebutStr === dateFinStr && dateDebutStr === dayToDeleteStr) {
      console.log("✓ Suppression complète");
      await deleteAffectation(affectationId);
      return;
    }

    // ➡️ PREMIER JOUR → Avancer le début
    if (dateDebutStr === dayToDeleteStr) {
      console.log("✓ Raccourcir le début");
      const newStart = new Date(dayToDelete);
      newStart.setDate(newStart.getDate() + 1);
      const newStartStr = `${String(newStart.getDate()).padStart(2,'0')}/${String(newStart.getMonth()+1).padStart(2,'0')}/${newStart.getFullYear()}`;
      await updateAffectation(affectationId, newStartStr, dateFinStr, aff.tache, "Actif");
      return;
    }

    // ➡️ DERNIER JOUR → Reculer la fin
    if (dateFinStr === dayToDeleteStr) {
      console.log("✓ Raccourcir la fin");
      const newEnd = new Date(dayToDelete);
      newEnd.setDate(newEnd.getDate() - 1);
      const newEndStr = `${String(newEnd.getDate()).padStart(2,'0')}/${String(newEnd.getMonth()+1).padStart(2,'0')}/${newEnd.getFullYear()}`;
      await updateAffectation(affectationId, dateDebutStr, newEndStr, aff.tache, "Actif");
      return;
    }

    // ➡️ AU MILIEU → Refus simple
    console.log("❌ Jour au milieu - impossible");
    alert(`Impossible de supprimer un jour au milieu.\n\nVous pouvez:\n• Supprimer le premier jour (${dateDebutStr})\n• Supprimer le dernier jour (${dateFinStr})\n• Supprimer toute l'affectation`);
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
