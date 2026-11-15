// Pantalla siempre encendida mientras hay un partido en juego
import { test, expect } from "@playwright/test";

// Imitación de la función de Android: guarda si la pantalla está "bloqueada encendida"
test.beforeEach(async ({ page }) => {
  await page.route(/^https?:\/\/(?!localhost)/, r => r.abort());
  await page.addInitScript(() => {
    window.__encendida = 0; window.__pedidas = 0;
    const listeners = new Set();
    Object.defineProperty(navigator, "wakeLock", { configurable: true, value: {
      request: async () => {
        window.__pedidas++; window.__encendida++;
        let suelto = false;
        const l = {
          addEventListener: (_, fn) => listeners.add([l, fn]),
          release: async () => { if (!suelto) { suelto = true; window.__encendida--; } },
        };
        window.__soltarTodo = () => { listeners.forEach(([lk, fn]) => { lk.release(); fn(); }); listeners.clear(); }; // como hace Android al salir
        return l;
      },
    } });
  });
});
const encendida = page => page.evaluate(() => window.__encendida);
const ocultar = (page, oculta) => page.evaluate(o => {
  Object.defineProperty(document, "visibilityState", { value: o ? "hidden" : "visible", configurable: true });
  if (o) window.__soltarTodo();
  document.dispatchEvent(new Event("visibilitychange"));
}, oculta);

test("encendida durante el partido en cualquier pestaña; se apaga normal al finalizar", async ({ page }) => {
  await page.goto("/");
  await page.waitForSelector("#app main"); // los datos de ejemplo traen un partido en juego
  await expect.poll(() => encendida(page)).toBe(1);
  await page.click('.tabbar [data-do="tab:estadisticas"]');
  await page.click('.tabbar [data-do="tab:jugadores"]');
  expect(await encendida(page)).toBe(1);
  expect(await page.evaluate(() => window.__pedidas)).toBe(1); // no se pide una y otra vez
  // Finalizar el partido: deja de mantenerse encendida
  await page.click('.tabbar [data-do="tab:partido"]');
  await page.click('[data-do="finish"]'); await page.click('[data-do="modal-ok"]');
  await expect.poll(() => encendida(page)).toBe(0);
  // Empezar otro partido: vuelve a mantenerse encendida
  await page.click('.tabbar [data-do="tab:partido"]');
  await page.fill("#g-rival", "CB Rival"); await page.click('#f-game button[type="submit"]');
  await expect.poll(() => encendida(page)).toBe(1);
});

test("al salir de la app y volver se pide otra vez", async ({ page }) => {
  await page.goto("/");
  await page.waitForSelector("#app main");
  await expect.poll(() => encendida(page)).toBe(1);
  await ocultar(page, true);
  expect(await encendida(page)).toBe(0);
  await ocultar(page, false);
  await expect.poll(() => encendida(page)).toBe(1);
});

test("sin partido en juego no se mantiene encendida", async ({ page }) => {
  await page.goto("/");
  await page.waitForSelector("#app main");
  await page.click('[data-do="clear-sample"]'); await page.click('[data-do="modal-ok"]');
  await expect.poll(() => encendida(page)).toBe(0);
  await page.waitForTimeout(1000); // que termine de guardarse antes de cerrar y volver a abrir
  await page.evaluate(() => { window.__pedidas = 0; });
  await page.reload(); await page.waitForSelector("#app main");
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => window.__pedidas)).toBe(0);
});

test("en navegadores sin esta función la app funciona igual", async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(navigator, "wakeLock", { configurable: true, value: undefined }); });
  const errores = []; page.on("pageerror", e => errores.push(e.message));
  await page.goto("/");
  await page.waitForSelector("#app main");
  await page.click(".tok:not(.empty)"); await page.click('[data-do="act:2A"]');
  expect(errores).toEqual([]);
});

test("deslizar el dedo hacia abajo no recarga la página", async ({ page }) => {
  await page.goto("/");
  await page.waitForSelector("#app main");
  for (const el of ["html", "body"])
    expect(await page.locator(el).evaluate(e => getComputedStyle(e).overscrollBehaviorY), el).toBe("none");
});
