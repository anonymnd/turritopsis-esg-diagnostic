import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, UserPlus } from "lucide-react";
import { createReviewer, getReviewers } from "../api";
import WorkspacePageHeader from "../../../shared/components/WorkspacePageHeader";
import styles from "./admin.module.css";

export default function ReviewersPage() {
  const { data: reviewers, isPending, isError, refetch } = useQuery({ queryKey: ["admin", "reviewers"], queryFn: getReviewers });
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [createdEmail, setCreatedEmail] = useState<string | null>(null);
  const createReviewerMutation = useMutation({
    mutationFn: () => createReviewer({ email, password }),
    onSuccess: () => {
      setCreatedEmail(email); setEmail(""); setPassword(""); setFormError(null);
      void queryClient.invalidateQueries({ queryKey: ["admin", "reviewers"] });
    },
    onError: () => setFormError("Impossible de créer ce compte. Vérifiez l’email et le mot de passe (8 caractères minimum).")
  });
  function handleCreateReviewer(event: FormEvent) {
    event.preventDefault(); setFormError(null); setCreatedEmail(null); createReviewerMutation.mutate();
  }
  return <div className={styles.wrap}>
    <WorkspacePageHeader title="Reviseurs" eyebrow="L’ÉQUIPE DE REVUE ESG" image="questionnaire" description="Accompagnez la revue humaine des dossiers en gérant les comptes de votre équipe." breadcrumbs={[{ label: "Espace équipe", to: "/reviewer" }, { label: "Administration", to: "/reviewer/admin" }, { label: "Reviseurs" }]} />
    <section className={`${styles.section} ${styles.createSection}`} aria-labelledby="create-title"><div className={styles.formIntro}><span className={styles.formIcon}><UserPlus size={22} aria-hidden="true" /></span><p className={styles.eyebrow}>UN NOUVEAU MEMBRE</p><h2 id="create-title">Créer un réviseur</h2><p className={styles.hint}>Ce compte pourra examiner les preuves et prendre une décision sur les dossiers. Le rôle administrateur reste réservé.</p></div>
      <form className={styles.form} onSubmit={handleCreateReviewer}>
        <div className={styles.field}><label htmlFor="reviewerEmail">Email</label><input id="reviewerEmail" type="email" autoComplete="off" value={email} onChange={event => setEmail(event.target.value)} placeholder="reviseur@entreprise.ma" required disabled={createReviewerMutation.isPending} /></div>
        <div className={styles.field}><label htmlFor="reviewerPassword">Mot de passe</label><input id="reviewerPassword" type="password" autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} required minLength={8} disabled={createReviewerMutation.isPending} aria-describedby="password-hint" /><span id="password-hint" className={styles.fieldHint}>8 caractères minimum.</span></div>
        <button type="submit" className={styles.submit} disabled={createReviewerMutation.isPending}><UserPlus size={17} aria-hidden="true" />{createReviewerMutation.isPending ? "Création en cours…" : "Créer le réviseur"}</button>
        {formError && <p className={styles.error} role="alert">{formError}</p>}
        {createdEmail && <p className={styles.confirmation} role="status">Le compte {createdEmail} a été créé.</p>}
      </form>
    </section>
    <section className={styles.reviewersSection} aria-labelledby="reviewers-title"><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>LA REVUE RESTE HUMAINE</p><h2 id="reviewers-title">Comptes existants</h2></div>{!isPending && !isError && <span className={styles.hint}>{reviewers?.length ?? 0} réviseur{reviewers?.length === 1 ? "" : "s"}</span>}</div>
      {isPending ? <div className={styles.empty} role="status">Chargement des réviseurs…</div> : isError ? <div className={styles.error} role="alert"><p>Impossible de charger les réviseurs.</p><button className={styles.secondary} onClick={() => void refetch()}>Réessayer</button></div> : !reviewers?.length ? <div className={styles.empty}><img src="/images/dashboard/questionnaire.svg" alt="" width="180" height="100" /><p>Aucun réviseur pour le moment.</p></div> : <ul className={styles.reviewerCards}>{reviewers.map(reviewer => <li key={reviewer.id} className={styles.reviewerCard}><span className={styles.reviewerAvatar} aria-hidden="true">{reviewer.email.slice(0, 2).toUpperCase()}</span><div><h3>{reviewer.email}</h3><span className={styles.reviewerRole}><ShieldCheck size={14} aria-hidden="true" /> Réviseur ESG</span></div></li>)}</ul>}
    </section>
  </div>;
}
