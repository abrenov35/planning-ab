import React from "react";
import { GanttChart } from "./GanttChart";

const HIDDEN_GANTT_COLOR = "#9CA3AF";
const isHidden = chantier => String(chantier?.couleur || "").trim().toUpperCase() === HIDDEN_GANTT_COLOR;

export const GanttChartPolicy = ({ chantiers = [], affectations = [], ...props }) => {
  // Gris masque seulement les chantiers non planifiés, jamais une affectation.
  const assignedIds = new Set(affectations.map(affectation => String(affectation?.chantierId || "")));
  const visibleChantiers = chantiers.filter(chantier => !isHidden(chantier) || assignedIds.has(String(chantier.id)));

  return (
    <GanttChart
      {...props}
      chantiers={visibleChantiers}
      affectations={affectations}
    />
  );
};
