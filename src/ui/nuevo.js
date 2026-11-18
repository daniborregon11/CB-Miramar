// Marca los elementos añadidos respecto al prototipo (data-nuevo).
// La prueba de equivalencia con el prototipo los oculta al comparar; en la app no cambia nada.
export function nuevo(si, que){ return si ? ' data-nuevo="'+(que||"FR")+'"' : ""; }
