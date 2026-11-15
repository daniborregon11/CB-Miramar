// Editor del acta (minutos y correcciones)
import { QL } from "../logic/constants.js";
import { EF, EF_LBL, draftTotals, rowPts } from "../logic/edit.js";
import { byNum, esc, short } from "../logic/format.js";
import { S, U, player } from "../state.js";

export function viewEditGame(g){
  var d = U.draft, t = draftTotals(d);
  var ps = d.roster.map(player).filter(Boolean).sort(byNum);
  var others = S.players.filter(function(p){ return p.active && d.roster.indexOf(p.id)<0; }).sort(byNum);
  var h = '<div class="subbar"><button class="btn" data-do="edit-cancel">← Salir sin guardar</button><button class="btn primary" type="submit" form="f-edit">Guardar cambios</button></div>';
  if(U.justFinished===g.id) h += '<div class="banner ok"><span><b>Partido finalizado.</b> Apunta los minutos de cada jugador y corrige lo que haga falta. Después podrás exportar el PDF.</span></div>';
  h += '<form id="f-edit" class="stack" novalidate>';
  h += '<div class="grid2"><section class="card"><h2>Datos del partido</h2><div class="row">'+
    '<label for="ed-rival">Rival<input id="ed-rival" data-ed="rival" maxlength="40" value="'+esc(d.rival)+'"></label>'+
    '<label for="ed-date">Fecha<input id="ed-date" type="date" data-ed="date" value="'+esc(d.date)+'"></label>'+
    '<label for="ed-place">Lugar<select id="ed-place" data-ed="place"><option'+(d.place==="Local"?" selected":"")+'>Local</option><option'+(d.place==="Visitante"?" selected":"")+'>Visitante</option></select></label></div>'+
    '<p class="edscore">Resultado: <b id="ed-us">'+t.us+'</b> – <b id="ed-op">'+t.op+'</b></p></section>'+
    '<section class="card"><h2>Puntos del rival por cuarto</h2><div class="qedit">';
  for(var q=1;q<=d.nq;q++) h += '<label for="ed-q'+q+'">'+QL[q-1]+'<input id="ed-q'+q+'" type="number" inputmode="numeric" min="0" data-ed="opp:'+q+'" value="'+esc(d.opp[q])+'"></label>';
  h += '</div>'+(d.nq<5 ? '<button class="btn sm" type="button" data-do="edit-addq">Añadir prórroga</button>' : '')+'</section></div>';
  h += '<section class="card"><h2>Estadísticas de los jugadores</h2><p class="muted small">Los puntos se calculan solos a partir de los tiros. Deja los minutos en blanco si no los sabes.</p>'+
    '<div class="tbl-wrap"><table class="edt"><thead><tr><th scope="col">Jugador</th><th scope="col" class="minc">MIN</th>'+
    EF.map(function(f){ return '<th scope="col">'+EF_LBL[f]+'</th>'; }).join("")+'<th scope="col">PTS</th></tr></thead><tbody>'+
    ps.map(function(p){ var r = d.p[p.id];
      return '<tr><th scope="row"><span class="dn">'+p.num+'</span>'+esc(short(p.name))+'</th>'+
        '<td class="minc"><input type="number" inputmode="numeric" min="0" max="70" aria-label="Minutos de '+esc(p.name)+'" data-ed="p:'+p.id+':min" value="'+esc(r.min)+'" placeholder="–"></td>'+
        EF.map(function(f){ return '<td><input type="number" inputmode="numeric" min="0" aria-label="'+EF_LBL[f]+' de '+esc(p.name)+'" data-ed="p:'+p.id+':'+f+'" value="'+esc(r[f])+'"></td>'; }).join("")+
        '<td class="hi" id="ed-pts-'+p.id+'">'+rowPts(r)+'</td></tr>';
    }).join("")+'</tbody></table></div>'+
    (others.length ? '<div class="row addp"><label for="ed-add">Añadir un jugador a este partido<select id="ed-add">'+others.map(function(p){ return '<option value="'+p.id+'">#'+p.num+' '+esc(p.name)+'</option>'; }).join("")+'</select></label><button class="btn" type="button" data-do="edit-addp">Añadir</button></div>' : '')+
    '</section><p class="err" id="ed-err" role="alert"></p>'+
    '<div class="btns"><button class="btn primary" type="submit">Guardar cambios</button><button class="btn" type="button" data-do="edit-cancel">Salir sin guardar</button></div></form>';
  return h;
}
