import React, { useEffect, useRef } from "react";

export const Modal = ({ isOpen, title, children, onClose }) => {
  const panelRef = useRef(null);
  const portraitOnly = /affectation/i.test(String(title || ""));

  useEffect(() => {
    if (!isOpen) return undefined;

    const panel = panelRef.current;
    const mobile = typeof window !== "undefined" && window.matchMedia("(max-width: 1100px) and (pointer: coarse)").matches;
    const body = document.body;
    const root = document.documentElement;
    const viewport = document.querySelector('meta[name="viewport"]');
    const previousViewport = viewport?.getAttribute("content") || "";
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
      if (portraitOnly && viewport) {
        viewport.setAttribute(
          "content",
          "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        );
      }
      body.style.position = "fixed";
      body.style.top = `-${scrollY}px`;
      body.style.left = "0";
      body.style.right = "0";
      body.style.width = "100%";
      body.style.overflow = "hidden";
      updateVisualViewport();
      window.visualViewport?.addEventListener("resize", updateVisualViewport);
      window.visualViewport?.addEventListener("scroll", updateVisualViewport);
      window.addEventListener("orientationchange", updateVisualViewport);
    }

    const handleFocusIn = event => {
      const target = event.target;
      if (!mobile || !target?.matches?.("input, textarea, select")) return;

      window.setTimeout(() => {
        if (document.activeElement !== target) return;
        const modalBody = panel?.querySelector?.(".ab-modal-body");
        if (!modalBody) return;

        const bodyRect = modalBody.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        const topMargin = 10;
        const bottomMargin = 14;

        if (targetRect.bottom > bodyRect.bottom - bottomMargin) {
          modalBody.scrollTop += targetRect.bottom - (bodyRect.bottom - bottomMargin);
        } else if (targetRect.top < bodyRect.top + topMargin) {
          modalBody.scrollTop -= (bodyRect.top + topMargin) - targetRect.top;
        }
      }, 120);
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
        window.removeEventListener("orientationchange", updateVisualViewport);
        root.style.removeProperty("--ab-modal-vh");
        root.style.removeProperty("--ab-modal-top");
        if (portraitOnly && viewport) viewport.setAttribute("content", previousViewport);
        body.style.position = previousBody.position;
        body.style.top = previousBody.top;
        body.style.left = previousBody.left;
        body.style.right = previousBody.right;
        body.style.width = previousBody.width;
        body.style.overflow = previousBody.overflow;
        window.scrollTo(0, scrollY);
      }
    };
  }, [isOpen, portraitOnly]);

  if (!isOpen) return null;

  return (
    <div
      className={`ab-modal-overlay${portraitOnly ? " ab-modal-portrait-only" : ""}`}
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
        .ab-modal-rotate {
          display: none;
        }

        @media (max-width: 1100px) and (pointer: coarse) {
          .ab-modal-overlay {
            top: var(--ab-modal-top, 0px) !important;
            bottom: auto !important;
            height: var(--ab-modal-vh, 100dvh) !important;
            padding: 0 !important;
            align-items: flex-end !important;
            justify-content: center !important;
            overscroll-behavior: none !important;
          }
          .ab-modal-panel {
            width: 100% !important;
            max-width: none !important;
            height: auto !important;
            max-height: 100% !important;
            border-radius: 14px 14px 0 0 !important;
            padding: 12px 14px calc(12px + env(safe-area-inset-bottom)) !important;
          }
          .ab-modal-overlay.ab-modal-portrait-only {
            align-items: flex-start !important;
          }
          .ab-modal-overlay.ab-modal-portrait-only .ab-modal-panel {
            height: 100% !important;
            max-height: 100% !important;
            border-radius: 12px 12px 0 0 !important;
          }
          .ab-modal-body {
            overscroll-behavior: contain !important;
            -webkit-overflow-scrolling: touch !important;
            padding-bottom: 10px !important;
          }
          .ab-modal-overlay.ab-modal-portrait-only .ab-modal-body {
            overflow-y: auto !important;
            min-height: 0 !important;
          }
          .ab-modal-panel input,
          .ab-modal-panel textarea,
          .ab-modal-panel select {
            font-size: 16px !important;
            scroll-margin-top: 10px;
            scroll-margin-bottom: 18px;
          }
        }

        @media (max-width: 1100px) and (pointer: coarse) and (orientation: landscape) {
          .ab-modal-overlay.ab-modal-portrait-only {
            align-items: center !important;
            justify-content: center !important;
            padding: 12px !important;
          }
          .ab-modal-overlay.ab-modal-portrait-only .ab-modal-panel {
            display: none !important;
          }
          .ab-modal-overlay.ab-modal-portrait-only .ab-modal-rotate {
            display: flex !important;
          }
        }
      `}</style>

      {portraitOnly && (
        <div
          className="ab-modal-rotate"
          style={{
            width: "min(360px, 92vw)",
            background: "white",
            borderRadius: 14,
            boxShadow: "0 12px 40px rgba(0,0,0,0.22)",
            padding: "18px 20px",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: 8
          }}
        >
          <div style={{ fontSize: 28 }}>📱</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#1f2937" }}>
            Tournez l’iPhone en vertical
          </div>
          <div style={{ fontSize: 12, lineHeight: 1.4, color: "#6b7280" }}>
            La saisie d’une affectation est prévue en mode portrait pour rester stable au-dessus du clavier.
          </div>
        </div>
      )}

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
