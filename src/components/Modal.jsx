import React from "react";

export const Modal = ({ isOpen, title, children, onClose }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0,0,0,0.45)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 100
    }} onClick={onClose}>
      <div style={{
        background: "white",
        borderRadius: 12,
        padding: "2rem",
        width: "90%",
        maxWidth: 450,
        boxShadow: "0 10px 40px rgba(0,0,0,0.2)"
      }} onClick={e => e.stopPropagation()}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem"
        }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "#1f2937" }}>
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
