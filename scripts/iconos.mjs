// Genera los iconos PNG de la app a partir de los SVG de la carpeta iconos/.
// Uso: node scripts/iconos.mjs   (necesita Playwright con Chromium)
import { chromium } from "playwright";
import { readFileSync, copyFileSync } from "node:fs";

const SALIDAS = [
  ["iconos/icono.svg", "public/icono-192.png", 192, true],
  ["iconos/icono.svg", "public/icono-512.png", 512, true],
  ["iconos/icono-adaptable.svg", "public/icono-adaptable-512.png", 512, false],
  ["iconos/icono-adaptable.svg", "public/apple-touch-icon.png", 180, false],
];

const navegador = await chromium.launch();
for (const [svg, png, tam, transparente] of SALIDAS) {
  const pagina = await navegador.newPage({ viewport: { width: tam, height: tam } });
  await pagina.setContent(`<html><body style="margin:0;background:transparent">${readFileSync(svg, "utf-8").replace("<svg ", `<svg width="${tam}" height="${tam}" `)}</body></html>`);
  await pagina.screenshot({ path: png, omitBackground: transparente });
  await pagina.close();
  console.log("creado", png);
}
await navegador.close();
copyFileSync("iconos/icono.svg", "public/icono.svg");
console.log("creado public/icono.svg");
