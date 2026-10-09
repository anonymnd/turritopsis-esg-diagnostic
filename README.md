# Turritopsis ESG Diagnostic

Application de diagnostic ESG pour les PME marocaines. Elle accompagne l’entreprise dans la description de ses pratiques, la collecte de justificatifs, l’analyse assistée par IA et la soumission d’un dossier à un réviseur humain. Le score final et les recommandations sont confirmés par ce réviseur.

## État actuel

État vérifié le **9 octobre 2026**. Le code local contient des fonctionnalités qui ne sont pas encore déployées sur le backend de production.

| Élément | Situation |
| --- | --- |
| Frontend React/TypeScript et nouveau design | Publiés sur Vercel |
| Landing page, connexion et inscription en pop-up | Publiées ; affichage mobile vérifié |
| Dashboard, profil, questionnaire, preuves, analyse et rapport redesignés | Publiés |
| Backend ASP.NET Core : comptes, entreprises, dossiers et revue humaine | Déployé sur Render |
| Groq avec `openai/gpt-oss-20b` | Configuré sur Render ; analyse synthétique réussie via l’API de production |
| Backend modulaire et architecture hexagonale | Implémentés localement ; publication restante |
| Projection de confidentialité avant les appels IA | Implémentée et testée localement ; pas encore déployée sur Render |
| Preuves figées, révisions et historique des décisions | Backend et migrations disponibles localement ; interface publiée, mais nécessite ce backend pour fonctionner en production |
| Notifications internes, outbox et file de push | Backend disponible localement ; interface publiée |
| Firebase Cloud Messaging | Intégration préparée ; projet Firebase et configuration encore nécessaires |
| GitHub Actions, tests de modules et parcours Playwright | Préparés localement ; workflow non encore publié |

**Site :** [Turritopsis ESG Diagnostic](https://turritopsis-esg-diagnostic.vercel.app/)

**API de production :** [API Render](https://turritopsis-api.onrender.com/api/v1)

Le frontend publié correspond au commit `9c14f4c` de la branche `production-brunch`. Le backend Render utilise actuellement le commit `380a2fe` de `main`, avec une configuration Groq mise à jour séparément.

## Stack et architecture

- **Frontend :** React, TypeScript, Vite, React Router et TanStack Query.
- **Backend :** C#, ASP.NET Core .NET 8, Entity Framework Core et Npgsql.
- **Base de données :** PostgreSQL pour les comptes, entreprises, réponses, dossiers et pièces jointes.
- **Authentification :** ASP.NET Core Identity, jetons JWT et contrôles d’accès côté serveur.
- **IA :** API Groq compatible OpenAI ; modèle de production `openai/gpt-oss-20b`.
- **Emails :** adaptateur Resend, activable par configuration.
- **Push :** Firebase Cloud Messaging et file persistante PostgreSQL, à configurer et livrer.

L’architecture locale est un **monolithe modulaire avec architecture hexagonale**. Les modules métier sont Identity, Companies, Diagnostics, Documents, Reviews, Audit, AI et Administration.

Chaque module possède ses contrats, sa logique métier et ses adaptateurs. Ses contextes EF Core ne gèrent que ses tables. Les échanges entre modules utilisent des interfaces et des DTO ; ils ne passent pas par un accès direct aux tables d’un autre module. La base PostgreSQL est partagée, avec une isolation logique des responsabilités et des vérifications d’appartenance à l’entreprise.

Le backend local utilise notamment Repository, Unit of Work, Facade, State, Domain Events, Transactional Outbox et une séparation des commandes et des lectures. Aucun pattern Strategy n’a été ajouté.

## Parcours et fonctionnalités

### Accueil et accès

La landing page présente le parcours, les trois piliers ESG et une FAQ dépliable. Le design a été retravaillé avec **UI/UX Pro Max** : identité verte, illustration de la Terre, hiérarchie visuelle, espacements et adaptation aux petits écrans.

Connexion et inscription s’ouvrent en fenêtre modale depuis la landing page. Les formulaires restent également accessibles par URL. La récupération de mot de passe utilise les routes existantes et un email lorsque le service d’envoi est configuré.

### Entreprise

- Création de compte et renseignement du profil entreprise.
- Dashboard avec accès aux étapes du diagnostic.
- Questionnaire de **27 critères**, répartis entre environnement, social et gouvernance.
- Navigation des questions dépliable et regroupement par pilier.
- Enregistrement des réponses et des justifications.
- Ajout de preuves textuelles ou de pièces jointes, avec une limite de **4 Mo** par fichier.
- Analyse assistée des preuves et du dossier.
- Soumission à la revue humaine, consultation du statut et du rapport.
- Affichage distinct des scores déclarés et du score final confirmé ; impression du rapport, notamment vers un PDF.

### Réviseur et administration

L’espace interne permet de consulter les dossiers, examiner les réponses et les preuves, ajouter des notes et valider ou rejeter un dossier avec un score final et des recommandations.

Les droits `reviewer` et `admin` sont attribués côté serveur. Il n’existe pas d’inscription publique permettant de choisir ces rôles. Les contrôles d’accès ne reposent pas uniquement sur les routes React.

### Preuves figées et historique — backend local

Chaque nouvelle soumission crée une révision numérotée avec les réponses, scores déclarés et preuves copiées. Les documents copiés incluent leur texte, leurs métadonnées, leurs pièces jointes et un hash SHA-256.

Modifier ou supprimer un document de travail ne modifie pas sa copie soumise. Les décisions et notes restent liées à leur révision ; une action sur une révision périmée est rejetée. Une pièce jointe référencée dont les octets sont manquants empêche la nouvelle soumission. Les preuves uniquement textuelles restent acceptées.

Les anciens dossiers ne reçoivent aucune révision historique inventée. Ils affichent **« Original submitted documents were not preserved. »** Leur prochaine soumission crée la première révision garantie. Aucune suppression automatique des preuves soumises n’est introduite.

### Confidentialité IA — backend local

La projection locale réduit les preuves à des critères publics, des scores déclarés et des signaux booléens avant tout appel externe. Le texte brut et les pièces jointes restent disponibles pour les utilisateurs autorisés et les réviseurs humains, sans être transmis au fournisseur IA par ce nouveau chemin.

**Cette protection n’est pas encore active sur le backend Render actuellement déployé.** Les tests Groq effectués en production ont utilisé uniquement des données synthétiques. Sa mise en production nécessite la livraison du backend modulaire.

### Notifications — implémentation locale

Les événements métier passent par une outbox transactionnelle. Les notifications internes et les tâches de push sont persistées dans PostgreSQL, avec reprise après redémarrage, tentatives différées et conservation des échecs définitifs.

Firebase sert uniquement à la messagerie push ; l’application ne lui délègue ni l’authentification ni sa base de données. Les push contiennent des identifiants de routage et un message générique. Leur activation demande une configuration Firebase serveur et web ainsi que le consentement du navigateur.

## Routes actuelles

| Accès | Routes |
| --- | --- |
| Accueil | `/` |
| Connexion / inscription en pop-up | `/?auth=login`, `/?auth=signup` |
| Formulaire autonome | `/auth?tab=login`, `/auth?tab=signup` |
| Mot de passe oublié / nouveau mot de passe | `/auth?tab=forgot`, `/auth/reset-password` |
| Entreprise | `/app`, `/app/company-info`, `/app/questionnaire`, `/app/proofs`, `/app/analysis`, `/app/report` |
| Connexion interne | `/review/login` |
| Réviseur | `/reviewer`, `/reviewer/all`, `/reviewer/dossiers/:dossierId` |
| Administration | `/reviewer/admin` et ses sous-routes |

## Développement local

Prérequis : **Node.js 24**, **.NET 8** et **PostgreSQL**. Exécuter les commandes depuis la racine du projet.

```powershell
npm --prefix frontend ci
if (-not (Test-Path backend/src/Turritopsis.Api/appsettings.Development.json)) {
    Copy-Item backend/src/Turritopsis.Api/appsettings.Development.json.example backend/src/Turritopsis.Api/appsettings.Development.json
}
```

Ne recopier le fichier de configuration que s’il n’existe pas déjà. Renseigner ensuite la connexion PostgreSQL et une clé JWT privée d’au moins 32 octets. Les migrations sont appliquées au démarrage de l’API.

Pour démarrer PostgreSQL avec Docker, si le port 5432 est disponible :

```powershell
docker compose -f backend/docker-compose.yml up -d
```

Dans un premier terminal, démarrer le backend en mode local sans appels externes :

```powershell
$env:Ai__AllowRemote='false'
$env:Email__Enabled='false'
$env:FrontendOrigins='http://127.0.0.1:5173,http://localhost:5173'
npm run dev:api
```

Dans un second terminal :

```powershell
npm run dev
```

- Frontend : http://127.0.0.1:5173/
- API : http://localhost:5006/api/v1
- Autre backend : configurer `VITE_API_BASE_URL` dans `frontend/.env.local`, puis redémarrer Vite.

## Configuration

Les paramètres privés appartiennent au backend. Ne jamais placer une clé fournisseur IA, une clé JWT ou un compte de service Firebase dans une variable `VITE_*` ou dans Git.

| Variable serveur | Usage |
| --- | --- |
| `ConnectionStrings__Default` | Connexion PostgreSQL |
| `Jwt__Key`, `Jwt__Issuer`, `Jwt__Audience` | Signature et validation des JWT |
| `FrontendOrigins` | Origines CORS autorisées |
| `Frontend__BaseUrl` | URL publique utilisée notamment pour les liens de récupération |
| `Ai__Provider` | `groq` |
| `Ai__BaseUrl` | `https://api.groq.com/openai/v1` |
| `Ai__Model` | `openai/gpt-oss-20b`, testé en production |
| `Ai__ApiKey` | Clé privée Groq |
| `Ai__AllowRemote` | `false` pour désactiver les appels externes dans le backend modulaire |
| `Email__Enabled`, `Email__ApiKey`, `Email__FromAddress` | Configuration Resend |
| `Firebase__Enabled`, `Firebase__ProjectId`, `Firebase__CredentialsPath` | Configuration serveur des push |

Les valeurs publiques Firebase `VITE_FIREBASE_*` et la clé VAPID publique sont documentées dans `frontend/.env.example` et le guide Firebase.

Sans clé IA, ou en cas d’échec du fournisseur, une analyse heuristique de secours reste disponible. **Une réponse HTTP 200 ne prouve donc pas à elle seule qu’un appel Groq a réussi.** Le modèle historique `llama-3.3-70b-versatile` a retourné `model_not_found` lors de la vérification ; la production a été corrigée. Les valeurs par défaut locales doivent être surchargées pour utiliser le modèle testé.

## Build et vérifications

```powershell
npm run build
npm run lint
npm run build:api
npm run check:architecture
npm run test:privacy
npm run test:modules
npm run test:push
```

`npm run check` regroupe ces contrôles. `npm run preview` prévisualise le build du frontend.

Les tests PostgreSQL et navigateur demandent une instance de test séparée. Configurer `TURRITOPSIS_TEST_CONNECTION` avec un compte autorisé à créer des bases jetables, puis exécuter :

```powershell
npm run test:modules:db
npm --prefix frontend exec -- playwright install chromium
npm run test:e2e
```

Les parcours Chromium couvrent la soumission, la revue, les copies figées, les révisions et l’isolation entre entreprises. Ils utilisent des comptes synthétiques et désactivent IA externe, email et Firebase.

Le workflow local `.github/workflows/ci.yml` prévoit ces contrôles sur les pushes et pull requests, avec PostgreSQL jetable. Les rapports et traces des échecs navigateur sont conservés trois jours. Il reste à publier le workflow et à configurer les contrôles requis avant fusion.

## Déploiement

```text
Navigateur → Vercel (React) → Render (ASP.NET Core) → PostgreSQL
                                  ↓
                            Groq / Resend
```

La version locale ajoute une file PostgreSQL et l’adaptateur Firebase pour les notifications.

- **Vercel :** Root Directory `frontend`, build `npm run build`, sortie `dist`, routes SPA dans `frontend/vercel.json`.
- **API du frontend :** `VITE_API_BASE_URL=https://turritopsis-api.onrender.com/api/v1`.
- **Render :** service Docker `turritopsis-api`, Root Directory `backend`, Dockerfile `backend/Dockerfile` ; secrets configurés sur Render.
- La publication du frontend ne livre pas les modifications locales du backend. Les modules, migrations, tests et protections encore locaux doivent être validés et publiés ensemble avant d’activer les fonctionnalités associées en production.

L’ancien prototype Node/Ollama, ses fonctions API Vercel, ses scripts SQL Supabase et ses interrupteurs Stripe ne décrivent plus la version actuelle. Le paiement, le paywall et le certificat payant ne sont pas des fonctionnalités actives de cette version.

## Structure du projet local

```text
frontend/
  src/app/                 Routes, layouts et contrôles d’accès
  src/features/            Fonctionnalités, pages, styles et contrats
  src/shared/              Client HTTP, sessions et composants réutilisables
  public/images/dashboard/ Illustrations du dashboard et de la landing page
  tests/                   Tests de notifications push
  e2e/                     Parcours Playwright
backend/
  src/Turritopsis.Api/      Contrôleurs et composition de l’application
  src/Modules/             Cœurs métier et adaptateurs des modules
  src/Turritopsis.SharedKernel/ Contrats d’intégration entre modules
  src/Turritopsis.Infrastructure/ Persistance et migrations combinées
  tests/                   Confidentialité, modules et hôte E2E
.github/workflows/ci.yml    Contrôles CI préparés localement
scripts/check-architecture.mjs
docs/                     Architecture, UML et guides de fonctionnement
```

## Documentation

- [Architecture et frontières des modules](docs/architecture.md)
- [Galerie UML](docs/uml/index.html)
- [Protection des données avant l’IA](docs/AI-DATA-PRIVACY.md)
- [Preuves figées, révisions et CI](docs/FROZEN-EVIDENCE.md)
- [Firebase et file de notifications](docs/FIREBASE-PUSH-SETUP.md)
