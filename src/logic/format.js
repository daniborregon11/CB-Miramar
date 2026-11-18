// Utilidades de formato (copiadas del prototipo sin cambios)
export function uid(){ return Math.random().toString(36).slice(2,10) + Date.now().toString(36).slice(-3); }
export function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }
export function today(){ var d=new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
export function fmtDate(s){ try{ return new Date(s+"T12:00:00").toLocaleDateString("es-ES",{day:"numeric",month:"short",year:"numeric"}); }catch(e){ return s; } }
export function shortDate(s){ try{ return new Date(s+"T12:00:00").toLocaleDateString("es-ES",{day:"numeric",month:"short"}).replace(".",""); }catch(e){ return s; } }
export function short(n){ var p=String(n).trim().split(/\s+/); return p.length>1 ? p[0]+" "+p[1].charAt(0)+"." : p[0]; }
export function byNum(a,b){ return a.num-b.num; }
export function pct(m,a){ return a ? Math.round(m/a*100)+"%" : "–"; }
export function f1(x){ return (Math.round(x*10)/10).toFixed(1).replace(".",","); }
export function fsign(x, dec){ if(x==null || isNaN(x)) return "–"; var v = dec ? f1(Math.abs(x)) : String(Math.abs(Math.round(x))); return (x>0?"+":x<0?"−":"")+v; }
export function fpc(x){ return x==null || isNaN(x) ? "–" : Math.round(x)+"%"; }
/* Minutos (guardados como número, p. ej. 22.5333) → "22:32" */
export function fmtMin(m){ if(m==null || m==="" || isNaN(m)) return "–"; var s = Math.round(m*60); return Math.floor(s/60)+":"+String(s%60).padStart(2,"0"); }
/* Texto escrito en el acta → minutos. "22:32", "22.32", "22,32" o "22" (= 22:00).
   Devuelve "" si está en blanco y null si no es válido (segundos con dos cifras, 00–59). */
export function parseMin(t){
  t = String(t == null ? "" : t).trim();
  if(t === "") return "";
  var m = t.match(/^(\d{1,3})(?:[:.,](\d{2}))?$/);
  if(!m) return null;
  var ss = m[2] == null ? 0 : Number(m[2]);
  if(ss > 59) return null;
  return Number(m[1]) + ss/60;
}
export function fmtV(v, m){ if(v==null) return "–"; if(m.fmt) return m.fmt(v); if(m.zero) return fsign(v, v%1!==0); return (v%1!==0 ? f1(v) : String(v))+(m.suf||""); }
