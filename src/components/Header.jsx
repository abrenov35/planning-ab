import React from "react";

export const Header = ({ title, subtitle }) => {
  return (
    <div style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "1.5rem" }}>
      <h1 style={{ fontSize: 20, fontWeight: 600, color: "#1f2937", margin: 0 }}>
        {title}
      </h1>
      <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
        {subtitle}
      </div>
    </div>
  );
};
