import React, { useContext, useState } from "react";
import { AppContext } from "../context/AppContext";
import { Modal } from "../components/Modal";
import { FormChantier } from "../components/FormChantier";

export const ChantierPage = () => {
  const { chantiers, addChantier, updateChantier, loading } = useContext(AppContext);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingChantier, setEditingChantier] = useState(null);

  const handleAddChantier = async (formData) => {
    const result = await addChantier(
      formData.nom,
      formData.dateDebut,
      formData.dateFin,
      formData.description
    );
    if (result.success) {
      setShowAddModal(false);
    } else {
      alert("Erreur: " + (result.error || "Impossible d'ajouter le chantier"));
    }
  };

  const handleUpdateChantier = async (formData) => {
    const result = await updateChantier(
      editingChantier.id,
      formData.nom,
      formData.dateDebut,
      formData.dateFin,
      formData.description,
      formData.statut
    );
    if (result.success) {
      setEditingChantier(null);
    } else {
      alert("Erreur: " + (result.error || "Impossible de modifier le chantier"));
    }
  };

  if (loading) return <div style={{ padding: "2rem" }}>Chargement...</div>;

  const actifs = chantiers.filter(c => c.statut === "Actif");
  const archived = chantiers.filter(c => c.statut === "Archivé");

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
            fontWeight: 600
          }}
        >
          + Nouveau chantier
        </button>
      </div>

      {/* TABLE ACTIFS */}
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
          CHANTIERS ACTIFS
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
              <th style={{ padding: 12, textAlign: "left", fontWeight: 600, color: "#1f2937" }}>Nom</th>
              <th style={{ padding: 12, textAlign: "left", fontWeight: 600, color: "#1f2937" }}>Dates</th>
              <th style={{ padding: 12, textAlign: "left", fontWeight: 600, color: "#1f2937" }}>Avanc.</th>
              <th style={{ padding: 12, textAlign: "left", fontWeight: 600, color: "#1f2937" }}>Équipe</th>
              <th style={{ padding: 12, width: 80, fontWeight: 600, color: "#1f2937" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {actifs.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: 12, textAlign: "center", color: "#9ca3af" }}>
                  Aucun chantier actif
                </td>
              </tr>
            ) : (
              actifs.map(chantier => (
                <tr key={chantier.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: 12, color: "#374151", fontWeight: 500 }}>
                    {chantier.nom}
                  </td>
                  <td style={{ padding: 12, color: "#374151", fontSize: 12 }}>
                    {chantier.dateDebut} → {chantier.dateFin}
                  </td>
                  <td style={{ padding: 12, color: "#10b981", fontWeight: 600 }}>50%</td>
                  <td style={{ padding: 12, color: "#374151", fontSize: 12 }}>Kevin, Jimmy...</td>
                  <td style={{ padding: 12, textAlign: "center" }}>
                    <button
                      onClick={() => setEditingChantier(chantier)}
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
            CHANTIERS ARCHIVÉS
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                <th style={{ padding: 12, textAlign: "left", fontWeight: 600, color: "#1f2937" }}>Nom</th>
                <th style={{ padding: 12, textAlign: "left", fontWeight: 600, color: "#1f2937" }}>Durée</th>
                <th style={{ padding: 12, textAlign: "left", fontWeight: 600, color: "#1f2937" }}>Statut</th>
                <th style={{ padding: 12, width: 80, fontWeight: 600, color: "#1f2937" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {archived.map(chantier => (
                <tr key={chantier.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: 12, color: "#374151", fontWeight: 500 }}>
                    {chantier.nom}
                  </td>
                  <td style={{ padding: 12, color: "#374151", fontSize: 12 }}>
                    {chantier.dateDebut} → {chantier.dateFin}
                  </td>
                  <td style={{ padding: 12 }}>
                    <span style={{
                      display: "inline-block",
                      padding: "4px 8px",
                      background: "#f3f4f6",
                      color: "#6b7280",
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600
                    }}>
                      Archivé
                    </span>
                  </td>
                  <td style={{ padding: 12, textAlign: "center" }}>
                    <button
                      onClick={() => setEditingChantier(chantier)}
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
        title="Nouveau chantier"
        onClose={() => setShowAddModal(false)}
      >
        <FormChantier
          onSubmit={handleAddChantier}
          onCancel={() => setShowAddModal(false)}
          mode="add"
        />
      </Modal>

      <Modal
        isOpen={!!editingChantier}
        title="Modifier le chantier"
        onClose={() => setEditingChantier(null)}
      >
        {editingChantier && (
          <FormChantier
            chantier={editingChantier}
            onSubmit={handleUpdateChantier}
            onCancel={() => setEditingChantier(null)}
            mode="edit"
          />
        )}
      </Modal>
    </div>
  );
};
