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

  // Générer 4 semaines : lundi courant à vendredi semaine 4 (20 jours)
  const getFourWeeksDates = (startDate) => {
    const d = new Date(startDate);
    
    // Trouver le lundi COURANT (pas la semaine passée)
    const dayOfWeek = d.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    const firstMonday = new Date(d);
    firstMonday.setDate(d.getDate() - daysToSubtract);
    firstMonday.setHours(0, 0, 0, 0);
    
    const dates = [];
    
    // Générer 4 semaines × 5 jours (lun-ven SEULEMENT, pas sam-dim)
    for (let week = 0; week < 4; week++) {
      for (let day = 0; day < 5; day++) { // 0=lun, 1=mar, 2=mer, 3=jeu, 4=ven
        const date = new Date(firstMonday);
        date.setDate(firstMonday.getDate() + week * 7 + day);
        dates.push(date);
      }
    }
    
    return dates;
  };

  const allDates = getFourWeeksDates(currentDate);

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
    const days = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
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
    
    const totalDays = 20; // 4 semaines x 5 jours
    
    return {
      left: (startOffset / totalDays) * 100,
      width: (duration / totalDays) * 100
    };
  };

  // Calculer position/largeur relative à UN JOUR (pour affichage dans une cell)
  const getBarPositionInDay = (aff, dayDate, weekStart) => {
    const affStart = parseDate(aff.dateDebut);
    const affEnd = parseDate(aff.dateFin);
    
    if (!affStart || !affEnd) return { left: 0, width: 0, isVisible: false };
    
    const dayStart = new Date(dayDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayDate);
    dayEnd.setHours(23, 59, 59, 999);
    
    const affEndPlus = new Date(affEnd);
    affEndPlus.setDate(affEndPlus.getDate() + 1);
    
    // Vérifier si l'affectation chevauchent ce jour
    if (!(affStart <= dayEnd && affEndPlus >= dayStart)) {
      return { left: 0, width: 0, isVisible: false };
    }
    
    // Cliper aux limites du jour
    const clippedStart = affStart > dayStart ? affStart : dayStart;
    const clippedEnd = affEndPlus < dayEnd ? affEndPlus : dayEnd;
    
    // Calculer position en pourcentage du jour (0-100%)
    const startOffset = Math.floor((clippedStart - dayStart) / (1000 * 60 * 60 * 24) * 100);
    const endOffset = Math.floor((clippedEnd - dayStart) / (1000 * 60 * 60 * 24) * 100);
    
    return {
      left: startOffset,
      width: Math.max(100, endOffset - startOffset),
      isVisible: true
    };
  };

  // Calculer la position verticale (rang) d'une affectation pour un jour donné
  const getAffectationRankOnDay = (aff, dayDate, affectationsForOuvrier) => {
    const dayStart = new Date(dayDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayDate);
    dayEnd.setHours(23, 59, 59, 999);
    
    // Trouver toutes les affectations qui chevauchent ce jour
    const overlappingAff = affectationsForOuvrier
      .filter(a => {
        const aStart = parseDate(a.dateDebut);
        const aEnd = parseDate(a.dateFin);
        if (!aStart || !aEnd) return false;
        const aEndPlus = new Date(aEnd);
        aEndPlus.setDate(aEndPlus.getDate() + 1);
        return aStart <= dayEnd && aEndPlus >= dayStart;
      })
      .sort((a, b) => a.id - b.id); // Tri stable par ID
    
    // Retourner l'index de l'affectation actuelle
    return overlappingAff.findIndex(a => a.id === aff.id);
  };

  const weekStart = allDates[0];
  const weekEnd = new Date(allDates[allDates.length - 1]);
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
              d.setDate(d.getDate() - 7); // 1 semaine précédente
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
            ← 4 Sem Prec
          </button>
          <button
            onClick={() => {
              const d = new Date(currentDate);
              d.setDate(d.getDate() + 7); // 1 semaine suivante
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
            4 Sem Suiv →
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
          Semaine du {allDates[0].toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} au {allDates[19].toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
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
            gridTemplateColumns: "repeat(20, 1fr)",
            borderRight: "1px solid #e5e7eb"
          }}>
            {allDates.map((date, idx) => (
              <div
                key={idx}
                style={{
                  padding: "0.5rem 0.75rem",
                  background: "#f9fafb",
                  borderRight: (idx + 1) % 5 === 0 && idx < 19 ? "3px solid #1e3a8a" : idx < 19 ? "1px solid #e5e7eb" : "none",
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
                gridTemplateColumns: "repeat(20, 1fr)",
                background: "white",
                borderRight: "1px solid #e5e7eb",
                position: "relative"
              }}>
                {allDates.map((date, dayIdx) => (
                  <div
                    key={dayIdx}
                    onClick={() => onAddAffectation(ouvrier.id, date)}
                    style={{
                      borderRight: (dayIdx + 1) % 5 === 0 && dayIdx < 19 ? "3px solid #1e3a8a" : dayIdx < 19 ? "1px solid #e5e7eb" : "none",
                      minHeight: "80px",
                      position: "relative",
                      background: "white",
                      cursor: "pointer",
                      transition: "background 0.2s",
                      padding: "2px 2px",
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "flex-start"
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                    onMouseLeave={e => e.currentTarget.style.background = "white"}
                  >
                    {/* BARRES D'AFFECTATION */}
                    {affectsByOuvrier.map(aff => {
                      const chantier = chantiersActifs.find(c => c.id === aff.chantierId);
                      const posInDay = getBarPositionInDay(aff, date, weekStart);
                      const tacheText = aff.tache || chantier?.nom;
                      const chantierId2Lettres = chantier?.nom.substring(0, 2).toUpperCase();
                      
                      // Ne pas afficher si l'affectation ne chevauchent pas ce jour
                      if (!posInDay.isVisible) return null;
                      
                      // Calculer le rang (position verticale) pour ce jour
                      const rank = getAffectationRankOnDay(aff, date, affectsByOuvrier);
                      const barHeight = 24;
                      const gap = 2;
                      const topOffset = rank * (barHeight + gap) + 2;
                      
                      return (
                        <div
                          key={aff.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onAffectationClick(aff);
                          }}
                          style={{
                            position: "absolute",
                            left: `${posInDay.left}%`,
                            width: `${posInDay.width}%`,
                            top: `${topOffset}px`,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "2px",
                            cursor: "pointer",
                            transition: "all 0.2s"
                          }}
                          onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
                          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                        >
                          {/* CUBE AVEC 2 LETTRES DU CHANTIER */}
                          <div
                            style={{
                              width: "100%",
                              height: "24px",
                              background: colorMap[chantier?.id] || "#6b7280",
                              borderRadius: 2,
                              border: "1px solid rgba(0,0,0,0.2)",
                              boxSizing: "border-box",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "white",
                              fontWeight: 700,
                              fontSize: 10
                            }}
                          >
                            {chantierId2Lettres}
                          </div>
                          {/* LABEL COMPLET SOUS LE CUBE */}
                          <div
                            style={{
                              fontSize: 8,
                              fontWeight: 600,
                              color: "#374151",
                              textAlign: "center",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: "100%",
                              width: "100%",
                              lineHeight: 1.2,
                              padding: "0 2px"
                            }}
                          >
                            {tacheText}
                          </div>
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
