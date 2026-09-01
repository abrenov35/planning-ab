import React, { useContext, useState } from "react";
import { VERSION } from "../version.js";
import { AppContext } from "../context/AppContext";

const normaliserDate = value => {
  const str=String(value||"").trim();
  if(!str)return "";
  if(/^\d{2}\/\d{2}\/\d{4}$/.test(str))return str;
  if(/^\d{4}-\d{2}-\d{2}$/.test(str)){
    const [y,m,d]=str.split("-");
    return `${d}/${m}/${y}`;
  }
  return str.split("T")[0];
};

const nomAffectation = a => String(a?.nomExterne || a?.affectationNom || a?.nomAffectation || "").trim();

const estRecreationModification = affectation => {
  if(!affectation || !String(affectation.id||"").startsWith("tmp-"))return false;
  try{
    const suppressions=JSON.parse(localStorage.getItem("abPlanningDeletedAssignmentsV2")||"[]");
    if(!Array.isArray(suppressions))return false;
    const maintenant=Date.now();
    const cible=[
      String(affectation.chantierId||""),
      normaliserDate(affectation.dateDebut),
      normaliserDate(affectation.dateFin),
      String(affectation.tache||"").trim(),
      nomAffectation(affectation)
    ];
    return suppressions.some(item=>{
      if(!item?.key || maintenant-Number(item.deletedAt||0)>30000)return false;
      const parts=String(item.key).split("¦");
      if(parts.length<6)return false;
      const ancienne=[parts[1],normaliserDate(parts[2]),normaliserDate(parts[3]),parts[4],parts[5]];
      return ancienne.every((v,i)=>String(v||"").trim()===String(cible[i]||"").trim());
    });
  }catch(_){
    return false;
  }
};

export const Sidebar = ({ currentPage, setCurrentPage, ganttControls }) => {
  const [chantierSearch, setChantierSearch] = useState("");
  const { loadData, loading, lastDeletedAffectation, undoLastDelete, undoingDelete, affectations, deleteAffectation } = useContext(AppContext);
  const handleReload = async () => { await loadData(true); };
  const handleUndo = async () => {
    const result=await undoLastDelete();
    if(!result?.success && result?.error) alert("Annulation impossible : "+result.error);
  };
  const recentEntries=(affectations||[]).filter(a=>String(a.id||"").startsWith("tmp-")&&!estRecreationModification(a));
  const handleUndoLastEntry = () => {
    const last=recentEntries[recentEntries.length-1];
    if(!last){alert("Aucune saisie récente à annuler.");return;}
    if(!window.confirm("Annuler la dernière saisie du planning ?")) return;
    deleteAffectation(last.id,false);
  };
  const baseButtonStyle = {
    width:92,height:28,padding:"0 8px",display:"inline-flex",alignItems:"center",justifyContent:"center",boxSizing:"border-box",
    border:"1px solid rgba(255,255,255,0.42)",borderRadius:5,color:"white",fontSize:10,fontWeight:700,cursor:"pointer",flexShrink:0,whiteSpace:"nowrap"
  };
  const navStyle = active => ({...baseButtonStyle,background:active?"rgba(255,255,255,0.18)":"transparent",borderBottom:active?"2px solid #f59e0b":"1px solid rgba(255,255,255,0.42)"});
  const separator=<div style={{width:1,height:24,background:"rgba(255,255,255,0.25)",flexShrink:0}}/>;
  const undoEnabled=currentPage==="gantt"&&Boolean(lastDeletedAffectation)&&!undoingDelete;
  const hasRecentEntry=currentPage==="gantt"&&recentEntries.length>0;
  const runChantierSearch = value => {
    const query=String(value ?? chantierSearch).trim();
    if(!query || !ganttControls?.onFindChantier) return;
    const result=ganttControls.onFindChantier(query);
    if(!result?.success) alert(result?.message || "Aucune affectation trouvée à partir d'aujourd'hui.");
  };
  return <div style={{background:"#1e3a8a",color:"white",display:"flex",alignItems:"center",justifyContent:"flex-start",padding:"7px 12px",borderBottom:"1px solid rgba(255,255,255,0.12)",gap:8,whiteSpace:"nowrap",position:"sticky",top:0,zIndex:100,overflowX:"auto"}}>
    <div style={{fontSize:13,fontWeight:800,flexShrink:0,marginRight:4}}>AB PLANNING</div>{separator}
    <button onClick={()=>setCurrentPage("gantt")} style={navStyle(currentPage==="gantt")}>📅 Gantt</button>
    {currentPage==="gantt"&&ganttControls&&<div style={{display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
      <button onClick={ganttControls.onPast} style={{...baseButtonStyle,background:"rgba(255,255,255,0.12)"}}>← Passé</button>
    </div>}
    {separator}
    <button onClick={handleReload} disabled={loading} title="Recharger immédiatement les données du planning" style={{...baseButtonStyle,background:loading?"rgba(255,255,255,0.10)":"rgba(255,255,255,0.16)",cursor:loading?"default":"pointer"}}>{loading?"↻ ...":"↻ Recharger"}</button>
    {currentPage==="gantt"&&<button onClick={handleUndoLastEntry} disabled={!hasRecentEntry} title={hasRecentEntry?"Annuler la dernière saisie effectuée":"Aucune saisie récente à annuler"} style={{...baseButtonStyle,width:112,background:hasRecentEntry?"#f59e0b":"rgba(255,255,255,0.08)",opacity:hasRecentEntry?1:0.45,cursor:hasRecentEntry?"pointer":"default"}}>↶ Dernière saisie</button>}
    {currentPage==="gantt"&&<button onClick={handleUndo} disabled={!undoEnabled} title={undoEnabled?"Restaurer la dernière affectation supprimée":"Aucune suppression à annuler"} style={{...baseButtonStyle,background:undoEnabled?"#f59e0b":"rgba(255,255,255,0.08)",opacity:undoEnabled?1:0.45,cursor:undoEnabled?"pointer":"default"}}>{undoingDelete?"↶ ...":"↶ Annuler"}</button>}
    {currentPage==="gantt"&&ganttControls&&<div style={{display:"flex",alignItems:"center",flexShrink:0}}>
      <input
        type="search"
        list="gantt-chantier-search"
        value={chantierSearch}
        onChange={e=>setChantierSearch(e.target.value)}
        onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();runChantierSearch();}}}
        onBlur={e=>{if(e.target.value) runChantierSearch(e.target.value);}}
        placeholder="🔎 Chercher chantier"
        title="Trouver la première affectation de ce chantier à partir d'aujourd'hui"
        style={{width:150,height:28,padding:"0 8px",border:"1px solid rgba(255,255,255,0.55)",borderRadius:5,background:"white",color:"#172554",fontSize:10,fontWeight:700,boxSizing:"border-box",outline:"none"}}
      />
      <datalist id="gantt-chantier-search">{(ganttControls.searchChantiers||[]).map(chantier=><option key={chantier.id} value={chantier.nom}/>)}</datalist>
    </div>}
    <button onClick={()=>setCurrentPage("chantiers")} style={navStyle(currentPage==="chantiers")}>🏗️ Chantiers</button>
    <button onClick={()=>setCurrentPage("ouvriers")} style={navStyle(currentPage==="ouvriers")}>👷 Ouvriers</button>
    <div style={{fontSize:9,opacity:0.65,fontWeight:700,flexShrink:0,padding:"0 3px"}}>v{VERSION}</div>
  </div>;
};
