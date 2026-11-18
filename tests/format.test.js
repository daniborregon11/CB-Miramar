import { describe, it, expect } from "vitest";
import { fmtMin, parseMin } from "../src/logic/format.js";
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
  it("ida y vuelta sin perder segundos", () => {
    for (let s = 0; s <= 70 * 60; s += 7) expect(fmtMin(parseMin(fmtMin(s / 60)))).toBe(fmtMin(s / 60));
  });
  it("«por 40 minutos» usa los segundos", () => {
    const g = { min: { a: 20 + 30 / 60 }, events: [shot("a", "2A"), shot("a", "3A")] };
    const r = { p: { id: "a" }, games: [g] };
    expect(40 * per40(r, "pts")).toBeCloseTo(40 * 5 / 20.5, 9);
  });
});
