import { describe, it, expect } from "vitest";
import { linreg, trendInfo, niceStep } from "../src/logic/trend.js";

const pts = ys => ys.map(y => ({ y }));
const NUM = { hb: 1 };            // dato normal (p. ej. puntos)
const MALO = { hb: -1 };          // dato en el que subir es malo (p. ej. pérdidas)
const PCT = { hb: 1, suf: "%" };  // dato en porcentaje

describe("linreg", () => {
  it("recta exacta", () => {
    expect(linreg([1, 2, 3], [2, 4, 6])).toEqual({ b: 2, a: 0 });
  });
  it("pendiente con huecos (usa el número de partido como x)", () => {
    // partidos 0, 2 y 3 con valores 1, 5 y 9
    expect(linreg([0, 2, 3], [1, 5, 9]).b).toBeCloseTo(36 / 14, 10);
  });
});

describe("tendencia", () => {
  it("con menos de 3 partidos con dato: faltan datos", () => {
    expect(trendInfo([{ y: 10 }, { y: null }, { y: 12 }], NUM).kind).toBe("few");
  });
  it("al alza y es bueno", () => {
    const t = trendInfo(pts([10, 12, 14]), NUM);
    expect(t.kind).toBe("up");
    expect(t.good).toBe(true);
    expect(t.fit.b).toBeCloseTo(2, 10);
  });
  it("al alza en un dato donde subir es malo (pérdidas)", () => {
    const t = trendInfo(pts([2, 4, 6]), MALO);
    expect(t.kind).toBe("up");
    expect(t.good).toBe(false);
  });
  it("a la baja", () => {
    expect(trendInfo(pts([14, 12, 10]), NUM).kind).toBe("down");
  });
  it("estable si el cambio total es menor que el 8 % de la media", () => {
    // media 103, umbral 8,24; cambio total 6
    expect(trendInfo(pts([100, 103, 106]), NUM).kind).toBe("stable");
    // cambio total 10 > 8,4
    expect(trendInfo(pts([100, 105, 110]), NUM).kind).toBe("up");
  });
  it("el umbral mínimo es 1", () => {
    // media 0,4 → 8 % sería 0,03, pero el umbral es 1; cambio 0,8
    expect(trendInfo(pts([0, 0.4, 0.8]), NUM).kind).toBe("stable");
    expect(trendInfo(pts([0, 0.6, 1.2]), NUM).kind).toBe("up");
  });
  it("en porcentajes el umbral es 3 puntos porcentuales", () => {
    expect(trendInfo(pts([50, 51, 52.9]), PCT).kind).toBe("stable");
    expect(trendInfo(pts([50, 52, 54]), PCT).kind).toBe("up");
  });
});

describe("niceStep (escala de las gráficas)", () => {
  it("redondea a 1, 2, 5 o 10 por potencia de 10", () => {
    expect([0.7, 1.5, 3, 7, 23].map(niceStep)).toEqual([1, 2, 5, 10, 50]);
  });
});
