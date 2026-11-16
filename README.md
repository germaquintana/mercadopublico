# Observatorio de Compras Públicas — piloto visual público

> **Estado a 16-11-2026:** el código público de la interfaz está disponible en `index.html`. La URL GitHub Pages requiere habilitación en **Settings → Pages → Deploy from a branch → main → /(root) → Save**; el sitio **no debe declararse desplegado ni accesible hasta comprobar HTTP 200 y su contenido**.

## Abrir el producto

- Archivo público: [`index.html`](index.html).
- URL de GitHub Pages **prevista, no verificada todavía**: `https://germaquintana.github.io/mercadopublico/`.
- Configuración para habilitarlo: [Settings → Pages](https://github.com/germaquintana/mercadopublico/settings/pages) — seleccionar **Deploy from a branch**, rama `main`, carpeta `/(root)` y guardar. Posteriormente comprobar la URL en navegador.
- No existe backend, servidor, token ni búsqueda nacional en esta edición. El HTML es autónomo.

## Qué muestra

Este primer corte tiene **un único expediente piloto precargado** para mostrar la futura experiencia de usuario, sin simular índice nacional:

| Referencia | Importe | Qué representa | Límites |
| --- | ---: | --- | --- |
| Licitación **2373-38-LE23** | **CLP 7.130.073** | Presupuesto disponible con impuestos | No acredita adjudicación ni pago |
| OC **2373-629-SE23** | **CLP 5.474** | Total de orden de compra (IVA incluido) | Cinco líneas nominales de 1 kg; no prueba ejecución |
| OC **2373-52-SE25** | **CLP 2.324.070** | Total de orden de compra (IVA incluido) | 2.170 kg según tres líneas; no prueba recepción o pago |

- [Ficha pública oficial LIC 2373-38-LE23](https://www.mercadopublico.cl/Procurement/Modules/RFB/DetailsAcquisition.aspx?qs=HxqwelYYhGoLfX5XQ6GXvQ%3D%3D)
- [Ficha pública oficial OC 2373-629-SE23](https://www.mercadopublico.cl/PurchaseOrder/Modules/PO/DetailsPurchaseOrder.aspx?qs=NrALePC8xTC1yYw2Yh%2FCew%3D%3D)
- [Ficha pública oficial OC 2373-52-SE25](https://www.mercadopublico.cl/PurchaseOrder/Modules/PO/DetailsPurchaseOrder.aspx?qs=g1LEIuIz2sU2o%2FOtOpY5KQ%3D%3D)

Las fichas son enlaces oficiales registrados por resultados indexados; su apertura puede requerir condiciones propias del portal. No se almacenaron los archivos originales. **Ningún enlace directo de adjunto se verificó.**

## Funciones y límites de evidencia

La interfaz contiene buscador y filtros **sobre un expediente**, pestañas de resumen, órdenes de compra, documentos, calidad y descarga CSV local. Sus datos son de referencia para diseñar el producto; no corresponden a un catálogo curado. Los precios nominales por kilogramo en las OC **no son precios de mercado validados**. No se han comprobado el decreto original, acta, oferta económica, Formulario N.º 5, anexos, guías de despacho, recepción conforme ni pagos. Los documentos faltantes se identifican como **pendientes**, nunca como inexistentes.

**La exportación CSV no implica análisis económico validado.** Incluye celdas vacías cuando falta respaldo y no calcula precios de mercado.

## Privacidad y arquitectura federada

Este repositorio público conserva únicamente el código HTML autónomo y los datos ya indicados en fichas públicas. No incluye documentos originales, datos personales no necesarios, credenciales, respuestas privadas de API, expedientes internos ni workflows de ingesta.

El desarrollo técnico y las decisiones metodológicas permanecen bajo autoridad de su origen. Esta publicación **no** autoriza descargas históricas, indexación masiva ni nuevas automatizaciones. No hay sincronización automática ni dependencia de un repositorio privado.

## Historial técnico de esta publicación

- **16-11-2026:** publicación inicial del MVP HTML en raíz desde código revisado del piloto, adaptado para enlaces exclusivamente públicos.
- Controles estáticos: verificar códigos, montos, pestañas, exportación CSV, ausencia de credenciales y enlaces a repositorios privados.
- **Pendiente:** prueba funcional en navegador y activación / verificación de GitHub Pages.
- Ningún dato publicado acredita pagos, precios contractuales curados ni totalidad de órdenes vinculadas.
