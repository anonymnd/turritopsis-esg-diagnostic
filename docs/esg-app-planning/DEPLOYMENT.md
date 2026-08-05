# Deploiement Cloud - Turritopsis ESG Diagnostic

Architecture cible:

```text
Vercel frontend -> Render backend -> Supabase database -> Hosted AI API
```

## 1. Supabase

1. Ouvrir Supabase et creer un projet.
2. Aller dans `SQL Editor`.
3. Coller et executer le fichier:

```text
supabase/schema.sql
```

4. Copier:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

La table MVP est `public.esg_snapshots`. Elle sauvegarde tout le dossier ESG en JSON.

## 2. Backend Render

Creer un Web Service Render depuis le repo.

Parametres:

```text
Build command: npm install
Start command: npm run api:hosted
```

Variables Render:

```text
NODE_ENV=production
AI_API_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini
AI_API_KEY=your_ai_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
CORS_ORIGIN=https://your-vercel-app.vercel.app
```

Apres deploiement, tester:

```text
https://your-render-service.onrender.com/api/health
```

## 3. Frontend Vercel

Importer le repo dans Vercel.

Parametres:

```text
Framework: Vite
Build command: npm run build
Output directory: dist
```

Variable Vercel:

```text
VITE_API_BASE_URL=https://your-render-service.onrender.com
```

## 4. Workflow App

1. Entreprise cree son profil.
2. Elle ajoute les documents dans `Preuves`.
3. Elle lance `Scanner les documents`.
4. Le backend appelle l'API IA.
5. Les scores et mini-audits sont affiches.
6. Le dossier peut etre sauvegarde dans Supabase depuis le dashboard.

## Note IA

Le backend cloud utilise une API compatible OpenAI `chat/completions`.
Pour changer de fournisseur, modifier:

```text
AI_API_BASE_URL
AI_MODEL
AI_API_KEY
```
