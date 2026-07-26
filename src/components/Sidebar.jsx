import React from "react";

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
      gap: "0.5rem"
    }}>
      <div style={{ fontSize: 14, fontWeight: 700, marginRight: "2rem" }}>
        AB PLANNING
      </div>

      <div style={{ display: "flex", gap: "0.5rem", flex: 1 }}>
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
              borderBottom: currentPage === page.id ? "2px solid #f59e0b" : "2px solid transparent"
            }}
          >
            {page.label}
          </button>
        ))}
      </div>

      <span style={{ 
        fontSize: 11, 
        opacity: 0.6,
        marginLeft: "auto",
        paddingRight: "1rem"
      }}>
        v2
      </span>
    </div>
  );
};
