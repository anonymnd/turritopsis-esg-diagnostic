import {test,expect,type APIRequestContext,type Page} from "@playwright/test";

// Browser level: what the company sees on /app/report before and after a human validation.
const api="http://127.0.0.1:5017/api/v1";
const password="Fixture-Test-42!";
type Session={accessToken:string;userId:string;companyId:string;roles:string[]};
const headers=(s:Session)=>({Authorization:`Bearer ${s.accessToken}`});

async function register(request:APIRequestContext) {
 const email=`company-${crypto.randomUUID()}@e2e.example`;
 const response=await request.post(`${api}/auth/register`,{data:{email,password,companyName:"Synthetic Report Company",sector:"Industry",city:"Rabat"}});
 expect(response.ok()).toBeTruthy();return {email,session:await response.json() as Session};
}
async function browserLogin(page:Page,email:string) {
 await page.goto("/auth?tab=login");
 await page.getByLabel("E-mail professionnel").fill(email);
 await page.getByLabel("Mot de passe",{exact:true}).fill(password);
 await page.getByRole("button",{name:"Se connecter",exact:true}).click();
 await expect(page).toHaveURL(/\/app/);
}

test("report shows an empty state, then pending status, then the validated score and recommendations",async({page,request})=>{
 const {email,session}=await register(request);
 const reviewerLogin=await request.post(`${api}/auth/login`,{data:{email:"reviewer@e2e.example",password}});
 expect(reviewerLogin.ok()).toBeTruthy();const reviewer:Session=await reviewerLogin.json();

 // No dossier yet.
 await browserLogin(page,email);await page.goto("/app/report");
 await expect(page.getByText("Aucun dossier soumis pour le moment.",{exact:false})).toBeVisible();
 await expect(page.getByText("Votre score ESG final.")).toHaveCount(0);

 // Submit through the API (the browser submission path is covered by revisions.spec.ts).
 expect((await request.put(`${api}/companies`,{headers:headers(session),data:{city:"Rabat",ice:"FIXTURE-ICE",employeeRange:"10-50",phone:"fixture-phone",activityDescription:"Synthetic activity"}})).ok()).toBeTruthy();
 expect((await request.put(`${api}/snapshots`,{headers:headers(session),data:{dataJson:JSON.stringify({E1:{score:"1",note:"declared"}})}})).ok()).toBeTruthy();
 expect((await request.post(`${api}/documents`,{headers:headers(session),data:{questionCode:"E1",textContent:"report screen proof",fileName:"proof.txt",fileBase64:Buffer.from("bytes").toString("base64")}})).ok()).toBeTruthy();
 const submitted=await request.post(`${api}/dossiers`,{headers:headers(session),data:{declaredScore:50,reviewedScore:50}});
 expect(submitted.ok()).toBeTruthy();const dossier=await submitted.json();

 // Pending: status shown, no final score, no print button.
 await page.reload();
 await expect(page.getByRole("heading",{name:"Soumis, en attente de revue"})).toBeVisible();
 await expect(page.getByText("Votre score ESG final.")).toHaveCount(0);
 await expect(page.getByRole("button",{name:/Télécharger le rapport/})).toHaveCount(0);

 // Human validation.
 const decision=await request.put(`${api}/dossiers/${dossier.id}`,{headers:headers(reviewer),data:{status:"Validated",finalScore:72,recommendations:"Formalise the environmental policy.",revisionId:dossier.currentRevisionId}});
 expect(decision.ok()).toBeTruthy();

 // Validated: score, badge, recommendations, pillar cards and the print action.
 await page.reload();
 await expect(page.getByRole("heading",{name:"Validé",exact:true})).toBeVisible();
 const score=page.getByRole("region",{name:"Votre score ESG final."});
 await expect(score).toContainText("72");await expect(score).toContainText("/100");
 await expect(score).toContainText("Validation humaine");
 await expect(page.getByText("Formalise the environmental policy.",{exact:true})).toBeVisible();
 for(const pillar of ["Environnement","Social","Gouvernance"]) await expect(page.getByRole("heading",{name:pillar,exact:true})).toBeVisible();
 await expect(page.getByRole("button",{name:/Télécharger le rapport/})).toBeVisible();
 await expect(page.getByText("report screen proof",{exact:true})).toBeVisible();
});
