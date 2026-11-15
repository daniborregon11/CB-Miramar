// Ayudas para construir partidos de prueba de forma legible
let n = 0;
export function ev(a, extra = {}) { return { id: "e" + (++n), a, q: 1, t: n, ...extra }; }
export function shot(p, a, q = 1) { return ev(a, { p, q }); }
export function opp(pts, q = 1) { return ev("OPP", { p: null, pts, q }); }
export function sub(inId, outId, q = 1) { return ev("SUB", { p: null, in: inId || null, out: outId || null, q }); }
export function game(events, extra = {}) {
  return { id: "g1", rival: "Rival", date: "2026-10-04", place: "Local", roster: ["a","b","c","d","e","f"], q: 4, done: true, onCourt: [null,null,null,null,null], events, ...extra };
}
