# Vibe Radio

SPA de radio online construida con React, TypeScript, Vite y Tailwind CSS. Consume el directorio público de Radio Browser y reproduce cada stream mediante `<audio>`.

## Puesta en marcha

```bash
npm install
npm run dev
```

Para generar la versión de producción:

```bash
npm run build
npm run preview
```

## Clima local

El clima se obtiene desde OpenWeather a través del Worker y usa las coordenadas aproximadas proporcionadas por Cloudflare. La clave no debe guardarse en el frontend ni en el repositorio.

```bash
npx wrangler secret put OPENWEATHER_API_KEY
npx wrangler secret put OPENWEATHER_API_KEY --env test
```

Para desarrollo local, se puede declarar `OPENWEATHER_API_KEY` en `.dev.vars`, archivo excluido del control de versiones.

## Funcionalidad

- Búsqueda simultánea por nombre y etiqueta.
- Directorio inicial de emisoras populares.
- Reproductor persistente con play, pausa y volumen.
- Favoritos guardados en `localStorage`.
- Estados de carga, vacío, error de API y stream roto.
- Panel de emisión, contacto y metadatos musicales opcionales.
- Filtros por continente, país y ciudad o región.
- Paginación incremental con “Cargar más”.
- Ritmo 95.7 WRMA incorporada como emisora verificada de respaldo.
- Ficha individual por emisora en `/radio/{pais}/{nombre}-{id}`.
- Metadatos SEO, canonical, JSON-LD y generador de sitemap.
- Barra de reproducción persistente tanto en el directorio como en cada ficha.
- Colecciones contextuales para radio latina, noticias, trabajo y escucha nocturna.
- Estado y fecha de la última comprobación oficial del stream.
- Historial privado de emisoras y canciones guardado en el dispositivo.
- Radar de pistas detectadas y opción de compartir la escucha actual.
- Saludo horario y clima local compacto con degradación silenciosa.
- Seis guías de escucha por momento con selección en directo y temporizador recomendado.
- Guías locales para ciudades validadas con al menos diez emisoras y sitemap independiente.

La estrategia de rastreo de nuevas emisoras e indexación está documentada en `docs/STATION-DISCOVERY-AND-SEO.md`.

## Popularidad y canción actual

Radio Browser proporciona los votos acumulados, los clics de las últimas 24 horas y su tendencia. La aplicación diferencia esas métricas, permite votar directamente en Radio Browser y respeta su intervalo de diez minutos por emisora.

Radio Browser no proporciona la canción ni el artista que suenan en directo. El Worker consulta exclusivamente endpoints públicos previamente verificados de emisoras compatibles, normaliza sus respuestas en `/api/now-playing/:stationUuid` y aplica caché y límites de tiempo. La app consulta ese endpoint cada 30 segundos y compone el top de canciones reproducidas durante la sesión. Si una emisora no publica metadatos, la interfaz lo explica y nunca muestra información ficticia.

## Notas de streaming

Algunos streams HTTP pueden ser bloqueados si la app se sirve mediante HTTPS, y algunas emisoras restringen la reproducción por CORS, región o formato. Son condiciones del proveedor del stream; la app las muestra como error contextual.

## Flujo de entrega

El repositorio utiliza ramas cortas `feature/*` y Pull Requests hacia `master`. Cada Pull Request pasa lint, tests y build. Las Pull Requests internas no creadas por Dependabot también se despliegan en `dev.viberadio.workers.dev`; las externas nunca reciben secretos ni despliegan. Cada merge en `master` vuelve a validar el proyecto y despliega `viberadio.net`.

Los despliegues requieren los secretos `CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID` en los entornos de GitHub `development` y `production`, además de la variable de repositorio `CLOUDFLARE_DEPLOY_ENABLED=true`. Consulta `CONTRIBUTING.md` para el flujo diario.

## Licencia

Este proyecto se distribuye bajo la licencia MIT. Consulta [LICENSE](LICENSE) para conocer sus términos.
