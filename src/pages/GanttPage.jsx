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

  if (loading) return <div style={{ padding: "1rem" }}>Chargement...</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", flex: 1 }}>
      <GanttChart
        ouvriers={ouvriers}
        chantiers={chantiers}
        affectations={affectations}
        onAddAffectation={handleAddAffectation}
        onAffectationClick={handleAffectationClick}
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
            mode={editingAffectation ? "edit" : "add"}
          />
        )}
      </Modal>
    </div>
  );
};
