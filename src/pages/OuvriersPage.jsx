import React, { useContext, useState } from "react";
import { AppContext } from "../context/AppContext";
import { Modal } from "../components/Modal";
import { FormOuvrier } from "../components/FormOuvrier";

export const OuvriersPage = () => {
  const { ouvriers, addOuvrier, updateOuvrier, loading } = useContext(AppContext);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingOuvrier, setEditingOuvrier] = useState(null);

  const handleAddOuvrier = async (formData) => {
    const result = await addOuvrier(formData.nom, formData.type, formData.metier);
    if (result.success) {
      setShowAddModal(false);
    } else {
      alert("Erreur: " + (result.error || "Impossible d'ajouter l'ouvrier"));
    }
  };

  const handleUpdateOuvrier = async (formData) => {
    const result = await updateOuvrier(
      editingOuvrier.id,
      formData.nom,
      formData.type,
      formData.metier,
      formData.statut
    );
    if (result.success) {
      setEditingOuvrier(null);
    } else {
      alert("Erreur: " + (result.error || "Impossible de modifier l'ouvrier"));
    }
  };

  if (loading) return <div style={{ padding: "1rem" }}>Chargement...</div>;

  const cdi = ouvriers.filter(o => o.type === "CDI" && o.statut === "Actif");
  const st = ouvriers.filter(o => o.type === "ST" && o.statut === "Actif");
  const archived = ouvriers.filter(o => o.statut === "Archivé");

  return (
    <div style={{ 
      padding: "1rem", 
      flex: 1, 
      overflowY: "auto",
      display: "flex",
      justifyContent: "center",
      background: "#f3f4f6"
    }}>
      <div style={{ maxWidth: "900px", width: "100%" }}>
      {/* TABLE CDI */}
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
          padding: "0.75rem 1rem",
          fontWeight: 600,
          fontSize: 13,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <span>👷 CDI ({cdi.length})</span>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              padding: "6px 12px",
              background: "#10b981",
              color: "white",
              border: "none",
              borderRadius: 3,
              fontSize: 11,
              cursor: "pointer",
              fontWeight: 600
            }}
          >
            + Ouvrier
          </button>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
              <th style={{ padding: "8px", textAlign: "left", fontWeight: 600, color: "#1f2937" }}>Nom</th>
              <th style={{ padding: "8px", textAlign: "left", fontWeight: 600, color: "#1f2937" }}>Métier</th>
              <th style={{ padding: "8px", width: 60, fontWeight: 600, color: "#1f2937" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {cdi.length === 0 ? (
              <tr>
                <td colSpan="3" style={{ padding: 8, textAlign: "center", color: "#9ca3af" }}>
                  Aucun CDI
                </td>
              </tr>
            ) : (
              cdi.map(ouvrier => (
                <tr key={ouvrier.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: 8, color: "#374151", fontWeight: 500 }}>{ouvrier.nom}</td>
                  <td style={{ padding: 8, color: "#374151", fontSize: 11 }}>{ouvrier.metier}</td>
                  <td style={{ padding: 8, textAlign: "center" }}>
                    <button
                      onClick={() => setEditingOuvrier(ouvrier)}
                      style={{
                        padding: "2px 6px",
                        border: "1px solid #d1d5db",
                        background: "white",
                        borderRadius: 3,
                        fontSize: 10,
                        cursor: "pointer"
                      }}
                    >
                      ✏️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* TABLE SOUS-TRAITANTS */}
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
          padding: "0.75rem 1rem",
          fontWeight: 600,
          fontSize: 13,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <span>🤝 Sous-traitants ({st.length})</span>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              padding: "6px 12px",
              background: "#10b981",
              color: "white",
              border: "none",
              borderRadius: 3,
              fontSize: 11,
              cursor: "pointer",
              fontWeight: 600
            }}
          >
            + ST
          </button>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
              <th style={{ padding: "8px", textAlign: "left", fontWeight: 600, color: "#1f2937" }}>Nom</th>
              <th style={{ padding: "8px", textAlign: "left", fontWeight: 600, color: "#1f2937" }}>Spécialité</th>
              <th style={{ padding: "8px", width: 60, fontWeight: 600, color: "#1f2937" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {st.length === 0 ? (
              <tr>
                <td colSpan="3" style={{ padding: 8, textAlign: "center", color: "#9ca3af" }}>
                  Aucun ST
                </td>
              </tr>
            ) : (
              st.map(ouvrier => (
                <tr key={ouvrier.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: 8, color: "#374151", fontWeight: 500 }}>{ouvrier.nom}</td>
                  <td style={{ padding: 8, color: "#374151", fontSize: 11 }}>{ouvrier.metier}</td>
                  <td style={{ padding: 8, textAlign: "center" }}>
                    <button
                      onClick={() => setEditingOuvrier(ouvrier)}
                      style={{
                        padding: "2px 6px",
                        border: "1px solid #d1d5db",
                        background: "white",
                        borderRadius: 3,
                        fontSize: 10,
                        cursor: "pointer"
                      }}
                    >
                      ✏️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* TABLE ARCHIVÉS */}
      {archived.length > 0 && (
        <div style={{
          background: "white",
          borderRadius: 6,
          border: "1px solid #e5e7eb",
          overflow: "hidden"
        }}>
          <div style={{
            background: "#6b7280",
            color: "white",
            padding: "0.75rem 1rem",
            fontWeight: 600,
            fontSize: 13
          }}>
            📦 Archivés ({archived.length})
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 600, color: "#1f2937" }}>Nom</th>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 600, color: "#1f2937" }}>Métier</th>
                <th style={{ padding: "8px", width: 60, fontWeight: 600, color: "#1f2937" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {archived.map(ouvrier => (
                <tr key={ouvrier.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: 8, color: "#374151", fontWeight: 500 }}>{ouvrier.nom}</td>
                  <td style={{ padding: 8, color: "#374151", fontSize: 11 }}>{ouvrier.metier}</td>
                  <td style={{ padding: 8, textAlign: "center" }}>
                    <button
                      onClick={() => setEditingOuvrier(ouvrier)}
                      style={{
                        padding: "2px 6px",
                        border: "1px solid #d1d5db",
                        background: "white",
                        borderRadius: 3,
                        fontSize: 10,
                        cursor: "pointer"
                      }}
                    >
                      ↻
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODALS */}
      <Modal
        isOpen={showAddModal}
        title="Ajouter un ouvrier"
        onClose={() => setShowAddModal(false)}
      >
        <FormOuvrier
          onSubmit={handleAddOuvrier}
          onCancel={() => setShowAddModal(false)}
          mode="add"
        />
      </Modal>

      <Modal
        isOpen={!!editingOuvrier}
        title="Modifier l'ouvrier"
        onClose={() => setEditingOuvrier(null)}
      >
        {editingOuvrier && (
          <FormOuvrier
            ouvrier={editingOuvrier}
            onSubmit={handleUpdateOuvrier}
            onCancel={() => setEditingOuvrier(null)}
            mode="edit"
          />
        )}
      </Modal>
      </div>
    </div>
  );
};
