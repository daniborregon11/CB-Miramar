// Pestaña Estadísticas: equipo, jugadores y análisis individual
import { byNum, esc, f1, fmtV, fpc, fsign, pct, short, shortDate } from "../logic/format.js";
import { PLAYER_M, TEAM_M, per40, seasonRows } from "../logic/metrics.js";
import { allEvents, astTo, calc, doneGames, efg, possOf, score, track, tsp } from "../logic/stats.js";
import { trendInfo } from "../logic/trend.js";
import { S, U, player } from "../state.js";
import { banner } from "../ui/banner.js";
import { chartSVG } from "../ui/chart.js";

export function trendOf(pts, m){
  var t = trendInfo(pts, m);
  if(t.kind==="few") return {fit:null, html:'<span class="pill">Faltan datos</span> <span class="muted small">La tendencia se calcula a partir de 3 partidos.</span>'};
  if(t.kind==="stable") return {fit:t.fit, html:'<span class="pill">Estable</span> <span class="muted small">Sin cambios claros a lo largo de los partidos.</span>'};
  var up = t.kind==="up";
  return {fit:t.fit, html:'<span class="pill '+(t.good?"w":"l")+'">'+(up?"↗ Al alza":"↘ A la baja")+'</span> <span class="small">'+(up?"+":"−")+f1(Math.abs(t.fit.b))+' '+m.u+' por partido de media</span>'};
}
export function metricChips(M, cur, key){
  return '<div class="chips" role="group" aria-label="Dato a analizar">'+Object.keys(M).map(function(k){
    return '<button data-do="'+key+':'+k+'" aria-pressed="'+(cur===k)+'">'+M[k].l+'</button>'; }).join("")+'</div>';
}
export function lastVsAvg(pts, m){
  var ys = pts.map(function(p){return p.y;}).filter(function(v){return v!=null;});
  if(ys.length<4) return "";
  var avg = ys.reduce(function(a,b){return a+b;},0)/ys.length;
  var l3 = ys.slice(-3), a3 = l3.reduce(function(a,b){return a+b;},0)/3;
  return '<p class="muted small" style="margin:6px 0 0">Últimos 3 partidos: <b class="ink">'+fmtV(Math.round(a3*10)/10,m)+'</b> · Media de la temporada: <b class="ink">'+fmtV(Math.round(avg*10)/10,m)+'</b></p>';
}

/* ---------- Pestaña Estadísticas ---------- */
export function viewStats(){
  var h = banner();
  if(U.player){ var pp = player(U.player); if(pp) return h + viewPlayerDetail(pp); U.player=null; }
  var team = U.stats!=="jugadores";
  h += '<div class="subbar"><div class="seg" role="group" aria-label="Estadísticas de"><button data-do="stats:equipo" aria-pressed="'+team+'">Equipo</button><button data-do="stats:jugadores" aria-pressed="'+(!team)+'">Jugadores</button></div>'+
    (team ? '' : '<div class="seg" role="group" aria-label="Tipo de cifras"><button data-do="season:avg" aria-pressed="'+(U.season==="avg")+'">Promedios</button><button data-do="season:tot" aria-pressed="'+(U.season!=="avg")+'">Totales</button></div>')+'</div>';
  var done = doneGames(S.games);
  if(!done.length) return h + '<section class="card"><h2>Estadísticas</h2><p class="muted">Aquí verás las estadísticas cuando termines el primer partido.</p></section>';
  return h + (team ? viewStatsTeam(done) : viewStatsPlayers(done));
}

export function viewStatsTeam(done){
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


export function viewStatsPlayers(done){
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
export function glossary(){
  return '<details class="gl"><summary>Qué significa cada dato</summary><dl>'+
    '<dt>eFG%</dt><dd>Acierto en tiros de campo dando a cada triple el valor de 1,5 tiros, porque vale más puntos.</dd>'+
    '<dt>TS%</dt><dd>Acierto real: puntos conseguidos respecto a todos los tiros, incluidos los tiros libres.</dd>'+
    '<dt>AS/PE</dt><dd>Asistencias por cada pérdida. Por encima de 2 es muy bueno para un base.</dd>'+
    '<dt>+/-</dt><dd>Diferencia de puntos (a favor menos en contra) mientras el jugador estaba en pista. Sale de los cambios que registras.</dd>'+
    '<dt>VAL</dt><dd>Valoración: puntos + rebotes + asistencias + robos + tapones − tiros fallados − pérdidas − faltas.</dd></dl></details>';
}

export function viewPlayerDetail(p){
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
