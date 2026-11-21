# RUN 2026-11-21 — Piloto trazable, primera unidad

- Modalidad: ejecución manual por solicitud del titular, caso formativo profesional personal sobre producto público existente, no expediente DIMAO.
- Código: piloto-flujo.html, página autónoma que reutiliza assets/formacion-demo-data.js (16 registros).
- Producto: selección (máximo 3), fuentes y notas, ficha Markdown descargable, continuidad JSON exportable/importable, validación de esquema y IDs.
- Origen: dashboard general 29 registros demo; tema formación 16. El backend privado NO fue editado.
- QA: V8 sintaxis, IDs DOM, ausencia fetch y XMLHttpRequest, simulación DOM con 16 IDs únicos, límite 3, nota reflejada y handlers de exportación. No corresponde declarar prueba en navegador real ni acceso HTTP de GitHub Pages verificado.
- Archivos visibles: índice, maqueta formativa y README enlazados al piloto.
- Seguridad: sin conexiones nuevas, sin credenciales, sin bases/anexos descargados ni permisos G2/G3/G4/G5 cambiados.
- Pendiente: ensayo en navegador real, verificación HTTP de publicación y prueba humana de exportar/importar/cotejar fuente.
- Próximo paso: validar accesibilidad y completar un ensayo de 1–3 expedientes con resultados mensurables antes de transferir la metodología a Formación Continua.

## QA adicional y commits públicos (21-11-2026)
- `piloto-flujo.html`: commit `f5b40f4208892a35cd2dd0e786e537e8d180be0c`, blob `430c5a3ee1943729229b3295178676953d7ea80e`.
- Acceso `index.html`: commit `f49e913d9187e8fab3b795578cd8b23ac03e1a69`.
- Acceso `demo-capacitacion.html`: commit `17803f49dd67c5785af1be2aa0d9d12e698dd253`.
- `README.md`: commit `30d152b393906f49562996fcb78efe8122fc045c`.
- B07: archivos reconsultados; blobs y enlaces internos coinciden. Dataset original blob `ae4e531137f924b15570a7c8e93c4320e617ed01` no fue alterado.
- B08: unidad material completada como aplicación estática verificada con simulador; sitio HTTP y uso humano pendientes.
- Prueba de reanudación: exportar dos casos con nota y pregunta, retirar uno, importar y recuperar dos, rechazar ID desconocido, copiar ficha. Resultado positivo simulado.
