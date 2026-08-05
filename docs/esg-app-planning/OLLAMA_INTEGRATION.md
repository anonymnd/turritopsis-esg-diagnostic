# Integration Ollama - Turritopsis ESG Diagnostic

## Objectif

L'application utilise maintenant un flux hybride:

1. L'entreprise ajoute des documents dans la page `Preuves`.
2. Le frontend envoie la question ESG, la reponse et les documents au backend local.
3. Le backend appelle Ollama sur `http://127.0.0.1:11434`.
4. Ollama renvoie un mini-audit JSON.
5. L'application affiche le score IA, le risque, les manques, les documents relies et la recommandation.
6. Si Ollama n'est pas disponible, l'application utilise le moteur local de secours.

## Lancer Ollama

Installer Ollama puis lancer un modele:

```bash
ollama pull llama3.2:3b
ollama run llama3.2:3b
```

Le backend utilise par defaut:

```bash
OLLAMA_MODEL=llama3.2:3b
OLLAMA_URL=http://127.0.0.1:11434
ESG_API_PORT=3001
```

## Lancer le backend IA

Dans le dossier du projet:

```bash
npm run api:ollama
```

Le backend demarre sur:

```text
http://127.0.0.1:3001
```

## Tester dans l'application

1. Ouvrir `#/app/proofs`.
2. Cliquer `Documents test`.
3. Cliquer `Scanner les documents`.
4. Ouvrir `#/app/questionnaire`.
5. Chaque question analysee affiche un mini-audit.

## Sortie JSON attendue

```json
{
  "suggestedScore": "0.5",
  "confidence": 78,
  "risk": "modere",
  "summary": "La preuve montre une pratique existante mais incomplete.",
  "missing": ["indicateur annuel", "date de revue"],
  "documents": ["Audit energie 2025"],
  "evidence": "Factures energie et tableau kWh.",
  "recommendation": "Ajouter un tableau de bord annuel valide.",
  "audit": "Mini-audit de la pratique E2."
}
```
