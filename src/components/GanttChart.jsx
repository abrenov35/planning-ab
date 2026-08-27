import React, { useRef, useState } from "react";
import { getWorkerSeparators, normalizeWorkerName, sortWorkersPlanning } from "../utils/planningOrder";

export const GanttChart = ({ ouvriers, chantiers, affectations, onAffectationClick, onAddAffectation, onControlsReady }) => {
  const mobileMediaQuery = "(max-width: 1100px) and (pointer: coarse)";
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.matchMedia(mobileMediaQuery).matches);
  const [pastWeeks, setPastWeeks] = useState(0);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [isMouseDragging, setIsMouseDragging] = useState(false);
  const [highlightedAffectationId, setHighlightedAffectationId] = useState(null);
  const scrollRef = useRef(null);
  const touchStartRef = useRef(null);
  const lastTapRef = useRef({ key:"", time:0 });
  const mouseDragRef = useRef({ active:false, moved:false, startX:0, scrollLeft:0 });
  const suppressClickRef = useRef(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia(mobileMediaQuery);
    const update = () => setIsMobile(media.matches);
    update();
    if (media.addEventListener) media.addEventListener("change", update); else media.addListener(update);
    window.addEventListener("orientationchange", update);
    window.addEventListener("resize", update);
    return () => {
      if (media.removeEventListener) media.removeEventListener("change", update); else media.removeListener(update);
      window.removeEventListener("orientationchange", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(entries => {
      const box = entries[0]?.contentRect;
      if (!box) return;
      setViewport({ width: box.width, height: box.height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const colorMap = {
    1:"#3b82f6", 2:"#10b981", 3:"#f59e0b", 4:"#ef4444", 5:"#8b5cf6",
    6:"#06b6d4", 7:"#ec4899", 8:"#f97316", 9:"#6366f1", 10:"#14b8a6"
  };
  const rdvColor = "#7c3aed";
  const planningColor = "#0f766e";
  const normalize = value => String(value ?? "").trim().toUpperCase();
  const isPlanning = aff => normalize(aff?.nomExterne || aff?.affectationNom || aff?.tache) === "PLANNING";
  const isRdvTask = aff => /^\s*RDV\b/i.test(String(aff?.tache ?? ""));
  const isValidChantier = chantier => chantier && String(chantier.nom ?? "").trim() !== "" && String(chantier.nom ?? "").trim() !== "??";
  const isHorsGantt = (aff, chantier) => !isValidChantier(chantier) || normalize(aff?.typeAffectation) === "HORS_GANTT" || (normalize(aff?.source) === "GOOGLE" && normalize(aff?.typeAffectation) === "HORS_GANTT");
  const getChantierColor = chantierId => {
    const chantier = chantiers.find(c => Number(c.id) === Number(chantierId));
    const couleurManuelle = String(chantier?.couleur || "").trim();
    if (/^#[0-9A-Fa-f]{6}$/.test(couleurManuelle)) return couleurManuelle;
    if (colorMap[chantierId]) return colorMap[chantierId];
    const colors = Object.values(colorMap);
    const numericId = Number(chantierId);
    return !numericId || Number.isNaN(numericId) ? colors[0] : colors[numericId % colors.length];
  };
  const getLetters = (aff, chantier) => isHorsGantt(aff, chantier) ? "" : String(chantier?.nom ?? "").trim().substring(0,4).toUpperCase();
  const getLabel = aff => {
    const tache = String(aff?.tache ?? "").trim();
    return !tache || normalize(tache) === "ND" ? "" : tache;
  };
  const getRdvTimeLabel = aff => {
    const match = String(aff?.tache ?? "").match(/(\d{1,2})\s*[h:]\s*(\d{2})/i);
    return match ? `${String(match[1]).padStart(2,"0")}h${match[2]}` : "";
  };
  const fitTextSize = text => {
    const length = String(text || "").length;
    if (dayWidth < 27) return length > 8 ? 4.5 : length > 5 ? 5 : 6;
    return length > 16 ? 5 : length > 11 ? 6 : length > 7 ? 7 : 8;
  };
  const parseDate = dateStr => {
    if (!dateStr) return null;
    if (dateStr instanceof Date) {
      const d = new Date(dateStr);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    const str = String(dateStr);
    if (str.includes("T")) {
      const d = new Date(str);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    if (str.includes("-")) {
      const [y,m,d] = str.split("-");
      const date = new Date(Number(y), Number(m)-1, Number(d));
      return Number.isNaN(date.getTime()) ? null : date;
    }
    if (str.includes("/")) {
      const [d,m,y] = str.split("/");
      const date = new Date(Number(y), Number(m)-1, Number(d));
      return Number.isNaN(date.getTime()) ? null : date;
    }
    const date = new Date(str);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const ouvriersActifs = sortWorkersPlanning(ouvriers.filter(o => o.statut === "Actif"));
  const chantiersActifs = chantiers.filter(c => c.statut === "Actif");
  const futureWeeks = 52;
  const visibleDays = 15;
  const workerColumnWidth = isMobile ? 92 : 150;
  const availableTimelineWidth = Math.max(280, (viewport.width || (typeof window !== "undefined" ? window.innerWidth : 1200)) - workerColumnWidth - 2);
  const dayWidth = Math.max(14, availableTimelineWidth / visibleDays);

  const today = new Date();
  today.setHours(0,0,0,0);
  const todayDow = today.getDay();
  const currentMonday = new Date(today);
  currentMonday.setDate(today.getDate() - (todayDow === 0 ? 6 : todayDow - 1));
  const rangeMonday = new Date(currentMonday);
  rangeMonday.setDate(currentMonday.getDate() - pastWeeks * 7);

  const allDates = [];
  for (let week=0; week<pastWeeks+futureWeeks; week++) {
    for (let day=0; day<5; day++) {
      const date = new Date(rangeMonday);
      date.setDate(rangeMonday.getDate() + week*7 + day);
      allDates.push(date);
    }
  }

  const rangeStart = allDates[0];
  const rangeEnd = new Date(allDates[allDates.length-1]);
  rangeEnd.setHours(23,59,59,999);
  const todayScrollLeft = pastWeeks * 5 * dayWidth;

  const scrollToToday = behavior => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left:todayScrollLeft, behavior:behavior || "smooth" });
  };
  const showPast = () => {
    setPastWeeks(p => p + 1);
    window.setTimeout(() => scrollRef.current?.scrollTo({ left:0, behavior:"smooth" }), 0);
  };
  const goToday = () => {
    setPastWeeks(0);
    window.setTimeout(() => scrollRef.current?.scrollTo({ left:0, behavior:"smooth" }), 0);
  };

  const findFirstChantierAffectation = query => {
    const searched=normalize(query);
    const chantier=chantiers.find(c => String(c.id) === String(query) || normalize(c.nom) === searched)
      || chantiers.find(c => normalize(c.nom).includes(searched));
    if(!chantier) return {success:false,message:"Chantier introuvable."};
    const candidates=affectations.filter(aff => {
      if(Number(aff.chantierId)!==Number(chantier.id)) return false;
      const end=parseDate(aff.dateFin);
      return end && end.setHours(23,59,59,999)>=today.getTime();
    }).sort((a,b) => {
      const aStart=parseDate(a.dateDebut)?.getTime() || Number.MAX_SAFE_INTEGER;
      const bStart=parseDate(b.dateDebut)?.getTime() || Number.MAX_SAFE_INTEGER;
      return Math.max(aStart,today.getTime())-Math.max(bStart,today.getTime());
    });
    const found=candidates[0];
    if(!found) return {success:false,message:`Aucune affectation de ${chantier.nom} à partir d'aujourd'hui.`};
    const dayIndex=allDates.findIndex(date => date>=today && isVisibleOnDay(found,date));
    if(dayIndex<0) return {success:false,message:"L'affectation est au-delà de la période affichable."};
    const el=scrollRef.current;
    const workerIndex=ouvriersActifs.findIndex(o => Number(o.id)===Number(found.ouvrierID));
    if(!el || workerIndex<0) return {success:false,message:"L'ouvrier de cette affectation n'est pas affiché."};
    const row=el.querySelector(`[data-worker-id="${found.ouvrierID}"]`);
    const left=Math.max(0,dayIndex*dayWidth-dayWidth*2);
    const top=row ? Math.max(0,row.offsetTop-headerHeight-4) : el.scrollTop;
    el.scrollTo({left,top,behavior:"smooth"});
    setHighlightedAffectationId(found.id);
    window.setTimeout(()=>setHighlightedAffectationId(current => current===found.id ? null : current),2600);
    return {success:true,affectation:found};
  };

  const handleMouseDown = e => {
    if (isMobile || e.button !== 0) return;
    if (e.target?.closest?.("button,input,textarea,select,a")) return;
    const el = scrollRef.current;
    if (!el) return;
    mouseDragRef.current = { active:true, moved:false, startX:e.clientX, scrollLeft:el.scrollLeft };
    suppressClickRef.current = false;
  };
  const handleMouseMove = e => {
    if (isMobile) return;
    const drag = mouseDragRef.current;
    const el = scrollRef.current;
    if (!drag.active || !el) return;
    const dx = e.clientX - drag.startX;
    if (!drag.moved && Math.abs(dx) < 4) return;
    if (!drag.moved) {
      drag.moved = true;
      suppressClickRef.current = true;
      setIsMouseDragging(true);
    }
    el.scrollLeft = drag.scrollLeft - dx;
    e.preventDefault();
  };
  const endMouseDrag = () => {
    const moved = mouseDragRef.current.moved;
    mouseDragRef.current.active = false;
    mouseDragRef.current.moved = false;
    setIsMouseDragging(false);
    if (moved) window.setTimeout(() => { suppressClickRef.current = false; }, 0);
  };

  const handleEmptyCellDoubleClick = (e,ouvrierId,date) => {
    e.stopPropagation();
    if (isMobile || suppressClickRef.current) return;
    onAddAffectation(ouvrierId,date);
  };
  const handleEmptyCellTouchStart = (e,key) => {
    // Un bloc d'affectation est imbriqué dans la case. Ne pas effacer ici le
    // premier tap du bloc lorsque son événement remonte jusqu'à la case.
    if (e.target !== e.currentTarget) return;
    if (!isMobile || e.touches.length !== 1) {
      touchStartRef.current = null;
      return;
    }
    const touch = e.touches[0];
    touchStartRef.current = { x:touch.clientX, y:touch.clientY, key };
  };
  const handleEmptyCellTouchEnd = (e,ouvrierId,date,key) => {
    if (!isMobile || e.target !== e.currentTarget) return;
    const start = touchStartRef.current;
    touchStartRef.current = null;
    const touch = e.changedTouches?.[0];
    if (!start || !touch || start.key !== key) return;
    if (Math.hypot(touch.clientX-start.x, touch.clientY-start.y) > 10) return;
    const now = Date.now();
    const last = lastTapRef.current;
    if (last.key === key && now-last.time <= 350) {
      lastTapRef.current = { key:"", time:0 };
      e.preventDefault();
      onAddAffectation(ouvrierId,date);
    } else {
      lastTapRef.current = { key, time:now };
    }
  };
  const handleAffectationDoubleClick = (e,affectation) => {
    e.stopPropagation();
    if (isMobile || suppressClickRef.current) return;
    onAffectationClick(affectation);
  };
  const handleAffectationTouchStart = (e,key) => {
    e.stopPropagation();
    if (!isMobile || e.touches.length !== 1) {
      touchStartRef.current = null;
      return;
    }
    const touch = e.touches[0];
    touchStartRef.current = { x:touch.clientX, y:touch.clientY, key };
  };
  const handleAffectationTouchEnd = (e,affectation,key) => {
    e.stopPropagation();
    if (!isMobile) return;
    const start = touchStartRef.current;
    touchStartRef.current = null;
    const touch = e.changedTouches?.[0];
    if (!start || !touch || start.key !== key) return;
    if (Math.hypot(touch.clientX-start.x, touch.clientY-start.y) > 10) return;
    const now = Date.now();
    const last = lastTapRef.current;
    if (last.key === key && now-last.time <= 350) {
      lastTapRef.current = { key:"", time:0 };
      e.preventDefault();
      onAffectationClick(affectation);
    } else {
      lastTapRef.current = { key, time:now };
    }
  };

  React.useEffect(() => {
    const timer = window.setTimeout(() => scrollToToday("auto"), 0);
    return () => window.clearTimeout(timer);
  }, [isMobile, dayWidth]);

  React.useEffect(() => {
    if (!onControlsReady) return;
    onControlsReady({ onToday:goToday, onPast:showPast, onFindChantier:findFirstChantierAffectation, searchChantiers:chantiersActifs.map(c=>({id:c.id,nom:c.nom})), weekText:"3 semaines visibles" });
  }, [onControlsReady, isMobile, pastWeeks, dayWidth, affectations, chantiers]);

  React.useEffect(() => {
    if (isMobile || typeof window === "undefined") return;
    const onKeyDown = e => {
      const target = e.target;
      const tag = target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select" || target?.isContentEditable) return;
      if (!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.key)) return;
      const el = scrollRef.current;
      if (!el) return;
      e.preventDefault();
      const horizontalStep = 5 * dayWidth;
      const verticalStep = 100;
      if (e.key === "ArrowRight") el.scrollBy({ left:horizontalStep, behavior:"smooth" });
      if (e.key === "ArrowLeft") el.scrollBy({ left:-horizontalStep, behavior:"smooth" });
      if (e.key === "ArrowDown") el.scrollBy({ top:verticalStep, behavior:"smooth" });
      if (e.key === "ArrowUp") el.scrollBy({ top:-verticalStep, behavior:"smooth" });
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMobile, dayWidth]);

  const formatShortDate = date => {
    const day = ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"][date.getDay()];
    return dayWidth < 27 ? String(date.getDate()).padStart(2,"0") : `${day} ${String(date.getDate()).padStart(2,"0")}`;
  };
  const monthNames = ["JANVIER","FÉVRIER","MARS","AVRIL","MAI","JUIN","JUILLET","AOÛT","SEPTEMBRE","OCTOBRE","NOVEMBRE","DÉCEMBRE"];
  const monthBandColors = ["#dbe7f3","#eef0f2"];
  const monthGroups = allDates.reduce((groups,date,index) => {
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const last = groups[groups.length-1];
    if (last && last.key === key) last.count += 1;
    else groups.push({ key, start:index, count:1, label:monthNames[date.getMonth()] });
    return groups;
  }, []);
  const getDayRightBorder = idx => (idx+1)%5 === 0 && idx < allDates.length-1 ? "3px solid #1e3a8a" : idx < allDates.length-1 ? "1px solid #d1d5db" : "none";
  const isAffectationInRange = aff => {
    const s = parseDate(aff.dateDebut), e = parseDate(aff.dateFin);
    if (!s || !e) return false;
    s.setHours(0,0,0,0); e.setHours(23,59,59,999);
    return s <= rangeEnd && e >= rangeStart;
  };
  const isVisibleOnDay = (aff,date) => {
    const s = parseDate(aff.dateDebut), e = parseDate(aff.dateFin);
    if (!s || !e) return false;
    s.setHours(0,0,0,0); e.setHours(23,59,59,999);
    const d = new Date(date); d.setHours(12,0,0,0);
    return d >= s && d <= e;
  };
  const getAffectationKey = aff => Number(aff?.chantierId) ? `CHANTIER:${Number(aff.chantierId)}` : `LIBRE:${normalize(aff?.nomExterne || aff?.affectationNom || "")}`;
  const getLanePlan = list => {
    const groups = new Map();
    list.forEach((aff,index) => {
      const key = getAffectationKey(aff);
      if (!groups.has(key)) groups.set(key,{ key, firstIndex:index, days:new Set() });
      const group = groups.get(key);
      allDates.forEach((date,dayIndex) => {
        if (isVisibleOnDay(aff,date)) group.days.add(dayIndex);
      });
    });
    const ordered = [...groups.values()].sort((a,b) => {
      const aFirst = a.days.size ? Math.min(...a.days) : Number.MAX_SAFE_INTEGER;
      const bFirst = b.days.size ? Math.min(...b.days) : Number.MAX_SAFE_INTEGER;
      return aFirst-bFirst || a.firstIndex-b.firstIndex || a.key.localeCompare(b.key,"fr",{sensitivity:"base"});
    });
    const laneDays = [];
    const laneByKey = new Map();
    ordered.forEach(group => {
      let lane = 0;
      while (laneDays[lane] && [...group.days].some(dayIndex => laneDays[lane].has(dayIndex))) lane += 1;
      if (!laneDays[lane]) laneDays[lane] = new Set();
      group.days.forEach(dayIndex => laneDays[lane].add(dayIndex));
      laneByKey.set(group.key,lane);
    });
    return { laneByKey, laneCount:Math.max(1,laneDays.length) };
  };
  const canShowHorsGanttName = date => {
    const seuil = new Date(2026,7,3); seuil.setHours(0,0,0,0);
    const jour = new Date(date); jour.setHours(0,0,0,0);
    return jour >= seuil;
  };
  const getHorsGanttName = (aff,date) => canShowHorsGanttName(date) ? String(aff?.nomExterne || "").trim() : "";

  const headerHeight = isMobile ? 42 : 52;
  const monthHeaderHeight = isMobile ? 15 : 19;
  const dayHeaderHeight = headerHeight - monthHeaderHeight;
  const affectationSlotHeight = isMobile ? 22 : 24;
  const minRowHeight = isMobile ? 24 : 26;
  const gridTemplate = `repeat(${allDates.length}, ${dayWidth}px)`;
  const separateursApres = new Set(getWorkerSeparators());
  const separationStyle = { height:"3px", background:"#94a3b8", width:"100%" };
  const timelineWidth = allDates.length * dayWidth;
  const totalWidth = workerColumnWidth + timelineWidth;
  const timelineFlexStyle = { width:timelineWidth, flex:`0 0 ${timelineWidth}px` };
  const rowWidthStyle = { minWidth:totalWidth };
  const stickyWorkerStyle = { position:"sticky", left:0, zIndex:8, boxShadow:"3px 0 5px rgba(15,23,42,0.08)" };
  const stickyHeaderStyle = { position:"sticky", left:0, zIndex:20, boxShadow:"3px 0 5px rgba(15,23,42,0.10)" };

  return (
    <div style={{padding:isMobile ? "0.12rem" : "0.45rem",flex:1,display:"flex",flexDirection:"column",minWidth:0,minHeight:0}}>
      <style>{`.gantt-scroll::-webkit-scrollbar,.gantt-legend::-webkit-scrollbar{display:none;width:0;height:0}.gantt-scroll,.gantt-legend{scrollbar-width:none;-ms-overflow-style:none}.gantt-scroll.dragging,.gantt-scroll.dragging *{cursor:grabbing!important;user-select:none!important}@keyframes ganttSearchPulse{0%,100%{filter:brightness(1);box-shadow:0 0 0 0 rgba(245,158,11,0)}25%,75%{filter:brightness(1.18);box-shadow:0 0 0 4px rgba(245,158,11,.9)}}.gantt-search-hit{animation:ganttSearchPulse 2.4s ease-in-out}`}</style>

      <div className="gantt-legend" style={{display:"flex",gap:isMobile ? "0.45rem" : "0.8rem",alignItems:"center",flexWrap:"nowrap",overflowX:"auto",padding:isMobile ? "0.18rem 0.3rem" : "0.35rem 0.4rem",marginBottom:isMobile ? "0.12rem" : "0.3rem",background:"rgba(255,255,255,0.5)",borderRadius:4,fontSize:isMobile ? 9 : 10,lineHeight:1.1,flexShrink:0}}>
        {chantiersActifs.map(chantier => (
          <div key={chantier.id} style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
            <div style={{width:8,height:8,backgroundColor:getChantierColor(chantier.id),borderRadius:2,flexShrink:0}} />
            <span style={{color:"#4b5563",fontWeight:500}}>{chantier.nom}</span>
          </div>
        ))}
        <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}><div style={{width:8,height:8,backgroundColor:rdvColor,borderRadius:2,flexShrink:0}} /><span style={{color:"#6d28d9",fontWeight:800}}>RDV</span></div>
        <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}><div style={{width:8,height:8,backgroundColor:planningColor,borderRadius:2,flexShrink:0}} /><span style={{color:planningColor,fontWeight:800}}>PLANNING</span></div>
      </div>

      <div ref={scrollRef} className={`gantt-scroll${isMouseDragging ? " dragging" : ""}`} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={endMouseDrag} onMouseLeave={endMouseDrag} style={{background:"white",borderRadius:6,border:"1px solid #e5e7eb",display:"flex",flexDirection:"column",flex:1,overflowY:"auto",overflowX:"auto",WebkitOverflowScrolling:"touch",touchAction:"pan-x pan-y pinch-zoom",overscrollBehaviorX:"none",minWidth:0,minHeight:0,cursor:isMobile ? "default" : isMouseDragging ? "grabbing" : "grab"}}>
        <div style={{display:"flex",height:headerHeight,flexShrink:0,position:"sticky",top:0,zIndex:25,background:"#e5e7eb",boxShadow:"0 2px 4px rgba(15,23,42,0.14)",...rowWidthStyle}}>
          <div style={{width:workerColumnWidth,background:"#e5e7eb",borderRight:"1px solid #9ca3af",flexShrink:0,...stickyHeaderStyle,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 8px",boxSizing:"border-box"}}><button type="button" onClick={e=>{e.stopPropagation();goToday();}} style={{width:"100%",height:28,border:"1px solid rgba(255,255,255,0.42)",borderRadius:5,background:"#10b981",color:"white",fontSize:10,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>Aujourd'hui</button></div>
          <div style={{height:headerHeight,background:"#e5e7eb",borderRight:"1px solid #9ca3af",...timelineFlexStyle}}>
            <div style={{display:"grid",gridTemplateColumns:gridTemplate,height:monthHeaderHeight,borderBottom:"1px solid #cbd5e1",background:"#eef2f7"}}>{monthGroups.map((group,index) => <div key={group.key} style={{gridColumn:`${group.start+1} / span ${group.count}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:dayWidth < 27 ? 7 : isMobile ? 8 : 9,fontWeight:800,letterSpacing:"0.03em",color:"#334155",background:monthBandColors[index%monthBandColors.length],overflow:"hidden"}}>{group.label}</div>)}</div>
            <div style={{display:"grid",gridTemplateColumns:gridTemplate,height:dayHeaderHeight,background:"#e5e7eb"}}>{allDates.map((date,idx) => <div key={idx} style={{borderRight:getDayRightBorder(idx),textAlign:"center",fontSize:dayWidth < 27 ? 8 : isMobile ? 9 : 10,fontWeight:900,color:"#172554",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",whiteSpace:"nowrap"}}>{formatShortDate(date)}</div>)}</div>
          </div>
        </div>
        <div style={{...separationStyle,width:totalWidth,flexShrink:0}} />
        {ouvriersActifs.map((ouvrier,idx) => {
          const affectsByOuvrier = affectations.filter(a => Number(a.ouvrierID) === Number(ouvrier.id) && isAffectationInRange(a));
          const rowBackground = idx%2 === 0 ? "white" : "#f3f4f6";
          const lanePlan = getLanePlan(affectsByOuvrier);
          const rowHeight = Math.max(minRowHeight, lanePlan.laneCount*affectationSlotHeight+2);
          const separation = separateursApres.has(normalizeWorkerName(ouvrier.nom));
          return (
            <div key={ouvrier.id} data-worker-id={ouvrier.id} style={rowWidthStyle}>
              <div style={{display:"flex",height:rowHeight,background:rowBackground,...rowWidthStyle}}>
                <div style={{width:workerColumnWidth,padding:isMobile ? "0.12rem 0.3rem" : "0.25rem 0.55rem",background:rowBackground,borderRight:"1px solid #9ca3af",fontSize:isMobile ? 11 : 12,fontWeight:900,color:"#172554",display:"flex",alignItems:"center",flexShrink:0,...stickyWorkerStyle,boxSizing:"border-box",overflow:"hidden"}}><div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ouvrier.nom}</div></div>
                <div style={{display:"grid",gridTemplateColumns:gridTemplate,background:rowBackground,borderRight:"1px solid #9ca3af",position:"relative",height:rowHeight,...timelineFlexStyle}}>
                  {allDates.map((date,dayIdx) => {
                    const cellKey = `${ouvrier.id}:${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`;
                    return <div key={dayIdx} onDoubleClick={e=>handleEmptyCellDoubleClick(e,ouvrier.id,date)} onTouchStart={e=>handleEmptyCellTouchStart(e,cellKey)} onTouchEnd={e=>handleEmptyCellTouchEnd(e,ouvrier.id,date,cellKey)} style={{borderRight:getDayRightBorder(dayIdx),position:"relative",cursor:"pointer",padding:1,overflow:"hidden"}}>
                      {affectsByOuvrier.map(aff => {
                        if (!isVisibleOnDay(aff,date)) return null;
                        const chantier = chantiers.find(c => Number(c.id) === Number(aff.chantierId));
                        const horsGantt = isHorsGantt(aff,chantier);
                        const rdv = isRdvTask(aff);
                        const lettres = getLetters(aff,chantier);
                        const label = rdv ? getRdvTimeLabel(aff) : getLabel(aff);
                        const nomHorsGantt = horsGantt ? getHorsGanttName(aff,date) : "";
                        const rdvName = String(nomHorsGantt || chantier?.nom || "RDV").trim();
                        const rank = lanePlan.laneByKey.get(getAffectationKey(aff)) ?? 0;
                        const topOffset = rank*affectationSlotHeight+1;
                        const planning = isPlanning(aff);
                        const barBackground = rdv ? rdvColor : planning ? planningColor : horsGantt ? "#D1D5DB" : getChantierColor(chantier?.id);
                        const barColor = rdv || planning ? "white" : horsGantt ? "#374151" : "white";
                        const barBorder = rdv ? "1px solid #6d28d9" : planning ? "1px solid #115e59" : horsGantt ? "1px solid #9CA3AF" : "1px solid rgba(0,0,0,0.16)";
                        const barText = rdv ? rdvName : horsGantt ? nomHorsGantt : lettres;
                        const barHeight = Math.max(13, affectationSlotHeight - 10);
                        return <div key={aff.id} onDoubleClick={e=>handleAffectationDoubleClick(e,aff)} onTouchStart={e=>handleAffectationTouchStart(e,`affectation:${aff.id}`)} onTouchEnd={e=>handleAffectationTouchEnd(e,aff,`affectation:${aff.id}`)} style={{position:"absolute",left:1,right:1,top:topOffset,cursor:"pointer",zIndex:2}}>
                          <div className={highlightedAffectationId===aff.id ? "gantt-search-hit" : ""} title={rdv ? `${rdvName} — ${label}` : horsGantt ? aff.nomExterne || "Événement Google" : `${chantier?.nom || ""} — double-cliquer pour modifier`} style={{width:"100%",height:barHeight,backgroundColor:barBackground,border:barBorder,borderRadius:isMobile ? 3 : 2,boxSizing:"border-box",display:"flex",alignItems:"center",justifyContent:"center",padding:(horsGantt || rdv) ? "0 2px" : 0,color:barColor,fontWeight:800,fontSize:fitTextSize(barText),overflow:"hidden",minWidth:0}}><span style={{display:"block",maxWidth:"100%",minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",textAlign:"center"}}>{barText}</span></div>
                          {label && <div title={label} style={{marginTop:1,height:7,fontSize:dayWidth < 27 ? 5 : 6,fontWeight:rdv ? 800 : 600,color:rdv ? "#6d28d9" : "#374151",textAlign:"center",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",lineHeight:"7px"}}>{label}</div>}
                        </div>;
                      })}
                    </div>;
                  })}
                </div>
              </div>
              <div style={separation ? {...separationStyle,width:totalWidth} : {height:1,background:"#d1d5db",width:totalWidth}} />
            </div>
          );
        })}
      </div>
    </div>
  );
};
