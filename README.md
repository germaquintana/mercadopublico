# Observatorio de Compras Públicas — muestra pública navegable

**Corte editorial:** 16 de noviembre de 2026 (America/Santiago). **Sitio candidato:** https://germaquintana.github.io/mercadopublico/ — GitHub Pages habilitado en configuración de repositorio. La respuesta HTTP del dominio y el render web aún requieren comprobación externa; la presencia del HTML en GitHub no prueba el despliegue.

## Vistas

- [`index.html`](index.html): **nueva pantalla de oportunidades y estudios** sobre 6 licitaciones reales de muestra (5 con cierre posterior al corte, una histórica). Filtros por palabra o código, área IA/pedagogía/TI, naturaleza de contrato, fecha límite y calendario del cierre. Ficha con organismo, objeto, monto, fecha, encaje y enlaces al portal y fuente de contraste. CSV de los resultados filtrados.
- [`expediente-respel.html`](expediente-respel.html): expediente piloto original `2373-38-LE23`, con sus dos órdenes de compra y clasificación documental pendiente. Separado para no contaminar oportunidades del área formativa.
- [`datos/oportunidades_muestra_2026-11-16.json`](datos/oportunidades_muestra_2026-11-16.json): instantánea del catálogo manual y procedencia para auditoría. El HTML incluye una copia de la misma instantánea y **no realiza peticiones externas**.
- El proyecto principal tiene autoridad sobre la ingesta y el estado del sistema. Esta publicación no contiene secretos ni referencias a archivos privados.

## Las seis licitaciones de la muestra

| Código | Área principal | Objeto | Cierre publicado (Chile) | Monto estimado |
|---|---|---|---|---|
| `592-31-LP26` | Pedagogía / estudio | Estudio curricular educación especial y curso autoinstruccional | 14-12-2026 20:00 | CLP 97.000.000 |
| `875-9-LP26` | TI / investigación | Inteligencia de mercado mediante plataforma y suscripción | 02-12-2026 15:00 | CLP 82.000.000 |
| `1082957-37-LE26` | Pedagogía + TI | Reportería, analítica y revirtualización de Aula Virtual ProChile | 24-11-2026 13:00 | CLP 16.000.000 |
| `1076403-15-LE26` | IA + TI / bienes | 10 licencias de agentes de IA para programar | 24-11-2026 15:00 | USD 11.000 |
| `2343-36-LE26` | IA + TI / bienes | Infraestructura computacional para IA | 20-11-2026 19:00 | No informado |
| `4205-17-L126` | Pedagogía + IA / histórico | Capacitación de docentes en IA para recursos educativos | 10-11-2026 (vencido) | No informado |

**No sumar divisas ni confundir presupuesto estimado con monto de adjudicación.** En Curacaví, dos índices discrepan en la hora del cierre; solo se considera confiable la fecha y el expediente está vencido.

## Procedencia y cautelas

Los datos se tomaron de fichas **públicas indexadas por terceros** ([Calza](https://calza.cl/licitaciones), [Licitaciones de Chile](https://licitacionesdechile.cl/) y [LicitaFast](https://licitafast.cl/)) el 16-11-2026 y se enlazaron a las fichas de origen en Mercado Público. Los enlaces de las fichas oficiales se extrajeron del botón oficial de esos proveedores, pero la apertura de los expedientes originales y sus bases no pudo verificarse en este ambiente. Los archivos o anexos mostrados por terceros no se descargaron ni custodiaron.

**Estado de la oportunidad:** la interfaz calcula *plazo futuro / vencido* desde el cierre indexado y el reloj actual; esto **no certifica que esté abierta**, ni considera cambios de cronograma, suspensiones o adjudicaciones. Antes de presupuestar o presentar ofertas hay que abrir la ficha oficial, comprobar estado actual, condiciones de admisibilidad, especificaciones, evaluación y requisitos técnicos. No existe alerta ni vigilancia automática.

## Seguridad, límites y siguientes entregables

- HTML estático, sin solicitudes API, credenciales, documentos originales, información privada ni automatización.
- Catálogo demostrativo manual de seis casos; **no** cubre todo el país ni se ha activado la indexación masiva (G4), descargas (G3) o automatizaciones (G5).
- Pendiente de QA en navegador real y HTTP del dominio Pages (MP-INT-12).
- Próximo módulo propuesto: selección por criterios/perfil del proveedor, revisión profunda de bases **solo tras autorización**, alertas de fecha previa revisión del permiso G5 y búsqueda de varias licitaciones por API bajo una nueva autorización acotada.
