import React, { useEffect, useRef } from "react";

export const Modal = ({ isOpen, title, children, onClose }) => {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const panel = panelRef.current;
    const mobile = typeof window !== "undefined" && window.matchMedia("(max-width: 1100px) and (pointer: coarse)").matches;
    const body = document.body;
    const root = document.documentElement;
    const scrollY = window.scrollY || window.pageYOffset || 0;
    const previousBody = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow
    };

    const updateVisualViewport = () => {
      if (!mobile) return;
      const vv = window.visualViewport;
      const height = vv?.height || window.innerHeight;
      const offsetTop = vv?.offsetTop || 0;
      root.style.setProperty("--ab-modal-vh", `${Math.round(height)}px`);
      root.style.setProperty("--ab-modal-top", `${Math.round(offsetTop)}px`);
    };

    if (mobile) {
      body.style.position = "fixed";
      body.style.top = `-${scrollY}px`;
      body.style.left = "0";
      body.style.right = "0";
      body.style.width = "100%";
      body.style.overflow = "hidden";
      updateVisualViewport();
      window.visualViewport?.addEventListener("resize", updateVisualViewport);
      window.visualViewport?.addEventListener("scroll", updateVisualViewport);
    }

    const handleFocusIn = event => {
      const target = event.target;
      if (!mobile || !target?.matches?.("input, textarea, select")) return;
      window.setTimeout(() => {
        if (document.activeElement !== target) return;
        target.scrollIntoView({ behavior: "auto", block: "nearest", inline: "nearest" });
      }, 320);
    };

    panel?.addEventListener("focusin", handleFocusIn);

    const handleDocumentKeyDown = event => {
      if (event.key !== "Enter" || event.repeat || event.isComposing) return;
      if (event.altKey || event.ctrlKey || event.metaKey) return;

      const target = event.target;
      const tag = target?.tagName?.toLowerCase();
      if (event.shiftKey && tag === "textarea") return;
      if (event.shiftKey) return;

      const currentPanel = panelRef.current;
      if (!currentPanel) return;

      // Une confirmation secondaire a priorité absolue : ne jamais valider
      // la modale principale derrière elle.
      if (document.querySelector('[data-modal-confirm="true"]')) return;

      const form = currentPanel.querySelector("form");
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

      const primaryButton = Array.from(currentPanel.querySelectorAll("button")).find(button => {
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
    return () => {
      document.removeEventListener("keydown", handleDocumentKeyDown, true);
      panel?.removeEventListener("focusin", handleFocusIn);
      if (mobile) {
        window.visualViewport?.removeEventListener("resize", updateVisualViewport);
        window.visualViewport?.removeEventListener("scroll", updateVisualViewport);
        root.style.removeProperty("--ab-modal-vh");
        root.style.removeProperty("--ab-modal-top");
        body.style.position = previousBody.position;
        body.style.top = previousBody.top;
        body.style.left = previousBody.left;
        body.style.right = previousBody.right;
        body.style.width = previousBody.width;
        body.style.overflow = previousBody.overflow;
        window.scrollTo(0, scrollY);
      }
    };
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
        padding: 8,
        overflow: "hidden"
      }}
    >
      <style>{`
        @media (max-width: 1100px) and (pointer: coarse) {
          .ab-modal-overlay {
            top: var(--ab-modal-top, 0px) !important;
            bottom: auto !important;
            height: var(--ab-modal-vh, 100dvh) !important;
            padding: 0 !important;
            align-items: stretch !important;
            overscroll-behavior: none !important;
          }
          .ab-modal-panel {
            width: 100% !important;
            max-width: none !important;
            height: 100% !important;
            max-height: 100% !important;
            border-radius: 0 !important;
            padding: calc(10px + env(safe-area-inset-top)) 14px calc(10px + env(safe-area-inset-bottom)) !important;
          }
          .ab-modal-body {
            overscroll-behavior: contain !important;
            -webkit-overflow-scrolling: touch !important;
            padding-bottom: 18px !important;
          }
          .ab-modal-panel input,
          .ab-modal-panel textarea,
          .ab-modal-panel select {
            font-size: 16px !important;
            scroll-margin-top: 12px;
            scroll-margin-bottom: 22px;
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
          boxSizing: "border-box",
          boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}
        onClick={event => event.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "0.75rem",
            flexShrink: 0
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
              height: 28,
              flexShrink: 0
            }}
          >
            ×
          </button>
        </div>

        <div
          className="ab-modal-body"
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            WebkitOverflowScrolling: "touch"
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
