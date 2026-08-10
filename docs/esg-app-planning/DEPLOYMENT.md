# Deploiement Cloud - Turritopsis ESG Diagnostic

## Architecture

Option cible :

```text
Vercel frontend -> Render/Fly backend -> Supabase database -> Hosted AI API
```

Option gratuite actuellement privilegiee :

```text
Vercel frontend + Vercel API functions -> Supabase database -> Hosted AI API
```

## 1. Supabase

1. Ouvrir Supabase.
2. Aller dans `SQL Editor`.
3. Executer `supabase/schema.sql`.

Tables :

- `public.esg_snapshots` : sauvegarde le dossier ESG en JSON.
- `public.certificates` : prepare les certificats payants, mais n'est utile que lorsque Stripe est active.

Variables a copier :

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

## 2. Production Vercel

Parametres :

```text
Framework: Vite
Build command: npm run build
Output directory: dist
```

Variables minimales :

```env
VITE_APP_ENV=production
VITE_ENABLE_TEST_TOOLS=false
VITE_ENABLE_PAYMENTS=false
VITE_SUPABASE_URL=https://jylwacfsilvdychaznxw.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_AUTH_REDIRECT_URL=https://turritopsis-esg-diagnostic.vercel.app

AUTH_REQUIRED=true
ENABLE_PAYMENTS=false
SUPABASE_URL=https://jylwacfsilvdychaznxw.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
CORS_ORIGIN=https://turritopsis-esg-diagnostic.vercel.app
```

Variables IA :

```env
AI_PROVIDER=ollama
AI_API_BASE_URL=https://ollama.com/api
AI_MODEL=gpt-oss:20b
AI_API_KEY=...
```

## 3. Stripe plus tard

Stripe est volontairement prepare mais desactive.

Pour l'activer :

```env
VITE_ENABLE_PAYMENTS=true
ENABLE_PAYMENTS=true
STRIPE_SECRET_KEY=sk_test_or_live...
STRIPE_WEBHOOK_SECRET=whsec_...
DIAGNOSTIC_PRICE_CENTS=99000
DIAGNOSTIC_CURRENCY=mad
STRIPE_SUCCESS_URL=https://turritopsis-esg-diagnostic.vercel.app/#/app/report
STRIPE_CANCEL_URL=https://turritopsis-esg-diagnostic.vercel.app/#/app/questionnaire
```

Webhook Stripe :

```text
POST https://turritopsis-esg-diagnostic.vercel.app/api/stripe-webhook
event: checkout.session.completed
```

Ne pas activer ces deux interrupteurs tant que le paiement n'est pas souhaite :

```env
VITE_ENABLE_PAYMENTS=false
ENABLE_PAYMENTS=false
```

## 4. Workflow application

1. L'entreprise cree son compte.
2. Elle complete son profil.
3. Elle ajoute ses documents dans `Preuves`.
4. Elle lance `Scanner les documents`.
5. L'IA propose les scores et les mini-audits.
6. Le dossier peut etre sauvegarde.
7. Le reviewer valide les points sensibles dans l'espace reviewer.
8. Le rapport ESG peut etre consulte.
