// Cálculo de estadísticas a partir de los eventos (copiado del prototipo sin cambios)
import { ACT } from "./constants.js";

export function calc(events, pid){
  var s={pts:0,t2m:0,t2a:0,t3m:0,t3a:0,tlm:0,tla:0,ro:0,rd:0,as:0,rb:0,tp:0,pe:0,fc:0};
  for(var i=0;i<events.length;i++){
    var e=events[i];
    if(e.p==null) continue;
    if(pid!==undefined && e.p!==pid) continue;
    if(e.a==="ADJ"){ for(var k in e.d){ if(s.hasOwnProperty(k)) s[k]+=e.d[k]; } s.pts += 2*(e.d.t2m||0)+3*(e.d.t3m||0)+(e.d.tlm||0); continue; }
    switch(e.a){
      case "2A": s.t2m++; s.t2a++; s.pts+=2; break;
      case "2F": s.t2a++; break;
      case "3A": s.t3m++; s.t3a++; s.pts+=3; break;
      case "3F": s.t3a++; break;
      case "1A": s.tlm++; s.tla++; s.pts+=1; break;
      case "1F": s.tla++; break;
      case "RO": s.ro++; break; case "RD": s.rd++; break;
      case "AS": s.as++; break; case "RB": s.rb++; break;
      case "TP": s.tp++; break; case "PE": s.pe++; break; case "FC": s.fc++; break;
    }
  }
  s.reb = s.ro+s.rd; s.fgm = s.t2m+s.t3m; s.fga = s.t2a+s.t3a;
  s.val = s.pts+s.reb+s.as+s.rb+s.tp-(s.fga-s.fgm)-(s.tla-s.tlm)-s.pe-s.fc;
  return s;
}

export function score(g, q){
  var us=0, op=0;
  for(var i=0;i<g.events.length;i++){
    var e=g.events[i];
    if(q && e.q!==q) continue;
    if(e.a==="OPP" || e.a==="OPPADJ") op+=e.pts;
    else if(e.a==="ADJ") us += 2*(e.d.t2m||0)+3*(e.d.t3m||0)+(e.d.tlm||0);
    else if(ACT[e.a] && ACT[e.a].pts) us+=ACT[e.a].pts;
  }
  return {us:us,op:op};
}

export function maxQ(g){ var m=Math.max(4, g.q||1); g.events.forEach(function(e){ if(e.q>m) m=e.q; }); return m; }

export function efg(s){ return s.fga ? 100*(s.fgm+0.5*s.t3m)/s.fga : null; }
export function tsp(s){ var d = 2*(s.fga+0.44*s.tla); return d ? 100*s.pts/d : null; }
export function possOf(s){ return s.fga + 0.44*s.tla - s.ro + s.pe; }
export function astTo(s){ return s.pe ? s.as/s.pe : null; }
export function doneGames(games){ return games.filter(function(g){ return g.done; }).sort(function(a,b){ return a.date.localeCompare(b.date); }); }
export function allEvents(gs){ var e=[]; gs.forEach(function(g){ e = e.concat(g.events); }); return e; }

/* Más/menos y quintetos: se reconstruye quién estaba en pista con los cambios registrados */
export function track(g){
  var on=[], pm={}, lu={}, tracked=false;
  g.events.forEach(function(e){
    if(e.a==="SUB"){
      tracked = true;
      if(e.out){ var i=on.indexOf(e.out); if(i>=0) on.splice(i,1); }
      if(e["in"] && on.indexOf(e["in"])<0) on.push(e["in"]);
      return;
    }
    var pts=0, ours=false;
    if(e.a==="OPP") pts=e.pts; else if(ACT[e.a] && ACT[e.a].pts){ pts=ACT[e.a].pts; ours=true; }
    if(!pts) return;
    on.forEach(function(id){ pm[id] = (pm[id]||0) + (ours?pts:-pts); });
    if(on.length===5){
      var k = on.slice().sort().join(",");
      var L = lu[k] || (lu[k] = {ids:on.slice(), pf:0, pa:0});
      if(ours) L.pf+=pts; else L.pa+=pts;
    }
  });
  return {pm:pm, lu:lu, tracked:tracked};
}
