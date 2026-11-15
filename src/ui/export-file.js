// Descargar archivos (copia, CSV, PDF)
import { esc } from "../logic/format.js";
import { U } from "../state.js";
import { render } from "./layout.js";

/* Exportar */
export var downloads = null;
(function(){ try{ if(window.claude && typeof window.claude.use==="function"){ window.claude.use("downloads").then(function(d){ downloads=d; }).catch(function(){}); } }catch(e){} })();
export function exportFile(name, data, mime){
  var isText = typeof data==="string";
  function fallback(){
    try{ var a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([data],{type:mime})); a.download=name; document.body.appendChild(a); a.click(); setTimeout(function(){ a.remove(); },100); }catch(e){}
    if(isText) U.modal = {title:"Guardar datos", html:'<p class="muted small">Si el archivo no se ha descargado, copia este texto y guárdalo en una nota o en un archivo llamado '+esc(name)+'.</p><textarea id="cp" readonly rows="8">'+esc(data)+'</textarea>', ok:"Cerrar", copy:true};
    else U.modal = {title:"Descarga", body:"Si el archivo "+name+" no se ha descargado, abre la app directamente en el navegador (fuera del chat) y vuelve a intentarlo.", ok:"Entendido"};
    render();
  }
  if(downloads){
    downloads.save({filename:name, data: isText ? data : new Blob([data],{type:mime})}).catch(function(err){
      if(err && err.code==="declined") return;
      if(err && err.code==="rate_limited"){ U.modal={title:"Espera un momento", body:"Ya hay una descarga pendiente de confirmar.", ok:"Entendido"}; render(); return; }
      fallback();
    });
  } else fallback();
}
