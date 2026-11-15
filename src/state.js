// Datos de la app (S), estado de la pantalla (U), cargar y guardar
import { TABS } from "./logic/constants.js";
import { seed } from "./logic/sample.js";
import { openStore } from "./storage/db.js";
import { readLegacy } from "./storage/migrate.js";

export var storageOk = true;
export var S = null;
var store = null;
var onStorageChange = function(){};

/* Arranque: carga de IndexedDB; si está vacío, trae los datos del prototipo
   (si los hay en esta misma web); si tampoco, datos de ejemplo. */
export async function initData(opts){
  opts = opts || {};
  if(opts.onStorageChange) onStorageChange = opts.onStorageChange;
  var d = null, migrated = false;
  try{
    store = await openStore();
    d = await store.load();
  }catch(e){ store = null; storageOk = false; }
  if(!d){
    var legacy = null;
    try{ legacy = readLegacy(window.localStorage); }catch(e){ legacy = null; }
    if(legacy){ d = legacy; migrated = true; }
  }
  S = d || seed();
  if(migrated) save();
  // Pedir al navegador que no borre los datos aunque falte espacio
  try{ if(navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(function(){}); }catch(e){}
  return { migrated: migrated };
}

/* Guarda en segundo plano. Si falla, se avisa con el banner (como en el prototipo). */
export function save(){
  if(!store){ storageOk = false; return Promise.resolve(false); }
  return store.save(S).then(function(){
    if(!storageOk){ storageOk = true; onStorageChange(); }
    return true;
  }, function(){
    if(storageOk){ storageOk = false; onStorageChange(); }
    return false;
  });
}

/* Sustituye todos los datos (al importar una copia) */
export function setData(d){ S = d; }
export var U = {tab:"partido",stats:"equipo",player:null,mT:"pf",mP:"pts",sel:null,bench:null,sub:"anotar",game:null,season:"avg",edit:null,toast:null,modal:null};
(function(){ var h = location.hash.slice(1); if(h==="temporada") h="estadisticas"; if(TABS.indexOf(h)>=0) U.tab = h; })();

export function player(id){ for(var i=0;i<S.players.length;i++) if(S.players[i].id===id) return S.players[i]; return null; }
export function liveGame(){ for(var i=0;i<S.games.length;i++) if(S.games[i].id===S.liveId) return S.games[i]; return null; }
export function gameById(id){ for(var i=0;i<S.games.length;i++) if(S.games[i].id===id) return S.games[i]; return null; }
