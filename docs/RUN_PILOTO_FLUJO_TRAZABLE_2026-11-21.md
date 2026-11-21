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
