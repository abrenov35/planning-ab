import React, { useState } from "react";

export const GanttChart = ({
  ouvriers,
  chantiers,
  affectations,
  onAffectationClick,
  onAddAffectation,
  onControlsReady
}) => {
  const [currentDate, setCurrentDate] = useState(() => {
    const saved = localStorage.getItem("ganttCurrentDate");
    return saved ? new Date(saved) : new Date();
  });

  const handleSetCurrentDate = (date) => {
    localStorage.setItem("ganttCurrentDate", date.toISOString());
    setCurrentDate(date);
  };

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

  const normalize = (value) =>
    String(value ?? "")
      .trim()
      .toUpperCase();

  const isValidChantier = (chantier) => {
    if (!chantier) return false;
    const nom = String(chantier.nom ?? "").trim();
    return nom !== "" && nom !== "??";
  };

  const isHorsGantt = (aff, chantier) => {
    const type = normalize(aff?.typeAffectation);
    const source = normalize(aff?.source);

    if (!isValidChantier(chantier)) return true;
    if (type === "HORS_GANTT") return true;
    if (source === "GOOGLE" && type === "HORS_GANTT") return true;

    return false;
  };

  const getChantierColor = (chantierId) => {
    if (colorMap[chantierId]) return colorMap[chantierId];

    const colors = Object.values(colorMap);
    const numericId = Number(chantierId);

    if (!numericId || Number.isNaN(numericId)) return colors[0];
    return colors[numericId % colors.length];
  };

  const getLetters = (aff, chantier) => {
    if (isHorsGantt(aff, chantier)) return "";

    const nom = String(chantier?.nom ?? "").trim();
    return nom.substring(0, 2).toUpperCase();
  };

  const getLabel = (aff, chantier) => {
    if (isHorsGantt(aff, chantier)) return "";

    const tache = String(aff?.tache ?? "").trim();
    if (!tache || normalize(tache) === "ND") return "";
    return tache;
  };

  const parseDate = (dateStr) => {
    if (!dateStr) return null;

    if (dateStr instanceof Date) {
      const d = new Date(dateStr);
      return Number.isNaN(d.getTime()) ? null : d;
    }

    const str = String(dateStr);

    if (str.includes("T")) {
      const d = new Date(str);
      return Number.isNaN(d.getTime()) ? null : d;
    }

    if (str.includes("-")) {
      const [y, m, d] = str.split("-");
      const date = new Date(Number(y), Number(m) - 1, Number(d));
      return Number.isNaN(date.getTime()) ? null : date;
    }

    if (str.includes("/")) {
      const [d, m, y] = str.split("/");
      const date = new Date(Number(y), Number(m) - 1, Number(d));
      return Number.isNaN(date.getTime()) ? null : date;
    }

    const date = new Date(str);
    return Number.isNaN(date.getTime()) ? null : date;
  };

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
  const weekStart = allDates[0];
  const weekEnd = new Date(allDates[allDates.length - 1]);
  weekEnd.setHours(23, 59, 59, 999);

  React.useEffect(() => {
    if (!onControlsReady) return;

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
      weekText: `Semaine du ${allDates[0].toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short"
      })} au ${allDates[19].toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short"
      })}`
    });
  }, [currentDate, onControlsReady]);

  const formatShortDate = (date) => {
    const days = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
    const d = String(date.getDate()).padStart(2, "0");
    return `${days[date.getDay()]} ${d}`;
  };

  const isAffectationInWeek = (aff) => {
    const affStart = parseDate(aff.dateDebut);
    const affEnd = parseDate(aff.dateFin);

    if (!affStart || !affEnd) return false;

    affStart.setHours(0, 0, 0, 0);
    affEnd.setHours(23, 59, 59, 999);

    return affStart <= weekEnd && affEnd >= weekStart;
  };

  const isVisibleOnDay = (aff, date) => {
    const affStart = parseDate(aff.dateDebut);
    const affEnd = parseDate(aff.dateFin);

    if (!affStart || !affEnd) return false;

    affStart.setHours(0, 0, 0, 0);
    affEnd.setHours(23, 59, 59, 999);

    const day = new Date(date);
    day.setHours(12, 0, 0, 0);

    return day >= affStart && day <= affEnd;
  };

  const getRankOnDay = (aff, date, list) => {
    const overlapping = list
      .filter((item) => isVisibleOnDay(item, date))
      .sort((a, b) => Number(a.id) - Number(b.id));

    return Math.max(
      0,
      overlapping.findIndex((item) => String(item.id) === String(aff.id))
    );
  };

  const normaliserNomOuvrier = (nom) =>
    String(nom || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toUpperCase();

  const ordreOuvriers = [
    "KEVIN",
    "JIMMY",
    "ALEXANDRE",
    "ALEXIS",
    "MOMO",
    "MOHAMED",
    "ABOUL",
    "MORVAN",
    "BRAHIM",
    "MARTIN",
    "STEPHANE",
    "EQUIPE UMAR",
    "NORDINE"
  ];

  const ouvriersActifs = ouvriers
    .filter((o) => o.statut === "Actif")
    .sort((a, b) => {
      const nomA = normaliserNomOuvrier(a.nom);
      const nomB = normaliserNomOuvrier(b.nom);
      let indexA = ordreOuvriers.indexOf(nomA);
      let indexB = ordreOuvriers.indexOf(nomB);
      if (indexA === -1) indexA = ordreOuvriers.length - 1;
      if (indexB === -1) indexB = ordreOuvriers.length - 1;
      return indexA - indexB;
    });

  const chantiersActifs = chantiers.filter((c) => c.statut === "Actif");
  const gridTemplate = "repeat(20, minmax(50px, 1fr))";

  return (
    <div style={{ padding: "1rem", flex: 1, display: "flex", flexDirection: "column" }}>
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
        {chantiersActifs.map((chantier) => (
          <div key={chantier.id} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div
              style={{
                width: "10px",
                height: "10px",
                backgroundColor: getChantierColor(chantier.id),
                borderRadius: "2px",
                flexShrink: 0
              }}
            />
            <span style={{ color: "#4b5563", fontWeight: 500 }}>{chantier.nom}</span>
          </div>
        ))}
      </div>

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
        <div style={{ display: "flex", borderBottom: "1px solid #d1d5db", height: "40px", flexShrink: 0 }}>
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

        {ouvriersActifs.map((ouvrier, idx) => {
          const affectsByOuvrier = affectations.filter(
            (a) => Number(a.ouvrierID) === Number(ouvrier.id) && isAffectationInWeek(a)
          );

          const rowBackground = idx % 2 === 0 ? "white" : "#f3f4f6";

          return (
            <div key={ouvrier.id}>
              <div style={{ display: "flex", height: "45px", background: rowBackground }}>
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
                  <div style={{ fontSize: 8, color: "#9ca3af" }}>{ouvrier.metier}</div>
                </div>

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
                      onClick={() => onAddAffectation(ouvrier.id, date)}
                      style={{
                        borderRight:
                          (dayIdx + 1) % 5 === 0 && dayIdx < 19
                            ? "3px solid #1e3a8a"
                            : dayIdx < 19
                            ? "1px solid #d1d5db"
                            : "none",
                        position: "relative",
                        cursor: "pointer",
                        padding: "1px",
                        overflow: "hidden"
                      }}
                    >
                      {affectsByOuvrier.map((aff) => {
                        if (!isVisibleOnDay(aff, date)) return null;

                        const chantier = chantiers.find(
                          (c) => Number(c.id) === Number(aff.chantierId)
                        );

                        const horsGantt = isHorsGantt(aff, chantier);
                        const lettres = getLetters(aff, chantier);
                        const label = getLabel(aff, chantier);
                        const rank = getRankOnDay(aff, date, affectsByOuvrier);
                        const topOffset = rank * 20 + 1;

                        return (
                          <div
                            key={aff.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onAffectationClick(aff);
                            }}
                            style={{
                              position: "absolute",
                              left: 1,
                              right: 1,
                              top: `${topOffset}px`,
                              cursor: "pointer",
                              zIndex: 2
                            }}
                          >
                            <div
                              title={
                                horsGantt
                                  ? aff.nomExterne || "Événement Google"
                                  : `${chantier?.nom || ""} — cliquer pour modifier`
                              }
                              style={{
                                width: "100%",
                                height: "18px",
                                backgroundColor: horsGantt
                                  ? "#D1D5DB"
                                  : getChantierColor(chantier?.id),
                                border: horsGantt
                                  ? "1px solid #9CA3AF"
                                  : "1px solid rgba(0,0,0,0.2)",
                                borderRadius: 2,
                                boxSizing: "border-box",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: horsGantt ? "transparent" : "white",
                                fontWeight: 800,
                                fontSize: 10
                              }}
                            >
                              {horsGantt ? "" : lettres}
                            </div>

                            {!horsGantt && label && (
                              <div
                                style={{
                                  fontSize: 7,
                                  fontWeight: 600,
                                  color: "#374151",
                                  textAlign: "center",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  lineHeight: 1
                                }}
                              >
                                {label}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ height: "1px", background: "#d1d5db", width: "100%" }} />
            </div>
          );
        })}
      </div>
    </div>
  );
};
