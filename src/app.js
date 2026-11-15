// Interfaz de la app (de momento, el código del prototipo; se ordenará en el paso 2).
// La lógica de estadísticas está en src/logic/ y tiene tests en tests/.
import { POS, QL, TABS, ACT, TITLES } from "./logic/constants.js";
import { uid, esc, today, fmtDate, shortDate, short, byNum, pct, f1, fsign, fpc, fmtV } from "./logic/format.js";
import { calc, score, maxQ, efg, tsp, possOf, astTo, doneGames, allEvents, track } from "./logic/stats.js";
import { trendInfo, niceStep } from "./logic/trend.js";
import { TEAM_M, PLAYER_M, seasonRows, per40 } from "./logic/metrics.js";
import { ensureCourt, addSub, removeEv } from "./logic/court.js";
import { EF, EF_LBL, draftRow, makeDraft, draftTotals, rowPts, validateDraft, applyDraft } from "./logic/edit.js";
import { csvOf, pdfGame } from "./logic/export.js";
import { seed } from "./logic/sample.js";

(function(){
"use strict";
var KEY = "baloncesto-stats-v1";

var storageOk = true;

function load(){
  try{
    var s = localStorage.getItem(KEY);
    if(s){ var d = JSON.parse(s); if(d && Array.isArray(d.players) && Array.isArray(d.games)){ var onlySample = d.sample && (d.v||1)<2 && d.players.every(function(p){return p.sample;}) && d.games.every(function(g){return g.sample;}); if(!onlySample) return d; } }
  }catch(e){ storageOk = false; }
  return null;
}
function save(){
  try{ localStorage.setItem(KEY, JSON.stringify(S)); storageOk = true; }catch(e){ storageOk = false; }
}

/* Datos de ejemplo */

var S = load() || seed();
var U = {tab:"partido",stats:"equipo",player:null,mT:"pf",mP:"pts",sel:null,bench:null,sub:"anotar",game:null,season:"avg",edit:null,toast:null,modal:null};
(function(){ var h = location.hash.slice(1); if(h==="temporada") h="estadisticas"; if(TABS.indexOf(h)>=0) U.tab = h; })();

function player(id){ for(var i=0;i<S.players.length;i++) if(S.players[i].id===id) return S.players[i]; return null; }
function liveGame(){ for(var i=0;i<S.games.length;i++) if(S.games[i].id===S.liveId) return S.games[i]; return null; }
function gameById(id){ for(var i=0;i<S.games.length;i++) if(S.games[i].id===id) return S.games[i]; return null; }
/* Pista: 5 huecos fijos; cada hueco tiene su sitio en la cancha */
var SPOTS = [[50,77],[17,52],[83,52],[27,23],[73,23]];
function tag(id){ var p=player(id); return p ? "#"+p.num+" "+short(p.name) : "Jugador"; }
var COURT_SVG = '<svg viewBox="0 0 500 467" aria-hidden="true" fill="none" stroke="#1A1C21" stroke-width="3">'+
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


/* ---------- Vistas ---------- */
function renderTop(){
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

function banner(){
  var h = "";
  if(S.sample) h += '<div class="banner"><span>Estás viendo datos de ejemplo para probar la app.</span><button class="btn sm" data-do="clear-sample">Borrar ejemplo y empezar</button></div>';
  if(!storageOk) h += '<div class="banner"><span>Este navegador no está guardando los datos. Exporta una copia antes de cerrar la página.</span></div>';
  return h;
}

function abtn(c){
  var a = ACT[c];
  var inner = a.o ? '<span class="o">'+a.o+'</span>' : '<span class="big">'+a.big+'</span><span>'+a.sm+'</span>';
  return '<button class="abtn '+(a.cls||"")+'" data-do="act:'+c+'" aria-label="'+a.t+'">'+inner+'</button>';
}

function viewPartido(){
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
    '<div class="others">'+["RD","RO","AS","RB","TP","PE","FC"].map(abtn).join("")+'</div></div></section>';
  h += logCard(g)+'</div></div>';
  return h;
}

function logCard(g){
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

function viewNewGame(){
  var act = S.players.filter(function(p){return p.active;}).sort(byNum);
  if(!act.length) return '<section class="card"><h2>Nuevo partido</h2><p class="muted">Primero añade a los jugadores de tu equipo.</p><button class="btn primary" data-do="tab:jugadores">Ir a Jugadores</button></section>';
  return '<section class="card"><h2>Nuevo partido</h2><form id="f-game" class="stack" novalidate>'+
    '<div class="row"><label for="g-rival">Rival<input id="g-rival" placeholder="Nombre del rival" autocomplete="off" maxlength="40"></label>'+
    '<label for="g-date">Fecha<input id="g-date" type="date" value="'+today()+'"></label>'+
    '<label for="g-place">Lugar<select id="g-place"><option>Local</option><option>Visitante</option></select></label></div>'+
    '<fieldset><legend>Convocados</legend><div class="checks">'+act.map(function(p){
      return '<label class="chk" for="c-'+p.id+'"><input type="checkbox" id="c-'+p.id+'" value="'+p.id+'" checked><b>'+p.num+'</b> '+esc(p.name)+'</label>';
    }).join("")+'</div></fieldset><p class="err" id="g-err" role="alert"></p>'+
    '<div class="btns"><button class="btn primary" type="submit">Empezar partido</button></div></form></section>';
}

function viewJugadores(){
  var ed = U.edit ? player(U.edit) : null;
  var list = S.players.filter(function(p){return p.active;}).sort(byNum);
  var bajas = S.players.filter(function(p){return !p.active;});
  return banner()+
    '<section class="card"><h2>'+(ed?'Editar jugador':'Añadir jugador')+'</h2><form id="f-player" class="stack" novalidate>'+
    '<div class="row"><label for="p-num" class="narrow">Dorsal<input id="p-num" type="number" inputmode="numeric" min="0" max="99" value="'+(ed?ed.num:"")+'"></label>'+
    '<label for="p-name">Nombre<input id="p-name" maxlength="40" autocomplete="off" placeholder="Nombre y apellido" value="'+(ed?esc(ed.name):"")+'"></label>'+
    '<label for="p-pos">Posición<select id="p-pos">'+POS.map(function(x){ return '<option'+(ed&&ed.pos===x?' selected':'')+'>'+x+'</option>'; }).join("")+'</select></label></div>'+
    '<p class="err" id="p-err" role="alert"></p><div class="btns"><button class="btn primary" type="submit">'+(ed?'Guardar cambios':'Añadir jugador')+'</button>'+
    (ed?'<button class="btn" type="button" data-do="cancel-edit">Cancelar</button>':'')+'</div></form></section>'+
    '<section class="card"><h2>Plantilla <span class="count">'+list.length+'</span></h2>'+
    (list.length ? '<ul class="plist">'+list.map(function(p){
      return '<li><span class="pnum">'+p.num+'</span><span class="pinfo"><b>'+esc(p.name)+'</b><small>'+esc(p.pos)+'</small></span>'+
        '<span class="pact"><button class="btn sm" data-do="edit:'+p.id+'">Editar</button><button class="btn sm danger" data-do="delp:'+p.id+'">Quitar</button></span></li>';
    }).join("")+'</ul>' : '<p class="muted">Aún no hay jugadores. Añade el primero con el formulario de arriba.</p>')+
    (bajas.length ? '<p class="muted small" style="margin-top:10px">De baja (sus estadísticas se conservan): '+bajas.map(function(p){ return '#'+p.num+' '+esc(p.name)+' <button class="link" data-do="restore:'+p.id+'">Recuperar</button>'; }).join(" · ")+'</p>' : '')+
    '</section>'+
    '<section class="card"><h2>Equipo</h2><form id="f-team" class="row" novalidate><label for="t-name">Nombre de tu equipo<input id="t-name" maxlength="40" value="'+esc(S.team)+'"></label>'+
    '<button class="btn" type="submit" style="align-self:flex-end">Guardar</button></form></section>'+
    '<section class="card"><h2>Copia de seguridad</h2><p class="muted small">Los datos se guardan solo en este dispositivo. Exporta una copia de vez en cuando para no perderlos o para pasarlos a otro móvil.</p>'+
    '<div class="btns"><button class="btn" data-do="export">Exportar copia</button><button class="btn" data-do="import">Importar copia</button><input type="file" id="imp" accept=".json,application/json" hidden></div></section>';
}

function boxScore(g){
  var ps = g.roster.map(player).filter(Boolean).sort(byNum);
  var head = ["MIN","PTS","T2","T3","TL","RO","RD","REB","AS","RB","TP","PE","FC","+/-","VAL"];
  var tk = track(g), mins = g.min||{}, msum = 0, mhas = false;
  Object.keys(mins).forEach(function(k){ msum += mins[k]; mhas = true; });
  function row(s, id){ return [id===undefined ? (mhas?msum:"–") : (mins[id]!=null?mins[id]:"–"), s.pts, s.t2m+"/"+s.t2a, s.t3m+"/"+s.t3a, s.tlm+"/"+s.tla, s.ro, s.rd, s.reb, s.as, s.rb, s.tp, s.pe, s.fc, id===undefined ? "" : (tk.tracked ? fsign(tk.pm[id]||0) : "–"), s.val]; }
  var all = ps.map(function(p){ return {p:p, s:calc(g.events,p.id)}; });
  var best = Math.max.apply(null, all.map(function(x){return x.s.pts;}).concat([0]));
  var tot = calc(g.events);
  return '<div class="tbl-wrap"><table><thead><tr><th scope="col">Jugador</th>'+head.map(function(x){ return '<th scope="col" title="'+(TITLES[x]||(x==="MIN"?"Minutos":"Más/menos"))+'">'+x+'</th>'; }).join("")+'</tr></thead><tbody>'+
    all.map(function(x){ return '<tr><th scope="row"><span class="dn">'+x.p.num+'</span>'+esc(short(x.p.name))+'</th>'+row(x.s,x.p.id).map(function(v,i){ return '<td'+(i===1&&best>0&&x.s.pts===best?' class="hi"':'')+'>'+v+'</td>'; }).join("")+'</tr>'; }).join("")+
    '</tbody><tfoot><tr><th scope="row">Equipo</th>'+row(tot).map(function(v){ return '<td>'+v+'</td>'; }).join("")+'</tr>'+
    '<tr class="pct"><th scope="row">Porcentaje</th><td></td><td></td><td>'+pct(tot.t2m,tot.t2a)+'</td><td>'+pct(tot.t3m,tot.t3a)+'</td><td>'+pct(tot.tlm,tot.tla)+'</td><td colspan="10"></td></tr></tfoot></table></div>'+
    '<p class="muted small">+/- = diferencia de puntos con el jugador en pista. VAL = puntos + rebotes + asistencias + robos + tapones − tiros fallados − pérdidas − faltas.</p>';
}

function quarterTable(g){
  var maxq = maxQ(g);
  var qs=[]; for(var i=1;i<=maxq;i++) qs.push(i);
  var t = score(g), sq = 0; qs.forEach(function(q){ sq += score(g,q).us; });
  var adj = t.us - sq;
  return '<div class="tbl-wrap"><table class="qt"><thead><tr><th scope="col">Parcial</th>'+qs.map(function(q){ return '<th scope="col">'+QL[q-1]+'</th>'; }).join("")+(adj?'<th scope="col" title="Puntos añadidos o quitados al corregir el acta">Correcc.</th>':'')+'<th scope="col">Total</th></tr></thead><tbody>'+
    '<tr><th scope="row">'+esc(S.team)+'</th>'+qs.map(function(q){ return '<td>'+score(g,q).us+'</td>'; }).join("")+(adj?'<td>'+fsign(adj)+'</td>':'')+'<td><b>'+t.us+'</b></td></tr>'+
    '<tr><th scope="row">'+esc(g.rival)+'</th>'+qs.map(function(q){ return '<td>'+score(g,q).op+'</td>'; }).join("")+(adj?'<td></td>':'')+'<td><b>'+t.op+'</b></td></tr></tbody></table></div>';
}

function resultPill(g){
  if(g.id===S.liveId) return '<span class="pill live">En juego</span>';
  var s = score(g);
  return s.us>s.op ? '<span class="pill w">Victoria</span>' : s.us<s.op ? '<span class="pill l">Derrota</span>' : '<span class="pill">Empate</span>';
}

function viewHistorial(){
  if(U.game){ var gg = gameById(U.game); if(gg){ if(U.draft && U.draft.id===gg.id) return viewEditGame(gg); return gameDetail(gg); } U.game=null; }
  var gs = S.games.slice().sort(function(a,b){ return b.date.localeCompare(a.date); });
  return banner()+'<section class="card"><h2>Partidos <span class="count">'+gs.length+'</span></h2>'+
    (gs.length ? '<ul class="glist">'+gs.map(function(g){ var s=score(g);
      return '<li><button class="grow" data-do="open:'+g.id+'"><span class="gdate">'+fmtDate(g.date)+' · '+esc(g.place||"")+'</span><span class="gvs">vs '+esc(g.rival)+'</span><span class="gsc">'+s.us+'–'+s.op+'</span>'+resultPill(g)+'</button></li>';
    }).join("")+'</ul>' : '<p class="muted">Todavía no hay partidos. Empieza uno desde la pestaña Partido.</p>')+'</section>';
}

function gameDetail(g){
  var s = score(g);
  return '<div class="subbar"><button class="btn" data-do="close">← Partidos</button><div class="btns">'+
    (g.id===S.liveId ? '<button class="btn primary" data-do="tab:partido">Volver al partido</button>' : '')+
    '<button class="btn" data-do="edit-game:'+g.id+'">Editar estadísticas</button><button class="btn'+(g.done?' primary':'')+'" data-do="pdf:'+g.id+'">Exportar PDF</button><button class="btn" data-do="csv:'+g.id+'">Exportar CSV</button><button class="btn danger" data-do="delg:'+g.id+'">Borrar</button></div></div>'+
    '<section class="card"><p class="muted small">'+fmtDate(g.date)+' · '+esc(g.place||"")+' '+resultPill(g)+'</p>'+
    '<h2>'+esc(S.team)+' '+s.us+' – '+s.op+' '+esc(g.rival)+'</h2>'+quarterTable(g)+boxScore(g)+'</section>';
}

/* ---------- Métricas ---------- */


function trendOf(pts, m){
  var t = trendInfo(pts, m);
  if(t.kind==="few") return {fit:null, html:'<span class="pill">Faltan datos</span> <span class="muted small">La tendencia se calcula a partir de 3 partidos.</span>'};
  if(t.kind==="stable") return {fit:t.fit, html:'<span class="pill">Estable</span> <span class="muted small">Sin cambios claros a lo largo de los partidos.</span>'};
  var up = t.kind==="up";
  return {fit:t.fit, html:'<span class="pill '+(t.good?"w":"l")+'">'+(up?"↗ Al alza":"↘ A la baja")+'</span> <span class="small">'+(up?"+":"−")+f1(Math.abs(t.fit.b))+' '+m.u+' por partido de media</span>'};
}
function chartSVG(pts, m, fit){
  var W=960, H=250, L=44, R=16, T=14, B=34, n=pts.length;
  var vals = pts.map(function(p){return p.y;}).filter(function(v){return v!=null;});
  if(!vals.length) return '<p class="muted small">No hay datos de este apartado en estos partidos.</p>';
  var lo=Math.min.apply(null,vals), hi=Math.max.apply(null,vals);
  if(lo>0) lo=0; if(hi<0) hi=0;
  var st = niceStep(((hi-lo)||1)/4); lo=Math.floor(lo/st)*st; hi=Math.ceil(hi/st)*st; if(hi===lo) hi=lo+st;
  function X(i){ return n===1 ? L+(W-L-R)/2 : L + i*(W-L-R)/(n-1); }
  function Y(v){ return T + (hi-v)/(hi-lo)*(H-T-B); }
  var g = '';
  for(var v=lo; v<=hi+1e-9; v+=st){
    g += '<line class="ch-grid'+(Math.abs(v)<1e-9 && lo<0 ? ' ch-zero':'')+'" x1="'+L+'" x2="'+(W-R)+'" y1="'+Y(v).toFixed(1)+'" y2="'+Y(v).toFixed(1)+'"/>'+
         '<text class="ch-lab" x="'+(L-8)+'" y="'+(Y(v)+4).toFixed(1)+'" text-anchor="end">'+(Math.round(v*10)/10)+(m.suf||"")+'</text>';
  }
  var every = Math.ceil(n/8);
  pts.forEach(function(p,i){ if(i%every===0 || i===n-1) g += '<text class="ch-lab" x="'+X(i).toFixed(1)+'" y="'+(H-12)+'" text-anchor="middle">'+esc(p.x)+'</text>'; });
  if(fit){
    var xs=[]; pts.forEach(function(p,i){ if(p.y!=null) xs.push(i); });
    var x0=xs[0], x1=xs[xs.length-1];
    g += '<line class="ch-trend" x1="'+X(x0).toFixed(1)+'" y1="'+Y(fit.a+fit.b*x0).toFixed(1)+'" x2="'+X(x1).toFixed(1)+'" y2="'+Y(fit.a+fit.b*x1).toFixed(1)+'"/>';
  }
  var d='', pen=false;
  pts.forEach(function(p,i){ if(p.y==null){ pen=false; return; } d += (pen?'L':'M')+X(i).toFixed(1)+' '+Y(p.y).toFixed(1)+' '; pen=true; });
  g += '<path class="ch-line" d="'+d+'"/>';
  pts.forEach(function(p,i){
    if(p.y==null) return;
    var cx=X(i), cy=Y(p.y);
    g += '<circle class="ch-dot" cx="'+cx.toFixed(1)+'" cy="'+cy.toFixed(1)+'" r="4.5"/>'+
         '<circle class="ch-hit" cx="'+cx.toFixed(1)+'" cy="'+cy.toFixed(1)+'" r="16" data-tip="'+esc(p.tip+': '+fmtV(p.y,m))+'" data-px="'+(cx/W*100).toFixed(2)+'" data-py="'+(cy/H*100).toFixed(2)+'"/>';
  });
  return '<div class="chart"><svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+esc(m.l)+' por partido">'+g+'</svg><div class="ch-tip" hidden></div></div>';
}
function metricChips(M, cur, key){
  return '<div class="chips" role="group" aria-label="Dato a analizar">'+Object.keys(M).map(function(k){
    return '<button data-do="'+key+':'+k+'" aria-pressed="'+(cur===k)+'">'+M[k].l+'</button>'; }).join("")+'</div>';
}
function lastVsAvg(pts, m){
  var ys = pts.map(function(p){return p.y;}).filter(function(v){return v!=null;});
  if(ys.length<4) return "";
  var avg = ys.reduce(function(a,b){return a+b;},0)/ys.length;
  var l3 = ys.slice(-3), a3 = l3.reduce(function(a,b){return a+b;},0)/3;
  return '<p class="muted small" style="margin:6px 0 0">Últimos 3 partidos: <b class="ink">'+fmtV(Math.round(a3*10)/10,m)+'</b> · Media de la temporada: <b class="ink">'+fmtV(Math.round(avg*10)/10,m)+'</b></p>';
}

/* ---------- Pestaña Estadísticas ---------- */
function viewStats(){
  var h = banner();
  if(U.player){ var pp = player(U.player); if(pp) return h + viewPlayerDetail(pp); U.player=null; }
  var team = U.stats!=="jugadores";
  h += '<div class="subbar"><div class="seg" role="group" aria-label="Estadísticas de"><button data-do="stats:equipo" aria-pressed="'+team+'">Equipo</button><button data-do="stats:jugadores" aria-pressed="'+(!team)+'">Jugadores</button></div>'+
    (team ? '' : '<div class="seg" role="group" aria-label="Tipo de cifras"><button data-do="season:avg" aria-pressed="'+(U.season==="avg")+'">Promedios</button><button data-do="season:tot" aria-pressed="'+(U.season!=="avg")+'">Totales</button></div>')+'</div>';
  var done = doneGames(S.games);
  if(!done.length) return h + '<section class="card"><h2>Estadísticas</h2><p class="muted">Aquí verás las estadísticas cuando termines el primer partido.</p></section>';
  return h + (team ? viewStatsTeam(done) : viewStatsPlayers(done));
}

function viewStatsTeam(done){
  var n = done.length, pf=0, pa=0, w=0, l=0;
  done.forEach(function(g){ var s=score(g); pf+=s.us; pa+=s.op; if(s.us>s.op) w++; else if(s.us<s.op) l++; });
  var s = calc(allEvents(done)), poss = possOf(s);
  var m = TEAM_M[U.mT] ? U.mT : "pf", M = TEAM_M[m];
  var pts = done.map(function(g){ return {x:shortDate(g.date), tip:shortDate(g.date)+' vs '+g.rival, y:M.get(g)}; });
  var tr = trendOf(pts, M);
  var h = '<section class="card"><div class="tiles">'+
    '<div class="tile"><b>'+n+'</b><span>Partidos jugados</span></div>'+
    '<div class="tile"><b>'+w+'–'+l+'</b><span>Victorias – derrotas</span></div>'+
    '<div class="tile"><b>'+f1(pf/n)+'</b><span>Puntos a favor por partido</span></div>'+
    '<div class="tile"><b>'+f1(pa/n)+'</b><span>Puntos en contra por partido</span></div>'+
    '<div class="tile"><b>'+fsign((pf-pa)/n,true)+'</b><span>Diferencia media</span></div></div></section>';
  h += '<section class="card"><div class="cardhead"><h2>Evolución · '+M.l+'</h2></div>'+metricChips(TEAM_M, m, "mT")+
    '<div class="trend">'+tr.html+'</div>'+chartSVG(pts, M, tr.fit)+
    '<p class="muted small" style="margin:4px 0 0">Cada punto es un partido. La línea discontinua es la tendencia.</p>'+lastVsAvg(pts, M)+'</section>';
  function kv(label, val, note){ return '<div class="kv"><span>'+label+(note?'<small>'+note+'</small>':'')+'</span><b>'+val+'</b></div>'; }
  h += '<div class="grid2"><section class="card"><h2>Promedios por partido</h2>'+
    kv("Puntos", f1(s.pts/n))+
    kv("Rebotes", f1(s.reb/n), f1(s.ro/n)+" ofensivos · "+f1(s.rd/n)+" defensivos")+
    kv("Asistencias", f1(s.as/n))+kv("Robos", f1(s.rb/n))+kv("Tapones", f1(s.tp/n))+
    kv("Pérdidas", f1(s.pe/n))+kv("Faltas", f1(s.fc/n))+
    kv("Tiros de 2", pct(s.t2m,s.t2a), f1(s.t2m/n)+" de "+f1(s.t2a/n))+
    kv("Triples", pct(s.t3m,s.t3a), f1(s.t3m/n)+" de "+f1(s.t3a/n))+
    kv("Tiros libres", pct(s.tlm,s.tla), f1(s.tlm/n)+" de "+f1(s.tla/n))+'</section>'+
    '<section class="card"><h2>Métricas avanzadas</h2>'+
    kv("eFG%", fpc(efg(s)), "Acierto en tiros de campo; el triple cuenta 1,5 veces")+
    kv("TS%", fpc(tsp(s)), "Acierto real, incluyendo los tiros libres")+
    kv("Posesiones por partido", f1(poss/n), "Estimadas con tiros, tiros libres, rebotes ofensivos y pérdidas")+
    kv("Puntos por 100 posesiones", poss>0?f1(100*s.pts/poss):"–", "Eficiencia en ataque")+
    kv("Recibidos por 100 posesiones", poss>0?f1(100*pa/poss):"–", "Eficiencia en defensa (se asume que el rival tiene las mismas posesiones)")+
    kv("Canastas asistidas", s.fgm?fpc(100*s.as/s.fgm):"–", "Porcentaje de canastas que vienen de una asistencia")+
    kv("Pérdidas por 100 posesiones", poss>0?f1(100*s.pe/poss):"–", "Cuidado del balón")+
    kv("Segundas oportunidades", (s.fga-s.fgm)?fpc(100*s.ro/(s.fga-s.fgm)):"–", "Rebotes ofensivos por cada 100 tiros de campo fallados")+
    kv("Tiros libres por tiro de campo", s.fga?f1(s.tla/s.fga).replace(/^0/,"0"):"–", "Capacidad para provocar faltas")+
    kv("Tiros de 3 sobre el total", s.fga?fpc(100*s.t3a/s.fga):"–", "Peso del triple en el juego")+'</section></div>';
  h += '<section class="card"><h2>Partido a partido</h2><div class="tbl-wrap"><table><thead><tr><th scope="col">Partido</th><th>Resultado</th><th>Dif.</th><th>%T2</th><th>%T3</th><th>%TL</th><th>eFG%</th><th>REB</th><th>AS</th><th>PE</th><th title="Puntos por 100 posesiones">Pts/100</th></tr></thead><tbody>'+
    done.slice().reverse().map(function(g){ var sc=score(g), t=calc(g.events), p=possOf(t);
      return '<tr><th scope="row"><button class="link plain" data-do="open-h:'+g.id+'">'+shortDate(g.date)+' · '+esc(g.rival)+'</button></th><td>'+sc.us+'–'+sc.op+'</td><td class="'+(sc.us>sc.op?"pos":sc.us<sc.op?"neg":"")+'">'+fsign(sc.us-sc.op)+'</td><td>'+pct(t.t2m,t.t2a)+'</td><td>'+pct(t.t3m,t.t3a)+'</td><td>'+pct(t.tlm,t.tla)+'</td><td>'+fpc(efg(t))+'</td><td>'+t.reb+'</td><td>'+t.as+'</td><td>'+t.pe+'</td><td>'+(p>0?f1(100*t.pts/p):"–")+'</td></tr>';
    }).join("")+'</tbody></table></div></section>';
  var L = {};
  done.forEach(function(g){ var t=track(g); Object.keys(t.lu).forEach(function(k){ var a=t.lu[k]; var b=L[k]||(L[k]={ids:a.ids,pf:0,pa:0}); b.pf+=a.pf; b.pa+=a.pa; }); });
  var lus = Object.keys(L).map(function(k){ return L[k]; }).filter(function(x){ return x.pf+x.pa>=6; }).sort(function(a,b){ return (b.pf-b.pa)-(a.pf-a.pa); }).slice(0,8);
  h += '<section class="card"><h2>Quintetos</h2><p class="muted small">Puntos anotados y recibidos con cada quinteto en pista. Se calcula con los cambios registrados en el partido.</p>'+
    (lus.length ? '<div class="tbl-wrap"><table><thead><tr><th scope="col">Quinteto</th><th>A favor</th><th>En contra</th><th>Diferencia</th></tr></thead><tbody>'+
      lus.map(function(x){ var ps=x.ids.map(player).filter(Boolean).sort(byNum);
        return '<tr><th scope="row">'+ps.map(function(p){ return '<span class="lu" title="'+esc(p.name)+'">'+p.num+'</span>'; }).join("")+'</th><td>'+x.pf+'</td><td>'+x.pa+'</td><td class="'+(x.pf>x.pa?"pos":x.pf<x.pa?"neg":"")+'">'+fsign(x.pf-x.pa)+'</td></tr>';
      }).join("")+'</tbody></table></div>' : '<p class="muted small">Aún no hay suficientes datos de quintetos.</p>')+'</section>';
  return h;
}


function viewStatsPlayers(done){
  var avg = U.season==="avg";
  function f(v,n){ return avg ? f1(v/n) : v; }
  var rows = seasonRows(S.players, done).sort(function(a,b){ return b.s.pts/b.n - a.s.pts/a.n; });
  var head = ["PJ","MIN","PTS","REB","AS","RB","TP","PE","FC","%T2","%T3","%TL","eFG%","TS%","AS/PE","+/-","VAL"];
  return '<section class="card"><h2>Jugadores · '+(avg?'promedio por partido':'totales de la temporada')+'</h2><p class="muted small">Toca un jugador para ver su análisis y su tendencia.</p><div class="tbl-wrap"><table><thead><tr><th scope="col">Jugador</th>'+
    head.map(function(x){ return '<th scope="col">'+x+'</th>'; }).join("")+'</tr></thead><tbody>'+
    rows.map(function(r){ var s=r.s, n=r.n;
      var pmv = r.pmn ? (avg ? fsign(r.pm/r.pmn,true) : fsign(r.pm)) : "–";
      var at = astTo(s);
      return '<tr><th scope="row"><button class="link plain" data-do="player:'+r.p.id+'"><span class="dn">'+r.p.num+'</span>'+esc(short(r.p.name))+'</button>'+(r.p.active?'':' <span class="muted">(baja)</span>')+'</th>'+
        [n, r.mnn ? (avg ? f1(r.mn/r.mnn) : r.mn) : "–", f(s.pts,n), f(s.reb,n), f(s.as,n), f(s.rb,n), f(s.tp,n), f(s.pe,n), f(s.fc,n), pct(s.t2m,s.t2a), pct(s.t3m,s.t3a), pct(s.tlm,s.tla), fpc(efg(s)), fpc(tsp(s)), at==null?"–":f1(at), pmv, f(s.val,n)].map(function(v,i){ return '<td'+(i===2?' class="hi"':'')+'>'+v+'</td>'; }).join("")+'</tr>';
    }).join("")+'</tbody></table></div>'+glossary()+'</section>';
}
function glossary(){
  return '<details class="gl"><summary>Qué significa cada dato</summary><dl>'+
    '<dt>eFG%</dt><dd>Acierto en tiros de campo dando a cada triple el valor de 1,5 tiros, porque vale más puntos.</dd>'+
    '<dt>TS%</dt><dd>Acierto real: puntos conseguidos respecto a todos los tiros, incluidos los tiros libres.</dd>'+
    '<dt>AS/PE</dt><dd>Asistencias por cada pérdida. Por encima de 2 es muy bueno para un base.</dd>'+
    '<dt>+/-</dt><dd>Diferencia de puntos (a favor menos en contra) mientras el jugador estaba en pista. Sale de los cambios que registras.</dd>'+
    '<dt>VAL</dt><dd>Valoración: puntos + rebotes + asistencias + robos + tapones − tiros fallados − pérdidas − faltas.</dd></dl></details>';
}

function viewPlayerDetail(p){
  var done = doneGames(S.games).filter(function(g){ return g.roster.indexOf(p.id)>=0; });
  var h = '<div class="subbar"><button class="btn" data-do="player-close">← Jugadores</button></div>';
  if(!done.length) return h+'<section class="card"><h2>#'+p.num+' '+esc(p.name)+'</h2><p class="muted">Todavía no ha jugado ningún partido finalizado.</p></section>';
  var r = seasonRows(S.players, done).filter(function(x){ return x.p.id===p.id; })[0], s=r.s, n=r.n;
  var m = PLAYER_M[U.mP] ? U.mP : "pts", M = PLAYER_M[m];
  var pts = done.map(function(g){ return {x:shortDate(g.date), tip:shortDate(g.date)+' vs '+g.rival, y:M.get(g,p.id)}; });
  var tr = trendOf(pts, M);
  h += '<section class="card"><p class="muted small" style="margin:0 0 2px">'+esc(p.pos)+(p.active?'':' · de baja')+'</p><h2>#'+p.num+' '+esc(p.name)+'</h2><div class="tiles">'+
    '<div class="tile"><b>'+n+'</b><span>Partidos</span></div>'+
    '<div class="tile"><b>'+f1(s.pts/n)+'</b><span>Puntos por partido</span></div>'+
    '<div class="tile"><b>'+f1(s.reb/n)+'</b><span>Rebotes por partido</span></div>'+
    '<div class="tile"><b>'+f1(s.as/n)+'</b><span>Asistencias por partido</span></div>'+
    '<div class="tile"><b>'+f1(s.val/n)+'</b><span>Valoración por partido</span></div>'+
    '<div class="tile"><b>'+fpc(tsp(s))+'</b><span>TS%</span></div>'+
    '<div class="tile"><b>'+(r.pmn?fsign(r.pm/r.pmn,true):"–")+'</b><span>Más/menos por partido</span></div>'+
    (r.mnn ? '<div class="tile"><b>'+f1(r.mn/r.mnn)+'</b><span>Minutos por partido</span></div>' : '')+
    (r.mn>0 ? '<div class="tile"><b>'+f1(40*per40(r,"pts"))+'</b><span>Puntos por 40 minutos</span></div><div class="tile"><b>'+f1(40*per40(r,"reb"))+'</b><span>Rebotes por 40 minutos</span></div>' : '')+'</div></section>';
  h += '<section class="card"><h2>Evolución · '+M.l+'</h2>'+metricChips(PLAYER_M, m, "mP")+
    '<div class="trend">'+tr.html+'</div>'+chartSVG(pts, M, tr.fit)+
    '<p class="muted small" style="margin:4px 0 0">Cada punto es un partido. La línea discontinua es la tendencia.</p>'+lastVsAvg(pts, M)+'</section>';
  h += '<section class="card"><h2>Partido a partido</h2><div class="tbl-wrap"><table><thead><tr><th scope="col">Partido</th><th>MIN</th><th>PTS</th><th>T2</th><th>T3</th><th>TL</th><th>REB</th><th>AS</th><th>RB</th><th>TP</th><th>PE</th><th>FC</th><th>+/-</th><th>VAL</th></tr></thead><tbody>'+
    done.slice().reverse().map(function(g){ var t=calc(g.events,p.id), tk=track(g);
      return '<tr><th scope="row"><button class="link plain" data-do="open-h:'+g.id+'">'+shortDate(g.date)+' · '+esc(g.rival)+'</button></th><td>'+(g.min&&g.min[p.id]!=null?g.min[p.id]:"–")+'</td><td class="hi">'+t.pts+'</td><td>'+t.t2m+'/'+t.t2a+'</td><td>'+t.t3m+'/'+t.t3a+'</td><td>'+t.tlm+'/'+t.tla+'</td><td>'+t.reb+'</td><td>'+t.as+'</td><td>'+t.rb+'</td><td>'+t.tp+'</td><td>'+t.pe+'</td><td>'+t.fc+'</td><td>'+(tk.tracked?fsign(tk.pm[p.id]||0):"–")+'</td><td>'+t.val+'</td></tr>';
    }).join("")+'</tbody></table></div>'+glossary()+'</section>';
  return h;
}


/* ---------- Editar acta (minutos y cualquier estadística) ---------- */

function viewEditGame(g){
  var d = U.draft, t = draftTotals(d);
  var ps = d.roster.map(player).filter(Boolean).sort(byNum);
  var others = S.players.filter(function(p){ return p.active && d.roster.indexOf(p.id)<0; }).sort(byNum);
  var h = '<div class="subbar"><button class="btn" data-do="edit-cancel">← Salir sin guardar</button><button class="btn primary" type="submit" form="f-edit">Guardar cambios</button></div>';
  if(U.justFinished===g.id) h += '<div class="banner ok"><span><b>Partido finalizado.</b> Apunta los minutos de cada jugador y corrige lo que haga falta. Después podrás exportar el PDF.</span></div>';
  h += '<form id="f-edit" class="stack" novalidate>';
  h += '<div class="grid2"><section class="card"><h2>Datos del partido</h2><div class="row">'+
    '<label for="ed-rival">Rival<input id="ed-rival" data-ed="rival" maxlength="40" value="'+esc(d.rival)+'"></label>'+
    '<label for="ed-date">Fecha<input id="ed-date" type="date" data-ed="date" value="'+esc(d.date)+'"></label>'+
    '<label for="ed-place">Lugar<select id="ed-place" data-ed="place"><option'+(d.place==="Local"?" selected":"")+'>Local</option><option'+(d.place==="Visitante"?" selected":"")+'>Visitante</option></select></label></div>'+
    '<p class="edscore">Resultado: <b id="ed-us">'+t.us+'</b> – <b id="ed-op">'+t.op+'</b></p></section>'+
    '<section class="card"><h2>Puntos del rival por cuarto</h2><div class="qedit">';
  for(var q=1;q<=d.nq;q++) h += '<label for="ed-q'+q+'">'+QL[q-1]+'<input id="ed-q'+q+'" type="number" inputmode="numeric" min="0" data-ed="opp:'+q+'" value="'+esc(d.opp[q])+'"></label>';
  h += '</div>'+(d.nq<5 ? '<button class="btn sm" type="button" data-do="edit-addq">Añadir prórroga</button>' : '')+'</section></div>';
  h += '<section class="card"><h2>Estadísticas de los jugadores</h2><p class="muted small">Los puntos se calculan solos a partir de los tiros. Deja los minutos en blanco si no los sabes.</p>'+
    '<div class="tbl-wrap"><table class="edt"><thead><tr><th scope="col">Jugador</th><th scope="col" class="minc">MIN</th>'+
    EF.map(function(f){ return '<th scope="col">'+EF_LBL[f]+'</th>'; }).join("")+'<th scope="col">PTS</th></tr></thead><tbody>'+
    ps.map(function(p){ var r = d.p[p.id];
      return '<tr><th scope="row"><span class="dn">'+p.num+'</span>'+esc(short(p.name))+'</th>'+
        '<td class="minc"><input type="number" inputmode="numeric" min="0" max="70" aria-label="Minutos de '+esc(p.name)+'" data-ed="p:'+p.id+':min" value="'+esc(r.min)+'" placeholder="–"></td>'+
        EF.map(function(f){ return '<td><input type="number" inputmode="numeric" min="0" aria-label="'+EF_LBL[f]+' de '+esc(p.name)+'" data-ed="p:'+p.id+':'+f+'" value="'+esc(r[f])+'"></td>'; }).join("")+
        '<td class="hi" id="ed-pts-'+p.id+'">'+rowPts(r)+'</td></tr>';
    }).join("")+'</tbody></table></div>'+
    (others.length ? '<div class="row addp"><label for="ed-add">Añadir un jugador a este partido<select id="ed-add">'+others.map(function(p){ return '<option value="'+p.id+'">#'+p.num+' '+esc(p.name)+'</option>'; }).join("")+'</select></label><button class="btn" type="button" data-do="edit-addp">Añadir</button></div>' : '')+
    '</section><p class="err" id="ed-err" role="alert"></p>'+
    '<div class="btns"><button class="btn primary" type="submit">Guardar cambios</button><button class="btn" type="button" data-do="edit-cancel">Salir sin guardar</button></div></form>';
  return h;
}

function onEditInput(el){
  var d = U.draft; if(!d) return;
  var k = el.getAttribute("data-ed").split(":");
  if(k[0]==="rival" || k[0]==="date" || k[0]==="place") d[k[0]] = el.value;
  else if(k[0]==="opp") d.opp[k[1]] = el.value;
  else if(k[0]==="p"){ d.p[k[1]][k[2]] = el.value; var c=document.getElementById("ed-pts-"+k[1]); if(c) c.textContent = rowPts(d.p[k[1]]); }
  var t = draftTotals(d), a=document.getElementById("ed-us"), b=document.getElementById("ed-op");
  if(a) a.textContent=t.us; if(b) b.textContent=t.op;
}

function saveEdit(){
  var d = U.draft, g = gameById(d.id), err = document.getElementById("ed-err");
  if(!g) return;
  var msg = validateDraft(d, player);
  if(msg){ err.textContent = msg; err.scrollIntoView({block:"center"}); return; }
  applyDraft(g, d);
  U.draft=null; U.justFinished=null; save(); render(); window.scrollTo(0,0);
  toast("Cambios guardados", null);
}

function renderTabbar(){
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

function renderModal(){
  var m = U.modal; if(!m) return "";
  return '<div class="modal-bg" role="dialog" aria-modal="true" aria-labelledby="m-t"><div class="modal"><h3 id="m-t">'+esc(m.title)+'</h3>'+
    (m.html || '<p>'+esc(m.body)+'</p>')+'<div class="btns">'+
    (m.copy ? '<button class="btn" data-do="copy">Copiar</button>' : '')+
    (m.fn ? '<button class="btn'+(m.cancel?' primary':'')+'" data-do="modal-cancel">'+esc(m.cancel||"Cancelar")+'</button>' : '')+
    '<button class="btn '+(m.danger?'dangerfill':(m.cancel?'':'primary'))+'" data-do="modal-ok">'+esc(m.ok||"Aceptar")+'</button></div></div></div>';
}

function render(){
  var main;
  if(U.tab==="jugadores") main = viewJugadores();
  else if(U.tab==="historial") main = viewHistorial();
  else if(U.tab==="estadisticas") main = viewStats();
  else main = viewPartido();
  document.getElementById("app").innerHTML = renderTop()+'<main>'+main+'</main>'+renderTabbar()+renderModal();
  var ok = document.querySelector(U.modal && U.modal.cancel ? '.modal [data-do="modal-cancel"]' : '.modal [data-do="modal-ok"]'); if(ok) ok.focus();
}

var toastTimer = null;
function paintToast(){
  var el = document.getElementById("toast");
  el.innerHTML = U.toast ? '<div class="toast"><span>'+esc(U.toast.msg)+'</span>'+(U.toast.id?'<button data-do="undo-ev:'+U.toast.id+'">Deshacer</button>':'')+'</div>' : "";
}
function toast(msg, id){
  U.toast = {msg:msg, id:id}; paintToast();
  clearTimeout(toastTimer); toastTimer = setTimeout(function(){ U.toast=null; paintToast(); }, 3500);
}
function buzz(){ try{ if(navigator.vibrate) navigator.vibrate(12); }catch(e){} }

function confirmBox(title, body, ok, danger, fn){ U.modal = {title:title, body:body, ok:ok, danger:danger, fn:fn}; render(); }

/* Exportar */
var downloads = null;
(function(){ try{ if(window.claude && typeof window.claude.use==="function"){ window.claude.use("downloads").then(function(d){ downloads=d; }).catch(function(){}); } }catch(e){} })();
function exportFile(name, data, mime){
  var isText = typeof data==="string";
  function fallback(){
    try{ var a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([data],{type:mime})); a.download=name; document.body.appendChild(a); a.click(); setTimeout(function(){ a.remove(); },100); }catch(e){}
    if(isText) U.modal = {title:"Guardar datos", html:'<p class="muted small">Si el archivo no se ha descargado, copia este texto y guárdalo en una nota o en un archivo llamado '+esc(name)+'.</p><textarea id="cp" readonly rows="8">'+esc(data)+'</textarea>', ok:"Cerrar", copy:true};
    else U.modal = {title:"Descarga", body:"Si el archivo "+name+" no se ha descargado, abre la app directamente en el navegador (fuera del chat) y vuelve a intentarlo.", ok:"Entendido"};
    render();
  }
  if(downloads){
    downloads.save({filename:name, data: isText ? data : new Blob([data],{type:mime})}).catch(function(err){
      if(err && err.code==="declined") return;
      if(err && err.code==="rate_limited"){ U.modal={title:"Espera un momento", body:"Ya hay una descarga pendiente de confirmar.", ok:"Entendido"}; render(); return; }
      fallback();
    });
  } else fallback();
}


/* ---------- Acciones ---------- */
function go(tab){ U.draft=null; U.justFinished=null; U.player=null; U.bench=null; U.toast=null; paintToast(); U.tab=tab; U.game=null; U.edit=null; if(location.hash!=="#"+tab){ try{ location.hash=tab; }catch(e){} } render(); window.scrollTo(0,0); }
window.addEventListener("hashchange", function(){ var h=location.hash.slice(1); if(h==="temporada") h="estadisticas"; if(TABS.indexOf(h)>=0 && h!==U.tab){ U.tab=h; U.game=null; render(); } });

document.addEventListener("click", function(e){
  var b = e.target.closest("[data-do]"); if(!b) return;
  var raw = b.getAttribute("data-do"), i = raw.indexOf(":");
  var k = i<0 ? raw : raw.slice(0,i), v = i<0 ? "" : raw.slice(i+1);
  var g = liveGame();
  switch(k){
    case "tab": go(v); break;
    case "sel": U.sel = U.sel===v ? null : v; render(); break;
    case "court":
      if(!g) return;
      if(U.bench){
        var oc1 = ensureCourt(g, player), k1 = oc1.indexOf(v); if(k1<0) return;
        var inId = U.bench; oc1[k1] = inId; var se = addSub(g, inId, v); U.bench=null; U.sel=null; save(); render(); buzz();
        toast("Cambio: entra "+tag(inId)+", sale "+tag(v), se.id);
      } else { U.sel = U.sel===v ? null : v; render(); }
      break;
    case "bench":
      if(!g) return;
      var oc2 = ensureCourt(g, player), free = oc2.indexOf(null); U.sel=null;
      if(free>=0){ oc2[free]=v; var se2 = addSub(g, v, null); U.bench=null; save(); render(); buzz(); toast("Entra a pista "+tag(v), se2.id); }
      else { U.bench = U.bench===v ? null : v; render(); }
      break;
    case "cancel-sub": U.bench=null; render(); break;
    case "tobench":
      if(!g) return;
      var oc3 = ensureCourt(g, player), k3 = oc3.indexOf(v); if(k3<0) return;
      oc3[k3]=null; var se3 = addSub(g, null, v); U.sel=null; save(); render(); toast("Al banquillo "+tag(v), se3.id); break;
    case "act":
      if(!g || !U.sel) return;
      var ev = {id:uid(), p:U.sel, a:v, q:g.q, t:Date.now()}; g.events.push(ev);
      var p = player(U.sel); U.sel = null; save(); render(); buzz();
      toast("#"+p.num+" "+short(p.name)+" · "+ACT[v].t, ev.id); break;
    case "opp":
      if(!g) return;
      var oe = {id:uid(), p:null, a:"OPP", pts:+v, q:g.q, t:Date.now()}; g.events.push(oe); save(); render(); buzz();
      toast(g.rival+" +"+v, oe.id); break;
    case "q": if(g){ g.q=+v; save(); render(); } break;
    case "undo": if(g){ var lv = g.events.filter(function(e){ return e.a!=="ADJ" && e.a!=="OPPADJ"; }); if(lv.length){ removeEv(g, lv[lv.length-1].id, player); save(); render(); } } break;
    case "undo-ev": case "delev":
      if(g){ removeEv(g, v, player); save(); render(); }
      if(k==="undo-ev"){ U.toast=null; paintToast(); } break;
    case "sub": U.sub=v; render(); break;
    case "finish":
      var fs = score(g);
      U.modal = {title:"¿Seguro que quieres finalizar el partido?", body:"Marcador: "+S.team+" "+fs.us+" – "+fs.op+" "+g.rival+" ("+QL[g.q-1]+"). Si has pulsado por error, sigue anotando. Al finalizar ya no podrás anotar jugada a jugada, pero sí apuntar los minutos y corregir las estadísticas.", ok:"Sí, finalizar", cancel:"No, seguir anotando", fn:function(){
        g.done=true; S.liveId=null; U.tab="historial"; U.game=g.id; U.sel=null; U.draft=makeDraft(g); U.justFinished=g.id; try{ location.hash="historial"; }catch(e){}
      }}; render(); break;
    case "edit": U.edit=v; render(); window.scrollTo(0,0); var n=document.getElementById("p-name"); if(n) n.focus(); break;
    case "cancel-edit": U.edit=null; render(); break;
    case "delp":
      var pl = player(v); if(!pl) return;
      var used = S.games.some(function(gm){ return gm.events.some(function(x){ return x.p===v; }); });
      if(used) confirmBox("Dar de baja a "+pl.name, "Tiene estadísticas guardadas, así que se conservarán en el historial. Dejará de aparecer en los nuevos partidos.", "Dar de baja", true, function(){ pl.active=false; if(U.edit===v) U.edit=null; });
      else confirmBox("Quitar a "+pl.name, "Se eliminará de la plantilla.", "Quitar", true, function(){
        S.players = S.players.filter(function(x){ return x.id!==v; });
        S.games.forEach(function(gm){ gm.roster = gm.roster.filter(function(x){ return x!==v; }); if(gm.onCourt) gm.onCourt = gm.onCourt.map(function(x){ return x===v ? null : x; }); });
        if(U.edit===v) U.edit=null;
      });
      break;
    case "restore": var rp=player(v); if(rp){ rp.active=true; save(); render(); } break;
    case "open": U.game=v; render(); window.scrollTo(0,0); break;
    case "close": U.game=null; render(); break;
    case "delg":
      confirmBox("Borrar partido", "Se borrará el partido y todas sus estadísticas. No se puede deshacer.", "Borrar", true, function(){
        S.games = S.games.filter(function(x){ return x.id!==v; }); if(S.liveId===v) S.liveId=null; U.game=null;
      }); break;
    case "csv": var cg=gameById(v); if(cg) exportFile("partido-"+cg.date+"-"+cg.rival.replace(/[^\wáéíóúñ-]+/gi,"-")+".csv", csvOf(cg, player), "text/csv"); break;
    case "export": exportFile("baloncesto-copia-"+today()+".json", JSON.stringify(S), "application/json"); break;
    case "import": var fi=document.getElementById("imp"); if(fi) fi.click(); break;
    case "clear-sample":
      confirmBox("Borrar datos de ejemplo", "Se quitarán los jugadores y partidos de ejemplo. Lo que hayas añadido tú se mantiene.", "Borrar ejemplo", true, function(){
        S.players = S.players.filter(function(x){ return !x.sample; });
        S.games = S.games.filter(function(x){ return !x.sample; });
        if(!liveGame()) S.liveId=null;
        S.sample=false; U.sel=null; U.game=null; U.tab="jugadores"; try{ location.hash="jugadores"; }catch(e){}
      }); break;
    case "season": U.season=v; render(); break;
    case "edit-game": var eg=gameById(v); if(eg){ U.draft=makeDraft(eg); U.justFinished=null; render(); window.scrollTo(0,0); } break;
    case "edit-cancel": U.draft=null; U.justFinished=null; render(); window.scrollTo(0,0); break;
    case "edit-addq": if(U.draft && U.draft.nq<5){ U.draft.nq++; U.draft.opp[U.draft.nq]=0; render(); } break;
    case "edit-addp":
      var sel2=document.getElementById("ed-add"); if(!U.draft || !sel2) return;
      var nid=sel2.value; if(U.draft.roster.indexOf(nid)<0){ U.draft.roster.push(nid); var eg2=gameById(U.draft.id); U.draft.p[nid]=draftRow(eg2,nid); }
      render(); break;
    case "stats": U.stats=v; U.player=null; render(); break;
    case "player": U.player=v; render(); window.scrollTo(0,0); break;
    case "player-close": U.player=null; render(); break;
    case "mT": U.mT=v; render(); break;
    case "mP": U.mP=v; render(); break;
    case "open-h": U.tab="historial"; U.game=v; U.player=null; try{ location.hash="historial"; }catch(e){} render(); window.scrollTo(0,0); break;
    case "pdf":
      var pg = gameById(v); if(!pg) return;
      try{ exportFile("partido-"+pg.date+"-"+pg.rival.replace(/[^\wáéíóúñ-]+/gi,"-")+".pdf", pdfGame(pg, S.team, player), "application/pdf"); }
      catch(err){ U.modal={title:"No se pudo crear el PDF", body:"Ha ocurrido un error al generar el archivo. Prueba otra vez.", ok:"Entendido"}; render(); }
      break;

    case "modal-ok": var fn = U.modal && U.modal.fn; U.modal=null; if(fn) fn(); save(); render(); break;
    case "modal-cancel": U.modal=null; render(); break;
    case "copy":
      var ta=document.getElementById("cp"); if(!ta) return;
      try{ navigator.clipboard.writeText(ta.value).then(function(){ b.textContent="Copiado"; }).catch(function(){ ta.select(); b.textContent="Selecciona y copia"; }); }
      catch(err){ ta.select(); }
      break;
  }
});

document.addEventListener("submit", function(e){
  e.preventDefault();
  var f = e.target;
  if(f.id==="f-edit"){ saveEdit(); return; }
  if(f.id==="f-game"){
    var roster = Array.prototype.map.call(f.querySelectorAll('input[type="checkbox"]:checked'), function(x){ return x.value; });
    if(!roster.length){ document.getElementById("g-err").textContent="Marca al menos un jugador convocado."; return; }
    var g = {id:uid(), rival:(document.getElementById("g-rival").value.trim()||"Rival"), date:(document.getElementById("g-date").value||today()),
      place:document.getElementById("g-place").value, roster:roster, events:[], q:1, done:false, onCourt:[null,null,null,null,null]};
    S.games.push(g); S.liveId=g.id; U.sub="anotar"; U.sel=null; save(); render(); window.scrollTo(0,0);
  }
  if(f.id==="f-player"){
    var err = document.getElementById("p-err");
    var numS = document.getElementById("p-num").value.trim(), name = document.getElementById("p-name").value.trim(), pos = document.getElementById("p-pos").value;
    var num = parseInt(numS,10);
    if(numS==="" || isNaN(num) || num<0 || num>99){ err.textContent="Escribe un dorsal entre 0 y 99."; document.getElementById("p-num").focus(); return; }
    if(!name){ err.textContent="Escribe el nombre del jugador."; document.getElementById("p-name").focus(); return; }
    var dup = S.players.filter(function(p){ return p.active && p.num===num && p.id!==U.edit; })[0];
    if(dup){ err.textContent="El dorsal "+num+" ya lo tiene "+dup.name+"."; document.getElementById("p-num").focus(); return; }
    if(U.edit){ var p=player(U.edit); if(p){ p.num=num; p.name=name; p.pos=pos; } U.edit=null; }
    else S.players.push({id:uid(), num:num, name:name, pos:pos, active:true});
    save(); render(); var pn=document.getElementById("p-num"); if(pn) pn.focus();
  }
  if(f.id==="f-team"){
    S.team = document.getElementById("t-name").value.trim() || "Mi equipo"; save(); render();
  }
});

document.addEventListener("input", function(e){ if(e.target.getAttribute && e.target.getAttribute("data-ed")) onEditInput(e.target); });
document.addEventListener("change", function(e){
  if(e.target.getAttribute && e.target.getAttribute("data-ed")){ onEditInput(e.target); return; }
  if(e.target.id!=="imp") return;
  var file = e.target.files && e.target.files[0]; if(!file) return;
  var rd = new FileReader();
  rd.onload = function(){
    try{
      var d = JSON.parse(rd.result);
      if(!d || !Array.isArray(d.players) || !Array.isArray(d.games)) throw new Error("formato");
      confirmBox("Importar copia", "La copia tiene "+d.players.length+" jugadores y "+d.games.length+" partidos. Sustituirá a todos los datos actuales.", "Importar", true, function(){
        S = {v:1, team:d.team||"Mi equipo", players:d.players, games:d.games, liveId:d.liveId||null, sample:!!d.sample};
        U.sel=null; U.game=null; U.edit=null;
      });
    }catch(err){
      U.modal = {title:"No se pudo importar", body:"El archivo no es una copia de esta app. Elige el archivo .json que exportaste desde aquí.", ok:"Entendido"}; render();
    }
  };
  rd.readAsText(file);
  e.target.value = "";
});

function showTip(el){
  var wrap = el.closest(".chart"); if(!wrap) return; var tip = wrap.querySelector(".ch-tip");
  tip.textContent = el.getAttribute("data-tip"); tip.style.left = el.getAttribute("data-px")+"%"; tip.style.top = el.getAttribute("data-py")+"%"; tip.hidden = false;
}
document.addEventListener("pointerover", function(e){ var h = e.target.closest && e.target.closest(".ch-hit"); if(h) showTip(h); });
document.addEventListener("pointerout", function(e){ var h = e.target.closest && e.target.closest(".ch-hit"); if(h){ var t=h.closest(".chart").querySelector(".ch-tip"); if(t) t.hidden=true; } });
document.addEventListener("click", function(e){ var h = e.target.closest && e.target.closest(".ch-hit"); if(h) showTip(h); });
document.addEventListener("keydown", function(e){ if(e.key==="Escape" && U.modal){ U.modal=null; render(); } });

render();
})();
