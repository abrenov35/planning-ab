import React, { useState, useEffect } from 'react';

const API_URL = 'https://script.google.com/macros/s/AKfycbz7IWFiAMHwqw_VbCKcM8aDe09TWlquQW5mj1Yw9m9hKPYZLdedHk8jU3-iEsv1_4GN1w/exec';

const COLORS = {
  primary: '#1e3a8a',
  secondary: '#f59e0b',
  light: '#f3f4f6',
  green: '#10b981',
  red: '#ef4444',
  blue: '#3b82f6',
};

const SALARIES = [
  { id: 1, nom: 'Kevin' },
  { id: 2, nom: 'Jimmy' },
  { id: 3, nom: 'Alexandre' },
  { id: 4, nom: 'Aboul' },
  { id: 5, nom: 'Momo' },
  { id: 6, nom: 'Alexis' },
  { id: 7, nom: 'Morvan' },
  { id: 8, nom: 'Stéphane' },
  { id: 9, nom: 'Brahim' },
  { id: 10, nom: 'Martin' },
  { id: 11, nom: 'Nordine' },
  { id: 12, nom: 'Équipe Umar' },
];

export default function App() {
  const [interventions, setInterventions] = useState([]);
  const [chantiers, setChantiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('Fetching data from API...');
    fetch(`${API_URL}?action=getAll`)
      .then(r => {
        console.log('Response status:', r.status);
        return r.json();
      })
      .then(d => {
        console.log('Data received:', d);
        setInterventions(d.interventions || []);
        setChantiers(d.chantiers || []);
        setLoading(false);
      })
      .catch(e => {
        console.error('API Error:', e);
        setError(e.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: COLORS.light }}>
        <div className="text-center">
          <p className="text-2xl font-bold" style={{ color: COLORS.primary }}>Chargement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: COLORS.light }}>
        <div className="text-center">
          <p className="text-2xl font-bold text-red-600">Erreur: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.light }}>
      {/* Header */}
      <div style={{ backgroundColor: COLORS.primary }} className="text-white p-8 shadow-lg">
        <h1 className="text-5xl font-black mb-2">📅 AB PLANNING</h1>
        <p className="text-lg opacity-90">Gestion des interventions - AB RENOV 35</p>
      </div>

      {/* Contenu */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <div className="text-4xl font-black" style={{ color: COLORS.primary }}>
              {interventions.length}
            </div>
            <div className="text-sm text-gray-600 mt-2">Interventions</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <div className="text-4xl font-black" style={{ color: COLORS.green }}>
              {interventions.filter(i => i.etat === 'EN_COURS').length}
            </div>
            <div className="text-sm text-gray-600 mt-2">En cours</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <div className="text-4xl font-black" style={{ color: COLORS.red }}>
              {interventions.filter(i => i.etat === 'DÉRIVE').length}
            </div>
            <div className="text-sm text-gray-600 mt-2">En dérive</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <div className="text-4xl font-black" style={{ color: COLORS.secondary }}>
              {interventions.length > 0 
                ? Math.round(interventions.reduce((sum, i) => sum + (i.avancement || 0), 0) / interventions.length)
                : 0
              }%
            </div>
            <div className="text-sm text-gray-600 mt-2">Avancement moyen</div>
          </div>
        </div>

        {/* Chantiers */}
        {chantiers.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <p className="text-gray-600">Aucun chantier disponible</p>
          </div>
        ) : (
          chantiers.map(chantier => {
            const chantiersInterventions = interventions.filter(i => i.chantier === chantier.nom);
            
            return (
              <div key={chantier.id} className="bg-white rounded-lg shadow mb-6 overflow-hidden">
                {/* En-tête */}
                <div style={{ backgroundColor: COLORS.primary }} className="text-white p-6">
                  <h2 className="text-2xl font-black">{chantier.nom}</h2>
                  <p className="text-sm opacity-90 mt-1">{chantiersInterventions.length} intervention(s)</p>
                </div>

                {/* Tableau */}
                {chantiersInterventions.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    Aucune intervention pour ce chantier
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr style={{ backgroundColor: COLORS.light }}>
                          <th className="px-6 py-4 text-left font-bold text-sm">Phase</th>
                          <th className="px-6 py-4 text-left font-bold text-sm">Client</th>
                          <th className="px-6 py-4 text-left font-bold text-sm">Début</th>
                          <th className="px-6 py-4 text-left font-bold text-sm">Fin</th>
                          <th className="px-6 py-4 text-left font-bold text-sm">Avancement</th>
                          <th className="px-6 py-4 text-left font-bold text-sm">État</th>
                          <th className="px-6 py-4 text-left font-bold text-sm">Salariés</th>
                        </tr>
                      </thead>
                      <tbody>
                        {chantiersInterventions.map((intervention, idx) => {
                          const getStatusColor = (etat) => {
                            if (etat === 'EN_COURS') return COLORS.green;
                            if (etat === 'DÉRIVE') return COLORS.red;
                            return COLORS.blue;
                          };

                          return (
                            <tr key={intervention.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-6 py-4 font-bold text-sm">{intervention.phase}</td>
                              <td className="px-6 py-4 text-sm">{intervention.client}</td>
                              <td className="px-6 py-4 text-sm">{intervention.debut}</td>
                              <td className="px-6 py-4 text-sm">{intervention.fin}</td>
                              <td className="px-6 py-4">
                                <div className="w-full bg-gray-200 rounded h-6 overflow-hidden">
                                  <div
                                    className="h-full flex items-center justify-center text-white text-xs font-bold"
                                    style={{
                                      backgroundColor: getStatusColor(intervention.etat),
                                      width: `${intervention.avancement || 0}%`,
                                    }}
                                  >
                                    {intervention.avancement > 10 && `${intervention.avancement}%`}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className="px-3 py-1 rounded-full text-xs font-bold text-white inline-block"
                                  style={{ backgroundColor: getStatusColor(intervention.etat) }}
                                >
                                  {intervention.etat}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-wrap gap-2">
                                  {intervention.ressources ? (
                                    String(intervention.ressources).split(',').map((id, idx) => {
                                      const numId = parseInt(id.trim());
                                      const salary = SALARIES.find(s => s.id === numId);
                                      return salary ? (
                                        <span key={idx} className="px-2 py-1 rounded text-xs font-bold text-white" style={{ backgroundColor: COLORS.primary }}>
                                          {salary.nom}
                                        </span>
                                      ) : null;
                                    })
                                  ) : (
                                    <span className="text-xs text-gray-500">-</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
