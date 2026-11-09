# Architecture V2

```text
Browser / Eleventy static (Nginx)
  |-- Editor app (DOM/SVG): localStorage + import/export
  |-- Context Menu (DOM only)
  |-- Identity UI (avatar, login, sync)
          |          credentials: include / HTTPS
          v
     Nicolabz Identity (Node/Fastify)  [NOT INCLUDED]
          |-- Google OpenID Connect + SQLite sessions
          |-- Google Drive appDataFolder
          `-- GET / PUT /api/sync/archcanvas {version,data}
```

Responsabilités : `app.js` gère les nœuds/arêtes et les effets DOM ; `context-menu.js` gère l'accessibilité du menu ; `identity-api.js` assure les requêtes HTTP ; `sync-plan.js` ne dépend ni du navigateur ni du réseau ; `identity-sync.js` orchestre les versions et les choix explicites. L'interface n'accède jamais directement à Google ni aux jetons.

Stockage local : `archcanvas-v2-project`, repris depuis `archcanvas-poc-v1` si nécessaire. Référence de synchronisation par app+user : `archcanvas:identity:anchor:v1:archcanvas:<userId>`. Après un échec de PUT, la référence n'est pas mise à jour.

Évolutions proposées : bibliothèque de schémas multiples, groupes de composants (zones réseau / clusters), sélection multiple, snap-to-grid, export SVG, gestion fine des icônes importées, tests E2E navigateur.
