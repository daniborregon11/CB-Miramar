// Regresión lineal y tendencia (lógica del prototipo; el texto se pinta en la interfaz)
export function linreg(xs, ys){
  var n=xs.length, sx=0, sy=0, sxx=0, sxy=0;
  for(var i=0;i<n;i++){ sx+=xs[i]; sy+=ys[i]; sxx+=xs[i]*xs[i]; sxy+=xs[i]*ys[i]; }
  var d = n*sxx - sx*sx; var b = d ? (n*sxy - sx*sy)/d : 0;
  return {b:b, a:(sy - b*sx)/n};
}

/* kind: "few" (menos de 3 partidos con dato), "stable", "up" o "down".
   good: si la subida/bajada es buena según el dato (m.hb). */
export function trendInfo(pts, m){
  var xs=[], ys=[];
  pts.forEach(function(p,i){ if(p.y!=null){ xs.push(i); ys.push(p.y); } });
  if(ys.length<3) return {fit:null, kind:"few"};
  var fit = linreg(xs, ys);
  var mean = ys.reduce(function(a,b){return a+b;},0)/ys.length;
  var change = fit.b*(xs[xs.length-1]-xs[0]);
  var thr = m.suf==="%" ? 3 : Math.max(1, Math.abs(mean)*0.08);
  if(Math.abs(change) < thr) return {fit:fit, kind:"stable", change:change, thr:thr};
  var up = fit.b>0;
  return {fit:fit, kind:up?"up":"down", good: up === (m.hb>0), change:change, thr:thr};
}

export function niceStep(raw){ var e=Math.pow(10,Math.floor(Math.log10(raw))), f=raw/e; return (f<=1?1:f<=2?2:f<=5?5:10)*e; }
