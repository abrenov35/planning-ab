import React, { useContext, useState } from "react";
import { AppContext } from "../context/AppContext";
import { Modal } from "../components/Modal";
import { FormChantier } from "../components/FormChantier";

export const ChantierPage = () => {
  const { chantiers, addChantier, updateChantier, deleteChantier, loading } = useContext(AppContext);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingChantier, setEditingChantier] = useState(null);
  const [isArchivedExpanded, setIsArchivedExpanded] = useState(false);

  const handleAddChantier = async (formData) => {
    setShowAddModal(false);
    try {
      const result = await addChantier(formData.nom, formData.dateDebut || "", "", formData.description, formData.couleur || "", formData.dateSignature || "", formData.typeChantier || "Rénovation");
      if (!result.success) alert("Erreur: " + (result.error || "Impossible d'ajouter le chantier"));
    } catch (error) {
      console.error("Erreur lors de la création du chantier:", error);
      alert("Erreur: impossible d'ajouter le chantier. Vérifiez la connexion puis réessayez.");
    }
  };

  const handleUpdateChantier = async (formData) => {
    const chantierId = editingChantier.id;
    setEditingChantier(null);
    try {
      const result = await updateChantier(chantierId, formData.nom, formData.dateDebut || "", "", formData.description, formData.statut, formData.couleur || "", formData.dateSignature || "", formData.typeChantier || "Rénovation");
      if (!result.success) alert("Erreur: " + (result.error || "Impossible de modifier le chantier"));
    } catch (error) {
      console.error("Erreur lors de la modification du chantier:", error);
      alert("Erreur: impossible de modifier le chantier. Vérifiez la connexion puis réessayez.");
    }
  };

  const handleDeleteChantier = async (chantier) => {
    const result = await deleteChantier(chantier.id);
    if (result.success) {
      setEditingChantier(null);
      return;
    }
    if (result.code === "HAS_AFFECTATIONS") {
      alert(`Suppression impossible : le chantier « ${chantier.nom} » possède encore ${result.count || "des"} affectation(s).\n\nSupprime ou déplace d'abord ses affectations.`);
      return;
    }
    alert("Erreur: " + (result.error || "Impossible de supprimer le chantier"));
  };

  if (loading) return <div style={{ padding: "2rem" }}>Chargement...</div>;

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const days = ["jan", "fév", "mar", "avr", "mai", "jun", "jul", "aoû", "sep", "oct", "nov", "déc"];
    return `${String(date.getDate()).padStart(2, "0")} ${days[date.getMonth()]}`;
  };

  const formatDateSignature = (dateStr) => {
    if (!dateStr) return "";
    const moisNoms = ["janv.", "fév.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
    const valeur = String(dateStr).trim();
    const correspondance = valeur.match(/^(\d{4})-(\d{2})/);
    if (correspondance) {
      const indexMois = Number(correspondance[2]) - 1;
      return moisNoms[indexMois] ? `${moisNoms[indexMois]} ${correspondance[1]}` : "";
    }
    const date = new Date(valeur);
    return Number.isNaN(date.getTime()) ? "" : `${moisNoms[date.getMonth()]} ${date.getFullYear()}`;
  };

  const triAlpha = (a, b) => String(a.nom || "").localeCompare(String(b.nom || ""), "fr", { sensitivity: "base", numeric: true });
  const actifs = chantiers.filter(c => c.statut === "Actif").sort(triAlpha);
  const archived = chantiers.filter(c => c.statut === "Archivé").sort(triAlpha);

  const rows = (liste, archive = false) => liste.map((chantier, idx) => (
    <tr key={chantier.id} style={{ borderBottom: "1px solid #d1d5db", background: idx % 2 === 0 ? "white" : "#f3f4f6" }}>
      <td style={{ padding: 8, color: "#374151", fontWeight: 500, fontSize: 11 }}>
        <span style={{display:"inline-flex",alignItems:"center",gap:7}}>
          {chantier.couleur && <span title="Couleur personnalisée" style={{width:10,height:10,borderRadius:"50%",background:chantier.couleur,border:"1px solid rgba(0,0,0,.18)",display:"inline-block"}}/>}
          {chantier.nom}
        </span>
      </td>
      <td style={{ padding: "8px 20px", color: "#374151", fontSize: 10, whiteSpace: "nowrap", width: "180px" }}>
        <span style={{ fontWeight: 600 }}>Signature :</span> {formatDateSignature(chantier.dateSignature)}
      </td>
      <td style={{ padding: "8px 20px", color: "#374151", fontSize: 10, whiteSpace: "nowrap", width: "130px" }}>
        <span style={{ fontWeight: 600 }}>Début :</span> {chantier.dateDebut ? formatDate(chantier.dateDebut) : ""}
      </td>
      <td style={{ padding: 8, textAlign: "center" }}><button onClick={() => setEditingChantier(chantier)} style={{ padding: "2px 6px", border: "1px solid #d1d5db", background: "white", borderRadius: 3, fontSize: 10, cursor: "pointer" }}>{archive ? "↻" : "✏️"}</button></td>
    </tr>
  ));

  return (
    <div style={{ padding: "1rem", flex: 1, overflowY: "auto", display: "flex", justifyContent: "center", background: "#f3f4f6" }}>
      <div style={{ maxWidth: "900px", width: "100%" }}>
        <div style={{ background: "white", borderRadius: 6, border: "1px solid #e5e7eb", marginBottom: "0.75rem", overflow: "hidden" }}>
          <div style={{ background: "#1e3a8a", color: "white", padding: "0.75rem 1rem", fontWeight: 600, fontSize: 13, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>🏗️ Chantiers actifs ({actifs.length})</span>
            <button onClick={() => setShowAddModal(true)} style={{ padding: "6px 12px", background: "#10b981", color: "white", border: "none", borderRadius: 3, fontSize: 11, cursor: "pointer", fontWeight: 600 }}>+ Chantier</button>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}><tbody>{actifs.length === 0 ? <tr><td style={{ padding: 8, textAlign: "center", color: "#9ca3af" }}>Aucun chantier</td></tr> : rows(actifs)}</tbody></table>
        </div>

        {archived.length > 0 && <div style={{ background: "white", borderRadius: 6, border: "1px solid #e5e7eb", overflow: "hidden" }}>
          <div onClick={() => setIsArchivedExpanded(!isArchivedExpanded)} style={{ background: "#6b7280", color: "white", padding: "0.75rem 1rem", fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", userSelect: "none" }}>
            <span>📦 Archivés ({archived.length})</span><span style={{ fontSize: 16 }}>{isArchivedExpanded ? "▼" : "▶"}</span>
          </div>
          {isArchivedExpanded && <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}><tbody>{rows(archived, true)}</tbody></table>}
        </div>}

        <Modal isOpen={showAddModal} title="Nouveau chantier" onClose={() => setShowAddModal(false)}><FormChantier onSubmit={handleAddChantier} onCancel={() => setShowAddModal(false)} mode="add" /></Modal>
        <Modal isOpen={!!editingChantier} title="Modifier le chantier" onClose={() => setEditingChantier(null)}>{editingChantier && <FormChantier chantier={editingChantier} onSubmit={handleUpdateChantier} onDelete={handleDeleteChantier} onCancel={() => setEditingChantier(null)} mode="edit" />}</Modal>
      </div>
    </div>
  );
};
