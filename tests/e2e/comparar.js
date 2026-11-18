// Texto de la pantalla para comparar la app con el prototipo, sin los cambios hechos a propósito:
// - lo añadido en la app va marcado con data-nuevo y se oculta;
// - los minutos se muestran ahora como mm:ss (22:32): la columna MIN y el recuadro
//   «Minutos por partido» se dejan fuera en los DOS lados (se comprueban en mejoras.spec.js).
export function textoComparable(page, { campos = false } = {}) {
  return page.evaluate(campos => {
    const ocultos = [];
    const ocultar = el => { if (el && el.style.display !== "none") { ocultos.push([el, el.style.display]); el.style.display = "none"; } };
    document.querySelectorAll("#app [data-nuevo]").forEach(ocultar);
    document.querySelectorAll("#app table").forEach(t => {
      const cab = [...t.querySelectorAll("thead tr:first-child > *")].map(c => c.textContent.trim());
      const i = cab.indexOf("MIN");
      if (i < 0) return;
      t.querySelectorAll("tr").forEach(tr => ocultar(tr.children[i]));
    });
    document.querySelectorAll("#app .tile").forEach(tl => { if (tl.querySelector("span")?.textContent === "Minutos por partido") ocultar(tl); });
    const visible = el => !ocultos.some(([o]) => o.contains(el));
    let t = document.getElementById("app").innerText;
    if (campos) {
      t += [...document.querySelectorAll("textarea, input, select")].filter(visible)
        .map(x => "\n[" + x.type + "] " + (x.type === "checkbox" ? x.checked : x.tagName === "SELECT" ? (x.selectedOptions[0] || {}).text : x.value)).join("");
      t += "\n--toast--\n" + document.getElementById("toast").innerText;
    }
    ocultos.forEach(([el, d]) => { el.style.display = d; });
    return t;
  }, campos);
}
