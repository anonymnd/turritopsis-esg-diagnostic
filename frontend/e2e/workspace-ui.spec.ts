import { test, expect, type Page } from "@playwright/test";

const api = "http://127.0.0.1:5017/api/v1";
const password = "Fixture-Test-42!";
async function login(page: Page, role: "admin" | "reviewer") {
  await page.goto("/review/login");
  await page.getByLabel("Identifiant").fill(`${role}@e2e.example`);
  await page.getByLabel("Mot de passe", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Se connecter", exact: true }).click();
  await expect(page).toHaveURL(role === "admin" ? /\/reviewer\/admin$/ : /\/reviewer$/);
}

test("reviewer cards support keyboard, filters, error recovery and mobile navigation", async ({ page, request }) => {
  const name = `Synthetic UI Company ${Date.now()}`;
  const registered = await request.post(`${api}/auth/register`, { data: { email: `ui-${Date.now()}@e2e.example`, password, companyName: name, sector: "Services", city: "Rabat" } });
  expect(registered.ok()).toBeTruthy();
  const session = await registered.json();
  const headers = { Authorization: `Bearer ${session.accessToken}` };
  expect((await request.put(`${api}/companies`, { headers, data: { ice: "SYNTHETIC", employeeRange: "10-49", phone: "fixture-phone", activityDescription: "Synthetic UI activity" } })).ok()).toBeTruthy();
  expect((await request.put(`${api}/snapshots`, { headers, data: { dataJson: JSON.stringify({ E1: { score: "1" } }) } })).ok()).toBeTruthy();
  const submitted = await request.post(`${api}/dossiers`, { headers, data: { declaredScore: 50, reviewedScore: 50 } });
  expect(submitted.ok()).toBeTruthy();
  const dossier = await submitted.json();
  await login(page, "reviewer");
  await page.getByLabel("Rechercher une entreprise", { exact: true }).fill(name);
  const link = page.getByRole("link", { name: `Examiner le dossier de ${name}`, exact: true });
  await expect(link).toBeVisible();
  await page.getByLabel("Statut du dossier", { exact: true }).selectOption("Validated");
  await expect(link).toHaveCount(0);
  await expect(page.getByText("Aucun resultat pour ce filtre.")).toBeVisible();
  await page.getByLabel("Statut du dossier", { exact: true }).selectOption("Submitted");
  await link.focus(); await page.keyboard.press("Enter");
  await expect(page).toHaveURL(new RegExp(`/reviewer/dossiers/${dossier.id}$`));
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  await expect(page.getByLabel("Revision du dossier")).toBeVisible();
  await expect(page.getByRole("spinbutton", { name: "Score final / 100" })).toBeVisible();
  await page.setViewportSize({ width: 375, height: 812 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: test.info().outputPath("review-detail-mobile.png"), fullPage: true });
  const menu = page.getByRole("button", { name: "Ouvrir le menu", exact: true });
  await menu.click();
  await expect(page.getByRole("navigation", { name: "Navigation de revue" })).toBeVisible();
  await page.getByRole("link", { name: "File d'attente", exact: true }).first().focus();
  await page.keyboard.press("Escape");
  await expect(menu).toBeFocused();
  await menu.click();
  await page.getByRole("link", { name: "Tous les dossiers", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Tous les dossiers", exact: true })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Navigation de revue" })).toBeHidden();
  await page.route("**/api/v1/dossiers?all=true", route => route.fulfill({ status: 503, body: "unavailable" }));
  await page.reload();
  // Wait for the application query retries before checking its final error state.
  await expect(page.getByRole("alert")).toContainText("Impossible de charger les dossiers.", { timeout: 15000 });
  await page.unroute("**/api/v1/dossiers?all=true");
  await page.getByRole("button", { name: "Réessayer", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("admin navigation, account creation and responsive cards retain permissions", async ({ page, request }) => {
  await login(page, "admin");
  await expect(page.getByRole("heading", { name: "Vue d'ensemble", exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "Indicateurs de la plateforme" })).toBeVisible();
  await page.screenshot({ path: test.info().outputPath("admin-desktop.png"), fullPage: true });
  await page.getByRole("link", { name: "Reviseurs", exact: true }).click();
  const email = `ui-reviewer-${Date.now()}@e2e.example`;
  await page.locator("#reviewerEmail").fill(email);
  await page.locator("#reviewerPassword").fill(password);
  const response = page.waitForResponse(r => r.url() === `${api}/admin/reviewers` && r.request().method() === "POST");
  await page.getByRole("button", { name: /Creer le reviseur|Créer le réviseur/ }).click();
  expect((await response).status()).toBe(200);
  await expect(page.getByText(email, { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Entreprises", exact: true }).first().click();
  await expect(page.getByRole("heading", { name: "Entreprises", exact: true })).toBeVisible();
  await page.setViewportSize({ width: 375, height: 812 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: test.info().outputPath("admin-mobile.png"), fullPage: true });
  await page.getByRole("button", { name: "Ouvrir le menu", exact: true }).click();
  await expect(page.getByRole("navigation", { name: "Navigation administration" })).toBeVisible();
  const reviewerLogin = await request.post(`${api}/auth/login`, { data: { email: "reviewer@e2e.example", password } });
  const reviewer = await reviewerLogin.json();
  expect((await request.get(`${api}/admin/overview`, { headers: { Authorization: `Bearer ${reviewer.accessToken}` } })).status()).toBe(403);
});
