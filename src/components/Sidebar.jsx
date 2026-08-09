import React, { useContext } from "react";
import { VERSION } from "../version.js";
import { AppContext } from "../context/AppContext";

export const Sidebar = ({ 
  currentPage, 
  setCurrentPage,
  ganttControls 
}) => {

  const { loadData, lastUpdated, loading, error } = useContext(AppContext);

  const pages = [
    { id: "gantt", label: "📅 Vue Gantt" }
  ];

  const sideButtons = [
    { id: "chantiers", label: "🏗️ Chantiers" },
    { id: "ouvriers", label: "👷 Ouvriers" }
  ];

  const handleReload = async () => {
    await loadData(true);
  };

  const lastUpdatedText = lastUpdated
    ? lastUpdated.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      })
    : "--:--:--";

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
          <div style={{
            width: "1px",
            height: "24px",
            background: "rgba(255,255,255,0.2)",
            flexShrink: 0
          }} />

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
            >
              Auj.
            </button>
          </div>

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

          {/* ÉTAT DE RAFRAÎCHISSEMENT */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            flexShrink: 0,
            marginLeft: "4px"
          }}>
            <span
              title={error ? `Erreur API : ${error}` : "Dernier chargement réussi des données"}
              style={{
                fontSize: 10,
                color: error ? "#fecaca" : "rgba(255,255,255,0.85)",
                fontWeight: 600
              }}
            >
              {error ? "⚠ API" : "MAJ"} {lastUpdatedText}
            </span>

            <button
              onClick={handleReload}
              disabled={loading}
              title="Recharger immédiatement les données du planning"
              style={{
                padding: "4px 8px",
                background: loading ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.18)",
                color: "white",
                border: "1px solid rgba(255,255,255,0.35)",
                borderRadius: 4,
                fontSize: 10,
                cursor: loading ? "default" : "pointer",
                fontWeight: 600,
                whiteSpace: "nowrap"
              }}
            >
              {loading ? "↻ ..." : "↻ Recharger"}
            </button>
          </div>
        </>
      )}

      {/* BOUTONS DROITE + VERSION */}
      <div style={{ 
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        marginLeft: "auto",
        flexShrink: 0
      }}>
        <div style={{ display: "flex", gap: "0.25rem", flexShrink: 0 }}>
          {sideButtons.map(btn => (
            <button
              key={btn.id}
              onClick={() => setCurrentPage(btn.id)}
              style={{
                padding: "4px 12px",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: currentPage === btn.id ? 600 : 400,
                border: "none",
                background: currentPage === btn.id ? "rgba(255,255,255,0.2)" : "transparent",
                color: "white",
                borderRadius: "4px",
                transition: "all 0.2s",
                borderBottom: currentPage === btn.id ? "2px solid #f59e0b" : "2px solid transparent",
                flexShrink: 0
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <div style={{
          width: "1px",
          height: "24px",
          background: "rgba(255,255,255,0.3)",
          flexShrink: 0
        }} />

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
