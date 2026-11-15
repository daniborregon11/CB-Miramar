import { describe, it, expect } from "vitest";
import { ensureCourt, addSub, removeEv } from "../src/logic/court.js";
import { game } from "./helpers.js";

const player = id => (["a","b","c","d","e","f"].includes(id) ? { id } : null);

describe("pista y cambios", () => {
  it("siempre hay 5 huecos y se vacían los de jugadores que ya no existen o no están convocados", () => {
    const g = game([], { onCourt: ["a", "zz"], roster: ["b", "zz"] });
    expect(ensureCourt(g, player)).toEqual([null, null, null, null, null]);
  });
  it("deshacer un cambio devuelve al que salió", () => {
    const g = game([], { onCourt: ["a", "b", "c", "d", "e"] });
    g.onCourt[0] = "f"; const e = addSub(g, "f", "a");
    removeEv(g, e.id, player);
    expect(g.onCourt).toEqual(["a", "b", "c", "d", "e"]);
    expect(g.events).toHaveLength(0);
  });
  it("deshacer una entrada a un hueco libre deja el hueco libre", () => {
    const g = game([], { onCourt: ["a", null, null, null, null] });
    g.onCourt[1] = "b"; const e = addSub(g, "b", null);
    removeEv(g, e.id, player);
    expect(g.onCourt).toEqual(["a", null, null, null, null]);
  });
  it("deshacer un 'al banquillo' devuelve al jugador al primer hueco", () => {
    const g = game([], { onCourt: ["a", null, "c", null, null] });
    const e = addSub(g, null, "c"); g.onCourt[2] = null;
    removeEv(g, e.id, player);
    expect(g.onCourt).toEqual(["a", "c", null, null, null]);
  });
});
