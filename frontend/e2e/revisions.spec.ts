import {test,expect,type APIRequestContext,type Page} from "@playwright/test";
import {readFile} from "node:fs/promises";

const api="http://127.0.0.1:5017/api/v1";
const password="Fixture-Test-42!";
type Session={accessToken:string;userId:string;companyId:string;roles:string[]};
const headers=(s:Session)=>({Authorization:`Bearer ${s.accessToken}`});
async function login(request:APIRequestContext,email:string):Promise<Session> {
 const response=await request.post(`${api}/auth/login`,{data:{email,password}});
 expect(response.ok()).toBeTruthy();return response.json();
}
async function company(request:APIRequestContext) {
 const email=`company-${crypto.randomUUID()}@e2e.example`;
 const response=await request.post(`${api}/auth/register`,{data:{email,password,companyName:"Synthetic ESG Company",sector:"Industry",city:"Rabat"}});
 expect(response.ok()).toBeTruthy();const session:Session=await response.json();
 expect((await request.put(`${api}/companies`,{headers:headers(session),data:{city:"Rabat",ice:"FIXTURE-ICE",employeeRange:"10-50",phone:"fixture-phone",activityDescription:"Synthetic activity"}})).ok()).toBeTruthy();
 await answers(request,session,"1","original answer");return {email,session};
}
async function answers(request:APIRequestContext,session:Session,score:string,note:string) {
 const response=await request.put(`${api}/snapshots`,{headers:headers(session),data:{dataJson:JSON.stringify({E1:{score,note}})}});
 expect(response.ok()).toBeTruthy();
}
async function upload(request:APIRequestContext,session:Session,text="original frozen proof",bytes="synthetic attachment") {
 const response=await request.post(`${api}/documents`,{headers:headers(session),data:{questionCode:"E1",textContent:text,fileName:"fixture.txt",fileBase64:Buffer.from(bytes).toString("base64")}});
 expect(response.ok()).toBeTruthy();return response.json();
}
async function submit(request:APIRequestContext,session:Session) {
 const response=await request.post(`${api}/dossiers`,{headers:headers(session),data:{declaredScore:50,reviewedScore:50}});
 expect(response.ok()).toBeTruthy();return response.json();
}
async function browserLogin(page:Page,email:string,internal=false) {
 await page.goto(internal?"/review/login":"/auth?tab=login");
 await page.getByLabel(internal?"Identifiant":"E-mail professionnel").fill(email);
 await page.getByLabel("Mot de passe",{exact:true}).fill(password);
 await page.getByRole("button",{name:"Se connecter",exact:true}).click();
 await expect(page).toHaveURL(internal?/\/reviewer/:/\/app/);
}

test("company uploads and submits; reviewer downloads fixed evidence and confirms a decision",async({page,request,browser})=>{
 const owner=await company(request);
 await browserLogin(page,owner.email);
 await page.goto("/app/proofs?question=E1");
 await page.getByPlaceholder("Note ou reference du justificatif").fill("original frozen proof");
 await page.locator('input[type="file"]').setInputFiles({name:"fixture.txt",mimeType:"text/plain",buffer:Buffer.from("synthetic attachment")});
 const saved=page.waitForResponse(r=>r.url()===`${api}/documents`&&r.request().method()==="POST");
 await page.getByRole("button",{name:"Enregistrer",exact:true}).click();
 const document=await (await saved).json();
 await page.goto("/app/analysis");
 const submitted=page.waitForResponse(r=>r.url()===`${api}/dossiers`&&r.request().method()==="POST");
 await page.getByRole("button",{name:"Soumettre le dossier pour revue"}).click();
 const dossier=await (await submitted).json();expect(dossier.revisionNumber).toBe(1);
 expect((await request.delete(`${api}/documents/${document.id}`,{headers:headers(owner.session)})).ok()).toBeTruthy();
 await upload(request,owner.session,"replacement working proof","replacement bytes");
 const context=await browser.newContext();const reviewer=await context.newPage();
 try {
  await browserLogin(reviewer,"reviewer@e2e.example",true);
  await reviewer.goto(`/reviewer/dossiers/${dossier.id}`);
  await expect(reviewer.getByText("original frozen proof",{exact:true})).toBeVisible();
  await expect(reviewer.getByText("replacement working proof",{exact:true})).toHaveCount(0);
  const downloaded=reviewer.waitForEvent("download");
  await reviewer.getByRole("button",{name:"Telecharger — fixture.txt"}).click();
  const file=await downloaded;expect(await readFile((await file.path())!,"utf8")).toBe("synthetic attachment");
  await reviewer.getByRole("spinbutton").fill("60");
  await reviewer.getByPlaceholder("Ex : Le dossier est globalement solide.",{exact:false}).fill("Confirmed by synthetic reviewer");
  await reviewer.getByPlaceholder("Ajouter un commentaire pour la PME…").fill("Revision-specific comment");
  const noteSaved=reviewer.waitForResponse(r=>r.url().endsWith(`/dossiers/${dossier.id}/notes`)&&r.request().method()==="POST");
  await reviewer.getByRole("button",{name:"Envoyer le commentaire"}).click();
  expect((await noteSaved).status()).toBe(204);
  await expect(reviewer.locator("p").filter({hasText:"Revision-specific comment"})).toBeVisible();
  await reviewer.getByRole("button",{name:"Valider le dossier",exact:true}).click();
  await expect(reviewer.getByRole("button",{name:"Valider le dossier",exact:true})).toBeDisabled();
 } finally {await context.close();}
 await page.goto("/app/report");
 await expect(page.getByRole("heading",{name:"Historique des soumissions"})).toBeVisible();
 await expect(page.getByText("original frozen proof",{exact:true})).toBeVisible();
 await expect(page.getByText("Revision-specific comment",{exact:true})).toBeVisible();
 const next=await submit(request,owner.session);expect(next.id).not.toBe(dossier.id);
 await page.reload();await page.getByLabel("Dossier soumis").selectOption(dossier.id);
 await expect(page.getByText("original frozen proof",{exact:true})).toBeVisible();
 await expect(page.getByText("Revision-specific comment",{exact:true})).toBeVisible();
});

test("resubmission preserves history and rejects stale decisions and notes",async({page,request})=>{
 const owner=await company(request);const staff=await login(request,"reviewer@e2e.example");
 await upload(request,owner.session);const first=await submit(request,owner.session);
 expect((await request.post(`${api}/dossiers/${first.id}/notes`,{headers:headers(staff),data:{text:"Old revision comment",revisionId:first.currentRevisionId}})).ok()).toBeTruthy();
 expect((await request.put(`${api}/dossiers/${first.id}`,{headers:headers(staff),data:{status:"Rejected",recommendations:"Old decision",revisionId:first.currentRevisionId}})).ok()).toBeTruthy();
 await answers(request,owner.session,"0","new answer");await upload(request,owner.session,"new proof");
 const second=await submit(request,owner.session);expect(second.id).toBe(first.id);expect(second.revisionNumber).toBe(2);
 expect((await request.put(`${api}/dossiers/${first.id}`,{headers:headers(staff),data:{status:"Validated",finalScore:80,revisionId:first.currentRevisionId}})).status()).toBe(409);
 expect((await request.post(`${api}/dossiers/${first.id}/notes`,{headers:headers(staff),data:{text:"stale",revisionId:first.currentRevisionId}})).status()).toBe(409);
 await browserLogin(page,"reviewer@e2e.example",true);await page.goto(`/reviewer/dossiers/${first.id}`);
 await page.getByLabel("Revision du dossier").selectOption(first.currentRevisionId);
 await expect(page.getByText("Old revision comment",{exact:true})).toBeVisible();
 await expect(page.getByRole("button",{name:"Valider le dossier",exact:true})).toBeDisabled();
 await expect(page.getByText("new proof",{exact:true})).toHaveCount(0);
 const history=await (await request.get(`${api}/dossiers/${first.id}/revisions`,{headers:headers(owner.session)})).json();
 expect(history[1].recommendations).toBe("Old decision");expect(JSON.parse(history[1].snapshotJson).E1.note).toBe("original answer");
});

test("another company cannot read revision history or download submitted attachments",async({request,page})=>{
 const owner=await company(request);const other=await company(request);
 await upload(request,owner.session);const dossier=await submit(request,owner.session);
 const docs=await (await request.get(`${api}/dossiers/${dossier.id}/documents`,{headers:headers(owner.session)})).json();
 for(const path of [`/dossiers/${dossier.id}/revisions`,`/dossiers/${dossier.id}/revisions/${dossier.currentRevisionId}`,`/dossiers/${dossier.id}/documents`,`/dossiers/${dossier.id}/revisions/${dossier.currentRevisionId}/documents/${docs[0].id}`]) {
  expect((await request.get(api+path,{headers:headers(other.session)})).status()).toBe(403);
 }
 await browserLogin(page,owner.email);await page.goto("/app/report");
 await expect(page.getByText("original frozen proof",{exact:true})).toBeVisible();
 await page.getByRole("button",{name:"Déconnexion",exact:true}).click();
 await browserLogin(page,other.email);await page.goto("/app/report");
 await expect(page.getByText("original frozen proof",{exact:true})).toHaveCount(0);
 await page.goto(`/reviewer/dossiers/${dossier.id}`);
 await expect(page).not.toHaveURL(/\/reviewer\/dossiers/);
});

test("legacy warning disappears after first frozen resubmission; administrator can inspect history",async({page,request})=>{
 const owner=await login(request,"legacy@e2e.example");
 await browserLogin(page,"legacy@e2e.example");await page.goto("/app/report");
 await expect(page.getByText("Original submitted documents were not preserved.",{exact:true})).toBeVisible();
 const dossier=await submit(request,owner);expect(dossier.revisionNumber).toBe(1);
 await page.reload();await expect(page.getByLabel("Revision du dossier")).toBeVisible();
 await expect(page.getByText("Original submitted documents were not preserved.",{exact:true})).toHaveCount(0);
 await page.evaluate(()=>localStorage.clear());await browserLogin(page,"admin@e2e.example",true);
 await page.goto(`/reviewer/dossiers/${dossier.id}`);await expect(page.getByLabel("Revision du dossier")).toBeVisible();
});
