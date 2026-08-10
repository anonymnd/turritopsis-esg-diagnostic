# Turritopsis ESG Diagnostic

Application React/Vite pour le diagnostic ESG interactif des PME. Elle couvre le profil entreprise, le questionnaire E/S/G adapte au secteur, la collecte de preuves, l'analyse IA des documents, le mini-audit par pratique, un espace reviewer et le rapport ESG.

## Version 1.0

Fonctionnel aujourd'hui :

- parcours entreprise avec creation de compte et profil PME ;
- questionnaire ESG avec niveaux guides, preuves et justification ;
- upload ou saisie de documents de preuve ;
- scan IA/heuristique des preuves par pratique ;
- analyse globale du dossier ;
- rapport ESG consultable ;
- sauvegarde du dossier dans Supabase ;
- espace reviewer separe et protege par role.

Prepare mais garde desactive :

- paiement Stripe ;
- certificat payant ;
- paywall du rapport.

## Parcours

- **Public** (`/`) : presentation du diagnostic et de la methode.
- **Entreprise** (`/auth/enterprise`, `/onboarding`) : creation de l'espace entreprise et profil.
- **Espace PME** (`/app`, `/app/questionnaire`, `/app/proofs`, `/app/analysis`, `/app/report`) : dashboard, questionnaire, documents, analyse IA et rapport.
- **Reviewer** (`/review`, `/review/dossiers`, `/admin/questionnaire`) : validation des dossiers cote analyste.

## Developpement local

```bash
npm install
npm run dev
```

L'application locale utilise par defaut :

```text
http://127.0.0.1:5174
```

## Environnements

Test/local :

```env
VITE_APP_ENV=test
VITE_ENABLE_TEST_TOOLS=true
VITE_ENABLE_PAYMENTS=false
AUTH_REQUIRED=false
ENABLE_PAYMENTS=false
```

Production :

```env
VITE_APP_ENV=production
VITE_ENABLE_TEST_TOOLS=false
VITE_ENABLE_PAYMENTS=false
AUTH_REQUIRED=true
ENABLE_PAYMENTS=false
```

Important : `VITE_ENABLE_TEST_TOOLS=true` garde les boutons de test comme `Remplir test` et `Documents test`. En production, il doit rester `false`.

## API locale Ollama

```bash
npm run api:ollama
```

## API cloud-compatible

```bash
npm run api:hosted
```

Le projet contient aussi des fonctions Vercel dans `api/`, pour deployer le frontend et le backend au meme endroit quand Render demande une carte bancaire.

## Paiement Stripe

La logique paiement/certificat est preparee, mais elle reste desactivee par defaut avec deux interrupteurs :

```env
VITE_ENABLE_PAYMENTS=false
ENABLE_PAYMENTS=false
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
DIAGNOSTIC_PRICE_CENTS=99000
DIAGNOSTIC_CURRENCY=mad
```

Avec `VITE_ENABLE_PAYMENTS=false`, l'application ne montre pas le bouton de paiement et ne bloque pas le rapport. Avec `ENABLE_PAYMENTS=false`, le backend refuse aussi la creation de session Stripe et le webhook.

Pour activer Stripe plus tard :

1. Executer le bloc `certificates` dans `supabase/schema.sql`.
2. Mettre `VITE_ENABLE_PAYMENTS=true` et `ENABLE_PAYMENTS=true`.
3. Ajouter `STRIPE_SECRET_KEY` et `STRIPE_WEBHOOK_SECRET`.
4. Configurer le webhook Stripe `checkout.session.completed` vers `/api/stripe-webhook`.
5. Redeployer Vercel.

## Roles

Chaque compte a un role stocke dans `app_metadata.role` (jamais `user_metadata`, que le SDK client peut modifier lui-meme). Une inscription via `/auth/enterprise` recoit automatiquement `pme` si aucun role n'existe encore (voir `api/finalize-signup.js`) ; c'est aussi la valeur par defaut si le role n'est pas encore defini.

`/review*` exige `reviewer` ou `admin`. `/admin/questionnaire` exige `admin`. Il n'existe aucune inscription libre-service vers ces roles. Pour promouvoir un compte, aller dans Supabase > Authentication > Users > editer l'utilisateur > `app_metadata` > ajouter `{"role": "reviewer"}` ou `{"role": "admin"}`.

## Build

```bash
npm run build
npm run build:test
npm run build:production
npm run preview
```

## Deploiement

Architecture cible initiale :

```text
Vercel frontend -> Render backend -> Supabase database -> Hosted AI API
```

Architecture gratuite utilisee si Render bloque sur la carte bancaire :

```text
Vercel frontend + API functions -> Supabase database -> Hosted AI API
```

Voir :

- `docs/esg-app-planning/DEPLOYMENT.md`
- `docs/esg-app-planning/OLLAMA_INTEGRATION.md`

## Structure

- `src/main.jsx` - logique applicative, scoring, documents, analyse IA et routing.
- `src/styles.css` - design system et styles.
- `scripts/hosted-api.js` - backend deployable Render/Fly avec API IA compatible OpenAI et Supabase.
- `api/` - backend serverless deployable sur Vercel.
- `scripts/ollama-api.js` - backend local Ollama.
- `supabase/schema.sql` - schema MVP de sauvegarde des dossiers et certificats.
- `render.yaml` - configuration Render.
- `vercel.json` - configuration Vercel.
