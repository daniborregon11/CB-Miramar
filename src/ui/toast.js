// Aviso temporal con 'Deshacer' (o con otra acción, p. ej. 'Compartir') y vibración
import { esc } from "../logic/format.js";
import { U } from "../state.js";

export var toastTimer = null;
export function paintToast(){
  var el = document.getElementById("toast"), t = U.toast;
  el.innerHTML = t ? '<div class="toast"><span>'+esc(t.msg)+'</span>'+
    (t.id ? '<button data-do="undo-ev:'+t.id+'">Deshacer</button>' : t.action ? '<button data-do="'+esc(t.action.act)+'">'+esc(t.action.label)+'</button>' : '')+'</div>' : "";
}
/* id: evento que se puede deshacer. action: {label, act} para otro botón. ms: duración. */
export function toast(msg, id, action, ms){
  U.toast = {msg:msg, id:id, action:action||null}; paintToast();
  clearTimeout(toastTimer); toastTimer = setTimeout(function(){ U.toast=null; paintToast(); }, ms || 3500);
}
export function buzz(){ try{ if(navigator.vibrate) navigator.vibrate(12); }catch(e){} }
