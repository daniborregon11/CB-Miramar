// Editor del acta: borrador, validación y guardado como eventos de ajuste (del prototipo)
import { QL } from "./constants.js";
import { uid } from "./format.js";
import { calc, score, maxQ } from "./stats.js";

export var EF = ["t2m","t2a","t3m","t3a","tlm","tla","ro","rd","as","rb","tp","pe","fc","fr"];
export var EF_LBL = {min:"MIN",t2m:"T2 anot.",t2a:"T2 int.",t3m:"T3 anot.",t3a:"T3 int.",tlm:"TL anot.",tla:"TL int.",ro:"Reb. of.",rd:"Reb. def.",as:"Asist.",rb:"Robos",tp:"Tapones",pe:"Pérd.",fc:"Faltas",fr:"F. recib."};

export function draftRow(g, id){
  var s = calc(g.events, id), r = {min:(g.min && g.min[id]!=null) ? g.min[id] : ""};
  EF.forEach(function(f){ r[f] = s[f]; });
  return r;
}
export function makeDraft(g){
  var d = {id:g.id, rival:g.rival, date:g.date, place:g.place||"Local", roster:g.roster.slice(), opp:{}, p:{}, nq:maxQ(g)};
  for(var q=1;q<=d.nq;q++) d.opp[q] = score(g,q).op;
  g.roster.forEach(function(id){ d.p[id] = draftRow(g, id); });
  return d;
}
export function num(v){ var n = parseInt(v,10); return isNaN(n) ? 0 : n; }
export function rowPts(r){ return 2*num(r.t2m) + 3*num(r.t3m) + num(r.tlm); }
export function draftTotals(d){
  var us=0, op=0;
  d.roster.forEach(function(id){ us += rowPts(d.p[id]); });
  for(var q=1;q<=d.nq;q++) op += num(d.opp[q]);
  return {us:us, op:op};
}

/* Devuelve el mensaje de error (el mismo texto que el prototipo) o null si todo es correcto */
export function validateDraft(d, playerFn){
  for(var i=0;i<d.roster.length;i++){
    var id=d.roster[i], p=playerFn(id), r=d.p[id], who = p ? "#"+p.num+" "+p.name : "un jugador";
    for(var j=0;j<EF.length;j++){ var v=String(r[EF[j]]).trim(); if(v!=="" && (!/^\d+$/.test(v))) return "Revisa "+EF_LBL[EF[j]]+" de "+who+": tiene que ser un número entero, 0 o más."; }
    if(num(r.t2m)>num(r.t2a)) return "En "+who+", los tiros de 2 anotados no pueden ser más que los intentados.";
    if(num(r.t3m)>num(r.t3a)) return "En "+who+", los triples anotados no pueden ser más que los intentados.";
    if(num(r.tlm)>num(r.tla)) return "En "+who+", los tiros libres anotados no pueden ser más que los intentados.";
    var m = String(r.min).trim();
    if(m!=="" && (!/^\d+$/.test(m) || num(m)>70)) return "Revisa los minutos de "+who+": un número entre 0 y 70, o en blanco.";
  }
  for(var q=1;q<=d.nq;q++){ var o=String(d.opp[q]).trim(); if(o!=="" && !/^\d+$/.test(o)) return "Revisa los puntos del rival en el "+QL[q-1]+"."; }
  return null;
}

/* Aplica un borrador ya validado: los eventos originales no se tocan; las diferencias
   se guardan como ADJ (por jugador) y OPPADJ (por cuarto), recalculadas desde cero. */
export function applyDraft(g, d){
  g.rival = String(d.rival).trim() || g.rival; g.date = d.date || g.date; g.place = d.place;
  g.roster = d.roster.slice();
  g.events = g.events.filter(function(e){ return e.a!=="ADJ" && e.a!=="OPPADJ"; });
  g.min = {};
  d.roster.forEach(function(id){
    var base = calc(g.events, id), r = d.p[id], dd = {}, any = false;
    EF.forEach(function(f){ var diff = num(r[f]) - base[f]; if(diff){ dd[f]=diff; any=true; } });
    if(any) g.events.push({id:uid(), p:id, a:"ADJ", d:dd, q:0, t:Date.now()});
    if(String(r.min).trim()!=="") g.min[id] = num(r.min);
  });
  for(var qq=1;qq<=d.nq;qq++){
    var diff = num(d.opp[qq]) - score(g,qq).op;
    if(diff) g.events.push({id:uid(), p:null, a:"OPPADJ", pts:diff, q:qq, t:Date.now()});
  }
}
