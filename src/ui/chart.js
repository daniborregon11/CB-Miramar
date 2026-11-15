// Gráfica de evolución (SVG) y su etiqueta al tocar un punto
import { esc, fmtV } from "../logic/format.js";
import { niceStep } from "../logic/trend.js";

export function chartSVG(pts, m, fit){
  var W=960, H=250, L=44, R=16, T=14, B=34, n=pts.length;
  var vals = pts.map(function(p){return p.y;}).filter(function(v){return v!=null;});
  if(!vals.length) return '<p class="muted small">No hay datos de este apartado en estos partidos.</p>';
  var lo=Math.min.apply(null,vals), hi=Math.max.apply(null,vals);
  if(lo>0) lo=0; if(hi<0) hi=0;
  var st = niceStep(((hi-lo)||1)/4); lo=Math.floor(lo/st)*st; hi=Math.ceil(hi/st)*st; if(hi===lo) hi=lo+st;
  function X(i){ return n===1 ? L+(W-L-R)/2 : L + i*(W-L-R)/(n-1); }
  function Y(v){ return T + (hi-v)/(hi-lo)*(H-T-B); }
  var g = '';
  for(var v=lo; v<=hi+1e-9; v+=st){
    g += '<line class="ch-grid'+(Math.abs(v)<1e-9 && lo<0 ? ' ch-zero':'')+'" x1="'+L+'" x2="'+(W-R)+'" y1="'+Y(v).toFixed(1)+'" y2="'+Y(v).toFixed(1)+'"/>'+
         '<text class="ch-lab" x="'+(L-8)+'" y="'+(Y(v)+4).toFixed(1)+'" text-anchor="end">'+(Math.round(v*10)/10)+(m.suf||"")+'</text>';
  }
  var every = Math.ceil(n/8);
  pts.forEach(function(p,i){ if(i%every===0 || i===n-1) g += '<text class="ch-lab" x="'+X(i).toFixed(1)+'" y="'+(H-12)+'" text-anchor="middle">'+esc(p.x)+'</text>'; });
  if(fit){
    var xs=[]; pts.forEach(function(p,i){ if(p.y!=null) xs.push(i); });
    var x0=xs[0], x1=xs[xs.length-1];
    g += '<line class="ch-trend" x1="'+X(x0).toFixed(1)+'" y1="'+Y(fit.a+fit.b*x0).toFixed(1)+'" x2="'+X(x1).toFixed(1)+'" y2="'+Y(fit.a+fit.b*x1).toFixed(1)+'"/>';
  }
  var d='', pen=false;
  pts.forEach(function(p,i){ if(p.y==null){ pen=false; return; } d += (pen?'L':'M')+X(i).toFixed(1)+' '+Y(p.y).toFixed(1)+' '; pen=true; });
  g += '<path class="ch-line" d="'+d+'"/>';
  pts.forEach(function(p,i){
    if(p.y==null) return;
    var cx=X(i), cy=Y(p.y);
    g += '<circle class="ch-dot" cx="'+cx.toFixed(1)+'" cy="'+cy.toFixed(1)+'" r="4.5"/>'+
         '<circle class="ch-hit" cx="'+cx.toFixed(1)+'" cy="'+cy.toFixed(1)+'" r="16" data-tip="'+esc(p.tip+': '+fmtV(p.y,m))+'" data-px="'+(cx/W*100).toFixed(2)+'" data-py="'+(cy/H*100).toFixed(2)+'"/>';
  });
  return '<div class="chart"><svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+esc(m.l)+' por partido">'+g+'</svg><div class="ch-tip" hidden></div></div>';
}
export function showTip(el){
  var wrap = el.closest(".chart"); if(!wrap) return; var tip = wrap.querySelector(".ch-tip");
  tip.textContent = el.getAttribute("data-tip"); tip.style.left = el.getAttribute("data-px")+"%"; tip.style.top = el.getAttribute("data-py")+"%"; tip.hidden = false;
}
