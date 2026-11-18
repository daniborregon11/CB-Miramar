// Datos que se pueden analizar en las gráficas y tablas de temporada (del prototipo)
import { fmtMin } from "./format.js";
import { calc, score, track, efg, tsp, possOf, allEvents } from "./stats.js";

export var TEAM_M = {
  pf:{l:"Puntos a favor", u:"puntos", hb:1, get:function(g){ return score(g).us; }},
  pa:{l:"Puntos en contra", u:"puntos", hb:-1, get:function(g){ return score(g).op; }},
  dif:{l:"Diferencia", u:"puntos", hb:1, zero:1, get:function(g){ var s=score(g); return s.us-s.op; }},
  efg:{l:"eFG%", u:"puntos de %", hb:1, suf:"%", get:function(g){ return efg(calc(g.events)); }},
  reb:{l:"Rebotes", u:"rebotes", hb:1, get:function(g){ return calc(g.events).reb; }},
  as:{l:"Asistencias", u:"asistencias", hb:1, get:function(g){ return calc(g.events).as; }},
  pe:{l:"Pérdidas", u:"pérdidas", hb:-1, get:function(g){ return calc(g.events).pe; }},
  ortg:{l:"Puntos por 100 posesiones", u:"puntos", hb:1, get:function(g){ var s=calc(g.events), p=possOf(s); return p>0 ? 100*s.pts/p : null; }}
};
export var PLAYER_M = {
  pts:{l:"Puntos", u:"puntos", hb:1, get:function(g,id){ return calc(g.events,id).pts; }},
  val:{l:"Valoración", u:"de valoración", hb:1, zero:1, get:function(g,id){ return calc(g.events,id).val; }},
  reb:{l:"Rebotes", u:"rebotes", hb:1, get:function(g,id){ return calc(g.events,id).reb; }},
  as:{l:"Asistencias", u:"asistencias", hb:1, get:function(g,id){ return calc(g.events,id).as; }},
  pe:{l:"Pérdidas", u:"pérdidas", hb:-1, get:function(g,id){ return calc(g.events,id).pe; }},
  efg:{l:"eFG%", u:"puntos de %", hb:1, suf:"%", get:function(g,id){ return efg(calc(g.events,id)); }},
  ts:{l:"TS%", u:"puntos de %", hb:1, suf:"%", get:function(g,id){ return tsp(calc(g.events,id)); }},
  pm:{l:"Más/menos", u:"puntos", hb:1, zero:1, get:function(g,id){ var t=track(g); return t.tracked ? (t.pm[id]||0) : null; }},
  min:{l:"Minutos", u:"minutos", hb:1, fmt:fmtMin, get:function(g,id){ return g.min && g.min[id]!=null ? g.min[id] : null; }}
};

/* Filas de la tabla de temporada: una por jugador que ha jugado algún partido finalizado */
export function seasonRows(players, done){
  return players.map(function(p){
    var gp = done.filter(function(g){ return g.roster.indexOf(p.id)>=0; });
    if(!gp.length) return null;
    var pm=0, pmn=0, mn=0, mnn=0;
    gp.forEach(function(g){ var t=track(g); if(t.tracked){ pm += (t.pm[p.id]||0); pmn++; } if(g.min && g.min[p.id]!=null){ mn += g.min[p.id]; mnn++; } });
    return {p:p, n:gp.length, s:calc(allEvents(gp), p.id), pm:pm, pmn:pmn, mn:mn, mnn:mnn, games:gp};
  }).filter(Boolean);
}

/* Por minuto: solo con los partidos en los que se apuntaron minutos */
export function per40(r, f){
  var tot=0, mn=0;
  r.games.forEach(function(g){ if(g.min && g.min[r.p.id]!=null){ mn += g.min[r.p.id]; tot += calc(g.events, r.p.id)[f]; } });
  return mn ? tot/mn : 0;
}
