import React, { useRef, useState } from "react";
import { getWorkerSeparators, normalizeWorkerName, sortWorkersPlanning } from "../utils/planningOrder";

export const GanttChart = ({ ouvriers, chantiers, affectations, onAffectationClick, onAddAffectation, onControlsReady }) => {
  const mobileMediaQuery = "(max-width: 1100px) and (pointer: coarse)";
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.matchMedia(mobileMediaQuery).matches);
  const scrollRef = useRef(null);

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

  const colorMap = { 1:"#3b82f6",2:"#10b981",3:"#f59e0b",4:"#ef4444",5:"#8b5cf6",6:"#06b6d4",7:"#ec4899",8:"#f97316",9:"#6366f1",10:"#14b8a6" };
  const normalize = value => String(value ?? "").trim().toUpperCase();
  const isValidChantier = chantier => chantier && String(chantier.nom ?? "").trim() !== "" && String(chantier.nom ?? "").trim() !== "??";
  const isHorsGantt = (aff, chantier) => !isValidChantier(chantier) || normalize(aff?.typeAffectation) === "HORS_GANTT" || (normalize(aff?.source) === "GOOGLE" && normalize(aff?.typeAffectation) === "HORS_GANTT");
  const getChantierColor = chantierId => {
    if (colorMap[chantierId]) return colorMap[chantierId];
    const colors = Object.values(colorMap), numericId = Number(chantierId);
    return !numericId || Number.isNaN(numericId) ? colors[0] : colors[numericId % colors.length];
  };
  const getLetters = (aff, chantier) => isHorsGantt(aff, chantier) ? "" : String(chantier?.nom ?? "").trim().substring(0,3).toUpperCase();
  const getLabel = aff => {
    const tache = String(aff?.tache ?? "").trim();
    return !tache || normalize(tache) === "ND" ? "" : tache;
  };
  const parseDate = dateStr => {
    if (!dateStr) return null;
    if (dateStr instanceof Date) { const d = new Date(dateStr); return Number.isNaN(d.getTime()) ? null : d; }
    const str = String(dateStr);
    if (str.includes("T")) { const d = new Date(str); return Number.isNaN(d.getTime()) ? null : d; }
    if (str.includes("-")) { const [y,m,d] = str.split("-"); const date = new Date(Number(y),Number(m)-1,Number(d)); return Number.isNaN(date.getTime()) ? null : date; }
    if (str.includes("/")) { const [d,m,y] = str.split("/"); const date = new Date(Number(y),Number(m)-1,Number(d)); return Number.isNaN(date.getTime()) ? null : date; }
    const date = new Date(str); return Number.isNaN(date.getTime()) ? null : date;
  };

  const futureWeeks = 52;
  const dayWidth = isMobile ? 56 : 64;
  const today = new Date();
  today.setHours(0,0,0,0);
  const todayDow = today.getDay();
  const currentMonday = new Date(today);
  currentMonday.setDate(today.getDate() - (todayDow === 0 ? 6 : todayDow - 1));
  const rangeMonday = new Date(currentMonday);
  const allDates = [];
  for (let week = 0; week < futureWeeks; week++) {
    for (let day = 0; day < 5; day++) {
      const date = new Date(rangeMonday);
      date.setDate(rangeMonday.getDate() + week * 7 + day);
      allDates.push(date);
    }
  }
  const rangeStart = allDates[0];
  const rangeEnd = new Date(allDates[allDates.length - 1]);
  rangeEnd.setHours(23,59,59,999);

  const scrollToToday = behavior => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: 0, behavior: behavior || "smooth" });
  };

  React.useEffect(() => {
    const timer = window.setTimeout(() => scrollToToday("auto"), 0);
    return () => window.clearTimeout(timer);
  }, [isMobile]);

  React.useEffect(() => {
    if (!onControlsReady) return;
    onControlsReady({
      onToday: () => scrollToToday("smooth"),
      weekText: "Timeline continue"
    });
  }, [onControlsReady, isMobile]);

  const formatShortDate = date => `${["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"][date.getDay()]} ${String(date.getDate()).padStart(2,"0")}`;
  const monthNames = ["JANVIER","FÉVRIER","MARS","AVRIL","MAI","JUIN","JUILLET","AOÛT","SEPTEMBRE","OCTOBRE","NOVEMBRE","DÉCEMBRE"];
  const monthBandColors = ["#dbe7f3","#eef0f2"];
  const monthGroups = allDates.reduce((groups,date,index) => {
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const last = groups[groups.length-1];
    if (last && last.key === key) last.count += 1;
    else groups.push({ key, start:index, count:1, label:monthNames[date.getMonth()] });
    return groups;
  },[]);
  const getDayRightBorder = idx => (idx+1)%5===0 && idx<allDates.length-1 ? "3px solid #1e3a8a" : idx<allDates.length-1 ? "1px solid #d1d5db" : "none";
  const isAffectationInRange = aff => { const s=parseDate(aff.dateDebut),e=parseDate(aff.dateFin); if(!s||!e)return false; s.setHours(0,0,0,0); e.setHours(23,59,59,999); return s<=rangeEnd&&e>=rangeStart; };
  const isVisibleOnDay = (aff,date) => { const s=parseDate(aff.dateDebut),e=parseDate(aff.dateFin); if(!s||!e)return false; s.setHours(0,0,0,0); e.setHours(23,59,59,999); const d=new Date(date); d.setHours(12,0,0,0); return d>=s&&d<=e; };
  const getAffectationKey = aff => Number(aff?.chantierId) ? `CHANTIER:${Number(aff.chantierId)}` : `LIBRE:${normalize(aff?.nomExterne||aff?.affectationNom||"")}`;
  const getAffectationPriority = (aff,list) => { const key=getAffectationKey(aff); return list.reduce((score,item)=>getAffectationKey(item)!==key?score:score+allDates.filter(date=>isVisibleOnDay(item,date)).length,0); };
  const getRankOnDay = (aff,date,list) => { const overlapping=list.filter(item=>isVisibleOnDay(item,date)).sort((a,b)=>{const p=getAffectationPriority(b,list)-getAffectationPriority(a,list);if(p!==0)return p;const k=getAffectationKey(a).localeCompare(getAffectationKey(b),"fr",{sensitivity:"base"});return k!==0?k:Number(a.id)-Number(b.id);});return Math.max(0,overlapping.findIndex(item=>String(item.id)===String(aff.id))); };
  const getMaxOverlap = list => Math.max(1,...allDates.map(date=>list.filter(item=>isVisibleOnDay(item,date)).length));
  const canShowHorsGanttName = date => { const seuil=new Date(2026,7,3); seuil.setHours(0,0,0,0); const jour=new Date(date); jour.setHours(0,0,0,0); return jour>=seuil; };
  const getHorsGanttName = (aff,date) => canShowHorsGanttName(date) ? String(aff?.nomExterne||"").trim() : "";
  const ouvriersActifs = sortWorkersPlanning(ouvriers.filter(o=>o.statut==="Actif"));
  const chantiersActifs = chantiers.filter(c=>c.statut==="Actif");
  const gridTemplate = `repeat(${allDates.length}, ${dayWidth}px)`;
  const affectationSlotHeight = isMobile?28:29;
  const minRowHeight = isMobile?34:45;
  const headerHeight = isMobile?46:60;
  const monthHeaderHeight = isMobile?17:22;
  const dayHeaderHeight = headerHeight-monthHeaderHeight;
  const separateursApres = new Set(getWorkerSeparators());
  const separationStyle = {height:"3px",background:"#94a3b8",width:"100%"};
  const workerColumnWidth = isMobile?92:150;
  const timelineWidth = allDates.length * dayWidth;
  const totalWidth = workerColumnWidth + timelineWidth;
  const timelineFlexStyle = {width:timelineWidth,flex:`0 0 ${timelineWidth}px`};
  const rowWidthStyle = {minWidth:totalWidth};
  const stickyWorkerStyle = {position:"sticky",left:0,zIndex:8,boxShadow:"3px 0 5px rgba(15,23,42,0.08)"};
  const stickyHeaderStyle = {position:"sticky",left:0,zIndex:20,boxShadow:"3px 0 5px rgba(15,23,42,0.10)"};

  return <div style={{padding:isMobile?"0.18rem":"1rem",flex:1,display:"flex",flexDirection:"column",minWidth:0,minHeight:0}}>
    <div style={{display:"flex",gap:isMobile?"0.55rem":"1rem",alignItems:"center",flexWrap:"wrap",padding:isMobile?"0.25rem 0.35rem":"0.75rem 0.5rem",marginBottom:isMobile?"0.18rem":"0.5rem",background:"rgba(255,255,255,0.5)",borderRadius:"4px",fontSize:isMobile?10:11,lineHeight:1.1}}>
      {chantiersActifs.map(chantier=><div key={chantier.id} style={{display:"flex",alignItems:"center",gap:"5px"}}><div style={{width:isMobile?"9px":"10px",height:isMobile?"9px":"10px",backgroundColor:getChantierColor(chantier.id),borderRadius:"2px",flexShrink:0}}/><span style={{color:"#4b5563",fontWeight:500}}>{chantier.nom}</span></div>)}
    </div>
    <div ref={scrollRef} style={{background:"white",borderRadius:6,border:"1px solid #e5e7eb",display:"flex",flexDirection:"column",flex:1,overflowY:"auto",overflowX:"auto",WebkitOverflowScrolling:"touch",touchAction:"pan-x pan-y pinch-zoom",overscrollBehaviorX:"none",minWidth:0,minHeight:0,scrollbarWidth:"none",msOverflowStyle:"none"}}>
      <div style={{display:"flex",height:`${headerHeight}px`,flexShrink:0,...rowWidthStyle}}>
        <div style={{width:workerColumnWidth,background:"#e5e7eb",borderRight:"1px solid #9ca3af",flexShrink:0,...stickyHeaderStyle}} />
        <div style={{height:`${headerHeight}px`,background:"#e5e7eb",borderRight:"1px solid #9ca3af",...timelineFlexStyle}}>
          <div style={{display:"grid",gridTemplateColumns:gridTemplate,height:`${monthHeaderHeight}px`,borderBottom:"1px solid #cbd5e1",background:"#eef2f7"}}>
            {monthGroups.map((group,index)=><div key={group.key} style={{gridColumn:`${group.start+1} / span ${group.count}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:isMobile?9:10,fontWeight:800,letterSpacing:"0.04em",color:"#334155",background:monthBandColors[index%monthBandColors.length]}}>{group.label}</div>)}
          </div>
          <div style={{display:"grid",gridTemplateColumns:gridTemplate,height:`${dayHeaderHeight}px`,background:"#e5e7eb"}}>
            {allDates.map((date,idx)=><div key={idx} style={{padding:isMobile?"0.2rem 0.3rem":"0.45rem 0.55rem",borderRight:getDayRightBorder(idx),textAlign:"center",fontSize:9,fontWeight:700,color:"#1f2937",display:"flex",alignItems:"center",justifyContent:"center"}}>{formatShortDate(date)}</div>)}
          </div>
        </div>
      </div>
      <div style={{...separationStyle,width:totalWidth,flexShrink:0}} />
      {ouvriersActifs.map((ouvrier,idx)=>{
        const affectsByOuvrier=affectations.filter(a=>Number(a.ouvrierID)===Number(ouvrier.id)&&isAffectationInRange(a));
        const rowBackground=idx%2===0?"white":"#f3f4f6",maxOverlap=getMaxOverlap(affectsByOuvrier),rowHeight=Math.max(minRowHeight,maxOverlap*affectationSlotHeight+4);
        const separation=separateursApres.has(normalizeWorkerName(ouvrier.nom));
        return <div key={ouvrier.id} style={rowWidthStyle}>
          <div style={{display:"flex",height:`${rowHeight}px`,background:rowBackground,...rowWidthStyle}}>
            <div style={{width:workerColumnWidth,padding:isMobile?"0.22rem 0.4rem":"0.5rem 0.75rem",background:rowBackground,borderRight:"1px solid #9ca3af",fontSize:10,fontWeight:700,color:"#1f2937",display:"flex",flexDirection:"column",justifyContent:"center",flexShrink:0,...stickyWorkerStyle}}><div>{ouvrier.nom}</div></div>
            <div style={{display:"grid",gridTemplateColumns:gridTemplate,background:rowBackground,borderRight:"1px solid #9ca3af",position:"relative",height:`${rowHeight}px`,...timelineFlexStyle}}>
              {allDates.map((date,dayIdx)=><div key={dayIdx} onClick={()=>onAddAffectation(ouvrier.id,date)} style={{borderRight:getDayRightBorder(dayIdx),position:"relative",cursor:"pointer",padding:"1px",overflow:"hidden"}}>
                {affectsByOuvrier.map(aff=>{
                  if(!isVisibleOnDay(aff,date))return null;
                  const chantier=chantiers.find(c=>Number(c.id)===Number(aff.chantierId)),horsGantt=isHorsGantt(aff,chantier),lettres=getLetters(aff,chantier),label=getLabel(aff),nomHorsGantt=horsGantt?getHorsGanttName(aff,date):"",rank=getRankOnDay(aff,date,affectsByOuvrier),topOffset=rank*affectationSlotHeight+2;
                  return <div key={aff.id} onClick={e=>{e.stopPropagation();onAffectationClick(aff);}} style={{position:"absolute",left:1,right:1,top:`${topOffset}px`,cursor:"pointer",zIndex:2}}>
                    <div title={horsGantt?aff.nomExterne||"Événement Google":`${chantier?.nom||""} — cliquer pour modifier`} style={{width:"100%",height:"18px",backgroundColor:horsGantt?"#D1D5DB":getChantierColor(chantier?.id),border:horsGantt?"1px solid #9CA3AF":"1px solid rgba(0,0,0,0.16)",borderRadius:isMobile?4:2,boxSizing:"border-box",display:"flex",alignItems:"center",justifyContent:"center",padding:horsGantt?"0 3px":0,color:horsGantt?"#374151":"white",fontWeight:horsGantt?700:800,fontSize:horsGantt?7:10,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{horsGantt?nomHorsGantt:lettres}</div>
                    {label&&<div title={label} style={{marginTop:1,height:8,fontSize:7,fontWeight:600,color:"#374151",textAlign:"center",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",lineHeight:"8px"}}>{label}</div>}
                  </div>;
                })}
              </div>)}
            </div>
          </div>
          <div style={separation?{...separationStyle,width:totalWidth}:{height:"1px",background:"#d1d5db",width:totalWidth}} />
        </div>;
      })}
    </div>
  </div>;
};
