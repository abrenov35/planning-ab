import React, { useState } from "react";
import { getWorkerPosition, hasWorkerSeparator, normalizeWorkerName, sortWorkersPlanning } from "../utils/planningOrder";

export const FormOuvrier = ({ ouvrier, ouvriers = [], onSubmit, onCancel, mode = "add" }) => {
  const initialPosition = ouvrier ? getWorkerPosition(ouvrier.nom, ouvriers) : "";
  const initialSeparator = ouvrier ? hasWorkerSeparator(ouvrier.nom, ouvriers) : false;
  const [formData, setFormData] = useState(
    ouvrier
      ? { ...ouvrier, positionApres: initialPosition, separateurApres: initialSeparator }
      : { nom: "", type: "CDI", metier: "", statut: "Actif", positionApres: "", separateurApres: false }
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async () => {
    if (!formData.nom || !formData.metier) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }
    setIsSubmitting(true);
    try {
      const saved = await onSubmit(formData);
      if (saved === false) setIsSubmitting(false);
    } catch (error) {
      console.error("Erreur lors de la soumission:", error);
      setIsSubmitting(false);
    }
  };

  const candidats = sortWorkersPlanning(
    ouvriers.filter(o =>
      o.statut === "Actif" &&
      normalizeWorkerName(o.nom) !== normalizeWorkerName(formData.nom)
    )
  );

  const inputStyle = { width:"100%", padding:"8px 12px", border:"1px solid #d1d5db", borderRadius:6, fontSize:13, fontFamily:"inherit", boxSizing:"border-box" };
  const labelStyle = { display:"block", fontWeight:600, fontSize:13, color:"#1f2937", marginBottom:6 };

  return (
    <div>
      <div style={{ marginBottom:"1.25rem" }}>
        <label style={labelStyle}>Nom *</label>
        <input type="text" name="nom" value={formData.nom} onChange={handleChange} placeholder="Ex: Stéphane" style={inputStyle} />
      </div>
      <div style={{ marginBottom:"1.25rem" }}>
        <label style={labelStyle}>Métier principal *</label>
        <input type="text" name="metier" value={formData.metier} onChange={handleChange} placeholder="Ex: Peintre, Électricité" style={inputStyle} />
      </div>
      <div style={{ marginBottom:"1.1rem" }}>
        <label style={labelStyle}>Position dans le planning</label>
        <select name="positionApres" value={formData.positionApres || ""} onChange={handleChange} style={inputStyle}>
          <option value="">En premier</option>
          {candidats.map(c => <option key={c.id} value={normalizeWorkerName(c.nom)}>Après {c.nom}</option>)}
        </select>
        <div style={{ marginTop:5, fontSize:10, color:"#6b7280" }}>Choisis après qui placer la personne. Cet ordre sera commun à tous les appareils.</div>
      </div>
      <label style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",marginBottom:mode === "edit" ? "1.25rem" : "2rem",border:"1px solid #cbd5e1",borderRadius:7,background:formData.separateurApres?"#f1f5f9":"white",cursor:"pointer"}}>
        <input type="checkbox" name="separateurApres" checked={!!formData.separateurApres} onChange={handleChange} />
        <div><div style={{fontSize:12,fontWeight:700,color:"#334155"}}>Trait bleu après cette personne</div><div style={{fontSize:10,color:"#64748b",marginTop:2}}>Séparation visuelle commune au PC et à l’iPhone.</div></div>
      </label>
      {mode === "edit" && <div style={{ marginBottom:"2rem" }}>
        <label style={{ ...labelStyle, marginBottom:8 }}>Statut</label>
        <div style={{ display:"flex", gap:8 }}>
          <label style={{ flex:1, display:"flex", alignItems:"center", padding:10, border:"1px solid #d1d5db", borderRadius:6, cursor:"pointer", background:formData.statut === "Actif" ? "#dcfce7" : "white" }}><input type="radio" name="statut" value="Actif" checked={formData.statut === "Actif"} onChange={handleChange} style={{ marginRight:8 }} /><span style={{ fontSize:13, color:"#1f2937" }}>Actif</span></label>
          <label style={{ flex:1, display:"flex", alignItems:"center", padding:10, border:"1px solid #d1d5db", borderRadius:6, cursor:"pointer", background:formData.statut === "Archivé" ? "#fecaca" : "white" }}><input type="radio" name="statut" value="Archivé" checked={formData.statut === "Archivé"} onChange={handleChange} style={{ marginRight:8 }} /><span style={{ fontSize:13, color:"#1f2937" }}>Archivé</span></label>
        </div>
      </div>}
      <div style={{ display:"flex", gap:8 }}>
        <button onClick={onCancel} style={{ flex:1, padding:10, border:"1px solid #d1d5db", background:"white", borderRadius:6, fontSize:13, fontWeight:600, cursor:"pointer", color:"#1f2937" }}>Annuler</button>
        <button onClick={handleSubmit} disabled={isSubmitting} style={{ flex:1, padding:10, background:mode === "edit" ? "#1e3a8a" : "#10b981", color:"white", border:"none", borderRadius:6, fontSize:13, fontWeight:600, cursor:isSubmitting ? "not-allowed" : "pointer", opacity:isSubmitting ? 0.6 : 1 }}>{isSubmitting ? "Enregistrement..." : (mode === "edit" ? "Enregistrer" : "Ajouter")}</button>
      </div>
    </div>
  );
};
