import React, { useState } from "react";

export const GanttChart = ({
  ouvriers,
  chantiers,
  affectations,
  onAffectationClick,
  onAddAffectation,
  onDeleteAffectationDay,
  onControlsReady
}) => {
  const [viewMode, setViewMode] = useState("semaine");

  const [currentDate, setCurrentDate] = useState(() => {
    const saved = localStorage.getItem("ganttCurrentDate");
    return saved ? new Date(saved) : new Date();
  });

  const [hoveredAffectationId, setHoveredAffectationId] = useState(null);

  const handleSetCurrentDate = (date) => {
    localStorage.setItem("ganttCurrentDate", date.toISOString());
    setCurrentDate(date);
  };

  // ==================================================
  // COULEURS CHANTIERS
  // ==================================================

  const chantiersActifs = chantiers.filter(c => c.statut === "Actif");

  const colorMap = {
    1: "#3b82f6",
    2: "#10b981",
    3: "#f59e0b",
    4: "#ef4444",
    5: "#8b5cf6",
    6: "#06b6d4",
    7: "#ec4899",
    8: "#f97316",
    9: "#6366f1",
    10: "#14b8a6"
  };

  const getChantierId2Lettres = (chantier) => {
    return chantier?.nom?.substring(0, 2).toUpperCase() || "??";
  };

  const getChantierColor = (chantierId) => {
    if (colorMap[chantierId]) {
      return colorMap[chantierId];
    }

    const colors = Object.values(colorMap);

    if (!chantierId) {
      return "#9ca3af";
    }

    return colors[chantierId % colors.length];
  };

  // ==================================================
  // HORS GANTT
  // ==================================================

  const isHorsGantt = (aff) => {
    return aff.typeAffectation === "HORS_GANTT";
  };

  const getAffectationLetters = (aff, chantier) => {
    if (isHorsGantt(aff)) {
      const nom = String(aff.nomExterne || "").trim();

      if (!nom) return "HG";

      return nom.substring(0, 2).toUpperCase();
    }

    return getChantierId2Lettres(chantier);
  };

  const getAffectationColor = (aff, chantier) => {
    if (isHorsGantt(aff)) {
      // Gris suffisamment soutenu pour rester lisible
      return "#9ca3af";
    }

    return getChantierColor(chantier?.id);
  };

  const getAffectationTextColor = (aff) => {
    if (isHorsGantt(aff)) {
      return "#111827";
    }

    return "white";
  };

  const getAffectationLabel = (aff, chantier) => {
    // ND = aucun texte sous le cube
    if (
      !aff.tache ||
      String(aff.tache).trim().toUpperCase() === "ND"
    ) {
      return "";
    }

    return aff.tache;
  };

  // ==================================================
  // DATES
  // ==================================================

  const getFourWeeksDates = (startDate) => {
    const d = new Date(startDate);

    const dayOfWeek = d.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const firstMonday = new Date(d);
    firstMonday.setDate(d.getDate() - daysToSubtract);
    firstMonday.setHours(0, 0, 0, 0);

    const dates = [];

    for (let week = 0; week < 4; week++) {
      for (let day = 0; day < 5; day++) {
        const date = new Date(firstMonday);
        date.setDate(firstMonday.getDate() + week * 7 + day);
        dates.push(date);
      }
    }

    return dates;
  };

  const allDates = getFourWeeksDates(currentDate);

  React.useEffect(() => {
    if (onControlsReady) {
      onControlsReady({
        onPrevWeek: () => {
          const d = new Date(currentDate);
          d.setDate(d.getDate() - 7);
          handleSetCurrentDate(d);
        },

        onNextWeek: () => {
          const d = new Date(currentDate);
          d.setDate(d.getDate() + 7);
          handleSetCurrentDate(d);
        },

        onToday: () => handleSetCurrentDate(new Date()),

        weekText:
          `Semaine du ${allDates[0].toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short"
          })} au ${allDates[19].toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short"
          })}`
      });
    }
  }, [currentDate, onControlsReady]);

  const parseDate = (dateStr) => {
    if (!dateStr) return null;

    if (dateStr.includes("T")) {
      return new Date(dateStr);
    }

    if (dateStr.includes("-")) {
      const [y, m, d] = dateStr.split("-");
      return new Date(Number(y), Number(m) - 1, Number(d));
    }

    const [d, m, y] = dateStr.split("/");
    return new Date(Number(y), Number(m) - 1, Number(d));
  };

  const formatShortDate = (date) => {
    const days = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
    const d = String(date.getDate()).padStart(2, "0");

    return `${days[date.getDay()]} ${d}`;
  };

  const isAffectationInWeek = (aff, weekStart, weekEnd) => {
    const affStart = parseDate(aff.dateDebut);
    const affEnd = parseDate(aff.dateFin);

    if (!affStart || !affEnd) return false;

    const affEndPlus = new Date(affEnd);
    affEndPlus.setDate(affEndPlus.getDate() + 1);

    return affStart <= weekEnd && affEndPlus >= weekStart;
  };

  const getBarPositionInDay = (aff, dayDate) => {
    const affStart = parseDate(aff.dateDebut);
    const affEnd = parseDate(aff.dateFin);

    if (!affStart || !affEnd) {
      return {
        left: 0,
        width: 0,
        isVisible: false
      };
    }

    const dayStart = new Date(dayDate);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(dayDate);
    dayEnd.setHours(23, 59, 59, 999);

    const affEndPlus = new Date(affEnd);
    affEndPlus.setDate(affEndPlus.getDate() + 1);

    if (!(affStart <= dayEnd && affEndPlus > dayStart)) {
      return {
        left: 0,
        width: 0,
        isVisible: false
      };
    }

    const clippedStart = affStart > dayStart ? affStart : dayStart;
    const clippedEnd = affEndPlus < dayEnd ? affEndPlus : dayEnd;

    const startOffset = Math.floor(
      ((clippedStart - dayStart) / (1000 * 60 * 60 * 24)) * 100
    );

    const endOffset = Math.floor(
      ((clippedEnd - dayStart) / (1000 * 60 * 60 * 24)) * 100
    );

    return {
      left: startOffset,
      width: endOffset - startOffset,
      isVisible: true
    };
  };

  const getAffectationRankOnDay = (
    aff,
    dayDate,
    affectationsForOuvrier
  ) => {
    const dayStart = new Date(dayDate);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(dayDate);
    dayEnd.setHours(23, 59, 59, 999);

    const overlappingAff = affectationsForOuvrier
      .filter(a => {
        const aStart = parseDate(a.dateDebut);
        const aEnd = parseDate(a.dateFin);

        if (!aStart || !aEnd) return false;

        const aEndPlus = new Date(aEnd);
        aEndPlus.setDate(aEndPlus.getDate() + 1);

        return aStart <= dayEnd && aEndPlus > dayStart;
      })
      .sort((a, b) => a.id - b.id);

    return overlappingAff.findIndex(a => a.id === aff.id);
  };

  const weekStart = allDates[0];

  const weekEnd = new Date(allDates[allDates.length - 1]);
  weekEnd.setHours(23, 59, 59, 999);

  const ouvrierActifs = ouvriers.filter(o => o.statut === "Actif");

  const gridTemplate = "repeat(20, minmax(50px, 1fr))";

  return (
    <div
      style={{
        padding: "1rem",
        flex: 1,
        display: "flex",
        flexDirection: "column"
      }}
    >

      {/* LÉGENDE CHANTIERS */}
      <div
        style={{
          display: "flex",
          gap: "1rem",
          alignItems: "center",
          flexWrap: "wrap",
          padding: "0.75rem 0.5rem",
          marginBottom: "0.5rem",
          background: "rgba(255,255,255,0.5)",
          borderRadius: "4px",
          fontSize: "11px"
        }}
      >
        {chantiersActifs.map(chantier => (
          <div
            key={chantier.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <div
              style={{
                width: "10px",
                height: "10px",
                background: getChantierColor(chantier.id),
                borderRadius: "2px",
                flexShrink: 0
              }}
            />

            <span
              style={{
                color: "#4b5563",
                fontWeight: 500
              }}
            >
              {chantier.nom}
            </span>
          </div>
        ))}
      </div>

      {/* GANTT */}
      <div
        style={{
          background: "white",
          borderRadius: 6,
          border: "1px solid #e5e7eb",
          display: "flex",
          flexDirection: "column",
          flex: 1,
          overflowY: "auto",
          overflowX: "auto"
        }}
      >

        {/* HEADER */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid #d1d5db",
            height: "40px",
            flexShrink: 0
          }}
        >
          <div
            style={{
              width: 150,
              padding: "0.5rem 0.75rem",
              background: "#e5e7eb",
              borderRight: "1px solid #9ca3af",
              fontWeight: 600,
              fontSize: 10,
              color: "#1f2937",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}
          >
            OUVRIER
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: gridTemplate,
              borderRight: "1px solid #9ca3af",
              height: "40px",
              flex: 1,
              background: "#e5e7eb"
            }}
          >
            {allDates.map((date, idx) => (
              <div
                key={idx}
                style={{
                  padding: "0.5rem 0.75rem",
                  background: "transparent",
                  borderRight:
                    (idx + 1) % 5 === 0 && idx < 19
                      ? "3px solid #1e3a8a"
                      : idx < 19
                      ? "1px solid #d1d5db"
                      : "none",
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

        {/* OUVRIERS */}
        {ouvrierActifs.map((ouvrier, idx) => {
          const affectsByOuvrier = affectations.filter(
            a =>
              a.ouvrierID === ouvrier.id &&
              isAffectationInWeek(a, weekStart, weekEnd)
          );

          const rowBackground =
            idx % 2 === 0 ? "white" : "#f3f4f6";

          return (
            <div key={ouvrier.id}>
              <div
                style={{
                  display: "flex",
                  height: "45px",
                  background: rowBackground
                }}
              >

                {/* NOM OUVRIER */}
                <div
                  style={{
                    width: 150,
                    padding: "0.5rem 0.75rem",
                    background: rowBackground,
                    borderRight: "1px solid #9ca3af",
                    fontSize: 10,
                    fontWeight: 500,
                    color: "#1f2937",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    flexShrink: 0
                  }}
                >
                  <div>{ouvrier.nom}</div>

                  <div
                    style={{
                      fontSize: 8,
                      color: "#9ca3af"
                    }}
                  >
                    {ouvrier.metier}
                  </div>
                </div>

                {/* TIMELINE */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: gridTemplate,
                    background: rowBackground,
                    borderRight: "1px solid #9ca3af",
                    position: "relative",
                    height: "45px",
                    flex: 1
                  }}
                >
                  {allDates.map((date, dayIdx) => (
                    <div
                      key={dayIdx}
                      onClick={(e) => {
                        if (e.target.closest("button")) {
                          return;
                        }

                        onAddAffectation(ouvrier.id, date);
                      }}
                      style={{
                        borderRight:
                          (dayIdx + 1) % 5 === 0 && dayIdx < 19
                            ? "3px solid #1e3a8a"
                            : dayIdx < 19
                            ? "1px solid #d1d5db"
                            : "none",
                        position: "relative",
                        background: "transparent",
                        cursor: "pointer",
                        transition: "background 0.2s",
                        padding: "1px",
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "flex-start",
                        overflow: "hidden"
                      }}
                      onMouseEnter={e =>
                        (e.currentTarget.style.background = "#e5e7eb")
                      }
                      onMouseLeave={e =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >

                      {affectsByOuvrier.map(aff => {
                        const chantier = chantiers.find(
                          c => c.id === aff.chantierId
                        );

                        const posInDay =
                          getBarPositionInDay(aff, date);

                        if (!posInDay.isVisible) {
                          return null;
                        }

                        const lettres =
                          getAffectationLetters(aff, chantier);

                        const couleur =
                          getAffectationColor(aff, chantier);

                        const couleurTexte =
                          getAffectationTextColor(aff);

                        const label =
                          getAffectationLabel(aff, chantier);

                        const rank =
                          getAffectationRankOnDay(
                            aff,
                            date,
                            affectsByOuvrier
                          );

                        const barHeight = 18;
                        const gap = 2;
                        const topOffset =
                          rank * (barHeight + gap) + 1;

                        return (
                          <div
                            key={aff.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onAffectationClick(aff);
                            }}
                            onMouseEnter={() =>
                              setHoveredAffectationId(aff.id)
                            }
                            onMouseLeave={() =>
                              setHoveredAffectationId(null)
                            }
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
                              border:
                                hoveredAffectationId === aff.id
                                  ? "2px solid rgba(0,0,0,0.3)"
                                  : "none"
                            }}
                          >

                            {/* CUBE */}
                            <div
                              title={
                                isHorsGantt(aff)
                                  ? aff.nomExterne || ""
                                  : chantier?.nom || ""
                              }
                              style={{
                                width: "100%",
                                height: "18px",
                                background: couleur,
                                borderRadius: 2,
                                border: isHorsGantt(aff)
                                  ? "1px solid #6b7280"
                                  : "1px solid rgba(0,0,0,0.2)",
                                boxSizing: "border-box",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: couleurTexte,
                                fontWeight: 800,
                                fontSize: 10,
                                flexShrink: 0
                              }}
                            >
                              {lettres}
                            </div>

                            {/* LABEL : ND N'EST PLUS AFFICHÉ */}
                            {label && (
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
                                {label}
                              </div>
                            )}

                            {/* SUPPRESSION */}
                            {hoveredAffectationId === aff.id && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();

                                  if (onDeleteAffectationDay) {
                                    onDeleteAffectationDay(
                                      aff.id,
                                      date
                                    );
                                  }
                                }}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
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
                                  boxShadow:
                                    "0 2px 4px rgba(0,0,0,0.2)",
                                  pointerEvents: "auto",
                                  zIndex: 1000
                                }}
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

              <div
                style={{
                  height: "1px",
                  background: "#d1d5db",
                  width: "100%"
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
