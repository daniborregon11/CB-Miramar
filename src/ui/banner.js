// Avisos fijos de arriba (datos de ejemplo, almacenamiento)
import { S, storageOk } from "../state.js";

export function banner(){
  var h = "";
  if(S.sample) h += '<div class="banner"><span>Estás viendo datos de ejemplo para probar la app.</span><button class="btn sm" data-do="clear-sample">Borrar ejemplo y empezar</button></div>';
  if(!storageOk) h += '<div class="banner"><span>Este navegador no está guardando los datos. Exporta una copia antes de cerrar la página.</span></div>';
  return h;
}
