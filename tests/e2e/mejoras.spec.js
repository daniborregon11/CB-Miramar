// Mejoras pedidas tras la versión PWA: faltas recibidas y máximo de 12 convocados
import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route(/^https?:\/\/(?!localhost)/, r => r.abort());
  await page.goto("/");
  await page.waitForSelector("#app main");
});
const n = async (loc) => Number((await loc.textContent()).trim());

test("falta recibida: se anota, no cuenta para las 5 faltas y sale en la ficha, el acta y la temporada", async ({ page }) => {
  const ficha = page.locator(".tok:not(.empty)").first();
  const faltasAntes = Number((await ficha.locator(".fl").textContent()).replace(/\D/g, ""));
  const marcadorAntes = await n(page.locator(".team .pts").first());
  await ficha.click();
  await page.click('[data-do="act:FR"]');
  await expect(page.locator("#toast")).toContainText("Falta recibida");
  await expect(page.locator(".log li").first()).toContainText("Falta recibida");
  // No cambia las faltas cometidas ni el marcador
  expect(Number((await ficha.locator(".fl").textContent()).replace(/\D/g, ""))).toBe(faltasAntes);
  expect(await n(page.locator(".team .pts").first())).toBe(marcadorAntes);
  // Columna FR en la ficha del partido
  await page.click('[data-do="sub:ficha"]');
  const cabecera = await page.locator(".tbl-wrap table").nth(1).locator("thead th").allTextContents();
  expect(cabecera).toContain("FR");
  const col = cabecera.indexOf("FR");
  const totalFR = await n(page.locator(".tbl-wrap table").nth(1).locator("tfoot tr").first().locator("th, td").nth(col));
  expect(totalFR).toBe(1);
  // Deshacer la quita
  await page.click('[data-do="sub:anotar"]');
  await page.click('[data-do="undo"]');
  await page.click('[data-do="sub:ficha"]');
  expect(await n(page.locator(".tbl-wrap table").nth(1).locator("tfoot tr").first().locator("th, td").nth(col))).toBe(0);
  // En el acta se puede corregir y en la temporada aparece
  await page.click('[data-do="sub:anotar"]');
  await page.click('[data-do="finish"]'); await page.click('[data-do="modal-ok"]');
  await expect(page.locator(".edt thead")).toContainText("F. recib.");
  await page.locator('.edt input[data-ed$=":fr"]').first().fill("3");
  await page.locator('#f-edit button[type="submit"]').last().click();
  await page.click('.tabbar [data-do="tab:estadisticas"]');
  await expect(page.locator("main")).toContainText("Faltas recibidas");
  await page.click('[data-do="stats:jugadores"]');
  await page.click('[data-do="season:tot"]');
  await expect(page.locator("main thead")).toContainText("FR");
});

test("valoración: cada falta recibida suma +1", async ({ page }) => {
  await page.click('[data-do="sub:ficha"]');
  const tabla = page.locator(".tbl-wrap table").nth(1);
  const cab = await tabla.locator("thead th").allTextContents();
  const fila = tabla.locator("tbody tr").first();
  const val = async () => n(fila.locator("th, td").nth(cab.indexOf("VAL")));
  const dorsal = (await fila.locator(".dn").textContent()).trim();
  const antes = await val();
  await page.click('[data-do="sub:anotar"]');
  // el jugador de la primera fila (menor dorsal) puede estar en pista o en el banquillo: lo pongo en pista si hace falta
  const enPista = page.locator(".tok:not(.empty)").filter({ has: page.locator(".num", { hasText: new RegExp("^" + dorsal + "$") }) });
  if (!(await enPista.count())) {
    await page.locator(".bbtn").filter({ has: page.locator(".num", { hasText: new RegExp("^" + dorsal + "$") }) }).click();
    await page.locator(".tok:not(.empty)").first().click();
  }
  await enPista.click(); await page.click('[data-do="act:FR"]');
  await enPista.click(); await page.click('[data-do="act:FR"]');
  await page.click('[data-do="sub:ficha"]');
  expect(await val()).toBe(antes + 2);
  await expect(page.locator("main")).toContainText("+ faltas recibidas");
});

async function plantillaDe(page, total) {
  // los datos de ejemplo traen 10; se añaden hasta llegar a "total"
  await page.click('.tabbar [data-do="tab:jugadores"]');
  for (let i = 0; i < total - 10; i++) {
    await page.fill("#p-num", String(60 + i)); await page.fill("#p-name", "Extra " + (i + 1)); await page.click('#f-player button[type="submit"]');
  }
  // termina el partido de ejemplo en juego para poder empezar otro
  await page.click('.tabbar [data-do="tab:partido"]');
  await page.click('[data-do="finish"]'); await page.click('[data-do="modal-ok"]');
  await page.locator('[data-do="edit-cancel"]').first().click();
  await page.click('.tabbar [data-do="tab:partido"]');
}
const casillas = page => page.locator('#f-game .checks input[type="checkbox"]');

test("con 12 o menos en la plantilla salen todos marcados y no hay opción de amistoso", async ({ page }) => {
  await plantillaDe(page, 12);
  await expect(casillas(page)).toHaveCount(12);
  for (const c of await casillas(page).all()) await expect(c).toBeChecked();
  await expect(page.locator("#g-count")).toHaveText("12/12");
  await expect(page.locator("#g-friendly")).toHaveCount(0);
});

test("con más de 12: salen desmarcados, no deja pasar de 12 y el amistoso quita el límite", async ({ page }) => {
  await plantillaDe(page, 14);
  await expect(casillas(page)).toHaveCount(14);
  for (const c of await casillas(page).all()) await expect(c).not.toBeChecked();
  await expect(page.locator("#g-count")).toHaveText("0/12");
  for (let i = 0; i < 12; i++) await casillas(page).nth(i).check();
  await expect(page.locator("#g-count")).toHaveText("12/12");
  // el 13.º y el 14.º quedan bloqueados
  await expect(casillas(page).nth(12)).toBeDisabled();
  await expect(casillas(page).nth(13)).toBeDisabled();
  // al quitar uno, se puede marcar otro
  await casillas(page).nth(0).uncheck();
  await expect(casillas(page).nth(12)).toBeEnabled();
  await casillas(page).nth(0).check();
  // amistoso: sin límite
  await page.check("#g-friendly");
  await expect(page.locator("#g-count")).toHaveText("12");
  await casillas(page).nth(12).check(); await casillas(page).nth(13).check();
  await expect(page.locator("#g-count")).toHaveText("14");
  // si se quita "amistoso" con 14 marcados, no deja empezar
  await page.uncheck("#g-friendly");
  await page.click('#f-game button[type="submit"]');
  await expect(page.locator("#g-err")).toContainText("Como máximo puedes convocar a 12 jugadores");
  // con amistoso, empieza el partido con los 14
  await page.check("#g-friendly");
  await page.fill("#g-rival", "CB Amigos");
  await page.click('#f-game button[type="submit"]');
  await expect(page.locator(".bbtn")).toHaveCount(14);
});

test("en el acta de un partido oficial no deja añadir un 13.º jugador", async ({ page }) => {
  await plantillaDe(page, 14);
  for (let i = 0; i < 12; i++) await casillas(page).nth(i).check();
  await page.fill("#g-rival", "CB Liga");
  await page.click('#f-game button[type="submit"]');
  await page.click('[data-do="finish"]'); await page.click('[data-do="modal-ok"]');
  await expect(page.locator("#ed-add")).toHaveCount(0);
  await expect(page.locator("main")).toContainText("Ya hay 12 convocados");
});

test("minutos con segundos: se escriben en el acta (22:32, 18.05) y se ven como mm:ss en todas partes", async ({ page }) => {
  await page.click('[data-do="finish"]'); await page.click('[data-do="modal-ok"]');
  const min = page.locator(".edt td.minc input");
  await expect(min.first()).toHaveAttribute("placeholder", "mm:ss");
  // segundos con una cifra: error
  await min.nth(0).fill("22.5");
  await page.locator('#f-edit button[type="submit"]').last().click();
  await expect(page.locator("#ed-err")).toContainText("escribe minutos y segundos, por ejemplo 22:32");
  // se escriben solo números: los dos puntos se ponen solos
  await min.nth(0).fill("");
  await min.nth(0).pressSequentially("22");
  await expect(min.nth(0)).toHaveValue("22:");
  await min.nth(0).pressSequentially("32");
  await expect(min.nth(0)).toHaveValue("22:32");
  await min.nth(0).press("Backspace");
  await expect(min.nth(0)).toHaveValue("22:3");
  await min.nth(0).press("2");
  await expect(min.nth(0)).toHaveValue("22:32");
  await expect(min.nth(0)).toHaveAttribute("inputmode", "numeric");
  await min.nth(1).pressSequentially("1805");
  await expect(min.nth(1)).toHaveValue("18:05");
  await min.nth(2).pressSequentially("0507");
  await min.nth(3).click(); // al salir de la casilla, 05:07 se muestra como 5:07
  await expect(min.nth(2)).toHaveValue("5:07");
  await min.nth(2).fill("");
  await page.locator('#f-edit button[type="submit"]').last().click();
  await expect(page.locator("#f-edit")).toHaveCount(0); // guardado: vuelve a la ficha
  // ficha del partido
  const tabla = page.locator(".tbl-wrap table").nth(1);
  const col = (await tabla.locator("thead th").allTextContents()).indexOf("MIN");
  const celda = (fila) => fila.locator("th, td").nth(col);
  expect(await celda(tabla.locator("tbody tr").nth(0)).textContent()).toBe("22:32");
  expect(await celda(tabla.locator("tbody tr").nth(1)).textContent()).toBe("18:05");
  expect(await celda(tabla.locator("tfoot tr").first()).textContent()).toBe("40:37");
  // al volver a abrir el acta se ven igual
  await page.click('[data-do^="edit-game:"]');
  await expect(min.nth(0)).toHaveValue("22:32");
  await expect(min.nth(1)).toHaveValue("18:05");
  await page.locator('[data-do="edit-cancel"]').first().click();
  // temporada y análisis del jugador
  await page.click('.tabbar [data-do="tab:estadisticas"]');
  await page.click('[data-do="stats:jugadores"]');
  await page.click('[data-do="season:tot"]');
  const temp = page.locator("main table").first();
  const cMin = (await temp.locator("thead th").allTextContents()).indexOf("MIN");
  const fila = temp.locator("tbody tr").filter({ has: page.locator("td", { hasText: "22:32" }) });
  await expect(fila).toHaveCount(1);
  expect(await fila.locator("th, td").nth(cMin).textContent()).toBe("22:32");
  await fila.locator('[data-do^="player:"]').click();
  await expect(page.locator(".tile", { hasText: "Minutos por partido" }).locator("b")).toHaveText("22:32");
  await expect(page.locator("main table").last().locator("tbody tr").first()).toContainText("22:32");
});
