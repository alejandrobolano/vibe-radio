# Flujo de desarrollo

Vibe Radio utiliza una estrategia sencilla basada en trunk-based development.

- `master` contiene siempre la versión estable y desplegable.
- Cada cambio se desarrolla en una rama corta `feature/<descripcion>`.
- Toda rama `feature/*` se integra mediante Pull Request hacia `master`.
- La Pull Request debe superar lint, tests y build antes de fusionarse.
- Las Pull Requests no borrador se despliegan automáticamente en desarrollo.
- Cada merge en `master` se despliega automáticamente en producción.
- No se realizan commits directos sobre `master` después del commit inicial.

Ejemplo:

```bash
git switch master
git pull --ff-only
git switch -c feature/mejorar-buscador
git push -u origin feature/mejorar-buscador
```
