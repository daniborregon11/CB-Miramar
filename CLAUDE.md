# App de estadísticas de baloncesto

## Qué es
App gratuita para llevar las estadísticas de **mi equipo** durante un partido de baloncesto. La usa **una sola persona** desde la banda, en una **tablet en horizontal**, y debe funcionar **sin conexión a internet**. La idea a medio plazo es poder ofrecerla a otros equipos.

El prototipo funcional está en `prototipo.html` (un solo archivo HTML con CSS y JS). **Es la referencia de comportamiento y diseño**: todo lo que hace debe seguir funcionando igual en la app.

## Objetivo de esta fase
Convertir el prototipo en una **PWA instalable** (se instala desde el navegador en la tablet y se abre como una app):
- Funciona 100 % offline (service worker que cachea todo, incluidas las fuentes).
- Manifest con `"orientation": "landscape"`, `"display": "standalone"`, iconos y nombre.
- Datos en **IndexedDB** (no localStorage), con migración automática desde el formato del prototipo.
- Código organizado en módulos y con tests de la lógica de estadísticas.
- Despliegue gratuito (GitHub Pages, Netlify o Cloudflare Pages).

Más adelante (no ahora): empaquetar para Google Play / App Store (p. ej. con Capacitor) y, opcionalmente, cuentas y sincronización.

## Funcionalidades (todas existen ya en el prototipo)

### Partido (anotar en directo)
- Marcador arriba: puntos de mi equipo, selector de cuarto (1C–4C, PR), botones grandes +1/+2/+3 para el rival.
- Cancha (media pista blanca, dibujada en SVG) con los 5 jugadores en pista como fichas redondas. **Banquillo debajo de la cancha**, separado, para no tocarlo sin querer al anotar.
- Anotar: tocar jugador en pista → tocar acción. Acciones: 2 PT, 3 PT y TL (anotado/fallado), rebote defensivo, rebote ofensivo, asistencia, robo, tapón, pérdida, falta.
- Cambios: tocar jugador del banquillo → tocar el de pista que sale. Si hay hueco libre, entra directamente. "Mandar al banquillo" deja hueco.
- Faltas visibles en cada ficha (aviso con 4, eliminado con 5).
- Registro de últimas acciones, "Deshacer última", borrar cualquier acción y aviso con "Deshacer" tras cada acción.
- **Finalizar partido pide confirmación** ("¿Seguro…? / No, seguir anotando"). Al finalizar se abre el editor del acta.

### Editar acta (tras finalizar o en cualquier momento desde Historial)
- Introducir **minutos** de cada jugador (opcional).
- Editar cualquier estadística de cada jugador, los puntos del rival por cuarto, rival, fecha y lugar. Añadir prórroga. Añadir un jugador no convocado.
- Validaciones: enteros ≥ 0, anotados ≤ intentados, minutos 0–70.
- Las correcciones se guardan como eventos de ajuste (`ADJ` / `OPPADJ`), sin borrar los eventos originales.

### Jugadores
- Alta, edición y baja (dorsal 0–99 sin repetir, nombre, posición). Si tiene estadísticas, se da de baja (se conservan sus datos).
- Nombre del equipo. Copia de seguridad: exportar/importar JSON.

### Historial
- Lista de partidos con resultado. Ficha del partido: parciales, tabla por jugador (MIN, PTS, T2, T3, TL, RO, RD, REB, AS, RB, TP, PE, FC, +/-, VAL) y totales.
- Exportar **PDF** (A4 horizontal, generado sin librerías externas) y CSV (separador `;`).

### Estadísticas
- **Equipo**: balance, puntos a favor/en contra, gráfica de evolución con selector de dato y **línea de tendencia** (regresión lineal, mínimo 3 partidos), promedios, métricas avanzadas, partido a partido y quintetos.
- **Jugadores**: tabla de temporada (promedios/totales) y análisis individual con gráfica y tendencia, últimos 3 partidos frente a la media, por 40 minutos y partido a partido.

## Fórmulas
- VAL = PTS + REB + AS + RB + TP − tiros de campo fallados − TL fallados − PE − FC
- eFG% = (TCanotados + 0,5·T3anotados) / TCintentados
- TS% = PTS / (2·(TCintentados + 0,44·TLintentados))
- Posesiones = TCintentados + 0,44·TLintentados − RO + PE
- Puntos por 100 posesiones (ataque) y recibidos por 100 posesiones (defensa, asumiendo las mismas posesiones para el rival)
- Más/menos y quintetos: se reconstruye quién está en pista recorriendo los eventos `SUB` en orden.
- Tendencia: estable si el cambio total es menor que 3 puntos porcentuales (en %) o menor que el 8 % de la media (mínimo 1).

## Modelo de datos (del prototipo)
```
{ v, team, sample, liveId,
  players: [{ id, num, name, pos, active, sample? }],
  games: [{ id, rival, date, place, roster:[playerId], q, done, onCourt:[id|null ×5],
            min:{playerId: minutos}, sample?,
            events: [{ id, a, p, q, t, ... }] }] }
```
Tipos de evento (`a`): `2A 2F 3A 3F 1A 1F RO RD AS RB TP PE FC` (con `p` = jugador), `OPP` (puntos del rival, `pts`), `SUB` (`in`, `out`), `ADJ` (`p`, `d:{campo:delta}`), `OPPADJ` (`pts`, `q`).
**Las estadísticas siempre se calculan a partir de los eventos**; no se guardan totales.

## Diseño
- Tema claro y oscuro. Acento naranja (#D4531F), marcador oscuro, fuentes Barlow Condensed (títulos y números) e IBM Plex Sans (texto). Hay que incluirlas en la app para que funcionen offline.
- En tablet horizontal, las pestañas van en una barra lateral. Botones grandes y pensados para el dedo.
- Toda la interfaz en español.

## Forma de trabajar
- Antes de cambios grandes, proponer un plan y esperar mi visto bueno.
- Mantener el comportamiento del prototipo salvo que pida otra cosa.
- Explicarme cómo probar cada cambio en la tablet.

## Estado actual (fase PWA terminada)
App publicada en https://daniborregon11.github.io/CB-Miramar/ (repo `daniborregon11/CB-Miramar`, con mayúsculas). Guía para el usuario: `GUIA.md`. Detalle técnico: `README.md`.

- **Tecnología:** JavaScript sin framework (el código del prototipo, repartido en módulos), Vite, vite-plugin-pwa, IndexedDB con `idb`, fuentes de `@fontsource`.
- **Código:** `src/logic/` (cálculos puros, sin pantalla), `src/storage/` (IndexedDB y migración), `src/views/` (una pantalla por archivo), `src/ui/` (piezas comunes, PWA, pantalla encendida), `src/actions.js` (botones), `src/state.js` (datos `S` y estado `U`).
- **Formato de datos:** el del prototipo con `v: 3`. Toda entrada (prototipo en localStorage, copia importada) pasa por `migrate()`.
- **Publicación:** cada push a `main` pasa lint + Vitest + Playwright en GitHub Actions y, si todo va bien, publica en GitHub Pages.
- **Comandos:** `npm run dev`, `npm test`, `npm run test:e2e`, `npm run lint`, `npm run build`.

### Reglas al cambiar código
- `tests/e2e/equivalencia.spec.js` compara la app con `prototipo.html` pantalla a pantalla. Si un cambio pedido por el usuario rompe esa comparación, documentar la diferencia como "cambio intencionado" en la prueba (no borrar pasos sin motivo).
- Cambios intencionados respecto al prototipo hasta ahora: equipo por defecto "CB Miramar"; exportar descarga directamente con aviso "Compartir" (sin la ventana del chat); pantalla encendida con partido en juego; franja de versión nueva; no se recarga al deslizar.
- Las versiones nuevas nunca se activan solas (`registerType: "prompt"`): no romper esto, puede pillar al usuario en mitad de un partido.
- Comprobar cada prueba nueva provocando el fallo que debe detectar.
