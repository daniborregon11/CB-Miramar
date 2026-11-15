import { describe, it, expect } from "vitest";
import { migrate, readLegacy, isOnlyOldSample, DATA_VERSION, LEGACY_KEY } from "../src/storage/migrate.js";
import { seed } from "../src/logic/sample.js";
import { calc, score } from "../src/logic/stats.js";

const memoria = obj => ({ getItem: k => (k in obj ? obj[k] : null) });

describe("conversión de datos (migrate)", () => {
  it("los datos del prototipo pasan sin perder nada y con las mismas estadísticas", () => {
    const proto = seed(); // mismo formato que guarda el prototipo (v2)
    const d = migrate(JSON.parse(JSON.stringify(proto)));
    expect(d.v).toBe(DATA_VERSION);
    expect(d.team).toBe(proto.team);
    expect(d.liveId).toBe(proto.liveId);
    expect(d.players.map(p => p.id)).toEqual(proto.players.map(p => p.id));
    expect(d.games.map(g => g.id)).toEqual(proto.games.map(g => g.id));
    d.games.forEach((g, i) => {
      expect(g.events).toEqual(proto.games[i].events);
      expect(score(g)).toEqual(score(proto.games[i]));
      expect(calc(g.events)).toEqual(calc(proto.games[i].events));
    });
  });

  it("rellena lo que falte en datos antiguos o incompletos", () => {
    const d = migrate({
      players: [{ id: "a", num: "7", name: "Ana" }],
      games: [{ id: "g", events: [{ id: "e", a: "2A", p: "a", q: 1 }, null] }],
    });
    expect(d.team).toBe("Mi equipo");
    expect(d.players[0]).toEqual({ id: "a", num: 7, name: "Ana", pos: "", active: true });
    expect(d.games[0]).toMatchObject({ rival: "Rival", place: "Local", roster: [], q: 1, done: false, min: {}, onCourt: [null, null, null, null, null] });
    expect(d.games[0].events).toHaveLength(1);
    expect(d.liveId).toBeNull();
  });

  it("conserva a los jugadores de baja y los campos que no conoce", () => {
    const d = migrate({ players: [{ id: "a", num: 1, name: "X", active: false, sample: true }], games: [{ id: "g", extra: 5 }] });
    expect(d.players[0].active).toBe(false);
    expect(d.players[0].sample).toBe(true);
    expect(d.games[0].extra).toBe(5);
  });

  it("si el partido 'en juego' ya está finalizado o no existe, no hay partido en juego", () => {
    expect(migrate({ players: [], games: [{ id: "g", done: true }], liveId: "g" }).liveId).toBeNull();
    expect(migrate({ players: [], games: [], liveId: "zz" }).liveId).toBeNull();
    expect(migrate({ players: [], games: [{ id: "g" }], liveId: "g" }).liveId).toBe("g");
  });

  it("rechaza lo que no es una copia de esta app", () => {
    [null, 5, "hola", [], { players: [] }, { games: [] }, { players: {}, games: [] }].forEach(x => expect(migrate(x)).toBeNull());
  });
});

describe("datos que dejó el prototipo en esta misma web (localStorage)", () => {
  it("se leen y convierten", () => {
    const proto = seed(); proto.sample = false;
    const d = readLegacy(memoria({ [LEGACY_KEY]: JSON.stringify(proto) }));
    expect(d.games).toHaveLength(proto.games.length);
  });
  it("no hay nada, o está estropeado", () => {
    expect(readLegacy(memoria({}))).toBeNull();
    expect(readLegacy(memoria({ [LEGACY_KEY]: "{no es json" }))).toBeNull();
    expect(readLegacy(null)).toBeNull();
  });
  it("datos de ejemplo antiguos (v1) se descartan, como en el prototipo", () => {
    const viejo = { v: 1, sample: true, players: [{ id: "a", sample: true }], games: [{ id: "g", sample: true }] };
    expect(isOnlyOldSample(viejo)).toBe(true);
    expect(readLegacy(memoria({ [LEGACY_KEY]: JSON.stringify(viejo) }))).toBeNull();
    // pero si el usuario añadió algo suyo, se conserva
    viejo.players.push({ id: "b" });
    expect(readLegacy(memoria({ [LEGACY_KEY]: JSON.stringify(viejo) }))).not.toBeNull();
  });
});
