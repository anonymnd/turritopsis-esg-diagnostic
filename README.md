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

## Build

```bash
npm run build
npm run preview
```

## Deploiement

Architecture cible:

```text
Vercel frontend -> Render backend -> Supabase database -> Hosted AI API
```

Voir:

- `docs/esg-app-planning/DEPLOYMENT.md`
- `docs/esg-app-planning/OLLAMA_INTEGRATION.md`

## Structure

- `src/main.jsx` - logique applicative, scoring, documents, analyse IA et routing.
- `src/styles.css` - design system et styles.
- `scripts/hosted-api.js` - backend deployable Render/Fly avec API IA compatible OpenAI et Supabase.
- `scripts/ollama-api.js` - backend local Ollama.
- `supabase/schema.sql` - schema MVP de sauvegarde des dossiers.
- `render.yaml` - configuration Render.
- `vercel.json` - configuration Vercel.
