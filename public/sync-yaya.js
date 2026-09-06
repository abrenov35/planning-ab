(function(){
  'use strict';

  /*
    PASSERELLE PLANNING -> YAYA DÉSACTIVÉE.

    Règle d'architecture :
    - Yaya est la source d'identité des chantiers.
    - Planning ne crée, ne renomme et ne réécrit plus de chantier dans Yaya.
    - La création automatique se fait uniquement dans le sens Yaya -> Planning.
  */
  window.__abPlanningYayaReverseSyncDisabled = true;

  /*
    Rafraîchissement de version : Safari iOS peut conserver longtemps
    l'ancien index et l'ancien bundle. Ce contrôle utilise version.json avec
    cache désactivé puis recharge l'application sur une URL versionnée.
  */
  var VERSION_PARAM = 'abv';
  var VERSION_URL = '/planning-ab/version.json?_=' + Date.now();

  fetch(VERSION_URL, { cache: 'no-store' })
    .then(function(response) {
      if (!response.ok) throw new Error('version indisponible');
      return response.json();
    })
    .then(function(data) {
      var published = String((data && data.version) || '').trim();
      if (!published) return;

      var url = new URL(window.location.href);
      var loaded = url.searchParams.get(VERSION_PARAM);
      if (loaded === published) return;

      url.searchParams.set(VERSION_PARAM, published);
      url.searchParams.set('_refresh', String(Date.now()));
      window.location.replace(url.toString());
    })
    .catch(function() {
      // Ne jamais bloquer Planning si le contrôle de version échoue.
    });
})();
