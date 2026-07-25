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

  const handleDeleteAffectationDay = async (affectationId, clickType) => {
    const aff = affectations.find(a => a.id === affectationId);
    if (!aff) return;

    console.log("=== SUPPRESSION ===");
    console.log("Type de clic:", clickType);
    console.log("Affectation:", aff.id, { debut: aff.dateDebut, fin: aff.dateFin });

    // Convertir en JJ/MM/AAAA
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

    // ➡️ SEUL JOUR
    if (clickType === "SEUL") {
      console.log("✓ Suppression complète (seul jour)");
      await deleteAffectation(affectationId);
      return;
    }

    // ➡️ PREMIER JOUR
    if (clickType === "PREMIER") {
      console.log("✓ Raccourcir le début");
      // Calculer le jour suivant
      const [d, m, y] = dateDebutStr.split('/');
      const nextDay = new Date(parseInt(y), parseInt(m)-1, parseInt(d)+1);
      const newStart = `${String(nextDay.getDate()).padStart(2,'0')}/${String(nextDay.getMonth()+1).padStart(2,'0')}/${nextDay.getFullYear()}`;
      console.log("Nouvelle date début:", newStart);
      const result = await updateAffectation(affectationId, newStart, dateFinStr, aff.tache, "Actif");
      console.log("Résultat:", result);
      return;
    }

    // ➡️ DERNIER JOUR
    if (clickType === "DERNIER") {
      console.log("✓ Raccourcir la fin");
      // Calculer le jour précédent
      const [d, m, y] = dateFinStr.split('/');
      const prevDay = new Date(parseInt(y), parseInt(m)-1, parseInt(d)-1);
      const newEnd = `${String(prevDay.getDate()).padStart(2,'0')}/${String(prevDay.getMonth()+1).padStart(2,'0')}/${prevDay.getFullYear()}`;
      console.log("Nouvelle date fin:", newEnd);
      const result = await updateAffectation(affectationId, dateDebutStr, newEnd, aff.tache, "Actif");
      console.log("Résultat:", result);
      return;
    }

    // ➡️ AU MILIEU
    if (clickType === "MILIEU") {
      console.log("❌ Jour au milieu - impossible");
      alert(`Impossible de supprimer un jour au milieu.\n\nVous pouvez:\n• Supprimer le premier jour (${dateDebutStr})\n• Supprimer le dernier jour (${dateFinStr})\n• Supprimer toute l'affectation`);
      return;
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
