import React, { useContext } from "react";
import { AppContext } from "../context/AppContext";

export const GanttPage = () => {
  const { ouvriers, chantiers, loading } = useContext(AppContext);

  const ouvrierActifs = ouvriers.filter(o => o.statut === "Actif");
  const chantiersActifs = chantiers.filter(c => c.statut === "Actif");

  if (loading) return <div style={{ padding: "2rem" }}>Chargement...</div>;

  return (
    <div style={{ padding: "1rem", flex: 1, overflowY: "auto" }}>
      {/* SECTION OUVRIERS */}
      <div style={{
        background: "white",
        borderRadius: 6,
        border: "1px solid #e5e7eb",
        marginBottom: "0.75rem",
        overflow: "hidden"
      }}>
        <div style={{
          background: "#1e3a8a",
          color: "white",
          padding: "0.5rem 0.75rem",
          fontWeight: 600,
          fontSize: 12
        }}>
          OUVRIERS ACTIFS ({ouvrierActifs.length})
        </div>

        <div style={{ padding: "0.5rem 0.75rem" }}>
          {ouvrierActifs.length === 0 ? (
            <div style={{ color: "#9ca3af", fontSize: 12 }}>Aucun ouvrier</div>
          ) : (
            ouvrierActifs.map(ouvrier => (
              <div
                key={ouvrier.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 0",
                  borderBottom: "1px solid #f3f4f6",
                  fontSize: 12
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "#3b82f6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: 600,
                    fontSize: 10,
                    flexShrink: 0
                  }}
                >
                  {ouvrier.nom.substring(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, color: "#1f2937" }}>
                    {ouvrier.nom}
                  </div>
                  <div style={{ fontSize: 10, color: "#9ca3af" }}>
                    {ouvrier.metier}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* SECTION CHANTIERS */}
      <div style={{
        background: "white",
        borderRadius: 6,
        border: "1px solid #e5e7eb",
        overflow: "hidden"
      }}>
        <div style={{
          background: "#1e3a8a",
          color: "white",
          padding: "0.5rem 0.75rem",
          fontWeight: 600,
          fontSize: 12
        }}>
          CHANTIERS ACTIFS ({chantiersActifs.length})
        </div>

        <div style={{ padding: "0.5rem 0.75rem" }}>
          {chantiersActifs.length === 0 ? (
            <div style={{ color: "#9ca3af", fontSize: 12 }}>Aucun chantier</div>
          ) : (
            chantiersActifs.map(chantier => (
              <div
                key={chantier.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "6px 0",
                  borderBottom: "1px solid #f3f4f6",
                  fontSize: 11
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: "#1f2937" }}>
                    {chantier.nom}
                  </div>
                  <div style={{ fontSize: 10, color: "#9ca3af" }}>
                    {chantier.dateDebut} → {chantier.dateFin}
                  </div>
                </div>
                <span style={{
                  display: "inline-block",
                  padding: "2px 6px",
                  background: "#dcfce7",
                  color: "#166534",
                  borderRadius: 3,
                  fontSize: 10,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  marginLeft: "8px"
                }}>
                  ✓
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
