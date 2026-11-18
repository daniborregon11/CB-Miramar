// Quién está en pista y cambios (del prototipo). playerFn(id) devuelve el jugador o null.
import { uid } from "./format.js";

export function ensureCourt(g, playerFn){
  if(!Array.isArray(g.onCourt)) g.onCourt = [];
  while(g.onCourt.length<5) g.onCourt.push(null);
  for(var i=0;i<5;i++){ var id=g.onCourt[i]; if(id && (!playerFn(id) || g.roster.indexOf(id)<0)) g.onCourt[i]=null; }
  return g.onCourt;
}
export function addSub(g, inId, outId){
  var ev = {id:uid(), p:null, a:"SUB", "in":inId||null, out:outId||null, q:g.q, t:Date.now()};
  g.events.push(ev); return ev;
}
export function revertSub(g, e, playerFn){
  var oc = ensureCourt(g, playerFn), k;
  if(e["in"]){
    k = oc.indexOf(e["in"]);
    if(k>=0) oc[k] = (e.out && oc.indexOf(e.out)<0) ? e.out : null;
  } else if(e.out && oc.indexOf(e.out)<0){
    k = oc.indexOf(null); if(k>=0) oc[k] = e.out;
  }
}
export function removeEv(g, id, playerFn){
  for(var i=g.events.length-1;i>=0;i--){
    if(g.events[i].id===id){
      var e=g.events.splice(i,1)[0];
      if(e.a==="SUB") revertSub(g,e,playerFn);
      // lo que iba unido a este evento (asistencia o rebote de un tiro) también se borra
      g.events = g.events.filter(function(x){ return x.ref!==id; });
      return;
    }
  }
}
