export type Pillar = "E" | "S" | "G";

export interface Question {
  code: string;
  pillar: Pillar;
  title: string;
  detail: string;
}

export const QUESTIONS: Question[] = [
  {
    code: "E1",
    pillar: "E",
    title: "Gestion de l'energie",
    detail:
      "Mesurez-vous et cherchez-vous a reduire votre consommation d'energie (electricite, gaz, carburant) ? Une bonne preuve : factures energetiques suivies dans le temps, audit energetique, ou plan d'action de reduction."
  },
  {
    code: "E2",
    pillar: "E",
    title: "Gestion de l'eau",
    detail:
      "Suivez-vous votre consommation d'eau et agissez-vous pour limiter le gaspillage (fuites, reutilisation, equipements economes) ? Une bonne preuve : releves de consommation, systeme de recuperation, ou politique interne."
  },
  {
    code: "E3",
    pillar: "E",
    title: "Gestion des dechets",
    detail:
      "Triez-vous vos dechets et cherchez-vous a les reduire ou les valoriser (recyclage, reemploi, compostage) ? Une bonne preuve : contrat avec un prestataire de tri, registre de dechets, ou photos des dispositifs de tri sur site."
  },
  {
    code: "E4",
    pillar: "E",
    title: "Emissions de CO2",
    detail:
      "Mesurez-vous vos emissions de gaz a effet de serre (transport, production, energie) et agissez-vous pour les reduire ? Une bonne preuve : bilan carbone, meme partiel, ou plan de reduction des emissions."
  },
  {
    code: "E5",
    pillar: "E",
    title: "Produits chimiques",
    detail:
      "Si votre activite utilise des substances dangereuses, disposez-vous de procedures de stockage, manipulation et elimination securisees ? Une bonne preuve : fiches de securite (FDS), registre de stockage, ou formation du personnel concerne."
  },
  {
    code: "E6",
    pillar: "E",
    title: "Biodiversite locale",
    detail:
      "Votre activite a-t-elle un impact identifie sur les ecosystemes environnants (sol, cours d'eau, especes locales), et le gerez-vous ? Une bonne preuve : etude d'impact, mesures compensatoires, ou absence documentee d'impact significatif."
  },
  {
    code: "E7",
    pillar: "E",
    title: "Energies renouvelables",
    detail:
      "Une partie de votre energie provient-elle de sources renouvelables (solaire, eolien, biomasse) ? Une bonne preuve : facture d'un fournisseur d'energie verte, installation solaire propre, ou contrat d'approvisionnement."
  },
  {
    code: "E8",
    pillar: "E",
    title: "Conformite environnementale",
    detail:
      "Respectez-vous les reglementations environnementales locales applicables a votre secteur (autorisations, seuils de rejet, normes) ? Une bonne preuve : autorisation environnementale, rapport d'inspection, ou certificat de conformite."
  },
  {
    code: "E9",
    pillar: "E",
    title: "Sensibilisation environnementale",
    detail:
      "Votre personnel est-il forme ou sensibilise aux enjeux environnementaux lies a son poste ? Une bonne preuve : support de formation, compte-rendu de session, ou affichage interne sur les bonnes pratiques."
  },
  {
    code: "S1",
    pillar: "S",
    title: "Securite au travail",
    detail:
      "Avez-vous mis en place des dispositifs de prevention des accidents du travail (equipements de protection, procedures, formations) ? Une bonne preuve : registre d'incidents, plan de prevention, ou attestations de formation securite."
  },
  {
    code: "S2",
    pillar: "S",
    title: "Conditions de travail",
    detail:
      "Les horaires, pauses et l'environnement de travail respectent-ils la reglementation et le bien-etre des employes ? Une bonne preuve : reglement interieur, planning des horaires, ou enquete de satisfaction employes."
  },
  {
    code: "S3",
    pillar: "S",
    title: "Remuneration equitable",
    detail:
      "Votre politique salariale garantit-elle une remuneration equitable, au moins au SMIG, sans ecart injustifie entre employes comparables ? Une bonne preuve : grille salariale, bulletins de paie types, ou politique de remuneration ecrite."
  },
  {
    code: "S4",
    pillar: "S",
    title: "Formation du personnel",
    detail:
      "Vos employes ont-ils acces a de la formation continue pour developper leurs competences ? Une bonne preuve : plan de formation annuel, attestations de participation, ou budget formation dedie."
  },
  {
    code: "S5",
    pillar: "S",
    title: "Non-discrimination",
    detail:
      "Appliquez-vous une politique d'egalite et de diversite dans le recrutement et la gestion du personnel ? Une bonne preuve : charte d'egalite, procedure de recrutement non-discriminatoire, ou statistiques de mixite."
  },
  {
    code: "S6",
    pillar: "S",
    title: "Dialogue social",
    detail:
      "Existe-t-il des representants du personnel ou un dialogue structure entre direction et employes ? Une bonne preuve : proces-verbaux de reunion, elections de delegues, ou canal de remontee formalise."
  },
  {
    code: "S7",
    pillar: "S",
    title: "Sante des employes",
    detail:
      "Vos employes beneficient-ils d'une couverture medicale et d'actions favorisant leur bien-etre ? Une bonne preuve : attestation CNSS/mutuelle, contrat d'assurance groupe, ou programme de bien-etre interne."
  },
  {
    code: "S8",
    pillar: "S",
    title: "Impact communautaire",
    detail:
      "Votre entreprise s'engage-t-elle envers la communaute locale (emploi local, mecenat, partenariats) ? Une bonne preuve : convention avec une association locale, actions de mecenat documentees, ou donnees de recrutement local."
  },
  {
    code: "S9",
    pillar: "S",
    title: "Relations fournisseurs",
    detail:
      "Appliquez-vous des criteres sociaux (conditions de travail, ethique) dans le choix de vos fournisseurs ? Une bonne preuve : charte fournisseurs, questionnaire d'evaluation, ou clause sociale dans les contrats."
  },
  {
    code: "G1",
    pillar: "G",
    title: "Structure de gouvernance",
    detail:
      "Votre entreprise dispose-t-elle d'une organisation de gouvernance claire (conseil d'administration ou de gerance, repartition des roles) ? Une bonne preuve : statuts de l'entreprise, organigramme de direction, ou proces-verbaux de conseil."
  },
  {
    code: "G2",
    pillar: "G",
    title: "Anti-corruption",
    detail:
      "Avez-vous une politique et des controles pour prevenir la corruption (cadeaux, conflits d'interets, pots-de-vin) ? Une bonne preuve : charte anti-corruption, procedure de signalement, ou formation dediee."
  },
  {
    code: "G3",
    pillar: "G",
    title: "Transparence financiere",
    detail:
      "Publiez-vous ou communiquez-vous regulierement vos comptes et rapports financiers aux parties prenantes concernees ? Une bonne preuve : etats financiers audites, rapport annuel, ou attestation d'expert-comptable."
  },
  {
    code: "G4",
    pillar: "G",
    title: "Conformite fiscale",
    detail:
      "Respectez-vous vos obligations fiscales en vigueur (declarations, paiements, delais) ? Une bonne preuve : attestation de regularite fiscale, quitus fiscal, ou recepisse de declaration."
  },
  {
    code: "G5",
    pillar: "G",
    title: "Gestion des risques",
    detail:
      "Avez-vous un processus pour identifier et suivre les risques (operationnels, financiers, reputationnels) qui pesent sur l'entreprise ? Une bonne preuve : cartographie des risques, registre de suivi, ou plan de continuite d'activite."
  },
  {
    code: "G6",
    pillar: "G",
    title: "Protection des donnees",
    detail:
      "Disposez-vous d'une politique de confidentialite et de securite pour les donnees que vous traitez (clients, employes) ? Une bonne preuve : politique de confidentialite, declaration CNDP, ou procedure de securite informatique."
  },
  {
    code: "G7",
    pillar: "G",
    title: "Ethique des affaires",
    detail:
      "Existe-t-il un code de conduite ou une politique ethique formalisant les comportements attendus dans l'entreprise ? Une bonne preuve : code de conduite signe, charte ethique diffusee, ou clause ethique dans les contrats."
  },
  {
    code: "G8",
    pillar: "G",
    title: "Droits des parties prenantes",
    detail:
      "Communiquez-vous de maniere transparente avec vos actionnaires et partenaires sur la marche de l'entreprise ? Une bonne preuve : compte-rendu d'assemblee, rapport aux partenaires, ou pacte d'actionnaires."
  },
  {
    code: "G9",
    pillar: "G",
    title: "Audit interne",
    detail:
      "Un controle interne regulier (audit, revue des processus) est-il en place pour verifier le bon fonctionnement de l'entreprise ? Une bonne preuve : rapport d'audit interne ou externe, plan d'audit annuel, ou compte-rendu de revue de processus."
  }
];

export const PILLAR_LABELS: Record<Pillar, string> = {
  E: "Environnement",
  S: "Social",
  G: "Gouvernance"
};
