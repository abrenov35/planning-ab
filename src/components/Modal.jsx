import React, { useEffect, useRef, useState } from "react";

export const Modal = ({ isOpen, title, children, onClose }) => {
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const bypassDeleteConfirmRef = useRef(false);
  const panelRef = useRef(null);

  const validateModal = event => {
    if (!isOpen || deleteConfirmTarget) return;
    if (event.key !== "Enter" || event.repeat || event.isComposing) return;
    if (event.altKey || event.ctrlKey || event.metaKey) return;

    const target = event.target;
    const tag = target?.tagName?.toLowerCase();
    if (event.shiftKey && tag === "textarea") return;
    if (event.shiftKey) return;

    const panel = panelRef.current;
    if (!panel) return;
    if (panel.querySelector('div[style*="position: fixed"]')) return;

    const form = panel.querySelector("form");
    if (form) {
      event.preventDefault();
      event.stopPropagation();
      if (typeof form.requestSubmit === "function") form.requestSubmit();
      else {
        const submit = form.querySelector('button[type="submit"],input[type="submit"]');
        if (submit && !submit.disabled) submit.click();
      }
      return;
    }

    const primaryButton = Array.from(panel.querySelectorAll("button")).find(button => {
      if (button.disabled) return false;
      const texte = String(button.textContent || "").trim();
      return texte === "Enregistrer" || texte === "Ajouter" || texte === "Créer";
    });

    if (!primaryButton) return;
    event.preventDefault();
    event.stopPropagation();
    primaryButton.click();
  };

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleDocumentKeyDown = event => validateModal(event);
    document.addEventListener("keydown", handleDocumentKeyDown, true);
    return () => document.removeEventListener("keydown", handleDocumentKeyDown, true);
  }, [isOpen, deleteConfirmTarget]);

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
    setConfirmingDelete(false);
    setDeleteConfirmTarget(button);
  };

  const findInternalDeleteConfirm = panel =>
    panel
      ? Array.from(panel.querySelectorAll("button")).find(
          button => String(button.textContent || "").trim() === "Confirmer suppression"
        )
      : null;

  const confirmAffectationDeletion = () => {
    const target = deleteConfirmTarget;
    if (!target || confirmingDelete) return;

    setConfirmingDelete(true);
    bypassDeleteConfirmRef.current = true;
    target.click();

    let attempt = 0;
    const maxAttempts = 100;

    const triggerInternalDelete = () => {
      const panel = panelRef.current;
      if (!panel) return;

      const confirmButton = findInternalDeleteConfirm(panel);
      if (confirmButton && !confirmButton.disabled) {
        confirmButton.click();
        return;
      }

      attempt += 1;
      if (attempt < maxAttempts) {
        window.setTimeout(triggerInternalDelete, 20);
        return;
      }

      setConfirmingDelete(false);
      alert("La suppression n'a pas pu démarrer. Réessayez.");
    };

    window.setTimeout(triggerInternalDelete, 0);
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
    }}>
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
        ref={panelRef}
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
                disabled={confirmingDelete}
                style={{
                  padding: "10px 16px",
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                  background: "white",
                  color: "#374151",
                  fontWeight: 700,
                  cursor: confirmingDelete ? "not-allowed" : "pointer",
                  opacity: confirmingDelete ? 0.6 : 1
                }}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmAffectationDeletion}
                disabled={confirmingDelete}
                style={{
                  padding: "10px 16px",
                  borderRadius: 8,
                  border: 0,
                  background: "#dc2626",
                  color: "white",
                  fontWeight: 800,
                  cursor: confirmingDelete ? "not-allowed" : "pointer",
                  opacity: confirmingDelete ? 0.75 : 1
                }}
              >
                {confirmingDelete ? "Suppression..." : "Confirmer la suppression"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
