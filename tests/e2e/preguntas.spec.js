// Ventanas tras un tiro: asistencia (canasta de 2 o 3) y rebote (tiro fallado, también TL)
import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

test.beforeEach(async ({ page }) => {
  await page.route(/^https?:\/\/(?!localhost)/, r => r.abort());
  await page.goto("/");
  await page.waitForSelector("#app main");
});
const marcador = async page => Number(await page.locator(".team .pts").first().textContent());
const acciones = page => page.locator(".log li");
const enPista = page => page.locator(".tok:not(.empty)");
const dorsales = loc => loc.locator(".num").allTextContents();
// Total de una columna (AS, RO…) en la fila "Equipo" de la ficha del partido
async function totalEquipo(page, col) {
  await page.click('[data-do="sub:ficha"]');
  const t = page.locator(".tbl-wrap table").nth(1);
  const i = (await t.locator("thead th").allTextContents()).indexOf(col);
  const v = Number(await t.locator("tfoot tr").first().locator("th, td").nth(i).textContent());
  await page.click('[data-do="sub:anotar"]');
  return v;
}

test("canasta: pregunta la asistencia con los otros 4 de pista y la guarda", async ({ page }) => {
  const tirador = (await enPista(page).first().locator(".num").textContent()).trim();
  const companeros = (await dorsales(enPista(page))).filter(d => d !== tirador);
  const asAntes = await totalEquipo(page, "AS"), antes = await marcador(page);
  await enPista(page).first().click(); await page.click('[data-do="act:3A"]');
  await expect(page.locator(".ask h3")).toHaveText("¿Quién da la asistencia?");
  expect(await dorsales(page.locator(".askp"))).toEqual(companeros);
  await expect(page.locator(".ask")).not.toContainText("Rebote del rival");
  await page.locator(".askp .pbtn").nth(1).click();
  await expect(page.locator(".ask")).toHaveCount(0);
  await expect(page.locator("#toast")).toContainText("Triple anotado · asistencia de #" + companeros[1]);
  await expect(acciones(page).first()).toContainText("#" + companeros[1]);
  await expect(acciones(page).first()).toContainText("Asistencia");
  expect(await marcador(page)).toBe(antes + 3);
  expect(await totalEquipo(page, "AS")).toBe(asAntes + 1);
  // Deshacer (en el aviso) quita el tiro y su asistencia
  await page.click('#toast [data-do^="undo-ev:"]');
  expect(await marcador(page)).toBe(antes);
  expect(await totalEquipo(page, "AS")).toBe(asAntes);
});

test("tiro fallado: pregunta el rebote con los 5 de pista, el rival o ninguno", async ({ page }) => {
  const cinco = await dorsales(enPista(page));
  const roAntes = await totalEquipo(page, "RO");
  // rebote ofensivo propio
  await enPista(page).first().click(); await page.click('[data-do="act:2F"]');
  await expect(page.locator(".ask h3")).toHaveText("¿Quién coge el rebote?");
  expect(await dorsales(page.locator(".askp"))).toEqual(cinco);
  await page.locator(".askp .pbtn").nth(4).click();
  await expect(acciones(page).first()).toContainText("Rebote ofensivo");
  expect(await totalEquipo(page, "RO")).toBe(roAntes + 1);
  // rebote del rival
  await enPista(page).first().click(); await page.click('[data-do="act:3F"]');
  await page.click('.ask [data-do="ask-pick:rival"]');
  await expect(acciones(page).first()).toContainText("rebote defensivo");
  await expect(page.locator("#toast")).toContainText("Triple fallado · rebote del rival");
  expect(await totalEquipo(page, "RO")).toBe(roAntes + 1);
  // tiro libre fallado: también pregunta; «Sin rebote» no añade nada
  const n = await acciones(page).count();
  const primera = await acciones(page).first().textContent();
  await enPista(page).first().click(); await page.click('[data-do="act:1F"]');
  await page.click('.ask [data-do="ask-none"]');
  await expect(acciones(page).first()).toContainText("Tiro libre fallado");
  expect(await acciones(page).count()).toBe(Math.min(10, n + 1));
  expect(await acciones(page).nth(1).textContent()).toBe(primera);
});

test("tocar fuera de la ventana es «Sin…»; tocar dentro no la cierra", async ({ page }) => {
  await enPista(page).first().click(); await page.click('[data-do="act:2A"]');
  await page.locator(".ask h3").click(); // dentro, pero no en un botón
  await expect(page.locator(".ask")).toHaveCount(1);
  await page.mouse.click(5, 5); // fuera
  await expect(page.locator(".ask")).toHaveCount(0);
  await expect(acciones(page).first()).toContainText("Tiro de 2 anotado");
});

test("«Deshacer última» quita el tiro con su asistencia; la × de la asistencia quita solo la asistencia", async ({ page }) => {
  const antes = await marcador(page), asAntes = await totalEquipo(page, "AS");
  await enPista(page).first().click(); await page.click('[data-do="act:2A"]');
  await page.locator(".askp .pbtn").first().click();
  await page.click('[data-do="undo"]');
  expect(await marcador(page)).toBe(antes);
  expect(await totalEquipo(page, "AS")).toBe(asAntes);
  await enPista(page).first().click(); await page.click('[data-do="act:2A"]');
  await page.locator(".askp .pbtn").first().click();
  await acciones(page).first().locator('[data-do^="delev:"]').click(); // la asistencia
  expect(await marcador(page)).toBe(antes + 2);
  expect(await totalEquipo(page, "AS")).toBe(asAntes);
});

test("las preguntas se pueden desactivar y el ajuste se recuerda", async ({ page }) => {
  await page.click('.tabbar [data-do="tab:jugadores"]');
  await expect(page.locator("#pref-ast")).toBeChecked();
  await page.uncheck("#pref-ast");
  await page.waitForTimeout(500);
  await page.reload(); await page.waitForSelector("#app main");
  await expect(page.locator("#pref-ast")).not.toBeChecked();
  await expect(page.locator("#pref-reb")).toBeChecked();
  await page.click('.tabbar [data-do="tab:partido"]');
  await enPista(page).first().click(); await page.click('[data-do="act:3A"]');
  await expect(page.locator(".ask")).toHaveCount(0);
  await enPista(page).first().click(); await page.click('[data-do="act:3F"]');
  await expect(page.locator(".ask")).toHaveCount(1);
  // la copia de seguridad no lleva los ajustes
  await page.click('.ask [data-do="ask-none"]');
  await page.click('.tabbar [data-do="tab:jugadores"]');
  const [d] = await Promise.all([page.waitForEvent("download"), page.click('[data-do="export"]')]);
  const copia = JSON.parse(readFileSync(await d.path(), "utf-8"));
  expect(copia.prefs).toBeUndefined();
});

test("estadística nueva: rebotes ofensivos cogidos", async ({ page }) => {
  for (const r of ["0", "rival", "rival", "rival"]) {
    await enPista(page).first().click(); await page.click('[data-do="act:2F"]');
    await page.click(r === "rival" ? '.ask [data-do="ask-pick:rival"]' : ".askp .pbtn >> nth=" + r);
  }
  // rebotes ofensivos del partido (los de ejemplo + el anotado) frente a los 3 del rival
  const ro = await totalEquipo(page, "RO");
  await page.click('[data-do="finish"]'); await page.click('[data-do="modal-ok"]');
  await page.locator('[data-do="edit-cancel"]').first().click();
  await page.click('.tabbar [data-do="tab:estadisticas"]');
  const fila = page.locator(".kv", { hasText: "Rebotes ofensivos cogidos" });
  // solo cuenta el partido con rebotes del rival anotados (los otros 6 de ejemplo no tienen)
  await expect(fila.locator("b")).toHaveText(Math.round(100 * ro / (ro + 3)) + "%");
});
