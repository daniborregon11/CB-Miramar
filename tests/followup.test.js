import { describe, it, expect } from "vitest";
import { askFor, askPlayers, followUp, undoTarget, orebPct } from "../src/logic/followup.js";
import { removeEv } from "../src/logic/court.js";
import { calc, score, track } from "../src/logic/stats.js";
import { shot, opp, sub, game, ev } from "./helpers.js";

const player = () => ({});

describe("qué se pregunta tras cada acción", () => {
  it("canasta de 2 o 3 → asistencia; tiro fallado (también TL) → rebote", () => {
    expect(["2A", "3A", "1A", "2F", "3F", "1F", "RD", "FC", "FR"].map(a => askFor(a, {}))).toEqual(["ast", "ast", null, "reb", "reb", "reb", null, null, null]);
  });
  it("se puede desactivar cada pregunta", () => {
    expect(askFor("2A", { askAst: false })).toBeNull();
    expect(askFor("2F", { askReb: false })).toBeNull();
    expect(askFor("2F", { askAst: false })).toBe("reb");
  });
  it("asistencia: los otros de pista; rebote: los cinco (también el que tira)", () => {
    const pista = ["a", "b", null, "d", "e"];
    expect(askPlayers("ast", pista, "a")).toEqual(["b", "d", "e"]);
    expect(askPlayers("reb", pista, "a")).toEqual(["a", "b", "d", "e"]);
  });
});

describe("la respuesta se guarda unida al tiro", () => {
  const tiro = { id: "t1", a: "3A", p: "a", q: 2 };
  it("asistencia, rebote ofensivo y rebote del rival", () => {
    expect(followUp("ast", "b", tiro)).toMatchObject({ a: "AS", p: "b", ref: "t1", q: 2 });
    expect(followUp("reb", "c", tiro)).toMatchObject({ a: "RO", p: "c", ref: "t1" });
    expect(followUp("reb", "rival", tiro)).toMatchObject({ a: "RR", p: null, ref: "t1" });
  });
  it("«Sin asistencia» / «Sin rebote» no guarda nada (los datos quedan como antes)", () => {
    expect(followUp("ast", "none", tiro)).toBeNull();
    expect(followUp("reb", "none", tiro)).toBeNull();
  });
  it("la asistencia y el rebote cuentan en las estadísticas; el rebote del rival no es de nadie de mi equipo", () => {
    const evs = [shot("a", "2A"), ev("AS", { p: "b", ref: "x" }), shot("a", "2F"), ev("RO", { p: "c", ref: "y" }), shot("b", "3F"), ev("RR", { p: null, ref: "z" })];
    expect(calc(evs, "b").as).toBe(1);
    expect(calc(evs, "c").ro).toBe(1);
    expect(calc(evs).reb).toBe(1);
    const g = game([sub("a"), sub("b"), sub("c"), sub("d"), sub("e"), ...evs]);
    expect(score(g)).toEqual({ us: 2, op: 0 }); // el rebote del rival no suma puntos
    expect(track(g).pm.a).toBe(2);
  });
});

describe("deshacer", () => {
  const partido = () => {
    const t = shot("a", "3A"); const as = ev("AS", { p: "b", ref: t.id });
    const f = shot("c", "2F"); const rr = ev("RR", { p: null, ref: f.id });
    return { g: game([t, as, opp(2), f, rr]), t, as, f, rr };
  };
  it("borrar un tiro borra también su asistencia o rebote", () => {
    const { g, t, f } = partido();
    removeEv(g, t.id, player);
    expect(g.events.map(e => e.a)).toEqual(["OPP", "2F", "RR"]);
    removeEv(g, f.id, player);
    expect(g.events.map(e => e.a)).toEqual(["OPP"]);
  });
  it("borrar solo la asistencia deja el tiro", () => {
    const { g, as } = partido();
    removeEv(g, as.id, player);
    expect(g.events.map(e => e.a)).toEqual(["3A", "OPP", "2F", "RR"]);
  });
  it("«Deshacer última» deshace el tiro entero si lo último fue su rebote o asistencia", () => {
    const { g, f } = partido();
    expect(undoTarget(g.events)).toBe(f.id);
    const o = opp(2);
    expect(undoTarget([o])).toBe(o.id);
    expect(undoTarget([])).toBeNull();
    const suelto = ev("AS", { p: "b", ref: "no-existe" });
    expect(undoTarget([suelto])).toBe(suelto.id);
  });
});

describe("rebotes ofensivos cogidos", () => {
  it("de los rebotes tras nuestros fallos, % que cogemos (solo partidos con rebote del rival anotado)", () => {
    const g1 = game([shot("a", "2F"), shot("a", "RO"), shot("a", "3F"), ev("RR", { p: null }), shot("b", "2F"), ev("RR", { p: null }), shot("c", "1F"), ev("RR", { p: null })]);
    const g2 = game([shot("a", "RO"), shot("a", "RO")]); // sin rebotes del rival anotados: no cuenta
    expect(orebPct([g1, g2], calc)).toBeCloseTo(25, 10);
    expect(orebPct([g2], calc)).toBeNull();
  });
});
