// Datos de la app (S), estado de la pantalla (U), cargar y guardar
import { TABS } from "./logic/constants.js";
import { seed } from "./logic/sample.js";

export var KEY = "baloncesto-stats-v1";

export var storageOk = true;

export function load(){
  try{
    var s = localStorage.getItem(KEY);
    if(s){ var d = JSON.parse(s); if(d && Array.isArray(d.players) && Array.isArray(d.games)){ var onlySample = d.sample && (d.v||1)<2 && d.players.every(function(p){return p.sample;}) && d.games.every(function(g){return g.sample;}); if(!onlySample) return d; } }
  }catch(e){ storageOk = false; }
  return null;
}
export function save(){
  try{ localStorage.setItem(KEY, JSON.stringify(S)); storageOk = true; }catch(e){ storageOk = false; }
}

/* Datos de ejemplo */

export var S = load() || seed();
/* Sustituye todos los datos (al importar una copia) */
export function setData(d){ S = d; }
export var U = {tab:"partido",stats:"equipo",player:null,mT:"pf",mP:"pts",sel:null,bench:null,sub:"anotar",game:null,season:"avg",edit:null,toast:null,modal:null};
(function(){ var h = location.hash.slice(1); if(h==="temporada") h="estadisticas"; if(TABS.indexOf(h)>=0) U.tab = h; })();

export function player(id){ for(var i=0;i<S.players.length;i++) if(S.players[i].id===id) return S.players[i]; return null; }
export function liveGame(){ for(var i=0;i<S.games.length;i++) if(S.games[i].id===S.liveId) return S.games[i]; return null; }
export function gameById(id){ for(var i=0;i<S.games.length;i++) if(S.games[i].id===id) return S.games[i]; return null; }
