import "fake-indexeddb/auto";
import { describe, it, expect } from "vitest";
import { openStore } from "../src/storage/db.js";
import { seed } from "../src/logic/sample.js";

let n = 0;
const nuevo = () => openStore("test-" + (++n)); // una base de datos distinta en cada test
const copia = x => JSON.parse(JSON.stringify(x));

describe("almacén en IndexedDB", () => {
  it("vacío al principio", async () => {
    const st = await nuevo();
    expect(await st.load()).toBeNull();
  });

  it("guarda y recupera todo igual, con los partidos en el mismo orden", async () => {
    const name = "test-" + (++n);
    const S = seed();
    const a = await openStore(name);
    expect(await a.save(S)).toEqual({ games: S.games.length, deleted: 0 });
    a.close();
    const b = await openStore(name); // como si se cerrara y se abriera la app
    expect(await b.load()).toEqual(copia(S));
  });

  it("al anotar solo reescribe el partido que cambia", async () => {
    const st = await nuevo(); const S = seed();
    await st.save(S);
    S.games[6].events.push({ id: "x", a: "2A", p: S.players[0].id, q: 3, t: 1 });
    expect(await st.save(S)).toEqual({ games: 1, deleted: 0 });
    expect(await st.save(S)).toEqual({ games: 0, deleted: 0 });
  });

  it("borra de la base de datos los partidos borrados", async () => {
    const st = await nuevo(); const S = seed();
    await st.save(S);
    S.games.splice(2, 1);
    expect(await st.save(S)).toEqual({ games: 0, deleted: 1 });
    expect((await st.load()).games.map(g => g.id)).toEqual(S.games.map(g => g.id));
  });

  it("guarda la foto del momento aunque los datos cambien antes de escribir", async () => {
    const st = await nuevo(); const S = seed();
    const p = st.save(S);
    S.team = "Cambiado después";
    await p;
    expect((await st.load()).team).toBe(seed().team);
  });

  it("varios guardados seguidos se escriben en orden: queda el último", async () => {
    const st = await nuevo(); const S = seed();
    const ps = [];
    for (let i = 0; i < 20; i++) { S.games[0].q = i; S.team = "T" + i; ps.push(st.save(S)); }
    await Promise.all(ps);
    const r = await st.load();
    expect(r.team).toBe("T19");
    expect(r.games[0].q).toBe(19);
  });

  it("importar una copia sustituye todo", async () => {
    const st = await nuevo();
    await st.save(seed());
    const otra = seed(); otra.team = "Otra";
    expect(await st.save(otra)).toEqual({ games: otra.games.length, deleted: otra.games.length });
    expect(await st.load()).toEqual(copia(otra));
  });
});

describe("ajustes de este dispositivo", () => {
  it("se guardan aparte de los datos del equipo", async () => {
    const name = "test-" + (++n);
    const a = await openStore(name);
    expect(await a.getPref()).toBeNull();
    await a.setPref({ askAst: false, askReb: true });
    await a.save(seed());
    a.close();
    const b = await openStore(name);
    expect(await b.getPref()).toEqual({ askAst: false, askReb: true });
    expect((await b.load()).prefs).toBeUndefined(); // no se mezclan con los datos (ni van en la copia)
  });
});
