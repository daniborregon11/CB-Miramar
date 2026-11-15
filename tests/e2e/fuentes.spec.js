// Las fuentes van dentro de la app: se ven bien sin internet y no se pide nada a webs de fuera
import { test, expect } from "@playwright/test";

const VARIANTES = [
  '500 20px "Barlow Condensed"', '600 20px "Barlow Condensed"', '700 20px "Barlow Condensed"',
  '400 16px "IBM Plex Sans"', '500 16px "IBM Plex Sans"', '600 16px "IBM Plex Sans"',
];

test("sin internet, las fuentes cargan y no se pide nada fuera", async ({ page }) => {
  const externas = [];
  await page.route(/^https?:\/\/(?!localhost)/, r => { externas.push(r.request().url()); r.abort(); });
  await page.goto("/");
  await page.waitForSelector("#app main");
  for (const v of VARIANTES) {
    const caras = await page.evaluate(async v => (await document.fonts.load(v, "Ñandú ¿Qué? 123")).map(f => f.status), v);
    expect(caras, v).toEqual(["loaded"]);
  }
  // El marcador usa de verdad Barlow Condensed
  const fuente = await page.locator(".team .pts").first().evaluate(el => getComputedStyle(el).fontFamily);
  expect(fuente).toContain("Barlow Condensed");
  await page.click('.tabbar [data-do="tab:estadisticas"]');
  await page.click('.tabbar [data-do="tab:historial"]');
  expect(externas).toEqual([]);
});
