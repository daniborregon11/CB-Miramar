// Exportar CSV y PDF (del prototipo). El PDF se genera sin librerías externas.
// player(id) devuelve el jugador o null; team es el nombre del equipo.
import { QL } from "./constants.js";
import { fmtDate, byNum, pct, f1, fsign, fpc } from "./format.js";
import { calc, score, maxQ, efg, tsp, possOf, track } from "./stats.js";

export function csvOf(g, player){
  var mins = g.min||{};
  var rows = [["Dorsal","Jugador","MIN","PTS","T2A","T2I","T3A","T3I","TLA","TLI","RO","RD","REB","AS","RB","TP","PE","FC","FR","VAL"]];
  g.roster.map(player).filter(Boolean).sort(byNum).forEach(function(p){ var s=calc(g.events,p.id);
    rows.push([p.num,p.name,mins[p.id]!=null?mins[p.id]:"",s.pts,s.t2m,s.t2a,s.t3m,s.t3a,s.tlm,s.tla,s.ro,s.rd,s.reb,s.as,s.rb,s.tp,s.pe,s.fc,s.fr,s.val]); });
  return "﻿"+rows.map(function(r){ return r.map(function(v){ v=String(v); return /[;"\n]/.test(v) ? '"'+v.replace(/"/g,'""')+'"' : v; }).join(";"); }).join("\n");
}

export function PDFDoc(){ this.W=842; this.H=595; this.pages=[]; this.c=null; }
PDFDoc.prototype.page = function(){ this.c=[]; this.pages.push(this.c); };
PDFDoc.prototype.col = function(hex){ var n=parseInt(hex.slice(1),16); return [((n>>16)&255)/255,((n>>8)&255)/255,(n&255)/255].map(function(v){ return v.toFixed(3); }).join(" "); };
PDFDoc.prototype.enc = function(s){ return String(s).replace(/[–—−]/g,"-").replace(/[‘’]/g,"'").replace(/[“”]/g,'"').replace(/…/g,"...").replace(/[↗↘]/g,"").replace(/[^\x00-\xFF]/g,"?").replace(/([\\()])/g,"\\$1"); };
PDFDoc.prototype.tw = function(s, size, bold){
  var w=0, ch;
  for(var i=0;i<s.length;i++){ ch=s.charAt(i);
    if(/[0-9]/.test(ch)) w+=556; else if(ch===" "||ch==="/"||ch==="."||ch===","||ch===":") w+=278; else if(ch==="%") w+=889; else if(ch==="-"||ch==="("||ch===")") w+=333; else if(ch==="+") w+=584;
    else if(/[A-ZÁÉÍÓÚÑ]/.test(ch)) w+= bold?722:667; else if(/[a-záéíóúñü]/.test(ch)) w+= bold?600:530; else w+=556; }
  return w*size/1000;
};
PDFDoc.prototype.text = function(x, y, s, o){
  o=o||{}; var size=o.size||9, str=String(s), w=this.tw(str,size,o.bold);
  if(o.align==="right") x-=w; else if(o.align==="center") x-=w/2;
  this.c.push("BT /"+(o.bold?"F2":"F1")+" "+size+" Tf "+this.col(o.color||"#1A1C21")+" rg "+x.toFixed(2)+" "+(this.H-y).toFixed(2)+" Td ("+this.enc(str)+") Tj ET");
};
PDFDoc.prototype.rect = function(x, y, w, h, color){ this.c.push(this.col(color)+" rg "+x.toFixed(2)+" "+(this.H-y-h).toFixed(2)+" "+w.toFixed(2)+" "+h.toFixed(2)+" re f"); };
PDFDoc.prototype.line = function(x1, y1, x2, y2, color, lw){ this.c.push(this.col(color||"#DDD9D0")+" RG "+(lw||0.6)+" w "+x1.toFixed(2)+" "+(this.H-y1).toFixed(2)+" m "+x2.toFixed(2)+" "+(this.H-y2).toFixed(2)+" l S"); };
PDFDoc.prototype.build = function(){
  var out="%PDF-1.4\n%âãÏÓ\n", offs=[], self=this;
  function obj(n, body){ offs[n]=out.length; out += n+" 0 obj\n"+body+"\nendobj\n"; }
  var np=this.pages.length, kids=[];
  for(var i=0;i<np;i++) kids.push((5+i*2)+" 0 R");
  obj(1,"<< /Type /Catalog /Pages 2 0 R >>");
  obj(2,"<< /Type /Pages /Kids ["+kids.join(" ")+"] /Count "+np+" >>");
  obj(3,"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
  obj(4,"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
  this.pages.forEach(function(c,i){
    var s=c.join("\n");
    obj(5+i*2,"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 "+self.W+" "+self.H+"] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents "+(6+i*2)+" 0 R >>");
    obj(6+i*2,"<< /Length "+s.length+" >>\nstream\n"+s+"\nendstream");
  });
  var total=5+np*2, xref=out.length;
  out += "xref\n0 "+total+"\n0000000000 65535 f \n";
  for(var k=1;k<total;k++) out += String(offs[k]).padStart(10,"0")+" 00000 n \n";
  out += "trailer\n<< /Size "+total+" /Root 1 0 R >>\nstartxref\n"+xref+"\n%%EOF";
  var bytes=new Uint8Array(out.length); for(var j=0;j<out.length;j++) bytes[j]=out.charCodeAt(j)&255;
  return bytes;
};

export function pdfGame(g, team, player){
  var d=new PDFDoc(), M=36, sc=score(g), tk=track(g), tot=calc(g.events), poss=possOf(tot);
  var res = sc.us>sc.op ? "Victoria" : sc.us<sc.op ? "Derrota" : "Empate";
  var head = ["MIN","PTS","T2","T3","TL","RO","RD","REB","AS","RB","TP","PE","FC","FR","+/-","VAL","eFG%","TS%"];
  var ps = g.roster.map(player).filter(Boolean).sort(byNum), mins = g.min||{}, msum=0, mhas=false;
  Object.keys(mins).forEach(function(k){ msum+=mins[k]; mhas=true; });
  function header(cont){
    d.page();
    d.rect(0,0,d.W,74,"#17191E");
    d.rect(0,74,d.W,3,"#D4531F");
    d.text(M,36,team+"  "+sc.us+" - "+sc.op+"  "+g.rival,{size:20,bold:true,color:"#F4F2ED"});
    d.text(M,57,fmtDate(g.date)+"  ·  "+(g.place||"")+"  ·  "+res+(g.done?"":"  ·  partido en juego")+(cont?"  ·  continuación":""),{size:10,color:"#9095A0"});
    d.text(d.W-M,36,"FICHA DEL PARTIDO",{size:10,bold:true,color:"#D4531F",align:"right"});
  }
  header(false);
  // Parciales
  var maxq=maxQ(g), sqq=0; for(var qi=1;qi<=maxq;qi++) sqq+=score(g,qi).us;
  var adjq = sc.us - sqq;
  var y=104; d.text(M,y,"Parciales",{size:11,bold:true}); y+=8;
  var qx=M+170, qw=40;
  d.rect(M,y,170+qw*(maxq+1),18,"#F2F0EB");
  for(var q=1;q<=maxq;q++) d.text(qx+qw*(q-1)+qw/2,y+12.5,QL[q-1],{size:8,bold:true,color:"#686B73",align:"center"});
  d.text(qx+qw*maxq+qw/2,y+12.5,"Total",{size:8,bold:true,color:"#686B73",align:"center"});
  [[team,"us"],[g.rival,"op"]].forEach(function(r,ri){
    var yy=y+18+ri*18;
    d.text(M+6,yy+12.5,r[0],{size:9});
    for(var q=1;q<=maxq;q++) d.text(qx+qw*(q-1)+qw/2,yy+12.5,score(g,q)[r[1]],{size:9,align:"center"});
    d.text(qx+qw*maxq+qw/2,yy+12.5,sc[r[1]],{size:9,bold:true,align:"center"});
    d.line(M,yy+18,M+170+qw*(maxq+1),yy+18);
  });
  if(adjq) d.text(M,y+18+2*18+14,"El total incluye "+fsign(adjq)+" puntos corregidos en el acta después del partido.",{size:7.5,color:"#686B73"});
  // Métricas del equipo
  var mx=520, my=96, items=[
    ["eFG%",fpc(efg(tot))],["TS%",fpc(tsp(tot))],["Posesiones",f1(poss)],["Puntos/100 pos.",poss>0?f1(100*tot.pts/poss):"-"],
    ["Recibidos/100 pos.",poss>0?f1(100*sc.op/poss):"-"],["Canastas asistidas",tot.fgm?fpc(100*tot.as/tot.fgm):"-"],["Pérdidas/100 pos.",poss>0?f1(100*tot.pe/poss):"-"],["Segundas oport.",(tot.fga-tot.fgm)?fpc(100*tot.ro/(tot.fga-tot.fgm)):"-"]];
  d.text(mx,my+8,"Métricas del equipo",{size:11,bold:true});
  items.forEach(function(it,i){
    var cx = mx + (i%4)*72, cy = my+22 + Math.floor(i/4)*34;
    d.text(cx,cy+8,it[0],{size:7,color:"#686B73"});
    d.text(cx,cy+24,it[1],{size:13,bold:true});
  });
  // Ficha de jugadores
  y=196;
  var nameW=150, cw=(d.W-2*M-nameW)/head.length;
  function thead(){
    d.text(M,y,"Estadísticas por jugador",{size:11,bold:true}); y+=8;
    d.rect(M,y,d.W-2*M,18,"#17191E");
    d.text(M+6,y+12.5,"Jugador",{size:8,bold:true,color:"#F4F2ED"});
    head.forEach(function(hh,i){ d.text(M+nameW+cw*i+cw/2,y+12.5,hh,{size:8,bold:true,color:"#F4F2ED",align:"center"}); });
    y+=18;
  }
  function rowVals(s, pm, mn){ return [mn, s.pts, s.t2m+"/"+s.t2a, s.t3m+"/"+s.t3a, s.tlm+"/"+s.tla, s.ro, s.rd, s.reb, s.as, s.rb, s.tp, s.pe, s.fc, s.fr, pm, s.val, fpc(efg(s)), fpc(tsp(s))]; }
  thead();
  ps.forEach(function(p,idx){
    if(y>530){ header(true); y=104; thead(); }
    var s=calc(g.events,p.id);
    if(idx%2===1) d.rect(M,y,d.W-2*M,17,"#F7F5F0");
    d.text(M+6,y+12,String(p.num),{size:9,bold:true,color:"#686B73"});
    d.text(M+28,y+12,p.name,{size:9});
    rowVals(s, tk.tracked ? fsign(tk.pm[p.id]||0) : "-", mins[p.id]!=null?mins[p.id]:"-").forEach(function(v,i){ d.text(M+nameW+cw*i+cw/2,y+12,String(v),{size:9,align:"center",bold:i===1,color:i===1?"#D4531F":"#1A1C21"}); });
    y+=17;
  });
  d.line(M,y,d.W-M,y,"#1A1C21",1.2);
  d.text(M+6,y+13,"Equipo",{size:9,bold:true});
  rowVals(tot,"",mhas?msum:"-").forEach(function(v,i){ d.text(M+nameW+cw*i+cw/2,y+13,String(v),{size:9,bold:true,align:"center"}); });
  y+=18;
  d.text(M+6,y+12,"Porcentaje",{size:8,color:"#686B73"});
  [[2,pct(tot.t2m,tot.t2a)],[3,pct(tot.t3m,tot.t3a)],[4,pct(tot.tlm,tot.tla)]].forEach(function(x){ d.text(M+nameW+cw*x[0]+cw/2,y+12,x[1],{size:8,color:"#686B73",align:"center"}); });
  d.line(M,560,d.W-M,560);
  // Leyenda: si no cabe en una línea, se parte en dos por un " · "
  var leyenda = "MIN minutos · PTS puntos · T2/T3/TL anotados/intentados · RO/RD rebotes ofensivos/defensivos · AS asistencias · RB robos · TP tapones · PE pérdidas · FC faltas cometidas · FR faltas recibidas · +/- diferencia con el jugador en pista · VAL valoración · eFG% y TS% acierto ajustado", ancho = d.W-2*M, lineas = [leyenda];
  if(d.tw(leyenda, 6.5) > ancho){
    var partes = leyenda.split(" · "), a = [];
    while(partes.length && d.tw(a.concat(partes[0]).join(" · "), 6.5) <= ancho) a.push(partes.shift());
    lineas = [a.join(" · "), partes.join(" · ")];
  }
  lineas.forEach(function(t, k){ d.text(M, lineas.length>1 ? 569+k*8 : 574, t, {size:6.5,color:"#686B73"}); });
  d.text(d.W-M,586,"Generado el "+new Date().toLocaleDateString("es-ES"),{size:6.5,color:"#686B73",align:"right"});
  return d.build();
}
