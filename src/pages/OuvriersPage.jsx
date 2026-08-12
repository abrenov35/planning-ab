import React, { useContext, useState } from "react";
import { AppContext } from "../context/AppContext";
import { Modal } from "../components/Modal";
import { FormOuvrier } from "../components/FormOuvrier";
import { normalizeWorkerName, sortWorkersPlanning } from "../utils/planningOrder";

export const OuvriersPage = () => {
  const { ouvriers, addOuvrier, updateOuvrier, loadData, loading } = useContext(AppContext);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingOuvrier, setEditingOuvrier] = useState(null);

  const buildReordered = (list, worker, positionApres) => {
    const ordered = sortWorkersPlanning(list.filter(o => o.statut === "Actif" && Number(o.id) !== Number(worker.id)));
    const after = normalizeWorkerName(positionApres || "");
    if (!after) {
      ordered.unshift(worker);
      return ordered;
    }
    const index = ordered.findIndex(o => normalizeWorkerName(o.nom) === after);
    if (index === -1) ordered.push(worker);
    else ordered.splice(index + 1, 0, worker);
    return ordered;
  };

  const persistActiveOrder = async ordered => {
    for (let i = 0; i < ordered.length; i++) {
      const o = ordered[i];
      const result = await updateOuvrier(o.id, o.nom, o.type, o.metier, o.statut, i + 1, !!o.separateurApres, false);
      if (!result.success) throw new Error(result.error || `Impossible d'enregistrer l'ordre de ${o.nom}`);
    }
  };

  const handleAddOuvrier = async formData => {
    const result = await addOuvrier(formData.nom, formData.type, formData.metier);
    if (!result.success) {
      alert("Erreur: " + (result.error || "Impossible d'ajouter l'ouvrier"));
      return;
    }
    try {
      const nouveau = { id: result.id, nom: formData.nom, type: formData.type, metier: formData.metier, statut: "Actif", separateurApres: !!formData.separateurApres };
      const ordered = buildReordered(ouvriers, nouveau, formData.positionApres);
      await persistActiveOrder(ordered);
      await loadData(false);
      setShowAddModal(false);
    } catch (err) {
      alert("Ouvrier créé, mais ordre non enregistré : " + err.message);
    }
  };

  const handleUpdateOuvrier = async formData => {
    try {
      const edited = { ...editingOuvrier, ...formData, separateurApres: !!formData.separateurApres };

      if (formData.statut !== "Actif") {
        const archivedResult = await updateOuvrier(edited.id, edited.nom, edited.type, edited.metier, edited.statut, "", false, false);
        if (!archivedResult.success) throw new Error(archivedResult.error || "Impossible d'archiver l'ouvrier");
        const remaining = sortWorkersPlanning(ouvriers.filter(o => o.statut === "Actif" && Number(o.id) !== Number(edited.id)));
        await persistActiveOrder(remaining);
      } else {
        const source = ouvriers.map(o => Number(o.id) === Number(edited.id) ? edited : o);
        const ordered = buildReordered(source, edited, formData.positionApres);
        await persistActiveOrder(ordered);
      }

      await loadData(false);
      setEditingOuvrier(null);
    } catch (err) {
      alert("Erreur: " + err.message);
    }
  };

  if (loading) return <div style={{ padding:"1rem" }}>Chargement...</div>;

  const cdi = sortWorkersPlanning(ouvriers.filter(o => o.type === "CDI" && o.statut === "Actif"));
  const st = sortWorkersPlanning(ouvriers.filter(o => o.type === "ST" && o.statut === "Actif"));
  const archived = ouvriers.filter(o => o.statut === "Archivé");

  const table = (items, emptyLabel, actionLabel = "✏️") => (
    <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}><tbody>
      {items.length === 0 ? <tr><td style={{ padding:8, textAlign:"center", color:"#9ca3af" }}>{emptyLabel}</td></tr> : items.map((ouvrier, idx) => (
        <tr key={ouvrier.id} style={{ borderBottom:"1px solid #d1d5db", background:idx % 2 === 0 ? "white" : "#f3f4f6" }}>
          <td style={{ padding:8, color:"#374151", fontWeight:500 }}>{ouvrier.nom}</td>
          <td style={{ padding:8, textAlign:"center", width:52 }}><button onClick={() => setEditingOuvrier(ouvrier)} style={{ padding:"2px 6px", border:"1px solid #d1d5db", background:"white", borderRadius:3, fontSize:10, cursor:"pointer" }}>{actionLabel}</button></td>
        </tr>
      ))}
    </tbody></table>
  );

  return <div style={{ padding:"1rem", flex:1, overflowY:"auto", display:"flex", justifyContent:"center", background:"#f3f4f6" }}><div style={{ maxWidth:"900px", width:"100%" }}>
    <div style={{ background:"white", borderRadius:6, border:"1px solid #e5e7eb", marginBottom:"0.75rem", overflow:"hidden" }}>
      <div style={{ background:"#1e3a8a", color:"white", padding:"0.75rem 1rem", fontWeight:600, fontSize:13, display:"flex", justifyContent:"space-between", alignItems:"center" }}><span>👷 Ouvriers ({cdi.length})</span><button onClick={() => setShowAddModal(true)} style={{ padding:"6px 12px", background:"#10b981", color:"white", border:"none", borderRadius:3, fontSize:11, cursor:"pointer", fontWeight:600 }}>+ Ouvrier</button></div>
      {table(cdi, "Aucun ouvrier")}
    </div>
    <div style={{ background:"white", borderRadius:6, border:"1px solid #e5e7eb", marginBottom:"0.75rem", overflow:"hidden" }}>
      <div style={{ background:"#1e3a8a", color:"white", padding:"0.75rem 1rem", fontWeight:600, fontSize:13, display:"flex", justifyContent:"space-between", alignItems:"center" }}><span>🤝 Sous-traitants ({st.length})</span><button onClick={() => setShowAddModal(true)} style={{ padding:"6px 12px", background:"#10b981", color:"white", border:"none", borderRadius:3, fontSize:11, cursor:"pointer", fontWeight:600 }}>+ ST</button></div>
      {table(st, "Aucun sous-traitant")}
    </div>
    {archived.length > 0 && <div style={{ background:"white", borderRadius:6, border:"1px solid #e5e7eb", overflow:"hidden" }}><div style={{ background:"#6b7280", color:"white", padding:"0.75rem 1rem", fontWeight:600, fontSize:13 }}>📦 Archivés ({archived.length})</div>{table(archived, "Aucun archivé", "↻")}</div>}
    <Modal isOpen={showAddModal} title="Ajouter un ouvrier" onClose={() => setShowAddModal(false)}><FormOuvrier ouvriers={ouvriers} onSubmit={handleAddOuvrier} onCancel={() => setShowAddModal(false)} mode="add" /></Modal>
    <Modal isOpen={!!editingOuvrier} title="Modifier l'ouvrier" onClose={() => setEditingOuvrier(null)}>{editingOuvrier && <FormOuvrier ouvrier={editingOuvrier} ouvriers={ouvriers} onSubmit={handleUpdateOuvrier} onCancel={() => setEditingOuvrier(null)} mode="edit" />}</Modal>
  </div></div>;
};
