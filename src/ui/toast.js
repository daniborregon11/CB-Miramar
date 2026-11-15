// Aviso temporal con 'Deshacer' y vibración
import { esc } from "../logic/format.js";
import { U } from "../state.js";

export var toastTimer = null;
export function paintToast(){
  var el = document.getElementById("toast");
  el.innerHTML = U.toast ? '<div class="toast"><span>'+esc(U.toast.msg)+'</span>'+(U.toast.id?'<button data-do="undo-ev:'+U.toast.id+'">Deshacer</button>':'')+'</div>' : "";
}
export function toast(msg, id){
  U.toast = {msg:msg, id:id}; paintToast();
  clearTimeout(toastTimer); toastTimer = setTimeout(function(){ U.toast=null; paintToast(); }, 3500);
}
export function buzz(){ try{ if(navigator.vibrate) navigator.vibrate(12); }catch(e){} }
