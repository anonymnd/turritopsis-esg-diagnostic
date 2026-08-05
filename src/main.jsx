import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bot,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Download,
  Eye,
  Factory,
  FileSearch,
  FileText,
  Gauge,
  Globe2,
  HelpCircle,
  Home,
  Info,
  Landmark,
  Leaf,
  Lock,
  LogIn,
  Menu,
  PanelLeft,
  Printer,
  RefreshCcw,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Sprout,
  Store,
  Target,
  Upload,
  Users
} from "lucide-react";
import "./styles.css";

const sectors = [
  { id: "industry", label: "Industrie", description: "Production, transformation, maintenance", icon: Factory, code: "A" },
  { id: "services", label: "Services", description: "Conseil, numerique, operations B2B", icon: Building2, code: "B" },
  { id: "commerce", label: "Commerce", description: "Distribution, retail, logistique", icon: Store, code: "C" },
  { id: "agri", label: "Agri / Agro", description: "Agriculture, agroalimentaire, filieres", icon: Sprout, code: "D" }
];

const pillars = [
  { id: "E", label: "Environnement", icon: Leaf, color: "green" },
  { id: "S", label: "Social", icon: Users, color: "blue" },
  { id: "G", label: "Gouvernance", icon: ShieldCheck, color: "orange" }
];

const sharedQuestions = {
  E: [
    ["E1", "Management environnemental", "La PME a une politique environnementale, des objectifs et une revue annuelle.", "Politique environnementale, objectifs, rapport annuel, certificat ISO 14001"],
    ["E2", "Efficacite energetique", "La PME mesure et reduit sa consommation d'energie.", "Factures energie, audit energetique, tableau kWh, plan de reduction", true],
    ["E3", "Gestion des dechets", "La PME trie, suit et valorise ses dechets via des filieres documentees.", "Registre dechets, contrats de collecte, certificats de recyclage"],
    ["E4", "Consommation d'eau", "La PME suit sa consommation d'eau et agit pour la reduire.", "Factures eau, tableau m3, plan d'economie, recyclage eaux usees"],
    ["E5", "Emissions climat", "La PME identifie ses emissions et dispose d'un plan de reduction.", "Bilan GES, estimation CO2, plan climat, suivi annuel", true],
    ["E6", "Sensibilisation environnementale", "Les equipes sont sensibilisees aux pratiques environnementales.", "Supports de formation, listes de presence, campagnes internes"]
  ],
  S: [
    ["S1", "Formation et developpement", "La PME suit les competences et organise des formations.", "Plan de formation, attestations, heures par salarie"],
    ["S2", "Conditions de travail", "La PME suit la qualite de vie au travail et corrige les irritants.", "Enquete interne, taux absenteisme, plan QVT, PV de reunion", true],
    ["S3", "Diversite et inclusion", "La PME agit pour l'egalite, l'inclusion et la non-discrimination.", "Charte diversite, indicateurs, politique RH, actions inclusion"],
    ["S4", "Sante et securite", "La PME identifie les risques et protege les collaborateurs.", "Document risques, formations securite, registre incidents, EPI"],
    ["S5", "Dialogue social", "La PME maintient un dialogue structure avec les collaborateurs.", "PV de reunion, barometre social, canal de reclamation, accords", true],
    ["S6", "Impact communautaire", "La PME cree un impact positif dans son territoire.", "Partenariats locaux, dons, achats locaux, rapport impact"]
  ],
  G: [
    ["G1", "Structure de gouvernance", "La PME clarifie les roles, responsabilites et decisions.", "Organigramme, delegations, PV de direction, comite", true],
    ["G2", "Ethique et anti-corruption", "La PME formalise ses regles d'ethique et de prevention corruption.", "Code de conduite, politique cadeaux, formation, registre alertes", true],
    ["G3", "Gestion des risques ESG", "La PME identifie et suit ses principaux risques ESG.", "Cartographie risques, plan mitigation, revue annuelle"],
    ["G4", "Transparence", "La PME communique ses informations financieres et ESG de maniere claire.", "Rapport annuel, tableau ESG, communication investisseurs"],
    ["G5", "Parties prenantes", "La PME identifie ses parties prenantes et collecte leurs attentes.", "Cartographie, consultations, enquete clients/fournisseurs"],
    ["G6", "KPI et pilotage", "La PME suit ses indicateurs et ses plans d'action.", "Tableau de bord, objectifs, compte-rendu de revue"]
  ]
};

const sectorQuestions = {
  industry: {
    E: [
      ["E7", "Matieres premieres", "La PME optimise l'usage des matieres et reduit les pertes.", "Rendement matiere, taux rebut, registre consommation"],
      ["E8", "Process industriel", "Les equipements critiques sont suivis pour reduire l'energie.", "Compteurs dedies, maintenance preventive, ISO 50001"],
      ["E9", "Rejets industriels", "Les rejets atmospheriques ou liquides sont controles.", "Rapports analyse, autorisations, registre rejets"]
    ],
    S: [
      ["S7", "Ergonomie", "La PME reduit la penibilite et les risques physiques.", "Etudes de postes, actions ergonomie, indicateurs TMS"],
      ["S8", "Formation technique", "Les collaborateurs ont les habilitations techniques utiles.", "Certificats, habilitations, plan technique"],
      ["S9", "Emploi local", "La PME soutient l'emploi local et l'insertion.", "Partenariats, alternance, donnees emploi local"]
    ],
    G: [
      ["G7", "Conformite industrielle", "La PME suit les obligations propres au site industriel.", "Autorisations, registre conformite, veille reglementaire"],
      ["G8", "Tracabilite", "Les lots, produits et matieres sont tracables.", "Registre lots, audits fournisseurs, systeme tracabilite"],
      ["G9", "Certifications", "La PME maintient ses normes et certifications critiques.", "ISO 9001, ISO 14001, ISO 45001, audits"]
    ]
  },
  services: {
    E: [
      ["E7", "Achats responsables", "La PME integre des criteres ESG dans ses achats.", "Charte fournisseurs, questionnaire RSE, labels"],
      ["E8", "Numerique responsable", "La PME reduit l'impact de ses equipements et donnees.", "Politique IT, recyclage materiel, cloud responsable"],
      ["E9", "Mobilite durable", "La PME reduit les emissions de deplacements.", "Plan mobilite, teletravail, suivi deplacements"]
    ],
    S: [
      ["S7", "Satisfaction client", "La PME mesure et ameliore la satisfaction client.", "NPS, reclamations, taux resolution, enquete"],
      ["S8", "Flexibilite et QVT", "La PME encadre le travail hybride et l'equilibre.", "Accord teletravail, charte QVT, enquete interne"],
      ["S9", "Accessibilite", "Les services sont accessibles aux personnes vulnerables ou handicapees.", "Audit accessibilite, plan adaptation, formation"]
    ],
    G: [
      ["G7", "Protection donnees", "La PME protege les donnees clients et collaborateurs.", "Registre traitements, politique securite, DPO"],
      ["G8", "Continuite d'activite", "La PME peut maintenir son activite en cas d'incident.", "PCA/PRA, tests annuels, procedures"],
      ["G9", "Contrats clients", "Les contrats et engagements sont clairs et suivis.", "CGV, contrats, audit juridique, revision annuelle"]
    ]
  },
  commerce: {
    E: [
      ["E7", "Assortiment responsable", "La PME favorise les produits responsables.", "Labels produits, politique achats verts, indicateurs"],
      ["E8", "Transport", "La PME optimise sa logistique et ses livraisons.", "Taux remplissage, transporteurs, suivi emissions"],
      ["E9", "Emballages", "La PME reduit et recycle ses emballages.", "Politique emballage, taux recyclable, eco-conception"]
    ],
    S: [
      ["S7", "Experience client", "La PME traite les reclamations et mesure l'experience.", "NPS, reclamations, delai resolution"],
      ["S8", "Organisation du travail", "Les horaires et charges sont suivis equitablement.", "Planning, accords horaires, indicateurs turnover"],
      ["S9", "Information consommateur", "La PME informe clairement les clients.", "Etiquettes, guides, labels, affichage transparent"]
    ],
    G: [
      ["G7", "Tracabilite produits", "La PME connait l'origine des produits sensibles.", "Registre fournisseurs, audits, labels"],
      ["G8", "Conformite commerciale", "La PME controle ses pratiques commerciales.", "Registre conformite, formations, controles internes"],
      ["G9", "Donnees clients", "Les donnees clients sont protegees.", "Registre traitements, politique securite, consentements"]
    ]
  },
  agri: {
    E: [
      ["E7", "Eau et intrants", "La PME suit l'irrigation et les intrants.", "Registre irrigation, bilan intrants, labels"],
      ["E8", "Sols et biodiversite", "La PME preserve les sols et la biodiversite.", "Diagnostic sols, plan biodiversite, certifications"],
      ["E9", "Energie agricole", "La PME optimise l'energie des exploitations.", "Audit energie, solaire, plan reduction"]
    ],
    S: [
      ["S7", "Travailleurs et producteurs", "Les conditions sont decentes pour producteurs et saisonniers.", "Contrats, audits sociaux, certifications"],
      ["S8", "Securite agricole", "La PME previent les risques agricoles.", "EPI, formations, registre incidents"],
      ["S9", "Formation agricole", "La PME developpe les competences agricoles.", "Programmes, partenariats, attestations"]
    ],
    G: [
      ["G7", "Tracabilite agricole", "La PME suit la tracabilite de la parcelle au client.", "Lots, certificats, systeme tracabilite"],
      ["G8", "Certifications agricoles", "La PME maintient les certifications de filiere.", "Global GAP, AB, ONSSA, audits"],
      ["G9", "Conformite filiere", "La PME suit les regles sanitaires et filiere.", "Registre ONSSA, controles, veille"]
    ]
  }
};

const scoreOptions = [
  { value: "0", label: "0", title: "Absent", detail: "Aucune pratique ou preuve." },
  { value: "0.5", label: "0.5", title: "Partiel", detail: "Pratique lancee mais incomplete." },
  { value: "1", label: "1", title: "Maitrise", detail: "Pratique suivie et prouvee." },
  { value: "unknown", label: "?", title: "Incertain", detail: "Besoin d'aide pour se situer." },
  { value: "NA", label: "NA", title: "Non applicable", detail: "Hors activite, avec justification." }
];

const maturityLevels = [
  { min: 80, label: "ESG Leader", tone: "Excellent niveau de maturite et de preuve." },
  { min: 60, label: "ESG Performant", tone: "Base solide avec quelques corrections ciblees." },
  { min: 40, label: "ESG Structure", tone: "Organisation visible, preuves encore irregulieres." },
  { min: 20, label: "ESG Initial", tone: "Demarrage engage, priorites essentielles a formaliser." },
  { min: 0, label: "ESG Minimal", tone: "Point de depart clair pour construire la methode." }
];

const publicStats = [
  {
    value: "27",
    label: "criteres",
    detail: "Un questionnaire adapte au secteur de la PME",
    icon: Leaf,
    tone: "blue"
  },
  {
    value: "3",
    label: "piliers",
    detail: "Environnement, Social et Gouvernance",
    icon: Landmark,
    tone: "green"
  },
  {
    value: "IA",
    label: "pre-revue",
    detail: "Les preuves faibles sont signalees avant validation humaine",
    icon: Bot,
    tone: "orange"
  }
];

const turritopsisAssets = {
  logo: "https://turritopsis.org/wp-content/uploads/2022/10/logo-1.png",
  mark: "https://turritopsis.org/wp-content/uploads/2022/10/Logo.png",
  hero: "https://turritopsis.org/wp-content/uploads/2022/10/Cover_DevDurable_Shutterstock-1536x864-1.jpg",
  event: "https://turritopsis.org/wp-content/uploads/2024/11/Journee-Action-Developpement-Durable-JADD-8-1.png",
  governance: "https://turritopsis.org/wp-content/uploads/2025/11/Untitled-Facebook-Post-1170x725.png"
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.PROD ? "" : "http://127.0.0.1:3001");
const AI_REVIEW_API = `${API_BASE_URL}/api/review-question`;
const SNAPSHOT_API = `${API_BASE_URL}/api/snapshot`;
const APP_ENV = import.meta.env.VITE_APP_ENV || (import.meta.env.PROD ? "production" : "test");
const ENABLE_TEST_TOOLS = APP_ENV !== "production" && import.meta.env.VITE_ENABLE_TEST_TOOLS === "true";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const AUTH_REDIRECT_URL = import.meta.env.VITE_AUTH_REDIRECT_URL || window.location.origin;
const supabaseAuth = SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true
      }
    })
  : null;

function hasAuthCallbackHash() {
  return window.location.hash.includes("access_token=") || window.location.hash.includes("type=signup");
}

function cleanAuthCallbackUrl() {
  window.history.replaceState(null, "", `${window.location.origin}${window.location.pathname}#/onboarding`);
}

const sampleDocuments = [
  {
    id: "doc-energy-2025",
    title: "Audit energie 2025",
    type: "Audit",
    content: "Audit energie 2025, factures energie mensuelles, tableau kWh par site, plan de reduction valide par la direction et suivi trimestriel des economies."
  },
  {
    id: "doc-social-qvt",
    title: "PV social et conditions de travail",
    type: "PV",
    content: "PV de reunion 2025, conditions de travail, registre incidents, indicateur absenteisme, dialogue social, action corrective RH et suivi trimestriel."
  },
  {
    id: "doc-governance",
    title: "Dossier gouvernance",
    type: "Politique",
    content: "Organigramme, structure de gouvernance, politique ethique anti-corruption, registre alertes, roles et responsabilites, revue annuelle de direction 2025."
  }
];

const methodCards = [
  {
    title: "Choisir un niveau",
    detail: "Absent, partiel, maitrise, incertain ou non applicable: la PME peut avancer meme si elle hesite.",
    icon: HelpCircle
  },
  {
    title: "Ajouter une preuve",
    detail: "Document, indicateur, facture, audit, photo ou commentaire: le score doit etre justifie.",
    icon: Upload
  },
  {
    title: "Relire le dossier",
    detail: "L'analyse aide a reperer les incoherences. Le reviewer garde la decision finale.",
    icon: FileSearch
  }
];

function normalizeQuestion(item, pillar, sector) {
  const [code, title, description, evidence, priority = false] = item;
  return { code, title, description, evidence, priority, pillar, sector };
}

function buildQuestions(sector) {
  return Object.fromEntries(
    pillars.map((pillar) => [
      pillar.id,
      [...sharedQuestions[pillar.id], ...sectorQuestions[sector][pillar.id]].map((item) =>
        normalizeQuestion(item, pillar.id, sector)
      )
    ])
  );
}

function getLevel(score) {
  return maturityLevels.find((level) => score >= level.min) || maturityLevels[maturityLevels.length - 1];
}

function emptyAnswer() {
  return { value: "", evidence: "", justification: "", guidance: "" };
}

function emptyReview() {
  return {
    status: "idle",
    source: "",
    suggestedScore: "",
    confidence: 0,
    summary: "",
    missing: [],
    evidence: "",
    documents: [],
    risk: "",
    recommendation: "",
    audit: ""
  };
}

function clampScore(value) {
  const numeric = Number(value);
  if (numeric >= 0.75) return "1";
  if (numeric >= 0.25) return "0.5";
  return "0";
}

function questionKeywords(question) {
  return [...new Set(`${question.title} ${question.description} ${question.evidence}`
    .toLowerCase()
    .split(/[,;:.\s/()]+/)
    .filter((word) => word.length > 4))];
}

function documentMatchesPillar(question, content) {
  const signals = {
    E: ["environnement", "energie", "energetique", "kwh", "eau", "dechets", "climat", "co2", "ges", "emissions", "emballage", "transport"],
    S: ["social", "travail", "rh", "formation", "absenteisme", "securite", "sante", "diversite", "dialogue", "client", "qvt"],
    G: ["gouvernance", "ethique", "corruption", "risque", "transparence", "organigramme", "conformite", "donnees", "registre", "roles"]
  };
  return signals[question.pillar].some((signal) => content.includes(signal));
}

function documentsForQuestion(question, documents) {
  const keywords = questionKeywords(question);
  return documents
    .map((document) => {
      const content = `${document.title} ${document.type} ${document.content}`.toLowerCase();
      const matches = keywords.filter((word) => content.includes(word));
      return { ...document, matches, pillarMatch: documentMatchesPillar(question, content) };
    })
    .filter((document) => document.matches.length >= 3 && document.pillarMatch)
    .sort((a, b) => b.matches.length - a.matches.length)
    .slice(0, 3);
}

function evidenceFromDocuments(question, documents) {
  const matchedDocuments = documentsForQuestion(question, documents);
  if (!matchedDocuments.length) return "";
  return matchedDocuments
    .map((document) => `${document.title}: ${document.content}`)
    .join(" ");
}

function auditRecommendation(question, missing, suggestedScore) {
  if (suggestedScore === "1" && !missing.length) return "Pratique bien documentee. Le reviewer peut confirmer si le document est authentique et recent.";
  if (suggestedScore === "0.5") return `Completer l'audit ${question.code} avec ${missing.slice(0, 2).join(" et ") || "une preuve plus directe"}.`;
  if (suggestedScore === "NA") return "Verifier que la non-applicabilite est justifiee par le secteur, le perimetre ou l'activite.";
  return `Audit ${question.code}: demander une preuve source, une date et un indicateur avant de valider le score.`;
}

function proofReview(question, answer, documents = []) {
  const documentEvidence = evidenceFromDocuments(question, documents);
  const text = `${answer.evidence} ${answer.justification} ${documentEvidence}`.toLowerCase();
  const expected = question.evidence
    .toLowerCase()
    .split(/[,.\s/]+/)
    .filter((word) => word.length > 4);
  const matches = expected.filter((word) => text.includes(word)).length;
  const hasDoc = /rapport|audit|facture|certificat|politique|registre|plan|pv|contrat|tableau|indicateur|formation|bilan|charte/i.test(text);
  const hasMetric = /\d|%|kwh|m3|co2|ges|iso|onssa|cndp|nps|duer|mad|dh/i.test(text);
  const hasDate = /202[0-9]|annuel|mensuel|trimestriel|q[1-4]|date|mois|annee/i.test(text);
  const lengthSignal = text.trim().length > 220 ? 2 : text.trim().length > 80 ? 1 : 0;
  const signal = [hasDoc, hasMetric, hasDate, matches >= 2].filter(Boolean).length + lengthSignal;
  const suggestedScore = answer.value === "NA" ? "NA" : clampScore(signal / 6);
  const missing = [];

  if (!hasDoc) missing.push("type de document");
  if (!hasMetric) missing.push("indicateur ou valeur mesuree");
  if (!hasDate) missing.push("periode ou date");
  if (matches < 2) missing.push("lien direct avec le critere");
  const matchedDocuments = documentsForQuestion(question, documents);
  const evidence = answer.evidence || documentEvidence;
  const risk = suggestedScore === "1" ? "faible" : suggestedScore === "0.5" ? "modere" : suggestedScore === "NA" ? "a verifier" : "eleve";
  const recommendation = auditRecommendation(question, missing, suggestedScore);

  return {
    status: "done",
    source: documents.length ? "Scan IA local" : "Revue locale",
    suggestedScore,
    confidence: Math.min(94, 36 + signal * 10),
    summary:
      suggestedScore === "1"
        ? "La preuve semble documentee, mesurable et coherente."
        : suggestedScore === "0.5"
          ? "La preuve contient des signaux utiles, mais reste partielle."
          : suggestedScore === "NA"
            ? "Le critere est traite comme non applicable et doit rester justifie."
            : "La preuve est trop faible pour soutenir une note elevee.",
    missing,
    evidence,
    documents: matchedDocuments.map((document) => document.title),
    risk,
    recommendation,
    audit: `Audit ${question.code}: score IA ${suggestedScore}, risque ${risk}, ${matchedDocuments.length} document(s) relie(s).`
  };
}

function normalizeRemoteReview(question, answer, remoteReview, documents = []) {
  const local = proofReview(question, answer, documents);
  const suggestedScore = remoteReview?.suggestedScore === 1 || remoteReview?.suggestedScore === "1"
    ? "1"
    : remoteReview?.suggestedScore === 0.5 || remoteReview?.suggestedScore === "0.5"
      ? "0.5"
      : remoteReview?.suggestedScore === "NA"
        ? "NA"
        : "0";
  const missing = remoteReview?.missingEvidence || remoteReview?.missing || local.missing;
  const risk = remoteReview?.riskLevel || remoteReview?.risk || local.risk;

  return {
    ...local,
    source: "Backend IA securise",
    suggestedScore,
    confidence: Number(remoteReview?.confidence || local.confidence),
    summary: remoteReview?.summary || local.summary,
    missing,
    risk,
    recommendation: remoteReview?.recommendation || auditRecommendation(question, missing, suggestedScore),
    audit: remoteReview?.audit || `Audit ${question.code}: score IA ${suggestedScore}, risque ${risk}. ${(remoteReview?.auditQuestions || []).join(" ")}`
  };
}

function scorePillar(questions, answers, reviews, reviewed = false) {
  const values = questions.map((question) => {
    const answer = answers[question.code] || emptyAnswer();
    if (!reviewed || answer.value === "NA" || answer.value === "unknown") return answer.value;
    const review = reviews[question.code] || emptyReview();
    if (review.status !== "done" || review.evidence !== answer.evidence) return answer.value;
    return String(Math.min(Number(answer.value), Number(review.suggestedScore)));
  });
  const naCount = values.filter((value) => value === "NA").length;
  const denominator = Math.max(questions.length - naCount, 1);
  const points = values.reduce((sum, value) => {
    if (value === "0.5") return sum + 0.5;
    if (value === "1") return sum + 1;
    return sum;
  }, 0);
  return {
    score: Math.round((points / denominator) * 100),
    points,
    naCount,
    answered: values.filter(Boolean).length
  };
}

function suggestedGuidance(question) {
  return [
    `Si ${question.code} est seulement une intention sans document, choisissez 0.`,
    "Si une pratique existe mais sans suivi regulier, choisissez 0.5.",
    "Si la pratique est formalisee, suivie et prouvee, choisissez 1."
  ];
}

function makeTestEvidence(question) {
  const common = {
    E: "Rapport interne 2025, tableau de bord mensuel, indicateur suivi par la direction et plan d'action valide.",
    S: "PV de reunion 2025, registre RH, indicateur trimestriel et action corrective suivie par le responsable RH.",
    G: "Politique approuvee en 2025, registre de controle, compte-rendu de direction et revue annuelle documentee."
  };
  return `${question.evidence}. ${common[question.pillar]} Exemple: ${question.code} suivi avec un objectif et une preuve disponible.`;
}

function NavLink({ route, currentRoute, children }) {
  const active =
    currentRoute === route ||
    (route === "/app" && currentRoute === "/onboarding") ||
    (route === "/review" && currentRoute === "/admin/questionnaire");
  return (
    <a className={active ? "active" : ""} href={`#${route}`}>
      {children}
    </a>
  );
}

function Reveal({ as: Tag = "div", className = "", delay = 0, children }) {
  const ref = React.useRef(null);
  const [visible, setVisible] = useState(false);

  React.useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.16, rootMargin: "0px 0px -70px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`reveal ${visible ? "visible" : ""} ${className}`.trim()}
      style={{ "--reveal-delay": `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}

function TopNav({ route }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="topnav">
      <a className="brand" href="#/">
        <span>
          <img src={turritopsisAssets.logo} alt="Turritopsis" />
        </span>
        <div>
          <strong>TURRITOPSIS</strong>
          <small>ESG Diagnostic</small>
        </div>
      </a>
      <button className="nav-toggle" type="button" onClick={() => setOpen((value) => !value)} aria-label="Menu">
        <Menu size={20} />
      </button>
      <nav className={open ? "open" : ""} aria-label="Navigation principale">
        <NavLink route="/" currentRoute={route}>Accueil</NavLink>
        <NavLink route="/auth/enterprise" currentRoute={route}>Entreprise</NavLink>
        <NavLink route="/app" currentRoute={route}>Espace PME</NavLink>
        <NavLink route="/review" currentRoute={route}>Reviewer</NavLink>
      </nav>
    </header>
  );
}

function PublicPage({ route, state }) {
  return (
    <div className="page public-page">
      <TopNav route={route} />
      <section className="public-hero">
        <img
          src={turritopsisAssets.hero}
          alt=""
        />
        <div className="hero-copy">
          <p className="eyebrow">Diagnostic ESG pour PME</p>
          <h1>Turritopsis ESG <span className="gradient-text">Diagnostic</span></h1>
          <p>
            Un outil pour renseigner un profil entreprise, repondre aux criteres ESG, joindre les preuves et preparer
            un rapport relisible.
          </p>
          <div className="hero-actions">
            <a className="btn primary" href="#/auth/enterprise">
              Creer mon espace entreprise <ArrowRight size={18} />
            </a>
            <a className="btn ghost" href="#overview">
              Comprendre le parcours <BarChart3 size={18} />
            </a>
          </div>
        </div>
        <div className="hero-graphic" aria-hidden="true">
          <div className="orbit-ring" />
          <div className="orbit-ring inner" />
          <div className="pulse-core">
            <Globe2 size={34} />
          </div>
          <div className="floating-note note-a">
            <span>PME</span>
            <strong>Profil entreprise <CheckCircle2 size={15} /></strong>
          </div>
          <div className="floating-note note-b">
            <span>Parcours</span>
            <strong>Niveaux expliques</strong>
            <small>Pour choisir sans jargon</small>
            <i />
          </div>
          <div className="floating-note note-c">
            <strong>Rapport final</strong>
            <b>ESG</b>
            <em><span style={{ width: "72%" }} /></em>
            <small>Pret a partager</small>
          </div>
          <div className="dot-grid" />
        </div>
        <a className="scroll-cue" href="#overview" aria-label="Voir la suite">
          <ChevronRight size={22} />
        </a>
      </section>

      <main className="public-content">
        <section className="overview-section" id="overview">
          <Reveal className="overview-heading">
            <p className="eyebrow overview-badge">Ce que l'app couvre</p>
            <h2>Un diagnostic court, documente, relisible.</h2>
            <p>
              L'objectif n'est pas de produire un score flatteur. L'objectif est de montrer ce qui est deja en place,
              ce qui manque de preuve et ce qui doit etre ameliore en premier.
            </p>
          </Reveal>
          <div className="metric-strip" aria-label="Indicateurs">
            {publicStats.map((item, index) => {
              const Icon = item.icon;
              return (
                <Reveal as="article" className={`stat-card ${item.tone}`} key={item.label} delay={index * 90}>
                  <div className="stat-icon"><Icon size={28} /></div>
                  <div>
                    <strong>{item.value}</strong>
                    <span>{item.label}</span>
                    <p>{item.detail}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>

        <section className="journey-section public-band band-dashboard">
          <Reveal className="journey-copy">
            <p className="eyebrow">Resultat attendu</p>
            <h2>Un score qui explique ses limites.</h2>
            <p>
              Le rapport separe la note declaree, la note apres revue des preuves et les criteres qui demandent
              encore une verification.
            </p>
          </Reveal>
          <Reveal className="score-story" delay={120}>
            <div className="score-mark">
              <strong>68</strong>
              <span>/100</span>
            </div>
            <div className="score-note">
              <span>Exemple de rapport</span>
              <h3>68/100 avec reserves</h3>
              <p>La PME voit son niveau global, le detail E/S/G et les preuves qui influencent le resultat.</p>
              <div className="pillar-mini" aria-label="Scores par pilier">
                <div><b>Environnement</b><i><em style={{ width: "62%" }} /></i><strong>62</strong></div>
                <div><b>Social</b><i><em style={{ width: "71%" }} /></i><strong>71</strong></div>
                <div><b>Gouvernance</b><i><em style={{ width: "69%" }} /></i><strong>69</strong></div>
              </div>
            </div>
          </Reveal>
        </section>

        <section className="method-section public-band band-standards">
          <Reveal className="method-heading">
            <p className="eyebrow">Logique du questionnaire</p>
            <h2>Quand une PME hesite, l'app l'aide a choisir.</h2>
            <p>Chaque critere explique les niveaux possibles, accepte l'option incertain et demande une preuve adaptee.</p>
          </Reveal>
          <div className="method-grid">
            {methodCards.map((item, index) => {
              const Icon = item.icon;
              return (
                <Reveal as="article" className="method-card" key={item.title} delay={index * 80}>
                  <Icon size={22} />
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.detail}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}

function AuthPage({ route, profile, setProfile, authActions, authState }) {
  const [formStatus, setFormStatus] = useState({ type: "", message: "" });

  function update(field, value) {
    setProfile((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setFormStatus({ type: "loading", message: "Creation du compte en cours..." });
    try {
      await authActions.signUp(profile);
      setFormStatus({ type: "success", message: "Compte cree. Vous pouvez continuer le profil entreprise." });
      window.location.hash = "/onboarding";
    } catch (error) {
      setFormStatus({ type: error.info ? "success" : "error", message: error.message });
    }
  }

  return (
    <div className="page auth-page">
      <TopNav route={route} />
      <main className="auth-layout">
        <section className="auth-visual auth-intake">
          <div className="auth-brand-lockup">
            <img src={turritopsisAssets.mark} alt="Turritopsis" />
            <div>
              <strong>TURRITOPSIS</strong>
              <span>Institut Strategique de Developpement Durable</span>
            </div>
          </div>
          <div className="auth-divider" aria-hidden="true" />
          <p className="auth-brand-intro">
            Creez votre espace entreprise et avancez dans une demarche ESG fiable, structuree et reconnue.
          </p>
          <div className="auth-illustration" aria-hidden="true">
            <div className="earth-visual">
              <Globe2 size={96} />
              <Leaf size={34} className="earth-leaf" />
            </div>
            <div className="chart-visual">
              <span />
              <span />
              <span />
              <span />
            </div>
            <div className="mini-orbit orbit-leaf"><Leaf size={28} /></div>
            <div className="mini-orbit orbit-users"><Users size={30} /></div>
            <div className="orbit-path" />
          </div>
        </section>
        <form className="auth-panel enterprise-form" onSubmit={submit}>
          <div className="auth-form-header">
            <span className="form-badge"><Lock size={15} /> Acces securise</span>
            <div>
              <span className="step-kicker">Etape 1 sur 2</span>
              <h2>Creer l'espace entreprise</h2>
              <p>Seulement les informations necessaires pour ouvrir le dossier.</p>
            </div>
          </div>
          <div className="auth-form-fields">
            <label>
              Nom de l'entreprise
              <input value={profile.companyName} onChange={(event) => update("companyName", event.target.value)} placeholder="Ex: Atlas Green Foods" required />
            </label>
            <label>
              Email professionnel
              <input type="email" value={profile.email} onChange={(event) => update("email", event.target.value)} placeholder="contact@entreprise.com" required />
            </label>
            <div className="form-grid">
              <label>
                Pays
                <input value={profile.country} onChange={(event) => update("country", event.target.value)} placeholder="Maroc" />
              </label>
              <label>
                Taille
                <select value={profile.size} onChange={(event) => update("size", event.target.value)}>
                  <option>1-10</option>
                  <option>11-50</option>
                  <option>51-250</option>
                  <option>250+</option>
                </select>
              </label>
            </div>
            <label>
              Secteur
              <select value={profile.sector} onChange={(event) => update("sector", event.target.value)}>
                {sectors.map((sector) => (
                  <option key={sector.id} value={sector.id}>{sector.label}</option>
                ))}
              </select>
            </label>
            <label>
              Mot de passe
              <span className="password-field">
                <input type="password" value={profile.password} onChange={(event) => update("password", event.target.value)} placeholder="Minimum 8 caracteres" minLength={8} required />
                <Eye size={18} />
              </span>
            </label>
          </div>
          {formStatus.message && <p className={`auth-message ${formStatus.type}`}>{formStatus.message}</p>}
          {!supabaseAuth && <p className="auth-message error">Supabase Auth n'est pas configure dans cet environnement.</p>}
          <p className="auth-form-note">
            <Info size={18} />
            Le profil legal, l'activite et l'annee de reporting seront completes juste apres.
          </p>
          <button className="btn primary full" type="submit" disabled={!supabaseAuth || authState.loading || formStatus.type === "loading"}>
            Creer l'espace et continuer <ChevronRight size={18} />
          </button>
          <a className="login-link" href="#/auth/login">
            <LogIn size={16} />
            J'ai deja un compte
          </a>
        </form>
      </main>
    </div>
  );
}

function LoginPage({ route, authActions, authState, notice }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formStatus, setFormStatus] = useState({ type: notice ? "info" : "", message: notice || "" });

  async function submit(event) {
    event.preventDefault();
    setFormStatus({ type: "loading", message: "Connexion en cours..." });
    try {
      await authActions.signIn(email, password);
      setFormStatus({ type: "success", message: "Connexion reussie." });
      window.location.hash = "/app";
    } catch (error) {
      setFormStatus({ type: "error", message: error.message });
    }
  }

  return (
    <div className="page auth-page compact">
      <TopNav route={route} />
      <main className="auth-layout login-layout">
        <form className="auth-panel" onSubmit={submit}>
          <div className="panel-title">
            <LogIn size={22} />
            <div>
              <h2>Connexion</h2>
              <p>Acces entreprise ou reviewer.</p>
            </div>
          </div>
          <label>
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="contact@entreprise.com" required />
          </label>
          <label>
            Mot de passe
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="********" required />
          </label>
          {formStatus.message && <p className={`auth-message ${formStatus.type}`}>{formStatus.message}</p>}
          {!supabaseAuth && <p className="auth-message error">Supabase Auth n'est pas configure dans cet environnement.</p>}
          <button className="btn primary full" type="submit" disabled={!supabaseAuth || authState.loading || formStatus.type === "loading"}>Entrer</button>
          <a className="login-link" href="#/auth/enterprise">Creer un compte entreprise</a>
        </form>
      </main>
    </div>
  );
}

function OnboardingPage({ route, profile, setProfile }) {
  function update(field, value) {
    setProfile((current) => ({ ...current, [field]: value }));
  }

  return (
    <div className="page app-page onboarding-page">
      <TopNav route={route} />
      <main className="workspace">
        <EnterpriseSidebar route={route} />
        <section className="workspace-main">
          <section className="workspace-heading dashboard-heading onboarding-heading">
            <div>
              <p className="eyebrow">Profil entreprise</p>
              <h1>Finaliser le profil PME.</h1>
              <p>Quelques informations suffisent pour adapter le questionnaire au secteur, a la taille et au niveau de preuves disponible.</p>
            </div>
          </section>

          <section className="onboarding-summary-grid">
            <article className="progress-panel onboarding-status-card">
              <Building2 size={22} />
              <span>Profil</span>
              <strong>74%</strong>
              <div className="bar"><span style={{ width: "74%" }} /></div>
            </article>
            <article className="progress-panel onboarding-status-card">
              <ClipboardList size={22} />
              <span>Questionnaire</span>
              <strong>Pret</strong>
              <small>apres validation du profil</small>
            </article>
            <article className="progress-panel onboarding-status-card">
              <Upload size={22} />
              <span>Preuves</span>
              <strong>Plus tard</strong>
              <small>ajoutees critere par critere</small>
            </article>
          </section>

          <section className="onboarding-body">
            <article className="onboarding-form-card">
              <div className="card-heading onboarding-card-heading">
                <div>
                  <span>Etape 1</span>
                  <h2>Informations de base</h2>
                </div>
                <small>Obligatoire avant le diagnostic</small>
              </div>
              <div className="profile-grid onboarding-profile-grid">
                <label>
                  Nom legal
                  <input value={profile.legalName} onChange={(event) => update("legalName", event.target.value)} placeholder="Raison sociale" />
                </label>
                <label>
                  Identifiant / registre
                  <input value={profile.registration} onChange={(event) => update("registration", event.target.value)} placeholder="ICE, RC ou equivalent" />
                </label>
                <label>
                  Activite principale
                  <input value={profile.activity} onChange={(event) => update("activity", event.target.value)} placeholder="Transformation alimentaire" />
                </label>
                <label>
                  Annee de reporting
                  <input value={profile.year} onChange={(event) => update("year", event.target.value)} placeholder="2026" />
                </label>
                <label className="wide">
                  Adresse
                  <input value={profile.address} onChange={(event) => update("address", event.target.value)} placeholder="Ville, pays" />
                </label>
                <label className="wide">
                  Disponibilite des preuves
                  <select value={profile.proofReadiness} onChange={(event) => update("proofReadiness", event.target.value)}>
                    <option>Preuves disponibles</option>
                    <option>Preuves partielles</option>
                    <option>Preuves a collecter</option>
                  </select>
                </label>
              </div>
              <div className="onboarding-form-actions">
                <a className="btn secondary" href="#/app">Voir dashboard</a>
                <a className="btn primary" href="#/app/questionnaire">Acceder au questionnaire <ArrowRight size={18} /></a>
              </div>
            </article>

            <aside className="onboarding-advisor">
              <h2>Avant de commencer</h2>
              <div className="onboarding-checklist">
                <span><CheckCircle2 size={18} /> Identite de l'entreprise</span>
                <span><CheckCircle2 size={18} /> Activite et annee de reporting</span>
                <span className="warning"><AlertTriangle size={18} /> Preuves ajoutables ensuite</span>
              </div>
              <div className="onboarding-tip">
                <strong>Bon a savoir</strong>
                <p>Le questionnaire expliquera chaque niveau quand l'entreprise ne sait pas encore ou se situer.</p>
              </div>
            </aside>
          </section>
        </section>
      </main>
    </div>
  );
}

function EnterpriseSidebar({ route }) {
  const links = [
    ["/app", Home, "Dashboard"],
    ["/app/company-profile", Building2, "Profil"],
    ["/app/questionnaire", ClipboardList, "Questionnaire"],
    ["/app/proofs", Upload, "Preuves"],
    ["/app/analysis", Bot, "Analyse"],
    ["/app/report", FileText, "Rapport"]
  ];
  return (
    <aside className="side-nav">
      <div className="side-title">
        <PanelLeft size={18} />
        <span>Espace PME</span>
      </div>
      {links.map(([path, Icon, label]) => (
        <a className={route === path || (route === "/onboarding" && path === "/app/company-profile") ? "active" : ""} href={`#${path}`} key={path}>
          <Icon size={18} />
          {label}
        </a>
      ))}
      <button className="sidebar-logout" type="button" onClick={() => supabaseAuth?.auth.signOut().then(() => { window.location.hash = "/auth/login"; })}>
        <LogIn size={18} />
        Deconnexion
      </button>
    </aside>
  );
}

function DashboardPage({ route, state, actions }) {
  const level = getLevel(state.reviewedGlobalScore);
  return (
    <div className="page app-page dashboard-page">
      <TopNav route={route} />
      <main className="workspace">
        <EnterpriseSidebar route={route} />
        <section className="workspace-main">
          <div className="workspace-heading rowed dashboard-heading">
            <div>
              <p className="eyebrow">Dashboard PME</p>
              <h1>{state.profile.companyName || "Entreprise demo"}</h1>
              <p>{level.label} - {level.tone}</p>
            </div>
            <div className="cta-row compact">
              <button className="btn secondary" type="button" onClick={actions.loadSnapshot}>Charger</button>
              <button className="btn primary" type="button" onClick={actions.saveSnapshot}>Sauvegarder</button>
            </div>
          </div>
          <section className="dashboard-grid">
            <article className="score-panel">
              <div className="score-panel-top">
                <span>Score revu</span>
                <small>{level.label}</small>
              </div>
              <div className="score-panel-value">
                <strong>{state.reviewedGlobalScore}</strong>
                <small>/100</small>
              </div>
              <div className="bar"><span style={{ width: `${state.reviewedGlobalScore}%` }} /></div>
            </article>
            <article className="progress-panel">
              <ClipboardCheck size={22} />
              <span>Questionnaire</span>
              <strong>{state.completion}%</strong>
            </article>
            <article className="progress-panel">
              <Upload size={22} />
              <span>Preuves</span>
              <strong>{state.proofCompletion}%</strong>
            </article>
            <article className="progress-panel">
              <Bot size={22} />
              <span>Revue IA</span>
              <strong>{state.reviewCompletion}%</strong>
            </article>
          </section>
          <section className="dashboard-columns">
            <div className="pillar-chart">
              {pillars.map((pillar) => {
                const Icon = pillar.icon;
                return (
                  <article key={pillar.id}>
                    <Icon size={20} />
                    <div>
                      <strong>{pillar.label}</strong>
                      <div className="bar"><span style={{ width: `${state.reviewedScores[pillar.id]}%` }} /></div>
                    </div>
                    <b>{state.reviewedScores[pillar.id]}</b>
                  </article>
                );
              })}
            </div>
            <div className="next-actions">
              <h2>Priorites</h2>
              {state.priorityQuestions.slice(0, 5).map((question) => (
                <a href="#/app/questionnaire" key={question.code}>
                  <span>{question.code}</span>
                  <strong>{question.title}</strong>
                  <ChevronRight size={18} />
                </a>
              ))}
              {!state.priorityQuestions.length && <p>Toutes les priorites universelles sont a un niveau satisfaisant.</p>}
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}

function CompanyProfilePage({ route, profile, setProfile }) {
  return <OnboardingPage route={route} profile={profile} setProfile={setProfile} />;
}

function QuestionnairePage({ route, state, actions }) {
  const { sector, setSector, activePillar, setActivePillar, questions, answers, reviews, pillarScores } = state;
  const sectorMeta = sectors.find((item) => item.id === sector);

  return (
    <div className="page app-page questionnaire-page">
      <TopNav route={route} />
      <main className="workspace">
        <EnterpriseSidebar route={route} />
        <section className="workspace-main">
          <div className="workspace-heading rowed dashboard-heading questionnaire-heading">
            <div>
              <p className="eyebrow">Questionnaire PME</p>
              <h1>Questionnaire ESG guide.</h1>
              <p>Secteur {sectorMeta.code}: {sectorMeta.label}. Repondez simplement, puis ajoutez les preuves disponibles.</p>
            </div>
            {state.enableTestTools && (
              <button className="btn secondary" type="button" onClick={actions.fillTestProofs}>
                <FileText size={18} />
                Remplir test
              </button>
            )}
          </div>

          <section className="sector-picker">
            {sectors.map((item) => {
              const Icon = item.icon;
              return (
                <button className={sector === item.id ? "selected" : ""} key={item.id} type="button" onClick={() => setSector(item.id)}>
                  <Icon size={20} />
                  <span>{item.code}</span>
                  <strong>{item.label}</strong>
                </button>
              );
            })}
          </section>

          <section className="questionnaire-shell">
            <aside className="pillar-tabs">
              {pillars.map((pillar) => {
                const Icon = pillar.icon;
                return (
                  <button className={activePillar === pillar.id ? "active" : ""} type="button" key={pillar.id} onClick={() => setActivePillar(pillar.id)}>
                    <Icon size={18} />
                    <span>{pillar.label}</span>
                    <strong>{pillarScores[pillar.id].score}</strong>
                  </button>
                );
              })}
            </aside>

            <div className="question-stack">
              {questions[activePillar].map((question) => (
                <QuestionCard key={`${sector}-${question.code}`} question={question} answer={answers[question.code] || emptyAnswer()} review={reviews[question.code] || emptyReview()} actions={actions} pillarScore={pillarScores[activePillar]} />
              ))}
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}

function QuestionCard({ question, answer, review, actions, pillarScore }) {
  const freshReview = review.status === "done" && review.evidence === answer.evidence;
  const staleReview = review.status === "done" && !freshReview;
  const naBlocked = answer.value !== "NA" && pillarScore.naCount >= 3;
  const guidance = suggestedGuidance(question);

  return (
    <article className={`question-card ${question.priority ? "priority" : ""}`}>
      <header>
        <span>{question.code}</span>
        <div>
          <h2>{question.title}</h2>
          <p>{question.description}</p>
        </div>
        {question.priority && <b>Priorite</b>}
      </header>

      <div className="score-options">
        {scoreOptions.map((option) => (
          <button
            className={answer.value === option.value ? "selected" : ""}
            disabled={option.value === "NA" && naBlocked}
            key={option.value}
            type="button"
            onClick={() => actions.updateAnswer(question.code, { value: option.value, guidance: option.value === "unknown" ? guidance.join("\n") : answer.guidance })}
          >
            <strong>{option.label}</strong>
            <span>{option.title}</span>
            <small>{option.detail}</small>
          </button>
        ))}
      </div>

      {answer.value === "unknown" && (
        <div className="guidance-box">
          <HelpCircle size={18} />
          <div>
            <strong>Aide au positionnement</strong>
            {guidance.map((item) => <p key={item}>{item}</p>)}
          </div>
        </div>
      )}

      <div className="evidence-grid">
        <label>
          Preuves
          <textarea value={answer.evidence} onChange={(event) => actions.updateAnswer(question.code, { evidence: event.target.value })} placeholder={question.evidence} />
        </label>
        <label>
          Justification
          <textarea value={answer.justification} onChange={(event) => actions.updateAnswer(question.code, { justification: event.target.value })} placeholder="Decision, contexte, limite ou justification NA." />
        </label>
      </div>

      <section className={`review-strip ${review.status} ${staleReview ? "stale" : ""}`}>
        <div>
          <Bot size={18} />
          <strong>Analyse preuve</strong>
          {freshReview && <span>{review.source} - confiance {review.confidence}%</span>}
          {staleReview && <span>A relancer</span>}
        </div>
        <button type="button" onClick={() => actions.reviewQuestion(question)}>
          <Sparkles size={16} />
          Analyser
        </button>
        {review.status === "done" && (
          <div className="review-body">
            <strong>Score suggere: {review.suggestedScore}</strong>
            <p>{review.summary}</p>
            <div className="audit-meta">
              <span>Risque: {review.risk || "a verifier"}</span>
              <span>{review.documents.length ? `${review.documents.length} document(s) relie(s)` : "Aucun document relie"}</span>
            </div>
            <p>{review.recommendation}</p>
            {!!review.missing.length && <small>Manque: {review.missing.join(", ")}</small>}
          </div>
        )}
        {review.status === "idle" && <p>Preuve non analysee.</p>}
      </section>
    </article>
  );
}

function ProofsPage({ route, state, actions }) {
  const [draftDocument, setDraftDocument] = useState({ title: "", type: "Document", content: "" });
  const proofRows = state.allQuestions.filter((question) => {
    const answer = state.answers[question.code] || emptyAnswer();
    const review = state.reviews[question.code] || emptyReview();
    return (answer.value && answer.value !== "NA") || review.status === "done";
  });
  function submitDocument(event) {
    event.preventDefault();
    actions.addDocument(draftDocument);
    setDraftDocument({ title: "", type: "Document", content: "" });
  }
  return (
    <div className="page app-page proofs-page">
      <TopNav route={route} />
      <main className="workspace">
        <EnterpriseSidebar route={route} />
        <section className="workspace-main">
          <div className="workspace-heading rowed dashboard-heading proofs-heading">
            <div>
              <p className="eyebrow">Preuves</p>
              <h1>Dossier documentaire.</h1>
              <p>Les pieces justificatives seront regroupees ici apres les reponses au questionnaire.</p>
            </div>
            <button className="btn secondary" type="button" onClick={actions.reviewAllVisible} disabled={state.aiStatus.status === "scanning"}>
              <Sparkles size={18} />
              Analyser tout
            </button>
          </div>

          <section className="document-scan-panel">
            <div className="document-scan-copy">
              <p className="eyebrow">Documents d'abord</p>
              <h2>Ajoutez les preuves, puis laissez l'IA proposer les scores.</h2>
              <p>Le scan relie les documents aux criteres ESG, remplit les preuves trouvees et genere un mini-audit par pratique.</p>
              <div className={`ai-status ${state.aiStatus.status}`}>
                <Bot size={16} />
                <span>{state.aiStatus.message}</span>
              </div>
              <div className="document-actions">
                {state.enableTestTools && <button className="btn secondary" type="button" onClick={actions.fillTestDocuments}>Documents test</button>}
                <button className="btn primary" type="button" onClick={actions.scanDocuments} disabled={!state.documents.length || state.aiStatus.status === "scanning"}>
                  <Bot size={18} />
                  {state.aiStatus.status === "scanning" ? "Scan en cours..." : "Scanner les documents"}
                </button>
              </div>
            </div>
            <form className="document-form" onSubmit={submitDocument}>
              <label>
                Nom du document
                <input value={draftDocument.title} onChange={(event) => setDraftDocument((current) => ({ ...current, title: event.target.value }))} placeholder="Audit energie 2025" />
              </label>
              <label>
                Type
                <select value={draftDocument.type} onChange={(event) => setDraftDocument((current) => ({ ...current, type: event.target.value }))}>
                  <option>Document</option>
                  <option>Audit</option>
                  <option>Facture</option>
                  <option>Politique</option>
                  <option>PV</option>
                  <option>Certificat</option>
                </select>
              </label>
              <label className="wide">
                Contenu ou resume de la preuve
                <textarea value={draftDocument.content} onChange={(event) => setDraftDocument((current) => ({ ...current, content: event.target.value }))} placeholder="Collez ici le contenu utile: date, indicateur, responsable, resultat, action suivie..." />
              </label>
              <button className="btn secondary" type="submit">Ajouter au dossier</button>
            </form>
          </section>

          <section className="document-library">
            <div>
              <h2>Documents charges</h2>
              <p>{state.documents.length ? `${state.documents.length} document(s) pret(s) pour le scan.` : "Aucun document ajoute pour le moment."}</p>
            </div>
            <div className="document-chips">
              {state.documents.map((document) => (
                <span key={document.id}>{document.type} - {document.title}</span>
              ))}
              {!state.documents.length && <span>Ajoutez une preuve manuellement.</span>}
            </div>
          </section>

          <div className="proof-table">
            {proofRows.map((question) => {
              const answer = state.answers[question.code] || emptyAnswer();
              const review = state.reviews[question.code] || emptyReview();
              return (
                <article key={question.code}>
                  <span>{question.code}</span>
                  <div>
                    <strong>{question.title}</strong>
                    <p>{answer.evidence || review.evidence || "Aucune preuve renseignee."}</p>
                    {review.status === "done" && (
                      <small>{review.audit} {review.recommendation}</small>
                    )}
                  </div>
                  <b className={review.status === "done" ? "ok" : "pending"}>{review.status === "done" ? review.suggestedScore : "Non revu"}</b>
                </article>
              );
            })}
            {!proofRows.length && (
              <section className="empty-proof-state">
                <Upload size={24} />
                <div>
                  <h2>Aucune preuve a revoir pour le moment.</h2>
                  <p>Commencez par noter quelques criteres dans le questionnaire. Les preuves ajoutees apparaitront ici avec leur statut de revue.</p>
                </div>
                <a className="btn primary" href="#/app/questionnaire">Ouvrir le questionnaire <ArrowRight size={18} /></a>
              </section>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function AnalysisPage({ route, state, actions }) {
  return (
    <div className="page app-page analysis-page">
      <TopNav route={route} />
      <main className="workspace">
        <EnterpriseSidebar route={route} />
        <section className="workspace-main">
          <div className="workspace-heading rowed dashboard-heading analysis-heading">
            <div>
              <p className="eyebrow">Analyse IA</p>
              <h1>Analyse globale du dossier.</h1>
              <p>Comparez le score declare, les preuves ajoutees et les points sensibles avant revue humaine.</p>
            </div>
            <button className="btn primary" type="button" onClick={actions.runGlobalAnalysis}>
              <Bot size={18} />
              Analyser
            </button>
          </div>
          <section className="analysis-layout">
            <article className="analysis-score">
              <div>
                <span>Score declare</span>
                <strong>{state.globalScore}</strong>
              </div>
              <div>
                <span>Score revu</span>
                <strong>{state.reviewedGlobalScore}</strong>
              </div>
            </article>
            <article className={`analysis-result ${state.globalAnalysis.status}`}>
              <div className="panel-title">
                <Sparkles size={22} />
                <div>
                  <h2>{state.globalAnalysis.verdict || "Dossier en attente"}</h2>
                  <p>{state.globalAnalysis.riskLevel ? `Risque ${state.globalAnalysis.riskLevel} - confiance ${state.globalAnalysis.confidence}%` : "Analyse non lancee."}</p>
                </div>
              </div>
              <p>{state.globalAnalysis.executiveSummary || "Lancez l'analyse lorsque les reponses et preuves principales sont pretes."}</p>
              <div className="analysis-columns">
                <div>
                  <h3>Forces</h3>
                  <ul>{state.globalAnalysis.strengths.map((item) => <li key={item}>{item}</li>)}</ul>
                </div>
                <div>
                  <h3>Risques</h3>
                  <ul>{state.globalAnalysis.risks.map((item) => <li key={item}>{item}</li>)}</ul>
                </div>
              </div>
              <h3>Roadmap</h3>
              <ol>{state.globalAnalysis.roadmap.map((item) => <li key={item}>{item}</li>)}</ol>
            </article>
          </section>
        </section>
      </main>
    </div>
  );
}

function ReportPage({ route, state, actions }) {
  const level = getLevel(state.reviewedGlobalScore);
  return (
    <div className="page app-page report-page">
      <TopNav route={route} />
      <main className="workspace">
        <EnterpriseSidebar route={route} />
        <section className="workspace-main">
          <div className="workspace-heading rowed dashboard-heading report-heading">
            <div>
              <p className="eyebrow">Rapport ESG</p>
              <h1>{level.label}</h1>
              <p>{state.profile.companyName || "Entreprise demo"} - score revu {state.reviewedGlobalScore}/100.</p>
            </div>
            <div className="cta-row compact">
              <button className="btn secondary" type="button" onClick={actions.downloadReport}><Download size={18} /> TXT</button>
              <button className="btn secondary" type="button" onClick={() => window.print()}><Printer size={18} /> Print</button>
            </div>
          </div>
          <section className="report-sheet">
            <div className="report-score-card">
              <div className="report-score">
                <div>
                  <strong>{state.reviewedGlobalScore}</strong>
                  <span>/100</span>
                </div>
              </div>
              <small>Score revu</small>
            </div>
            <div className="report-summary">
              <h2>Synthese</h2>
              <p>{state.globalAnalysis.executiveSummary || level.tone}</p>
            </div>
            <div className="pillar-chart printable">
              {pillars.map((pillar) => {
                const Icon = pillar.icon;
                return (
                  <article key={pillar.id}>
                    <Icon size={20} />
                    <div>
                      <strong>{pillar.label}</strong>
                      <div className="bar"><span style={{ width: `${state.reviewedScores[pillar.id]}%` }} /></div>
                    </div>
                    <b>{state.reviewedScores[pillar.id]}</b>
                  </article>
                );
              })}
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}

function ReviewerSidebar({ route }) {
  const links = [
    ["/review", Gauge, "Vue globale"],
    ["/review/dossiers", BriefcaseBusiness, "Dossiers"],
    ["/admin/questionnaire", Settings, "Questionnaire"]
  ];
  return (
    <aside className="side-nav reviewer">
      <div className="side-title">
        <Landmark size={18} />
        <span>Reviewer</span>
      </div>
      {links.map(([path, Icon, label]) => (
        <a className={route === path || (path === "/review/dossiers" && route.startsWith("/review/dossiers/")) ? "active" : ""} href={`#${path}`} key={path}>
          <Icon size={18} />
          {label}
        </a>
      ))}
    </aside>
  );
}

function ReviewerPage({ route, state }) {
  const weakProofs = state.allQuestions.filter((question) => {
    const answer = state.answers[question.code] || emptyAnswer();
    const review = state.reviews[question.code] || emptyReview();
    return answer.value && answer.value !== "NA" && (review.status !== "done" || review.suggestedScore !== answer.value);
  });
  return (
    <div className="page reviewer-page">
      <TopNav route={route} />
      <main className="workspace">
        <ReviewerSidebar route={route} />
        <section className="workspace-main">
          <div className="workspace-heading dashboard-heading reviewer-heading">
            <p className="eyebrow">Workspace analyste</p>
            <h1>Validation des dossiers ESG.</h1>
            <p>Vue operationnelle pour verifier les preuves, arbitrer les scores et preparer l'avis final.</p>
          </div>
          <section className="review-grid">
            <article className="review-kpi">
              <span>Dossiers</span>
              <strong>12</strong>
              <small>4 en revue</small>
            </article>
            <article className="review-kpi">
              <span>Risque eleve</span>
              <strong>{weakProofs.length}</strong>
              <small>preuves a examiner</small>
            </article>
            <article className="review-kpi">
              <span>Score demo</span>
              <strong>{state.reviewedGlobalScore}</strong>
              <small>{getLevel(state.reviewedGlobalScore).label}</small>
            </article>
          </section>
          <section className="review-workspace">
            <div className="dossier-list">
              <div className="search-box">
                <Search size={18} />
                <input placeholder="Chercher un dossier" />
              </div>
              {["Atlas Green Foods", "MedTech Services", "Nord Pack Industrie"].map((name, index) => (
                <a className={index === 0 ? "active" : ""} href="#/review/dossiers/atlas" key={name}>
                  <strong>{name}</strong>
                  <span>{index === 0 ? `${state.reviewedGlobalScore}/100 - en revue` : "En attente"}</span>
                </a>
              ))}
            </div>
            <div className="evidence-review">
              <h2>{state.profile.companyName || "Atlas Green Foods"}</h2>
              <p>Pieces prioritaires pour validation humaine.</p>
              {weakProofs.slice(0, 8).map((question) => {
                const answer = state.answers[question.code] || emptyAnswer();
                const review = state.reviews[question.code] || emptyReview();
                return (
                  <article key={question.code}>
                    <span>{question.code}</span>
                    <div>
                      <strong>{question.title}</strong>
                      <p>{review.summary || answer.evidence || "Aucune revue disponible."}</p>
                    </div>
                    <button type="button">Valider</button>
                  </article>
                );
              })}
              {!weakProofs.length && (
                <section className="review-empty-state">
                  <CheckCircle2 size={24} />
                  <div>
                    <h3>Aucune preuve sensible a traiter.</h3>
                    <p>Les preuves a arbitrer apparaitront ici quand le dossier contiendra des ecarts entre score declare et revue assistee.</p>
                  </div>
                </section>
              )}
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}

function AdminQuestionnairePage({ route, state }) {
  return (
    <div className="page reviewer-page">
      <TopNav route={route} />
      <main className="workspace">
        <ReviewerSidebar route={route} />
        <section className="workspace-main">
          <div className="workspace-heading dashboard-heading reviewer-heading">
            <p className="eyebrow">Administration</p>
            <h1>Structure questionnaire.</h1>
            <p>Gestion MVP des piliers, secteurs, questions et niveaux de preuve.</p>
          </div>
          <section className="admin-table">
            {state.allQuestions.map((question) => (
              <article key={question.code}>
                <span>{question.code}</span>
                <strong>{question.title}</strong>
                <p>{question.evidence}</p>
                <b>{question.priority ? "Universel" : "Sectoriel / commun"}</b>
              </article>
            ))}
          </section>
        </section>
      </main>
    </div>
  );
}

function emptyGlobalAnalysis() {
  return {
    status: "idle",
    verdict: "",
    riskLevel: "",
    confidence: 0,
    executiveSummary: "",
    strengths: [],
    risks: [],
    roadmap: []
  };
}

function createGlobalAnalysis(allQuestions, answers, reviews, reviewedGlobalScore, reviewedScores) {
  const answered = allQuestions.filter((question) => answers[question.code]?.value);
  const proofed = answered.filter((question) => answers[question.code]?.evidence || answers[question.code]?.value === "NA");
  const reviewed = answered.filter((question) => reviews[question.code]?.status === "done");
  const weak = allQuestions.filter((question) => {
    const answer = answers[question.code] || emptyAnswer();
    const review = reviews[question.code] || emptyReview();
    return answer.value && answer.value !== "NA" && (answer.value === "0" || review.suggestedScore === "0");
  });
  const missingCritical = allQuestions.filter((question) => {
    const answer = answers[question.code] || emptyAnswer();
    return question.priority && (!answer.value || answer.value === "unknown" || answer.value === "0");
  });
  const riskLevel = missingCritical.length > 2 || proofed.length < answered.length * 0.65 ? "eleve" : reviewedGlobalScore >= 60 ? "modere" : "important";

  return {
    status: "done",
    verdict: reviewedGlobalScore >= 60 ? "Dossier exploitable avec reserves ciblees" : "Dossier a renforcer avant validation",
    riskLevel,
    confidence: Math.min(94, 42 + reviewed.length * 2),
    executiveSummary: `Le dossier obtient ${reviewedGlobalScore}/100 apres revue locale. Les piliers sont E ${reviewedScores.E}, S ${reviewedScores.S}, G ${reviewedScores.G}.`,
    strengths: [
      reviewedScores.E >= 60 ? "Pilotage environnemental visible." : "Premieres preuves environnementales identifiees.",
      reviewedScores.S >= 60 ? "Socle social structure." : "Dialogue social et conditions de travail a consolider.",
      reviewedScores.G >= 60 ? "Gouvernance documentee." : "Gouvernance a formaliser pour rassurer les reviewers."
    ],
    risks: [
      weak.length ? `${weak.length} criteres restent faibles ou peu prouves.` : "Peu de criteres faibles detectes.",
      missingCritical.length ? `${missingCritical.length} priorites universelles demandent une attention immediate.` : "Priorites universelles globalement couvertes.",
      proofed.length < answered.length ? "Certaines reponses manquent encore de preuve." : "Les reponses renseignees ont une preuve ou justification."
    ],
    roadmap: [
      "Verifier les criteres universels E2, E5, S2, S5, G1 et G2.",
      "Ajouter dates, indicateurs et documents sources aux preuves faibles.",
      "Soumettre le dossier au reviewer avec les pieces prioritaires."
    ]
  };
}

function ProtectedRoute({ route, authState, authActions, children }) {
  if (authState.loading) {
    return (
      <div className="page auth-page compact">
        <TopNav route={route} />
        <main className="auth-layout login-layout">
          <section className="auth-panel">
            <div className="panel-title">
              <Lock size={22} />
              <div>
                <h2>Verification de la session</h2>
                <p>Controle de l'acces securise en cours.</p>
              </div>
            </div>
          </section>
        </main>
      </div>
    );
  }

  if (!authState.session) {
    return <LoginPage route="/auth/login" authActions={authActions} authState={authState} notice="Connectez-vous pour acceder a cet espace." />;
  }

  return children;
}

function App() {
  const [route, setRoute] = useState(() => window.location.hash.replace("#", "") || "/");
  const [sector, setSector] = useState("industry");
  const [activePillar, setActivePillar] = useState("E");
  const [answers, setAnswers] = useState({});
  const [reviews, setReviews] = useState({});
  const [documents, setDocuments] = useState([]);
  const [aiStatus, setAiStatus] = useState({ status: "local", message: "Mode local pret. Lancez le serveur Ollama pour une vraie analyse LLM." });
  const [globalAnalysis, setGlobalAnalysis] = useState(emptyGlobalAnalysis);
  const [authState, setAuthState] = useState({ loading: true, session: null, user: null });
  const [profile, setProfile] = useState(() => ({
    companyName: ENABLE_TEST_TOOLS ? "Atlas Green Foods" : "",
    email: ENABLE_TEST_TOOLS ? "contact@atlasgreen.ma" : "",
    password: "",
    country: "Maroc",
    size: "51-250",
    sector: "industry",
    legalName: ENABLE_TEST_TOOLS ? "Atlas Green Foods SARL" : "",
    registration: "",
    activity: ENABLE_TEST_TOOLS ? "Transformation alimentaire" : "",
    year: "2026",
    address: ENABLE_TEST_TOOLS ? "Casablanca, Maroc" : "",
    proofReadiness: "Preuves partielles"
  }));

  React.useEffect(() => {
    const onHash = () => setRoute(window.location.hash.replace("#", "") || "/");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  React.useEffect(() => {
    if (!supabaseAuth) {
      setAuthState({ loading: false, session: null, user: null });
      return undefined;
    }

    let mounted = true;
    supabaseAuth.auth.getSession().then(({ data }) => {
      if (mounted) {
        setAuthState({ loading: false, session: data.session, user: data.session?.user || null });
        if (data.session && hasAuthCallbackHash()) {
          cleanAuthCallbackUrl();
          setRoute("/onboarding");
        }
      }
    });

    const { data } = supabaseAuth.auth.onAuthStateChange((_event, session) => {
      setAuthState({ loading: false, session, user: session?.user || null });
      if (session && hasAuthCallbackHash()) {
        cleanAuthCallbackUrl();
        setRoute("/onboarding");
      }
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  React.useEffect(() => {
    if (profile.sector && profile.sector !== sector) setSector(profile.sector);
  }, [profile.sector]);

  const questions = useMemo(() => buildQuestions(sector), [sector]);
  const allQuestions = useMemo(() => pillars.flatMap((pillar) => questions[pillar.id]), [questions]);
  const pillarScores = useMemo(
    () => Object.fromEntries(pillars.map((pillar) => [pillar.id, scorePillar(questions[pillar.id], answers, reviews, false)])),
    [questions, answers, reviews]
  );
  const reviewedPillarScores = useMemo(
    () => Object.fromEntries(pillars.map((pillar) => [pillar.id, scorePillar(questions[pillar.id], answers, reviews, true)])),
    [questions, answers, reviews]
  );
  const scores = useMemo(() => Object.fromEntries(pillars.map((pillar) => [pillar.id, pillarScores[pillar.id].score])), [pillarScores]);
  const reviewedScores = useMemo(() => Object.fromEntries(pillars.map((pillar) => [pillar.id, reviewedPillarScores[pillar.id].score])), [reviewedPillarScores]);
  const globalScore = Math.round((scores.E + scores.S + scores.G) / 3);
  const reviewedGlobalScore = Math.round((reviewedScores.E + reviewedScores.S + reviewedScores.G) / 3);
  const answeredCount = allQuestions.filter((question) => answers[question.code]?.value).length;
  const proofCount = allQuestions.filter((question) => answers[question.code]?.evidence || answers[question.code]?.value === "NA").length;
  const reviewCount = allQuestions.filter((question) => reviews[question.code]?.status === "done").length;
  const completion = Math.round((answeredCount / allQuestions.length) * 100);
  const proofCompletion = Math.round((proofCount / allQuestions.length) * 100);
  const reviewCompletion = Math.round((reviewCount / allQuestions.length) * 100);
  const priorityQuestions = allQuestions.filter((question) => {
    const answer = answers[question.code] || emptyAnswer();
    return question.priority && (!answer.value || answer.value === "unknown" || answer.value === "0" || answer.value === "0.5");
  });

  const authActions = {
    async signUp(nextProfile) {
      if (!supabaseAuth) throw new Error("Supabase Auth n'est pas configure.");
      if (!nextProfile.email || !nextProfile.password) throw new Error("Email et mot de passe obligatoires.");
      if (nextProfile.password.length < 8) throw new Error("Le mot de passe doit contenir au moins 8 caracteres.");

      const { data, error } = await supabaseAuth.auth.signUp({
        email: nextProfile.email,
        password: nextProfile.password,
        options: {
          emailRedirectTo: AUTH_REDIRECT_URL,
          data: {
            company_name: nextProfile.companyName,
            country: nextProfile.country,
            size: nextProfile.size,
            sector: nextProfile.sector
          }
        }
      });

      if (error) throw error;
      if (!data.session) {
        const confirmation = new Error("Compte cree. Confirmez l'email si Supabase le demande, puis connectez-vous.");
        confirmation.info = true;
        window.location.hash = "/auth/login";
        throw confirmation;
      }
    },
    async signIn(email, password) {
      if (!supabaseAuth) throw new Error("Supabase Auth n'est pas configure.");
      const { error } = await supabaseAuth.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    async signOut() {
      await supabaseAuth?.auth.signOut();
      window.location.hash = "/auth/login";
    }
  };

  function authHeaders(extraHeaders = {}) {
    return {
      ...extraHeaders,
      ...(authState.session?.access_token ? { Authorization: `Bearer ${authState.session.access_token}` } : {})
    };
  }

  function updateAnswer(code, patch) {
    setAnswers((current) => ({ ...current, [code]: { ...emptyAnswer(), ...(current[code] || {}), ...patch } }));
  }

  async function getAiReview(question, answer) {
    const hasUsefulInput = answer.evidence || answer.justification || documentsForQuestion(question, documents).length;
    if (!hasUsefulInput) return proofReview(question, answer, documents);

    try {
      const response = await fetch(AI_REVIEW_API, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          question,
          selectedScore: answer.value,
          proof: [answer.evidence, ...documentsForQuestion(question, documents).map((document) => `${document.title}: ${document.content}`)].filter(Boolean).join("\n"),
          justification: answer.justification,
          answer,
          documents
        })
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Analyse IA indisponible.");
      setAiStatus({ status: "ollama", message: "Analyse realisee avec le backend securise." });
      return normalizeRemoteReview(question, answer, payload.review, documents);
    } catch (error) {
      setAiStatus({ status: "fallback", message: `Analyse IA indisponible: fallback local utilise. ${error.message}` });
      return proofReview(question, answer, documents);
    }
  }

  async function reviewQuestion(question) {
    const answer = answers[question.code] || emptyAnswer();
    setAiStatus({ status: "scanning", message: `Analyse IA de ${question.code} en cours...` });
    const review = await getAiReview(question, answer);
    setReviews((current) => ({ ...current, [question.code]: review }));
  }

  function fillTestProofs() {
    if (!ENABLE_TEST_TOOLS) return;
    const nextAnswers = {};
    const nextReviews = {};
    allQuestions.forEach((question, index) => {
      const value = question.priority ? "1" : index % 5 === 0 ? "0.5" : "1";
      const answer = { value, evidence: makeTestEvidence(question), justification: question.priority ? "Critere prioritaire suivi." : "Preuve demo pour test.", guidance: "" };
      nextAnswers[question.code] = answer;
      nextReviews[question.code] = proofReview(question, answer, documents);
    });
    setAnswers(nextAnswers);
    setReviews(nextReviews);
    setGlobalAnalysis(emptyGlobalAnalysis());
  }

  function addDocument(document) {
    const cleanDocument = {
      id: `doc-${Date.now()}`,
      title: document.title?.trim() || "Document sans titre",
      type: document.type?.trim() || "Document",
      content: document.content?.trim()
    };
    if (!cleanDocument.content) return;
    setDocuments((current) => [cleanDocument, ...current]);
  }

  function fillTestDocuments() {
    if (!ENABLE_TEST_TOOLS) return;
    setDocuments(sampleDocuments);
    setGlobalAnalysis(emptyGlobalAnalysis());
  }

  async function scanDocuments() {
    setAiStatus({ status: "scanning", message: "Scan IA des documents en cours..." });
    const nextAnswers = { ...answers };
    const nextReviews = {};
    for (const question of allQuestions) {
      const currentAnswer = { ...emptyAnswer(), ...(nextAnswers[question.code] || {}) };
      const review = await getAiReview(question, currentAnswer);
      const shouldUseAiScore = !currentAnswer.value || currentAnswer.value === "unknown";
      nextReviews[question.code] = review;
      nextAnswers[question.code] = {
        ...currentAnswer,
        value: shouldUseAiScore ? review.suggestedScore : currentAnswer.value,
        evidence: currentAnswer.evidence || review.evidence,
        justification: currentAnswer.justification || `Score propose par scan IA local. ${review.recommendation}`,
        guidance: currentAnswer.guidance
      };
    }
    setAnswers(nextAnswers);
    setReviews(nextReviews);
    setGlobalAnalysis(emptyGlobalAnalysis());
  }

  async function reviewAllVisible() {
    setAiStatus({ status: "scanning", message: "Analyse des preuves renseignees en cours..." });
    const nextReviews = { ...reviews };
    for (const question of allQuestions) {
      if (answers[question.code]?.value) nextReviews[question.code] = await getAiReview(question, answers[question.code]);
    }
    setReviews(nextReviews);
  }

  async function runGlobalAnalysis() {
    setAiStatus({ status: "scanning", message: "Analyse globale en cours..." });
    const nextReviews = { ...reviews };
    for (const question of allQuestions) {
      if (answers[question.code]?.value && nextReviews[question.code]?.status !== "done") {
        nextReviews[question.code] = await getAiReview(question, answers[question.code]);
      }
    }
    setReviews(nextReviews);
    setGlobalAnalysis(createGlobalAnalysis(allQuestions, answers, nextReviews, reviewedGlobalScore, reviewedScores));
  }

  function downloadReport() {
    const rows = [
      "Turritopsis ESG Diagnostic",
      `Entreprise: ${profile.companyName}`,
      `Score declare: ${globalScore}/100`,
      `Score revu: ${reviewedGlobalScore}/100`,
      "",
      ...allQuestions.map((question) => {
        const answer = answers[question.code] || emptyAnswer();
        const review = reviews[question.code] || emptyReview();
        return `${question.code} ${question.title}: ${answer.value || "non repondu"} | IA ${review.suggestedScore || "non revue"} | ${answer.evidence || "sans preuve"}`;
      })
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "rapport-esg-turritopsis.txt";
    link.click();
    URL.revokeObjectURL(url);
  }

  function resetDiagnostic() {
    setAnswers({});
    setReviews({});
    setDocuments([]);
    setGlobalAnalysis(emptyGlobalAnalysis());
  }

  function snapshotData() {
    return {
      sector,
      activePillar,
      answers,
      reviews,
      documents,
      globalAnalysis,
      profile
    };
  }

  function restoreSnapshot(data) {
    if (!data) return;
    if (data.sector) setSector(data.sector);
    if (data.activePillar) setActivePillar(data.activePillar);
    if (data.answers) setAnswers(data.answers);
    if (data.reviews) setReviews(data.reviews);
    if (data.documents) setDocuments(data.documents);
    if (data.globalAnalysis) setGlobalAnalysis(data.globalAnalysis);
    if (data.profile) setProfile((current) => ({ ...current, ...data.profile }));
  }

  async function saveSnapshot() {
    const companyId = profile.companyName || "demo";
    setAiStatus({ status: "scanning", message: "Sauvegarde du dossier en cours..." });
    try {
      const response = await fetch(SNAPSHOT_API, {
        method: "PUT",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ company_id: companyId, data: snapshotData() })
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Sauvegarde impossible.");
      setAiStatus({ status: "ollama", message: "Dossier sauvegarde dans la base." });
    } catch (error) {
      setAiStatus({ status: "fallback", message: `Sauvegarde non disponible: ${error.message}` });
    }
  }

  async function loadSnapshot() {
    const companyId = profile.companyName || "demo";
    setAiStatus({ status: "scanning", message: "Chargement du dossier en cours..." });
    try {
      const response = await fetch(`${SNAPSHOT_API}?company_id=${encodeURIComponent(companyId)}`, {
        headers: authHeaders()
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Chargement impossible.");
      restoreSnapshot(payload.data);
      setAiStatus({ status: "ollama", message: payload.data ? "Dossier charge depuis la base." : "Aucun dossier sauvegarde trouve." });
    } catch (error) {
      setAiStatus({ status: "fallback", message: `Chargement non disponible: ${error.message}` });
    }
  }

  const state = {
    sector,
    setSector,
    activePillar,
    setActivePillar,
    questions,
    allQuestions,
    answers,
    reviews,
    documents,
    aiStatus,
    pillarScores,
    reviewedPillarScores,
    scores,
    reviewedScores,
    globalScore,
    reviewedGlobalScore,
    completion,
    proofCompletion,
    reviewCompletion,
    priorityQuestions,
    globalAnalysis,
    profile,
    enableTestTools: ENABLE_TEST_TOOLS
  };
  const actions = { updateAnswer, reviewQuestion, fillTestProofs, addDocument, fillTestDocuments, scanDocuments, reviewAllVisible, runGlobalAnalysis, downloadReport, saveSnapshot, loadSnapshot, resetDiagnostic };

  if (route === "/auth/enterprise") return <AuthPage route={route} profile={profile} setProfile={setProfile} authActions={authActions} authState={authState} />;
  if (route === "/auth/login") return <LoginPage route={route} authActions={authActions} authState={authState} />;
  if (route === "/onboarding") return <ProtectedRoute route={route} authState={authState} authActions={authActions}><OnboardingPage route={route} profile={profile} setProfile={setProfile} /></ProtectedRoute>;
  if (route === "/app") return <ProtectedRoute route={route} authState={authState} authActions={authActions}><DashboardPage route={route} state={state} actions={actions} /></ProtectedRoute>;
  if (route === "/app/company-profile") return <ProtectedRoute route={route} authState={authState} authActions={authActions}><CompanyProfilePage route={route} profile={profile} setProfile={setProfile} /></ProtectedRoute>;
  if (route === "/app/questionnaire") return <ProtectedRoute route={route} authState={authState} authActions={authActions}><QuestionnairePage route={route} state={state} actions={actions} /></ProtectedRoute>;
  if (route === "/app/proofs") return <ProtectedRoute route={route} authState={authState} authActions={authActions}><ProofsPage route={route} state={state} actions={actions} /></ProtectedRoute>;
  if (route === "/app/analysis") return <ProtectedRoute route={route} authState={authState} authActions={authActions}><AnalysisPage route={route} state={state} actions={actions} /></ProtectedRoute>;
  if (route === "/app/report") return <ProtectedRoute route={route} authState={authState} authActions={authActions}><ReportPage route={route} state={state} actions={actions} /></ProtectedRoute>;
  if (route === "/review" || route === "/review/dossiers" || route.startsWith("/review/dossiers/")) return <ProtectedRoute route={route} authState={authState} authActions={authActions}><ReviewerPage route={route} state={state} /></ProtectedRoute>;
  if (route === "/admin/questionnaire") return <ProtectedRoute route={route} authState={authState} authActions={authActions}><AdminQuestionnairePage route={route} state={state} /></ProtectedRoute>;
  return <PublicPage route="/" state={state} />;
}

createRoot(document.getElementById("root")).render(<App />);
