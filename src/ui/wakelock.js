// Pantalla siempre encendida mientras hay un partido en juego (Screen Wake Lock).
// Android lo suelta al salir de la app o bloquear la tablet; al volver se pide otra vez.
var lock = null, want = false, pending = false;

function acquire(){
  if(lock || pending || !navigator.wakeLock || document.visibilityState !== "visible") return;
  pending = true;
  navigator.wakeLock.request("screen").then(function(l){
    pending = false;
    if(!want){ l.release().catch(function(){}); return; }
    lock = l;
    l.addEventListener("release", function(){ if(lock === l) lock = null; });
  }, function(){ pending = false; });
}
function release(){
  if(lock){ var l = lock; lock = null; l.release().catch(function(){}); }
}

/* Se llama cada vez que se pinta la pantalla: activo = hay partido en juego */
export function syncWakeLock(activo){
  want = !!activo;
  if(want) acquire(); else release();
}

export function setupWakeLock(){
  document.addEventListener("visibilitychange", function(){
    if(want && document.visibilityState === "visible") acquire();
  });
}
