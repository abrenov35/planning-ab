import React, { useEffect, useRef } from "react";

export const Modal = ({ isOpen, title, children, onClose }) => {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleDocumentKeyDown = event => {
      if (event.key !== "Enter" || event.repeat || event.isComposing) return;
      if (event.altKey || event.ctrlKey || event.metaKey) return;

      const target = event.target;
      const tag = target?.tagName?.toLowerCase();
      if (event.shiftKey && tag === "textarea") return;
      if (event.shiftKey) return;

      const panel = panelRef.current;
      if (!panel) return;

      // Ne jamais enregistrer derrière une confirmation secondaire ouverte.
      if (panel.querySelector('[data-modal-confirm="true"]')) return;

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

    document.addEventListener("keydown", handleDocumentKeyDown, true);
    return () => document.removeEventListener("keydown", handleDocumentKeyDown, true);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="ab-modal-overlay"
      style={{
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
      }}
    >
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
        onClick={event => event.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "0.75rem"
          }}
        >
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1f2937" }}>
            {title}
          </h2>
          <button
            type="button"
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
    </div>
  );
};
