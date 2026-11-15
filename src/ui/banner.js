// Avisos fijos de arriba (versión nueva, datos de ejemplo, almacenamiento)
import { S, U, storageOk } from "../state.js";

export function banner(){
  var h = "";
  if(U.update) h += '<div class="banner ok"><span><b>Hay una versión nueva de la app.</b> Al actualizar no se pierde nada de lo anotado.</span><button class="btn sm" data-do="update-app">Actualizar</button></div>';
  if(S.sample) h += '<div class="banner"><span>Estás viendo datos de ejemplo para probar la app.</span><button class="btn sm" data-do="clear-sample">Borrar ejemplo y empezar</button></div>';
  if(!storageOk) h += '<div class="banner"><span>Este navegador no está guardando los datos. Exporta una copia antes de cerrar la página.</span></div>';
  return h;
}
