// Abre el prototipo original y la app nueva, hace los mismos toques en los dos
// y comprueba que lo que se ve en pantalla es idéntico en cada paso.
import { test, expect } from "@playwright/test";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const PROTO = pathToFileURL(resolve("prototipo.html")).href;

// Cada paso: [descripción, acción]
const PASOS = [
  ["inicio", async () => {}],
  ["anotar triple", async p => { await p.click(".tok:not(.empty)"); await p.click('[data-do="act:3A"]'); }],
  ["falta", async p => { await p.locator(".tok:not(.empty)").nth(2).click(); await p.click('[data-do="act:FC"]'); }],
  ["cambio", async p => { await p.locator(".bbtn").first().click(); await p.locator(".tok:not(.empty)").nth(1).click(); }],
  ["al banquillo", async p => { await p.locator(".tok:not(.empty)").nth(3).click(); await p.click('[data-do^="tobench:"]'); }],
  ["entra a hueco libre", async p => { await p.locator(".bbtn").nth(1).click(); }],
  ["puntos rival", async p => { await p.click('.opp-wide [data-do="opp:2"]'); }],
  ["cuarto 4", async p => { await p.click('.mid [data-do="q:4"]'); }],
  ["deshacer última", async p => { await p.click('[data-do="undo"]'); }],
  ["borrar una acción", async p => { await p.locator('[data-do^="delev:"]').nth(2).click(); }],
  ["ficha", async p => { await p.click('[data-do="sub:ficha"]'); }],
  ["finalizar: confirmación", async p => { await p.click('[data-do="finish"]'); }],
  ["finalizar: no, seguir", async p => { await p.click('[data-do="modal-cancel"]'); }],
  ["finalizar: sí", async p => { await p.click('[data-do="finish"]'); await p.click('[data-do="modal-ok"]'); }],
  ["acta: error de validación", async p => { await p.locator('.edt input').nth(1).fill("9"); await p.locator('.edt input').nth(2).fill("1"); await p.locator('#f-edit button[type="submit"]').last().click(); }],
  ["acta: guardar", async p => { await p.locator('.edt input').nth(2).fill("12"); await p.locator('.edt td.minc input').first().fill("31"); await p.locator("#ed-q1").fill("20"); await p.locator('#f-edit button[type="submit"]').last().click(); }],
  ["historial", async p => { await p.click('[data-do="close"]'); }],
  ["otro partido", async p => { await p.locator(".grow").nth(3).click(); }],
  ["estadísticas equipo", async p => { await p.click('.tabbar [data-do="tab:estadisticas"]'); }],
  ["gráfica eFG%", async p => { await p.click('[data-do="mT:efg"]'); }],
  ["gráfica pérdidas", async p => { await p.click('[data-do="mT:pe"]'); }],
  ["jugadores promedios", async p => { await p.click('[data-do="stats:jugadores"]'); }],
  ["jugadores totales", async p => { await p.click('[data-do="season:tot"]'); }],
  ["jugador", async p => { await p.locator('[data-do^="player:"]').first().click(); }],
  ["jugador: valoración", async p => { await p.click('[data-do="mP:val"]'); }],
  ["jugador: minutos", async p => { await p.click('[data-do="mP:min"]'); }],
  ["jugador: +/-", async p => { await p.click('[data-do="mP:pm"]'); }],
  ["pestaña jugadores", async p => { await p.click('.tabbar [data-do="tab:jugadores"]'); }],
  ["dorsal repetido", async p => { await p.fill("#p-num", "4"); await p.fill("#p-name", "Prueba"); await p.click('#f-player button[type="submit"]'); }],
  ["alta jugador", async p => { await p.fill("#p-num", "99"); await p.click('#f-player button[type="submit"]'); }],
  ["baja con estadísticas", async p => { await p.locator('[data-do^="delp:"]').first().click(); await p.click('[data-do="modal-ok"]'); }],
  ["nuevo partido", async p => { await p.click('.tabbar [data-do="tab:partido"]'); }],
  ["empezar partido", async p => { await p.fill("#g-rival", "CB Prueba"); await p.click('#f-game button[type="submit"]'); }],
  ["quinteto inicial", async p => { for (let i = 0; i < 5; i++) await p.locator(".bbtn").first().click(); }],
  ["borrar ejemplo", async p => { await p.click('[data-do="clear-sample"]'); await p.click('[data-do="modal-ok"]'); }],
];

const foto = p => p.evaluate(() => document.getElementById("app").innerText + "\n--toast--\n" + document.getElementById("toast").innerText);

test("la app se comporta igual que el prototipo", async ({ browser }) => {
  const ctxA = await browser.newContext(), ctxB = await browser.newContext();
  // sin conexión a internet (como en la cancha): las fuentes de Google no cargan en ninguno de los dos
  await ctxA.route(/^https?:\/\/(?!localhost)/, r => r.abort());
  await ctxB.route(/^https?:\/\/(?!localhost)/, r => r.abort());
  const proto = await ctxA.newPage(), app = await ctxB.newPage();
  const errores = [];
  app.on("pageerror", e => errores.push(e.message));
  await proto.goto(PROTO);
  await app.goto("/");
  for (const [nombre, accion] of PASOS) {
    await accion(proto);
    await accion(app);
    expect(await foto(app), `paso "${nombre}"`).toBe(await foto(proto));
  }
  expect(errores).toEqual([]);
});
