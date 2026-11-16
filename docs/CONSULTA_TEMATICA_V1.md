# Consulta temática libre — puente seguro v1

**Fecha:** 16-11-2026 (Chile). **Estado:** función local operativa en código y backend G2 temático **preparado pero NO desplegado**. No se ofrece búsqueda automática pública hasta verificar URL, secreto y controles de servidor. [Arquitectura del Worker](BACKEND_G2_TEMATICO_WORKER.md).

## Qué funciona hoy

- [Abrir consulta temática](../consulta.html) y escribir un tema: energía solar, educación ambiental, ciberseguridad, eficiencia energética, entre otros.
- Abrir la [búsqueda avanzada oficial de licitaciones](https://www.mercadopublico.cl/Portal/Modules/Site/Busquedas/BuscadorAvanzado.aspx?qs=1), **copiar el término** y buscarlo en el campo del portal. No se asume una URL con parámetros precargados no documentados. ChileCompra también dispone de un nuevo Buscador de Oportunidades de Negocio; debe consultarse desde el portal.
- Importar un **extracto local** de hasta **100 filas y 1 MB** en CSV (coma, punto y coma o tabulador; se admiten campos entre comillas) o JSON. Alternativamente, pegar las filas de una tabla. Los registros se deduplican por código. No se admite importación de un ZIP masivo.
- Visualizar indicadores y distribución por tipo y organismo, revisar fichas con referencia al portal y descargar los resultados temáticos en CSV. Puede eliminar el filtro para ver todos los registros cargados.
- Probar sin archivo con **«Probar energía solar (3)»**, que usa fichas secundarias indexadas de la Universidad Tecnológica Metropolitana (`5251-105-LP26`), Universidad de Talca (`1469-359-L126`) y Municipalidad de Taltal (`906816-24-B226`), con corte 16-11-2026. Sus fechas y montos son orientativos y sus estados no han sido revalidados; fuentes en [JSON solar](../datos/ejemplo_energia_solar_2026-11-16.json). También existe **«Probar con 6 licitaciones IA»**.

**Limitación principal:** esto **no** consulta automáticamente a ChileCompra por el texto introducido. El usuario recoge los resultados en el portal y carga una muestra, que se analiza totalmente **en el navegador**; no hay `fetch`, ticket, backend, sincronización, publicación de los archivos, caché ni almacenamiento persistente. Cerrar o recargar la página descarta la importación.

## Columnas admitidas

La [plantilla CSV](../datos/plantilla_consulta.csv) contiene los nombres recomendados:

| Columna | Otras cabeceras reconocidas | Uso |
|---|---|---|
| `codigo` | `CodigoExterno`, `id`, `idLicitacion` | Obligatorio; identificador oficial |
| `nombre` | `Nombre`, `titulo`, `NombreLicitacion` | Nombre |
| `organismo` | `Comprador`, `NombreOrganismo`, `Unidad de Compra` | Comprador |
| `descripcion` | `Descripción`, `description`, `detalle` | Objeto |
| `fecha_cierre` | `FechaCierre`, `closing_at` | Fecha ISO o `DD/MM/AAAA HH:mm` |
| `monto` | `MontoEstimado`, `presupuesto`, `amount` | Valor **importado, no verificado** |
| `moneda` | `currency` | CLP o USD. **Necesaria para sumar montos; si falta, el monto no se agrega** |
| `estado` | `CodigoEstado`, `status` | Reportado por archivo, no revalidado |
| `url` | `enlace`, `urlOficial` | Se acepta únicamente HTTPS bajo mercadopublico.cl; de otro modo se intenta generar ruta por código, marcada **no comprobada** |
| `region`, `tipo` | `regioncomprador`, `category` | Clasificación opcional |

No todos los reportes descargados de ChileCompra tienen cabeceras idénticas: **el importador no garantiza compatibilidad automática con todos los formatos oficiales**. Antes de importar, convierta a estas columnas si es necesario. Para JSON, use una lista de objetos con las mismas claves o un objeto `{"records":[...]}`.

Ejemplo mínimo de CSV:

```csv
codigo;nombre;organismo;descripcion;fecha_cierre;monto;moneda;estado
1234-56-LE26;Ejemplo ficticio de estructura;Organismo ilustrativo;Descripción ilustrativa;14/12/2026 15:00;1000000;CLP;SIN VERIFICAR
```

El ejemplo anterior es **solo estructural; no corresponde a una licitación real ni está incorporado en el Observatorio**.

## Calidad, seguridad y límites

- Se muestran resultados **solo de la selección importada**. Un resultado cero no demuestra que no existan licitaciones con ese término en el portal.
- Los cierres futuros derivan de la fecha indicada en el archivo y no equivalen a «licitación abierta». El estado reportado no se revalida; los enlaces por código no acreditan acceso o vigencia.
- El valor monetario se clasifica como **«monto de archivo (naturaleza económica no verificada)»**. No se supone adjudicación, pago ni IVA incluido. USD y CLP no se suman.
- Los enlaces externos se limitan a HTTPS y al dominio oficial; los datos se colocan en el HTML mediante `textContent`, no `innerHTML`. No se ejecutan fórmulas CSV; la exportación antepone una comilla simple a posibles fórmulas.
- La carga es **voluntaria y local**. No usar datos personales, expedientes reservados o documentación institucional privada en la prueba. Aunque nada se envía desde esta pantalla, sus propias políticas de manejo de información siguen siendo aplicables.
- No se realizan búsquedas recurrentes, descargas masivas, indexación histórica ni nuevas llamadas API. G3, G4 y G5 permanecen cerradas. La capacidad G2 histórica continúa limitada a la consulta autorizada de un único código.

## Arquitectura prevista para búsqueda temática automática

La [API de ChileCompra](https://www.chilecompra.cl/api/) documenta filtros por código, fecha, estado y organismo, **no una búsqueda por texto directa**. Para responder a una palabra libre con datos en tiempo real habría que:

1. Definir un servicio de backend con ticket protegido (nunca en HTML, URL de navegador, GitHub Pages o archivos públicos).
2. Ejecutar consultas **acotadas por días y límites de resultados**, no indexación histórica, tras autorización expresa de ampliación de G2.
3. Seleccionar y normalizar títulos/descripciones por término, registrar cobertura, fecha y cantidad de procesos revisados.
4. Publicar únicamente un resultado depurado (sin credenciales, datos personales ni originales privados) o atender una solicitud on-demand desde un backend seguro.
5. Mostrar resultados y sus límites de cobertura en el dashboard, manteniendo historia de fuentes y separación económica.

**No se ha implementado ni activado ese servicio.** GitHub Pages por sí solo no puede proteger una credencial API. La activación de G3, G4 o G5 requeriría decisiones adicionales independientes.

## Pruebas y reanudación

El importador incorpora límite 100 filas/1 MB, parser CSV con comillas, JSON, deduplicación, validación básica de fechas/montos, seguridad de URL y deduplicación. Tests aislados por JavaScript deben distinguirse de QA en navegador real.

Para continuar: primero probar [consulta.html](../consulta.html) con la muestra incorporada y un CSV propio; revisar apertura del enlace oficial, exportación y compatibilidad de cabeceras. Después evaluar backend seguro de búsquedas temáticas bajo un permiso G2 específico. Mantener como autoridad técnica el proyecto canónico y su último RUN.
