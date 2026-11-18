// Almacén en IndexedDB.
// - "meta": datos del equipo (info), plantilla (players) y orden de los partidos (order).
// - "games": un registro por partido. Al anotar solo se reescribe el partido que ha cambiado.
import { openDB } from "idb";

export var DB_NAME = "cb-miramar";
var DB_VERSION = 1;

export async function openStore(name){
  var db = await openDB(name || DB_NAME, DB_VERSION, {
    upgrade: function(db){
      db.createObjectStore("meta");
      db.createObjectStore("games", { keyPath: "id" });
    }
  });

  // Lo último que se mandó guardar, como texto, para saber qué ha cambiado
  var last = null;
  function resetLast(){ last = { info: null, players: null, order: null, games: new Map() }; }
  resetLast();
  var queue = Promise.resolve();

  /* Lee todo. Devuelve null si todavía no hay nada guardado. */
  async function load(){
    var tx = db.transaction(["meta", "games"]);
    var info = await tx.objectStore("meta").get("info");
    var players = await tx.objectStore("meta").get("players");
    var order = await tx.objectStore("meta").get("order");
    var games = await tx.objectStore("games").getAll();
    await tx.done;
    if(!info) return null;
    var byId = new Map(games.map(function(g){ return [g.id, g]; }));
    var list = [];
    (order || []).forEach(function(id){ if(byId.has(id)){ list.push(byId.get(id)); byId.delete(id); } });
    byId.forEach(function(g){ list.push(g); });
    var S = Object.assign({}, info, { players: players || [], games: list });
    last = {
      info: JSON.stringify(info), players: JSON.stringify(S.players), order: JSON.stringify(list.map(function(g){ return g.id; })),
      games: new Map(list.map(function(g){ return [g.id, JSON.stringify(g)]; }))
    };
    return S;
  }

  /* Guarda los cambios respecto al último guardado. Se toma la "foto" de los datos
     en el momento de llamar, y las escrituras se hacen en orden, una detrás de otra.
     Devuelve una promesa que dice si se ha guardado ({games, deleted}) o falla. */
  function save(S){
    var info = JSON.stringify({ v: S.v, team: S.team, sample: !!S.sample, liveId: S.liveId == null ? null : S.liveId });
    var players = JSON.stringify(S.players);
    var order = JSON.stringify(S.games.map(function(g){ return g.id; }));
    var put = [], keep = new Map();
    S.games.forEach(function(g){
      var j = JSON.stringify(g); keep.set(g.id, j);
      if(last.games.get(g.id) !== j) put.push(j);
    });
    var del = [];
    last.games.forEach(function(j, id){ if(!keep.has(id)) del.push(id); });
    var w = {
      info: info !== last.info ? info : null,
      players: players !== last.players ? players : null,
      order: order !== last.order ? order : null
    };
    last = { info: info, players: players, order: order, games: keep };

    var job = queue.then(async function(){
      var tx = db.transaction(["meta", "games"], "readwrite");
      var meta = tx.objectStore("meta"), gs = tx.objectStore("games");
      if(w.info) meta.put(JSON.parse(w.info), "info");
      if(w.players) meta.put(JSON.parse(w.players), "players");
      if(w.order) meta.put(JSON.parse(w.order), "order");
      put.forEach(function(j){ gs.put(JSON.parse(j)); });
      del.forEach(function(id){ gs.delete(id); });
      await tx.done;
      return { games: put.length, deleted: del.length };
    });
    // Si falla, la próxima vez se reescribe todo para no perder nada
    queue = job.catch(function(){ resetLast(); });
    return job;
  }

  /* Preferencias de este dispositivo (no son datos del equipo: no van en la copia) */
  async function getPref(){ return (await db.get("meta", "prefs")) || null; }
  async function setPref(p){ await db.put("meta", p, "prefs"); }

  return { load: load, save: save, getPref: getPref, setPref: setPref, close: function(){ db.close(); } };
}
