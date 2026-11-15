// Datos de ejemplo (del prototipo sin cambios)
import { uid, today } from "./format.js";

export function rng(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; var t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
export function genGame(players, sd, rival, date, place, qs, perQ, done, form){
  var r = rng(sd), k = 1+(form||0);
  var W = [["2A",13*k],["2F",11/k],["3A",5*k],["3F",8/k],["1A",6],["1F",2],["RO",4],["RD",9],["AS",6*k],["RB",3],["TP",1],["PE",5/k],["FC",5]];
  var pw = {}; players.forEach(function(p,i){ pw[p.id] = [5,5,4,4,4,3,3,2,2,2][i]||2; });
  function pick(n, wf){ var tot=0,i; for(i=0;i<n;i++) tot+=wf(i); var x=r()*tot; for(i=0;i<n;i++){ x-=wf(i); if(x<=0) return i; } return n-1; }
  var ev=[], t=Date.parse(date+"T18:00:00");
  var oc = players.slice(0,5).map(function(p){ return p.id; });
  oc.forEach(function(id){ ev.push({id:uid(),p:null,a:"SUB","in":id,out:null,q:1,t:(t+=1000)}); });
  for(var q=1;q<=qs;q++){
    var n = (q===qs && !done) ? Math.round(perQ*0.4) : perQ;
    for(var i=0;i<n;i++){
      if(r()<0.08){
        var bench = players.filter(function(p){ return oc.indexOf(p.id)<0; });
        var oi = Math.floor(r()*5), ip = bench[Math.floor(r()*bench.length)];
        ev.push({id:uid(),p:null,a:"SUB","in":ip.id,out:oc[oi],q:q,t:(t+=5000)}); oc[oi]=ip.id;
      }
      var a = W[pick(W.length,function(j){return W[j][1];})][0];
      var pid = oc[pick(5,function(j){ return pw[oc[j]]; })];
      ev.push({id:uid(),p:pid,a:a,q:q,t:(t+=20000)});
      if(r()<0.3){ var o = r()<0.2 ? 3 : (r()<0.15 ? 1 : 2); ev.push({id:uid(),p:null,a:"OPP",pts:o,q:q,t:(t+=15000)}); }
    }
  }
  return {id:uid(),rival:rival,date:date,place:place,roster:players.map(function(p){return p.id;}),events:ev,q:qs,done:done,sample:true,onCourt:oc.slice()};
}
export function seed(){
  var list = [[4,"Álex Martín","Base"],[7,"Hugo Pérez","Escolta"],[10,"Dani Ruiz","Alero"],[12,"Marcos Gil","Alero"],[15,"Iván López","Ala-pívot"],[21,"Pablo Sanz","Pívot"],[8,"Leo Torres","Base"],[5,"Raúl Moreno","Escolta"],[23,"Nico Castro","Ala-pívot"],[33,"Sergio Vidal","Pívot"]];
  var players = list.map(function(x){ return {id:uid(),num:x[0],name:x[1],pos:x[2],active:true,sample:true}; });
  var cal = [["2026-10-04","CB Riberas","Local"],["2026-10-11","Basket Sur","Visitante"],["2026-10-18","CD Alameda","Local"],["2026-10-25","UD Este","Visitante"],["2026-11-01","CB Los Pinos","Local"],["2026-11-08","Ciudad Vieja Basket","Visitante"]];
  var games = cal.map(function(c,i){ return genGame(players, 11+i*7, c[1], c[0], c[2], 4, 26, true, -0.15+i*0.07); });
  var live = genGame(players, 97, "Club Atlético Norte", today(), "Visitante", 3, 24, false, 0.1);
  games.push(live);
  return {v:2,team:"CB Miramar",players:players,games:games,liveId:live.id,sample:true};
}
