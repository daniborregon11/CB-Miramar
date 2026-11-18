// Pestaña Jugadores: plantilla, nombre del equipo y copia de seguridad
import { nuevo } from "../ui/nuevo.js";
import { POS } from "../logic/constants.js";
import { byNum, esc } from "../logic/format.js";
import { S, U, player, prefs } from "../state.js";
import { banner } from "../ui/banner.js";

export function viewJugadores(){
  var ed = U.edit ? player(U.edit) : null;
  var list = S.players.filter(function(p){return p.active;}).sort(byNum);
  var bajas = S.players.filter(function(p){return !p.active;});
  return banner()+
    '<section class="card"><h2>'+(ed?'Editar jugador':'Añadir jugador')+'</h2><form id="f-player" class="stack" novalidate>'+
    '<div class="row"><label for="p-num" class="narrow">Dorsal<input id="p-num" type="number" inputmode="numeric" min="0" max="99" value="'+(ed?ed.num:"")+'"></label>'+
    '<label for="p-name">Nombre<input id="p-name" maxlength="40" autocomplete="off" placeholder="Nombre y apellido" value="'+(ed?esc(ed.name):"")+'"></label>'+
    '<label for="p-pos">Posición<select id="p-pos">'+POS.map(function(x){ return '<option'+(ed&&ed.pos===x?' selected':'')+'>'+x+'</option>'; }).join("")+'</select></label></div>'+
    '<p class="err" id="p-err" role="alert"></p><div class="btns"><button class="btn primary" type="submit">'+(ed?'Guardar cambios':'Añadir jugador')+'</button>'+
    (ed?'<button class="btn" type="button" data-do="cancel-edit">Cancelar</button>':'')+'</div></form></section>'+
    '<section class="card"><h2>Plantilla <span class="count">'+list.length+'</span></h2>'+
    (list.length ? '<ul class="plist">'+list.map(function(p){
      return '<li><span class="pnum">'+p.num+'</span><span class="pinfo"><b>'+esc(p.name)+'</b><small>'+esc(p.pos)+'</small></span>'+
        '<span class="pact"><button class="btn sm" data-do="edit:'+p.id+'">Editar</button><button class="btn sm danger" data-do="delp:'+p.id+'">Quitar</button></span></li>';
    }).join("")+'</ul>' : '<p class="muted">Aún no hay jugadores. Añade el primero con el formulario de arriba.</p>')+
    (bajas.length ? '<p class="muted small" style="margin-top:10px">De baja (sus estadísticas se conservan): '+bajas.map(function(p){ return '#'+p.num+' '+esc(p.name)+' <button class="link" data-do="restore:'+p.id+'">Recuperar</button>'; }).join(" · ")+'</p>' : '')+
    '</section>'+
    '<section class="card"><h2>Equipo</h2><form id="f-team" class="row" novalidate><label for="t-name">Nombre de tu equipo<input id="t-name" maxlength="40" value="'+esc(S.team)+'"></label>'+
    '<button class="btn" type="submit" style="align-self:flex-end">Guardar</button></form></section>'+
    '<section class="card"'+nuevo(true,"ask")+'><h2>Anotación</h2><p class="muted small">Ventanas que aparecen tras cada tiro. Si en algún partido van demasiado rápido, desactívalas aquí.</p>'+
    '<label class="chk" for="pref-ast"><input type="checkbox" id="pref-ast" data-pref="askAst"'+(prefs.askAst!==false?' checked':'')+'> Preguntar quién da la asistencia tras una canasta de 2 o 3</label>'+
    '<label class="chk" for="pref-reb"><input type="checkbox" id="pref-reb" data-pref="askReb"'+(prefs.askReb!==false?' checked':'')+'> Preguntar por el rebote tras un tiro fallado (también tiros libres)</label></section>'+
    '<section class="card"><h2>Copia de seguridad</h2><p class="muted small">Los datos se guardan solo en este dispositivo. Exporta una copia de vez en cuando para no perderlos o para pasarlos a otro móvil.</p>'+
    '<div class="btns"><button class="btn" data-do="export">Exportar copia</button><button class="btn" data-do="import">Importar copia</button><input type="file" id="imp" accept=".json,application/json" hidden></div></section>';
}
