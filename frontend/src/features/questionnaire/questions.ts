export type Pillar = "E" | "S" | "G";

export interface Question {
  code: string;
  pillar: Pillar;
  title: string;
  detail: string;
}

export const QUESTIONS: Question[] = [
  { code: "E1", pillar: "E", title: "Gestion de l'energie", detail: "Suivi et reduction de la consommation energetique." },
  { code: "E2", pillar: "E", title: "Gestion de l'eau", detail: "Suivi de la consommation et reduction du gaspillage." },
  { code: "E3", pillar: "E", title: "Gestion des dechets", detail: "Tri, reduction et valorisation des dechets." },
  { code: "E4", pillar: "E", title: "Emissions de CO2", detail: "Mesure et reduction des emissions de gaz a effet de serre." },
  { code: "E5", pillar: "E", title: "Produits chimiques", detail: "Gestion securisee des substances dangereuses." },
  { code: "E6", pillar: "E", title: "Biodiversite locale", detail: "Impact des activites sur les ecosystemes environnants." },
  { code: "E7", pillar: "E", title: "Energies renouvelables", detail: "Part d'energie renouvelable dans la consommation totale." },
  { code: "E8", pillar: "E", title: "Conformite environnementale", detail: "Respect des reglementations environnementales locales." },
  { code: "E9", pillar: "E", title: "Sensibilisation environnementale", detail: "Formation du personnel aux enjeux environnementaux." },
  { code: "S1", pillar: "S", title: "Securite au travail", detail: "Dispositifs de prevention des accidents du travail." },
  { code: "S2", pillar: "S", title: "Conditions de travail", detail: "Horaires, pauses et environnement de travail." },
  { code: "S3", pillar: "S", title: "Remuneration equitable", detail: "Politique salariale et egalite de traitement." },
  { code: "S4", pillar: "S", title: "Formation du personnel", detail: "Acces a la formation continue et au developpement des competences." },
  { code: "S5", pillar: "S", title: "Non-discrimination", detail: "Politique d'egalite et de diversite au travail." },
  { code: "S6", pillar: "S", title: "Dialogue social", detail: "Existence de representants du personnel ou d'un dialogue structure." },
  { code: "S7", pillar: "S", title: "Sante des employes", detail: "Couverture medicale et actions de bien-etre." },
  { code: "S8", pillar: "S", title: "Impact communautaire", detail: "Engagement envers la communaute locale." },
  { code: "S9", pillar: "S", title: "Relations fournisseurs", detail: "Criteres sociaux appliques au choix des fournisseurs." },
  { code: "G1", pillar: "G", title: "Structure de gouvernance", detail: "Organisation et independance du conseil d'administration." },
  { code: "G2", pillar: "G", title: "Anti-corruption", detail: "Politique et controles anti-corruption." },
  { code: "G3", pillar: "G", title: "Transparence financiere", detail: "Publication reguliere des comptes et rapports." },
  { code: "G4", pillar: "G", title: "Conformite fiscale", detail: "Respect des obligations fiscales en vigueur." },
  { code: "G5", pillar: "G", title: "Gestion des risques", detail: "Processus d'identification et de suivi des risques." },
  { code: "G6", pillar: "G", title: "Protection des donnees", detail: "Politique de confidentialite et de securite des donnees." },
  { code: "G7", pillar: "G", title: "Ethique des affaires", detail: "Code de conduite et politique ethique interne." },
  { code: "G8", pillar: "G", title: "Droits des parties prenantes", detail: "Transparence envers actionnaires et partenaires." },
  { code: "G9", pillar: "G", title: "Audit interne", detail: "Existence d'un controle interne regulier." }
];

export const PILLAR_LABELS: Record<Pillar, string> = {
  E: "Environnement",
  S: "Social",
  G: "Gouvernance"
};
