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
    <div
      data-modal-confirm="true"
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(15, 23, 42, 0.62)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 20000,
        padding: 16
      }}
      onClick={event => event.stopPropagation()}
    >
      <div style={{
        background: "white",
        borderRadius: 10,
        padding: "22px",
        maxWidth: "400px",
        width: "90%",
        boxShadow: "0 18px 55px rgba(0, 0, 0, 0.35)",
        border: isDangerous ? "2px solid #fecaca" : "1px solid #e5e7eb",
        animation: "slideIn 0.2s ease-out"
      }}>
        <div style={{
          fontSize: 18,
          fontWeight: 800,
          color: isDangerous ? "#991b1b" : "#1f2937",
          marginBottom: 12
        }}>
          {title}
        </div>

        <div style={{
          fontSize: 14,
          color: "#4b5563",
          marginBottom: 24,
          lineHeight: 1.5
        }}>
          {message}
        </div>

        <div style={{
          display: "flex",
          gap: 12,
          justifyContent: "flex-end"
        }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            style={{
              padding: "10px 20px",
              background: isLoading ? "#d1d5db" : "#e5e7eb",
              color: "#374151",
              border: "none",
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 700,
              cursor: isLoading ? "not-allowed" : "pointer",
              opacity: isLoading ? 0.6 : 1
            }}
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              padding: "10px 20px",
              background: isLoading ? "#9ca3af" : (isDangerous ? "#dc2626" : "#1e3a8a"),
              color: "white",
              border: "none",
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 800,
              cursor: isLoading ? "not-allowed" : "pointer",
              opacity: isLoading ? 0.6 : 1
            }}
          >
            {isLoading ? "Suppression..." : confirmText}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
