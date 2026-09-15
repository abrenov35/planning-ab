import React, { useContext, useState } from "react";
import { AppContext, AppProvider } from "./context/AppContext";
import { Sidebar } from "./components/Sidebar";
import { GanttPage } from "./pages/GanttPage";
import { OuvriersPage } from "./pages/OuvriersPage";
import { ChantierPage } from "./pages/ChantierPage";
import "./gantt-sticky-fix.css";
import "./gantt-scroll-mask";
import "./gantt-legend-drag";

const VALID_PAGES = new Set(["gantt", "ouvriers", "chantiers"]);

const prepareLocalPlanningState = () => {
  if (typeof window === "undefined") return;
  try {
    const savedPage = localStorage.getItem("currentPage");
    if (!VALID_PAGES.has(savedPage)) localStorage.setItem("currentPage", "gantt");
  } catch (_) {}
};

prepareLocalPlanningState();

const PlanningSafetyAlert = () => {
  const { error } = useContext(AppContext);
  if (!error) return null;
  return (
    <div
      role="alert"
      style={{
        position:"fixed",
        top:48,
        right:10,
        zIndex:10000,
        maxWidth:"min(520px, calc(100vw - 20px))",
        padding:"10px 12px",
        border:"2px solid #b91c1c",
        borderRadius:7,
        background:"#fef2f2",
        color:"#7f1d1d",
        fontSize:12,
        fontWeight:800,
        boxShadow:"0 4px 14px rgba(0,0,0,.18)"
      }}
    >
      ALERTE PLANNING — {error}
    </div>
  );
};

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
      <PlanningSafetyAlert />
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
