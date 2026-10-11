# Plan d’évolution de Turritopsis ESG Diagnostic

Date : 8 octobre 2026. Statut : proposition, fonctionnalités non implémentées par ce document.

Ce plan adapte les pratiques utiles de l’application Laravel décrite dans le document fourni : contrôle des accès par dossier, suivi des délais, traitements asynchrones, console d’exploitation et tests du parcours utilisateur. L’évaluation porte sur le code local de Turritopsis ; la configuration de production n’a pas été inspectée.

## Base à conserver

Architecture : React/TypeScript, monolithe modulaire ASP.NET Core, architecture hexagonale et PostgreSQL. Les modules Identity, Companies, Diagnostics, Documents, Reviews, Audit, AI et Administration restent propriétaires de leurs données et communiquent par ports explicites.

Déjà présents : authentification, contrôles d’appartenance à une entreprise, questionnaire, stockage des preuves, dossier avec transitions contrôlées, validation humaine, événements métier, outbox transactionnelle, boîte de notifications et file de push Firebase. Le filtrage local limite les informations envoyées à l’IA à des signaux prédéfinis. Ce filtrage ne constitue ni une analyse antivirus, ni une preuve d’authenticité des documents.

Firebase est intégré au code mais nécessite encore un projet, des identifiants et un test réel de réception. Les comptes de base de données sont partagés entre modules : l’isolation actuelle est applicative et structurelle, pas une séparation des permissions PostgreSQL. Le plan conserve la contrainte existante de ne pas introduire le pattern Strategy.

## Lots proposés, dans l’ordre

| Lot | Besoin adapté de la référence | Travail prévu et modules concernés | Critère de réussite |
|---|---|---|---|
| 1 | Tests avant livraison | Ajouter une CI GitHub Actions : architecture, builds, tests de confidentialité, modules avec PostgreSQL jetable, tests push. Ajouter progressivement des parcours Playwright entreprise/réviseur/admin. | Une régression de droits, de confidentialité ou de parcours bloque la validation du changement. Les tests utilisent des données synthétiques. |
| 2 | Preuves fiables et historique | Versionner les pièces et les lier à une révision précise du dossier. Conserver les réponses et preuves réellement soumises, avec empreinte, auteur et date. Préserver les versions référencées lors d’une modification ou suppression ultérieure. Modules Documents/Reviews/Diagnostics. | Modifier une preuve après soumission ne modifie pas celle examinée. Une resoumission conserve l’historique et désigne clairement sa nouvelle révision. |
| 3 | Uploads sûrs et protection des entreprises | Liste de formats autorisés, vérification du contenu réel, limites de taille et de ressources, stockage privé, quarantaine et analyse antivirus locale. États explicites : reçu, analyse en cours, accepté, rejeté, échec. Accès contrôlé au téléchargement ; aucune pièce brute dans les services externes ou les journaux. Modules Documents/AI/Audit. | Une pièce malveillante ou non analysée reste inaccessible aux traitements. Un échec de stockage est signalé, sans annoncer que la pièce est sauvegardée. |
| 4 | Permissions précises | Vérification d’email, MFA pour comptes privilégiés, révocation de sessions et tests d’accès entre entreprises. Formaliser les permissions par action et l’accès des réviseurs assignés ou habilités. Vérifier aussi les permissions des téléchargements et des futurs rapports. Modules Identity/Companies/Reviews. | L’entreprise A ne peut consulter aucune ressource de B ; un réviseur non habilité est refusé ; une session révoquée ne conserve pas l’accès. |
| 5 | Attribution, délais et relances | Attribution explicite d’un dossier, date limite configurable, règles de réassignation et tableau de charge. Un traitement planifié persistant détecte les retards et émet des événements minimaux via l’outbox. Modules Reviews/Administration/Audit. | Un dossier en retard produit une relance sans doublon métier pour la même échéance, même après redémarrage ou avec plusieurs workers. Un dossier clos ne reçoit plus ces relances. |
| 6 | Notifications opérationnelles | Configurer Firebase et l’email ; tester sur navigateur/appareil réel. Ajouter préférences par type et canal, indicateur lu/non lu et traçabilité technique de l’envoi. Les emails métier utilisent une file durable ; les messages restent génériques. Modules Audit/Identity et interface notifications. | Soumission et décision déclenchent les notifications attendues ; désabonnement, changement de compte et perte d’accès empêchent les envois ultérieurs. L’acceptation FCM est distinguée de l’affichage réel. |
| 7 | Console d’exploitation et résilience | Vue opérateur protégée : ancienneté de l’outbox, jobs en échec, taux de retry, erreurs des fournisseurs, identifiants de requête et état des dépendances. Relance contrôlée et auditée de l’outbox. Délais d’appel et circuit breaker pour les intégrations ; retries seulement quand l’opération peut être répétée sans effet indésirable. Modules Administration/Audit/AI et hébergement API. | Une panne fournisseur reste diagnostiquable et ne perd pas les décisions enregistrées. La console ne révèle ni documents, ni clés, ni tokens de push. |
| 8 | Livraison maîtrisée et récupération | Préproduction, secrets hors dépôt, feature flags pour nouveaux traitements, sauvegardes privées et exercice de restauration. Séparer l’application des migrations de base de données au déploiement ; prévoir compatibilité des versions et procédure de retour arrière. | Un déploiement est précédé des vérifications ; une restauration est démontrée ; une migration n’est pas exécutée concurremment par toutes les instances. |
| 9 | Rapport ESG traçable et interface multilingue | Générer un rapport PDF versionné à partir de la révision validée, de la version du référentiel et des recommandations confirmées par le réviseur. Prévoir une référence de vérification avec visibilité minimale décidée explicitement. Structurer les traductions FR/AR/EN et le support RTL. Modules Reviews/Diagnostics et frontend. | Le rapport reproduit la décision humaine conservée. Toute consultation respecte sa visibilité ; aucun document confidentiel n’est exposé par la référence de vérification. |

## Points techniques à résoudre dès la spécification

1. **Révision et preuves** : `DossierCommands.SubmitAsync` fige les réponses dans `SnapshotJson`, mais `DocumentService.ListForDossierAsync` lit les documents actuels de l’entreprise. Introduire une liaison dossier/révision/version de document, pas seulement une liste de documents par entreprise. Définir une frontière cohérente de soumission sans accès direct aux tables d’un autre module.
2. **Échec de stockage** : `DocumentService.UploadAsync` limite les pièces à 4 Mo et conserve actuellement le texte lorsque la sauvegarde du fichier échoue. Séparer explicitement « texte enregistré » et « pièce sauvegardée », puis tester cette différence dans le navigateur.
3. **Traitement des fichiers** : réutiliser les principes de persistance, lease et idempotence de la file existante pour l’antivirus et, si le besoin est confirmé, l’extraction locale de texte. L’absence ou la panne du scanner garde la pièce en quarantaine. L’extraction/OCR doit rester locale et isolée avec des limites de ressources ; sa sortie passe toujours par la projection de confidentialité avant l’IA.
4. **Droits des réviseurs** : les services de documents utilisent actuellement un indicateur de rôle réviseur pour autoriser la lecture. L’attribution doit devenir une règle serveur explicite, compatible avec les besoins de supervision administrative.
5. **Scoring** : vérifier les calculs côté serveur et versionner le référentiel. Les scores déclarés restent distincts des scores confirmés et aucune sortie d’IA ne devient automatiquement une décision finale.
6. **Audit et conservation** : tracer les consultations/téléchargements sensibles avec acteur, ressource et date, sans leur contenu. Définir avec le responsable produit les durées de conservation des dossiers, preuves, audits et sauvegardes avant toute suppression automatique.

## Adaptation de l’infrastructure

Conserver PostgreSQL pour les files actuelles. Ajouter un cache partagé seulement si des mesures montrent un besoin concret ; toute clé de cache métier doit inclure l’entreprise et la version des données. Un worker séparé pour l’antivirus/OCR peut être utile si son coût ou son isolation le justifie. Les intégrations de tableurs restent optionnelles et doivent exporter uniquement les champs explicitement autorisés.

Les techniques de navigateur automatisé de l’application de référence répondent au suivi des transporteurs ; le besoin ESG à approfondir est le traitement local et sûr des preuves. Aucun changement de framework n’est nécessaire pour les lots proposés.

## Méthode de réalisation

Pour chaque lot : spécification fonctionnelle et critères d’acceptation → clarification des règles métier → plan technique → tâches → implémentation → vérification. Utiliser les commandes Spec Kit correspondantes, avec la constitution du projet comme base commune. Les contrôles de sécurité, les migrations et les modifications de données doivent figurer dans les tâches du lot concerné.

Commencer par la CI et la conservation des preuves. Les lots 3 et 4 sécurisent ensuite le socle avant l’extension du workflow. Les délais d’exécution seront estimés après spécification ; ce document ne présume pas de la taille de l’équipe ou des règles métier encore à décider.

## Références

- Description de l’application Laravel/Python fournie par l’utilisateur ; ses affirmations de production n’ont pas été vérifiées indépendamment.
- Code local : `docs/architecture.md`, `DocumentService.cs`, `DossierCommands.cs`, `AuthService.cs`, `OpenAiCompatibleProvider.cs`, tests et configuration frontend.
- [OWASP : File Upload](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html) : contrôle des formats, stockage privé et analyse antivirus.
- [Microsoft : résilience des clients HTTP .NET](https://learn.microsoft.com/en-us/dotnet/core/resilience/http-resilience) : timeouts, circuit breakers et précautions de retry.
- [Playwright : Trace Viewer](https://playwright.dev/docs/trace-viewer) : diagnostic des parcours navigateur, avec données synthétiques pour éviter d’enregistrer des pièces confidentielles.
