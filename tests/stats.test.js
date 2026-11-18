import { describe, it, expect } from "vitest";
import { calc, score, efg, tsp, possOf, astTo, track, maxQ, doneGames } from "../src/logic/stats.js";
import { shot, opp, sub, game, ev } from "./helpers.js";

// Jugador "a": 2 de 3 en tiros de 2, 1 de 3 en triples, 1 de 2 en tiros libres,
// 1 RO, 2 RD, 1 AS, 1 RB, 1 TP, 1 PE, 1 FC.
const lineaA = ["2A","2A","2F","3A","3F","3F","1A","1F","RO","RD","RD","AS","RB","TP","PE","FC"].map(a => shot("a", a));

describe("calc: estadísticas de un jugador a partir de los eventos", () => {
  const s = calc([...lineaA, shot("b", "3A")], "a");

  it("cuenta tiros y puntos", () => {
    expect([s.t2m, s.t2a, s.t3m, s.t3a, s.tlm, s.tla]).toEqual([2, 3, 1, 3, 1, 2]);
    expect(s.pts).toBe(8); // 2+2+3+1
    expect([s.fgm, s.fga]).toEqual([3, 6]);
  });

  it("cuenta rebotes y el resto de acciones", () => {
    expect([s.ro, s.rd, s.reb, s.as, s.rb, s.tp, s.pe, s.fc]).toEqual([1, 2, 3, 1, 1, 1, 1, 1]);
  });

  it("VAL = PTS + REB + AS + RB + TP − TC fallados − TL fallados − PE − FC", () => {
    // 8 + 3 + 1 + 1 + 1 − 3 − 1 − 1 − 1 = 8
    expect(s.val).toBe(8);
  });

  it("sin jugador indicado suma todo el equipo e ignora eventos sin jugador", () => {
    const t = calc([...lineaA, shot("b", "3A"), opp(2), sub("a", null)]);
    expect(t.pts).toBe(11);
    expect(t.t3m).toBe(2);
  });

  it("aplica los ajustes del acta (ADJ) y suma sus puntos", () => {
    const s2 = calc([...lineaA, ev("ADJ", { p: "a", q: 0, d: { t2m: 1, t2a: 1, as: 2 } })], "a");
    expect(s2.t2m).toBe(3);
    expect(s2.t2a).toBe(4);
    expect(s2.as).toBe(3);
    expect(s2.pts).toBe(10);
  });

  it("un jugador sin eventos tiene todo a cero", () => {
    const z = calc(lineaA, "zz");
    expect(z.pts + z.reb + z.val + z.fga).toBe(0);
  });
});

describe("faltas recibidas (FR)", () => {
  const s = calc([...lineaA, shot("a", "FR"), shot("a", "FR"), shot("b", "FR")], "a");
  it("se cuentan aparte de las faltas cometidas", () => {
    expect(s.fr).toBe(2);
    expect(s.fc).toBe(1);
  });
  it("suman +1 cada una en la valoración (como en la ACB)", () => {
    // la línea de "a" sin faltas recibidas vale 8
    expect(s.val).toBe(10);
  });
  it("no suman puntos ni cambian el marcador", () => {
    expect(s.pts).toBe(8);
    expect(score(game([shot("a", "FR")]))).toEqual({ us: 0, op: 0 });
  });
  it("se pueden corregir en el acta (ajuste ADJ)", () => {
    expect(calc([ev("ADJ", { p: "a", q: 0, d: { fr: 3 } })], "a")).toMatchObject({ fr: 3, val: 3 });
  });
});

describe("métricas avanzadas", () => {
  const s = calc(lineaA, "a");
  it("eFG% = (TC anotados + 0,5·T3 anotados) / TC intentados", () => {
    expect(efg(s)).toBeCloseTo(100 * 3.5 / 6, 10);
  });
  it("TS% = PTS / (2·(TC intentados + 0,44·TL intentados))", () => {
    expect(tsp(s)).toBeCloseTo(100 * 8 / (2 * (6 + 0.88)), 10);
  });
  it("Posesiones = TC intentados + 0,44·TL intentados − RO + PE", () => {
    expect(possOf(s)).toBeCloseTo(6 + 0.88 - 1 + 1, 10);
  });
  it("sin tiros, eFG% y TS% no se pueden calcular (null)", () => {
    const z = calc([], "a");
    expect(efg(z)).toBeNull();
    expect(tsp(z)).toBeNull();
    expect(astTo(z)).toBeNull();
  });
  it("AS/PE", () => {
    expect(astTo({ as: 6, pe: 4 })).toBe(1.5);
  });
});

describe("score: marcador y parciales", () => {
  const g = game([
    shot("a", "2A", 1), shot("b", "3A", 1), opp(2, 1),
    shot("a", "1A", 2), opp(3, 2), ev("OPPADJ", { p: null, pts: -1, q: 2 }),
    ev("ADJ", { p: "a", q: 0, d: { t3m: 1, t3a: 1 } }),
  ]);
  it("total incluye correcciones del acta", () => {
    expect(score(g)).toEqual({ us: 9, op: 4 });
  });
  it("por cuarto; los ajustes de jugador (cuarto 0) no entran en ningún parcial", () => {
    expect(score(g, 1)).toEqual({ us: 5, op: 2 });
    expect(score(g, 2)).toEqual({ us: 1, op: 2 });
  });
  it("maxQ es al menos 4 y crece con la prórroga", () => {
    expect(maxQ(g)).toBe(4);
    expect(maxQ(game([shot("a", "2A", 5)]))).toBe(5);
  });
});

describe("track: más/menos y quintetos a partir de los cambios", () => {
  const g = game([
    sub("a"), sub("b"), sub("c"), sub("d"), sub("e"),
    shot("a", "2A"),        // +2 para a,b,c,d,e
    opp(3),                 // −3 para a,b,c,d,e
    sub("f", "a"),          // entra f, sale a
    shot("f", "3A"),        // +3 para b,c,d,e,f
    sub(null, "b"),         // b al banquillo: quedan 4
    opp(2),                 // −2 para c,d,e,f (no cuenta como quinteto)
  ]);
  const t = track(g);
  it("calcula el +/- de cada jugador", () => {
    expect(t.tracked).toBe(true);
    expect(t.pm).toEqual({ a: -1, b: 2, c: 0, d: 0, e: 0, f: 1 });
  });
  it("acumula puntos por quinteto solo cuando hay 5 en pista", () => {
    const lus = Object.values(t.lu).map(l => [l.ids.slice().sort().join(""), l.pf, l.pa]).sort();
    expect(lus).toEqual([["abcde", 2, 3], ["bcdef", 3, 0]]);
  });
  it("sin cambios registrados no se puede calcular", () => {
    expect(track(game([shot("a", "2A")])).tracked).toBe(false);
  });
});

describe("doneGames", () => {
  it("solo partidos finalizados, ordenados por fecha", () => {
    const gs = [game([], { id: "x", date: "2026-11-01" }), game([], { id: "y", date: "2026-10-01" }), game([], { id: "z", done: false })];
    expect(doneGames(gs).map(g => g.id)).toEqual(["y", "x"]);
  });
});
