// Pestaña Historial: lista de partidos y detalle
import { esc, fmtDate } from "../logic/format.js";
import { score } from "../logic/stats.js";
import { S, U, gameById } from "../state.js";
import { banner } from "../ui/banner.js";
import { viewEditGame } from "./acta.js";
import { boxScore, quarterTable, resultPill } from "./ficha.js";

export function viewHistorial(){
  if(U.game){ var gg = gameById(U.game); if(gg){ if(U.draft && U.draft.id===gg.id) return viewEditGame(gg); return gameDetail(gg); } U.game=null; }
  var gs = S.games.slice().sort(function(a,b){ return b.date.localeCompare(a.date); });
  return banner()+'<section class="card"><h2>Partidos <span class="count">'+gs.length+'</span></h2>'+
    (gs.length ? '<ul class="glist">'+gs.map(function(g){ var s=score(g);
      return '<li><button class="grow" data-do="open:'+g.id+'"><span class="gdate">'+fmtDate(g.date)+' · '+esc(g.place||"")+'</span><span class="gvs">vs '+esc(g.rival)+'</span><span class="gsc">'+s.us+'–'+s.op+'</span>'+resultPill(g)+'</button></li>';
    }).join("")+'</ul>' : '<p class="muted">Todavía no hay partidos. Empieza uno desde la pestaña Partido.</p>')+'</section>';
}

export function gameDetail(g){
  var s = score(g);
  return '<div class="subbar"><button class="btn" data-do="close">← Partidos</button><div class="btns">'+
    (g.id===S.liveId ? '<button class="btn primary" data-do="tab:partido">Volver al partido</button>' : '')+
    '<button class="btn" data-do="edit-game:'+g.id+'">Editar estadísticas</button><button class="btn'+(g.done?' primary':'')+'" data-do="pdf:'+g.id+'">Exportar PDF</button><button class="btn" data-do="csv:'+g.id+'">Exportar CSV</button><button class="btn danger" data-do="delg:'+g.id+'">Borrar</button></div></div>'+
    '<section class="card"><p class="muted small">'+fmtDate(g.date)+' · '+esc(g.place||"")+' '+resultPill(g)+'</p>'+
    '<h2>'+esc(S.team)+' '+s.us+' – '+s.op+' '+esc(g.rival)+'</h2>'+quarterTable(g)+boxScore(g)+'</section>';
}
