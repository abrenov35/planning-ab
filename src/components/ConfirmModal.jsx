import React from "react";

export const ConfirmModal = ({ 
  isOpen, 
  title = "Confirmation", 
  message = "Êtes-vous sûr ?", 
  onConfirm, 
  onCancel,
  confirmText = "Supprimer",
  cancelText = "Annuler",
  isDangerous = false,
  isLoading = false
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
          marginBottom: 12
        }}>
          {title}
        </div>

        {/* MESSAGE */}
        <div style={{
          fontSize: 14,
          color: "#6b7280",
          marginBottom: 24,
          lineHeight: 1.5
        }}>
          {message}
        </div>

        {/* BOUTONS */}
        <div style={{
          display: "flex",
          gap: 12,
          justifyContent: "flex-end"
        }}>
          <button
            onClick={onCancel}
            disabled={isLoading}
            style={{
              padding: "10px 20px",
              background: isLoading ? "#d1d5db" : "#e5e7eb",
              color: "#374151",
              border: "none",
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              cursor: isLoading ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              opacity: isLoading ? 0.6 : 1
            }}
            onMouseEnter={e => !isLoading && (e.currentTarget.style.background = "#d1d5db")}
            onMouseLeave={e => !isLoading && (e.currentTarget.style.background = "#e5e7eb")}
          >
            {cancelText}
          </button>

          <button
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              padding: "10px 20px",
              background: isLoading 
                ? "#9ca3af" 
                : (isDangerous ? "#dc2626" : "#1e3a8a"),
              color: "white",
              border: "none",
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              cursor: isLoading ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              opacity: isLoading ? 0.6 : 1
            }}
            onMouseEnter={e => !isLoading && (e.currentTarget.style.background = isDangerous ? "#b91c1c" : "#1e40af")}
            onMouseLeave={e => !isLoading && (e.currentTarget.style.background = isDangerous ? "#dc2626" : "#1e3a8a")}
          >
            {isLoading ? "Suppression..." : confirmText}
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
