# CB Miramar · Estadísticas de baloncesto

App (PWA) para llevar las estadísticas del equipo desde la banda, en tablet Android en horizontal y sin conexión.

App publicada: https://daniborregon11.github.io/CB-Miramar/

**Guía de uso (instalar, lista de comprobación, copias, cómo pedir cambios): [GUIA.md](GUIA.md)**

## Estructura
- `prototipo.html`: prototipo original, referencia de comportamiento. **No se modifica.**
- `index.html`: página base; carga `src/main.js`.
- `src/main.js`: arranque. `src/styles.css`: estilos. `src/fonts.css`: fuentes incluidas en la app (Barlow Condensed e IBM Plex Sans, paquetes @fontsource, licencia OFL).
- `src/state.js`: datos (`S`), estado de la pantalla (`U`), cargar y guardar.
- `src/storage/`: guardado en IndexedDB (`db.js`: un registro por partido, solo se reescribe lo que cambia) y conversión de datos del prototipo o de copias (`migrate.js`).
- `src/actions.js`: qué pasa al tocar cada botón, enviar formularios o escribir en el acta.
- `src/views/`: una pantalla por archivo (`partido`, `jugadores`, `historial`, `ficha`, `acta`, `estadisticas`).
- `src/ui/`: piezas comunes (`layout` con marcador, pestañas y ventana modal; `banner`, `toast`, `chart`, `export-file`; `pwa`: modo sin conexión y aviso de versión nueva; `wakelock`: pantalla encendida durante el partido).
- `iconos/`: iconos en SVG (normal y adaptable). `node scripts/iconos.mjs` genera los PNG de `public/`.
- `vite.config.js`: ficha de la app (manifest) y service worker (vite-plugin-pwa).
- `src/logic/`: la lógica (cálculo de estadísticas, tendencias, acta, cambios, CSV/PDF, datos de ejemplo). No toca la pantalla.
- `tests/`: tests de la lógica (Vitest).
- `tests/e2e/almacenamiento.spec.js`: los datos se conservan al reabrir, migración real desde el prototipo, copia importada y aviso si no se puede guardar.
- `tests/e2e/preguntas.spec.js`: ventanas de asistencia y rebote, deshacer unido al tiro, ajustes y «Rebotes ofensivos cogidos».
- `tests/e2e/mejoras.spec.js`: faltas recibidas y máximo de 12 convocados (amistoso sin límite).
- `tests/e2e/descargas.spec.js`: PDF, CSV y copia idénticos a los del prototipo; aviso con Compartir.
- `tests/e2e/pantalla.spec.js`: pantalla encendida solo con partido en juego; deslizar no recarga.
- `tests/e2e/pwa.spec.js`: ficha e iconos, funcionamiento sin conexión, aviso de versión nueva (sin recargar sola) y funcionamiento en subcarpeta como en GitHub Pages.
- `tests/e2e/fuentes.spec.js`: sin internet, las fuentes cargan y no se pide nada a webs de fuera.
- `tests/e2e/equivalencia.spec.js`: prueba que abre el prototipo y la app, hace los mismos toques (63 pasos) y comprueba que se ve lo mismo (Playwright).

## Comandos
| Comando | Qué hace |
|---|---|
| `npm install` | Instala las herramientas (una vez) |
| `npm run dev` | Abre la app en modo desarrollo |
| `npm test` | Tests de la lógica |
| `npm run test:e2e` | Comparación con el prototipo en un navegador automático |
| `npm run lint` | Revisa el código en busca de errores |
| `npm run build` | Genera la versión final en `dist/` |

Cada cambio subido a `main` pasa todos los tests y, si van bien, se publica solo en GitHub Pages
(ver `.github/workflows/publicar.yml`).

## Datos
Se guardan en IndexedDB del navegador (base de datos `cb-miramar`), solo en el dispositivo.
Al abrir la app por primera vez, si en la misma web hay datos del prototipo (localStorage, clave
`baloncesto-stats-v1`), se convierten y se pasan a IndexedDB; el almacenamiento antiguo no se borra.

## App instalable (PWA)
- Ficha de la app: nombre "CB Miramar", pantalla completa, horizontal, colores del marcador.
- Sin conexión: el service worker guarda la página, el código, los estilos, las fuentes y los iconos.
- Versiones nuevas: no se activan solas. Aparece la franja "Hay una versión nueva de la app" y se actualiza al pulsar "Actualizar".

## Ajustes para la tablet
- Pantalla siempre encendida mientras hay un partido en juego (se vuelve a pedir al volver a la app).
- Exportar PDF/CSV/copia: se descarga directamente y aparece "Compartir" (menú de Android: WhatsApp, correo, Drive…).
- Deslizar hacia abajo no recarga la página.
