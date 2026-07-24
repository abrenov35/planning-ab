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

  if (loading) return <div style={{ padding: "2rem" }}>Chargement...</div>;

  const cdi = ouvriers.filter(o => o.type === "CDI" && o.statut === "Actif");
  const st = ouvriers.filter(o => o.type === "ST" && o.statut === "Actif");
  const archived = ouvriers.filter(o => o.statut === "Archivé");

  return (
    <div style={{ padding: "1.5rem", flex: 1, overflowY: "auto" }}>
      <div style={{ marginBottom: "1rem" }}>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            padding: "8px 12px",
            background: "#1e3a8a",
            color: "white",
            border: "none",
            borderRadius: 6,
            fontSize: 12,
            cursor: "pointer",
            fontWeight: 600,
            marginRight: 8
          }}
        >
          + Ajouter ouvrier CDI
        </button>
        <button
          onClick={() => setShowAddModal(true)}
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
          + Ajouter sous-traitant
        </button>
      </div>

      {/* TABLE CDI */}
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
          ÉQUIPE CDI
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
              <th style={{ padding: 12, textAlign: "left", fontWeight: 600, color: "#1f2937" }}>Nom</th>
              <th style={{ padding: 12, textAlign: "left", fontWeight: 600, color: "#1f2937" }}>Métier</th>
              <th style={{ padding: 12, textAlign: "left", fontWeight: 600, color: "#1f2937" }}>Charge</th>
              <th style={{ padding: 12, textAlign: "left", fontWeight: 600, color: "#1f2937" }}>Statut</th>
              <th style={{ padding: 12, width: 80, fontWeight: 600, color: "#1f2937" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {cdi.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: 12, textAlign: "center", color: "#9ca3af" }}>
                  Aucun CDI actif
                </td>
              </tr>
            ) : (
              cdi.map(ouvrier => (
                <tr key={ouvrier.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: 12, color: "#374151", fontWeight: 500 }}>{ouvrier.nom}</td>
                  <td style={{ padding: 12, color: "#374151" }}>{ouvrier.metier}</td>
                  <td style={{ padding: 12, color: "#374151" }}>75%</td>
                  <td style={{ padding: 12 }}>
                    <span style={{
                      display: "inline-block",
                      padding: "4px 8px",
                      background: "#dbeafe",
                      color: "#0c447c",
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600
                    }}>
                      Actif
                    </span>
                  </td>
                  <td style={{ padding: 12, textAlign: "center" }}>
                    <button
                      onClick={() => setEditingOuvrier(ouvrier)}
                      style={{
                        padding: "4px 8px",
                        border: "1px solid #d1d5db",
                        background: "white",
                        borderRadius: 4,
                        fontSize: 11,
                        cursor: "pointer"
                      }}
                    >
                      Éditer
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
          SOUS-TRAITANTS
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
              <th style={{ padding: 12, textAlign: "left", fontWeight: 600, color: "#1f2937" }}>Nom</th>
              <th style={{ padding: 12, textAlign: "left", fontWeight: 600, color: "#1f2937" }}>Spécialité</th>
              <th style={{ padding: 12, textAlign: "left", fontWeight: 600, color: "#1f2937" }}>Tarif/J</th>
              <th style={{ padding: 12, textAlign: "left", fontWeight: 600, color: "#1f2937" }}>Statut</th>
              <th style={{ padding: 12, width: 80, fontWeight: 600, color: "#1f2937" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {st.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: 12, textAlign: "center", color: "#9ca3af" }}>
                  Aucun sous-traitant actif
                </td>
              </tr>
            ) : (
              st.map(ouvrier => (
                <tr key={ouvrier.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: 12, color: "#374151", fontWeight: 500 }}>{ouvrier.nom}</td>
                  <td style={{ padding: 12, color: "#374151" }}>{ouvrier.metier}</td>
                  <td style={{ padding: 12, color: "#374151" }}>200€</td>
                  <td style={{ padding: 12 }}>
                    <span style={{
                      display: "inline-block",
                      padding: "4px 8px",
                      background: "#fef3c7",
                      color: "#92400e",
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600
                    }}>
                      Actif
                    </span>
                  </td>
                  <td style={{ padding: 12, textAlign: "center" }}>
                    <button
                      onClick={() => setEditingOuvrier(ouvrier)}
                      style={{
                        padding: "4px 8px",
                        border: "1px solid #d1d5db",
                        background: "white",
                        borderRadius: 4,
                        fontSize: 11,
                        cursor: "pointer"
                      }}
                    >
                      Fiche
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
            OUVRIERS ARCHIVÉS
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                <th style={{ padding: 12, textAlign: "left", fontWeight: 600, color: "#1f2937" }}>Nom</th>
                <th style={{ padding: 12, textAlign: "left", fontWeight: 600, color: "#1f2937" }}>Type</th>
                <th style={{ padding: 12, textAlign: "left", fontWeight: 600, color: "#1f2937" }}>Métier</th>
                <th style={{ padding: 12, width: 80, fontWeight: 600, color: "#1f2937" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {archived.map(ouvrier => (
                <tr key={ouvrier.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: 12, color: "#374151", fontWeight: 500 }}>{ouvrier.nom}</td>
                  <td style={{ padding: 12, color: "#374151" }}>{ouvrier.type}</td>
                  <td style={{ padding: 12, color: "#374151" }}>{ouvrier.metier}</td>
                  <td style={{ padding: 12, textAlign: "center" }}>
                    <button
                      onClick={() => setEditingOuvrier(ouvrier)}
                      style={{
                        padding: "4px 8px",
                        border: "1px solid #d1d5db",
                        background: "white",
                        borderRadius: 4,
                        fontSize: 11,
                        cursor: "pointer"
                      }}
                    >
                      Réactiver
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
  );
};
