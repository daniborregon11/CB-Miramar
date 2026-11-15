// Mini servidor web para las pruebas: sirve una carpeta (una copia de dist/) para poder
// cambiar archivos a mitad de la prueba, como si se publicara una versión nueva.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname, normalize } from "node:path";

const TIPOS = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".woff": "font/woff", ".webmanifest": "application/manifest+json", ".json": "application/json" };

export function servir(carpeta) {
  const srv = createServer(async (req, res) => {
    let ruta = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (ruta.endsWith("/")) ruta += "index.html";
    const archivo = join(carpeta, normalize(ruta));
    if (!archivo.startsWith(carpeta)) { res.writeHead(403).end(); return; }
    try {
      const datos = await readFile(archivo);
      res.writeHead(200, { "Content-Type": TIPOS[extname(archivo)] || "application/octet-stream", "Cache-Control": "no-cache" }).end(datos);
    } catch { res.writeHead(404).end("no encontrado"); }
  });
  return new Promise(ok => srv.listen(0, "127.0.0.1", () => ok({ url: `http://127.0.0.1:${srv.address().port}/`, cerrar: () => new Promise(c => srv.close(c)) })));
}
