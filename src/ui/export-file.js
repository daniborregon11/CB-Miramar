// Descargar archivos (copia, CSV, PDF) y compartirlos con el menú de Android (WhatsApp, correo, Drive…)
import { esc } from "../logic/format.js";
import { U } from "../state.js";
import { render } from "./layout.js";
import { toast } from "./toast.js";

var lastFile = null;

/* Si no se puede descargar: el texto se puede copiar a mano (como en el prototipo) */
function fallback(name, data){
  if(typeof data==="string") U.modal = {title:"Guardar datos", html:'<p class="muted small">No se ha podido descargar el archivo. Copia este texto y guárdalo en una nota o en un archivo llamado '+esc(name)+'.</p><textarea id="cp" readonly rows="8">'+esc(data)+'</textarea>', ok:"Cerrar", copy:true};
  else U.modal = {title:"Descarga", body:"No se ha podido descargar el archivo "+name+". Prueba otra vez.", ok:"Entendido"};
  render();
}

export function exportFile(name, data, mime){
  var blob;
  try{
    blob = new Blob([data], {type:mime});
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a"); a.href = url; a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function(){ a.remove(); URL.revokeObjectURL(url); }, 60000);
  }catch(e){ fallback(name, data); return; }
  lastFile = null;
  try{
    var f = new File([blob], name, {type:mime});
    if(navigator.canShare && navigator.canShare({files:[f]})) lastFile = f;
  }catch(e){ lastFile = null; }
  toast("Descargado: "+name, null, lastFile ? {label:"Compartir", act:"share-file"} : null, 6000);
}

/* Abre el menú de compartir de Android con el último archivo exportado */
export function shareLastFile(){
  if(!lastFile || !navigator.share) return;
  navigator.share({files:[lastFile], title:lastFile.name}).catch(function(){});
}
