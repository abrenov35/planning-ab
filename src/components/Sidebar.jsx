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

const parsePlanningDate = value => {
  if(!value)return null;
  if(value instanceof Date){
    const d=new Date(value);
    if(Number.isNaN(d.getTime()))return null;
    d.setHours(0,0,0,0);
    return d;
  }
  const str=String(value).trim();
  let d=null;
  if(/^\d{2}\/\d{2}\/\d{4}$/.test(str)){
    const [day,month,year]=str.split("/").map(Number);
    d=new Date(year,month-1,day);
  }else if(/^\d{4}-\d{2}-\d{2}$/.test(str)){
    const [year,month,day]=str.split("-").map(Number);
    d=new Date(year,month-1,day);
  }else{
    d=new Date(str);
  }
  if(!d || Number.isNaN(d.getTime()))return null;
  d.setHours(0,0,0,0);
  return d;
};

const toIsoDate = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;

const mondayOf = value => {
  const d=new Date(value);
  d.setHours(0,0,0,0);
  const dow=d.getDay();
  d.setDate(d.getDate()-(dow===0?6:dow-1));
  return d;
};

const normalizeSearch = value => String(value||"").trim().normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase();

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
      if(!item?.key || maintenant-Number(item.deletedAt||0)>300000)return false;
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
  const undoEnabled=false;
  const hasRecentEntry=currentPage==="gantt"&&recentEntries.length>0;
  const canSearch=currentPage==="gantt"&&Boolean(ganttControls)&&Boolean(chantierSearch.trim());

  const runChantierSearch = value => {
    const query=String(value ?? chantierSearch).trim();
    if(!query){
      alert("Sélectionnez ou saisissez le nom d'un chantier à rechercher.");
      return;
    }
    if(!ganttControls){
      alert("La recherche du planning n'est pas encore disponible.");
      return;
    }

    const searched=normalizeSearch(query);
    const options=ganttControls.searchChantiers||[];
    const chantier=options.find(c=>String(c.id)===query || normalizeSearch(c.nom)===searched)
      || options.find(c=>normalizeSearch(c.nom).includes(searched));
    if(!chantier){
      alert("Chantier introuvable.");
      return;
    }

    const today=new Date();
    today.setHours(0,0,0,0);
    const candidates=(affectations||[])
      .filter(aff=>Number(aff.chantierId)===Number(chantier.id))
      .map(aff=>{
        let start=parsePlanningDate(aff.dateDebut);
        let end=parsePlanningDate(aff.dateFin);
        if(!start || !end)return null;
        if(end<start){const tmp=start;start=end;end=tmp;}
        let targetDate;
        let distance;
        let direction;
        if(today<start){
          targetDate=new Date(start);
          distance=start.getTime()-today.getTime();
          direction=1;
        }else if(today>end){
          targetDate=new Date(end);
          distance=today.getTime()-end.getTime();
          direction=-1;
        }else{
          targetDate=new Date(today);
          distance=0;
          direction=0;
        }
        return {aff,start,end,targetDate,distance,direction};
      })
      .filter(Boolean)
      .sort((a,b)=>a.distance-b.distance || b.direction-a.direction || a.start-b.start);

    const found=candidates[0];
    if(!found){
      alert(`Aucune affectation trouvée pour ${chantier.nom}.`);
      return;
    }

    const currentMonday=mondayOf(today);
    const targetMonday=mondayOf(found.targetDate);
    const weekMs=7*24*60*60*1000;
    const weeksBack=Math.max(0,Math.round((currentMonday.getTime()-targetMonday.getTime())/weekMs));
    const weeksForward=Math.max(0,Math.round((targetMonday.getTime()-currentMonday.getTime())/weekMs));
    if(weeksForward>=52){
      alert("Cette affectation est au-delà de la période future affichable du planning.");
      return;
    }

    const dispatchTarget = () => {
      window.dispatchEvent(new CustomEvent("ab-planning-nearest-search",{
        detail:{
          targetDate:toIsoDate(found.targetDate),
          workerId:found.aff.ouvrierID,
          chantierId:chantier.id,
          chantierName:chantier.nom,
          pastWeeks:weeksBack
        }
      }));
    };

    if(ganttControls.onToday) ganttControls.onToday();
    window.setTimeout(()=>{
      if(weeksBack>0 && ganttControls.onPast){
        for(let i=0;i<weeksBack;i+=1) ganttControls.onPast();
      }
      window.setTimeout(dispatchTarget,weeksBack>0?140:40);
    },0);
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
    {currentPage==="gantt"&&ganttControls&&<div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
      <input
        type="search"
        list="gantt-chantier-search"
        value={chantierSearch}
        onChange={e=>setChantierSearch(e.target.value)}
        onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();runChantierSearch();}}}
        placeholder="Chercher chantier"
        title="Trouver l'affectation de ce chantier la plus proche d'aujourd'hui"
        style={{width:145,height:28,padding:"0 8px",border:"1px solid rgba(255,255,255,0.55)",borderRadius:5,background:"white",color:"#172554",fontSize:10,fontWeight:700,boxSizing:"border-box",outline:"none"}}
      />
      <button
        type="button"
        onClick={()=>runChantierSearch()}
        disabled={!canSearch}
        title="Aller à l'affectation de ce chantier la plus proche d'aujourd'hui"
        style={{...baseButtonStyle,width:88,background:canSearch?"#f59e0b":"rgba(255,255,255,0.08)",opacity:canSearch?1:0.45,cursor:canSearch?"pointer":"default"}}
      >🔎 Rechercher</button>
      <datalist id="gantt-chantier-search">{(ganttControls.searchChantiers||[]).map(chantier=><option key={chantier.id} value={chantier.nom}/>)}</datalist>
    </div>}
    <button onClick={()=>setCurrentPage("chantiers")} style={navStyle(currentPage==="chantiers")}>🏗️ Chantiers</button>
    <button onClick={()=>setCurrentPage("ouvriers")} style={navStyle(currentPage==="ouvriers")}>👷 Ouvriers</button>
    <div style={{fontSize:9,opacity:0.65,fontWeight:700,flexShrink:0,padding:"0 3px"}}>v{VERSION}</div>
  </div>;
};
