# Criterios de diseño y funcionamiento — Observatorio v2

**Hito de diseño:** 16-11-2026. **Objetivo:** permitir que una persona que desconoce una compra pública pueda comprender un sector, localizar procesos concretos y profundizar con trazabilidad a la fuente.

## 1. Arquitectura de información

| Nivel | Pregunta | Resultado visible | Acción |
|---|---|---|---|
| **Contexto** | ¿Qué mercado quiero investigar? | Ejemplos intercambiables (IA/pedagogía/TI; RESPEL; arbolado/áreas verdes; todos) | Cambiar mercado y restablecer filtros |
| **Panorama** | ¿Cuánto movimiento hay en los registros disponibles? | Conteo, cierres, compradores, cobertura de montos, distribución, meses | Seleccionar barras para filtrar |
| **Exploración** | ¿Qué licitaciones son relevantes? | Buscador textual y facetas por naturaleza, calendario y organismo; orden por cierre | Abrir ficha; descargar CSV |
| **Expediente** | ¿Qué se compra, cuándo, a quién consultar y qué no está validado? | Código, organismo, objeto, monto tipificado, estado reportado, fuentes, OC vinculadas | Acceder a fuentes oficiales y antecedentes |

### Principios de UX

- **Progresión de lo general a lo particular**: panorama antes del listado y ficha seleccionada, evitando repetir filtros desconectados.
- **Una sola gramática visual** para todos los mercados: tonalidades diferenciadas en las tarjetas, gráficos con proporciones y numerador explícito, enlaces en texto de acción.
- **Estado verificable, no aspiracional**: distinguir datos indexados, API puntual, estado reportado y plazo calculado. “Futuro” no significa “abierto”. El label de plazo se recalcula con el reloj; fuentes se actualizan solo por cambios de datos.
- **Visualización proporcional y contextual**: las barras de tipos/compradores se calculan sobre la selección; no se presenta representatividad estadística del país.
- **Monto con identidad económica**: importes agrupados por `clase|moneda|IVA`. Nunca sumar USD con CLP, adjudicación con presupuesto o OC con pagos. Los nulos afectan la cobertura informada.
- **Movilidad y accesibilidad**: HTML semántico; <kbd>Tab</kbd> y botones reales; controles etiquetados; estado `aria-pressed`; contenido `aria-live`; foco visible, contraste y diseño de 4 columnas a 1 según ancho; respeto `prefers-reduced-motion`.
- **Sin dependencia del backend**: assets locales; no ejecución de API en navegador ni exposición de secretos; enlaces de fuente abren nuevo contexto seguro.
- **Exportación con procedencia**: CSV de selección actual, codificación UTF-8/BOM, campos de calidad y estado de plazo, celdas protegidas contra interpretación de fórmulas.

## 2. Modelo genérico para otro ejemplo

El dataset público es [`datos/catalogo_demo_v2.json`](../datos/catalogo_demo_v2.json), y contiene:

```json
{
  "markets": [{"id":"ia","name":"IA, pedagogía y TI","description":"..."}],
  "records": [{
    "id":"592-31-LP26",
    "market":"ia",
    "title":"...",
    "buyer":"...",
    "category":"estudio",
    "topics":["Pedagogía"],
    "closing_at":"2026-12-14T20:00:00-03:00",
    "amount":{"value":97000000,"currency":"CLP","kind":"presupuesto_estimado","tax":"sin_verificar"},
    "reported_status":"No verificado en fuente oficial en esta revisión",
    "sources":[{"kind":"oficial","url":"https://www.mercadopublico.cl/..."}],
    "related_orders":[]
  }]
}
```

Para agregar un ejemplo, incorporar una definición en `markets` y vincular registros; el cálculo y las vistas se generan sin cambiar el HTML. El conector/sincronizador externo futuro debe respetar estas mismas distinciones y ser autorizado por separado. **No hay API en vivo ni G4 autorizado.**

## 3. Casos de aceptación

1. El selector **IA** muestra 6 registros, 5 cierres futuros a la hora de validación del 16-11-2026 y un histórico vencido; presupuestos estimados CLP 195.000.000 agrupados por naturaleza e IVA, y USD 11.000 separado.
2. El selector **RESPEL** muestra 1 licitación, presupuesto disponible CLP 7.130.073 con impuestos y 2 OC separadas (CLP 5.474 y CLP 2.324.070, IVA incluido). No afirma pago/recepción.
3. El selector **Áreas verdes** muestra 6 licitaciones; en La Pintana, CLP 149.434.374 *adjudicación neta*; en Cabildo *desierta* y sin cierre respaldado; monto de 5/6 desconocido.
4. **Todos** muestra 13 registros y no suma montos de distinta naturaleza, divisa o impuesto.
5. Clic en categoría, mes o comprador filtra tanto el resumen como la lista. “Limpiar filtros” restituye el mercado elegido.
6. Búsqueda textual con/sin tildes funciona; ninguna coincidencia muestra un estado vacío claro sin inventar resultados.
7. Ficha puede abrir fuentes oficiales y las OC relacionadas; no representa anexos sin URL original.
8. Exportación CSV contiene los registros filtrados, estado calculado, origen y montos tipificados, y evita prefijos de fórmula.
9. URL con parámetros `tema`, `q` e `id` puede abrir directamente un ejemplo y ficha.
10. No se insertan datos no confiables mediante `innerHTML`, no se expone token ni se hace solicitud API en navegador.

## 4. Evidencia y límites de QA

- Dataset v2: **10/10** verificaciones de integridad y procedencia antes de publicación.
- Modelo: **13/13** pruebas funcionales aisladas de filtros y estadística; **3/3** pruebas adicionales de formato fecha; corrección de un posible desfase en fechas `YYYY-MM-DD`.
- Interfaz: **12/12** pruebas en DOM simulado para arranque, selección de ejemplos, filtros, montos, OC y estado vacío; sin errores reportados.
- HTML: controles y accesibilidad estructural comprobados estáticamente. CSS: responsive y ausencia de recursos externos comprobados.
- **No probado:** HTTP 200 de GitHub Pages, render real en Safari/Chrome, exportación CSV física, UI en dispositivos ni integración con fuentes oficiales en vivo. La prueba de DOM es simulación de código y no reemplaza navegador E2E.

## 5. Siguiente ciclo de producto

- QA humano sobre producto web: apertura, interacción con 4 ejemplos, búsqueda, filtros, enlaces y archivo CSV; capturas de pantalla escritorio/móvil.
- **Acceso documental selectivo**: identificar originales de bases/actas/ofertas con trazabilidad y permiso específico de lectura. No descargarlos de forma masiva.
- **Cobertura ampliable**: alimentar nuevos temas mediante búsquedas públicas acotadas; registrar consulta, fecha, universo consultado, criterios y exactitud.
- A futuro, para presentar estadísticas del **mercado nacional** y no de una muestra, construir proceso autorizado de extracción y deduplicación y verificar cobertura/actualidad. Las puertas G3/G4/G5 permanecen cerradas.
