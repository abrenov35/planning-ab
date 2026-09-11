import React, { useContext, useRef, useState } from "react";
import { VERSION } from "../version.js";
import { AppContext } from "../context/AppContext";

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

export const Sidebar = ({ currentPage, setCurrentPage, ganttControls }) => {
  const [chantierSearch, setChantierSearch] = useState("");
  const automaticSearchTimer = useRef(null);
  const { affectations } = useContext(AppContext);

  const baseButtonStyle = {
    width:92,height:28,padding:"0 8px",display:"inline-flex",alignItems:"center",justifyContent:"center",boxSizing:"border-box",
    border:"1px solid rgba(255,255,255,0.42)",borderRadius:5,color:"white",fontSize:10,fontWeight:700,cursor:"pointer",flexShrink:0,whiteSpace:"nowrap"
  };
  const navStyle = active => ({...baseButtonStyle,background:active?"rgba(255,255,255,0.18)":"transparent",borderBottom:active?"2px solid #f59e0b":"1px solid rgba(255,255,255,0.42)"});
  const separator=<div style={{width:1,height:24,background:"rgba(255,255,255,0.25)",flexShrink:0}}/>;
  const registeredSearchOptions=(ganttControls?.searchChantiers||[]).map(c=>({
    key:`chantier:${c.id}`,
    label:String(c.nom||"").trim(),
    type:"chantier",
    chantierId:c.id
  })).filter(x=>x.label);
  const freeSearchOptions=[];
  const freeSeen=new Set();
  (affectations||[]).forEach(aff=>{
    if(Number(aff?.chantierId)) return;
    const label=nomAffectation(aff);
    const normalized=normalizeSearch(label);
    if(!label || freeSeen.has(normalized)) return;
    freeSeen.add(normalized);
    freeSearchOptions.push({key:`libre:${normalized}`,label,type:"libre",chantierId:""});
  });
  const allSearchOptions=[...registeredSearchOptions,...freeSearchOptions].sort((a,b)=>a.label.localeCompare(b.label,"fr",{sensitivity:"base"}));

  const runChantierSearch = value => {
    const query=String(value ?? chantierSearch).trim();
    if(!query){
      alert("Sélectionnez ou saisissez une affectation à rechercher.");
      return;
    }
    if(!ganttControls){
      alert("La recherche du planning n'est pas encore disponible.");
      return;
    }

    const searched=normalizeSearch(query);
    const matchingTargets=allSearchOptions.filter(option=>{
      const normalizedLabel=normalizeSearch(option.label);
      return normalizedLabel===searched || normalizedLabel.includes(searched);
    });
    if(matchingTargets.length===0){
      alert("Affectation introuvable.");
      return;
    }

    const today=new Date();
    today.setHours(0,0,0,0);
    const candidates=matchingTargets
      .flatMap(target=>(affectations||[])
        .filter(aff=>target.type==="chantier"
          ? Number(aff.chantierId)===Number(target.chantierId)
          : !Number(aff.chantierId) && normalizeSearch(nomAffectation(aff))===normalizeSearch(target.label))
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
        return {aff,target,start,end,targetDate,distance,direction};
      }))
      .filter(Boolean)
      .sort((a,b)=>{
        const priority=entry=>entry.direction===0 ? 0 : entry.direction===1 ? 1 : 2;
        return priority(a)-priority(b) || a.distance-b.distance || b.start-a.start;
      });

    const found=candidates[0];
    if(!found){
      alert(`Aucune affectation trouvée pour ${query}.`);
      return;
    }
    const target=found.target;

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
          affectationId:found.aff.id,
          chantierId:target.chantierId||"",
          chantierName:target.label,
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

  const handleChantierSearchChange = value => {
    setChantierSearch(value);
    window.clearTimeout(automaticSearchTimer.current);

    const searched=normalizeSearch(value);
    if(!searched || !ganttControls) return;

    const exactMatch=allSearchOptions.find(option=>normalizeSearch(option.label)===searched);
    const prefixMatches=allSearchOptions.filter(option=>normalizeSearch(option.label).startsWith(searched));
    const target=exactMatch || (prefixMatches.length===1 ? prefixMatches[0] : null);
    if(!target) return;

    automaticSearchTimer.current=window.setTimeout(()=>runChantierSearch(target.label),300);
  };

  return <div style={{background:"#1e3a8a",color:"white",display:"flex",alignItems:"center",justifyContent:"flex-start",padding:"7px 12px",borderBottom:"1px solid rgba(255,255,255,0.12)",gap:8,whiteSpace:"nowrap",position:"sticky",top:0,zIndex:100,overflowX:"auto"}}>
    <div style={{fontSize:13,fontWeight:800,flexShrink:0,marginRight:4}}>AB PLANNING</div>{separator}
    <button onClick={()=>setCurrentPage("gantt")} style={navStyle(currentPage==="gantt")}>📅 Gantt</button>
    {currentPage==="gantt"&&ganttControls&&<div style={{display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
      <button onClick={ganttControls.onPast} style={{...baseButtonStyle,background:"rgba(255,255,255,0.12)"}}>← Passé</button>
    </div>}
    {separator}
    {currentPage==="gantt"&&ganttControls&&<div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
      <input
        type="search"
        list="gantt-chantier-search"
        value={chantierSearch}
        onChange={e=>handleChantierSearchChange(e.target.value)}
        onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();runChantierSearch();}}}
        placeholder="Chercher affectation"
        title="Trouver l'affectation la plus proche d'aujourd'hui"
        style={{width:145,height:28,padding:"0 8px",border:"1px solid rgba(255,255,255,0.55)",borderRadius:5,background:"white",color:"#172554",fontSize:10,fontWeight:700,boxSizing:"border-box",outline:"none"}}
      />
      <a
        href="https://abrenov35.github.io/yaya-ab/"
        target="_blank"
        rel="noopener noreferrer"
        title="Ouvrir Yaya dans un nouvel onglet"
        style={{...baseButtonStyle,width:72,background:"rgba(255,255,255,0.16)",textDecoration:"none"}}
      >Yaya ↗</a>
      <datalist id="gantt-chantier-search">{allSearchOptions.map(option=><option key={option.key} value={option.label}/>)}</datalist>
    </div>}
    <button onClick={()=>setCurrentPage("chantiers")} style={navStyle(currentPage==="chantiers")}>🏗️ Chantiers</button>
    <button onClick={()=>setCurrentPage("ouvriers")} style={navStyle(currentPage==="ouvriers")}>👷 Ouvriers</button>
    <div style={{fontSize:9,opacity:0.65,fontWeight:700,flexShrink:0,padding:"0 3px"}}>v{VERSION}</div>
  </div>;
};
