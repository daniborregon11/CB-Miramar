// Convocados: máximo 12 por partido, salvo partido amistoso (sin límite)
export var MAX_CONVOCADOS = 12;

/* ¿Cuántos se pueden convocar? */
export function rosterLimit(friendly){ return friendly ? Infinity : MAX_CONVOCADOS; }

/* Error al empezar el partido, o null si está bien */
export function rosterError(n, friendly){
  if(!n) return "Marca al menos un jugador convocado.";
  if(!friendly && n > MAX_CONVOCADOS) return "Como máximo puedes convocar a "+MAX_CONVOCADOS+" jugadores. Si es un partido amistoso, marca «Partido amistoso».";
  return null;
}

/* Con 12 jugadores o menos en la plantilla salen todos marcados; con más, ninguno (eliges tú) */
export function checkedByDefault(nActivos){ return nActivos <= MAX_CONVOCADOS; }

/* Texto del contador: "10/12", o solo "14" en un amistoso */
export function rosterCount(n, friendly){ return friendly ? String(n) : n+"/"+MAX_CONVOCADOS; }
