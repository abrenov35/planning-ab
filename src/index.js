import React from 'react';
import ReactDOM from 'react-dom/client';
import './free-affectation-colors.css';

// Nettoyage de compatibilité effectué une seule fois avant le chargement de l'app.
// Ces anciennes clés ne sont plus utilisées et ne doivent jamais influencer
// l'affichage ou la suppression d'une affectation.
try {
  localStorage.removeItem('abPlanningDeleteQueueV1');
  localStorage.removeItem('abPlanningDeletedAssignmentsV2');
  localStorage.removeItem('abPlanningDataCacheV1');
} catch (_) {}

const root = ReactDOM.createRoot(document.getElementById('root'));

import('./App').then(({ default: App }) => {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
