// App instalable: registro del service worker (funcionar sin conexión) y aviso de versión nueva.
// La versión nueva nunca se activa sola: se avisa con una franja y el usuario decide cuándo actualizar.
import { registerSW } from "virtual:pwa-register";
import { U, flushSaves } from "../state.js";
import { toast } from "./toast.js";

var updateSW = null;

export function setupPWA(){
  if(!("serviceWorker" in navigator)) return;
  updateSW = registerSW({
    // No se repinta la pantalla aquí (podría borrar algo a medio escribir):
    // la franja aparece la próxima vez que se toque algo.
    onNeedRefresh: function(){ U.update = true; },
    onOfflineReady: function(){ toast("La app ya funciona sin conexión", null); }
  });
}

/* Termina de guardar lo pendiente y recarga con la versión nueva */
export function applyUpdate(){
  if(!updateSW) return;
  flushSaves().then(function(){ updateSW(true); });
}
