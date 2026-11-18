import { describe, it, expect } from "vitest";
import { fmtMin, parseMin, maskMin } from "../src/logic/format.js";
import { per40 } from "../src/logic/metrics.js";
import { shot } from "./helpers.js";

describe("minutos y segundos", () => {
  it("se muestran como mm:ss", () => {
    expect(fmtMin(22 + 32 / 60)).toBe("22:32");
    expect(fmtMin(31)).toBe("31:00");
    expect(fmtMin(0.75)).toBe("0:45");
    expect(fmtMin(312.75)).toBe("312:45"); // totales de temporada
    expect(fmtMin(59.9999)).toBe("60:00");  // redondea al segundo
    expect([null, undefined, ""].map(fmtMin)).toEqual(["–", "–", "–"]);
  });
  it("se leen con «:», «.» o «,»; solo minutos = :00", () => {
    expect(parseMin("22:32") * 60).toBeCloseTo(1352, 9);
    expect(parseMin("22.32")).toBe(parseMin("22:32"));
    expect(parseMin("22,32")).toBe(parseMin("22:32"));
    expect(parseMin("22")).toBe(22);
    expect(parseMin("  ")).toBe("");
    expect(["22:5", "22.5", "22:60", "x", "22:32:10", "-1"].map(parseMin)).toEqual([null, null, null, null, null, null]);
  });
  it("«22:» (los dos puntos puestos solos, sin segundos) es 22:00", () => {
    expect(parseMin("22:")).toBe(22);
  });
  it("ida y vuelta sin perder segundos", () => {
    for (let s = 0; s <= 70 * 60; s += 7) expect(fmtMin(parseMin(fmtMin(s / 60)))).toBe(fmtMin(s / 60));
  });
  it("«por 40 minutos» usa los segundos", () => {
    const g = { min: { a: 20 + 30 / 60 }, events: [shot("a", "2A"), shot("a", "3A")] };
    const r = { p: { id: "a" }, games: [g] };
    expect(40 * per40(r, "pts")).toBeCloseTo(40 * 5 / 20.5, 9);
  });
});

describe("los dos puntos se ponen solos al escribir los minutos", () => {
  // Simula escribir tecla a tecla, como en la tablet
  const escribir = (teclas, inicio = "") => {
    let v = inicio; const pasos = [];
    for (const t of teclas) { v = t === "⌫" ? maskMin(v.slice(0, -1), true) : maskMin(v + t, false); pasos.push(v); }
    return pasos;
  };
  it("2 2 3 1 → 22:31", () => {
    expect(escribir("2231")).toEqual(["2", "22:", "22:3", "22:31"]);
  });
  it("minutos de una cifra: 0 5 0 7 → 05:07 (y se guarda como 5:07)", () => {
    expect(escribir("0507").at(-1)).toBe("05:07");
    expect(fmtMin(parseMin("05:07"))).toBe("5:07");
  });
  it("no deja escribir más de 2 cifras de segundos ni letras", () => {
    expect(escribir("223199").at(-1)).toBe("22:31");
    expect(maskMin("2a2b3c1")).toBe("22:31");
  });
  it("borrar funciona con normalidad", () => {
    expect(escribir("⌫⌫⌫⌫", "22:31")).toEqual(["22:3", "22:", "22", "2"]);
  });
  it("respeta un valor guardado con minutos de una cifra al corregirlo", () => {
    expect(escribir("⌫8", "5:07")).toEqual(["5:0", "5:08"]);
  });
  it("punto o coma (o pegar «22.31») cuentan como dos puntos", () => {
    expect(maskMin("22.31")).toBe("22:31");
    expect(maskMin("22,31")).toBe("22:31");
    expect(maskMin("")).toBe("");
  });
});
