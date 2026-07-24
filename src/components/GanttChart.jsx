import React, { useState } from "react";

export const GanttChart = ({ 
  ouvriers, 
  chantiers, 
  affectations, 
  onAffectationClick,
  onAddAffectation 
}) => {
  const [viewMode, setViewMode] = useState("semaine"); // semaine ou mois
  const [currentDate, setCurrentDate] = useState(new Date()); // Aujourd'hui par défaut

  // Couleurs par chantier
  const chantiersActifs = chantiers.filter(c => c.statut === "Actif");
  const colorMap = {
    1: "#3b82f6", // Bleu
    2: "#10b981", // Vert
    3: "#f59e0b", // Orange
    4: "#ef4444", // Rouge
    5: "#8b5cf6", // Violet
  };

  // Générer les dates de la semaine
  const getWeekDates = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(d.setDate(diff));
    
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates(currentDate);

  // Convertir date string en Date object (gère ISO et JJ/MM/AAAA)
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    
    // Format ISO: 2026-07-28T22:00:00.000Z
    if (dateStr.includes('T')) {
      return new Date(dateStr);
    }
    
    // Format JJ/MM/AAAA: 28/07/2026
    const [d, m, y] = dateStr.split("/");
    return new Date(y, m - 1, d);
  };

  // Formater date courte
  const formatShortDate = (date) => {
    const days = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
    const d = String(date.getDate()).padStart(2, "0");
    return `${days[date.getDay()]} ${d}`;
  };

  // Vérifier si une affectation chevauche la semaine
  const isAffectationInWeek = (aff, weekStart, weekEnd) => {
    const affStart = parseDate(aff.dateDebut);
    const affEnd = parseDate(aff.dateFin);
    
    if (!affStart || !affEnd) return false;
    
    // Ajouter 1 jour à la fin pour inclure le dernier jour complètement
    const affEndPlus = new Date(affEnd);
    affEndPlus.setDate(affEndPlus.getDate() + 1);
    
    return affStart <= weekEnd && affEndPlus >= weekStart;
  };

  // Calculer la position et la largeur de la barre
  const getBarPosition = (aff, weekStart, weekEnd) => {
    const affStart = parseDate(aff.dateDebut);
    const affEnd = parseDate(aff.dateFin);
    
    if (!affStart || !affEnd) return { left: 0, width: 0 };
    
    // Créer une copie pour ne pas modifier les dates originales
    const displayStart = new Date(affStart);
    const displayEnd = new Date(affEnd);
    displayEnd.setDate(displayEnd.getDate() + 1); // +1 pour inclure le dernier jour
    
    // Cliper aux limites de la semaine
    const clippedStart = displayStart < weekStart ? weekStart : displayStart;
    const clippedEnd = displayEnd > weekEnd ? weekEnd : displayEnd;
    
    // Calculer l'offset et la durée en jours
    const startOffset = Math.floor((clippedStart - weekStart) / (1000 * 60 * 60 * 24));
    const endOffset = Math.floor((clippedEnd - weekStart) / (1000 * 60 * 60 * 24));
    const duration = Math.max(1, endOffset - startOffset); // Au minimum 1 jour
    
    const totalDays = 7;
    
    return {
      left: (startOffset / totalDays) * 100,
      width: (duration / totalDays) * 100
    };
  };

  const weekStart = weekDates[0];
  const weekEnd = new Date(weekDates[6]);
  weekEnd.setHours(23, 59, 59, 999);

  const ouvrierActifs = ouvriers.filter(o => o.statut === "Actif");

  return (
    <div style={{ padding: "1rem", flex: 1, overflowY: "auto" }}>
      {/* CONTRÔLES */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        marginBottom: "1rem",
        gap: "1rem"
      }}>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => {
              const d = new Date(currentDate);
              d.setDate(d.getDate() - 7);
              setCurrentDate(d);
            }}
            style={{
              padding: "6px 12px",
              background: "#1e3a8a",
              color: "white",
              border: "none",
              borderRadius: 4,
              fontSize: 11,
              cursor: "pointer",
              fontWeight: 600
            }}
          >
            ← Sem Prec
          </button>
          <button
            onClick={() => {
              const d = new Date(currentDate);
              d.setDate(d.getDate() + 7);
              setCurrentDate(d);
            }}
            style={{
              padding: "6px 12px",
              background: "#1e3a8a",
              color: "white",
              border: "none",
              borderRadius: 4,
              fontSize: 11,
              cursor: "pointer",
              fontWeight: 600
            }}
          >
            Sem Suiv →
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            style={{
              padding: "6px 12px",
              background: "#10b981",
              color: "white",
              border: "none",
              borderRadius: 4,
              fontSize: 11,
              cursor: "pointer",
              fontWeight: 600
            }}
          >
            Aujourd'hui
          </button>
        </div>

        <div style={{ fontSize: 12, fontWeight: 600, color: "#1f2937" }}>
          Semaine du {weekDates[0].toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
        </div>
      </div>

      {/* GANTT CHART */}
      <div style={{
        background: "white",
        borderRadius: 6,
        border: "1px solid #e5e7eb",
        overflow: "hidden"
      }}>
        {/* HEADER AVEC DATES */}
        <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb" }}>
          <div style={{
            width: 150,
            padding: "0.5rem 0.75rem",
            background: "#f9fafb",
            borderRight: "1px solid #e5e7eb",
            fontWeight: 600,
            fontSize: 11,
            color: "#1f2937"
          }}>
            OUVRIER
          </div>
          <div style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            borderRight: "1px solid #e5e7eb"
          }}>
            {weekDates.map((date, idx) => (
              <div
                key={idx}
                style={{
                  padding: "0.5rem 0.75rem",
                  background: "#f9fafb",
                  borderRight: idx < 6 ? "1px solid #e5e7eb" : "none",
                  textAlign: "center",
                  fontSize: 10,
                  fontWeight: 600,
                  color: "#1f2937"
                }}
              >
                {formatShortDate(date)}
              </div>
            ))}
          </div>
        </div>

        {/* ROWS - OUVRIERS */}
        {ouvrierActifs.map(ouvrier => {
          const affectsByOuvrier = affectations.filter(
            a => a.ouvrierID === ouvrier.id && isAffectationInWeek(a, weekStart, weekEnd)
          );

          return (
            <div key={ouvrier.id} style={{ display: "flex", borderBottom: "1px solid #f3f4f6" }}>
              {/* NOM OUVRIER */}
              <div style={{
                width: 150,
                padding: "0.5rem 0.75rem",
                background: "white",
                borderRight: "1px solid #e5e7eb",
                fontSize: 11,
                fontWeight: 500,
                color: "#1f2937"
              }}>
                <div>{ouvrier.nom}</div>
                <div style={{ fontSize: 9, color: "#9ca3af" }}>{ouvrier.metier}</div>
              </div>

              {/* TIMELINE */}
              <div style={{
                flex: 1,
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                background: "white",
                borderRight: "1px solid #e5e7eb",
                position: "relative"
              }}>
                {weekDates.map((date, dayIdx) => (
                  <div
                    key={dayIdx}
                    onClick={() => onAddAffectation(ouvrier.id, date)}
                    style={{
                      borderRight: dayIdx < 6 ? "1px solid #e5e7eb" : "none",
                      minHeight: "50px",
                      position: "relative",
                      background: dayIdx >= 5 ? "#f9fafb" : "white",
                      cursor: "pointer",
                      transition: "background 0.2s",
                      padding: "2px 2px"
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = dayIdx >= 5 ? "#f3f4f6" : "#f9fafb"}
                    onMouseLeave={e => e.currentTarget.style.background = dayIdx >= 5 ? "#f9fafb" : "white"}
                  >
                    {/* BARRES D'AFFECTATION */}
                    {affectsByOuvrier.map(aff => {
                      const chantier = chantiersActifs.find(c => c.id === aff.chantierId);
                      const pos = getBarPosition(aff, weekStart, weekEnd);
                      
                      return (
                        <div
                          key={aff.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onAffectationClick(aff);
                          }}
                          style={{
                            position: "absolute",
                            left: `${pos.left}%`,
                            width: `${Math.max(pos.width, 10)}%`,
                            top: "4px",
                            height: "18px",
                            background: colorMap[chantier?.id] || "#6b7280",
                            borderRadius: 2,
                            border: "1px solid rgba(0,0,0,0.2)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 8,
                            color: "white",
                            fontWeight: 600,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            padding: "0 2px",
                            transition: "all 0.2s"
                          }}
                          title={chantier?.nom}
                          onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
                          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                        >
                          {chantier?.nom.substring(0, 3)}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* LÉGENDE */}
      <div style={{ marginTop: "1rem", padding: "0.75rem", background: "#f9fafb", borderRadius: 6 }}>
        <div style={{ fontSize: 11, fontWeight: 600, marginBottom: "0.5rem", color: "#1f2937" }}>
          Chantiers :
        </div>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          {chantiersActifs.map(chantier => (
            <div key={chantier.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div
                style={{
                  width: 16,
                  height: 16,
                  background: colorMap[chantier.id] || "#6b7280",
                  borderRadius: 2
                }}
              />
              <span style={{ fontSize: 10, color: "#6b7280" }}>{chantier.nom}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
