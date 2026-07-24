import React from "react";

export const Sidebar = ({ currentPage, setCurrentPage }) => {
  const pages = [
    { id: "gantt", label: "📅 Vue Gantt", title: "Vue Gantt Unifiée" },
    { id: "ouvriers", label: "👷 Ouvriers & Équipes", title: "Ouvriers & Équipes" },
    { id: "chantiers", label: "🏗️ Chantiers", title: "Gestion des Chantiers" }
  ];

  return (
    <div style={{
      width: 200,
      background: "#1e3a8a",
      color: "white",
      display: "flex",
      flexDirection: "column",
      height: "100vh"
    }}>
      <div style={{ padding: "1.5rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>AB PLANNING</div>
        <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>Gestion des chantiers</div>
      </div>

      <div style={{ padding: "1rem 0", flex: 1 }}>
        {pages.map(page => (
          <div
            key={page.id}
            onClick={() => setCurrentPage(page.id)}
            style={{
              padding: "12px 1.25rem",
              cursor: "pointer",
              fontSize: 13,
              transition: "all 0.2s",
              borderLeft: currentPage === page.id ? "3px solid #f59e0b" : "3px solid transparent",
              background: currentPage === page.id ? "rgba(255,255,255,0.15)" : "transparent",
              fontWeight: currentPage === page.id ? 600 : 400
            }}
          >
            {page.label}
          </div>
        ))}
      </div>
    </div>
  );
};
