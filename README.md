# Turritopsis ESG Diagnostic

Application React/Vite pour le diagnostic ESG interactif des PME. Elle couvre un profil entreprise, un questionnaire E/S/G adapte au secteur, la collecte de preuves, une analyse IA des documents, un mini-audit par pratique, un espace reviewer et un rapport ESG.

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

L'application locale utilise par defaut:

```text
http://127.0.0.1:5174
```

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

La logique paiement/certificat est preparee, mais elle reste desactivee par defaut.

```env
VITE_ENABLE_PAYMENTS=false
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
DIAGNOSTIC_PRICE_CENTS=99000
DIAGNOSTIC_CURRENCY=mad
```

Avec `VITE_ENABLE_PAYMENTS=false`, l'application ne montre pas le bouton de paiement, ne bloque pas le rapport, et n'appelle pas Stripe. Pour activer Stripe plus tard, passer `VITE_ENABLE_PAYMENTS=true`, ajouter une cle `sk_test_...` ou `sk_live_...`, puis configurer le webhook `checkout.session.completed`.

## Rôles

Chaque compte a un rôle stocké dans `app_metadata.role` (jamais `user_metadata`, que le SDK client peut modifier lui-même). Une inscription via `/auth/enterprise` reçoit automatiquement `pme` si aucun rôle n'existe encore (voir `api/finalize-signup.js`) ; c'est aussi la valeur par défaut si le rôle n'est pas encore défini.

`/review*` exige `reviewer` ou `admin`. `/admin/questionnaire` exige `admin`. Il n'existe aucune inscription libre-service vers ces rôles : pour promouvoir un compte, dans Supabase → Authentication → Users → éditer l'utilisateur → `app_metadata` → ajouter `{"role": "reviewer"}` (ou `"admin"`).

## Build

```bash
npm run build
npm run preview
```

## Deploiement

Architecture cible initiale:

```text
Vercel frontend -> Render backend -> Supabase database -> Hosted AI API
```

Architecture gratuite utilisee si Render bloque sur la carte bancaire:

```text
Vercel frontend + API functions -> Supabase database -> Hosted AI API
```

Voir:

- `docs/esg-app-planning/DEPLOYMENT.md`
- `docs/esg-app-planning/OLLAMA_INTEGRATION.md`

## Structure

- `src/main.jsx` - logique applicative, scoring, documents, analyse IA et routing.
- `src/styles.css` - design system et styles.
- `scripts/hosted-api.js` - backend deployable Render/Fly avec API IA compatible OpenAI et Supabase.
- `api/` - backend serverless deployable sur Vercel.
- `scripts/ollama-api.js` - backend local Ollama.
- `supabase/schema.sql` - schema MVP de sauvegarde des dossiers.
- `render.yaml` - configuration Render.
- `vercel.json` - configuration Vercel.
