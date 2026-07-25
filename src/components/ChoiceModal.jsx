import React from "react";

export const ChoiceModal = ({ 
  isOpen, 
  title = "Affectation", 
  onModify, 
  onDelete,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999
    }}>
      <div style={{
        background: "white",
        borderRadius: 8,
        padding: "24px",
        maxWidth: "400px",
        width: "90%",
        boxShadow: "0 10px 40px rgba(0, 0, 0, 0.3)",
        animation: "slideIn 0.3s ease-out"
      }}>
        {/* TITRE */}
        <div style={{
          fontSize: 18,
          fontWeight: 600,
          color: "#1f2937",
          marginBottom: 24
        }}>
          {title}
        </div>

        {/* BOUTONS */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: 12
        }}>
          <button
            onClick={onModify}
            style={{
              padding: "12px 20px",
              background: "#1e3a8a",
              color: "white",
              border: "none",
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s"
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#1e40af"}
            onMouseLeave={e => e.currentTarget.style.background = "#1e3a8a"}
          >
            ✏️ Modifier
          </button>

          <button
            onClick={onDelete}
            style={{
              padding: "12px 20px",
              background: "#dc2626",
              color: "white",
              border: "none",
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s"
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#b91c1c"}
            onMouseLeave={e => e.currentTarget.style.background = "#dc2626"}
          >
            🗑️ Supprimer
          </button>

          <button
            onClick={onCancel}
            style={{
              padding: "12px 20px",
              background: "#e5e7eb",
              color: "#374151",
              border: "none",
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s"
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#d1d5db"}
            onMouseLeave={e => e.currentTarget.style.background = "#e5e7eb"}
          >
            Annuler
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};
