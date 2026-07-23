# Descubrimiento de emisoras e indexación

## Por qué faltan emisoras

Radio Browser es un directorio comunitario. Puede no incluir una emisora, conservar un stream antiguo o carecer de datos de contacto. Ninguna fuente pública única contiene todas las radios online.

## Pipeline de descubrimiento recomendado

1. Importar Radio Browser como fuente principal.
2. Incorporar registros oficiales de radiodifusión por país, como FCC en Estados Unidos.
3. Consultar directorios con API o licencia explícita. No extraer masivamente sitios que lo prohíban.
4. Descubrir la web oficial mediante indicativo, frecuencia, ciudad y nombre comercial.
5. Buscar únicamente reproductores y manifiestos públicos: Icecast, Shoutcast, HLS `.m3u8`, `.m3u` y `.pls`.
6. Aceptar envíos de propietarios y usuarios con revisión editorial.
7. Guardar procedencia, fecha de comprobación y condiciones de uso de cada dato.

## Validación automática

- Solicitar pocos bytes del stream, sin descargar audio completo.
- Aceptar tipos MIME de audio y HLS conocidos.
- Verificar HTTPS, redirecciones, latencia y restricciones geográficas.
- Deduplicar por URL final normalizada, dominio oficial, indicativo, frecuencia y ciudad.
- Marcar como inactiva después de varios fallos separados, nunca por un único timeout.
- Revisar streams activos diariamente y datos editoriales con menor frecuencia.

## Modelo de datos mínimo

- Identificador interno estable, independiente de cada proveedor.
- Nombre, indicativo, frecuencia, país, región y ciudad.
- Stream actual y streams alternativos.
- Web oficial, favicon o logo autorizado y contactos.
- Géneros, idiomas, códec y bitrate.
- Fuente, fecha de descubrimiento, última validación y estado.

## SEO técnico

Cada emisora usa `/radio/{pais}/{slug}`. Por ejemplo, `/radio/us/ritmo-95-7-cubaton-y-mas`. La aplicación conserva compatibilidad con las antiguas URLs basadas en UUID y actualiza su canonical. La aplicación actual añade metadatos, canonical y `RadioStation` en JSON-LD en el cliente. Para indexación sólida a escala se recomienda servir estas rutas mediante SSR o prerenderizado con Next.js, Remix o un servicio equivalente.

El comando `npm run generate:sitemap` genera sitemaps fragmentados, con un máximo prudente de 45.000 URLs por archivo:

```powershell
$env:SITE_URL='https://tu-dominio.com'
npm run generate:sitemap
npm run build
```

El hosting debe redirigir `/radio/*` al renderizador de la aplicación. Para SEO serio, ese renderizador debe devolver desde origen un `<title>`, descripción, canonical y contenido específico de la emisora, sin depender de ejecutar JavaScript.

No conviene indexar fichas sin nombre, ubicación, stream validado o información diferencial. Es mejor publicar menos páginas útiles que miles de páginas vacías.
