(function(){
  'use strict';

  /*
    PASSERELLE PLANNING -> YAYA DÉSACTIVÉE.

    Règle d'architecture :
    - Yaya est la source d'identité des chantiers.
    - Planning ne crée, ne renomme et ne réécrit plus de chantier dans Yaya.
    - La création automatique se fait uniquement dans le sens Yaya -> Planning.

    Ce fichier reste chargé pour compatibilité avec le build actuel, mais il
    n'installe plus aucun MutationObserver et n'effectue aucun appel réseau.
  */

  window.__abPlanningYayaReverseSyncDisabled = true;
})();
