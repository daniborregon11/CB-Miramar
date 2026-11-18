// Preguntas tras un tiro: asistencia (canasta de 2 o 3) y rebote (tiro fallado, también TL).
// La respuesta se guarda como un evento unido al tiro (ref = id del tiro):
//   asistencia → {a:"AS", p:jugador, ref}   rebote nuestro → {a:"RO", p:jugador, ref}
//   rebote del rival → {a:"RR", p:null, ref}   "Sin…" → no se guarda nada (igual que antes)
import { uid } from "./format.js";

/* ¿Qué hay que preguntar tras esta acción? "ast", "reb" o null */
export function askFor(a, prefs){
  prefs = prefs || {};
  if((a==="2A" || a==="3A") && prefs.askAst !== false) return "ast";
  if((a==="2F" || a==="3F" || a==="1F") && prefs.askReb !== false) return "reb";
  return null;
}

/* Jugadores que salen en la ventana: asistencia → los otros de pista; rebote → los de pista */
export function askPlayers(kind, onCourt, shooterId){
  return onCourt.filter(function(id){ return id && (kind==="reb" || id!==shooterId); });
}

/* Evento a guardar según la respuesta ("none", "rival" o id de jugador) */
export function followUp(kind, choice, shot){
  if(!choice || choice==="none") return null;
  var base = {id:uid(), q:shot.q, t:Date.now(), ref:shot.id};
  if(kind==="reb" && choice==="rival") return Object.assign(base, {a:"RR", p:null});
  return Object.assign(base, {a: kind==="ast" ? "AS" : "RO", p:choice});
}

/* "Deshacer última": si lo último es la respuesta a un tiro, se deshace el tiro entero */
export function undoTarget(events){
  var lv = events.filter(function(e){ return e.a!=="ADJ" && e.a!=="OPPADJ"; });
  if(!lv.length) return null;
  var last = lv[lv.length-1];
  if(last.ref && events.some(function(e){ return e.id===last.ref; })) return last.ref;
  return last.id;
}

/* Rebotes ofensivos cogidos: de los rebotes tras nuestros fallos, % que cogemos.
   Solo con partidos en los que se anotó algún rebote del rival. */
export function orebPct(games, calcFn){
  var ro = 0, rr = 0;
  games.forEach(function(g){
    var n = g.events.filter(function(e){ return e.a==="RR"; }).length;
    if(!n) return;
    rr += n; ro += calcFn(g.events).ro;
  });
  return ro + rr ? 100*ro/(ro+rr) : null;
}
