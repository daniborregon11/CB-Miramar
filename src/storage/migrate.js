// Conversión de datos al formato actual de la app.
// Acepta el formato del prototipo (v1/v2) y copias exportadas desde la app.
// Nunca cambia identificadores ni eventos: las estadísticas se siguen calculando igual.

export var DATA_VERSION = 3;

/* Regla del prototipo: datos antiguos (v1) que son solo de ejemplo se descartan
   para cargar los datos de ejemplo nuevos. */
export function isOnlyOldSample(d){
  return !!(d.sample && (d.v||1)<2 && d.players.every(function(p){return p.sample;}) && d.games.every(function(g){return g.sample;}));
}

function isObj(x){ return x != null && typeof x === "object" && !Array.isArray(x); }

/* Devuelve los datos en el formato actual, o null si no es una copia de esta app */
export function migrate(d){
  if(!isObj(d) || !Array.isArray(d.players) || !Array.isArray(d.games)) return null;
  var players = d.players.filter(function(p){ return isObj(p) && p.id != null; }).map(function(p){
    var o = Object.assign({}, p);
    o.num = Number(p.num); if(isNaN(o.num)) o.num = 0;
    o.name = p.name == null ? "" : String(p.name);
    o.pos = p.pos == null ? "" : String(p.pos);
    o.active = p.active !== false;
    return o;
  });
  var games = d.games.filter(function(g){ return isObj(g) && g.id != null; }).map(function(g){
    var o = Object.assign({}, g);
    o.rival = g.rival == null || g.rival === "" ? "Rival" : String(g.rival);
    o.date = g.date == null ? "" : String(g.date);
    o.place = g.place == null ? "Local" : String(g.place);
    o.roster = Array.isArray(g.roster) ? g.roster.slice() : [];
    o.events = Array.isArray(g.events) ? g.events.filter(isObj) : [];
    o.q = Number(g.q) >= 1 ? Number(g.q) : 1;
    o.done = !!g.done;
    o.onCourt = Array.isArray(g.onCourt) ? g.onCourt.slice(0, 5) : [];
    while(o.onCourt.length < 5) o.onCourt.push(null);
    o.min = isObj(g.min) ? Object.assign({}, g.min) : {};
    return o;
  });
  var live = d.liveId != null && games.filter(function(g){ return g.id === d.liveId && !g.done; })[0];
  return {
    v: DATA_VERSION,
    team: typeof d.team === "string" && d.team.trim() ? d.team : "Mi equipo",
    sample: !!d.sample,
    liveId: live ? live.id : null,
    players: players,
    games: games
  };
}

/* Datos que dejó el prototipo en el almacenamiento antiguo (localStorage) de esta misma web */
export var LEGACY_KEY = "baloncesto-stats-v1";
export function readLegacy(storage){
  try{
    var s = storage && storage.getItem(LEGACY_KEY);
    if(!s) return null;
    var d = JSON.parse(s);
    if(!d || !Array.isArray(d.players) || !Array.isArray(d.games) || isOnlyOldSample(d)) return null;
    return migrate(d);
  }catch(e){ return null; }
}
