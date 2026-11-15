// (Exportar CSV/PDF/copia se comprueba en descargas.spec.js: cambia a propósito la ventana del prototipo.)
// Abre el prototipo original y la app nueva, hace los mismos toques en los dos
// y comprueba que lo que se ve en pantalla es idéntico en cada paso.
import { test, expect } from "@playwright/test";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const PROTO = pathToFileURL(resolve("prototipo.html")).href;
const COPIA = resolve("tests/e2e/copia-prueba.json");

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
  // A partir de aquí, los dos cargan la misma copia (mismos identificadores), así que todo es comparable
  ["importar copia: confirmación", async p => { await p.setInputFiles("#imp", COPIA); }],
  ["importar copia: sí", async p => { await p.click('[data-do="modal-ok"]'); }],
  ["editar jugador", async p => { await p.locator('[data-do^="edit:"]').nth(2).click(); }],
  ["guardar jugador", async p => { await p.fill("#p-name", "Daniel Ruiz Gómez"); await p.click('#f-player button[type="submit"]'); }],
  ["nombre del equipo", async p => { await p.fill("#t-name", "CB Miramar"); await p.click('#f-team button[type="submit"]'); }],
  ["dar de baja", async p => { await p.locator('[data-do^="delp:"]').last().click(); await p.click('[data-do="modal-ok"]'); }],
  ["recuperar baja", async p => { await p.locator('[data-do^="restore:"]').first().click(); }],
  ["quitar jugador sin estadísticas", async p => { await p.fill("#p-num", "98"); await p.fill("#p-name", "Nuevo"); await p.click('#f-player button[type="submit"]'); await p.locator('[data-do^="delp:"]').first().click(); await p.click('[data-do="modal-ok"]'); }],
  ["Escape cierra la ventana", async p => { await p.locator('[data-do^="delp:"]').first().click(); await p.keyboard.press("Escape"); }],
  ["historial por dirección", async p => { await p.evaluate(() => { location.hash = "historial"; }); await p.waitForFunction(() => document.querySelector(".glist")); }],
  ["partido en juego", async p => { await p.locator(".grow").first().click(); }],
  ["volver al partido", async p => { await p.click('[data-do="tab:partido"]'); }],
  ["abrir partido acabado", async p => { await p.click('.tabbar [data-do="tab:historial"]'); await p.locator(".grow").nth(2).click(); }],
  ["editar acta", async p => { await p.locator('[data-do^="edit-game:"]').click(); }],
  ["añadir prórroga", async p => { await p.click('[data-do="edit-addq"]'); }],
  ["añadir jugador al acta", async p => { await p.click('[data-do="edit-addp"]'); }],
  ["salir sin guardar", async p => { await p.locator('[data-do="edit-cancel"]').first().click(); }],
  ["acta con prórroga guardada", async p => { await p.locator('[data-do^="edit-game:"]').click(); await p.click('[data-do="edit-addq"]'); await p.fill("#ed-q5", "7"); await p.locator('#f-edit button[type="submit"]').last().click(); }],
  ["borrar partido", async p => { await p.locator('[data-do^="delg:"]').click(); await p.click('[data-do="modal-ok"]'); }],
  ["estadísticas tras cambios", async p => { await p.click('.tabbar [data-do="tab:estadisticas"]'); }],
  ["etiqueta de la gráfica", async p => { await p.click('[data-do="stats:equipo"]'); await p.locator(".ch-hit").nth(1).click(); }],
  ["quintetos y partido a partido → historial", async p => { await p.locator('[data-do^="open-h:"]').first().click(); }],
  ["jugador desde estadísticas", async p => { await p.click('.tabbar [data-do="tab:estadisticas"]'); await p.click('[data-do="stats:jugadores"]'); await p.locator('[data-do^="player:"]').nth(3).click(); }],
  ["volver a jugadores", async p => { await p.click('[data-do="player-close"]'); }],
];

// Texto visible de la pantalla + contenido de los cuadros de texto (CSV, copia)
// Único cambio intencionado respecto al prototipo: en una instalación nueva el equipo se llama
// "CB Miramar" (en el prototipo, "Mi equipo"). Se tiene en cuenta hasta que se importa una copia.
const ANTES_DE_IMPORTAR = PASOS.findIndex(x => x[0] === "importar copia: sí");
const sinCambiosIntencionados = (texto, i) => i < ANTES_DE_IMPORTAR ? texto.replaceAll("CB Miramar", "Mi equipo").replaceAll("CB MIRAMAR", "MI EQUIPO") : texto;

const foto = p => p.evaluate(() => document.getElementById("app").innerText +
  [...document.querySelectorAll("textarea, input, select")].map(x => "\n[" + x.type + "] " + (x.type === "checkbox" ? x.checked : x.tagName === "SELECT" ? (x.selectedOptions[0] || {}).text : x.value)).join("") +
  "\n--toast--\n" + document.getElementById("toast").innerText);

test("la app se comporta igual que el prototipo", async ({ browser }) => {
  const ctxA = await browser.newContext({ serviceWorkers: "block" }), ctxB = await browser.newContext({ serviceWorkers: "block" });
  // sin conexión a internet (como en la cancha): las fuentes de Google no cargan en ninguno de los dos
  await ctxA.route(/^https?:\/\/(?!localhost)/, r => r.abort());
  await ctxB.route(/^https?:\/\/(?!localhost)/, r => r.abort());
  // Reloj congelado en los dos: los avisos temporales (3,5 s) no desaparecen en uno antes que en otro
  // aunque el ordenador vaya lento, y la fecha "de hoy" es siempre la misma.
  const T0 = new Date("2026-11-15T10:00:00");
  for (const ctx of [ctxA, ctxB]) { await ctx.clock.install({ time: T0 }); await ctx.clock.pauseAt(new Date(T0.getTime() + 1000)); }
  const proto = await ctxA.newPage(), app = await ctxB.newPage();
  const errores = [];
  app.on("pageerror", e => errores.push(e.message));
  await proto.goto(PROTO);
  await app.goto("/");
  await app.waitForSelector("#app main"); // la app pinta en cuanto ha leído los datos guardados
  for (const [i, [nombre, accion]] of PASOS.entries()) {
    await accion(proto);
    await accion(app);
    expect(sinCambiosIntencionados(await foto(app), i), `paso "${nombre}"`).toBe(await foto(proto));
  }
  expect(errores).toEqual([]);
});
