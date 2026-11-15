// Ficha de un partido: parciales y tabla por jugador (Partido > Ficha e Historial)
import { QL, TITLES } from "../logic/constants.js";
import { byNum, esc, fsign, pct, short } from "../logic/format.js";
import { calc, maxQ, score, track } from "../logic/stats.js";
import { S, player } from "../state.js";

export function boxScore(g){
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

export function quarterTable(g){
  var maxq = maxQ(g);
  var qs=[]; for(var i=1;i<=maxq;i++) qs.push(i);
  var t = score(g), sq = 0; qs.forEach(function(q){ sq += score(g,q).us; });
  var adj = t.us - sq;
  return '<div class="tbl-wrap"><table class="qt"><thead><tr><th scope="col">Parcial</th>'+qs.map(function(q){ return '<th scope="col">'+QL[q-1]+'</th>'; }).join("")+(adj?'<th scope="col" title="Puntos añadidos o quitados al corregir el acta">Correcc.</th>':'')+'<th scope="col">Total</th></tr></thead><tbody>'+
    '<tr><th scope="row">'+esc(S.team)+'</th>'+qs.map(function(q){ return '<td>'+score(g,q).us+'</td>'; }).join("")+(adj?'<td>'+fsign(adj)+'</td>':'')+'<td><b>'+t.us+'</b></td></tr>'+
    '<tr><th scope="row">'+esc(g.rival)+'</th>'+qs.map(function(q){ return '<td>'+score(g,q).op+'</td>'; }).join("")+(adj?'<td></td>':'')+'<td><b>'+t.op+'</b></td></tr></tbody></table></div>';
}

export function resultPill(g){
  if(g.id===S.liveId) return '<span class="pill live">En juego</span>';
  var s = score(g);
  return s.us>s.op ? '<span class="pill w">Victoria</span>' : s.us<s.op ? '<span class="pill l">Derrota</span>' : '<span class="pill">Empate</span>';
}
