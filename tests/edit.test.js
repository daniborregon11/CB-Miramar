import { describe, it, expect } from "vitest";
import { makeDraft, validateDraft, applyDraft, draftTotals, rowPts, num } from "../src/logic/edit.js";
import { calc, score } from "../src/logic/stats.js";
import { shot, opp, game } from "./helpers.js";

const players = { a: { id: "a", num: 4, name: "Álex Martín" }, b: { id: "b", num: 7, name: "Hugo Pérez" } };
const player = id => players[id] || null;
const base = () => game([shot("a", "2A", 1), shot("a", "2F", 1), shot("b", "3A", 2), opp(5, 1), opp(4, 2)], { roster: ["a", "b"] });

describe("borrador del acta", () => {
  it("parte de lo anotado en el partido", () => {
    const d = makeDraft(base());
    expect(d.p.a).toMatchObject({ t2m: 1, t2a: 2, min: "" });
    expect(d.opp).toEqual({ 1: 5, 2: 4, 3: 0, 4: 0 });
    expect(draftTotals(d)).toEqual({ us: 5, op: 9 });
  });
  it("puntos de una fila y números en blanco", () => {
    expect(rowPts({ t2m: "2", t3m: 1, tlm: "" })).toBe(7);
    expect(num("")).toBe(0);
  });
});

describe("validaciones del acta", () => {
  const conCambio = cambio => { const d = makeDraft(base()); cambio(d); return validateDraft(d, player); };
  it("un borrador correcto no da error", () => {
    expect(conCambio(() => {})).toBeNull();
  });
  it("solo enteros de 0 en adelante", () => {
    expect(conCambio(d => { d.p.a.as = "1.5"; })).toBe("Revisa Asist. de #4 Álex Martín: tiene que ser un número entero, 0 o más.");
    expect(conCambio(d => { d.p.a.rd = "-1"; })).toMatch(/Reb\. def\./);
  });
  it("anotados no pueden ser más que intentados", () => {
    expect(conCambio(d => { d.p.a.t2m = 3; })).toBe("En #4 Álex Martín, los tiros de 2 anotados no pueden ser más que los intentados.");
    expect(conCambio(d => { d.p.b.t3m = 2; })).toMatch(/triples anotados/);
    expect(conCambio(d => { d.p.b.tlm = 1; })).toMatch(/tiros libres anotados/);
  });
  it("minutos entre 0 y 70 o en blanco", () => {
    expect(conCambio(d => { d.p.a.min = "70"; })).toBeNull();
    expect(conCambio(d => { d.p.a.min = "71"; })).toBe("Revisa los minutos de #4 Álex Martín: un número entre 0 y 70, o en blanco.");
    expect(conCambio(d => { d.p.a.min = "abc"; })).toMatch(/minutos/);
  });
  it("puntos del rival por cuarto", () => {
    expect(conCambio(d => { d.opp[3] = "x"; })).toBe("Revisa los puntos del rival en el 3C.");
  });
});

describe("guardar el acta", () => {
  it("si no cambia nada, no crea ajustes", () => {
    const g = base(); const antes = g.events.length;
    applyDraft(g, makeDraft(g));
    expect(g.events.length).toBe(antes);
  });

  it("guarda las correcciones como ADJ/OPPADJ sin borrar los eventos originales", () => {
    const g = base(); const originales = g.events.map(e => e.id);
    const d = makeDraft(g);
    d.p.a.t2m = "5"; d.p.a.t2a = "7"; d.p.a.min = "30"; d.opp[1] = "20"; d.rival = "  Nuevo rival ";
    applyDraft(g, d);
    expect(originales.every(id => g.events.some(e => e.id === id))).toBe(true);
    expect(g.events.filter(e => e.a === "ADJ")).toHaveLength(1);
    expect(g.events.find(e => e.a === "ADJ").d).toEqual({ t2m: 4, t2a: 5 });
    expect(calc(g.events, "a")).toMatchObject({ t2m: 5, t2a: 7, pts: 10 });
    expect(score(g, 1).op).toBe(20);
    expect(score(g)).toEqual({ us: 13, op: 24 });
    expect(g.min).toEqual({ a: 30 });
    expect(g.rival).toBe("Nuevo rival");
  });

  it("volver a editar recalcula los ajustes en lugar de acumularlos", () => {
    const g = base();
    const d1 = makeDraft(g); d1.p.a.t2m = "5"; d1.p.a.t2a = "7"; applyDraft(g, d1);
    const d2 = makeDraft(g); d2.p.a.t2m = "3"; applyDraft(g, d2);
    expect(g.events.filter(e => e.a === "ADJ")).toHaveLength(1);
    expect(calc(g.events, "a")).toMatchObject({ t2m: 3, t2a: 7 });
  });

  it("rival vacío conserva el anterior; minutos en blanco no se guardan", () => {
    const g = base(); const d = makeDraft(g); d.rival = "   ";
    applyDraft(g, d);
    expect(g.rival).toBe("Rival");
    expect(g.min).toEqual({});
  });
});
