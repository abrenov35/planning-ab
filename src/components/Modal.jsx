import React, { useEffect, useState } from "react";

export const Modal = ({ isOpen, title, children, onClose }) => {
  const [visualViewport, setVisualViewport] = useState(null);

  useEffect(() => {
    if (!isOpen || typeof window === "undefined") return undefined;
    const viewport = window.visualViewport;
    const updateViewport = () => {
      setVisualViewport({
        height: Math.round(viewport?.height || window.innerHeight),
        offsetTop: Math.round(viewport?.offsetTop || 0)
      });
    };
    const keepFocusedFieldVisible = event => {
      if (!event.target?.matches?.("input, textarea, select")) return;
      window.setTimeout(() => event.target.scrollIntoView({ block:"center", behavior:"smooth" }), 120);
    };

    updateViewport();
    viewport?.addEventListener("resize", updateViewport);
    viewport?.addEventListener("scroll", updateViewport);
    window.addEventListener("resize", updateViewport);
    document.addEventListener("focusin", keepFocusedFieldVisible);
    return () => {
      viewport?.removeEventListener("resize", updateViewport);
      viewport?.removeEventListener("scroll", updateViewport);
      window.removeEventListener("resize", updateViewport);
      document.removeEventListener("focusin", keepFocusedFieldVisible);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="ab-modal-overlay" style={{
      position: "fixed",
      top: visualViewport?.offsetTop || 0,
      left: 0,
      right: 0,
      bottom: "auto",
      height: visualViewport?.height || "100dvh",
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
            height: 100% !important;
            max-height: 100% !important;
            border-radius: 0 !important;
            padding: calc(12px + env(safe-area-inset-top)) 14px calc(12px + env(safe-area-inset-bottom)) !important;
          }
          .ab-modal-header {
            position: sticky;
            top: calc(-12px - env(safe-area-inset-top));
            z-index: 5;
            background: white;
            padding: 8px 0;
          }
        }
      `}</style>
      <div className="ab-modal-panel" style={{
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
      }} onClick={e => e.stopPropagation()}>
        <div className="ab-modal-header" style={{
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
    </div>
  );
};
