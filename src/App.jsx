import React, { useState } from "react";
import { AppProvider } from "./context/AppContext";
import { Sidebar } from "./components/Sidebar";
import { GanttPage } from "./pages/GanttPage";
import { OuvriersPage } from "./pages/OuvriersPage";
import { ChantierPage } from "./pages/ChantierPage";

function App() {
  const [currentPage, setCurrentPage] = useState(() => {
    // Charger depuis localStorage, sinon "gantt" par défaut
    return localStorage.getItem("currentPage") || "gantt";
  });

  // Sauvegarder le currentPage quand il change
  const handleSetCurrentPage = (page) => {
    localStorage.setItem("currentPage", page);
    setCurrentPage(page);
  };

  const pages = {
    gantt: {
      title: "Vue Gantt Unifiée",
      subtitle: "Visualiser les ouvriers et chantiers sur la même timeline",
      component: GanttPage
    },
    ouvriers: {
      title: "Ouvriers & Équipes",
      subtitle: "Gestion des effectifs CDI et sous-traitants",
      component: OuvriersPage
    },
    chantiers: {
      title: "Gestion des Chantiers",
      subtitle: "Actifs et archivés",
      component: ChantierPage
    }
  };

  const CurrentPage = pages[currentPage].component;

  return (
    <AppProvider>
      <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
        <Sidebar currentPage={currentPage} setCurrentPage={handleSetCurrentPage} />
        <div style={{ 
          flex: 1, 
          overflowY: "auto", 
          background: "#f9fafb",
          display: "flex",
          justifyContent: "center",
          padding: "0 1rem"
        }}>
          <div style={{
            width: "100%",
            maxWidth: "1200px",
            display: "flex",
            flexDirection: "column"
          }}>
            <CurrentPage />
          </div>
        </div>
      </div>
    </AppProvider>
  );
}

export default App;
