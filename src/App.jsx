import React, { useState } from "react";
import { AppProvider } from "./context/AppContext";
import { Sidebar } from "./components/Sidebar";
import { GanttPage } from "./pages/GanttPage";
import { OuvriersPage } from "./pages/OuvriersPage";
import { ChantierPage } from "./pages/ChantierPage";
import "./gantt-sticky-fix.css";
import "./gantt-scroll-mask";
import "./gantt-legend-drag";

const VALID_PAGES = new Set(["gantt", "ouvriers", "chantiers"]);
const DATA_CACHE_MAX_AGE_MS = 5 * 60 * 1000;
const DELETION_TOMBSTONE_MAX_AGE_MS = 10 * 60 * 1000;

const prepareLocalPlanningState = () => {
  if (typeof window === "undefined") return;
  const now = Date.now();

  try {
    const savedPage = localStorage.getItem("currentPage");
    if (!VALID_PAGES.has(savedPage)) localStorage.setItem("currentPage", "gantt");
  } catch (_) {}

  // Le cache sert uniquement à accélérer un rechargement très récent.
  // Au-delà de quelques minutes, le serveur redevient la source de vérité.
  try {
    const rawCache = localStorage.getItem("abPlanningDataCacheV1");
    if (rawCache) {
      const cache = JSON.parse(rawCache);
      const savedAt = Number(cache?.savedAt || 0);
      if (!savedAt || now - savedAt > DATA_CACHE_MAX_AGE_MS) {
        localStorage.removeItem("abPlanningDataCacheV1");
      }
    }
  } catch (_) {
    try { localStorage.removeItem("abPlanningDataCacheV1"); } catch (_) {}
  }

  // Une suppression locale ne doit jamais masquer indéfiniment une affectation
  // recréée depuis un autre navigateur. On conserve seulement le garde-fou récent.
  try {
    const rawDeleted = JSON.parse(localStorage.getItem("abPlanningDeletedAssignmentsV2") || "[]");
    const freshDeleted = Array.isArray(rawDeleted)
      ? rawDeleted.filter(item => {
          const deletedAt = Number(item?.deletedAt || 0);
          return item?.key && deletedAt && now - deletedAt <= DELETION_TOMBSTONE_MAX_AGE_MS;
        })
      : [];

    if (freshDeleted.length) {
      localStorage.setItem("abPlanningDeletedAssignmentsV2", JSON.stringify(freshDeleted));
    } else {
      localStorage.removeItem("abPlanningDeletedAssignmentsV2");
    }
  } catch (_) {
    try { localStorage.removeItem("abPlanningDeletedAssignmentsV2"); } catch (_) {}
  }
};

prepareLocalPlanningState();

function App() {
  const [currentPage, setCurrentPage] = useState(() => {
    try {
      const savedPage = localStorage.getItem("currentPage");
      return VALID_PAGES.has(savedPage) ? savedPage : "gantt";
    } catch (_) {
      return "gantt";
    }
  });
  const [ganttControls, setGanttControls] = useState(null);

  const handleSetCurrentPage = page => {
    const safePage = VALID_PAGES.has(page) ? page : "gantt";
    try { localStorage.setItem("currentPage", safePage); } catch (_) {}
    setCurrentPage(safePage);
  };

  const pages = {
    gantt: { title:"Vue Gantt Unifiée", subtitle:"Visualiser les ouvriers et chantiers sur la même timeline", component:GanttPage },
    ouvriers: { title:"Ouvriers & Équipes", subtitle:"Gestion des effectifs CDI et sous-traitants", component:OuvriersPage },
    chantiers: { title:"Gestion des Chantiers", subtitle:"Actifs et archivés", component:ChantierPage }
  };

  const pageConfig = pages[currentPage] || pages.gantt;
  const CurrentPage = pageConfig.component;
  const isGantt = currentPage === "gantt";

  return (
    <AppProvider>
      <div style={{display:"flex",flexDirection:"column",height:"100vh",overflow:"hidden"}}>
        <Sidebar currentPage={currentPage} setCurrentPage={handleSetCurrentPage} ganttControls={ganttControls} />
        <div style={{flex:1,overflow:isGantt?"hidden":"auto",background:"#f9fafb",display:"flex",justifyContent:"center",padding:isGantt?0:"0 1rem",minHeight:0}}>
          <div style={{width:"100%",maxWidth:isGantt?"none":"1200px",display:"flex",flexDirection:"column",minHeight:0}}>
            <CurrentPage onGanttControlsReady={setGanttControls} />
          </div>
        </div>
      </div>
    </AppProvider>
  );
}

export default App;
