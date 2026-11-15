# CB Miramar · Estadísticas de baloncesto

App (PWA) para llevar las estadísticas del equipo desde la banda, en tablet Android en horizontal y sin conexión.

App publicada: https://daniborregon11.github.io/cb-miramar/

## Estructura
- `prototipo.html`: prototipo original, referencia de comportamiento. **No se modifica.**
- `index.html` + `src/app.js`: la interfaz de la app.
- `src/logic/`: la lógica (cálculo de estadísticas, tendencias, acta, cambios, CSV/PDF, datos de ejemplo).
- `tests/`: tests de la lógica (Vitest).
- `tests/e2e/`: prueba que abre el prototipo y la app, hace los mismos toques y comprueba que se ve lo mismo (Playwright).

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
