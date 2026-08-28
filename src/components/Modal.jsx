import React, { useRef, useState } from "react";

export const Modal = ({ isOpen, title, children, onClose }) => {
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState(null);
  const bypassDeleteConfirmRef = useRef(false);

  if (!isOpen) return null;

  const handlePanelClickCapture = event => {
    if (title !== "Modifier l'affectation") return;
    const button = event.target?.closest?.("button");
    if (!button) return;

    if (bypassDeleteConfirmRef.current) {
      bypassDeleteConfirmRef.current = false;
      return;
    }

    if (String(button.textContent || "").trim() !== "Supprimer") return;

    event.preventDefault();
    event.stopPropagation();
    setDeleteConfirmTarget(button);
  };

  const confirmAffectationDeletion = () => {
    const target = deleteConfirmTarget;
    if (!target) return;

    setDeleteConfirmTarget(null);

    // Le premier clic arme la suppression dans GanttPage.
    // Le second clic, après la mise à jour React, exécute réellement la suppression.
    bypassDeleteConfirmRef.current = true;
    target.click();
    window.setTimeout(() => target.click(), 0);
  };

  return (
    <div className="ab-modal-overlay" style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0,0,0,0.45)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 100,
      padding: 8
    }} onClick={onClose}>
      <style>{`
        @media (max-width: 1100px) and (pointer: coarse) {
          .ab-modal-overlay {
            padding: 0 !important;
            align-items: stretch !important;
          }
          .ab-modal-panel {
            width: 100% !important;
            max-width: none !important;
            height: 100dvh !important;
            max-height: 100dvh !important;
            border-radius: 0 !important;
            padding: calc(12px + env(safe-area-inset-top)) 14px calc(12px + env(safe-area-inset-bottom)) !important;
          }
        }
      `}</style>
      <div
        className="ab-modal-panel"
        style={{
          background: "white",
          borderRadius: 10,
          padding: "1rem 1.15rem",
          width: "90%",
          maxWidth: 450,
          maxHeight: "calc(100dvh - 16px)",
          overflowY: "auto",
          boxSizing: "border-box",
          boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
          WebkitOverflowScrolling: "touch"
        }}
        onClick={e => e.stopPropagation()}
        onClickCapture={handlePanelClickCapture}
      >
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.75rem"
        }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1f2937" }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 20,
              cursor: "pointer",
              color: "#9ca3af",
              padding: 0,
              width: 28,
              height: 28
            }}
          >
            ×
          </button>
        </div>

        {children}
      </div>

      {deleteConfirmTarget && (
        <div
          onClick={event => event.stopPropagation()}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            background: "rgba(15,23,42,.52)",
            backdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20
          }}
        >
          <div style={{
            width: "min(420px, 92vw)",
            background: "white",
            borderRadius: 14,
            boxShadow: "0 24px 70px rgba(15,23,42,.30)",
            padding: 20
          }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#991b1b" }}>
              Confirmer la suppression
            </div>
            <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.5, color: "#4b5563" }}>
              Voulez-vous vraiment supprimer cette affectation ? Cette action est définitive.
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
              <button
                type="button"
                onClick={() => setDeleteConfirmTarget(null)}
                style={{
                  padding: "10px 16px",
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                  background: "white",
                  color: "#374151",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmAffectationDeletion}
                style={{
                  padding: "10px 16px",
                  borderRadius: 8,
                  border: 0,
                  background: "#dc2626",
                  color: "white",
                  fontWeight: 800,
                  cursor: "pointer"
                }}
              >
                Confirmer la suppression
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
