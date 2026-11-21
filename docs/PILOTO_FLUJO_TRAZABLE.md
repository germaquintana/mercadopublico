# Piloto de flujo trazable — Selección, evidencias y continuidad

**Fecha de ejecución:** 2026-11-21 (America/Santiago). **Repositorio público:** germaquintana/mercadopublico. **Producto:** [piloto-flujo.html](../piloto-flujo.html).

## Propósito y unidad de resultado

Este es el primer **producto técnico demostrativo** del método de trabajo de la Oficina Virtual Inteligente, utilizando el Observatorio existente. La aplicación opera directamente sobre el catálogo de formación de 16 procesos, sin duplicarlo, y permite ejecutar una unidad desde seleccionar información hasta obtener una ficha y un archivo de continuidad. La transferencia eventual a una oficina de formación continua es **una hipótesis**, no una aprobación UDD ni despliegue institucional.

## Uso paso a paso

1. Abrir la página [Piloto de análisis trazable](../piloto-flujo.html). Filtrar por nombre, código, tema u organismo.
2. Seleccionar hasta tres casos. El límite impide confundir un resumen pequeño con un estudio exhaustivo.
3. Abrir la ficha oficial o contraste; la página solo **enlaza** a fuentes, no autentica ni inspecciona su contenido.
4. Registrar individualmente uno de tres estados manuales: pendiente; fuente abierta por el usuario; requiere revisión. Añadir nota y pregunta de análisis. Los estados **no equivalen a validación automática**.
5. Descargar la ficha Markdown. Incluye fecha de generación de Chile, corte editorial, campos de presupuesto/IVA, calidad de la fuente, enlaces y advertencias, sin sumar montos incompatibles.
6. Exportar continuidad JSON, recargar la página e importar el archivo para reabrir selección, pregunta y anotaciones. Las exportaciones se producen localmente en el navegador, **sin archivos remotos**.

## Evidencia y límites

- Datos: [muestra de 16 procesos](../datos/maqueta_cursos_ia_ti_educacion_2026-11-16.json), con corte al 16-11-2026. No es una búsqueda nacional.
- Código: [módulo autónomo](../piloto-flujo.html); usa assets/formacion-demo-data.js y assets/styles.css que ya existen.
- Fuente económica: se reproduce la naturaleza del monto y el estado del IVA del registro original; dato nulo se presenta como «No informado (no equivale a cero)».
- Seguridad: sin API, tokens, credenciales, formularios externos, fetch, XMLHttpRequest o almacenamiento persistente; datos de texto incorporados mediante textContent.
- Persistencia: el JSON se exporta voluntariamente. La herramienta valida esquema, máximo de tres casos, pertenencia de IDs a la fuente, no duplicación y límite de 150 kB al importar.
- Cuestión humana: **debe revalidarse** el portal oficial, apertura real, bases/anexos y responsabilidad del revisor antes de presentar un análisis para decisión.

## QA de la iteración

1. Compilación de JavaScript mediante el parser V8 — **OK**.
2. Validación de que todos los IDs DOM usados están en HTML, sin escritura remota — **OK**.
3. Prueba de interacción con un DOM simulado (no Chromium): carga de 16 procesos, 16 IDs únicos, todas las fuentes usan HTTPS; selección 3/3; intento de seleccionar cuarto rechazado; nota humana aparece en informe; callbacks de descarga Markdown y JSON activados — **OK**.
4. **No probado**: navegador Chromium real, accesibilidad interactiva en móvil, HTTP externo de GitHub Pages, ejecución JS en dispositivo de Catalina o revisión oficial de fichas.
5. Criterios para cerrar el piloto: prueba con navegador real de seleccionar → documentar → exportar → importar → contrastar URLs; registrar tiempos y errores, verificar lectura del informe y su conservación en Drive por persona autorizada.

## Arquitectura y permisos

El público ve exclusivamente datos ya publicados en el catálogo editorial del Observatorio. Las cuestiones privadas del proyecto profesional se registran en su propio repositorio y Drive; no deben copiarse aquí. El motor de captura privado mercadopublico_busqueda **no fue intervenido**: su próxima acción MP-INT-24 y las puertas G2/G3/G4/G5 se mantienen intactas.

**Próxima mejora recomendada:** probar el flujo con una persona supervisora, recoger incidencias de navegación y probar el sitio publicado HTTP. Después valorar el soporte de importación desde fuente autorizada para ampliar cobertura, sin activar procesos de captura no autorizados.

### Prueba adicional de continuidad, 21-11-2026

Se ejecutó una segunda simulación DOM usando la página ya guardada en GitHub (blob `430c5a3ee1943729229b3295178676953d7ea80e`): seleccionar 2 IDs; marcar un proceso como fuente abierta por la persona; introducir nota y pregunta; exportar JSON con esquema `piloto_mercado_v1`; retirar uno; importar el JSON y recuperar los 2 ID, nota, pregunta y estado; intentar importar `invalid-id` y comprobar rechazo sin perder la selección; copiar el informe al portapapeles simulado. **Resultado: todas las aserciones OK en DOM simulado; no reemplaza QA en navegador real.**
