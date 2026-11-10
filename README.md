# ArchCanvas v2 — Eleventy + Nicolabz Identity

Éditeur de schémas d'architecture technique, statique, sans framework frontend : **Eleventy 3, HTML/Nunjucks, CSS natif, JavaScript ES modules**. Il reprend le moteur de tableau blanc du POC v1 et les conventions de `Diuxx/budget-nicolabz`.

## Fonctionnalités

- 54 pictogrammes SVG originaux : 18 généralistes + 36 cloud (conteneurs, Docker/Podman/Kubernetes, serverless, fonctions, événements, réseaux, stockage, CI/CD).
- Drag & drop sur le tableau, sélection multiple de composants avec Ctrl/Cmd ou Maj + clic puis déplacement groupé, clusters rectangulaires transparents au contour pointillé (outil G), dessinés par glisser sur le tableau, déplaçables et renommables, exportés en JSON/PNG et placés derrière cartes et connexions. Connexions depuis quatre points d’accroche avec styles configurables, possibilité de masquer les points d’accroche et export PNG sans ces points, zoom et déplacement du canevas.
- Clic droit **sur un composant** : renommer, dupliquer, commencer une connexion, changer la couleur, supprimer.
- Clic droit **sur une connexion** : modifier le libellé, inverser le sens, supprimer.
- Clic droit **sur le tableau** : ajouter une note, une fonction, un conteneur, ajuster la vue, exporter JSON.
- Sélection, annuler/rétablir, raccourcis clavier, import de SVG personnels (filtrage), import/export JSON, export PNG.
- Sauvegarde locale automatique. Import automatique de l'ancien stockage local `archcanvas-poc-v1` si présent dans ce même navigateur et cette même origine.
- Module Google avec avatar en haut à droite ; **Nicolabz Identity est le seul serveur d'authentification** ; consentement Drive et synchronisation du **schéma courant** déclenchée manuellement.
- En cas de divergence local/Drive, l'utilisateur choisit explicitement quel schéma conserver. Écriture versionnée (CAS, HTTP 409 en cas de conflit), pas de fusion automatique.

## Démarrer

Pré-requis : Node.js 20+ et npm.

```bash
npm install
npm run dev
```

Ouvrir **http://localhost:8081**. `lancer.bat` (Windows) et `./lancer.sh` (Linux/macOS) sont aussi disponibles.

```bash
npm test        # tests unitaires Node
npm run build   # export statique vers dist/
npm run check   # tests + build
```

Le tableau blanc fonctionne entièrement en local **sans l'API Google**. Il ne nécessite pas de backend permanent : `dist/` peut être servi par Nginx.

## Connexion Google : réutiliser l'API existante

Cette V2 **ne crée pas** de second serveur OAuth et n'embarque ni Client ID, ni Client Secret, ni jeton Google.

Dans le `.env` du dépôt **`Diuxx/nodjs-google-auth`**, ajoute l'application à `CLIENT_APPS_JSON` **en conservant** celles déjà définies :

La déclaration des origines doit être unique par application. Si le budget utilise déjà `localhost:8081`, il faut déplacer l'un des deux ports. Exemple en supposant le budget sur `localhost:8082` :

```dotenv
CLIENT_APPS_JSON=[{"id":"budget","origins":["http://localhost:8082","https://budget.nicolabz.dev"]},{"id":"archcanvas","origins":["http://localhost:8081","https://archcanvas.nicolabz.dev"]}]
```

Pour l'authentification en développement, l'API doit fonctionner sous `http://localhost:3000` et avoir ses callbacks OAuth Google configurés. En production, utiliser `https://auth.nicolabz.dev`, `https://archcanvas.nicolabz.dev` et HTTPS. Adapter `src/scripts/config/identity.js` si nécessaire. Le bouton de connexion passe par :

- `GET /auth/google/start?app=archcanvas&return_to=...` ;
- `GET /api/session` avec `credentials: 'include'` pour confirmer la session ;
- `GET /auth/drive/start?app=archcanvas&return_to=...` pour le consentement Drive ;
- `GET/PUT /api/sync/archcanvas` pour le JSON versionné ;
- `POST /api/logout` pour la déconnexion.

**Attention :** un compte Google connecté ne signifie pas que Drive a été autorisé. Le bouton « Synchroniser le schéma » n'est actif qu'après l'autorisation Drive.

## Conflits, stockage et limites

- **LocalStorage** est propre au navigateur / origine et **pas** à un compte Google. Si plusieurs personnes utilisent le même navigateur, leurs données locales peuvent être visibles les unes aux autres.
- **Un seul schéma courant par compte** est synchronisé dans l'espace privé `appDataFolder` du Drive. Pour plusieurs schémas, conserver des exports JSON ou faire évoluer ensuite le modèle de données.
- La synchro n'est pas collaborative / temps réel. Si deux appareils modifient simultanément, un `409` bloque l'écrasement et demande une nouvelle synchronisation.
- Le chargement de Google Drive remplace le schéma local **uniquement après une confirmation explicite** lorsque les contenus diffèrent.
- L'API actuelle limite les JSON à 1 Mio : le POC possède 400 nœuds / 1000 connexions / 50 SVG importés maximum. Si trop de SVG sont incorporés, un export JSON peut dépasser le plafond API.
- L'import SVG supprime les scripts, les événements inline et les références externes courantes, mais une stratégie de sanitization auditée reste recommandée avant une mise en ligne grand public.
- Les comptes Google n'ont pas été vérifiés en conditions réelles ici : adapter les origines dans l'API et les URI Google Cloud, puis tester la connexion et le consentement avec ton propre serveur.

## Structure

```text
_data/                       Données Eleventy au build
_includes/layout.njk          Layout partagé
index.html                   Interface du tableau (front matter)
eleventy.config.js           Passthrough vers dist/
src/styles/                 CSS natif, v1 + ajouts v2
src/scripts/app.js           Éditeur, interactions et sauvegarde locale
src/scripts/config/identity.js
src/scripts/core/sync-plan.js
src/scripts/services/identity-api.js
src/scripts/services/identity-sync.js
src/scripts/ui/context-menu.js
src/scripts/ui/identity-ui.js
src/scripts/icons.js        18 pictogrammes d'origine
src/scripts/cloud-icons.js  36 pictogrammes cloud
src/assets/icons/           Sources SVG indépendantes
tests/                      Tests Node natifs
```

**Dépannage :** si Google renvoie `ORIGIN_FORBIDDEN` ou `INVALID_RETURN_URL`, vérifier que l'origine exacte du frontend se trouve bien dans `CLIENT_APPS_JSON`. Utiliser `localhost` partout en développement, sans mélanger avec `127.0.0.1`. Pour un échec de synchro, vérifier la permission `drive.appdata`, la taille du JSON et les éventuels `409`.
