// App instalable: ficha (manifest), iconos, funcionamiento sin conexión y aviso de versión nueva
import { test, expect } from "@playwright/test";
import { cpSync, mkdtempSync, appendFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { servir } from "./servidor.js";

test.use({ serviceWorkers: "allow" });

const sinInternet = ctx => ctx.route(/^https?:\/\/(?!localhost|127\.0\.0\.1)/, r => r.abort());
// Espera a que el service worker controle la página (ya tiene todo guardado para abrir sin conexión)
async function listaSinConexion(page, url = "/") {
  await page.goto(url);
  await page.waitForSelector("#app main");
  // Primera visita: se guarda todo y se avisa
  await expect(page.locator("#toast")).toContainText("La app ya funciona sin conexión");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await page.waitForSelector("#app main");
}

test("la ficha de la app es correcta y los iconos existen", async ({ page }) => {
  await page.goto("/");
  const href = await page.locator('link[rel="manifest"]').getAttribute("href");
  const m = await (await page.request.get(new URL(href, page.url()).href)).json();
  expect(m).toMatchObject({
    name: "CB Miramar · Estadísticas", short_name: "CB Miramar", lang: "es",
    display: "standalone", orientation: "landscape", start_url: "./", scope: "./",
    theme_color: "#17191E", background_color: "#17191E",
  });
  // Chrome pide al menos un icono de 192 y otro de 512; Android usa el "maskable" para recortarlo
  expect(m.icons.map(i => i.sizes + " " + i.purpose).sort()).toEqual(["192x192 any", "512x512 any", "512x512 maskable"]);
  for (const icono of m.icons) {
    const url = new URL(icono.src, page.url()).href;
    const tam = await page.evaluate(src => new Promise((ok, mal) => { const im = new Image(); im.onload = () => ok(im.naturalWidth + "x" + im.naturalHeight); im.onerror = mal; im.src = src; }), url);
    expect(tam, icono.src).toBe(icono.sizes);
  }
  expect(await page.title()).toBe("CB Miramar · Estadísticas");
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute("content", "#17191E");
});

test("sin conexión: abre, se ve bien, anota y guarda", async ({ page, context }) => {
  await sinInternet(context);
  await listaSinConexion(page);

  await context.setOffline(true);
  await page.reload();
  await page.waitForSelector("#app main");
  // las fuentes vienen del almacenamiento de la app, no de la red
  for (const v of ['700 20px "Barlow Condensed"', '400 16px "IBM Plex Sans"'])
    expect(await page.evaluate(async v => (await document.fonts.load(v)).map(f => f.status), v)).toEqual(["loaded"]);
  const antes = Number(await page.locator(".team .pts").first().textContent());
  await page.click(".tok:not(.empty)"); await page.click('[data-do="act:2A"]');
  await page.waitForTimeout(1000);
  // cerrar y volver a abrir sin conexión, entrando directamente en otra pestaña
  await page.goto("/#historial");
  await page.waitForSelector(".glist");
  await page.click('.tabbar [data-do="tab:partido"]');
  expect(Number(await page.locator(".team .pts").first().textContent())).toBe(antes + 2);
});

test("versión nueva: avisa, no se recarga sola y actualiza al pulsar", async ({ page, context }) => {
  // Copia de la app servida aparte, para poder "publicar" una versión nueva durante la prueba
  const carpeta = mkdtempSync(join(tmpdir(), "cbm-"));
  cpSync(resolve("dist"), carpeta, { recursive: true });
  const web = await servir(carpeta);
  try {
    await sinInternet(context);
    await listaSinConexion(page, web.url);
    await page.evaluate(() => { window.__sinRecargar = true; });
    // Se publica una versión nueva (cambia el service worker) y la app la detecta
    appendFileSync(join(carpeta, "sw.js"), "\n// version nueva\n");
    await page.evaluate(() => navigator.serviceWorker.getRegistration().then(r => r.update()));
    // La franja aparece al tocar algo (no se repinta la pantalla por sorpresa)
    await expect.poll(async () => {
      await page.click('.tabbar [data-do="tab:partido"]');
      return page.locator('[data-do="update-app"]').count();
    }, { timeout: 15000 }).toBe(1);
    await expect(page.locator("main")).toContainText("Hay una versión nueva de la app");
    // No se ha recargado sola
    await page.waitForTimeout(1500);
    expect(await page.evaluate(() => window.__sinRecargar)).toBe(true);
    // Lo anotado antes de actualizar no se pierde
    const antes = Number(await page.locator(".team .pts").first().textContent());
    await page.click(".tok:not(.empty)"); await page.click('[data-do="act:3A"]');
    // Al pulsar "Actualizar" se recarga con la versión nueva y desaparece la franja
    await Promise.all([page.waitForEvent("load"), page.click('[data-do="update-app"]')]);
    await page.waitForSelector("#app main");
    expect(await page.evaluate(() => window.__sinRecargar)).toBeUndefined();
    await expect(page.locator('[data-do="update-app"]')).toHaveCount(0);
    expect(Number(await page.locator(".team .pts").first().textContent())).toBe(antes + 3);
  } finally {
    await web.cerrar();
    rmSync(carpeta, { recursive: true, force: true });
  }
});
