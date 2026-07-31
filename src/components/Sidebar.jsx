import React from "react";
import { VERSION } from "../version.js";

export const Sidebar = ({ 
  currentPage, 
  setCurrentPage,
  ganttControls 
}) => {

  const pages = [
    { id: "gantt", label: "📅 Vue Gantt" },
    { id: "chantiers", label: "🏗️ Chantiers" }
  ];

  const ouvrierButton = { id: "ouvriers", label: "👷 Ouvriers" };

  return (
    <div style={{
      background: "#1e3a8a",
      color: "white",
      display: "flex",
      alignItems: "center",
      padding: "0.5rem 1rem",
      borderBottom: "1px solid rgba(255,255,255,0.1)",
      gap: "1rem",
      whiteSpace: "nowrap",
      position: "sticky",
      top: 0,
      zIndex: 100,
      overflow: "auto"
    }}>
      {/* LOGO */}
      <div style={{ fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
        AB PLANNING
      </div>

      {/* ONGLETS */}
      <div style={{ display: "flex", gap: "0.25rem", flexShrink: 0 }}>
        {pages.map(page => (
          <button
            key={page.id}
            onClick={() => setCurrentPage(page.id)}
            style={{
              padding: "4px 12px",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: currentPage === page.id ? 600 : 400,
              border: "none",
              background: currentPage === page.id ? "rgba(255,255,255,0.2)" : "transparent",
              color: "white",
              borderRadius: "4px",
              transition: "all 0.2s",
              borderBottom: currentPage === page.id ? "2px solid #f59e0b" : "2px solid transparent",
              flexShrink: 0
            }}
          >
            {page.label}
          </button>
        ))}
      </div>

      {/* CONTRÔLES GANTT - AFFICHÉS SEULEMENT SUR LA PAGE GANTT */}
      {currentPage === "gantt" && ganttControls && (
        <>
          {/* SÉPARATEUR */}
          <div style={{
            width: "1px",
            height: "24px",
            background: "rgba(255,255,255,0.2)",
            flexShrink: 0
          }} />

          {/* BOUTONS DE NAVIGATION */}
          <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
            <button
              onClick={ganttControls.onPrevWeek}
              style={{
                padding: "4px 10px",
                background: "#1e3a8a",
                color: "white",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: 4,
                fontSize: 10,
                cursor: "pointer",
                fontWeight: 600,
                whiteSpace: "nowrap",
                transition: "all 0.2s"
              }}
              onMouseEnter={e => e.target.style.background = "#2d5aa8"}
              onMouseLeave={e => e.target.style.background = "#1e3a8a"}
            >
              ← 4 Sem
            </button>
            <button
              onClick={ganttControls.onNextWeek}
              style={{
                padding: "4px 10px",
                background: "#1e3a8a",
                color: "white",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: 4,
                fontSize: 10,
                cursor: "pointer",
                fontWeight: 600,
                whiteSpace: "nowrap",
                transition: "all 0.2s"
              }}
              onMouseEnter={e => e.target.style.background = "#2d5aa8"}
              onMouseLeave={e => e.target.style.background = "#1e3a8a"}
            >
              4 Sem →
            </button>
            <button
              onClick={ganttControls.onToday}
              style={{
                padding: "4px 10px",
                background: "#10b981",
                color: "white",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: 4,
                fontSize: 10,
                cursor: "pointer",
                fontWeight: 600,
                whiteSpace: "nowrap",
                transition: "all 0.2s"
              }}
              onMouseEnter={e => e.target.style.background = "#059669"}
              onMouseLeave={e => e.target.style.background = "#10b981"}
            >
              Auj.
            </button>
          </div>

          {/* TEXTE SEMAINE */}
          {ganttControls.weekText && (
            <div style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.9)",
              flexShrink: 0,
              whiteSpace: "nowrap"
            }}>
              {ganttControls.weekText}
            </div>
          )}
        </>
      )}

      {/* BOUTON OUVRIERS + VERSION À DROITE */}
      <div style={{ 
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        marginLeft: "auto",
        flexShrink: 0
      }}>
        {/* BOUTON OUVRIERS */}
        <button
          onClick={() => setCurrentPage(ouvrierButton.id)}
          style={{
            padding: "4px 12px",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: currentPage === ouvrierButton.id ? 600 : 400,
            border: "none",
            background: currentPage === ouvrierButton.id ? "rgba(255,255,255,0.2)" : "transparent",
            color: "white",
            borderRadius: "4px",
            transition: "all 0.2s",
            borderBottom: currentPage === ouvrierButton.id ? "2px solid #f59e0b" : "2px solid transparent",
            flexShrink: 0
          }}
        >
          {ouvrierButton.label}
        </button>

        {/* SÉPARATEUR */}
        <div style={{
          width: "1px",
          height: "24px",
          background: "rgba(255,255,255,0.3)",
          flexShrink: 0
        }} />

        {/* VERSION */}
        <div style={{ 
          fontSize: 10, 
          opacity: 0.7,
          flexShrink: 0,
          fontWeight: 600,
          letterSpacing: "0.5px"
        }}>
          v{VERSION}
        </div>
      </div>
    </div>
  );
};
