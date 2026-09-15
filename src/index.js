import React from 'react';
import ReactDOM from 'react-dom/client';
import './free-affectation-colors.css';

// Neutralise l'ancienne file locale de suppressions AVANT de charger App/api.js.
// Une file conservée dans un navigateur pouvait rejouer une suppression ancienne
// et effacer une affectation recréée depuis un autre poste.
try {
  localStorage.removeItem('abPlanningDeleteQueueV1');
} catch (_) {}

const root = ReactDOM.createRoot(document.getElementById('root'));

import('./App').then(({ default: App }) => {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
