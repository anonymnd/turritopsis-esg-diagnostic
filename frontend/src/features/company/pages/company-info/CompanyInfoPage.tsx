import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Building2, CheckCircle2, ChevronRight, Info, Save } from "lucide-react";
import { useCompany } from "../../useCompany";
import { updateCompanyProfile } from "../../api";
import styles from "./company-info.module.css";

const EMPLOYEE_RANGES = ["1-9", "10-49", "50-99", "100-249", "250+"];

export default function CompanyInfoPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { data: company, isPending, isError, refetch } = useCompany();
  const [city, setCity] = useState("");
  const [ice, setIce] = useState("");
  const [employeeRange, setEmployeeRange] = useState("");
  const [website, setWebsite] = useState("");
  const [phone, setPhone] = useState("");
  const [activityDescription, setActivityDescription] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (company && !hydrated) {
      setCity(company.city ?? ""); setIce(company.ice ?? "");
      setEmployeeRange(company.employeeRange ?? ""); setWebsite(company.website ?? "");
      setPhone(company.phone ?? ""); setActivityDescription(company.activityDescription ?? "");
      setHydrated(true);
    }
  }, [company, hydrated]);

  const mutation = useMutation({
    mutationFn: () => updateCompanyProfile({ city, ice, employeeRange, website, phone, activityDescription }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["company", "mine"], updated);
      const redirectTo = searchParams.get("next");
      if (redirectTo) navigate(redirectTo);
    }
  });

  if (isPending) return <div className={styles.wrap} aria-busy="true"><p className={styles.loading}>Chargement des informations de votre entreprise…</p></div>;
  if (isError || !company) return <div className={styles.wrap} role="alert"><h1>Impossible de charger votre entreprise</h1><p>Vérifiez votre connexion puis réessayez.</p><button className={styles.submit} onClick={() => void refetch()}>Réessayer</button></div>;

  return (
    <div className={styles.wrap}>
      <nav className={styles.breadcrumbs} aria-label="Fil d’Ariane"><ol><li><Link to="/app">Tableau de bord</Link></li><li><ChevronRight size={14} aria-hidden="true" /><span aria-current="page">Infos entreprise</span></li></ol></nav>
      <header className={styles.header}><div><p className={styles.eyebrow}>ÉTAPE 01 · VOTRE PARCOURS ESG</p><h1>Votre entreprise, en quelques mots.</h1><p className={styles.subtitle}>Renseignez votre profil pour donner du contexte à votre diagnostic et aider l’évaluateur à comprendre votre activité.</p></div><img src="/images/dashboard/company.svg" alt="" width="240" height="130" /></header>
      <div className={styles.layout}>
        <form className={styles.form} onChange={() => { if (mutation.isSuccess || mutation.isError) mutation.reset(); }} onSubmit={e => { e.preventDefault(); mutation.mutate(); }}>
          <div className={styles.formHeader}><span className={styles.sectionIcon}><Building2 size={22} aria-hidden="true" /></span><div><h2>Profil de l’entreprise</h2><p>Les champs marqués d’un <span aria-hidden="true">*</span> sont obligatoires.</p></div></div>
          <fieldset className={styles.section} disabled={mutation.isPending}>
            <legend>01 <span>Identité & localisation</span></legend>
            <div className={styles.grid}>
              <div className={styles.field}><label htmlFor="city">Ville <span className={styles.optional}>Optionnel</span></label><input id="city" autoComplete="address-level2" value={city} onChange={e => setCity(e.target.value)} placeholder="Casablanca" /><p className={styles.hint}>La ville où votre entreprise est implantée.</p></div>
              <div className={styles.field}><label htmlFor="ice">ICE <span aria-hidden="true">*</span></label><input id="ice" value={ice} onChange={e => setIce(e.target.value)} placeholder="001234567000012" aria-describedby="ice-hint" required /><p id="ice-hint" className={styles.hint}>Identifiant Commun de l’Entreprise.</p></div>
              <div className={styles.field}><label htmlFor="employeeRange">Nombre d’employés <span aria-hidden="true">*</span></label><select id="employeeRange" value={employeeRange} onChange={e => setEmployeeRange(e.target.value)} required><option value="" disabled>Sélectionnez une tranche</option>{EMPLOYEE_RANGES.map(range => <option key={range} value={range}>{range} employés</option>)}</select><p className={styles.hint}>Choisissez la tranche correspondant à votre effectif.</p></div>
            </div>
          </fieldset>
          <fieldset className={styles.section} disabled={mutation.isPending}>
            <legend>02 <span>Coordonnées</span></legend>
            <div className={styles.grid}>
              <div className={styles.field}><label htmlFor="phone">Téléphone <span aria-hidden="true">*</span></label><input id="phone" type="tel" autoComplete="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+212 6 00 00 00 00" required /><p className={styles.hint}>Un numéro de contact professionnel.</p></div>
              <div className={styles.field}><label htmlFor="website">Site web <span className={styles.optional}>Optionnel</span></label><input id="website" autoComplete="url" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://votre-entreprise.ma" /><p className={styles.hint}>Votre site vitrine ou votre page officielle.</p></div>
            </div>
          </fieldset>
          <fieldset className={styles.section} disabled={mutation.isPending}>
            <legend>03 <span>Votre activité</span></legend>
            <div className={styles.field}><label htmlFor="activityDescription">Description de l’activité <span aria-hidden="true">*</span></label><textarea id="activityDescription" value={activityDescription} onChange={e => setActivityDescription(e.target.value)} placeholder="Présentez vos produits ou services, vos clients et vos principales activités…" rows={5} aria-describedby="activity-hint" required /><p id="activity-hint" className={styles.hint}>Quelques phrases suffisent pour situer votre entreprise et ses enjeux ESG.</p></div>
          </fieldset>
          <div className={styles.actions}><span className={styles.saveHint}>Vos modifications sont sauvegardées à l’enregistrement.</span><button type="submit" className={styles.submit} disabled={mutation.isPending}><Save size={17} aria-hidden="true" />{mutation.isPending ? "Enregistrement…" : "Enregistrer"}</button></div>
          <div aria-live="polite">{mutation.isSuccess && !searchParams.get("next") && <p className={styles.confirmation}><CheckCircle2 size={18} aria-hidden="true" />Informations enregistrées.</p>}</div>
          {mutation.isError && <p className={styles.error} role="alert">L’enregistrement a échoué. Vos modifications sont conservées dans le formulaire ; réessayez.</p>}
        </form>
        <aside className={styles.aside} aria-label="À propos de votre profil">
          <section className={styles.companyCard}><p className={styles.eyebrow}>VOTRE ENTREPRISE</p><h2>{company.name}</h2><p>{company.sector}</p><span className={styles.status}><CheckCircle2 size={15} aria-hidden="true" />{company.isProfileComplete ? "Profil complété" : "Profil à compléter"}</span></section>
          <section className={styles.guide}><img src="/images/dashboard/impact.svg" alt="" width="240" height="180" /><h2>Une bonne base pour votre diagnostic.</h2><p>Ces informations permettent de mettre vos pratiques ESG en perspective : secteur, taille et activité.</p><div className={styles.tip}><Info size={18} aria-hidden="true" /><p>Vous pourrez mettre à jour votre profil lorsque votre entreprise évolue.</p></div></section>
          <Link className={styles.next} to="/app/questionnaire"><div><span>LA PROCHAINE ÉTAPE</span><strong>Le questionnaire ESG</strong></div><ArrowRight size={19} aria-hidden="true" /></Link>
        </aside>
      </div>
    </div>
  );
}
