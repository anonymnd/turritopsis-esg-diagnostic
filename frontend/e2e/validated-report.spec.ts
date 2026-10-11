import {test,expect,type APIRequestContext} from "@playwright/test";

// Core workflow, API level: company submits -> reviewer starts review, tries invalid decisions,
// validates with a human score -> company sees the validated result and its notification.
// Uses the existing E2eHost fixtures (reviewer@e2e.example) and the same helpers pattern as revisions.spec.ts.
const api="http://127.0.0.1:5017/api/v1";
const password="Fixture-Test-42!";
type Session={accessToken:string;userId:string;companyId:string;roles:string[]};
const headers=(s:Session)=>({Authorization:`Bearer ${s.accessToken}`});

async function login(request:APIRequestContext,email:string):Promise<Session> {
 const response=await request.post(`${api}/auth/login`,{data:{email,password}});
 expect(response.ok()).toBeTruthy();return response.json();
}
async function registerCompany(request:APIRequestContext):Promise<Session> {
 const email=`company-${crypto.randomUUID()}@e2e.example`;
 const response=await request.post(`${api}/auth/register`,{data:{email,password,companyName:"Synthetic Workflow Company",sector:"Industry",city:"Rabat"}});
 expect(response.ok()).toBeTruthy();return response.json();
}

test("validated review result reaches the company with the human score, recommendations and a notification",async({request})=>{
 const company=await registerCompany(request);
 const reviewer=await login(request,"reviewer@e2e.example");

 // 1. Company completes profile, answers and evidence.
 expect((await request.put(`${api}/companies`,{headers:headers(company),data:{city:"Rabat",ice:"FIXTURE-ICE",employeeRange:"10-50",phone:"fixture-phone",activityDescription:"Synthetic activity"}})).ok()).toBeTruthy();
 expect((await request.put(`${api}/snapshots`,{headers:headers(company),data:{dataJson:JSON.stringify({E1:{score:"1",note:"declared answer"}})}})).ok()).toBeTruthy();
 expect((await request.post(`${api}/documents`,{headers:headers(company),data:{questionCode:"E1",textContent:"audit report 2025",fileName:"proof.txt",fileBase64:Buffer.from("proof bytes").toString("base64")}})).ok()).toBeTruthy();

 // 2. Submission creates revision 1 in the Submitted state.
 const submitted=await request.post(`${api}/dossiers`,{headers:headers(company),data:{declaredScore:50,reviewedScore:50}});
 expect(submitted.ok()).toBeTruthy();
 const dossier=await submitted.json();
 expect(dossier.status).toBe("Submitted");expect(dossier.revisionNumber).toBe(1);

 // 3. A company member cannot make review decisions.
 expect((await request.put(`${api}/dossiers/${dossier.id}`,{headers:headers(company),data:{status:"Validated",finalScore:90,revisionId:dossier.currentRevisionId}})).status()).toBe(403);

 // 4. AI is advisory only: reviewer-only, local-only in the test host, no raw text sent, nothing changes in the dossier.
 expect((await request.post(`${api}/ai/review-dossier/${dossier.id}`,{headers:headers(company)})).status()).toBe(403);
 const ai=await request.post(`${api}/ai/review-dossier/${dossier.id}?revisionId=${dossier.currentRevisionId}`,{headers:headers(reviewer)});
 expect(ai.ok()).toBeTruthy();
 const advice=await ai.json();
 expect(advice.privacy.rawDocumentTextSent).toBe(false);expect(advice.privacy.requiresHumanVerification).toBe(true);
 const afterAi=await (await request.get(`${api}/dossiers/${dossier.id}`,{headers:headers(reviewer)})).json();
 expect(afterAi.status).toBe("Submitted");expect(afterAi.finalScore??null).toBeNull();

 // 5. Reviewer starts review; invalid decisions are rejected without changing state.
 const started=await request.put(`${api}/dossiers/${dossier.id}`,{headers:headers(reviewer),data:{status:"InReview",revisionId:dossier.currentRevisionId}});
 expect(started.ok()).toBeTruthy();expect((await started.json()).status).toBe("InReview");
 expect((await request.put(`${api}/dossiers/${dossier.id}`,{headers:headers(reviewer),data:{status:"Validated",finalScore:101,revisionId:dossier.currentRevisionId}})).status()).toBe(400);
 expect((await request.put(`${api}/dossiers/${dossier.id}`,{headers:headers(reviewer),data:{status:"Validated",revisionId:dossier.currentRevisionId}})).status()).toBe(400);
 expect((await request.put(`${api}/dossiers/${dossier.id}`,{headers:headers(reviewer),data:{status:"Validated",finalScore:75,revisionId:crypto.randomUUID()}})).status()).toBe(409);
 expect((await (await request.get(`${api}/dossiers/${dossier.id}`,{headers:headers(reviewer)})).json()).status).toBe("InReview");

 // 6. Company cannot resubmit while the review is in progress.
 expect((await request.post(`${api}/dossiers`,{headers:headers(company),data:{declaredScore:50,reviewedScore:50}})).status()).toBe(409);

 // 7. Reviewer validates with a human score and recommendations.
 const validated=await request.put(`${api}/dossiers/${dossier.id}`,{headers:headers(reviewer),data:{status:"Validated",finalScore:72,recommendations:"Formalise the environmental policy.",revisionId:dossier.currentRevisionId}});
 expect(validated.ok()).toBeTruthy();
 const decision=await validated.json();
 expect(decision.status).toBe("Validated");expect(decision.finalScore).toBe(72);

 // 8. The company sees exactly that validated result.
 const mine=await (await request.get(`${api}/dossiers/mine`,{headers:headers(company)})).json();
 expect(mine.id).toBe(dossier.id);expect(mine.status).toBe("Validated");
 expect(mine.finalScore).toBe(72);expect(mine.recommendations).toBe("Formalise the environmental policy.");
 const revisions=await (await request.get(`${api}/dossiers/${dossier.id}/revisions`,{headers:headers(company)})).json();
 expect(revisions).toHaveLength(1);

 // 9. The validated dossier is closed: no further decisions or comments.
 expect((await request.put(`${api}/dossiers/${dossier.id}`,{headers:headers(reviewer),data:{status:"Rejected",revisionId:dossier.currentRevisionId}})).status()).toBe(409);
 expect((await request.post(`${api}/dossiers/${dossier.id}/notes`,{headers:headers(reviewer),data:{text:"late comment",revisionId:dossier.currentRevisionId}})).status()).toBe(409);

 // 10. The outbox worker (polls every 5s) delivers the notification to the owning company only.
 await expect.poll(async()=>{
  const r=await request.get(`${api}/notifications`,{headers:headers(company)});
  if(!r.ok())return [];
  return (await r.json()).map((n:{type:string})=>n.type);
 },{timeout:30000,intervals:[1000]}).toContain("dossier.validated");
 const stranger=await registerCompany(request);
 const strangerNotes=await (await request.get(`${api}/notifications`,{headers:headers(stranger)})).json();
 expect(strangerNotes.map((n:{type:string})=>n.type)).not.toContain("dossier.validated");
 expect((await request.get(`${api}/dossiers/${dossier.id}`,{headers:headers(stranger)})).status()).toBe(403);
});
