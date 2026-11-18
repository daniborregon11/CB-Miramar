// Marcador, barra de pestañas, ventana modal y pintado de la pantalla
import { QL, TABS } from "../logic/constants.js";
import { esc } from "../logic/format.js";
import { score } from "../logic/stats.js";
import { S, U, liveGame } from "../state.js";
import { syncWakeLock } from "./wakelock.js";
import { viewStats } from "../views/estadisticas.js";
import { viewHistorial } from "../views/historial.js";
import { viewJugadores } from "../views/jugadores.js";
import { renderAsk, viewPartido } from "../views/partido.js";

export function renderTop(){
  var g = liveGame();
  if(g && U.tab==="partido"){
    var s = score(g);
    return '<header class="top"><div class="sb">'+
      '<div class="team"><span class="tname">'+esc(S.team)+'</span><span class="pts" aria-label="Puntos de '+esc(S.team)+'">'+s.us+'</span></div>'+
      '<div class="vs">vs</div>'+
      '<div class="mid"><div class="qs" role="group" aria-label="Cuarto">'+QL.map(function(l,i){ return '<button data-do="q:'+(i+1)+'" aria-pressed="'+(g.q===i+1)+'">'+l+'</button>'; }).join("")+'</div></div>'+
      '<div class="team r"><div class="opp opp-wide" role="group" aria-label="Puntos del rival">'+[1,2,3].map(function(n){ return '<button data-do="opp:'+n+'" aria-label="Sumar '+n+' al rival">+'+n+'</button>'; }).join("")+'</div>'+
      '<div class="tcol"><span class="tname">'+esc(g.rival)+'</span><span class="pts" aria-label="Puntos del rival">'+s.op+'</span></div></div>'+
      '</div><div class="qrow"><div class="qs" role="group" aria-label="Cuarto">'+
      QL.map(function(l,i){ return '<button data-do="q:'+(i+1)+'" aria-pressed="'+(g.q===i+1)+'">'+l+'</button>'; }).join("")+
      '</div><div style="flex:1"></div><span class="lbl">Rival</span><div class="opp" role="group" aria-label="Puntos del rival">'+
      [1,2,3].map(function(n){ return '<button data-do="opp:'+n+'" aria-label="Sumar '+n+' al rival">+'+n+'</button>'; }).join("")+
      '</div></div></header>';
  }
  return '<header class="top"><div class="sb plain"><span class="brand">Estadísticas <b>· '+esc(S.team)+'</b></span></div></header>';
}

export function renderTabbar(){
  var icons = {
    partido:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3v18M5.6 5.6c3 2.6 3 10.2 0 12.8M18.4 5.6c-3 2.6-3 10.2 0 12.8"/></svg>',
    jugadores:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.2c2.8.3 5 2.6 5 5.8"/></svg>',
    historial:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="4" y="3.5" width="16" height="17" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
    estadisticas:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>'
  };
  var names = {partido:"Partido",jugadores:"Jugadores",historial:"Historial",estadisticas:"Estadísticas"};
  return '<div class="tabbar"><nav aria-label="Secciones">'+TABS.map(function(t){
    return '<button data-do="tab:'+t+'"'+(U.tab===t?' aria-current="page"':'')+'>'+icons[t]+names[t]+'</button>';
  }).join("")+'</nav></div>';
}

export function renderModal(){
  var m = U.modal; if(!m) return "";
  return '<div class="modal-bg" role="dialog" aria-modal="true" aria-labelledby="m-t"><div class="modal"><h3 id="m-t">'+esc(m.title)+'</h3>'+
    (m.html || '<p>'+esc(m.body)+'</p>')+'<div class="btns">'+
    (m.copy ? '<button class="btn" data-do="copy">Copiar</button>' : '')+
    (m.fn ? '<button class="btn'+(m.cancel?' primary':'')+'" data-do="modal-cancel">'+esc(m.cancel||"Cancelar")+'</button>' : '')+
    '<button class="btn '+(m.danger?'dangerfill':(m.cancel?'':'primary'))+'" data-do="modal-ok">'+esc(m.ok||"Aceptar")+'</button></div></div></div>';
}

export function render(){
  var main;
  if(U.tab==="jugadores") main = viewJugadores();
  else if(U.tab==="historial") main = viewHistorial();
  else if(U.tab==="estadisticas") main = viewStats();
  else main = viewPartido();
  document.getElementById("app").innerHTML = renderTop()+'<main>'+main+'</main>'+renderTabbar()+renderModal()+renderAsk();
  var ok = document.querySelector(U.modal && U.modal.cancel ? '.modal [data-do="modal-cancel"]' : '.modal [data-do="modal-ok"]'); if(ok) ok.focus();
  syncWakeLock(!!liveGame());
}
