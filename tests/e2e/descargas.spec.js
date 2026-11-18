// Exportar PDF, CSV y copia: los archivos son idénticos a los del prototipo,
// se descargan directamente (sin la ventana que el prototipo necesitaba dentro del chat)
// y se pueden compartir con el menú de Android.
import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const PROTO = pathToFileURL(resolve("prototipo.html")).href;
const COPIA = resolve("tests/e2e/copia-prueba.json");

async function preparar(page, url) {
  await page.route(/^https?:\/\/(?!localhost)/, r => r.abort());
  await page.clock.install({ time: new Date("2026-11-15T10:00:00") }); // misma fecha en los dos ("Generado el…")
  await page.goto(url);
  await page.waitForSelector("#app main");
  await page.click('.tabbar [data-do="tab:jugadores"]');
  await page.setInputFiles("#imp", COPIA);
  await page.click('[data-do="modal-ok"]');
}
async function descargar(page, selector) {
  const [d] = await Promise.all([page.waitForEvent("download"), page.click(selector)]);
  return { nombre: d.suggestedFilename(), datos: readFileSync(await d.path()) };
}
async function abrirPartido(page) {
  await page.click('.tabbar [data-do="tab:historial"]');
  await page.locator(".grow").nth(2).click();
}

test("PDF, CSV y copia salen iguales que en el prototipo", async ({ browser }) => {
  const proto = await (await browser.newContext()).newPage();
  const app = await (await browser.newContext()).newPage();
  await preparar(proto, PROTO);
  await preparar(app, "/");
  for (const p of [proto, app]) await abrirPartido(p);
  // CSV: igual que el del prototipo quitando la columna FR (faltas recibidas, añadida a propósito)
  const ca1 = await descargar(proto, '[data-do^="csv:"]');
  await proto.keyboard.press("Escape"); // cierra la ventana del prototipo
  const cb1 = await descargar(app, '[data-do^="csv:"]');
  expect(cb1.nombre).toBe(ca1.nombre);
  const filas = cb1.datos.toString("utf-8").split("\n").map(l => l.split(";"));
  const colFR = filas[0].indexOf("FR");
  expect(colFR).toBeGreaterThan(0);
  expect(filas.map(f => f.filter((_, i) => i !== colFR).join(";")).join("\n")).toBe(ca1.datos.toString("utf-8"));
  // PDF: están todos los textos y números del prototipo (salvo la leyenda, que ahora explica FR) y además FR
  const pa = await descargar(proto, '[data-do^="pdf:"]');
  await proto.keyboard.press("Escape");
  const pb = await descargar(app, '[data-do^="pdf:"]');
  expect(pb.nombre).toBe(pa.nombre);
  const textos = b => [...b.toString("latin1").matchAll(/\((.*?)\) Tj/g)].map(m => m[1]);
  const ta = textos(pa.datos).filter(t => !t.startsWith("MIN minutos")), tb = textos(pb.datos);
  const quedan = [...tb];
  for (const t of ta) { const i = quedan.indexOf(t); expect(i, "en el PDF: " + t).toBeGreaterThanOrEqual(0); quedan.splice(i, 1); }
  expect(tb).toContain("FR");
  expect(tb.find(t => t.startsWith("MIN minutos"))).toContain("FR faltas recibidas");
  const pdf = await descargar(app, '[data-do^="pdf:"]');
  expect(pdf.datos.subarray(0, 8).toString("latin1")).toBe("%PDF-1.4");
  // La copia de seguridad: mismo contenido salvo la versión del formato de datos
  for (const p of [proto, app]) await p.click('.tabbar [data-do="tab:jugadores"]');
  const ca = JSON.parse((await descargar(proto, '[data-do="export"]')).datos);
  const cb = await descargar(app, '[data-do="export"]');
  expect(cb.nombre).toBe("baloncesto-copia-2026-11-15.json");
  const datos = JSON.parse(cb.datos);
  expect(datos.v).toBe(3);
  expect({ ...datos, v: 0 }).toEqual({ ...ca, v: 0, games: ca.games.map(g => ({ min: {}, ...g })) });
});

test("tras descargar: aviso con Compartir, sin ventana, y Compartir abre el menú de Android", async ({ page }) => {
  await page.addInitScript(() => {
    window.__compartido = null;
    navigator.canShare = d => !!(d && d.files && d.files.length);
    navigator.share = d => { window.__compartido = { nombre: d.files[0].name, tipo: d.files[0].type, tam: d.files[0].size }; return Promise.resolve(); };
  });
  await preparar(page, "/");
  await abrirPartido(page);
  const d = await descargar(page, '[data-do^="pdf:"]');
  await expect(page.locator(".modal")).toHaveCount(0);
  await expect(page.locator("#toast")).toContainText("Descargado: " + d.nombre);
  await page.click('#toast [data-do="share-file"]');
  expect(await page.evaluate(() => window.__compartido)).toEqual({ nombre: d.nombre, tipo: "application/pdf", tam: d.datos.length });
});

test("si el sistema no permite compartir ese archivo, no sale el botón", async ({ page }) => {
  await page.addInitScript(() => { navigator.canShare = () => false; });
  await preparar(page, "/");
  await descargar(page, '[data-do="export"]');
  await expect(page.locator("#toast")).toContainText("Descargado: baloncesto-copia-");
  await expect(page.locator('#toast [data-do="share-file"]')).toHaveCount(0);
});
