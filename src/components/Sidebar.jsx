import React from "react";
import { VERSION } from "../version.js";

export const Sidebar = ({ currentPage, setCurrentPage }) => {

  const pages = [
    { id: "gantt", label: "📅 Vue Gantt" },
    { id: "ouvriers", label: "👷 Ouvriers" },
    { id: "chantiers", label: "🏗️ Chantiers" }
  ];

  return (
    <div style={{
      background: "#1e3a8a",
      color: "white",
      display: "flex",
      alignItems: "center",
      padding: "0.75rem 1.5rem",
      borderBottom: "1px solid rgba(255,255,255,0.1)",
      gap: "0.5rem",
      whiteSpace: "nowrap"
    }}>
      <div style={{ fontSize: 14, fontWeight: 700, marginRight: "2rem", flexShrink: 0 }}>
        AB PLANNING
      </div>

      <div style={{ display: "flex", gap: "0.5rem", flex: 1, minWidth: 0 }}>
        {pages.map(page => (
          <button
            key={page.id}
            onClick={() => setCurrentPage(page.id)}
            style={{
              padding: "6px 16px",
              cursor: "pointer",
              fontSize: 13,
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

      <div style={{ 
        fontSize: 11, 
        opacity: 0.7,
        marginLeft: "1rem",
        paddingLeft: "1rem",
        paddingRight: "0.5rem",
        borderLeft: "1px solid rgba(255,255,255,0.3)",
        flexShrink: 0,
        fontWeight: 600,
        letterSpacing: "0.5px"
      }}>
        v{VERSION}
      </div>
    </div>
  );
};
