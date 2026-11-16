# Observatorio de Compras Públicas — dashboard general v2

**Última revisión de fuentes:** 16 de noviembre de 2026, Chile. **Versión:** 2.0, prototipo estático y reutilizable.  
**Dirección de GitHub Pages:** https://germaquintana.github.io/mercadopublico/

> GitHub Pages está habilitado; se verificaron los archivos y la navegación mediante una simulación de DOM, pero **el acceso HTTP al dominio publicado y la ejecución en navegador real no se pudieron comprobar desde el entorno de esta sesión**. La dirección no debe declararse validada como sitio vivo hasta obtener esa prueba.

## Backend G2 temático: implementado, pendiente de despliegue

Se creó un [Worker protegido](backend/src/worker.mjs) para consultar **de uno a tres días de publicaciones** de la API de Mercado Público, filtrar por tema, devolver hasta 40 fichas y registrar cobertura del período. Tiene [pruebas offline](backend/test/worker.test.mjs), validación Turnstile, limitación de frecuencia y [configuración de secretos](backend/wrangler.toml) separada del navegador.

**No hay URL ni backend activo verificado.** La [pantalla de consulta](consulta.html) muestra el nuevo bloque, pero su botón permanece deshabilitado porque [`assets/service-config.js`](assets/service-config.js) tiene `endpoint: null`. Está diseñado así para impedir afirmaciones falsas y exposición del ticket. La interfaz de importación manual y los ejemplos continúan operativos. Para activar, se requieren Cloudflare Worker, Turnstile y sus dos secretos **configurados fuera de GitHub** y una prueba HTTP real. Véase [guía de despliegue y riesgos](docs/BACKEND_G2_TEMATICO_WORKER.md).

**No se ejecutó ninguna consulta nueva autenticada.** Tampoco se autorizaron G3, G4 ni G5.

## Consulta temática para cualquier tema (nueva capacidad)

[**Abrir consulta libre**](consulta.html): introduce una palabra o tema (por ejemplo, **energía solar**), abre el buscador avanzado oficial para reunir resultados y **carga un CSV o JSON acotado** para analizar hasta 100 licitaciones **sin enviar archivos ni credenciales**. Incluye una muestra real indexada de **3 procesos de energía solar**, un ejemplo de 6 licitaciones de IA y una plantilla de importación. No se realiza una consulta automática por palabra en la API; el conector autenticado sigue pendiente de autorización y backend. [Instrucciones](docs/CONSULTA_TEMATICA_V1.md).

## ¿Qué se puede hacer?

1. Seleccionar un mercado: **IA, pedagogía y TI** (6 licitaciones), **residuos peligrosos** (1 licitación + 2 OC), **arbolado y áreas verdes** (6 licitaciones) o **todos los ejemplos** (13 licitaciones, sin mezclas monetarias).
2. Leer un **panorama temático**: total de procesos seleccionados, calendario de cierres, organismos compradores, cobertura de montos, distribución por tipo, meses y compradores.
3. Usar búsqueda por palabra, código, organismo y tema; filtrar por naturaleza, cierre publicado y comprador. Los gráficos de categorías, meses y compradores son **filtros interactivos**.
4. Abrir la **ficha detallada**: objeto, fechas, tipo, monto con naturaleza económica, estado de la fuente, calidad de evidencia y enlaces oficiales/secundarios. El expediente RESPEL presenta dos órdenes de compra relacionadas, diferenciadas del presupuesto.
5. Exportar la selección filtrada a **CSV local** con origen, tipo de monto, tratamiento de IVA, situación de plazo calculada y notas de evidencia. No se descargan originales ni se envían datos a terceros.

## Alcance real de la información

**Esto NO es todavía un buscador de todo Mercado Público.** La búsqueda funciona solo sobre los **13 registros manuales seleccionados** para demostrar el producto general. No hay actualización automática, consulta masiva en navegador, cobro, cuentas, token ni servicio externo. Los resultados no prueban que una convocatoria siga abierta: *plazo futuro* depende únicamente de la fecha indexada comparada con el reloj. Las fuentes pueden estar desactualizadas.

- **IA, pedagogía y TI (6):** 592-31-LP26, 875-9-LP26, 1082957-37-LE26, 1076403-15-LE26, 2343-36-LE26, 4205-17-L126. Datos obtenidos de fichas secundarias indexadas; bases originales y estado actual no comprobados.
- **RESPEL (1 + 2 OC):** 2373-38-LE23, con órdenes de compra 2373-629-SE23 y 2373-52-SE25. Una consulta API puntual histórica y fichas oficiales indexadas; montos de OC no son pagos ni prueban recepción.
- **Arbolado y áreas verdes (6):** 2342-42-LR26 (San Bernardo), 2686-143-LP26 (Colina), 218-53-LR26 (San Joaquín), 1655-44-LP26 (Atención Primaria Metropolitana Central), 3621-33-LP26 (Cabildo, **desierta según fuente**) y 2275-1-LR26 (La Pintana, **adjudicación neta según acta**). Se cruzaron fichas oficiales indexadas y fuentes secundarias. En Cabildo no se consigna cierre preciso. Montos faltantes no se estiman.

Los hipervínculos de cada ficha apuntan a páginas del portal oficial cuando fueron identificadas; algunas rutas por código o fichas pueden requerir acceso interactivo y no han sido comprobadas mediante HTTP. La lectura o custodia de archivos originales **no** forma parte de esta publicación.

### Política de montos e indicadores

| Concepto | Tratamiento |
|---|---|
| Presupuesto estimado | Agregable **solo con otro monto de igual moneda, naturaleza y tratamiento del IVA**; no implica adjudicación |
| Presupuesto disponible | Grupo separado; no se suma al monto de OC ni a adjudicación |
| Adjudicación neta | Grupo separado, **no equivale a pago ni presupuesto** |
| Total de orden de compra | Visible dentro del expediente, no forma parte del presupuesto en el panorama |
| Valores en USD vs CLP | Grupos independientes; **nunca sumarlos directamente** |
| No informado | Se presenta explícitamente; cobertura de montos = registros con monto / total |

Los gráficos muestran la composición de **la selección** y no una cuota de mercado representativa.

## Archivos y mantenimiento

| Archivo | Rol |
|---|---|
| [`index.html`](index.html) | Estructura accesible y rutas de navegación |
| [`assets/styles.css`](assets/styles.css) | Sistema visual adaptable a escritorio y móvil |
| [`assets/logic.js`](assets/logic.js) | Modelo puro: filtros, estadísticas, plazos, montos y exportación |
| [`assets/app.js`](assets/app.js) | Interacción de selección, gráficos, fichas y URL compartible |
| [`datos/catalogo_demo_v2.json`](datos/catalogo_demo_v2.json) | **Fuente de datos pública de la muestra**, cuatro mercados y 13 procesos |
| [`assets/catalog.js`](assets/catalog.js) | Copia JS estática generada desde el JSON para abrir el dashboard sin API ni `fetch` |
| [`scripts/sync_catalog.py`](scripts/sync_catalog.py) | Generador/validador de sincronía entre JSON y JS |
| [`expediente-respel.html`](expediente-respel.html) | Vista histórica del piloto documental original |
| [`docs/CRITERIOS_DE_DISENO_V2.md`](docs/CRITERIOS_DE_DISENO_V2.md) | Reglas UX, calidad, pruebas y ampliación |

**Para agregar un mercado:** añadir una entrada a `markets`, crear registros con `market` correspondiente en el JSON, ejecutar `python scripts/sync_catalog.py --write` y después `python scripts/sync_catalog.py --check`. El dashboard calcula las vistas sin cambiar la estructura HTML. No colocar documentos privados, credenciales, datos personales innecesarios ni información institucional reservada en este repositorio público.

## Pruebas y limitaciones al cierre

- Validación de dataset: 4 ámbitos (tres mercados + todos), 13 LIC sin duplicados, 2 OC asociadas, enlaces públicos y distinción de un monto adjudicado neto.
- **Modelo lógico:** 13 pruebas funcionales aisladas, incluyendo filtro temático, plazos, búsqueda con acentos, partición de montos, CSV y prevención de fórmulas.
- **Interfaz:** 12 pruebas de simulación de DOM (4 selectores de mercado, 6/6 registros IA, 6/6 áreas verdes, filtro por categoría a 4 resultados, RESPEL y OC, búsqueda vacía), sin errores detectados.
- **Queda pendiente:** prueba HTTP 200 de Pages y QA de navegador real en móvil y escritorio, más lectura de bases oficiales y sincronización de mayor cobertura.

**Puertas de permiso preservadas:** G3 (descargas), G4 (índice masivo) y G5 (automatizaciones) siguen deshabilitadas. Un dashboard genérico reutilizable **no** habilita por sí mismo estas funciones.

---
Fuente oficial: [Mercado Público](https://www.mercadopublico.cl/). Este proyecto es una exploración externa sin vinculación de autoría con ChileCompra.
