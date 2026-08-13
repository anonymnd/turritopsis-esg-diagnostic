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
  Users,
  X
} from "lucide-react";
import "./styles.css";

const sectors = [
  { id: "industry", label: "Industrie", description: "Production, transformation, maintenance", icon: Factory, code: "A" },
  { id: "services", label: "Services", description: "Conseil, numérique, opérations B2B", icon: Building2, code: "B" },
  { id: "commerce", label: "Commerce", description: "Distribution, retail, logistique", icon: Store, code: "C" },
  { id: "agri", label: "Agri / Agro", description: "Agriculture, agroalimentaire, filières", icon: Sprout, code: "D" }
];

const pillars = [
  { id: "E", label: "Environnement", icon: Leaf, color: "green" },
  { id: "S", label: "Social", icon: Users, color: "orange" },
  { id: "G", label: "Gouvernance", icon: ShieldCheck, color: "blue" }
];

const sharedQuestions = {
  E: [
    ["E1", "Management environnemental", "La PME a une politique environnementale, des objectifs et une revue annuelle.", "Politique environnementale, objectifs, rapport annuel, certificat ISO 14001"],
    ["E2", "Efficacité énergétique", "La PME mesure et réduit sa consommation d'énergie.", "Factures énergie, audit énergétique, tableau kWh, plan de réduction", true],
    ["E3", "Gestion des déchets", "La PME trie, suit et valorise ses déchets via des filières documentées.", "Registre déchets, contrats de collecte, certificats de recyclage"],
    ["E4", "Consommation d'eau", "La PME suit sa consommation d'eau et agit pour la réduire.", "Factures eau, tableau m3, plan d'économie, recyclage eaux usées"],
    ["E5", "Émissions climat", "La PME identifie ses émissions et dispose d'un plan de réduction.", "Bilan GES, estimation CO2, plan climat, suivi annuel", true],
    ["E6", "Sensibilisation environnementale", "Les équipes sont sensibilisées aux pratiques environnementales.", "Supports de formation, listes de présence, campagnes internes"]
  ],
  S: [
    ["S1", "Formation et développement", "La PME suit les compétences et organise des formations.", "Plan de formation, attestations, heures par salarié"],
    ["S2", "Conditions de travail", "La PME suit la qualité de vie au travail et corrige les irritants.", "Enquête interne, taux absentéisme, plan QVT, PV de réunion", true],
    ["S3", "Diversité et inclusion", "La PME agit pour l'égalité, l'inclusion et la non-discrimination.", "Charte diversité, indicateurs, politique RH, actions inclusion"],
    ["S4", "Santé et sécurité", "La PME identifie les risques et protège les collaborateurs.", "Document risques, formations sécurité, registre incidents, EPI"],
    ["S5", "Dialogue social", "La PME maintient un dialogue structuré avec les collaborateurs.", "PV de réunion, baromètre social, canal de réclamation, accords", true],
    ["S6", "Impact communautaire", "La PME crée un impact positif dans son territoire.", "Partenariats locaux, dons, achats locaux, rapport impact"]
  ],
  G: [
    ["G1", "Structure de gouvernance", "La PME clarifie les rôles, responsabilités et décisions.", "Organigramme, délégations, PV de direction, comité", true],
    ["G2", "Éthique et anti-corruption", "La PME formalise ses règles d'éthique et de prévention corruption.", "Code de conduite, politique cadeaux, formation, registre alertes", true],
    ["G3", "Gestion des risques ESG", "La PME identifie et suit ses principaux risques ESG.", "Cartographie risques, plan mitigation, revue annuelle"],
    ["G4", "Transparence", "La PME communique ses informations financières et ESG de manière claire.", "Rapport annuel, tableau ESG, communication investisseurs"],
    ["G5", "Parties prenantes", "La PME identifie ses parties prenantes et collecte leurs attentes.", "Cartographie, consultations, enquête clients/fournisseurs"],
    ["G6", "KPI et pilotage", "La PME suit ses indicateurs et ses plans d'action.", "Tableau de bord, objectifs, compte-rendu de revue"]
  ]
};

const sectorQuestions = {
  industry: {
    E: [
      ["E7", "Matières premières", "La PME optimise l'usage des matières et réduit les pertes.", "Rendement matière, taux rebut, registre consommation"],
      ["E8", "Process industriel", "Les équipements critiques sont suivis pour réduire l'énergie.", "Compteurs dédiés, maintenance préventive, ISO 50001"],
      ["E9", "Rejets industriels", "Les rejets atmosphériques ou liquides sont contrôlés.", "Rapports analyse, autorisations, registre rejets"]
    ],
    S: [
      ["S7", "Ergonomie", "La PME réduit la pénibilité et les risques physiques.", "Études de postes, actions ergonomie, indicateurs TMS"],
      ["S8", "Formation technique", "Les collaborateurs ont les habilitations techniques utiles.", "Certificats, habilitations, plan technique"],
      ["S9", "Emploi local", "La PME soutient l'emploi local et l'insertion.", "Partenariats, alternance, données emploi local"]
    ],
    G: [
      ["G7", "Conformité industrielle", "La PME suit les obligations propres au site industriel.", "Autorisations, registre conformité, veille réglementaire"],
      ["G8", "Traçabilité", "Les lots, produits et matières sont traçables.", "Registre lots, audits fournisseurs, système traçabilité"],
      ["G9", "Certifications", "La PME maintient ses normes et certifications critiques.", "ISO 9001, ISO 14001, ISO 45001, audits"]
    ]
  },
  services: {
    E: [
      ["E7", "Achats responsables", "La PME intègre des critères ESG dans ses achats.", "Charte fournisseurs, questionnaire RSE, labels"],
      ["E8", "Numérique responsable", "La PME réduit l'impact de ses équipements et données.", "Politique IT, recyclage matériel, cloud responsable"],
      ["E9", "Mobilité durable", "La PME réduit les émissions de déplacements.", "Plan mobilité, télétravail, suivi déplacements"]
    ],
    S: [
      ["S7", "Satisfaction client", "La PME mesure et améliore la satisfaction client.", "NPS, réclamations, taux résolution, enquête"],
      ["S8", "Flexibilité et QVT", "La PME encadre le travail hybride et l'équilibre.", "Accord télétravail, charte QVT, enquête interne"],
      ["S9", "Accessibilité", "Les services sont accessibles aux personnes vulnérables ou handicapées.", "Audit accessibilité, plan adaptation, formation"]
    ],
    G: [
      ["G7", "Protection données", "La PME protège les données clients et collaborateurs.", "Registre traitements, politique sécurité, DPO"],
      ["G8", "Continuité d'activité", "La PME peut maintenir son activité en cas d'incident.", "PCA/PRA, tests annuels, procédures"],
      ["G9", "Contrats clients", "Les contrats et engagements sont clairs et suivis.", "CGV, contrats, audit juridique, révision annuelle"]
    ]
  },
  commerce: {
    E: [
      ["E7", "Assortiment responsable", "La PME favorise les produits responsables.", "Labels produits, politique achats verts, indicateurs"],
      ["E8", "Transport", "La PME optimise sa logistique et ses livraisons.", "Taux remplissage, transporteurs, suivi émissions"],
      ["E9", "Emballages", "La PME réduit et recycle ses emballages.", "Politique emballage, taux recyclable, éco-conception"]
    ],
    S: [
      ["S7", "Expérience client", "La PME traite les réclamations et mesure l'expérience.", "NPS, réclamations, délai résolution"],
      ["S8", "Organisation du travail", "Les horaires et charges sont suivis équitablement.", "Planning, accords horaires, indicateurs turnover"],
      ["S9", "Information consommateur", "La PME informe clairement les clients.", "Étiquettes, guides, labels, affichage transparent"]
    ],
    G: [
      ["G7", "Traçabilité produits", "La PME connaît l'origine des produits sensibles.", "Registre fournisseurs, audits, labels"],
      ["G8", "Conformité commerciale", "La PME contrôle ses pratiques commerciales.", "Registre conformité, formations, contrôles internes"],
      ["G9", "Données clients", "Les données clients sont protégées.", "Registre traitements, politique sécurité, consentements"]
    ]
  },
  agri: {
    E: [
      ["E7", "Eau et intrants", "La PME suit l'irrigation et les intrants.", "Registre irrigation, bilan intrants, labels"],
      ["E8", "Sols et biodiversité", "La PME préserve les sols et la biodiversité.", "Diagnostic sols, plan biodiversité, certifications"],
      ["E9", "Énergie agricole", "La PME optimise l'énergie des exploitations.", "Audit énergie, solaire, plan réduction"]
    ],
    S: [
      ["S7", "Travailleurs et producteurs", "Les conditions sont décentes pour producteurs et saisonniers.", "Contrats, audits sociaux, certifications"],
      ["S8", "Sécurité agricole", "La PME prévient les risques agricoles.", "EPI, formations, registre incidents"],
      ["S9", "Formation agricole", "La PME développe les compétences agricoles.", "Programmes, partenariats, attestations"]
    ],
    G: [
      ["G7", "Traçabilité agricole", "La PME suit la traçabilité de la parcelle au client.", "Lots, certificats, système traçabilité"],
      ["G8", "Certifications agricoles", "La PME maintient les certifications de filière.", "Global GAP, AB, ONSSA, audits"],
      ["G9", "Conformité filière", "La PME suit les règles sanitaires et filière.", "Registre ONSSA, contrôles, veille"]
    ]
  }
};

const scoreOptions = [
  { value: "0", label: "0", title: "Absent", detail: "Aucune pratique ou preuve." },
  { value: "0.5", label: "0.5", title: "Partiel", detail: "Pratique lancée mais incomplète." },
  { value: "1", label: "1", title: "Maîtrise", detail: "Pratique suivie et prouvée." },
  { value: "unknown", label: "?", title: "Incertain", detail: "Besoin d'aide pour se situer." },
  { value: "NA", label: "NA", title: "Non applicable", detail: "Hors activité, avec justification." }
];

const maturityLevels = [
  { min: 80, label: "ESG Leader", tone: "Excellent niveau de maturité et de preuve." },
  { min: 60, label: "ESG Performant", tone: "Base solide avec quelques corrections ciblées." },
  { min: 40, label: "ESG Structuré", tone: "Organisation visible, preuves encore irrégulières." },
  { min: 20, label: "ESG Initial", tone: "Démarrage engagé, priorités essentielles à formaliser." },
  { min: 0, label: "ESG Minimal", tone: "Point de départ clair pour construire la méthode." }
];

const publicStats = [
  {
    value: "27",
    label: "critères",
    detail: "Un questionnaire adapté au secteur de la PME",
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
    label: "pré-revue",
    detail: "Les preuves faibles sont signalées avant validation humaine",
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
const CERTIFICATE_STATUS_API = `${API_BASE_URL}/api/certificate-status`;
const CHECKOUT_API = `${API_BASE_URL}/api/create-checkout-session`;
const FINALIZE_SIGNUP_API = `${API_BASE_URL}/api/finalize-signup`;
const COMPANY_API = `${API_BASE_URL}/api/company`;
const DOCUMENTS_API = `${API_BASE_URL}/api/documents`;
const DOSSIERS_API = `${API_BASE_URL}/api/dossiers`;
const DOSSIER_NOTES_API = `${API_BASE_URL}/api/dossier-notes`;
const APP_ENV = import.meta.env.VITE_APP_ENV || (import.meta.env.PROD ? "production" : "test");
const ENABLE_TEST_TOOLS = APP_ENV !== "production" && import.meta.env.VITE_ENABLE_TEST_TOOLS === "true";
const ENABLE_PAYMENTS = import.meta.env.VITE_ENABLE_PAYMENTS === "true";
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

// A password-recovery link lands with the same "#access_token=..." shape
// as a signup confirmation link, so the two can't be told apart by
// presence alone -- only "type=recovery" vs "type=signup" distinguishes
// them, and that distinction decides very different destinations (a
// "choose a new password" form vs. onboarding).
function authCallbackTarget() {
  const hash = window.location.hash;
  if (hash.includes("type=recovery")) return "/auth/reset-password";
  if (hash.includes("access_token=") || hash.includes("type=signup")) return "/onboarding";
  return null;
}

function cleanAuthCallbackUrl(target) {
  window.history.replaceState(null, "", `${window.location.origin}${window.location.pathname}#${target}`);
}

const sampleDocuments = [
  {
    id: "doc-energy-2025",
    title: "Audit énergie 2025",
    type: "Audit",
    content: "Audit énergie 2025, factures énergie mensuelles, tableau kWh par site, plan de réduction validé par la direction et suivi trimestriel des économies."
  },
  {
    id: "doc-social-qvt",
    title: "PV social et conditions de travail",
    type: "PV",
    content: "PV de réunion 2025, conditions de travail, registre incidents, indicateur absentéisme, dialogue social, action corrective RH et suivi trimestriel."
  },
  {
    id: "doc-governance",
    title: "Dossier gouvernance",
    type: "Politique",
    content: "Organigramme, structure de gouvernance, politique éthique anti-corruption, registre alertes, rôles et responsabilités, revue annuelle de direction 2025."
  }
];

const methodCards = [
  {
    title: "Choisir un niveau",
    detail: "Absent, partiel, maîtrise, incertain ou non applicable : la PME peut avancer même si elle hésite.",
    icon: HelpCircle
  },
  {
    title: "Ajouter une preuve",
    detail: "Document, indicateur, facture, audit, photo ou commentaire : le score doit être justifié.",
    icon: Upload
  },
  {
    title: "Relire le dossier",
    detail: "L'analyse aide à repérer les incohérences. Le reviewer garde la décision finale.",
    icon: FileSearch
  }
];

function normalizeQuestion(item, pillar, sector) {
  const [code, title, description, evidence, priority = false] = item;
  // `id` namespaces the answer/review/document state key by sector: E7-E9,
  // S7-S9 and G7-G9 are reused codes with different content per sector, so
  // indexing state by the bare `code` would silently carry an answer over
  // to an unrelated question when the user switches sectors. `code` itself
  // stays short (e.g. "E7") for display and for document-code matching.
  return { id: `${sector}-${code}`, code, title, description, evidence, priority, pillar, sector };
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

function formatDateFr(isoDate) {
  if (!isoDate) return "";
  return new Date(isoDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
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
    E: ["environnement", "énergie", "énergétique", "kwh", "eau", "déchets", "climat", "co2", "ges", "émissions", "emballage", "transport"],
    S: ["social", "travail", "rh", "formation", "absentéisme", "sécurité", "santé", "diversité", "dialogue", "client", "qvt"],
    G: ["gouvernance", "éthique", "corruption", "risque", "transparence", "organigramme", "conformité", "données", "registre", "rôles"]
  };
  return signals[question.pillar].some((signal) => content.includes(signal));
}

function documentsForQuestion(question, documents) {
  const keywords = questionKeywords(question);
  return documents
    .map((document) => {
      const content = `${document.title} ${document.type} ${document.content}`.toLowerCase();
      const matches = keywords.filter((word) => content.includes(word));
      const explicitMatch = document.questionCodes?.includes(question.code);
      return { ...document, matches, explicitMatch, pillarMatch: explicitMatch || documentMatchesPillar(question, content) };
    })
    .filter((document) => document.explicitMatch || (document.matches.length >= 3 && document.pillarMatch))
    .sort((a, b) => Number(b.explicitMatch) - Number(a.explicitMatch) || b.matches.length - a.matches.length)
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
  if (suggestedScore === "1" && !missing.length) return "Pratique bien documentée. Le reviewer peut confirmer si le document est authentique et récent.";
  if (suggestedScore === "0.5") return `Compléter l'audit ${question.code} avec ${missing.slice(0, 2).join(" et ") || "une preuve plus directe"}.`;
  if (suggestedScore === "NA") return "Vérifier que la non-applicabilité est justifiée par le secteur, le périmètre ou l'activité.";
  return `Audit ${question.code} : demander une preuve source, une date et un indicateur avant de valider le score.`;
}

function parseDocumentQuestionCodes(value, allQuestions = []) {
  const allowed = new Set(allQuestions.map((question) => question.code));
  return [...new Set(String(value || "")
    .toUpperCase()
    .split(/[,;\s]+/)
    .map((code) => code.trim())
    .filter((code) => allowed.has(code)))];
}

function readableFileSize(size = 0) {
  if (size < 1024) return `${size} o`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} Ko`;
  return `${(size / (1024 * 1024)).toFixed(1)} Mo`;
}

function canExtractFileText(file) {
  const name = file.name.toLowerCase();
  return file.type.startsWith("text/")
    || [".txt", ".md", ".csv", ".json", ".log"].some((extension) => name.endsWith(extension));
}

async function documentFromFile(file, currentDraft) {
  const baseDocument = {
    ...currentDraft,
    title: currentDraft.title || file.name.replace(/\.[^.]+$/, ""),
    type: currentDraft.type === "Document" ? (file.type.includes("pdf") ? "PDF" : file.type.startsWith("image/") ? "Photo" : "Document") : currentDraft.type,
    file,
    fileName: file.name,
    fileType: file.type || "type inconnu",
    fileSize: file.size,
    extractionStatus: "metadata"
  };

  if (!canExtractFileText(file)) {
    return {
      ...baseDocument,
      content: currentDraft.content || `Document joint : ${file.name} (${baseDocument.fileType}, ${readableFileSize(file.size)}). Ajoutez un résumé manuel pour que l'IA puisse analyser le contenu.`,
      extractionStatus: "manual-summary-needed"
    };
  }

  const text = await file.text();
  return {
    ...baseDocument,
    content: currentDraft.content || text.slice(0, 12000),
    extractionStatus: text ? "text-extracted" : "empty-file"
  };
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
    reader.onerror = () => reject(new Error("Lecture du fichier impossible."));
    reader.readAsDataURL(file);
  });
}

function mapServerDocument(document) {
  return {
    id: document.id,
    title: document.title,
    type: document.type,
    content: document.content || "",
    questionCodes: document.question_codes || [],
    fileName: document.file_path ? document.file_path.split("/").pop() : null,
    fileType: document.file_type,
    fileSize: document.file_size,
    url: document.url || null,
    syncStatus: "saved"
  };
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
  if (!hasMetric) missing.push("indicateur ou valeur mesurée");
  if (!hasDate) missing.push("période ou date");
  if (matches < 2) missing.push("lien direct avec le critère");
  const matchedDocuments = documentsForQuestion(question, documents);
  const evidence = answer.evidence || documentEvidence;
  const risk = suggestedScore === "1" ? "faible" : suggestedScore === "0.5" ? "modéré" : suggestedScore === "NA" ? "à vérifier" : "élevé";
  const recommendation = auditRecommendation(question, missing, suggestedScore);

  return {
    status: "done",
    source: documents.length ? "Scan IA local" : "Revue locale",
    suggestedScore,
    confidence: Math.min(94, 36 + signal * 10),
    summary:
      suggestedScore === "1"
        ? "La preuve semble documentée, mesurable et cohérente."
        : suggestedScore === "0.5"
          ? "La preuve contient des signaux utiles, mais reste partielle."
          : suggestedScore === "NA"
            ? "Le critère est traité comme non applicable et doit rester justifié."
            : "La preuve est trop faible pour soutenir une note élevée.",
    missing,
    evidence,
    documents: matchedDocuments.map((document) => document.title),
    risk,
    recommendation,
    audit: `Audit ${question.code} : score IA ${suggestedScore}, risque ${risk}, ${matchedDocuments.length} document(s) relié(s).`
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
    source: "Backend IA sécurisé",
    suggestedScore,
    confidence: Number(remoteReview?.confidence || local.confidence),
    summary: remoteReview?.summary || local.summary,
    missing,
    risk,
    recommendation: remoteReview?.recommendation || auditRecommendation(question, missing, suggestedScore),
    audit: remoteReview?.audit || `Audit ${question.code} : score IA ${suggestedScore}, risque ${risk}. ${(remoteReview?.auditQuestions || []).join(" ")}`
  };
}

function scorePillar(questions, answers, reviews, reviewed = false) {
  const values = questions.map((question) => {
    const answer = answers[question.id] || emptyAnswer();
    if (!reviewed || answer.value === "NA" || answer.value === "unknown") return answer.value;
    const review = reviews[question.id] || emptyReview();
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
    "Si une pratique existe mais sans suivi régulier, choisissez 0.5.",
    "Si la pratique est formalisée, suivie et prouvée, choisissez 1."
  ];
}

function makeTestEvidence(question) {
  const common = {
    E: "Rapport interne 2025, tableau de bord mensuel, indicateur suivi par la direction et plan d'action validé.",
    S: "PV de réunion 2025, registre RH, indicateur trimestriel et action corrective suivie par le responsable RH.",
    G: "Politique approuvée en 2025, registre de contrôle, compte-rendu de direction et revue annuelle documentée."
  };
  return `${question.evidence}. ${common[question.pillar]} Exemple : ${question.code} suivi avec un objectif et une preuve disponible.`;
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
        <a className="nav-cta" href="#/app">Espace PME</a>
      </nav>
    </header>
  );
}

// Reviewer/admin pages get their own header instead of the public TopNav on
// purpose: this is internal tooling, not something to cross-link from the
// customer-facing site. Its login lives at a separate, unadvertised route
// (see ReviewerLoginPage) rather than the "Reviewer" menu item that used to
// sit next to "Espace PME" for every visitor to see and click.
function ReviewerTopNav({ authState, authActions }) {
  function logoutReviewer() {
    authActions.signOut("/review/login");
  }

  return (
    <header className="topnav reviewer-topnav">
      <a className="brand" href="#/review">
        <span>
          <img src={turritopsisAssets.logo} alt="Turritopsis" />
        </span>
        <div>
          <strong>TURRITOPSIS</strong>
          <small>Espace Reviewer</small>
        </div>
      </a>
      {authState?.session && (
        <button
          className="btn ghost"
          type="button"
          onClick={logoutReviewer}
        >
          <LogIn size={16} />
          Déconnexion
        </button>
      )}
    </header>
  );
}

function PublicPage({ route, state }) {
  return (
    <div className="page public-page">
      <TopNav route={route} />
      <section className="public-hero">
        <div className="hero-copy">
          <p className="eyebrow">Diagnostic ESG pour PME</p>
          <h1>Votre PME, notée pièce par pièce.</h1>
          <p>
            27 critères E/S/G adaptés à votre secteur, chacun avec sa preuve. Assemblés, ils forment un score
            qui explique ce qu'il manque — pas seulement ce qu'il vaut.
          </p>
          <div className="hero-actions">
            <a className="btn primary" href="#/auth/enterprise">
              Créer mon espace entreprise <ArrowRight size={18} />
            </a>
            <a className="btn ghost" href="#overview">
              Comprendre le parcours <BarChart3 size={18} />
            </a>
          </div>
        </div>
        <div className="hero-graphic" aria-hidden="true">
          <div className="score-wheel">
            <strong>68</strong>
          </div>
          <div className="floating-note note-a">
            <span>PME</span>
            <strong><CheckCircle2 size={15} /> Profil entreprise</strong>
          </div>
          <div className="floating-note note-b">
            <span>Preuves</span>
            <strong><ShieldCheck size={15} /> Vérifiées par un reviewer</strong>
            <small>Pas de score sans justificatif</small>
          </div>
        </div>
        <a className="scroll-cue" href="#overview" aria-label="Voir la suite">
          <ChevronRight size={22} />
        </a>
      </section>
      <div className="pillar-tiles-strip" aria-hidden="true">
        <p className="pillar-tiles-head">27 critères, assemblés comme une mosaïque</p>
        <div className="pillar-tiles">
          <div className="pillar-tile env"><b>Environnement</b><span>62</span></div>
          <div className="pillar-tile social"><b>Social</b><span>71</span></div>
          <div className="pillar-tile gov"><b>Gouvernance</b><span>69</span></div>
        </div>
      </div>

      <main className="public-content">
        <section className="overview-section" id="overview">
          <Reveal className="overview-heading">
            <p className="eyebrow overview-badge">Ce que l'app couvre</p>
            <h2>Un diagnostic court, documenté, relisible.</h2>
            <p>
              L'objectif n'est pas de produire un score flatteur. L'objectif est de montrer ce qui est déjà en place,
              ce qui manque de preuve et ce qui doit être amélioré en premier.
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
            <p className="eyebrow">Résultat attendu</p>
            <h2>Un score qui explique ses limites.</h2>
            <p>
              Le rapport sépare la note déclarée, la note après revue des preuves et les critères qui demandent
              encore une vérification.
            </p>
          </Reveal>
          <Reveal className="score-story" delay={120}>
            <div className="score-mark">
              <strong>68</strong>
              <span>/100</span>
            </div>
            <div className="score-note">
              <span>Exemple de rapport</span>
              <h3>68/100 avec réserves</h3>
              <p>La PME voit son niveau global, le détail E/S/G et les preuves qui influencent le résultat.</p>
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
            <h2>Quand une PME hésite, l'app l'aide à choisir.</h2>
            <p>Chaque critère explique les niveaux possibles, accepte l'option incertain et demande une preuve adaptée.</p>
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
    setFormStatus({ type: "loading", message: "Création du compte en cours..." });
    try {
      await authActions.signUp(profile);
      setFormStatus({ type: "success", message: "Compte créé. Vous pouvez continuer le profil entreprise." });
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
              <span>Institut Stratégique de Développement Durable</span>
            </div>
          </div>
          <div className="auth-divider" aria-hidden="true" />
          <p className="auth-brand-intro">
            Créez votre espace entreprise et avancez dans une démarche ESG fiable, structurée et reconnue.
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
            <span className="form-badge"><Lock size={15} /> Accès sécurisé</span>
            <div>
              <span className="step-kicker">Étape 1 sur 2</span>
              <h2>Créer l'espace entreprise</h2>
              <p>Seulement les informations nécessaires pour ouvrir le dossier.</p>
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
                <input type="password" value={profile.password} onChange={(event) => update("password", event.target.value)} placeholder="Minimum 8 caractères" minLength={8} required />
                <Eye size={18} />
              </span>
            </label>
          </div>
          {formStatus.message && <p className={`auth-message ${formStatus.type}`}>{formStatus.message}</p>}
          {!supabaseAuth && <p className="auth-message error">Supabase Auth n'est pas configuré dans cet environnement.</p>}
          <p className="auth-form-note">
            <Info size={18} />
            Le profil légal, l'activité et l'année de reporting seront complétés juste après.
          </p>
          <button className="btn primary full" type="submit" disabled={!supabaseAuth || authState.loading || formStatus.type === "loading"}>
            Créer l'espace et continuer <ChevronRight size={18} />
          </button>
          <a className="login-link" href="#/auth/login">
            <LogIn size={16} />
            J'ai déjà un compte
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
  const [resetMode, setResetMode] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setFormStatus({ type: "loading", message: "Connexion en cours..." });
    try {
      await authActions.signIn(email, password);
      setFormStatus({ type: "success", message: "Connexion réussie." });
      window.location.hash = "/app";
    } catch (error) {
      setFormStatus({ type: "error", message: error.message });
    }
  }

  async function submitReset(event) {
    event.preventDefault();
    setFormStatus({ type: "loading", message: "Envoi en cours..." });
    try {
      await authActions.requestPasswordReset(email);
      setFormStatus({ type: "success", message: "Email envoyé. Suivez le lien pour choisir un nouveau mot de passe." });
    } catch (error) {
      setFormStatus({ type: "error", message: error.message });
    }
  }

  return (
    <div className="page auth-page compact">
      <TopNav route={route} />
      <main className="auth-layout login-layout">
        <form className="auth-panel" onSubmit={resetMode ? submitReset : submit}>
          <div className="panel-title">
            <LogIn size={22} />
            <div>
              <h2>{resetMode ? "Mot de passe oublié" : "Connexion entreprise"}</h2>
              <p>{resetMode ? "Recevez un lien pour choisir un nouveau mot de passe." : "Accès à votre espace PME."}</p>
            </div>
          </div>
          <label>
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="contact@entreprise.com" required />
          </label>
          {!resetMode && (
            <label>
              Mot de passe
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="********" required />
            </label>
          )}
          {formStatus.message && <p className={`auth-message ${formStatus.type}`}>{formStatus.message}</p>}
          {!supabaseAuth && <p className="auth-message error">Supabase Auth n'est pas configuré dans cet environnement.</p>}
          <button className="btn primary full" type="submit" disabled={!supabaseAuth || authState.loading || formStatus.type === "loading"}>
            {resetMode ? "Envoyer le lien" : "Entrer"}
          </button>
          <button
            className="link-button"
            type="button"
            onClick={() => {
              setResetMode((current) => !current);
              setFormStatus({ type: "", message: "" });
            }}
          >
            {resetMode ? "Retour à la connexion" : "Mot de passe oublié ?"}
          </button>
          {!resetMode && <a className="login-link" href="#/auth/enterprise">Créer un compte entreprise</a>}
        </form>
      </main>
    </div>
  );
}

function ResetPasswordPage({ authActions, authState }) {
  const [password, setPassword] = useState("");
  const [formStatus, setFormStatus] = useState({ type: "", message: "" });

  async function submit(event) {
    event.preventDefault();
    if (password.length < 8) {
      setFormStatus({ type: "error", message: "Le mot de passe doit contenir au moins 8 caractères." });
      return;
    }
    setFormStatus({ type: "loading", message: "Mise à jour en cours..." });
    try {
      await authActions.updatePassword(password);
      setFormStatus({ type: "success", message: "Mot de passe mis à jour. Redirection..." });
      setTimeout(() => { window.location.hash = "/app"; }, 1200);
    } catch (error) {
      setFormStatus({ type: "error", message: error.message });
    }
  }

  return (
    <div className="page auth-page compact">
      <TopNav route="/auth/reset-password" />
      <main className="auth-layout login-layout">
        <form className="auth-panel" onSubmit={submit}>
          <div className="panel-title">
            <Lock size={22} />
            <div>
              <h2>Choisir un nouveau mot de passe</h2>
              <p>Valable pour votre compte entreprise ou reviewer.</p>
            </div>
          </div>
          {!authState.session ? (
            <p className="auth-message error">Lien invalide ou expiré. Redemandez un email depuis la page de connexion.</p>
          ) : (
            <>
              <label>
                Nouveau mot de passe
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Minimum 8 caractères" minLength={8} required />
              </label>
              {formStatus.message && <p className={`auth-message ${formStatus.type}`}>{formStatus.message}</p>}
              <button className="btn primary full" type="submit" disabled={formStatus.type === "loading"}>Mettre à jour</button>
            </>
          )}
        </form>
      </main>
    </div>
  );
}

// Deliberately separate from LoginPage/AuthPage: reviewers are never meant
// to land here by clicking around the public site (there is no link to
// this route anywhere in the customer-facing UI), and a successful sign-in
// goes to /review, not /app. RoleGate still decides afterward whether the
// account is actually allowed into the reviewer workspace -- this page
// only handles authentication, not authorization.
function ReviewerLoginPage({ authActions, authState, notice }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formStatus, setFormStatus] = useState({ type: notice ? "info" : "", message: notice || "" });

  async function submit(event) {
    event.preventDefault();
    setFormStatus({ type: "loading", message: "Connexion en cours..." });
    try {
      await authActions.signIn(email, password);
      setFormStatus({ type: "success", message: "Connexion réussie." });
      window.location.hash = "/review";
    } catch (error) {
      setFormStatus({ type: "error", message: error.message });
    }
  }

  return (
    <div className="page auth-page compact reviewer-login-page">
      <ReviewerTopNav authState={authState} authActions={authActions} />
      <main className="auth-layout login-layout">
        <form className="auth-panel" onSubmit={submit}>
          <div className="panel-title">
            <Lock size={22} />
            <div>
              <h2>Connexion reviewer</h2>
              <p>Réservé aux comptes analystes Turritopsis.</p>
            </div>
          </div>
          <label>
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="reviewer@turritopsis.org" required />
          </label>
          <label>
            Mot de passe
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="********" required />
          </label>
          {formStatus.message && <p className={`auth-message ${formStatus.type}`}>{formStatus.message}</p>}
          {!supabaseAuth && <p className="auth-message error">Supabase Auth n'est pas configuré dans cet environnement.</p>}
          <button className="btn primary full" type="submit" disabled={!supabaseAuth || authState.loading || formStatus.type === "loading"}>Entrer</button>
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
              <p>Quelques informations suffisent pour adapter le questionnaire au secteur, à la taille et au niveau de preuves disponible.</p>
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
              <strong>Prêt</strong>
              <small>après validation du profil</small>
            </article>
            <article className="progress-panel onboarding-status-card">
              <Upload size={22} />
              <span>Preuves</span>
              <strong>Plus tard</strong>
              <small>ajoutées critère par critère</small>
            </article>
          </section>

          <section className="onboarding-body">
            <article className="onboarding-form-card">
              <div className="card-heading onboarding-card-heading">
                <div>
                  <span>Étape 1</span>
                  <h2>Informations de base</h2>
                </div>
                <small>Obligatoire avant le diagnostic</small>
              </div>
              <div className="profile-grid onboarding-profile-grid">
                <label>
                  Nom légal
                  <input value={profile.legalName} onChange={(event) => update("legalName", event.target.value)} placeholder="Raison sociale" />
                </label>
                <label>
                  Identifiant / registre
                  <input value={profile.registration} onChange={(event) => update("registration", event.target.value)} placeholder="ICE, RC ou équivalent" />
                </label>
                <label>
                  Activité principale
                  <input value={profile.activity} onChange={(event) => update("activity", event.target.value)} placeholder="Transformation alimentaire" />
                </label>
                <label>
                  Année de reporting
                  <input value={profile.year} onChange={(event) => update("year", event.target.value)} placeholder="2026" />
                </label>
                <label className="wide">
                  Adresse
                  <input value={profile.address} onChange={(event) => update("address", event.target.value)} placeholder="Ville, pays" />
                </label>
                <label className="wide">
                  Disponibilité des preuves
                  <select value={profile.proofReadiness} onChange={(event) => update("proofReadiness", event.target.value)}>
                    <option>Preuves disponibles</option>
                    <option>Preuves partielles</option>
                    <option>Preuves à collecter</option>
                  </select>
                </label>
              </div>
              <div className="onboarding-form-actions">
                <a className="btn secondary" href="#/app">Voir dashboard</a>
                <a className="btn primary" href="#/app/questionnaire">Accéder au questionnaire <ArrowRight size={18} /></a>
              </div>
            </article>

            <aside className="onboarding-advisor">
              <h2>Avant de commencer</h2>
              <div className="onboarding-checklist">
                <span><CheckCircle2 size={18} /> Identité de l'entreprise</span>
                <span><CheckCircle2 size={18} /> Activité et année de reporting</span>
                <span className="warning"><AlertTriangle size={18} /> Preuves ajoutables ensuite</span>
              </div>
              <div className="onboarding-tip">
                <strong>Bon à savoir</strong>
                <p>Le questionnaire expliquera chaque niveau quand l'entreprise ne sait pas encore où se situer.</p>
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
        Déconnexion
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
              <h1>{state.companyState.company?.name || state.profile.companyName || "Entreprise demo"}</h1>
              <p>{level.label} - {level.tone}</p>
              {state.companyState.role && (
                <span className="certificate-badge active">
                  <Building2 size={15} />
                  {{ owner: "Propriétaire", collaborator: "Collaborateur", viewer: "Lecture seule" }[state.companyState.role] || state.companyState.role}
                </span>
              )}
              {state.enablePayments && state.certificateStatus.active ? (
                <span className="certificate-badge active">
                  <ShieldCheck size={15} />
                  {state.certificateStatus.certificate?.valid_until
                    ? `Certificat valide jusqu'au ${formatDateFr(state.certificateStatus.certificate.valid_until)}`
                    : "Certificat actif (mode test)"}
                </span>
              ) : state.enablePayments ? (
                <span className="certificate-badge inactive">
                  <Lock size={15} />
                  Aucun certificat actif
                </span>
              ) : null}
            </div>
            <div className="cta-row compact">
              {state.enablePayments && !state.certificateStatus.active && (
                <button
                  className="btn primary"
                  type="button"
                  onClick={actions.startCheckout}
                  disabled={state.certificateStatus.status === "redirecting"}
                >
                  <Lock size={18} />
                  {state.certificateStatus.status === "redirecting" ? "Redirection..." : "Payer et débloquer le score"}
                </button>
              )}
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
              <h2>Priorités</h2>
              {state.priorityQuestions.slice(0, 5).map((question) => (
                <a href="#/app/questionnaire" key={question.id}>
                  <span>{question.code}</span>
                  <strong>{question.title}</strong>
                  <ChevronRight size={18} />
                </a>
              ))}
              {!state.priorityQuestions.length && <p>Toutes les priorités universelles sont à un niveau satisfaisant.</p>}
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
              <h1>Questionnaire ESG guidé.</h1>
              <p>Secteur {sectorMeta.code} : {sectorMeta.label}. Répondez simplement, puis ajoutez les preuves disponibles.</p>
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
                <QuestionCard key={question.id} question={question} answer={answers[question.id] || emptyAnswer()} review={reviews[question.id] || emptyReview()} actions={actions} pillarScore={pillarScores[activePillar]} />
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
        {question.priority && <b>Priorité</b>}
      </header>

      <div className="score-options">
        {scoreOptions.map((option) => (
          <button
            className={answer.value === option.value ? "selected" : ""}
            disabled={option.value === "NA" && naBlocked}
            key={option.value}
            type="button"
            onClick={() => actions.updateAnswer(question.id, { value: option.value, guidance: option.value === "unknown" ? guidance.join("\n") : answer.guidance })}
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
          <textarea value={answer.evidence} onChange={(event) => actions.updateAnswer(question.id, { evidence: event.target.value })} placeholder={question.evidence} />
        </label>
        <label>
          Justification
          <textarea value={answer.justification} onChange={(event) => actions.updateAnswer(question.id, { justification: event.target.value })} placeholder="Décision, contexte, limite ou justification NA." />
        </label>
      </div>

      <section className={`review-strip ${review.status} ${staleReview ? "stale" : ""}`}>
        <div>
          <Bot size={18} />
          <strong>Analyse preuve</strong>
          {freshReview && <span>{review.source} - confiance {review.confidence}%</span>}
          {staleReview && <span>À relancer</span>}
        </div>
        <button type="button" onClick={() => actions.reviewQuestion(question)}>
          <Sparkles size={16} />
          Analyser
        </button>
        {review.status === "done" && (
          <div className="review-body">
            <strong>Score suggéré : {review.suggestedScore}</strong>
            <p>{review.summary}</p>
            <div className="audit-meta">
              <span>Risque : {review.risk || "à vérifier"}</span>
              <span>{review.documents.length ? `${review.documents.length} document(s) relié(s)` : "Aucun document relié"}</span>
            </div>
            <p>{review.recommendation}</p>
            {!!review.missing.length && <small>Manque : {review.missing.join(", ")}</small>}
          </div>
        )}
        {review.status === "idle" && <p>Preuve non analysée.</p>}
      </section>
    </article>
  );
}

function ProofsPage({ route, state, actions }) {
  const [draftDocument, setDraftDocument] = useState({ title: "", type: "Document", content: "", questionCodesText: "" });
  const [fileStatus, setFileStatus] = useState("");
  const proofRows = state.allQuestions.filter((question) => {
    const answer = state.answers[question.id] || emptyAnswer();
    const review = state.reviews[question.id] || emptyReview();
    return (answer.value && answer.value !== "NA") || review.status === "done";
  });
  function submitDocument(event) {
    event.preventDefault();
    actions.addDocument({
      ...draftDocument,
      questionCodes: parseDocumentQuestionCodes(draftDocument.questionCodesText, state.allQuestions)
    });
    setDraftDocument({ title: "", type: "Document", content: "", questionCodesText: "" });
    setFileStatus("");
  }
  async function attachFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileStatus("Lecture du fichier...");
    try {
      const nextDocument = await documentFromFile(file, draftDocument);
      setDraftDocument((current) => ({ ...current, ...nextDocument }));
      setFileStatus(canExtractFileText(file)
        ? `Texte extrait depuis ${file.name}.`
        : `${file.name} joint. Ajoutez ou vérifiez le résumé avant analyse.`);
    } catch (error) {
      setFileStatus(`Lecture impossible : ${error.message}`);
    } finally {
      event.target.value = "";
    }
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
              <p>Les pièces justificatives seront regroupées ici après les réponses au questionnaire.</p>
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
              <p>Le scan relie les documents aux critères ESG, remplit les preuves trouvées et génère un mini-audit par pratique.</p>
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
              <label className="wide upload-field">
                Fichier preuve
                <input type="file" onChange={attachFile} accept=".txt,.md,.csv,.json,.pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx" />
                <small>{fileStatus || "Ajoutez un fichier, ou collez simplement un résumé de preuve."}</small>
              </label>
              <label>
                Nom du document
                <input value={draftDocument.title} onChange={(event) => setDraftDocument((current) => ({ ...current, title: event.target.value }))} placeholder="Audit énergie 2025" />
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
                  <option>PDF</option>
                  <option>Photo</option>
                </select>
              </label>
              <label className="wide">
                Critères liés optionnels
                <input value={draftDocument.questionCodesText} onChange={(event) => setDraftDocument((current) => ({ ...current, questionCodesText: event.target.value }))} placeholder="Ex: E1, E2, S5" />
              </label>
              <label className="wide">
                Contenu ou résumé de la preuve
                <textarea value={draftDocument.content} onChange={(event) => setDraftDocument((current) => ({ ...current, content: event.target.value }))} placeholder="Collez ici le contenu utile : date, indicateur, responsable, résultat, action suivie..." />
              </label>
              <button className="btn secondary" type="submit">Ajouter au dossier</button>
            </form>
          </section>

          <section className="document-library">
            <div>
              <h2>Documents chargés</h2>
              <p>{state.documents.length ? `${state.documents.length} document(s) prêt(s) pour le scan.` : "Aucun document ajouté pour le moment."}</p>
            </div>
            <div className="document-chips">
              {state.documents.map((document) => (
                <span key={document.id} className={document.syncStatus === "error" ? "sync-error" : ""}>
                  {document.type} - {document.title}
                  {document.questionCodes?.length ? ` (${document.questionCodes.join(", ")})` : ""}
                  {document.syncStatus === "saving" && " - enregistrement..."}
                  {document.syncStatus === "error" && " - non enregistré"}
                  {document.url && (
                    <a href={document.url} target="_blank" rel="noreferrer" title="Ouvrir le fichier">
                      <FileSearch size={13} />
                    </a>
                  )}
                  <button type="button" onClick={() => actions.removeDocument(document.id)} aria-label={`Retirer ${document.title}`}>
                    <X size={13} />
                  </button>
                </span>
              ))}
              {!state.documents.length && <span>Ajoutez une preuve manuellement.</span>}
            </div>
          </section>

          <div className="proof-table">
            {proofRows.map((question) => {
              const answer = state.answers[question.id] || emptyAnswer();
              const review = state.reviews[question.id] || emptyReview();
              return (
                <article key={question.id}>
                  <span>{question.code}</span>
                  <div>
                    <strong>{question.title}</strong>
                    <p>{answer.evidence || review.evidence || "Aucune preuve renseignée."}</p>
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
                  <h2>Aucune preuve à revoir pour le moment.</h2>
                  <p>Commencez par noter quelques critères dans le questionnaire. Les preuves ajoutées apparaîtront ici avec leur statut de revue.</p>
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
              <p>Comparez le score déclaré, les preuves ajoutées et les points sensibles avant revue humaine.</p>
            </div>
            {state.certificateStatus.active && (
              <button className="btn primary" type="button" onClick={actions.runGlobalAnalysis}>
                <Bot size={18} />
                Analyser
              </button>
            )}
          </div>
          <PaywallGate certificateStatus={state.certificateStatus} actions={actions}>
            <section className="analysis-layout">
              <article className="analysis-score">
                <div>
                  <span>Score déclaré</span>
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
                    <p>{state.globalAnalysis.riskLevel ? `Risque ${state.globalAnalysis.riskLevel} - confiance ${state.globalAnalysis.confidence}%` : "Analyse non lancée."}</p>
                  </div>
                </div>
                <p>{state.globalAnalysis.executiveSummary || "Lancez l'analyse lorsque les réponses et preuves principales sont prêtes."}</p>
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
            <AiTrustNote />
          </PaywallGate>
        </section>
      </main>
    </div>
  );
}

function AiTrustNote() {
  return (
    <p className="ai-trust-note">
      <Bot size={15} />
      Analyse assistée par IA - la décision finale reste validée par un reviewer humain, jamais automatisée seule.
    </p>
  );
}

function ReportPage({ route, state, actions }) {
  const level = getLevel(state.reviewedGlobalScore);
  const unlocked = state.certificateStatus.active;
  return (
    <div className="page app-page report-page">
      <TopNav route={route} />
      <main className="workspace">
        <EnterpriseSidebar route={route} />
        <section className="workspace-main">
          <div className="workspace-heading rowed dashboard-heading report-heading">
            <div>
              <p className="eyebrow">Rapport ESG</p>
              <h1>{unlocked ? level.label : "Certificat ESG"}</h1>
              <p>
                {state.profile.companyName || "Entreprise demo"}
                {unlocked ? ` - score revu ${state.reviewedGlobalScore}/100.` : " - payez le diagnostic pour voir le score et le certificat."}
              </p>
            </div>
            {unlocked && (
              <div className="cta-row compact">
                <button className="btn secondary" type="button" onClick={actions.downloadReport}><Download size={18} /> TXT</button>
                <button className="btn secondary" type="button" onClick={() => window.print()}><Printer size={18} /> Print</button>
              </div>
            )}
          </div>
          <PaywallGate certificateStatus={state.certificateStatus} actions={actions}>
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
                <h2>Synthèse</h2>
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
            <DossierSubmitPanel state={state} actions={actions} />
            <AiTrustNote />
          </PaywallGate>
        </section>
      </main>
    </div>
  );
}

const DOSSIER_STATUS_LABELS = {
  draft: "Brouillon",
  submitted: "Soumis, en attente de revue",
  in_review: "En cours de revue",
  validated: "Validé",
  rejected: "Refusé - preuves supplémentaires requises"
};

function DossierSubmitPanel({ state, actions }) {
  const dossier = state.dossierState.dossier;
  const status = dossier?.status;
  const submitting = state.dossierState.status === "submitting";
  const canResubmit = !status || status === "draft" || status === "rejected";

  return (
    <section className="dossier-submit-panel">
      <div>
        <h2>Revue humaine</h2>
        <p>
          {status
            ? DOSSIER_STATUS_LABELS[status] || status
            : "Ce dossier n'a pas encore été soumis pour revue."}
          {dossier?.submitted_at && ` - envoyé le ${formatDateFr(dossier.submitted_at)}.`}
        </p>
        {status === "validated" && dossier?.final_score != null && (
          <p className="dossier-final-score">Score final validé par le reviewer : {dossier.final_score}/100.</p>
        )}
        {state.dossierState.error && <p className="auth-message error">{state.dossierState.error}</p>}
      </div>
      {canResubmit && (
        <button className="btn primary" type="button" onClick={actions.submitDossier} disabled={submitting}>
          <Sparkles size={18} />
          {submitting ? "Envoi..." : status === "rejected" ? "Soumettre à nouveau" : "Soumettre pour revue"}
        </button>
      )}
    </section>
  );
}

function ReviewerSidebar({ route }) {
  const links = [
    ["/review", Gauge, "Vue globale"],
    ["/review/dossiers", BriefcaseBusiness, "Dossiers"],
    ["/admin/questionnaire", Settings, "Questionnaire"],
    ["/admin/overview", ShieldCheck, "Administration"]
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

function computeSnapshotPillarScores(snapshot) {
  if (!snapshot?.sector || !snapshot?.answers) return null;
  const questions = buildQuestions(snapshot.sector);
  return Object.fromEntries(
    pillars.map((pillar) => [pillar.id, scorePillar(questions[pillar.id], snapshot.answers, snapshot.reviews || {}, true).score])
  );
}

const DOSSIER_QUEUE_STATUS_LABELS = {
  submitted: "Soumis",
  in_review: "En cours de revue",
  validated: "Validé",
  rejected: "Refusé"
};

function ReviewerPage({ route, authState, authActions }) {
  function reviewerAuthHeaders(extra = {}) {
    return { ...extra, ...(authState?.session?.access_token ? { Authorization: `Bearer ${authState.session.access_token}` } : {}) };
  }

  const [queue, setQueue] = useState({ status: "idle", dossiers: [] });
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState({ status: "idle", dossier: null, notes: [] });
  const [noteDraft, setNoteDraft] = useState("");
  const [finalScoreDraft, setFinalScoreDraft] = useState("");

  async function loadQueue() {
    setQueue((current) => ({ ...current, status: "loading" }));
    try {
      const response = await fetch(DOSSIERS_API, { headers: reviewerAuthHeaders() });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Liste indisponible.");
      setQueue({ status: "done", dossiers: payload.dossiers || [] });
    } catch (error) {
      setQueue({ status: "error", dossiers: [], error: error.message });
    }
  }

  React.useEffect(() => {
    loadQueue();
  }, []);

  React.useEffect(() => {
    if (!selectedId) {
      setDetail({ status: "idle", dossier: null, notes: [] });
      return undefined;
    }
    let cancelled = false;
    (async () => {
      setDetail((current) => ({ ...current, status: "loading" }));
      try {
        const [dossierResponse, notesResponse] = await Promise.all([
          fetch(`${DOSSIERS_API}?id=${encodeURIComponent(selectedId)}`, { headers: reviewerAuthHeaders() }),
          fetch(`${DOSSIER_NOTES_API}?dossier_id=${encodeURIComponent(selectedId)}`, { headers: reviewerAuthHeaders() })
        ]);
        const dossierPayload = await dossierResponse.json();
        const notesPayload = await notesResponse.json();
        if (cancelled) return;
        if (!dossierResponse.ok || !dossierPayload.ok) throw new Error(dossierPayload.error || "Dossier indisponible.");
        setDetail({ status: "done", dossier: dossierPayload.dossier, notes: notesPayload.notes || [] });
        setFinalScoreDraft(dossierPayload.dossier?.reviewed_score ?? "");
      } catch (error) {
        if (!cancelled) setDetail({ status: "error", dossier: null, notes: [], error: error.message });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  async function updateDossierStatus(status) {
    if (!selectedId) return;
    try {
      const response = await fetch(`${DOSSIERS_API}?id=${encodeURIComponent(selectedId)}`, {
        method: "PUT",
        headers: reviewerAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          status,
          finalScore: status === "validated" ? Number(finalScoreDraft) || detail.dossier?.reviewed_score || 0 : undefined
        })
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Mise à jour impossible.");
      setDetail((current) => ({ ...current, dossier: payload.dossier }));
      if (status === "validated" || status === "rejected") {
        setSelectedId(null);
        loadQueue();
      } else {
        setQueue((current) => ({ ...current, dossiers: current.dossiers.map((item) => (item.id === payload.dossier.id ? payload.dossier : item)) }));
      }
    } catch (error) {
      setDetail((current) => ({ ...current, error: error.message }));
    }
  }

  async function submitNote() {
    if (!selectedId || !noteDraft.trim()) return;
    try {
      const response = await fetch(DOSSIER_NOTES_API, {
        method: "POST",
        headers: reviewerAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ dossierId: selectedId, note: noteDraft.trim() })
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Commentaire impossible.");
      setDetail((current) => ({ ...current, notes: [...current.notes, payload.note] }));
      setNoteDraft("");
    } catch (error) {
      setDetail((current) => ({ ...current, error: error.message }));
    }
  }

  const dossier = detail.dossier;
  const snapshotScores = dossier ? computeSnapshotPillarScores(dossier.snapshot) : null;

  return (
    <div className="page reviewer-page">
      <ReviewerTopNav authState={authState} authActions={authActions} />
      <main className="workspace">
        <ReviewerSidebar route={route} />
        <section className="workspace-main">
          <div className="workspace-heading dashboard-heading reviewer-heading">
            <p className="eyebrow">Workspace analyste</p>
            <h1>Validation des dossiers ESG.</h1>
            <p>File d'attente réelle des dossiers soumis par les PME, à valider ou renvoyer avec commentaire.</p>
          </div>
          <section className="review-grid">
            <article className="review-kpi">
              <span>En file</span>
              <strong>{queue.dossiers.length}</strong>
              <small>soumis ou en cours</small>
            </article>
            <article className="review-kpi">
              <span>Dossier sélectionné</span>
              <strong>{dossier ? `${dossier.reviewed_score ?? "-"}` : "-"}</strong>
              <small>{dossier ? "score revu déclaré" : "aucun dossier ouvert"}</small>
            </article>
          </section>
          <section className="review-workspace">
            <div className="dossier-list">
              <div className="search-box">
                <Search size={18} />
                <input placeholder="Chercher un dossier" aria-label="Chercher un dossier" />
              </div>
              {queue.status === "loading" && <p className="dossier-list-status">Chargement...</p>}
              {queue.status === "error" && <p className="dossier-list-status error">{queue.error}</p>}
              {queue.status === "done" && !queue.dossiers.length && (
                <p className="dossier-list-status">Aucun dossier en attente de revue.</p>
              )}
              {queue.dossiers.map((item) => (
                <a
                  className={item.id === selectedId ? "active" : ""}
                  href={`#/review/dossiers/${item.id}`}
                  key={item.id}
                  onClick={(event) => {
                    event.preventDefault();
                    setSelectedId(item.id);
                  }}
                >
                  <strong>{item.companies?.name || "Entreprise"}</strong>
                  <span>{item.reviewed_score ?? "-"}/100 - {DOSSIER_QUEUE_STATUS_LABELS[item.status] || item.status}</span>
                </a>
              ))}
            </div>
            <div className="evidence-review">
              {!selectedId && (
                <div className="empty-state">
                  <BriefcaseBusiness size={28} />
                  <p>Choisissez un dossier dans la liste pour voir le détail et les preuves.</p>
                </div>
              )}
              {selectedId && detail.status === "loading" && <p>Chargement du dossier...</p>}
              {selectedId && detail.status === "error" && <p className="auth-message error">{detail.error}</p>}
              {dossier && (
                <>
                  <h2>{dossier.companies?.name || "Entreprise"}</h2>
                  <p>
                    Secteur {dossier.companies?.sector || "-"} - score déclaré {dossier.declared_score ?? "-"}/100,
                    score revu {dossier.reviewed_score ?? "-"}/100.
                  </p>
                  {snapshotScores && (
                    <div className="pillar-chart">
                      {pillars.map((pillar) => (
                        <article key={pillar.id}>
                          <span className={`pillar-icon tone-${pillar.color}`}><pillar.icon size={18} /></span>
                          <div>
                            <strong>{pillar.label}</strong>
                            <div className="bar"><span style={{ width: `${snapshotScores[pillar.id]}%` }} /></div>
                          </div>
                          <b>{snapshotScores[pillar.id]}</b>
                        </article>
                      ))}
                    </div>
                  )}

                  <div className="dossier-notes">
                    <h3>Commentaires</h3>
                    {detail.notes.map((note) => (
                      <p key={note.id} className="dossier-note">{note.note}</p>
                    ))}
                    {!detail.notes.length && <p className="dossier-note-empty">Aucun commentaire pour le moment.</p>}
                    <div className="dossier-note-form">
                      <textarea
                        value={noteDraft}
                        onChange={(event) => setNoteDraft(event.target.value)}
                        placeholder="Demander une preuve supplémentaire, expliquer une décision..."
                      />
                      <button className="btn secondary" type="button" onClick={submitNote} disabled={!noteDraft.trim()}>
                        Ajouter le commentaire
                      </button>
                    </div>
                  </div>

                  {detail.error && <p className="auth-message error">{detail.error}</p>}

                  <div className="dossier-actions">
                    {dossier.status === "submitted" && (
                      <button className="btn secondary" type="button" onClick={() => updateDossierStatus("in_review")}>
                        Marquer en cours de revue
                      </button>
                    )}
                    <label className="dossier-final-score-field">
                      Score final
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={finalScoreDraft}
                        onChange={(event) => setFinalScoreDraft(event.target.value)}
                      />
                    </label>
                    <button className="btn primary" type="button" onClick={() => updateDossierStatus("validated")}>
                      <CheckCircle2 size={18} /> Valider
                    </button>
                    <button className="btn ghost" type="button" onClick={() => updateDossierStatus("rejected")}>
                      Refuser, renvoyer au PME
                    </button>
                  </div>
                </>
              )}
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}

function AdminQuestionnairePage({ route, state, authState, authActions }) {
  return (
    <div className="page reviewer-page">
      <ReviewerTopNav authState={authState} authActions={authActions} />
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
              <article key={question.id}>
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

const ADMIN_STATUS_LABELS = {
  draft: "Brouillon",
  submitted: "Soumis",
  in_review: "En cours",
  validated: "Validé",
  rejected: "Refusé"
};

function AdminOverviewPage({ route, authState, authActions }) {
  const [overview, setOverview] = useState({ status: "idle", companies: [], dossiers: [], auditLogs: [] });

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setOverview((current) => ({ ...current, status: "loading" }));
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin-overview`, {
          headers: authState?.session?.access_token ? { Authorization: `Bearer ${authState.session.access_token}` } : {}
        });
        const payload = await response.json();
        if (cancelled) return;
        if (!response.ok || !payload.ok) throw new Error(payload.error || "Vue admin indisponible.");
        setOverview({ status: "done", companies: payload.companies, dossiers: payload.dossiers, auditLogs: payload.auditLogs });
      } catch (error) {
        if (!cancelled) setOverview({ status: "error", companies: [], dossiers: [], auditLogs: [], error: error.message });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authState?.session]);

  const dossiersByCompany = {};
  overview.dossiers.forEach((dossier) => {
    if (!dossiersByCompany[dossier.company_id]) dossiersByCompany[dossier.company_id] = dossier;
  });

  return (
    <div className="page reviewer-page">
      <ReviewerTopNav authState={authState} authActions={authActions} />
      <main className="workspace">
        <ReviewerSidebar route={route} />
        <section className="workspace-main">
          <div className="workspace-heading dashboard-heading reviewer-heading">
            <p className="eyebrow">Administration</p>
            <h1>Vue d'ensemble.</h1>
            <p>Entreprises inscrites, statut de leur dossier et dernières actions sensibles.</p>
          </div>

          {overview.status === "loading" && <p>Chargement...</p>}
          {overview.status === "error" && <p className="auth-message error">{overview.error}</p>}

          {overview.status === "done" && (
            <>
              <section className="review-grid">
                <article className="review-kpi">
                  <span>Entreprises</span>
                  <strong>{overview.companies.length}</strong>
                  <small>comptes créés</small>
                </article>
                <article className="review-kpi">
                  <span>Dossiers actifs</span>
                  <strong>{overview.dossiers.filter((item) => item.status === "submitted" || item.status === "in_review").length}</strong>
                  <small>en attente de revue</small>
                </article>
                <article className="review-kpi">
                  <span>Dossiers validés</span>
                  <strong>{overview.dossiers.filter((item) => item.status === "validated").length}</strong>
                  <small>score final verrouillé</small>
                </article>
              </section>

              <h2 className="admin-section-title">Entreprises</h2>
              <section className="admin-table">
                {overview.companies.map((company) => {
                  const dossier = dossiersByCompany[company.id];
                  return (
                    <article key={company.id}>
                      <span><Building2 size={16} /></span>
                      <strong>{company.name}</strong>
                      <p>{company.sector || "Secteur non renseigné"} - créée le {formatDateFr(company.created_at)}</p>
                      <b>{dossier ? (ADMIN_STATUS_LABELS[dossier.status] || dossier.status) : "Aucun dossier"}</b>
                    </article>
                  );
                })}
                {!overview.companies.length && <p>Aucune entreprise pour le moment.</p>}
              </section>

              <h2 className="admin-section-title">Journal d'audit récent</h2>
              <section className="admin-table">
                {overview.auditLogs.map((entry) => (
                  <article key={entry.id}>
                    <span><ClipboardList size={16} /></span>
                    <strong>{entry.action}</strong>
                    <p>{formatDateFr(entry.created_at)}</p>
                    <b>{entry.company_id ? "Entreprise" : "Système"}</b>
                  </article>
                ))}
                {!overview.auditLogs.length && <p>Aucune action enregistrée pour le moment.</p>}
              </section>
            </>
          )}
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
  const answered = allQuestions.filter((question) => answers[question.id]?.value);
  const proofed = answered.filter((question) => answers[question.id]?.evidence || answers[question.id]?.value === "NA");
  const reviewed = answered.filter((question) => reviews[question.id]?.status === "done");
  const weak = allQuestions.filter((question) => {
    const answer = answers[question.id] || emptyAnswer();
    const review = reviews[question.id] || emptyReview();
    return answer.value && answer.value !== "NA" && (answer.value === "0" || review.suggestedScore === "0");
  });
  const missingCritical = allQuestions.filter((question) => {
    const answer = answers[question.id] || emptyAnswer();
    return question.priority && (!answer.value || answer.value === "unknown" || answer.value === "0");
  });
  const riskLevel = missingCritical.length > 2 || proofed.length < answered.length * 0.65 ? "élevé" : reviewedGlobalScore >= 60 ? "modéré" : "important";

  return {
    status: "done",
    verdict: reviewedGlobalScore >= 60 ? "Dossier exploitable avec réserves ciblées" : "Dossier à renforcer avant validation",
    riskLevel,
    confidence: Math.min(94, 42 + reviewed.length * 2),
    executiveSummary: `Le dossier obtient ${reviewedGlobalScore}/100 après revue locale. Les piliers sont E ${reviewedScores.E}, S ${reviewedScores.S}, G ${reviewedScores.G}.`,
    strengths: [
      reviewedScores.E >= 60 ? "Pilotage environnemental visible." : "Premières preuves environnementales identifiées.",
      reviewedScores.S >= 60 ? "Socle social structuré." : "Dialogue social et conditions de travail à consolider.",
      reviewedScores.G >= 60 ? "Gouvernance documentée." : "Gouvernance à formaliser pour rassurer les reviewers."
    ],
    risks: [
      weak.length ? `${weak.length} critères restent faibles ou peu prouvés.` : "Peu de critères faibles détectés.",
      missingCritical.length ? `${missingCritical.length} priorités universelles demandent une attention immédiate.` : "Priorités universelles globalement couvertes.",
      proofed.length < answered.length ? "Certaines réponses manquent encore de preuve." : "Les réponses renseignées ont une preuve ou justification."
    ],
    roadmap: [
      "Vérifier les critères universels E2, E5, S2, S5, G1 et G2.",
      "Ajouter dates, indicateurs et documents sources aux preuves faibles.",
      "Soumettre le dossier au reviewer avec les pièces prioritaires."
    ]
  };
}

function ProtectedRoute({ route, authState, authActions, children, variant = "pme" }) {
  if (ENABLE_TEST_TOOLS) {
    return children;
  }

  if (authState.loading) {
    return (
      <div className="page auth-page compact">
        {variant === "reviewer" ? <ReviewerTopNav authState={authState} authActions={authActions} /> : <TopNav route={route} />}
        <main className="auth-layout login-layout">
          <section className="auth-panel">
            <div className="panel-title">
              <Lock size={22} />
              <div>
                <h2>Vérification de la session</h2>
                <p>Contrôle de l'accès sécurisé en cours.</p>
              </div>
            </div>
          </section>
        </main>
      </div>
    );
  }

  if (!authState.session) {
    return variant === "reviewer"
      ? <ReviewerLoginPage authActions={authActions} authState={authState} notice="Connectez-vous pour accéder à cet espace." />
      : <LoginPage route="/auth/login" authActions={authActions} authState={authState} notice="Connectez-vous pour accéder à cet espace." />;
  }

  return children;
}

// app_metadata is only ever writable with the service role key (see
// api/finalize-signup.js), never by the signed-in user's own client SDK --
// unlike user_metadata, which a PME account could edit on itself. That's
// what makes this a safe place to read an authorization-relevant role from.
// Missing role defaults to "pme": failure (a signup whose role-stamping
// call never landed) degrades to the least-privileged role, not the most.
function getUserRole(authState) {
  return authState.session?.user?.app_metadata?.role || "pme";
}

// Gates the Reviewer/Admin workspace behind an actual role instead of just
// "is someone logged in" -- ProtectedRoute above answers the latter, this
// answers the former. Every PME account defaults to role "pme" and gets
// turned back here with no way to reach a reviewer's view of dossiers.
function RoleGate({ authState, authActions, allow, children }) {
  if (ENABLE_TEST_TOOLS) return children;
  if (allow.includes(getUserRole(authState))) return children;

  return (
    <div className="page auth-page compact">
      <ReviewerTopNav authState={authState} authActions={authActions} />
      <main className="auth-layout login-layout">
        <section className="auth-panel">
          <div className="panel-title">
            <Lock size={22} />
            <div>
              <h2>Accès refusé</h2>
              <p>Cet espace est réservé aux comptes reviewer.</p>
            </div>
          </div>
          <a className="btn primary full" href="#/app">Retour à mon espace PME</a>
        </section>
      </main>
    </div>
  );
}

// Wraps the score-reveal / certificate parts of Analysis and Report -- the
// questionnaire and proofs stay free to fill in, but the AI-reviewed score,
// full analysis and certificate are what the one-time diagnostic fee pays
// for. Active in test mode is set unconditionally by the certificateStatus
// effect, so this needs no separate ENABLE_TEST_TOOLS check here.
function PaywallGate({ certificateStatus, actions, children }) {
  if (!ENABLE_PAYMENTS) return children;
  if (certificateStatus.active) return children;

  const loading = certificateStatus.status === "loading" || certificateStatus.status === "idle";

  return (
    <section className="paywall-gate">
      <Lock size={28} />
      <h2>Débloquez votre score et votre certificat</h2>
      <p>
        Le score revu par IA, l'analyse complète et le certificat ESG (valable 12 mois) sont disponibles
        après paiement du diagnostic.
      </p>
      {certificateStatus.error && <p className="auth-message error">{certificateStatus.error}</p>}
      <button
        className="btn primary"
        type="button"
        onClick={actions.startCheckout}
        disabled={loading || certificateStatus.status === "redirecting"}
      >
        <Lock size={18} />
        {certificateStatus.status === "redirecting" ? "Redirection vers le paiement..." : "Payer et débloquer"}
      </button>
    </section>
  );
}

// The Stripe success_url points back at a hash route (this is a hash-router
// SPA), so the checkout query string ends up appended after the "#" instead
// of before it -- e.g. "#/app/report?checkout=success&session_id=...". Split
// that out so `route` stays an exact path the existing `route === "/x"`
// checks can match, while the checkout params are still readable.
function parseHash(hash) {
  const raw = hash.replace("#", "") || "/";
  const [path, query] = raw.split("?");
  return { path: path || "/", params: new URLSearchParams(query || "") };
}

function App() {
  const [route, setRoute] = useState(() => parseHash(window.location.hash).path);
  const [checkoutNotice, setCheckoutNotice] = useState(() => {
    const { params } = parseHash(window.location.hash);
    return params.get("checkout");
  });
  const [sector, setSector] = useState("industry");
  const [activePillar, setActivePillar] = useState("E");
  const [answers, setAnswers] = useState({});
  const [reviews, setReviews] = useState({});
  const [documents, setDocuments] = useState([]);
  const [aiStatus, setAiStatus] = useState({ status: "local", message: "Mode local prêt. Lancez le serveur Ollama pour une vraie analyse LLM." });
  const [globalAnalysis, setGlobalAnalysis] = useState(emptyGlobalAnalysis);
  const [authState, setAuthState] = useState({ loading: true, session: null, user: null });
  const [certificateStatus, setCertificateStatus] = useState({ status: "idle", active: false, certificate: null });
  const [companyState, setCompanyState] = useState({ status: "idle", company: null, role: null });
  const [dossierState, setDossierState] = useState({ status: "idle", dossier: null });
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
    const onHash = () => {
      const { path, params } = parseHash(window.location.hash);
      setRoute(path);
      const checkout = params.get("checkout");
      if (checkout) setCheckoutNotice(checkout);
    };
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
        const target = data.session && authCallbackTarget();
        if (target) {
          cleanAuthCallbackUrl(target);
          setRoute(target);
        }
      }
    });

    const { data } = supabaseAuth.auth.onAuthStateChange((_event, session) => {
      setAuthState({ loading: false, session, user: session?.user || null });
      const target = session && authCallbackTarget();
      if (target) {
        cleanAuthCallbackUrl(target);
        setRoute(target);
      }
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  React.useEffect(() => {
    if (ENABLE_TEST_TOOLS || !ENABLE_PAYMENTS) {
      setCertificateStatus({ status: "done", active: true, certificate: null });
      return undefined;
    }
    if (authState.loading || !authState.session) return undefined;

    let cancelled = false;
    async function loadCertificateStatus() {
      setCertificateStatus((current) => ({ ...current, status: "loading" }));
      try {
        const response = await fetch(CERTIFICATE_STATUS_API, {
          headers: { Authorization: `Bearer ${authState.session.access_token}` }
        });
        const payload = await response.json();
        if (cancelled) return;
        if (!response.ok || !payload.ok) throw new Error(payload.error || "Statut du certificat indisponible.");
        setCertificateStatus({ status: "done", active: payload.active, certificate: payload.certificate });
      } catch (error) {
        if (!cancelled) setCertificateStatus({ status: "error", active: false, certificate: null, error: error.message });
      }
    }

    loadCertificateStatus();
    // The Stripe webhook writes the certificate a moment after the browser
    // is redirected back with ?checkout=success, so give it a couple of
    // retries instead of showing "unpaid" right after a real payment.
    const retry = checkoutNotice === "success" ? setTimeout(loadCertificateStatus, 3000) : null;
    return () => {
      cancelled = true;
      if (retry) clearTimeout(retry);
    };
  }, [authState.loading, authState.session, checkoutNotice]);

  // A "dossier" used to just be the signed-in Supabase user (snapshot.js
  // keyed everything off the caller's own uid); companyState.company.id is
  // the real multi-tenant unit going forward, resolved once per session so
  // save/load and future collaborator invites all point at the same
  // company instead of at whichever account happened to sign in.
  React.useEffect(() => {
    if (ENABLE_TEST_TOOLS) {
      setCompanyState({ status: "done", company: { id: "demo-company", name: "Entreprise demo" }, role: "owner" });
      return undefined;
    }
    if (authState.loading || !authState.session) return undefined;

    let cancelled = false;
    (async () => {
      setCompanyState((current) => ({ ...current, status: "loading" }));
      try {
        const response = await fetch(COMPANY_API, {
          method: "POST",
          headers: authHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({
            name: profile.companyName,
            sector: profile.sector,
            country: profile.country,
            size: profile.size
          })
        });
        const payload = await response.json();
        if (cancelled) return;
        if (!response.ok || !payload.ok) throw new Error(payload.error || "Entreprise indisponible.");
        setCompanyState({ status: "done", company: payload.company, role: payload.role });
      } catch (error) {
        if (!cancelled) setCompanyState({ status: "error", company: null, role: null, error: error.message });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authState.loading, authState.session]);

  React.useEffect(() => {
    const companyId = companyState.company?.id;
    if (!companyId) return undefined;

    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(`${DOCUMENTS_API}?company_id=${encodeURIComponent(companyId)}`, {
          headers: authHeaders()
        });
        const payload = await response.json();
        if (cancelled || !response.ok || !payload.ok) return;
        // Only replace the list if the server actually has rows: keeps
        // whatever was just loaded from a snapshot (or added this session)
        // intact instead of wiping it out on an empty first fetch.
        if (payload.documents?.length) setDocuments(payload.documents.map(mapServerDocument));
      } catch {
        // Keep whatever documents are already in state.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [companyState.company?.id]);

  React.useEffect(() => {
    const companyId = companyState.company?.id;
    if (!companyId) return undefined;

    let cancelled = false;
    (async () => {
      setDossierState((current) => ({ ...current, status: "loading" }));
      try {
        const response = await fetch(`${DOSSIERS_API}?company_id=${encodeURIComponent(companyId)}`, {
          headers: authHeaders()
        });
        const payload = await response.json();
        if (cancelled) return;
        if (!response.ok || !payload.ok) throw new Error(payload.error || "Statut du dossier indisponible.");
        setDossierState({ status: "done", dossier: payload.dossier });
      } catch (error) {
        if (!cancelled) setDossierState({ status: "error", dossier: null, error: error.message });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [companyState.company?.id]);

  async function submitDossier() {
    const companyId = companyState.company?.id;
    if (!companyId) return;
    setDossierState((current) => ({ ...current, status: "submitting" }));
    try {
      const response = await fetch(DOSSIERS_API, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ companyId, declaredScore: globalScore, reviewedScore: reviewedGlobalScore })
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Soumission impossible.");
      setDossierState({ status: "done", dossier: payload.dossier });
    } catch (error) {
      setDossierState((current) => ({ ...current, status: "error", error: error.message }));
    }
  }

  async function startCheckout() {
    if (ENABLE_TEST_TOOLS || !ENABLE_PAYMENTS) return;
    setCertificateStatus((current) => ({ ...current, status: "redirecting" }));
    try {
      const response = await fetch(CHECKOUT_API, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ companyName: profile.companyName })
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok || !payload.url) throw new Error(payload.error || "Paiement indisponible.");
      window.location.href = payload.url;
    } catch (error) {
      setCertificateStatus((current) => ({ ...current, status: "done", error: error.message }));
    }
  }

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
  const answeredCount = allQuestions.filter((question) => answers[question.id]?.value).length;
  const proofCount = allQuestions.filter((question) => answers[question.id]?.evidence || answers[question.id]?.value === "NA").length;
  const reviewCount = allQuestions.filter((question) => reviews[question.id]?.status === "done").length;
  const completion = Math.round((answeredCount / allQuestions.length) * 100);
  const proofCompletion = Math.round((proofCount / allQuestions.length) * 100);
  const reviewCompletion = Math.round((reviewCount / allQuestions.length) * 100);
  const priorityQuestions = allQuestions.filter((question) => {
    const answer = answers[question.id] || emptyAnswer();
    return question.priority && (!answer.value || answer.value === "unknown" || answer.value === "0" || answer.value === "0.5");
  });

  const authActions = {
    async signUp(nextProfile) {
      if (!supabaseAuth) throw new Error("Supabase Auth n'est pas configuré.");
      if (!nextProfile.email || !nextProfile.password) throw new Error("Email et mot de passe obligatoires.");
      if (nextProfile.password.length < 8) throw new Error("Le mot de passe doit contenir au moins 8 caractères.");

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
      if (data.user?.id) {
        // Best-effort: stamps role "pme" in app_metadata (backend-only
        // writable, unlike user_metadata above). If this call fails the
        // user simply has no role yet, which the app already treats as
        // "pme" by default -- it never fails open into a privileged role.
        fetch(FINALIZE_SIGNUP_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: data.user.id })
        }).catch(() => {});
      }
      if (!data.session) {
        const confirmation = new Error("Compte créé. Confirmez l'email si Supabase le demande, puis connectez-vous.");
        confirmation.info = true;
        window.location.hash = "/auth/login";
        throw confirmation;
      }
    },
    async signIn(email, password) {
      if (!supabaseAuth) throw new Error("Supabase Auth n'est pas configuré.");
      const { error } = await supabaseAuth.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    async signOut(redirectTo = "/auth/login") {
      await supabaseAuth?.auth.signOut();
      window.location.hash = redirectTo;
    },
    async requestPasswordReset(email) {
      if (!supabaseAuth) throw new Error("Supabase Auth n'est pas configuré.");
      const { error } = await supabaseAuth.auth.resetPasswordForEmail(email, {
        redirectTo: `${AUTH_REDIRECT_URL}#/auth/reset-password`
      });
      if (error) throw error;
    },
    async updatePassword(password) {
      if (!supabaseAuth) throw new Error("Supabase Auth n'est pas configuré.");
      const { error } = await supabaseAuth.auth.updateUser({ password });
      if (error) throw error;
    }
  };

  function authHeaders(extraHeaders = {}) {
    return {
      ...extraHeaders,
      ...(authState.session?.access_token ? { Authorization: `Bearer ${authState.session.access_token}` } : {})
    };
  }

  function updateAnswer(id, patch) {
    setAnswers((current) => ({ ...current, [id]: { ...emptyAnswer(), ...(current[id] || {}), ...patch } }));
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
      setAiStatus({ status: "ollama", message: "Analyse réalisée avec le backend sécurisé." });
      return normalizeRemoteReview(question, answer, payload.review, documents);
    } catch (error) {
      setAiStatus({ status: "fallback", message: `Analyse IA indisponible : fallback local utilisé. ${error.message}` });
      return proofReview(question, answer, documents);
    }
  }

  async function reviewQuestion(question) {
    const answer = answers[question.id] || emptyAnswer();
    setAiStatus({ status: "scanning", message: `Analyse IA de ${question.code} en cours...` });
    const review = await getAiReview(question, answer);
    setReviews((current) => ({ ...current, [question.id]: review }));
  }

  function fillTestProofs() {
    if (!ENABLE_TEST_TOOLS) return;
    const nextAnswers = {};
    const nextReviews = {};
    allQuestions.forEach((question, index) => {
      const value = question.priority ? "1" : index % 5 === 0 ? "0.5" : "1";
      const answer = { value, evidence: makeTestEvidence(question), justification: question.priority ? "Critère prioritaire suivi." : "Preuve demo pour test.", guidance: "" };
      nextAnswers[question.id] = answer;
      nextReviews[question.id] = proofReview(question, answer, documents);
    });
    setAnswers(nextAnswers);
    setReviews(nextReviews);
    setGlobalAnalysis(emptyGlobalAnalysis());
  }

  async function addDocument(document) {
    const localId = `doc-${Date.now()}`;
    const cleanDocument = {
      id: localId,
      title: document.title?.trim() || "Document sans titre",
      type: document.type?.trim() || "Document",
      content: document.content?.trim(),
      questionCodes: document.questionCodes || [],
      fileName: document.fileName,
      fileType: document.fileType,
      fileSize: document.fileSize,
      extractionStatus: document.extractionStatus || "manual",
      syncStatus: "saving"
    };
    if (!cleanDocument.content && !cleanDocument.fileName) return;
    // Optimistic: the document shows up immediately, then gets swapped for
    // the persisted server row (or flagged if that save fails) once the
    // upload resolves, rather than blocking the UI on a round trip.
    setDocuments((current) => [cleanDocument, ...current]);

    const companyId = companyState.company?.id;
    if (!companyId) {
      setDocuments((current) => current.map((item) => (item.id === localId ? { ...item, syncStatus: "local" } : item)));
      return;
    }

    try {
      const fileBase64 = document.file ? await fileToBase64(document.file) : null;
      const response = await fetch(DOCUMENTS_API, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          companyId,
          title: cleanDocument.title,
          type: cleanDocument.type,
          content: cleanDocument.content,
          questionCodes: cleanDocument.questionCodes,
          fileName: cleanDocument.fileName,
          fileType: cleanDocument.fileType,
          fileBase64
        })
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok || !payload.document) throw new Error(payload.error || "Enregistrement impossible.");
      setDocuments((current) => current.map((item) => (item.id === localId ? mapServerDocument(payload.document) : item)));
    } catch (error) {
      setDocuments((current) => current.map((item) => (item.id === localId ? { ...item, syncStatus: "error", syncError: error.message } : item)));
    }
  }

  async function removeDocument(documentId) {
    setDocuments((current) => current.filter((item) => item.id !== documentId));
    const companyId = companyState.company?.id;
    if (!companyId || documentId.startsWith("doc-")) return; // local-only (never synced, or a demo row): nothing server-side to delete.
    try {
      await fetch(`${DOCUMENTS_API}?id=${encodeURIComponent(documentId)}&company_id=${encodeURIComponent(companyId)}`, {
        method: "DELETE",
        headers: authHeaders()
      });
    } catch {
      // Already removed from the visible list; a failed server delete here
      // isn't worth interrupting the user over.
    }
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
      const currentAnswer = { ...emptyAnswer(), ...(nextAnswers[question.id] || {}) };
      const review = await getAiReview(question, currentAnswer);
      const shouldUseAiScore = !currentAnswer.value || currentAnswer.value === "unknown";
      nextReviews[question.id] = review;
      nextAnswers[question.id] = {
        ...currentAnswer,
        value: shouldUseAiScore ? review.suggestedScore : currentAnswer.value,
        evidence: currentAnswer.evidence || review.evidence,
        justification: currentAnswer.justification || `Score proposé par scan IA local. ${review.recommendation}`,
        guidance: currentAnswer.guidance
      };
    }
    setAnswers(nextAnswers);
    setReviews(nextReviews);
    setGlobalAnalysis(emptyGlobalAnalysis());
  }

  async function reviewAllVisible() {
    setAiStatus({ status: "scanning", message: "Analyse des preuves renseignées en cours..." });
    const nextReviews = { ...reviews };
    for (const question of allQuestions) {
      if (answers[question.id]?.value) nextReviews[question.id] = await getAiReview(question, answers[question.id]);
    }
    setReviews(nextReviews);
  }

  async function runGlobalAnalysis() {
    setAiStatus({ status: "scanning", message: "Analyse globale en cours..." });
    const nextReviews = { ...reviews };
    for (const question of allQuestions) {
      if (answers[question.id]?.value && nextReviews[question.id]?.status !== "done") {
        nextReviews[question.id] = await getAiReview(question, answers[question.id]);
      }
    }
    setReviews(nextReviews);
    setGlobalAnalysis(createGlobalAnalysis(allQuestions, answers, nextReviews, reviewedGlobalScore, reviewedScores));
  }

  function downloadReport() {
    const rows = [
      "Turritopsis ESG Diagnostic",
      `Entreprise : ${profile.companyName}`,
      `Score déclaré : ${globalScore}/100`,
      `Score revu : ${reviewedGlobalScore}/100`,
      "",
      ...allQuestions.map((question) => {
        const answer = answers[question.id] || emptyAnswer();
        const review = reviews[question.id] || emptyReview();
        return `${question.code} ${question.title} : ${answer.value || "non répondu"} | IA ${review.suggestedScore || "non revue"} | ${answer.evidence || "sans preuve"}`;
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
    const companyId = companyState.company?.id;
    if (!companyId) {
      setAiStatus({ status: "fallback", message: "Profil entreprise requis avant la sauvegarde." });
      return;
    }
    setAiStatus({ status: "scanning", message: "Sauvegarde du dossier en cours..." });
    try {
      const response = await fetch(SNAPSHOT_API, {
        method: "PUT",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ company_id: companyId, data: snapshotData() })
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Sauvegarde impossible.");
      setAiStatus({ status: "ollama", message: "Dossier sauvegardé dans la base." });
    } catch (error) {
      setAiStatus({ status: "fallback", message: `Sauvegarde non disponible : ${error.message}` });
    }
  }

  async function loadSnapshot() {
    const companyId = companyState.company?.id;
    if (!companyId) {
      setAiStatus({ status: "fallback", message: "Profil entreprise requis avant le chargement." });
      return;
    }
    setAiStatus({ status: "scanning", message: "Chargement du dossier en cours..." });
    try {
      const response = await fetch(`${SNAPSHOT_API}?company_id=${encodeURIComponent(companyId)}`, {
        headers: authHeaders()
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Chargement impossible.");
      restoreSnapshot(payload.data);
      setAiStatus({ status: "ollama", message: payload.data ? "Dossier chargé depuis la base." : "Aucun dossier sauvegardé trouvé." });
    } catch (error) {
      setAiStatus({ status: "fallback", message: `Chargement non disponible : ${error.message}` });
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
    enableTestTools: ENABLE_TEST_TOOLS,
    enablePayments: ENABLE_PAYMENTS,
    certificateStatus,
    companyState,
    dossierState
  };
  const actions = { updateAnswer, reviewQuestion, fillTestProofs, addDocument, removeDocument, fillTestDocuments, scanDocuments, reviewAllVisible, runGlobalAnalysis, downloadReport, saveSnapshot, loadSnapshot, resetDiagnostic, startCheckout, submitDossier };

  if (route === "/auth/enterprise") return <AuthPage route={route} profile={profile} setProfile={setProfile} authActions={authActions} authState={authState} />;
  if (route === "/auth/login") return <LoginPage route={route} authActions={authActions} authState={authState} />;
  if (route === "/review/login") return <ReviewerLoginPage authActions={authActions} authState={authState} />;
  if (route === "/auth/reset-password") return <ResetPasswordPage authActions={authActions} authState={authState} />;
  if (route === "/onboarding") return <ProtectedRoute route={route} authState={authState} authActions={authActions}><OnboardingPage route={route} profile={profile} setProfile={setProfile} /></ProtectedRoute>;
  if (route === "/app") return <ProtectedRoute route={route} authState={authState} authActions={authActions}><DashboardPage route={route} state={state} actions={actions} /></ProtectedRoute>;
  if (route === "/app/company-profile") return <ProtectedRoute route={route} authState={authState} authActions={authActions}><CompanyProfilePage route={route} profile={profile} setProfile={setProfile} /></ProtectedRoute>;
  if (route === "/app/questionnaire") return <ProtectedRoute route={route} authState={authState} authActions={authActions}><QuestionnairePage route={route} state={state} actions={actions} /></ProtectedRoute>;
  if (route === "/app/proofs") return <ProtectedRoute route={route} authState={authState} authActions={authActions}><ProofsPage route={route} state={state} actions={actions} /></ProtectedRoute>;
  if (route === "/app/analysis") return <ProtectedRoute route={route} authState={authState} authActions={authActions}><AnalysisPage route={route} state={state} actions={actions} /></ProtectedRoute>;
  if (route === "/app/report") return <ProtectedRoute route={route} authState={authState} authActions={authActions}><ReportPage route={route} state={state} actions={actions} /></ProtectedRoute>;
  if (route === "/review" || route === "/review/dossiers" || route.startsWith("/review/dossiers/")) return <ProtectedRoute route={route} authState={authState} authActions={authActions} variant="reviewer"><RoleGate authState={authState} authActions={authActions} allow={["reviewer", "admin"]}><ReviewerPage route={route} state={state} authState={authState} authActions={authActions} /></RoleGate></ProtectedRoute>;
  if (route === "/admin/questionnaire") return <ProtectedRoute route={route} authState={authState} authActions={authActions} variant="reviewer"><RoleGate authState={authState} authActions={authActions} allow={["admin"]}><AdminQuestionnairePage route={route} state={state} authState={authState} authActions={authActions} /></RoleGate></ProtectedRoute>;
  if (route === "/admin/overview") return <ProtectedRoute route={route} authState={authState} authActions={authActions} variant="reviewer"><RoleGate authState={authState} authActions={authActions} allow={["admin"]}><AdminOverviewPage route={route} authState={authState} authActions={authActions} /></RoleGate></ProtectedRoute>;
  return <PublicPage route="/" state={state} />;
}

createRoot(document.getElementById("root")).render(<App />);
