# MP-INT-17 — Backend G2 temático acotado y protegido (implementación, NO desplegado)

**Estado:** código implementado en repositorio público, sin credenciales y **SIN servicio vivo**. No atribuir búsqueda automática activa al dashboard. Corte: 16-11-2026, America/Santiago.

## 1. Arquitectura y responsabilidad

```text
Navegador: https://germaquintana.github.io/mercadopublico/consulta.html
    ├─ demo IA/solar y CSV local (ya habilitado)
    └─ búsqueda API (DESHABILITADA hasta desplegar):
         POST https://<tu-worker>.workers.dev/api/search
             ├─ CORS solo desde germaquintana.github.io
             ├─ Turnstile validado en servidor (hostname y action)
             ├─ rate limit por cliente y tasa global aproximada
             ├─ secreto MERCADOPUBLICO_TICKET solo en Worker
             ├─ 1–3 días de publicaciones, hasta 30 días hacia atrás
             ├─ <=250 registros leídos por día, <=40 resultados finales
             ├─ GET API oficial por fecha (nunca por texto)
             ├─ filtro por coincidencia de todos los términos
             └─ respuesta JSON normalizada, sin originales o persistencia
```

La **API oficial** documenta filtros por código, fecha, estado y organismo, pero no un parámetro de texto libre: https://www.chilecompra.cl/api/. Esta implementación usa la ruta fija `/servicios/v1/publico/licitaciones.json`, consultando hasta **tres fechas explícitas** y filtrando localmente nombre, descripción y organismo. Por diseño **no abarca todas las convocatorias abiertas**, especialmente las publicadas antes de esos días. La respuesta incluye `coverage`, `partial`, `exhaustive=false`, número examinado y días consultados. No existe rastreo ni índice histórico persistente.

El backend elegido es **Cloudflare Workers**. No hay conector de Cloudflare instalado ni acceso autenticado a una cuenta de despliegue en esta sesión. Se escogió una opción serverless con secretos y rate limiting, pero la decisión de operarlo y sus costos/condiciones pertenece al titular.

## 2. Archivos realmente creados

- [`backend/src/worker.mjs`](../backend/src/worker.mjs): ruta `/health` y `POST /api/search` (única operación real de consulta), límites y respuesta sin URL del ticket.
- [`backend/wrangler.toml`](../backend/wrangler.toml): Worker con dos bindings de rate limiting, sin cron ni triggers.
- [`backend/package.json`](../backend/package.json) y [`backend/test/worker.test.mjs`](../backend/test/worker.test.mjs): pruebas unitarias y de petición simulada sin secreto real.
- [`assets/service-config.js`](../assets/service-config.js): **endpoint y sitekey públicos inicializados a `null`**. No poner ticket ni secret de Turnstile en este archivo.
- [`assets/live.js`](../assets/live.js): validación de URL de Worker, health, widget Turnstile, `POST`, errores y traspaso de datos al visor en navegador.
- [`consulta.html`](../consulta.html) y [`assets/consulta.js`](../assets/consulta.js): bloque de búsqueda conectada y puente de resultados. Cuando endpoint es `null`, el botón queda deshabilitado. Se mantienen los ejemplos e importación manual previos.

## 3. Pasos humanos de puesta en servicio — no ejecutados

1. Crear o conectar una cuenta de Cloudflare y revisar sus condiciones de uso, costo y protecciones. Crear un **Worker** dedicado llamado `observatorio-mp-g2-tematico`, sin publicación de fuentes privadas. Ver https://developers.cloudflare.com/workers/.
2. En Cloudflare Turnstile, crear un widget para el hostname exacto `germaquintana.github.io`. Turnstile generará una **sitekey pública** y un **secret privado**; nunca incluir este último en GitHub ni en mensajes.
3. Configurar ambos secretos en *Worker → Settings → Variables and Secrets → Add (Secret)*: `MERCADOPUBLICO_TICKET` (el ticket existente, **sin compartirlo por chat**) y `TURNSTILE_SECRET` (secreto de Turnstile). Ver https://developers.cloudflare.com/workers/configuration/secrets/.
4. Clonar el repositorio público, abrir la carpeta `backend` y ejecutar localmente `npm test`. Revisar los identificadores `namespace_id` de los dos limitadores en `wrangler.toml` para que sean exclusivos de la cuenta. Usar `npx wrangler deploy` solo después de tener Worker, secretos y controles configurados. No añadir cron. Si el deployment exige configuración inicial adicional, resolverla exclusivamente dentro de Cloudflare.
5. Desde un navegador legítimo, abrir el endpoint `https://<tu-worker>.workers.dev/health`. Se requiere `ok:true` y `search_enabled:true`. **No hay todavía URL de Worker verificada**.
6. Reemplazar **solo** las dos propiedades públicas de [`assets/service-config.js`](../assets/service-config.js): `endpoint` con la URL exacta `https://<tu-worker>.workers.dev` y `turnstileSiteKey` con la sitekey pública. **No incluir el ticket ni el secret de Turnstile.** Publicar el commit y comprobar en Chrome/móvil que la verificación, búsqueda por fecha, indicadores y CSV funcionan.
7. Antes de una exposición general, comprobar límites del ticket según condiciones de la API, abusos y bloqueo/revocación. La restricción CORS **no constituye autenticación**; Turnstile y limitadores son defensa complementaria. Los rate limits de Cloudflare Workers son **aproximados por ubicación**, no un límite global estricto; si se requiere seguridad contra cuotas estrictas, añadir control centralizado o Cloudflare WAF apropiado. Ver https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/.

**Intervención humana de producción obligatoria:** el usuario conserva el control de su cuenta Cloudflare y sus secretos. No desplegar ni exponer el ticket mediante ChatGPT. Tampoco asumir que disponer del secreto G2 en GitHub Actions habilita automáticamente su uso en Cloudflare: son plataformas y almacenes de secretos distintos.

## 4. Pruebas, trazabilidad y límites

- Se ejecutó revisión estática del Worker (host API fijo, HTTPS, `redirect:error`, CORS exacto, Turnstile, limitadores, límites de días/registros/bytes y respuesta con procedencia).
- Se ejecutaron **14/14 pruebas puras en ejecución aislada** del código Worker: fechas, entradas maliciosas, mapeo de compra, monto no verificado y estado.
- Se ejecutaron **11/11 pruebas de petición simulada** con API oficial ficticia y validador Turnstile simulado: rechazos de origen, fechas, ausencia de secretos, filtrado de una coincidencia y no exposición de ticket en respuesta. **No se llamó al servicio real.**
- Pruebas de UI: bloqueo por defecto con `endpoint:null`, sintaxis JS, integridad de referencias DOM y código sin secretos. **Falta QA real del navegador y del Worker.**
- Pruebas de Node en `backend/test/worker.test.mjs` están creadas, **pero requieren ejecución en un checkout real** (`cd backend && npm test`) antes de afirmar que el runner oficial Node pasó.
- No se habilitó G3, G4 ni G5. Esta iteración produce un backend **preparado**, no un backend **desplegado** ni resultados reales por consulta temática.

## 5. QA de aceptación para autorizar activación

- `GET /health` devuelve `search_enabled:true`, bajo URL comprobada.
- Un POST desde GitHub Pages con Turnstile válido y período <=3 días produce datos con `coverage` correcto.
- Un POST sin Turnstile, desde otro origen, sin secreto o fuera de rango falla sin llamadas a API; 429 al superar límites.
- El frontend muestra **solo resultados reales del período solicitado**, no los ejemplos por defecto mezclados.
- Resultado cero se presenta como **ninguna coincidencia en el período**, nunca «no existe».
- Ningún archivo, captura, log o repositorio contiene valor de ticket, Turnstile secret, respuestas crudas con datos innecesarios o accesos a anexos originales.
- Verificar un caso real con las páginas de Mercado Público y controlar errores/latencia/cuotas antes de llamar «funcional».

**Siguiente hito:** MP-INT-18 — despliegue humano de Worker + pruebas HTTP/seguridad y activación posterior del frontend. Mantener MP-INT-15 QA web y MP-INT-11 RESPEL originales como pendientes independientes.
