import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowDown, ArrowRight, Check, FileText, Leaf, ShieldCheck, Users } from "lucide-react";
import { AuthModal } from "../../auth";
import SiteNav from "../../../shared/components/SiteNav";
import BrandLogo from "../../../shared/components/BrandLogo";
import styles from "./landing.module.css";

const STEPS = [
  { image: "questionnaire", title: "Faites le point", body: "Répondez aux 27 critères ESG et décrivez les pratiques de votre entreprise.", label: "Questionnaire" },
  { image: "evidence", title: "Ajoutez vos preuves", body: "Associez vos documents et vos notes aux réponses pour étayer votre diagnostic.", label: "Justificatifs" },
  { image: "analysis", title: "Affinez votre dossier", body: "L’analyse vous aide à repérer les éléments faibles ou manquants avant la soumission.", label: "Analyse assistée" },
  { image: "report", title: "Passez à l’action", body: "Après la revue humaine, retrouvez le score final et les recommandations dans votre rapport.", label: "Revue & rapport" }
];
const PILLARS = [
  { icon: Leaf, letter: "E", title: "Environnement", body: "Mesurez vos pratiques et leur impact sur les ressources.", topics: ["Énergie & émissions", "Eau & déchets", "Biodiversité"], className: "environment" },
  { icon: Users, letter: "S", title: "Social", body: "Placez les personnes au cœur de vos engagements.", topics: ["Santé & sécurité", "Formation & équité", "Impact local"], className: "social" },
  { icon: ShieldCheck, letter: "G", title: "Gouvernance", body: "Structurez une gestion responsable et transparente.", topics: ["Éthique & intégrité", "Transparence", "Conformité"], className: "governance" }
];
const FAQ = [
  { question: "À qui s’adresse Turritopsis ?", answer: "Aux PME marocaines qui souhaitent faire le point sur leurs pratiques environnementales, sociales et de gouvernance, puis constituer un dossier accompagné de preuves." },
  { question: "Quels documents puis-je ajouter ?", answer: "Vous pouvez joindre les justificatifs utiles à vos réponses : factures, politiques internes, attestations ou notes explicatives. Un justificatif peut aussi être composé uniquement de texte. La taille maximale d’une pièce jointe est de 4 Mo." },
  { question: "Puis-je compléter mon diagnostic en plusieurs fois ?", answer: "Oui. Vos réponses et vos documents de travail sont enregistrés dans votre espace entreprise. Vous pouvez reprendre votre diagnostic avant de soumettre votre dossier." },
  { question: "Qui valide le score final ?", answer: "Un réviseur humain examine le dossier, motive sa décision et fixe le score final. L’analyse assistée par IA aide à préparer la revue ; elle ne remplace pas cette validation." }
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const auth = searchParams.get("auth");
  const showAuth = auth === "login" || auth === "signup" || auth === "forgot";
  function closeAuth() {
    const params = new URLSearchParams(searchParams);
    params.delete("auth");
    setSearchParams(params, { replace: true });
  }
  const start = () => navigate("/?auth=signup");

  return (
    <div className={styles.page}>
      <a className={styles.skipLink} href="#main">Aller au contenu</a>
      <SiteNav />
      {showAuth && <AuthModal onClose={closeAuth} />}
      <main id="main" tabIndex={-1}>
        <section className={styles.hero} aria-labelledby="hero-title">
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}><span aria-hidden="true" />POUR LES PME MAROCAINES</p>
            <h1 id="hero-title">Vos engagements.<br /><span>Un impact qui se mesure.</span></h1>
            <p className={styles.heroLead}>Transformez vos pratiques en un diagnostic ESG clair, étayé par vos preuves et examiné par un réviseur humain.</p>
            <div className={styles.heroActions}>
              <button type="button" className={styles.primaryButton} onClick={start}>Démarrer mon diagnostic<ArrowRight size={18} aria-hidden="true" /></button>
              <a className={styles.secondaryButton} href="#steps">Découvrir le parcours<ArrowDown size={17} aria-hidden="true" /></a>
            </div>
            <div className={styles.heroReassurance}><ShieldCheck size={18} aria-hidden="true" /><span>Une analyse assistée. Une décision humaine.</span></div>
            <div className={styles.sectors}><span>Votre secteur, vos enjeux.</span><div>{["Textile", "Agroalimentaire", "Tourisme", "BTP", "Industrie"].map(sector => <span key={sector}>{sector}</span>)}</div></div>
          </div>
          <div className={styles.heroVisual}>
            <div className={styles.visualTop}><span><Leaf size={16} aria-hidden="true" />Votre démarche ESG</span><span className={styles.previewLabel}>Aperçu illustratif</span></div>
            <div className={styles.earthScene}><span className={styles.orbit} aria-hidden="true" /><span className={styles.orbitInner} aria-hidden="true" /><img src="/logo-icon.png" alt="La Terre de Turritopsis, symbole d’un avenir durable" width="512" height="512" className={styles.earth} /><div className={styles.evidenceBadge}><span><FileText size={19} aria-hidden="true" /></span><div>Des engagements<strong>Appuyés par vos preuves</strong></div></div></div>
            <div className={styles.previewCard}><div className={styles.previewHeading}><div><p>VOTRE DIAGNOSTIC</p><h2>Trois piliers. Une vision d’ensemble.</h2></div><ShieldCheck size={24} aria-hidden="true" /></div><div className={styles.previewPillars}>{PILLARS.map(pillar => <div key={pillar.letter} className={styles[pillar.className]}><pillar.icon size={18} aria-hidden="true" /><span>{pillar.title}</span><strong>{pillar.letter}</strong></div>)}</div><div className={styles.previewFoot}><Check size={16} aria-hidden="true" />Du questionnaire jusqu’au rapport.</div></div>
          </div>
        </section>
        <div className={styles.facts} aria-label="Le diagnostic en quelques repères"><div><strong>27</strong><span>critères pour faire le point</span></div><div><strong>3</strong><span>piliers complémentaires</span></div><div><ShieldCheck size={30} aria-hidden="true" /><span>Un score final validé<br />par un réviseur humain</span></div></div>
        <section id="steps" className={styles.section} aria-labelledby="steps-title"><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>UN PARCOURS, ÉTAPE PAR ÉTAPE</p><h2 id="steps-title">De vos pratiques<br />à votre prochain progrès.</h2></div><p>Un espace pour répondre, rassembler vos justificatifs et avancer jusqu’à la revue de votre dossier.</p></div><div className={styles.stepsGrid}>{STEPS.map((step, index) => <article key={step.title} className={styles.stepCard}><div className={styles.stepArt}><img src={`/images/dashboard/${step.image}.svg`} alt="" width="240" height="160" loading="lazy" /><span>0{index + 1}</span></div><p className={styles.stepLabel}>{step.label}</p><h3>{step.title}</h3><p>{step.body}</p></article>)}</div></section>
        <section id="pillars" className={styles.pillarSection} aria-labelledby="pillars-title"><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>UNE APPROCHE ÉQUILIBRÉE</p><h2 id="pillars-title">Votre entreprise,<br />sous trois angles essentiels.</h2></div><p>Environnement, social et gouvernance : des dimensions complémentaires pour comprendre vos forces et vos pistes d’amélioration.</p></div><div className={styles.pillarsGrid}>{PILLARS.map(pillar => <article key={pillar.letter} className={`${styles.pillarCard} ${styles[pillar.className]}`}><div className={styles.pillarTop}><span className={styles.pillarIcon}><pillar.icon size={25} aria-hidden="true" /></span><span className={styles.pillarLetter} aria-hidden="true">{pillar.letter}</span></div><h3>{pillar.title}</h3><p>{pillar.body}</p><ul>{pillar.topics.map(topic => <li key={topic}><Check size={15} aria-hidden="true" />{topic}</li>)}</ul></article>)}</div></section>
        <section id="questions" className={`${styles.section} ${styles.faqSection}`} aria-labelledby="faq-title"><div><p className={styles.eyebrow}>AVANT DE COMMENCER</p><h2 id="faq-title">Vos questions,<br />en toute simplicité.</h2><p className={styles.faqIntro}>Quelques repères pour aborder votre diagnostic sereinement.</p></div><div className={styles.faqList}>{FAQ.map(item => <details key={item.question}><summary>{item.question}<span aria-hidden="true">+</span></summary><p>{item.answer}</p></details>)}</div></section>
        <section className={styles.cta} aria-labelledby="cta-title"><div><p className={styles.eyebrow}>LE PROCHAIN PAS VOUS APPARTIENT</p><h2 id="cta-title">Donnez une direction<br />à vos engagements.</h2><p>Commencez par faire le point. Avancez à votre rythme.</p><button type="button" className={styles.primaryButton} onClick={start}>Créer mon espace entreprise<ArrowRight size={18} aria-hidden="true" /></button></div><img src="/images/dashboard/impact.svg" alt="" width="280" height="220" loading="lazy" /></section>
      </main>
      <footer className={styles.footer}><div><BrandLogo size={32} /><p>De vos engagements à l’action.</p></div><nav aria-label="Navigation de pied de page"><a href="#steps">Le parcours</a><a href="#pillars">Piliers ESG</a><a href="#questions">Questions fréquentes</a></nav><p className={styles.copyright}>© 2026 Turritopsis<br />Diagnostic ESG pour PME marocaines</p></footer>
    </div>
  );
}
