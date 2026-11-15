// Guardado en IndexedDB y migración desde el prototipo
import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const PROTO_HTML = readFileSync(resolve("prototipo.html"), "utf-8");
const COPIA = resolve("tests/e2e/copia-prueba.json");
const sinInternet = page => page.route(/^https?:\/\/(?!localhost)/, r => r.abort());
const abrir = async (page, ruta = "/") => { await page.goto(ruta); await page.waitForSelector("#app main"); };
const marcador = page => page.locator(".team .pts").first().textContent();
// Espera a que IndexedDB termine de escribir (se guarda en segundo plano, en milisegundos)
const guardado = page => page.waitForTimeout(1000);

test("lo anotado sigue ahí al cerrar y volver a abrir la app", async ({ page }) => {
  await sinInternet(page);
  await abrir(page);
  const antes = Number(await marcador(page));
  await page.click(".tok:not(.empty)");
  await page.click('[data-do="act:3A"]');
  await page.click('.opp-wide [data-do="opp:2"]');
  await guardado(page);
  await page.reload(); await page.waitForSelector("#app main");
  expect(Number(await marcador(page))).toBe(antes + 3);
  await expect(page.locator(".log li").first()).toContainText("+2");
  await expect(page.locator(".log li").nth(1)).toContainText("Triple anotado");
  // Los datos van a IndexedDB, no al almacenamiento antiguo (localStorage)
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
});

test("migración: lo que se hizo con el prototipo aparece en la app", async ({ page }) => {
  await sinInternet(page);
  // El prototipo, servido en la misma dirección web que la app (comparten el almacenamiento antiguo)
  await page.route("**/prototipo-servido.html", r => r.fulfill({ body: PROTO_HTML, contentType: "text/html" }));
  await page.goto("/prototipo-servido.html");
  await page.click('[data-do="clear-sample"]'); await page.click('[data-do="modal-ok"]');
  for (const [num, nombre] of [[4, "Ana López"], [7, "Bea Gil"], [9, "Carla Ruiz"], [11, "Dora Sanz"], [13, "Eva Mora"], [15, "Fani Díaz"]]) {
    await page.fill("#p-num", String(num)); await page.fill("#p-name", nombre); await page.click('#f-player button[type="submit"]');
  }
  await page.fill("#t-name", "CB Miramar"); await page.click('#f-team button[type="submit"]');
  await page.click('.tabbar [data-do="tab:partido"]');
  await page.fill("#g-rival", "CB Rival"); await page.click('#f-game button[type="submit"]');
  for (let i = 0; i < 5; i++) await page.locator(".bbtn").first().click();
  for (const a of ["2A", "3A", "RD", "FC"]) { await page.locator(".tok:not(.empty)").nth(1).click(); await page.click(`[data-do="act:${a}"]`); }
  await page.click('.opp-wide [data-do="opp:3"]');
  await page.click('[data-do="finish"]'); await page.click('[data-do="modal-ok"]');
  await page.locator(".edt td.minc input").first().fill("32");
  await page.locator('#f-edit button[type="submit"]').last().click();
  const enPrototipo = await page.locator("#app").innerText();
  await page.click('.tabbar [data-do="tab:jugadores"]');
  const plantillaPrototipo = await page.locator("#app").innerText();

  // Ahora se abre la app por primera vez
  await abrir(page, "/#historial");
  await page.locator(".grow").first().click();
  expect(await page.locator("#app").innerText()).toBe(enPrototipo);
  await page.click('.tabbar [data-do="tab:jugadores"]');
  expect(await page.locator("#app").innerText()).toBe(plantillaPrototipo);

  // Ya está en IndexedDB: aunque desaparezca el almacenamiento antiguo, los datos siguen
  await guardado(page);
  await page.evaluate(() => localStorage.clear());
  await page.reload(); await page.waitForSelector("#app main");
  await expect(page.locator(".plist")).toContainText("Carla Ruiz");
  await expect(page.locator("header")).toContainText("CB Miramar");
});

test("una copia importada se conserva al volver a abrir", async ({ page }) => {
  await sinInternet(page);
  await abrir(page, "/#jugadores");
  await page.setInputFiles("#imp", COPIA);
  await page.click('[data-do="modal-ok"]');
  await guardado(page);
  await page.reload(); await page.waitForSelector("#app main");
  await expect(page.locator("header")).toContainText("CB Prueba");
  await page.click('.tabbar [data-do="tab:historial"]');
  await expect(page.locator(".grow")).toHaveCount(7);
});

test("si el navegador no deja guardar, se avisa y la app sigue funcionando", async ({ page }) => {
  await sinInternet(page);
  await page.addInitScript(() => { Object.defineProperty(window, "indexedDB", { get() { throw new Error("bloqueado"); } }); });
  await abrir(page);
  await expect(page.locator("main")).toContainText("Este navegador no está guardando los datos");
  const antes = Number(await marcador(page));
  await page.click(".tok:not(.empty)"); await page.click('[data-do="act:2A"]');
  expect(Number(await marcador(page))).toBe(antes + 2);
});
