import React, { useState } from "react";

export const GanttChart = ({ 
  ouvriers, 
  chantiers, 
  affectations, 
  onAffectationClick,
  onAddAffectation,
  onDeleteAffectation,
  onDeleteAffectationDay
}) => {
  const [viewMode, setViewMode] = useState("semaine"); // semaine ou mois
  const [currentDate, setCurrentDate] = useState(new Date()); // Aujourd'hui par défaut
  const [hoveredAffectationId, setHoveredAffectationId] = useState(null);

  // Couleurs par chantier
  const chantiersActifs = chantiers.filter(c => c.statut === "Actif");
  const colorMap = {
    1: "#3b82f6", // Bleu
    2: "#10b981", // Vert
    3: "#f59e0b", // Orange
    4: "#ef4444", // Rouge
    5: "#8b5cf6", // Violet
    6: "#06b6d4", // Cyan
    7: "#ec4899", // Rose
    8: "#f97316", // Orange foncé
    9: "#6366f1", // Indigo
    10: "#14b8a6", // Teal
  };

  // Fonction pour obtenir la couleur d'un chantier (fallback par modulo si ID pas dans la map)
  const getChantierId2Lettres = (chantier) => {
    return chantier?.nom.substring(0, 2).toUpperCase() || "??";
  };

  const getChantierColor = (chantierId) => {
    // Si l'ID est dans la colorMap, utiliser cette couleur
    if (colorMap[chantierId]) {
      return colorMap[chantierId];
    }
    // Sinon, utiliser modulo pour mapper à une couleur existante
    const colors = Object.values(colorMap);
    return colors[chantierId % colors.length];
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
    <div style={{ 
      padding: "1rem", 
      flex: 1, 
      overflowY: "auto",
      overflowX: "auto",
      display: "flex",
      flexDirection: "column"
    }}>
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
        display: "flex",
        flexDirection: "column",
        flex: 1
      }}>
        {/* HEADER AVEC DATES */}
        <div style={{ display: "flex", borderBottom: "1px solid #d1d5db", height: "40px" }}>
          <div style={{
            width: 150,
            padding: "0.5rem 0.75rem",
            background: "#e5e7eb",
            borderRight: "1px solid #9ca3af",
            fontWeight: 600,
            fontSize: 10,
            color: "#1f2937",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            OUVRIER
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(20, 1fr)",
            borderRight: "1px solid #9ca3af",
            height: "40px",
            flex: 1,
            background: "#e5e7eb"
          }}>
            {allDates.map((date, idx) => (
              <div
                key={idx}
                style={{
                  padding: "0.5rem 0.75rem",
                  background: "transparent",
                  borderRight: (idx + 1) % 5 === 0 && idx < 19 ? "3px solid #1e3a8a" : idx < 19 ? "1px solid #d1d5db" : "none",
                  textAlign: "center",
                  fontSize: 9,
                  fontWeight: 600,
                  color: "#1f2937",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                {formatShortDate(date)}
              </div>
            ))}
          </div>
        </div>

        {/* ROWS - OUVRIERS */}
        {ouvrierActifs.map((ouvrier, idx) => {
          const affectsByOuvrier = affectations.filter(
            a => a.ouvrierID === ouvrier.id && isAffectationInWeek(a, weekStart, weekEnd)
          );
          
          // Alternance de couleurs: pair=blanc, impair=gris clair
          const rowBackground = idx % 2 === 0 ? "white" : "#f9fafb";

          return (
            <div key={ouvrier.id}>
              <div style={{ display: "flex", height: "45px", background: rowBackground }}>
                {/* NOM OUVRIER */}
                <div style={{
                  width: 150,
                  padding: "0.5rem 0.75rem",
                  background: rowBackground,
                  borderRight: "1px solid #9ca3af",
                  fontSize: 10,
                  fontWeight: 500,
                  color: "#1f2937",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center"
                }}>
                  <div>{ouvrier.nom}</div>
                  <div style={{ fontSize: 8, color: "#9ca3af" }}>{ouvrier.metier}</div>
                </div>

                {/* TIMELINE */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(20, 1fr)",
                  background: rowBackground,
                  borderRight: "1px solid #9ca3af",
                  position: "relative",
                  height: "45px",
                  flex: 1
                }}>
                  {allDates.map((date, dayIdx) => (
                    <div
                      key={dayIdx}
                      onClick={() => onAddAffectation(ouvrier.id, date)}
                      style={{
                        borderRight: (dayIdx + 1) % 5 === 0 && dayIdx < 19 ? "3px solid #1e3a8a" : dayIdx < 19 ? "1px solid #d1d5db" : "none",
                        position: "relative",
                        background: "transparent",
                        cursor: "pointer",
                        transition: "background 0.2s",
                        padding: "1px 1px",
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "flex-start",
                        overflow: "hidden"
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "#e5e7eb"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      {/* BARRES D'AFFECTATION */}
                      {affectsByOuvrier.map(aff => {
                        const chantier = chantiers.find(c => c.id === aff.chantierId);
                        const posInDay = getBarPositionInDay(aff, date, weekStart);
                        const tacheText = aff.tache || chantier?.nom;
                        const chantierId2Lettres = getChantierId2Lettres(chantier);
                        const chantierColor = getChantierColor(chantier?.id);
                        
                        // Ne pas afficher si l'affectation ne chevauchent pas ce jour
                        if (!posInDay.isVisible) return null;
                        
                        // Calculer le rang (position verticale) pour ce jour
                        const rank = getAffectationRankOnDay(aff, date, affectsByOuvrier);
                        const barHeight = 18;
                        const gap = 2;
                        const topOffset = rank * (barHeight + gap) + 1;
                        
                        return (
                          <div
                            key={aff.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onAffectationClick(aff);
                            }}
                            onMouseEnter={() => setHoveredAffectationId(aff.id)}
                            onMouseLeave={() => setHoveredAffectationId(null)}
                            style={{
                              position: "absolute",
                              left: `${posInDay.left}%`,
                              width: `${posInDay.width}%`,
                              top: `${topOffset}px`,
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              gap: "1px",
                              cursor: "pointer",
                              transition: "all 0.2s",
                              padding: "0 2px",
                              borderRadius: 3,
                              border: hoveredAffectationId === aff.id ? "2px solid rgba(0,0,0,0.3)" : "none"
                            }}
                          >
                            {/* CUBE AVEC 2 LETTRES DU CHANTIER */}
                            <div
                              style={{
                                width: "100%",
                                height: "18px",
                                background: chantierColor,
                                borderRadius: 2,
                                border: "1px solid rgba(0,0,0,0.2)",
                                boxSizing: "border-box",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "white",
                                fontWeight: 700,
                                fontSize: 9,
                                flexShrink: 0
                              }}
                            >
                              {chantierId2Lettres}
                            </div>
                            {/* LABEL COMPLET SOUS LE CUBE */}
                            <div
                              style={{
                                fontSize: 7,
                                fontWeight: 600,
                                color: "#374151",
                                textAlign: "center",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                maxWidth: "100%",
                                width: "100%",
                                lineHeight: 1,
                                padding: "0 2px"
                              }}
                            >
                              {tacheText}
                            </div>

                            {/* BOUTON SUPPRESSION AU SURVOL - SUR TOUS LES JOURS */}
                            {hoveredAffectationId === aff.id && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onDeleteAffectationDay) {
                                    onDeleteAffectationDay(aff.id, date);
                                  }
                                }}
                                style={{
                                  position: "absolute",
                                  top: "-8px",
                                  right: "-8px",
                                  width: "18px",
                                  height: "18px",
                                  borderRadius: "50%",
                                  background: "#ef4444",
                                  color: "white",
                                  border: "none",
                                  cursor: "pointer",
                                  fontSize: "12px",
                                  fontWeight: "bold",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  padding: 0,
                                  lineHeight: 1,
                                  transition: "all 0.2s",
                                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = "#dc2626"}
                                onMouseLeave={e => e.currentTarget.style.background = "#ef4444"}
                                title="Supprimer ce jour"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
              {/* FILET GRIS SUR TOUTE LA LONGUEUR */}
              <div style={{
                height: "1px",
                background: "#d1d5db",
                width: "100%"
              }} />
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
                  background: getChantierColor(chantier.id),
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
