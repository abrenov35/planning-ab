import React from "react";
import { GanttChart } from "./GanttChart";

const HIDDEN_GANTT_COLOR = "#9CA3AF";
const isHidden = chantier => String(chantier?.couleur || "").trim().toUpperCase() === HIDDEN_GANTT_COLOR;

export const GanttChartPolicy = ({ chantiers = [], affectations = [], ...props }) => {
  const hiddenIds = new Set(
    chantiers.filter(isHidden).map(chantier => String(chantier.id))
  );
  const visibleChantiers = chantiers.filter(chantier => !isHidden(chantier));
  const visibleAffectations = affectations.filter(affectation => {
    const chantierId = String(affectation?.chantierId || "");
    return !chantierId || !hiddenIds.has(chantierId);
  });

  return (
    <GanttChart
      {...props}
      chantiers={visibleChantiers}
      affectations={visibleAffectations}
    />
  );
};
