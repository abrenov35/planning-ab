import React, { useContext, useState } from "react";
import { AppContext } from "../context/AppContext";
import { Modal } from "../components/Modal";
import { FormOuvrier } from "../components/FormOuvrier";

export const GanttPage = () => {
  const { ouvriers, chantiers, addOuvrier, updateOuvrier, loading } = useContext(AppContext);
  const [showModalOuvrier, setShowModalOuvrier] = useState(false);

  const handleAddOuvrier = async (formData) => {
    const result = await addOuvrier(formData.nom, formData.type, formData.metier);
    if (result.success) {
      setShowModalOuvrier(false);
    } else {
      alert("Erreur: " + (result.error || "Impossible d'ajouter l'ouvrier"));
    }
  };

  const ouvrierActifs = ouvriers.filter(o => o.statut === "Actif");
  const chantiersActifs = chantiers.filter(c => c.statut === "Actif");

  if (loading) return <div style={{ padding: "2rem" }}>Chargement...</div>;

  return (
    <div style={{ padding: "1.5rem", flex: 1, overflowY: "auto" }}>
      <div style={{ marginBottom: "1rem" }}>
        <button style={{
          padding: "8px 12px",
          border: "1px solid #d1d5db",
          background: "white",
          borderRadius: 6,
          fontSize: 12,
          cursor: "pointer",
          marginRight: 8
        }}>
          ← Semaine précédente
        </button>
        <button style={{
          padding: "8px 12px",
          border: "1px solid #d1d5db",
          background: "white",
          borderRadius: 6,
          fontSize: 12,
          cursor: "pointer",
          marginRight: 8
        }}>
          Semaine suivante →
        </button>
        <button
          onClick={() => setShowModalOuvrier(true)}
          style={{
            padding: "8px 12px",
            background: "#1e3a8a",
            color: "white",
            border: "none",
            borderRadius: 6,
            fontSize: 12,
            cursor: "pointer",
            fontWeight: 600
          }}
        >
          + Ajouter ouvrier
        </button>
      </div>

      {/* SECTION OUVRIERS */}
      <div style={{
        background: "white",
        borderRadius: 8,
        border: "1px solid #e5e7eb",
        marginBottom: "1.5rem",
        overflow: "hidden"
      }}>
        <div style={{
          background: "#1e3a8a",
          color: "white",
          padding: "1rem",
          fontWeight: 600,
          fontSize: 13
        }}>
          OUVRIERS & ÉQUIPES (CDI)
        </div>

        <div style={{ padding: "1rem" }}>
          {ouvrierActifs.length === 0 ? (
            <div style={{ color: "#9ca3af", fontSize: 13 }}>Aucun ouvrier actif</div>
          ) : (
            ouvrierActifs.map(ouvrier => (
              <div
                key={ouvrier.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 0",
                  borderBottom: "1px solid #e5e7eb"
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "#3b82f6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: 600,
                    fontSize: 11,
                    flexShrink: 0
                  }}
                >
                  {ouvrier.nom.substring(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, color: "#1f2937", fontSize: 13 }}>
                    {ouvrier.nom}
                  </div>
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>
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
        borderRadius: 8,
        border: "1px solid #e5e7eb",
        overflow: "hidden"
      }}>
        <div style={{
          background: "#1e3a8a",
          color: "white",
          padding: "1rem",
          fontWeight: 600,
          fontSize: 13
        }}>
          CHANTIERS ACTIFS
        </div>

        <div style={{ padding: "1rem" }}>
          {chantiersActifs.length === 0 ? (
            <div style={{ color: "#9ca3af", fontSize: 13 }}>Aucun chantier actif</div>
          ) : (
            chantiersActifs.map(chantier => (
              <div
                key={chantier.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 0",
                  borderBottom: "1px solid #e5e7eb"
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: "#1f2937", fontSize: 13 }}>
                    {chantier.nom}
                  </div>
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>
                    {chantier.dateDebut} → {chantier.dateFin}
                  </div>
                </div>
                <span style={{
                  display: "inline-block",
                  padding: "4px 8px",
                  background: "#dcfce7",
                  color: "#166534",
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 600
                }}>
                  ACTIF
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODAL AJOUTER OUVRIER */}
      <Modal
        isOpen={showModalOuvrier}
        title="Ajouter un ouvrier"
        onClose={() => setShowModalOuvrier(false)}
      >
        <FormOuvrier
          onSubmit={handleAddOuvrier}
          onCancel={() => setShowModalOuvrier(false)}
          mode="add"
        />
      </Modal>
    </div>
  );
};
