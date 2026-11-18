import { describe, it, expect } from "vitest";
import { MAX_CONVOCADOS, rosterLimit, rosterError, checkedByDefault, rosterCount } from "../src/logic/roster.js";

describe("convocados", () => {
  it("máximo 12 en partido oficial; sin límite en amistoso", () => {
    expect(MAX_CONVOCADOS).toBe(12);
    expect(rosterLimit(false)).toBe(12);
    expect(rosterLimit(true)).toBe(Infinity);
  });
  it("errores al empezar el partido", () => {
    expect(rosterError(0, false)).toBe("Marca al menos un jugador convocado.");
    expect(rosterError(12, false)).toBeNull();
    expect(rosterError(13, false)).toMatch(/Como máximo puedes convocar a 12 jugadores/);
    expect(rosterError(15, true)).toBeNull();
    expect(rosterError(0, true)).toBe("Marca al menos un jugador convocado.");
  });
  it("con 12 o menos en la plantilla salen marcados; con más, desmarcados", () => {
    expect(checkedByDefault(10)).toBe(true);
    expect(checkedByDefault(12)).toBe(true);
    expect(checkedByDefault(13)).toBe(false);
  });
  it("contador", () => {
    expect(rosterCount(10, false)).toBe("10/12");
    expect(rosterCount(14, true)).toBe("14");
  });
});
