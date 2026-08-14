import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteDocument, listDocuments, uploadDocument } from "../../../features/documents/api";
import { QUESTIONS, type Pillar } from "../../../features/questionnaire/questions";
import styles from "./proofs.module.css";

const PILLAR_COLOR: Record<Pillar, string> = { E: "var(--pillar-e)", S: "var(--pillar-s)", G: "var(--pillar-g)" };

export default function ProofsPage() {
  const queryClient = useQueryClient();
  const { data: documents, isPending } = useQuery({ queryKey: ["documents"], queryFn: listDocuments });
  const [openCode, setOpenCode] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: uploadDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      setOpenCode(null);
      setNote("");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["documents"] })
  });

  if (isPending) {
    return (
      <div className={styles.wrap}>
        <p>Chargement…</p>
      </div>
    );
  }

  const byCode = new Map((documents ?? []).map((d) => [d.questionCode, d]));
  const providedCount = QUESTIONS.filter((q) => byCode.has(q.code)).length;

  function submitProof(code: string) {
    const file = fileInputRef.current?.files?.[0];
    uploadMutation.mutate({ questionCode: code, textContent: note || undefined, file });
  }

  return (
    <div className={styles.wrap}>
      <h2>Preuves</h2>
      <p className={styles.subtitle}>
        Joignez un document ou une note pour les criteres sensibles. {providedCount} sur {QUESTIONS.length} fournis.
      </p>

      <div className={styles.list}>
        {QUESTIONS.map((q) => {
          const doc = byCode.get(q.code);
          const isOpen = openCode === q.code;
          return (
            <div key={q.code}>
              <div className={styles.row}>
                <span className={styles.pillarDot} style={{ background: PILLAR_COLOR[q.pillar], color: "#fff" }}>
                  {q.pillar}
                </span>
                <div className={styles.rowMain}>
                  <div className={styles.rowLabel}>{q.title}</div>
                  {doc?.fileName && <div className={styles.rowFile}>{doc.fileName}</div>}
                  {doc?.textContent && !doc.fileName && <div className={styles.rowFile}>{doc.textContent}</div>}
                </div>
                <span className={`${styles.tag} ${doc ? styles.tagOk : styles.tagWarn}`}>{doc ? "Fourni" : "A fournir"}</span>
                {doc ? (
                  <button type="button" className={`${styles.action} ${styles.actionDanger}`} onClick={() => deleteMutation.mutate(doc.id)}>
                    Retirer
                  </button>
                ) : (
                  <button type="button" className={styles.action} onClick={() => setOpenCode(isOpen ? null : q.code)}>
                    Ajouter une preuve
                  </button>
                )}
              </div>
              {isOpen && (
                <div className={styles.row} style={{ background: "var(--surface-2)" }}>
                  <div className={styles.rowMain}>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Note ou reference du justificatif"
                      style={{ width: "100%", minHeight: 60, padding: 8, borderRadius: 8, border: "1px solid var(--border)" }}
                    />
                    <input ref={fileInputRef} type="file" style={{ marginTop: 8 }} />
                  </div>
                  <button type="button" className={styles.action} onClick={() => submitProof(q.code)} disabled={uploadMutation.isPending}>
                    Enregistrer
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
