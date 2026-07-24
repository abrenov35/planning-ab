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

    // Fonction pour convertir date en string JJ/MM/AAAA (fuseau horaire indépendant)
    const dateToString = (dateStr) => {
      if (!dateStr) return null;
      let d;
      if (typeof dateStr === 'string' && dateStr.includes('/')) {
        return dateStr;
      } else if (typeof dateStr === 'string' && dateStr.includes('-')) {
        const match = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
        if (match) {
          const [, year, month, day] = match;
          return `${day}/${month}/${year}`;
        }
      } else {
        d = new Date(dateStr);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
      }
      return null;
    };

    // Normaliser les dates
    const dateDebutStr = dateToString(aff.dateDebut);
    const dateFinStr = dateToString(aff.dateFin);

    // Créer la string du jour à supprimer - NORMALISÉ
    const dayToDeleteDate = new Date(dayToDelete);
    dayToDeleteDate.setHours(0, 0, 0, 0);  // Forcer minuit
    const dayToDeleteStr = `${String(dayToDeleteDate.getDate()).padStart(2, '0')}/${String(dayToDeleteDate.getMonth() + 1).padStart(2, '0')}/${dayToDeleteDate.getFullYear()}`;

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
      const dayDate = new Date(dayToDelete);
      const newStart = new Date(dayDate);
      newStart.setDate(newStart.getDate() + 1);
      const newStartStr = `${String(newStart.getDate()).padStart(2, '0')}/${String(newStart.getMonth() + 1).padStart(2, '0')}/${newStart.getFullYear()}`;
      
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
      const dayDate = new Date(dayToDelete);
      const newEnd = new Date(dayDate);
      newEnd.setDate(newEnd.getDate() - 1);
      const newEndStr = `${String(newEnd.getDate()).padStart(2, '0')}/${String(newEnd.getMonth() + 1).padStart(2, '0')}/${newEnd.getFullYear()}`;
      
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

    // Si c'est au milieu → SCINDER AUTOMATIQUEMENT EN 2
    console.log("✓ JOUR AU MILIEU - Découpage automatique en 2 affectations");
    
    // Affectation 1 : dateDebut → jour précédent
    const dayBeforeDate = new Date(dayToDelete);
    dayBeforeDate.setDate(dayBeforeDate.getDate() - 1);
    const dateBeforeStr = `${String(dayBeforeDate.getDate()).padStart(2, '0')}/${String(dayBeforeDate.getMonth() + 1).padStart(2, '0')}/${dayBeforeDate.getFullYear()}`;

    // Affectation 2 : jour suivant → dateFin
    const dayAfterDate = new Date(dayToDelete);
    dayAfterDate.setDate(dayAfterDate.getDate() + 1);
    const dateAfterStr = `${String(dayAfterDate.getDate()).padStart(2, '0')}/${String(dayAfterDate.getMonth() + 1).padStart(2, '0')}/${dayAfterDate.getFullYear()}`;

    console.log("Création affectation 1:", dateDebutStr, "→", dateBeforeStr);
    console.log("Création affectation 2:", dateAfterStr, "→", dateFinStr);

    // Créer affectation 1
    const result1 = await addAffectation(
      aff.ouvrierID,
      aff.chantierId,
      dateDebutStr,
      dateBeforeStr,
      aff.tache
    );

    if (!result1.success) {
      alert("Erreur création affectation 1: " + result1.error);
      return;
    }

    // Créer affectation 2
    const result2 = await addAffectation(
      aff.ouvrierID,
      aff.chantierId,
      dateAfterStr,
      dateFinStr,
      aff.tache
    );

    if (!result2.success) {
      alert("Erreur création affectation 2: " + result2.error);
      // Supprimer affectation 1 si la 2ème échoue
      await deleteAffectation(result1.data.id);
      return;
    }

    // Supprimer l'affectation originale
    const result3 = await deleteAffectation(affectationId);
    if (!result3.success) {
      alert("Erreur suppression originale: " + result3.error);
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
