// Pestaña Partido: cancha, banquillo, botones de acción, registro y nuevo partido
import { MAX_CONVOCADOS, checkedByDefault, rosterCount } from "../logic/roster.js";
import { nuevo } from "../ui/nuevo.js";
import { ACT, QL } from "../logic/constants.js";
import { ensureCourt } from "../logic/court.js";
import { byNum, esc, short, today } from "../logic/format.js";
import { calc } from "../logic/stats.js";
import { S, U, liveGame, player } from "../state.js";
import { banner } from "../ui/banner.js";
import { boxScore, quarterTable } from "./ficha.js";

/* Pista: 5 huecos fijos; cada hueco tiene su sitio en la cancha */
export var SPOTS = [[50,77],[17,52],[83,52],[27,23],[73,23]];
export function tag(id){ var p=player(id); return p ? "#"+p.num+" "+short(p.name) : "Jugador"; }
export var COURT_SVG = '<svg viewBox="0 0 500 467" aria-hidden="true" fill="none" stroke="#1A1C21" stroke-width="3">'+
  '<rect x="1.5" y="1.5" width="497" height="464" fill="#FFFFFF"/>'+
  '<rect x="168.3" y="1.5" width="163.4" height="191.8"/>'+
  '<circle cx="250" cy="193.3" r="60"/>'+
  '<path d="M30 1.5 V99.7 A225 225 0 0 0 470 99.7 V1.5"/>'+
  '<path d="M208.3 52.5 A41.7 41.7 0 0 0 291.7 52.5"/>'+
  '<line x1="220" y1="40" x2="280" y2="40" stroke-width="4"/>'+
  '<line x1="250" y1="40" x2="250" y2="45"/>'+
  '<circle cx="250" cy="52.5" r="7.5" stroke="#D4531F" stroke-width="3"/>'+
  '<path d="M190 465.5 A60 60 0 0 1 310 465.5"/>'+
  '</svg>';


export function abtn(c){
  var a = ACT[c];
  var inner = a.o ? '<span class="o">'+a.o+'</span>' : '<span class="big">'+a.big+'</span><span>'+a.sm+'</span>';
  return '<button class="abtn '+(a.cls||"")+'"'+nuevo(c==="FR")+' data-do="act:'+c+'" aria-label="'+a.t+'">'+inner+'</button>';
}

export function viewPartido(){
  var g = liveGame(), h = banner();
  if(!g) return h + viewNewGame();
  h += '<div class="subbar"><div class="seg" role="group" aria-label="Vista del partido">'+
    '<button data-do="sub:anotar" aria-pressed="'+(U.sub==="anotar")+'">Anotar</button>'+
    '<button data-do="sub:ficha" aria-pressed="'+(U.sub==="ficha")+'">Ficha</button></div>'+
    '<button class="btn" data-do="finish">Finalizar partido</button></div>';
  if(U.sub==="ficha"){
    return h + '<section class="card"><h2>'+esc(S.team)+' vs '+esc(g.rival)+'</h2>'+quarterTable(g)+boxScore(g)+'</section>';
  }
  var roster = g.roster.map(player).filter(Boolean).sort(byNum);
  var oc = ensureCourt(g, player);
  var bench = roster.filter(function(p){ return oc.indexOf(p.id)<0; });
  var sel = (U.sel && oc.indexOf(U.sel)>=0) ? player(U.sel) : null;
  if(!sel) U.sel = null;
  var bs = (U.bench && bench.some(function(p){ return p.id===U.bench; })) ? player(U.bench) : null;
  if(!bs) U.bench = null;
  var empty = oc.filter(function(x){ return !x; }).length;
  var hint = bs ? 'Entra #'+bs.num+' '+esc(short(bs.name))+': toca al jugador de pista que sale. <button class="link" data-do="cancel-sub">Cancelar</button>'
    : empty ? (empty===5 ? 'Elige el quinteto inicial: toca 5 jugadores del banquillo.' : 'Faltan '+empty+' en pista: toca jugadores del banquillo.')
    : 'Toca un jugador de pista para anotar. Para hacer un cambio, toca primero al del banquillo.';
  h += '<div class="banner rotate"><span>Para anotar con más espacio, gira la tablet en horizontal.</span></div>';
  h += '<div class="live"><section class="card courtcard"><p class="hint" style="margin:0 0 10px">'+hint+'</p><div class="cc">'+
    '<div class="court'+(bs?' subbing':'')+'">'+COURT_SVG+oc.map(function(id,i){
      var x=SPOTS[i][0], y=SPOTS[i][1];
      if(!id) return '<div class="tok empty" style="left:'+x+'%;top:'+y+'%">Libre</div>';
      var p = player(id), st = calc(g.events, id), fc = st.fc;
      var lbl = bs ? 'Sale #'+p.num+' '+p.name : '#'+p.num+' '+p.name+', '+st.pts+' puntos, '+fc+' faltas';
      return '<button class="tok '+(fc>=5?"f5":fc===4?"f4":"")+'" style="left:'+x+'%;top:'+y+'%" data-do="court:'+id+'" aria-pressed="'+(U.sel===id)+'" aria-label="'+esc(lbl)+'">'+
        '<span class="num">'+p.num+'</span><span class="nm">'+esc(short(p.name))+'</span><span class="mini">'+st.pts+' pts · <span class="fl">'+fc+' F</span></span></button>';
    }).join("")+'</div>'+
    '<div class="bench"><div class="benchh">Banquillo</div>'+(bench.length ? bench.map(function(p){
      var st = calc(g.events, p.id), fc = st.fc;
      return '<button class="pbtn bbtn '+(fc>=5?"f5":fc===4?"f4":"")+'" data-do="bench:'+p.id+'" aria-pressed="'+(U.bench===p.id)+'">'+
        '<span class="num">'+p.num+'</span><span class="nm">'+esc(short(p.name))+'</span><span class="mini">'+st.pts+' pts · <span class="fl">'+fc+' F</span></span></button>';
    }).join("") : '<p class="muted small">Todos en pista.</p>')+'</div></div></section>';
  var selStats = sel ? calc(g.events, sel.id) : null;
  h += '<div class="right"><section class="card"><h2>'+(sel ? '#'+sel.num+' '+esc(sel.name) : 'Acción')+'</h2>'+
    '<p class="hint">'+(sel ? (selStats.fc>=5 ? 'Tiene 5 faltas: está eliminado. ' : selStats.pts+' pts · '+selStats.reb+' reb · '+selStats.as+' ast · '+selStats.fc+' faltas · ')+'<button class="link" data-do="tobench:'+sel.id+'">Mandar al banquillo</button>' : 'Toca un jugador de la cancha y después la acción.')+'</p>'+
    '<div class="pad '+(sel?"":"off")+'"><div class="shots">'+["2A","3A","1A","2F","3F","1F"].map(abtn).join("")+'</div>'+
    '<div class="others">'+["RD","RO","AS","RB","TP","PE","FC","FR"].map(abtn).join("")+'</div></div></section>';
  h += logCard(g)+'</div></div>';
  return h;
}

export function logCard(g){
  var ev = g.events.filter(function(e){ return e.a!=="ADJ" && e.a!=="OPPADJ"; }).slice(-10).reverse();
  return '<section class="card logcard"><div class="cardhead"><h2>Últimas acciones</h2>'+
    (ev.length ? '<button class="btn sm" data-do="undo">Deshacer última</button>' : '')+'</div>'+
    (ev.length ? '<ul class="log">'+ev.map(function(e){
      var txt, cls;
      if(e.a==="OPP"){ txt = esc(g.rival)+' · +'+e.pts; cls="opp"; }
      else if(e.a==="SUB"){ cls="sub"; txt = e["in"]&&e.out ? 'Cambio · entra '+esc(tag(e["in"]))+', sale '+esc(tag(e.out)) : e["in"] ? 'Entra a pista '+esc(tag(e["in"])) : 'Al banquillo '+esc(tag(e.out)); }
      else { var p = player(e.p); txt = (p ? '#'+p.num+' '+esc(short(p.name)) : 'Jugador')+' · '+ACT[e.a].t; cls = ACT[e.a].cls==="ok"?"ok":ACT[e.a].cls==="miss"?"miss":""; }
      return '<li><span class="q">'+QL[e.q-1]+'</span><span class="tx"><span class="dot '+cls+'"></span>'+txt+'</span><button class="x" data-do="delev:'+e.id+'" aria-label="Borrar esta acción">×</button></li>';
    }).join("")+'</ul>' : '<p class="muted small">Aún no hay acciones en este partido.</p>')+'</section>';
}

export function viewNewGame(){
  var act = S.players.filter(function(p){return p.active;}).sort(byNum);
  if(!act.length) return '<section class="card"><h2>Nuevo partido</h2><p class="muted">Primero añade a los jugadores de tu equipo.</p><button class="btn primary" data-do="tab:jugadores">Ir a Jugadores</button></section>';
  var marcar = checkedByDefault(act.length), marcados = marcar ? act.length : 0;
  return '<section class="card"><h2>Nuevo partido</h2><form id="f-game" class="stack" novalidate>'+
    '<div class="row"><label for="g-rival">Rival<input id="g-rival" placeholder="Nombre del rival" autocomplete="off" maxlength="40"></label>'+
    '<label for="g-date">Fecha<input id="g-date" type="date" value="'+today()+'"></label>'+
    '<label for="g-place">Lugar<select id="g-place"><option>Local</option><option>Visitante</option></select></label></div>'+
    '<fieldset><legend>Convocados<span'+nuevo(true,"conv")+'> <span id="g-count">'+rosterCount(marcados, false)+'</span></span></legend><div class="checks">'+act.map(function(p){
      return '<label class="chk" for="c-'+p.id+'"><input type="checkbox" id="c-'+p.id+'" value="'+p.id+'"'+(marcar?' checked':'')+'><b>'+p.num+'</b> '+esc(p.name)+'</label>';
    }).join("")+'</div>'+
    (act.length > MAX_CONVOCADOS ? '<label class="chk friendly"'+nuevo(true,"conv")+' for="g-friendly"><input type="checkbox" id="g-friendly"> Partido amistoso (sin límite de '+MAX_CONVOCADOS+' convocados)</label>' : '')+
    '</fieldset><p class="err" id="g-err" role="alert"></p>'+
    '<div class="btns"><button class="btn primary" type="submit">Empezar partido</button></div></form></section>';
}
