import React, { useState } from "react";
import { getWorkerSeparators, normalizeWorkerName, sortWorkersPlanning } from "../utils/planningOrder";

export const GanttChart = ({ ouvriers, chantiers, affectations, onAffectationClick, onAddAffectation, onControlsReady }) => {
  const mobileMediaQuery = "(max-width: 1100px) and (pointer: coarse)";
  const [currentDate, setCurrentDate] = useState(() => {
    const saved = localStorage.getItem("ganttCurrentDate");
    return saved ? new Date(saved) : new Date();
  });
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.matchMedia(mobileMediaQuery).matches);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia(mobileMediaQuery);
    const update = () => setIsMobile(media.matches);
    update();
    if (media.addEventListener) media.addEventListener("change", update);
    else media.addListener(update);
    window.addEventListener("orientationchange", update);
    window.addEventListener("resize", update);
    return () => {
      if (media.removeEventListener) media.removeEventListener("change", update);
      else media.removeListener(update);
      window.removeEventListener("orientationchange", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const handleSetCurrentDate = (date) => {
    localStorage.setItem("ganttCurrentDate", date.toISOString());
    setCurrentDate(date);
  };

  const colorMap = { 1:"#3b82f6",2:"#10b981",3:"#f59e0b",4:"#ef4444",5:"#8b5cf6",6:"#06b6d4",7:"#ec4899",8:"#f97316",9:"#6366f1",10:"#14b8a6" };
  const normalize = (value) => String(value ?? "").trim().toUpperCase();
  const isValidChantier = (chantier) => chantier && String(chantier.nom ?? "").trim() !== "" && String(chantier.nom ?? "").trim() !== "??";
  const isHorsGantt = (aff, chantier) => !isValidChantier(chantier) || normalize(aff?.typeAffectation) === "HORS_GANTT" || (normalize(aff?.source) === "GOOGLE" && normalize(aff?.typeAffectation) === "HORS_GANTT");
  const getChantierColor = (chantierId) => {
    if (colorMap[chantierId]) return colorMap[chantierId];
    const colors = Object.values(colorMap), numericId = Number(chantierId);
    return !numericId || Number.isNaN(numericId) ? colors[0] : colors[numericId % colors.length];
  };
  const getLetters = (aff, chantier) => isHorsGantt(aff, chantier) ? "" : String(chantier?.nom ?? "").trim().substring(0,3).toUpperCase();
  const getLabel = (aff) => {
    const tache = String(aff?.tache ?? "").trim();
    return !tache || normalize(tache) === "ND" ? "" : tache;
  };
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    if (dateStr instanceof Date) { const d = new Date(dateStr); return Number.isNaN(d.getTime()) ? null : d; }
    const str = String(dateStr);
    if (str.includes("T")) { const d = new Date(str); return Number.isNaN(d.getTime()) ? null : d; }
    if (str.includes("-")) { const [y,m,d] = str.split("-"); const date = new Date(Number(y),Number(m)-1,Number(d)); return Number.isNaN(date.getTime()) ? null : date; }
    if (str.includes("/")) { const [d,m,y] = str.split("/"); const date = new Date(Number(y),Number(m)-1,Number(d)); return Number.isNaN(date.getTime()) ? null : date; }
    const date = new Date(str); return Number.isNaN(date.getTime()) ? null : date;
  };
  const getFourWeeksDates = (startDate) => {
    const d = new Date(startDate), dayOfWeek = d.getDay(), daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const firstMonday = new Date(d); firstMonday.setDate(d.getDate()-daysToSubtract); firstMonday.setHours(0,0,0,0);
    const dates=[]; for(let week=0;week<4;week++) for(let day=0;day<5;day++){ const date=new Date(firstMonday); date.setDate(firstMonday.getDate()+week*7+day); dates.push(date); }
    return dates;
  };

  const allDates=getFourWeeksDates(currentDate), weekStart=allDates[0], weekEnd=new Date(allDates[allDates.length-1]); weekEnd.setHours(23,59,59,999);
  React.useEffect(() => {
    if (!onControlsReady) return;
    onControlsReady({
      onPrevWeek:()=>{const d=new Date(currentDate);d.setDate(d.getDate()-7);handleSetCurrentDate(d);},
      onNextWeek:()=>{const d=new Date(currentDate);d.setDate(d.getDate()+7);handleSetCurrentDate(d);},
      onToday:()=>handleSetCurrentDate(new Date()),
      weekText:`Semaine du ${allDates[0].toLocaleDateString("fr-FR",{day:"numeric",month:"short"})} au ${allDates[19].toLocaleDateString("fr-FR",{day:"numeric",month:"short"})}`
    });
  },[currentDate,onControlsReady]);

  const formatShortDate=(date)=>`${["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"][date.getDay()]} ${String(date.getDate()).padStart(2,"0")}`;
  const monthNames=["JANVIER","FÉVRIER","MARS","AVRIL","MAI","JUIN","JUILLET","AOÛT","SEPTEMBRE","OCTOBRE","NOVEMBRE","DÉCEMBRE"];
  const monthBandColors=["#dbe7f3","#eef0f2"];
  const monthGroups=allDates.reduce((groups,date,index)=>{
    const key=`${date.getFullYear()}-${date.getMonth()}`;
    const last=groups[groups.length-1];
    if(last&&last.key===key){last.count+=1;}else{groups.push({key,start:index,count:1,label:monthNames[date.getMonth()]});}
    return groups;
  },[]);
  const getDayRightBorder=(idx)=>(idx+1)%5===0&&idx<19?"3px solid #1e3a8a":idx<19?"1px solid #d1d5db":"none";
  const isAffectationInWeek=(aff)=>{const s=parseDate(aff.dateDebut),e=parseDate(aff.dateFin);if(!s||!e)return false;s.setHours(0,0,0,0);e.setHours(23,59,59,999);return s<=weekEnd&&e>=weekStart;};
  const isVisibleOnDay=(aff,date)=>{const s=parseDate(aff.dateDebut),e=parseDate(aff.dateFin);if(!s||!e)return false;s.setHours(0,0,0,0);e.setHours(23,59,59,999);const d=new Date(date);d.setHours(12,0,0,0);return d>=s&&d<=e;};
  const getAffectationKey=(aff)=>Number(aff?.chantierId)?`CHANTIER:${Number(aff.chantierId)}`:`LIBRE:${normalize(aff?.nomExterne||aff?.affectationNom||"")}`;
  const getAffectationPriority=(aff,list)=>{const key=getAffectationKey(aff);return list.reduce((score,item)=>getAffectationKey(item)!==key?score:score+allDates.filter(date=>isVisibleOnDay(item,date)).length,0);};
  const getRankOnDay=(aff,date,list)=>{const overlapping=list.filter(item=>isVisibleOnDay(item,date)).sort((a,b)=>{const p=getAffectationPriority(b,list)-getAffectationPriority(a,list);if(p!==0)return p;const k=getAffectationKey(a).localeCompare(getAffectationKey(b),"fr",{sensitivity:"base"});return k!==0?k:Number(a.id)-Number(b.id);});return Math.max(0,overlapping.findIndex(item=>String(item.id)===String(aff.id)));};
  const getMaxOverlap=(list)=>Math.max(1,...allDates.map(date=>list.filter(item=>isVisibleOnDay(item,date)).length));
  const canShowHorsGanttName=(date)=>{const seuil=new Date(2026,7,3);seuil.setHours(0,0,0,0);const jour=new Date(date);jour.setHours(0,0,0,0);return jour>=seuil;};
  const getHorsGanttName=(aff,date)=>canShowHorsGanttName(date)?String(aff?.nomExterne||"").trim():"";
  const ouvriersActifs=sortWorkersPlanning(ouvriers.filter(o=>o.statut==="Actif"));
  const chantiersActifs=chantiers.filter(c=>c.statut==="Actif"), gridTemplate="repeat(20, minmax(50px, 1fr))", affectationSlotHeight=29;
  const separateursApres=new Set(getWorkerSeparators());
  const separationStyle={height:"3px",background:"#94a3b8",width:"100%"};
  const workerColumnWidth=isMobile?92:150;
  const mobileTimelineWidth=1120;
  const mobileTotalWidth=workerColumnWidth+mobileTimelineWidth;
  const timelineFlexStyle=isMobile?{width:mobileTimelineWidth,flex:`0 0 ${mobileTimelineWidth}px`}:{flex:1};
  const rowWidthStyle=isMobile?{minWidth:mobileTotalWidth}:{};
  const stickyWorkerStyle=isMobile?{position:"sticky",left:0,zIndex:8,boxShadow:"3px 0 5px rgba(15,23,42,0.08)"}:{};
  const stickyHeaderStyle=isMobile?{position:"sticky",left:0,zIndex:20,boxShadow:"3px 0 5px rgba(15,23,42,0.10)"}:{};

  return <div style={{padding:isMobile?"0.35rem":"1rem",flex:1,display:"flex",flexDirection:"column",minWidth:0}}>
    <div style={{display:"flex",gap:"1rem",alignItems:"center",flexWrap:"wrap",padding:"0.75rem 0.5rem",marginBottom:"0.5rem",background:"rgba(255,255,255,0.5)",borderRadius:"4px",fontSize:"11px"}}>
      {chantiersActifs.map(chantier=><div key={chantier.id} style={{display:"flex",alignItems:"center",gap:"6px"}}><div style={{width:"10px",height:"10px",backgroundColor:getChantierColor(chantier.id),borderRadius:"2px",flexShrink:0}}/><span style={{color:"#4b5563",fontWeight:500}}>{chantier.nom}</span></div>)}
    </div>
    <div style={{background:"white",borderRadius:6,border:"1px solid #e5e7eb",display:"flex",flexDirection:"column",flex:1,overflowY:"auto",overflowX:"auto",WebkitOverflowScrolling:"touch",touchAction:"pan-x pan-y",overscrollBehaviorX:"contain",minWidth:0}}>
      <div style={{display:"flex",height:"60px",flexShrink:0,...rowWidthStyle}}>
        <div style={{width:workerColumnWidth,background:"#e5e7eb",borderRight:"1px solid #9ca3af",flexShrink:0,...stickyHeaderStyle}} />
        <div style={{height:"60px",background:"#e5e7eb",borderRight:"1px solid #9ca3af",...timelineFlexStyle}}>
          <div style={{display:"grid",gridTemplateColumns:gridTemplate,height:"22px",borderBottom:"1px solid #cbd5e1",background:"#eef2f7"}}>
            {monthGroups.map((group,index)=><div key={group.key} style={{gridColumn:`${group.start+1} / span ${group.count}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,letterSpacing:"0.04em",color:"#334155",background:monthBandColors[index%monthBandColors.length]}}>{group.label}</div>)}
          </div>
          <div style={{display:"grid",gridTemplateColumns:gridTemplate,height:"38px",background:"#e5e7eb"}}>
            {allDates.map((date,idx)=><div key={idx} style={{padding:"0.45rem 0.55rem",borderRight:getDayRightBorder(idx),textAlign:"center",fontSize:9,fontWeight:600,color:"#1f2937",display:"flex",alignItems:"center",justifyContent:"center"}}>{formatShortDate(date)}</div>)}
          </div>
        </div>
      </div>
      <div style={{...separationStyle,...(isMobile?{width:mobileTotalWidth,flexShrink:0}:{})}} />
      {ouvriersActifs.map((ouvrier,idx)=>{
        const affectsByOuvrier=affectations.filter(a=>Number(a.ouvrierID)===Number(ouvrier.id)&&isAffectationInWeek(a));
        const rowBackground=idx%2===0?"white":"#f3f4f6",maxOverlap=getMaxOverlap(affectsByOuvrier),rowHeight=Math.max(45,maxOverlap*affectationSlotHeight+4);
        const separation=separateursApres.has(normalizeWorkerName(ouvrier.nom));
        return <div key={ouvrier.id} style={rowWidthStyle}>
          <div style={{display:"flex",height:`${rowHeight}px`,background:rowBackground,...rowWidthStyle}}>
            <div style={{width:workerColumnWidth,padding:isMobile?"0.5rem 0.45rem":"0.5rem 0.75rem",background:rowBackground,borderRight:"1px solid #9ca3af",fontSize:10,fontWeight:600,color:"#1f2937",display:"flex",flexDirection:"column",justifyContent:"center",flexShrink:0,...stickyWorkerStyle}}><div>{ouvrier.nom}</div></div>
            <div style={{display:"grid",gridTemplateColumns:gridTemplate,background:rowBackground,borderRight:"1px solid #9ca3af",position:"relative",height:`${rowHeight}px`,...timelineFlexStyle}}>
              {allDates.map((date,dayIdx)=><div key={dayIdx} onClick={()=>onAddAffectation(ouvrier.id,date)} style={{borderRight:getDayRightBorder(dayIdx),position:"relative",cursor:"pointer",padding:"1px",overflow:"hidden"}}>
                {affectsByOuvrier.map(aff=>{
                  if(!isVisibleOnDay(aff,date))return null;
                  const chantier=chantiers.find(c=>Number(c.id)===Number(aff.chantierId)),horsGantt=isHorsGantt(aff,chantier),lettres=getLetters(aff,chantier),label=getLabel(aff),nomHorsGantt=horsGantt?getHorsGanttName(aff,date):"",rank=getRankOnDay(aff,date,affectsByOuvrier),topOffset=rank*affectationSlotHeight+2;
                  return <div key={aff.id} onClick={e=>{e.stopPropagation();onAffectationClick(aff);}} style={{position:"absolute",left:1,right:1,top:`${topOffset}px`,cursor:"pointer",zIndex:2}}>
                    <div title={horsGantt?aff.nomExterne||"Événement Google":`${chantier?.nom||""} — cliquer pour modifier`} style={{width:"100%",height:"18px",backgroundColor:horsGantt?"#D1D5DB":getChantierColor(chantier?.id),border:horsGantt?"1px solid #9CA3AF":"1px solid rgba(0,0,0,0.2)",borderRadius:2,boxSizing:"border-box",display:"flex",alignItems:"center",justifyContent:"center",padding:horsGantt?"0 3px":0,color:horsGantt?"#374151":"white",fontWeight:horsGantt?700:800,fontSize:horsGantt?7:10,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{horsGantt?nomHorsGantt:lettres}</div>
                    {label&&<div title={label} style={{marginTop:1,height:9,fontSize:7,fontWeight:600,color:"#374151",textAlign:"center",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",lineHeight:"9px"}}>{label}</div>}
                  </div>;
                })}
              </div>)}
            </div>
          </div>
          <div style={separation?{...separationStyle,...(isMobile?{width:mobileTotalWidth}:{})}:{height:"1px",background:"#d1d5db",width:isMobile?mobileTotalWidth:"100%"}} />
        </div>;
      })}
    </div>
  </div>;
};
