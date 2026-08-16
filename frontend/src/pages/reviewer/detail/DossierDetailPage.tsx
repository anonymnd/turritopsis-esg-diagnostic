import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addNote, getDossier, getNotes, updateDossier, type Dossier } from "../../../features/dossiers/api";
import { downloadDocument, listDocumentsForDossier } from "../../../features/documents/api";
import { reviewDossier } from "../../../features/ai/api";
import { computeScores } from "../../../features/questionnaire/scoring";
import { QUESTIONS } from "../../../features/questionnaire/questions";
import type { Answers } from "../../../features/questionnaire/api";
import styles from "./detail.module.css";

const ASSESSMENT_LABEL: Record<string, string> = {
  coherent: "Coherent",
  "score probablement surestime": "Score probablement surestime",
  "preuves insuffisantes": "Preuves insuffisantes",
  "revue manuelle requise": "Revue manuelle requise"
};

const STATUS_STYLE: Record<Dossier["status"], { bg: string; fg: string; label: string }> = {
  Submitted: { bg: "var(--status-progress-tint)", fg: "var(--status-progress)", label: "Soumis" },
  InReview: { bg: "var(--status-warn-tint)", fg: "var(--status-warn)", label: "En cours" },
  Validated: { bg: "var(--status-ok-tint)", fg: "var(--status-ok)", label: "Valide" },
  Rejected: { bg: "var(--status-bad-tint)", fg: "var(--status-bad)", label: "Rejete" }
};

export default function DossierDetailPage() {
  const { dossierId } = useParams<{ dossierId: string }>();
  const queryClient = useQueryClient();
  const [noteText, setNoteText] = useState("");
  const [finalScoreInput, setFinalScoreInput] = useState("");
  const [decision, setDecision] = useState<string | null>(null);
  const [unavailableDocIds, setUnavailableDocIds] = useState<Set<string>>(new Set());

  async function handleDownload(id: string, fileName: string) {
    const ok = await downloadDocument(id, fileName);
    if (!ok) {
      setUnavailableDocIds((prev) => new Set(prev).add(id));
    }
  }

  const { data: dossier, isPending } = useQuery({
    queryKey: ["dossier", dossierId],
    queryFn: () => getDossier(dossierId!),
    enabled: !!dossierId
  });

  const { data: notes } = useQuery({
    queryKey: ["dossier-notes", dossierId],
    queryFn: () => getNotes(dossierId!),
    enabled: !!dossierId
  });

  const { data: documents } = useQuery({
    queryKey: ["dossier-documents", dossierId],
    queryFn: () => listDocumentsForDossier(dossierId!),
    enabled: !!dossierId
  });

  const noteMutation = useMutation({
    mutationFn: () => addNote(dossierId!, noteText),
    onSuccess: () => {
      setNoteText("");
      queryClient.invalidateQueries({ queryKey: ["dossier-notes", dossierId] });
    }
  });

  const aiMutation = useMutation({
    mutationFn: () => reviewDossier(dossierId!)
  });

  const statusMutation = useMutation({
    mutationFn: ({ status, finalScore }: { status: Dossier["status"]; finalScore?: number }) => updateDossier(dossierId!, status, finalScore),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["dossier", dossierId] });
      queryClient.invalidateQueries({ queryKey: ["dossiers", "queue"] });
      setDecision(variables.status === "Validated" ? "Dossier valide — score final enregistre." : "Dossier rejete — la PME est notifiee.");
    }
  });

  if (isPending || !dossier) {
    return (
      <div className={styles.wrap}>
        <p>Chargement…</p>
      </div>
    );
  }

  let snapshot: Answers = {};
  try {
    snapshot = JSON.parse(dossier.snapshotJson) as Answers;
  } catch {
    snapshot = {};
  }
  const scores = computeScores(snapshot);
  const status = STATUS_STYLE[dossier.status];

  function validate() {
    const finalScore = finalScoreInput ? Number(finalScoreInput) : scores.overall;
    statusMutation.mutate({ status: "Validated", finalScore });
  }

  return (
    <div className={styles.wrap}>
      <Link to="/reviewer" className={styles.backLink}>
        ← File d'attente
      </Link>
      <div className={styles.header}>
        <h2>{dossier.companyName ?? dossier.companyId}</h2>
        <span className={styles.tag} style={{ background: status.bg, color: status.fg }}>
          {status.label}
        </span>
      </div>
      <p className={styles.subtitle}>Soumis le {new Date(dossier.submittedAt).toLocaleDateString("fr-FR")}</p>

      <div className={styles.scoreRow}>
        <div className={styles.scoreBox}>
          <b>{dossier.reviewedScore ?? scores.overall}</b>
          <span>Global</span>
        </div>
        <div className={styles.scoreBoxPillar} style={{ background: "var(--pillar-e-tint)", color: "var(--pillar-e-dark)" }}>
          <b>{scores.E}</b>
          <span>E</span>
        </div>
        <div className={styles.scoreBoxPillar} style={{ background: "var(--pillar-s-tint)", color: "var(--pillar-s-dark)" }}>
          <b>{scores.S}</b>
          <span>S</span>
        </div>
        <div className={styles.scoreBoxPillar} style={{ background: "var(--pillar-g-tint)", color: "var(--pillar-g-dark)" }}>
          <b>{scores.G}</b>
          <span>G</span>
        </div>
      </div>

      <h4>Analyse IA du dossier</h4>
      <div className={styles.notesCard}>
        {!aiMutation.data && !aiMutation.isPending && (
          <div className={styles.aiPrompt}>
            <p style={{ margin: "0 0 10px", fontSize: 13, color: "var(--ink-muted)" }}>
              Compare les scores declares par la PME aux preuves fournies pour reperer les criteres a verifier en priorite.
            </p>
            <button type="button" className={styles.btnGhost} onClick={() => aiMutation.mutate()}>
              Lancer l'analyse IA
            </button>
          </div>
        )}
        {aiMutation.isPending && <div className={styles.noteEmpty}>Analyse en cours…</div>}
        {aiMutation.isError && (
          <div className={styles.noteEmpty}>Analyse indisponible pour le moment. Reessayez dans un instant.</div>
        )}
        {aiMutation.data && (
          <div className={styles.aiPrompt}>
            <div className={styles.aiAssessmentRow}>
              <span className={styles.aiAssessmentBadge}>{ASSESSMENT_LABEL[aiMutation.data.assessment] ?? aiMutation.data.assessment}</span>
              {aiMutation.data.recommendedScore !== null && (
                <button
                  type="button"
                  className={styles.btnGhost}
                  style={{ padding: "6px 14px", fontSize: 12 }}
                  onClick={() => setFinalScoreInput(String(aiMutation.data!.recommendedScore))}
                >
                  Utiliser le score suggere ({aiMutation.data.recommendedScore})
                </button>
              )}
            </div>
            <p style={{ fontSize: 13, margin: "8px 0" }}>{aiMutation.data.summary}</p>
            {aiMutation.data.flaggedQuestions.length > 0 && (
              <ul className={styles.aiFlagList}>
                {aiMutation.data.flaggedQuestions.map((flag) => {
                  const question = QUESTIONS.find((q) => q.code === flag.questionCode);
                  return (
                    <li key={flag.questionCode}>
                      <b>
                        {flag.questionCode} — {question?.title ?? flag.questionCode}
                      </b>
                      : {flag.reason}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>

      <h4>Preuves fournies</h4>
      <div className={styles.notesCard}>
        {documents && documents.length > 0 ? (
          documents.map((doc) => {
            const question = QUESTIONS.find((q) => q.code === doc.questionCode);
            return (
              <div key={doc.id} className={styles.note}>
                <span style={{ color: "var(--ink-muted)", fontSize: 12 }}>
                  {doc.questionCode} — {question?.title ?? doc.questionCode}
                </span>
                {doc.textContent && <p style={{ margin: "4px 0 0" }}>{doc.textContent}</p>}
                {doc.fileName && !unavailableDocIds.has(doc.id) && (
                  <button
                    type="button"
                    className={styles.btnGhost}
                    style={{ padding: "6px 14px", marginTop: 6, fontSize: 12 }}
                    onClick={() => handleDownload(doc.id, doc.fileName!)}
                  >
                    Telecharger — {doc.fileName}
                  </button>
                )}
                {doc.fileName && unavailableDocIds.has(doc.id) && (
                  <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--status-bad)" }}>
                    Fichier indisponible ({doc.fileName}) — demandez a la PME de le re-televerser.
                  </p>
                )}
              </div>
            );
          })
        ) : (
          <div className={styles.noteEmpty}>Aucune preuve fournie.</div>
        )}
      </div>

      <h4>Commentaires</h4>
      <div className={styles.notesCard}>
        {notes && notes.length > 0 ? (
          notes.map((note) => (
            <div key={note.id} className={styles.note}>
              <span style={{ color: "var(--ink-muted)", fontSize: 12 }}>{new Date(note.createdAt).toLocaleDateString("fr-FR")}</span>
              <p style={{ margin: "4px 0 0" }}>{note.text}</p>
            </div>
          ))
        ) : (
          <div className={styles.noteEmpty}>Aucun commentaire pour le moment.</div>
        )}
      </div>

      <div className={styles.noteForm}>
        <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Ajouter un commentaire pour la PME…" />
      </div>

      <div className={styles.actions}>
        <input
          type="number"
          value={finalScoreInput}
          onChange={(e) => setFinalScoreInput(e.target.value)}
          placeholder={`Score final (${scores.overall})`}
          style={{ width: 160, padding: "10px 12px", borderRadius: 8, border: "1.5px solid var(--border)" }}
        />
        <button type="button" className={styles.btnGhost} onClick={() => noteMutation.mutate()} disabled={!noteText || noteMutation.isPending}>
          Envoyer le commentaire
        </button>
        <button type="button" className={styles.btnPrimary} onClick={validate} disabled={statusMutation.isPending}>
          {statusMutation.isPending ? "Un instant…" : "Valider le dossier"}
        </button>
        <button
          type="button"
          className={styles.btnGhost}
          onClick={() => statusMutation.mutate({ status: "Rejected" })}
          disabled={statusMutation.isPending}
        >
          {statusMutation.isPending ? "Un instant…" : "Rejeter"}
        </button>
        {decision && <span className={styles.decision}>{decision}</span>}
      </div>
    </div>
  );
}
