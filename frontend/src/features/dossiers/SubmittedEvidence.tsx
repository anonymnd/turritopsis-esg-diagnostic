import {useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {getRevisions, getNotes, getDossierHistory, type Dossier} from "./api";
import {listDocumentsForDossier, downloadDocument} from "../documents/index";
import {QUESTIONS} from "../questionnaire/index";
export function SubmittedEvidence({dossier:latest}: {dossier:Dossier}) {
 const [selectedDossier,setSelectedDossier]=useState<string | null>(null);
 const history=useQuery({queryKey:["dossier-history",latest.companyId],queryFn:getDossierHistory});
 const dossier=history.data?.find(d=>d.id===selectedDossier)??latest;
 const [selected,setSelected]=useState<string | null>(null);
 const [error,setError]=useState("");
 const revisionId=selected??dossier.currentRevisionId;
 const revisions=useQuery({queryKey:["dossier-revisions",dossier.id],queryFn:()=>getRevisions(dossier.id)});
 const documents=useQuery({queryKey:["dossier-documents",dossier.id,revisionId],queryFn:()=>listDocumentsForDossier(dossier.id,revisionId)});
 const notes=useQuery({queryKey:["dossier-notes",dossier.id],queryFn:()=>getNotes(dossier.id)});
 const revision=revisions.data?.find(r=>r.id===revisionId);
 let answers:Record<string,{score?:string;note?:string}>={};
 try {const parsed=JSON.parse(revision?.snapshotJson??dossier.snapshotJson);
  if(parsed && typeof parsed==="object" && !Array.isArray(parsed)) {
   for(const [code,a] of Object.entries(parsed)) if(a && typeof a==="object") {
    const value=a as {score?:unknown;note?:unknown};
    answers[code]={score:typeof value.score==="string"?value.score:undefined,note:typeof value.note==="string"?value.note:undefined};
   }
  }
 } catch { /* Legacy snapshots may be unavailable; keep the history usable. */ }
 async function download(id:string,name:string) {
  try {if(!await downloadDocument(id,name,dossier.id,revisionId))setError("Fichier indisponible.");}
  catch {setError("Impossible de telecharger cette preuve.");}
 }
 return <section aria-label="Historique des soumissions" style={{margin:"20px 0"}}>
  <h3>Historique des soumissions</h3>
  {!!history.data?.length && <label>Dossier <select aria-label="Dossier soumis" value={dossier.id} onChange={e=>{setSelectedDossier(e.target.value);setSelected(null);setError("");}}>
   {history.data.map(d=><option key={d.id} value={d.id}>{new Date(d.submittedAt).toLocaleString("fr-FR")} — {d.status}</option>)}
  </select></label>}
  {!dossier.currentRevisionId && <p role="status">Original submitted documents were not preserved.</p>}
  <p>Les preuves soumises sont conservees. Modifier vos documents de travail ne modifie pas ces copies.</p>
  {history.isError || revisions.isError || documents.isError || notes.isError ? <p role="alert">Historique indisponible. Rechargez la page.</p>:null}
  {!!revisions.data?.length && <label>Revision du dossier <select aria-label="Revision du dossier" value={revisionId??""} onChange={e=>{setSelected(e.target.value);setError("");}}>
   {revisions.data.map(r=><option key={r.id} value={r.id}>Revision {r.number} — {new Date(r.submittedAt).toLocaleString("fr-FR")} — {r.status}</option>)}
  </select></label>}
  {revision && <p>Score final : {revision.finalScore??"En attente"} {revision.recommendations && <span>— {revision.recommendations}</span>}</p>}
  <details><summary>Reponses soumises</summary>{Object.entries(answers).map(([code,a])=><p key={code}>{code} — {QUESTIONS.find(q=>q.code===code)?.title??code} : {a.score??"—"} {a.note??""}</p>)}</details>
  {documents.data?.map(d=><article key={d.id}><strong>{d.questionCode} — {d.label??"Preuve"}</strong><p>{d.textContent}</p>
   {d.fileName && <button type="button" onClick={()=>download(d.id,d.fileName!)}>Telecharger — {d.fileName}</button>}</article>)}
  {notes.data?.filter(n=>n.revisionId===revisionId).map(n=><p key={n.id}>{n.text}</p>)}
  {error && <p role="alert">{error}</p>}
 </section>;
}
