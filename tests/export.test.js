import { describe, it, expect } from "vitest";
import { csvOf, pdfGame } from "../src/logic/export.js";
import { shot, opp, sub, game } from "./helpers.js";

const players = {
  a: { id: "a", num: 10, name: "Álex Martín" },
  b: { id: "b", num: 4, name: 'Hugo "el; rápido"' },
};
const player = id => players[id] || null;
const g = game([sub("a"), sub("b"), shot("a", "3A"), shot("b", "2A"), shot("b", "1F"), opp(2)], { roster: ["a", "b"], min: { a: 25 } });

describe("CSV", () => {
  const csv = csvOf(g, player);
  const lines = csv.slice(1).split("\n");
  it("empieza con BOM para que Excel lea bien las tildes y usa ';'", () => {
    expect(csv.charCodeAt(0)).toBe(0xFEFF);
    expect(lines[0]).toBe("Dorsal;Jugador;MIN;PTS;T2A;T2I;T3A;T3I;TLA;TLI;RO;RD;REB;AS;RB;TP;PE;FC;VAL");
  });
  it("una fila por jugador ordenada por dorsal; entrecomilla lo que lleva ';' o comillas", () => {
    expect(lines[1]).toBe('4;"Hugo ""el; rápido""";;2;1;1;0;0;0;1;0;0;0;0;0;0;0;0;1');
    expect(lines[2]).toBe("10;Álex Martín;25;3;0;0;1;1;0;0;0;0;0;0;0;0;0;0;3");
  });
});

// Lee un PDF generado y comprueba su estructura interna (tabla de posiciones de objetos)
function checkPdf(bytes) {
  const s = Array.from(bytes, b => String.fromCharCode(b)).join("");
  const xref = parseInt(s.match(/startxref\n(\d+)/)[1], 10);
  expect(s.slice(xref, xref + 4)).toBe("xref");
  const total = parseInt(s.slice(xref).match(/xref\n0 (\d+)/)[1], 10);
  const rows = s.slice(xref).split("\n").slice(3, 3 + total - 1);
  rows.forEach((r, i) => {
    const off = parseInt(r.slice(0, 10), 10);
    expect(s.slice(off, off + String(i + 1).length + 6)).toBe((i + 1) + " 0 obj");
  });
  return s;
}

describe("PDF", () => {
  it("es un PDF válido, A4 horizontal, con las tildes en Latin-1", () => {
    const bytes = pdfGame(g, "CB Miramar", player);
    const s = checkPdf(bytes);
    expect(s.startsWith("%PDF-1.4")).toBe(true);
    expect(s).toContain("/MediaBox [0 0 842 595]");
    expect(s).toContain("/Count 1");
    expect(s).toContain("(CB Miramar  5 - 2  Rival)");
    expect(Array.from(bytes)).toContain(0xC1); // "Á" de Álex
  });
  it("con muchos jugadores pasa a una segunda página", () => {
    const many = {}; const roster = [];
    for (let i = 0; i < 30; i++) { many["p" + i] = { id: "p" + i, num: i, name: "Jugador " + i }; roster.push("p" + i); }
    const s = checkPdf(pdfGame(game([], { roster }), "CB Miramar", id => many[id]));
    expect(s).toContain("/Count 2");
    expect(s).toContain("continuación".replace("ó", "\xF3"));
  });
});
