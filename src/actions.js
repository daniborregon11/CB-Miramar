// Qué pasa al tocar cada botón, enviar formularios o escribir en el acta
import { askFor, askPlayers, followUp, undoTarget } from "./logic/followup.js";
import { rosterError, rosterLimit, rosterCount } from "./logic/roster.js";
import { ACT, QL, TABS } from "./logic/constants.js";
import { addSub, ensureCourt, removeEv } from "./logic/court.js";
import { applyDraft, draftRow, draftTotals, makeDraft, rowPts, validateDraft } from "./logic/edit.js";
import { csvOf, pdfGame } from "./logic/export.js";
import { short, today, uid } from "./logic/format.js";
import { score } from "./logic/stats.js";
import { migrate } from "./storage/migrate.js";
import { applyUpdate } from "./ui/pwa.js";
import { S, U, gameById, liveGame, player, prefs, save, setData, setPref } from "./state.js";
import { showTip } from "./ui/chart.js";
import { exportFile, shareLastFile } from "./ui/export-file.js";
import { render } from "./ui/layout.js";
import { buzz, paintToast, toast } from "./ui/toast.js";
import { tag } from "./views/partido.js";

export function onEditInput(el){
  var d = U.draft; if(!d) return;
  var k = el.getAttribute("data-ed").split(":");
  if(k[0]==="rival" || k[0]==="date" || k[0]==="place") d[k[0]] = el.value;
  else if(k[0]==="opp") d.opp[k[1]] = el.value;
  else if(k[0]==="p"){ d.p[k[1]][k[2]] = el.value; var c=document.getElementById("ed-pts-"+k[1]); if(c) c.textContent = rowPts(d.p[k[1]]); }
  var t = draftTotals(d), a=document.getElementById("ed-us"), b=document.getElementById("ed-op");
  if(a) a.textContent=t.us; if(b) b.textContent=t.op;
}

export function saveEdit(){
  var d = U.draft, g = gameById(d.id), err = document.getElementById("ed-err");
  if(!g) return;
  var msg = validateDraft(d, player);
  if(msg){ err.textContent = msg; err.scrollIntoView({block:"center"}); return; }
  applyDraft(g, d);
  U.draft=null; U.justFinished=null; save(); render(); window.scrollTo(0,0);
  toast("Cambios guardados", null);
}

export function confirmBox(title, body, ok, danger, fn){ U.modal = {title:title, body:body, ok:ok, danger:danger, fn:fn}; render(); }
/* ---------- Acciones ---------- */
export function go(tab){ U.draft=null; U.justFinished=null; U.player=null; U.bench=null; U.toast=null; paintToast(); U.tab=tab; U.game=null; U.edit=null; if(location.hash!=="#"+tab){ try{ location.hash=tab; }catch(e){} } render(); window.scrollTo(0,0); }
/* Nuevo partido: contador de convocados y, al llegar a 12 (si no es amistoso), no deja marcar más */
function updateRosterForm(){
  var f = document.getElementById("f-game"); if(!f) return;
  var boxes = f.querySelectorAll('.checks input[type="checkbox"]');
  var fr = document.getElementById("g-friendly"), friendly = !!(fr && fr.checked);
  var n = f.querySelectorAll('.checks input[type="checkbox"]:checked').length;
  var full = n >= rosterLimit(friendly);
  Array.prototype.forEach.call(boxes, function(b){ b.disabled = full && !b.checked; });
  var c = document.getElementById("g-count"); if(c) c.textContent = rosterCount(n, friendly);
  var err = document.getElementById("g-err"); if(err && !rosterError(n, friendly)) err.textContent = "";
}

/* Respuesta a la ventana de asistencia / rebote */
function answerAsk(choice){
  var a = U.ask; U.ask = null;
  var g = liveGame(); if(!a || !g){ render(); return; }
  var shot = null; g.events.forEach(function(e){ if(e.id===a.shot) shot = e; });
  if(!shot){ render(); return; }
  var f = followUp(a.kind, choice, shot);
  if(f){
    g.events.push(f); save(); buzz();
    var tir = player(shot.p);
    var extra = f.a==="AS" ? "asistencia de "+tag(f.p) : f.a==="RO" ? "rebote ofensivo de "+tag(f.p) : "rebote del rival";
    render();
    toast((tir ? "#"+tir.num+" "+short(tir.name) : "Jugador")+" · "+ACT[shot.a].t+" · "+extra, shot.id);
    return;
  }
  render();
}

export function setupEvents(){
window.addEventListener("hashchange", function(){ var h=location.hash.slice(1); if(h==="temporada") h="estadisticas"; if(TABS.indexOf(h)>=0 && h!==U.tab){ U.tab=h; U.game=null; render(); } });

document.addEventListener("click", function(e){
  // El menú de Opciones se cierra al tocar fuera de él
  if(U.opts && !e.target.closest(".optmenu, .optbtn")){ U.opts = false; render(); }
  var b = e.target.closest("[data-do]"); if(!b) return;
  var raw = b.getAttribute("data-do"), i = raw.indexOf(":");
  var k = i<0 ? raw : raw.slice(0,i), v = i<0 ? "" : raw.slice(i+1);
  var g = liveGame();
  switch(k){
    case "tab": go(v); break;
    case "sel": U.sel = U.sel===v ? null : v; render(); break;
    case "court":
      if(!g) return;
      if(U.bench){
        var oc1 = ensureCourt(g, player), k1 = oc1.indexOf(v); if(k1<0) return;
        var inId = U.bench; oc1[k1] = inId; var se = addSub(g, inId, v); U.bench=null; U.sel=null; save(); render(); buzz();
        toast("Cambio: entra "+tag(inId)+", sale "+tag(v), se.id);
      } else { U.sel = U.sel===v ? null : v; render(); }
      break;
    case "bench":
      if(!g) return;
      var oc2 = ensureCourt(g, player), free = oc2.indexOf(null); U.sel=null;
      if(free>=0){ oc2[free]=v; var se2 = addSub(g, v, null); U.bench=null; save(); render(); buzz(); toast("Entra a pista "+tag(v), se2.id); }
      else { U.bench = U.bench===v ? null : v; render(); }
      break;
    case "cancel-sub": U.bench=null; render(); break;
    case "tobench":
      if(!g) return;
      var oc3 = ensureCourt(g, player), k3 = oc3.indexOf(v); if(k3<0) return;
      oc3[k3]=null; var se3 = addSub(g, null, v); U.sel=null; save(); render(); toast("Al banquillo "+tag(v), se3.id); break;
    case "act":
      if(!g || !U.sel) return;
      var ev = {id:uid(), p:U.sel, a:v, q:g.q, t:Date.now()}; g.events.push(ev);
      var p = player(U.sel); U.sel = null;
      // Tras un tiro: preguntar asistencia o rebote (si está activado y hay a quién elegir)
      var kind = askFor(v, prefs), cands = kind ? askPlayers(kind, ensureCourt(g, player), ev.p) : [];
      U.ask = kind && (cands.length || kind==="reb") ? {kind:kind, shot:ev.id, shooter:ev.p, a:v, players:cands} : null;
      save(); render(); buzz();
      toast("#"+p.num+" "+short(p.name)+" · "+ACT[v].t, ev.id); break;
    case "ask-bg": if(e.target!==b) return; answerAsk("none"); break;
    case "ask-none": answerAsk("none"); break;
    case "ask-pick": answerAsk(v); break;
    case "opp":
      if(!g) return;
      var oe = {id:uid(), p:null, a:"OPP", pts:+v, q:g.q, t:Date.now()}; g.events.push(oe); save(); render(); buzz();
      toast(g.rival+" +"+v, oe.id); break;
    case "q": if(g){ g.q=+v; save(); render(); } break;
    case "undo": if(g){ var ut = undoTarget(g.events); if(ut){ removeEv(g, ut, player); save(); render(); } } break;
    case "undo-ev": case "delev":
      if(g){ removeEv(g, v, player); save(); render(); }
      if(k==="undo-ev"){ U.toast=null; paintToast(); } break;
    case "sub": U.sub=v; render(); break;
    case "finish":
      var fs = score(g);
      U.modal = {title:"¿Seguro que quieres finalizar el partido?", body:"Marcador: "+S.team+" "+fs.us+" – "+fs.op+" "+g.rival+" ("+QL[g.q-1]+"). Si has pulsado por error, sigue anotando. Al finalizar ya no podrás anotar jugada a jugada, pero sí apuntar los minutos y corregir las estadísticas.", ok:"Sí, finalizar", cancel:"No, seguir anotando", fn:function(){
        g.done=true; S.liveId=null; U.tab="historial"; U.game=g.id; U.sel=null; U.draft=makeDraft(g); U.justFinished=g.id; try{ location.hash="historial"; }catch(e){}
      }}; render(); break;
    case "edit": U.edit=v; render(); window.scrollTo(0,0); var n=document.getElementById("p-name"); if(n) n.focus(); break;
    case "cancel-edit": U.edit=null; render(); break;
    case "delp":
      var pl = player(v); if(!pl) return;
      var used = S.games.some(function(gm){ return gm.events.some(function(x){ return x.p===v; }); });
      if(used) confirmBox("Dar de baja a "+pl.name, "Tiene estadísticas guardadas, así que se conservarán en el historial. Dejará de aparecer en los nuevos partidos.", "Dar de baja", true, function(){ pl.active=false; if(U.edit===v) U.edit=null; });
      else confirmBox("Quitar a "+pl.name, "Se eliminará de la plantilla.", "Quitar", true, function(){
        S.players = S.players.filter(function(x){ return x.id!==v; });
        S.games.forEach(function(gm){ gm.roster = gm.roster.filter(function(x){ return x!==v; }); if(gm.onCourt) gm.onCourt = gm.onCourt.map(function(x){ return x===v ? null : x; }); });
        if(U.edit===v) U.edit=null;
      });
      break;
    case "restore": var rp=player(v); if(rp){ rp.active=true; save(); render(); } break;
    case "open": U.game=v; render(); window.scrollTo(0,0); break;
    case "close": U.game=null; render(); break;
    case "delg":
      confirmBox("Borrar partido", "Se borrará el partido y todas sus estadísticas. No se puede deshacer.", "Borrar", true, function(){
        S.games = S.games.filter(function(x){ return x.id!==v; }); if(S.liveId===v) S.liveId=null; U.game=null;
      }); break;
    case "csv": var cg=gameById(v); if(cg) exportFile("partido-"+cg.date+"-"+cg.rival.replace(/[^\wáéíóúñ-]+/gi,"-")+".csv", csvOf(cg, player), "text/csv"); break;
    case "export": exportFile("baloncesto-copia-"+today()+".json", JSON.stringify(S), "application/json"); break;
    case "import": var fi=document.getElementById("imp"); if(fi) fi.click(); break;
    case "clear-sample":
      confirmBox("Borrar datos de ejemplo", "Se quitarán los jugadores y partidos de ejemplo. Lo que hayas añadido tú se mantiene.", "Borrar ejemplo", true, function(){
        S.players = S.players.filter(function(x){ return !x.sample; });
        S.games = S.games.filter(function(x){ return !x.sample; });
        if(!liveGame()) S.liveId=null;
        S.sample=false; U.sel=null; U.game=null; U.tab="jugadores"; try{ location.hash="jugadores"; }catch(e){}
      }); break;
    case "season": U.season=v; render(); break;
    case "edit-game": var eg=gameById(v); if(eg){ U.draft=makeDraft(eg); U.justFinished=null; render(); window.scrollTo(0,0); } break;
    case "edit-cancel": U.draft=null; U.justFinished=null; render(); window.scrollTo(0,0); break;
    case "edit-addq": if(U.draft && U.draft.nq<5){ U.draft.nq++; U.draft.opp[U.draft.nq]=0; render(); } break;
    case "edit-addp":
      var sel2=document.getElementById("ed-add"); if(!U.draft || !sel2) return;
      var gl=gameById(U.draft.id); if(U.draft.roster.length >= rosterLimit(gl && gl.friendly)) return;
      var nid=sel2.value; if(U.draft.roster.indexOf(nid)<0){ U.draft.roster.push(nid); var eg2=gameById(U.draft.id); U.draft.p[nid]=draftRow(eg2,nid); }
      render(); break;
    case "stats": U.stats=v; U.player=null; render(); break;
    case "player": U.player=v; render(); window.scrollTo(0,0); break;
    case "player-close": U.player=null; render(); break;
    case "mT": U.mT=v; render(); break;
    case "mP": U.mP=v; render(); break;
    case "open-h": U.tab="historial"; U.game=v; U.player=null; try{ location.hash="historial"; }catch(e){} render(); window.scrollTo(0,0); break;
    case "pdf":
      var pg = gameById(v); if(!pg) return;
      try{ exportFile("partido-"+pg.date+"-"+pg.rival.replace(/[^\wáéíóúñ-]+/gi,"-")+".pdf", pdfGame(pg, S.team, player), "application/pdf"); }
      catch(err){ U.modal={title:"No se pudo crear el PDF", body:"Ha ocurrido un error al generar el archivo. Prueba otra vez.", ok:"Entendido"}; render(); }
      break;

    case "modal-ok": var fn = U.modal && U.modal.fn; U.modal=null; if(fn) fn(); save(); render(); break;
    case "modal-cancel": U.modal=null; render(); break;
    case "update-app": applyUpdate(); break;
    case "opts": U.opts = !U.opts; render(); break;
    case "share-file": shareLastFile(); break;
    case "copy":
      var ta=document.getElementById("cp"); if(!ta) return;
      try{ navigator.clipboard.writeText(ta.value).then(function(){ b.textContent="Copiado"; }).catch(function(){ ta.select(); b.textContent="Selecciona y copia"; }); }
      catch(err){ ta.select(); }
      break;
  }
});

document.addEventListener("submit", function(e){
  e.preventDefault();
  var f = e.target;
  if(f.id==="f-edit"){ saveEdit(); return; }
  if(f.id==="f-game"){
    var roster = Array.prototype.map.call(f.querySelectorAll('.checks input[type="checkbox"]:checked'), function(x){ return x.value; });
    var fr = document.getElementById("g-friendly"), friendly = !!(fr && fr.checked);
    var rerr = rosterError(roster.length, friendly);
    if(rerr){ document.getElementById("g-err").textContent=rerr; return; }
    var g = {id:uid(), rival:(document.getElementById("g-rival").value.trim()||"Rival"), date:(document.getElementById("g-date").value||today()),
      place:document.getElementById("g-place").value, roster:roster, events:[], q:1, done:false, onCourt:[null,null,null,null,null]};
    if(friendly) g.friendly = true;
    S.games.push(g); S.liveId=g.id; U.sub="anotar"; U.sel=null; save(); render(); window.scrollTo(0,0);
  }
  if(f.id==="f-player"){
    var err = document.getElementById("p-err");
    var numS = document.getElementById("p-num").value.trim(), name = document.getElementById("p-name").value.trim(), pos = document.getElementById("p-pos").value;
    var num = parseInt(numS,10);
    if(numS==="" || isNaN(num) || num<0 || num>99){ err.textContent="Escribe un dorsal entre 0 y 99."; document.getElementById("p-num").focus(); return; }
    if(!name){ err.textContent="Escribe el nombre del jugador."; document.getElementById("p-name").focus(); return; }
    var dup = S.players.filter(function(p){ return p.active && p.num===num && p.id!==U.edit; })[0];
    if(dup){ err.textContent="El dorsal "+num+" ya lo tiene "+dup.name+"."; document.getElementById("p-num").focus(); return; }
    if(U.edit){ var p=player(U.edit); if(p){ p.num=num; p.name=name; p.pos=pos; } U.edit=null; }
    else S.players.push({id:uid(), num:num, name:name, pos:pos, active:true});
    save(); render(); var pn=document.getElementById("p-num"); if(pn) pn.focus();
  }
  if(f.id==="f-team"){
    S.team = document.getElementById("t-name").value.trim() || "Mi equipo"; save(); render();
  }
});

document.addEventListener("input", function(e){ if(e.target.getAttribute && e.target.getAttribute("data-ed")) onEditInput(e.target); });
document.addEventListener("change", function(e){
  if(e.target.getAttribute && e.target.getAttribute("data-ed")){ onEditInput(e.target); return; }
  if(e.target.closest && e.target.closest("#f-game") && e.target.type==="checkbox"){ updateRosterForm(); return; }
  if(e.target.getAttribute && e.target.getAttribute("data-pref")){ setPref(e.target.getAttribute("data-pref"), e.target.checked); return; }
  if(e.target.id!=="imp") return;
  var file = e.target.files && e.target.files[0]; if(!file) return;
  var rd = new FileReader();
  rd.onload = function(){
    try{
      var d = JSON.parse(rd.result);
      if(!d || !Array.isArray(d.players) || !Array.isArray(d.games)) throw new Error("formato");
      var nd = migrate(d); if(!nd) throw new Error("formato");
      confirmBox("Importar copia", "La copia tiene "+d.players.length+" jugadores y "+d.games.length+" partidos. Sustituirá a todos los datos actuales.", "Importar", true, function(){
        setData(nd);
        U.sel=null; U.game=null; U.edit=null;
      });
    }catch(err){
      U.modal = {title:"No se pudo importar", body:"El archivo no es una copia de esta app. Elige el archivo .json que exportaste desde aquí.", ok:"Entendido"}; render();
    }
  };
  rd.readAsText(file);
  e.target.value = "";
});

document.addEventListener("pointerover", function(e){ var h = e.target.closest && e.target.closest(".ch-hit"); if(h) showTip(h); });
document.addEventListener("pointerout", function(e){ var h = e.target.closest && e.target.closest(".ch-hit"); if(h){ var t=h.closest(".chart").querySelector(".ch-tip"); if(t) t.hidden=true; } });
document.addEventListener("click", function(e){ var h = e.target.closest && e.target.closest(".ch-hit"); if(h) showTip(h); });
document.addEventListener("keydown", function(e){ if(e.key==="Escape" && U.ask){ answerAsk("none"); return; } if(e.key==="Escape" && U.opts){ U.opts=false; render(); return; } if(e.key==="Escape" && U.modal){ U.modal=null; render(); } });
}
