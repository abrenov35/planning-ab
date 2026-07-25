import React, { useContext, useState } from "react";
import { AppContext } from "../context/AppContext";
import { GanttChart } from "../components/GanttChart";
import { Modal } from "../components/Modal";
import { FormAffectationV2 } from "../components/FormAffectationV2";

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

  // Suppression d'un jour spécifique avec scission automatique
  const handleDeleteAffectationDay = async (affectationId, dayToDelete) => {
    const aff = affectations.find(a => a.id === affectationId);
    if (!aff) return;

    // Parser une date JJ/MM/AAAA
    const parseDate = (dateStr) => {
      if (typeof dateStr === 'string' && dateStr.includes('/')) {
        const [d, m, y] = dateStr.split('/');
        return new Date(parseInt(y), parseInt(m)-1, parseInt(d));
      } else if (typeof dateStr === 'string' && dateStr.includes('-')) {
        const [y, m, d] = dateStr.split('-');
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

    console.log("🗑️ Suppression jour:", { 
      debut: dateToString(affStart), 
      fin: dateToString(affEnd), 
      delete: dateToString(deleteDate) 
    });

    // ✅ VÉRIFICATION : Le jour est-il dans la plage ?
    if (deleteDate < affStart || deleteDate > affEnd) {
      console.log("❌ ERREUR: Le jour cliqué n'est pas dans l'affectation !");
      alert(`Le ${dateToString(deleteDate)} n'est pas dans l'affectation (${dateToString(affStart)} → ${dateToString(affEnd)})`);
      return;
    }

    // ✅ SEUL JOUR → Supprimer complètement
    if (affStart.getTime() === affEnd.getTime() && affStart.getTime() === deleteDate.getTime()) {
      console.log("✓ Suppression complète (seul jour)");
      await deleteAffectation(affectationId);
      return;
    }

    // ✅ PREMIER JOUR → Avancer le début
    if (affStart.getTime() === deleteDate.getTime()) {
      console.log("✓ Raccourcir le début");
      const newStart = new Date(deleteDate);
      newStart.setDate(newStart.getDate() + 1);
      await updateAffectation(affectationId, dateToString(newStart), dateToString(affEnd), aff.tache, "Actif");
      return;
    }

    // ✅ DERNIER JOUR → Reculer la fin
    if (affEnd.getTime() === deleteDate.getTime()) {
      console.log("✓ Raccourcir la fin");
      const newEnd = new Date(deleteDate);
      newEnd.setDate(newEnd.getDate() - 1);
      await updateAffectation(affectationId, dateToString(affStart), dateToString(newEnd), aff.tache, "Actif");
      return;
    }

    // ✅ AU MILIEU → SCINDER EN 2 AFFECTATIONS
    console.log("✓ Jour au milieu - scinder en 2 affectations");
    
    const part1End = new Date(deleteDate);
    part1End.setDate(part1End.getDate() - 1);
    
    const part2Start = new Date(deleteDate);
    part2Start.setDate(part2Start.getDate() + 1);

    console.log("Créer aff 1:", dateToString(affStart), "→", dateToString(part1End));
    console.log("Créer aff 2:", dateToString(part2Start), "→", dateToString(affEnd));

    // Créer affectation 1
    const res1 = await addAffectation(
      aff.ouvrierID,
      aff.chantierId,
      dateToString(affStart),
      dateToString(part1End),
      aff.tache
    );
    
    if (!res1.success) {
      alert("Erreur création affectation 1");
      return;
    }

    // Créer affectation 2
    const res2 = await addAffectation(
      aff.ouvrierID,
      aff.chantierId,
      dateToString(part2Start),
      dateToString(affEnd),
      aff.tache
    );
    
    if (!res2.success) {
      alert("Erreur création affectation 2");
      await deleteAffectation(res1.data.id);
      return;
    }

    // Supprimer l'affectation originale
    await deleteAffectation(affectationId);
    console.log("✅ Scission complète !");
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
          <FormAffectationV2
            affectation={editingAffectation}
            ouvrier={selectedOuvrier}
            chantiers={chantiers}
            onSubmit={handleSubmitAffectation}
            onCancel={() => setShowAffectationModal(false)}
            onDelete={handleDeleteAffectation}
            mode={editingAffectation ? "edit" : "add"}
            selectedDate={selectedDate}
          />
        )}
      </Modal>
    </div>
  );
};
