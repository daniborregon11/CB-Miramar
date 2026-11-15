import { describe, it, expect } from "vitest";
import { seed } from "../src/logic/sample.js";
import { score, calc, doneGames, track } from "../src/logic/stats.js";
import { seasonRows } from "../src/logic/metrics.js";

// "Foto" de los datos de ejemplo: si al reorganizar el código cambia algún cálculo,
// estos números dejarán de coincidir con los del prototipo.
describe("datos de ejemplo (comparación con el prototipo)", () => {
  const S = seed();
  it("resultados de los partidos", () => {
    expect(S.games.map(g => [g.rival, score(g).us, score(g).op])).toMatchSnapshot();
  });
  it("tabla de temporada", () => {
    const rows = seasonRows(S.players, doneGames(S.games));
    expect(rows.map(r => [r.p.num, r.n, r.s.pts, r.s.reb, r.s.as, r.s.val, r.pm])).toMatchSnapshot();
  });
  it("totales del equipo del partido en juego", () => {
    const live = S.games.find(g => g.id === S.liveId);
    const t = calc(live.events);
    expect([t.pts, t.fga, t.tla, t.reb, t.val, Object.keys(track(live).lu).length]).toMatchSnapshot();
  });
});
