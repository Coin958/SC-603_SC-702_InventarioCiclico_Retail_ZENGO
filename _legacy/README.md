# Código movido fuera del árbol activo

Estos archivos no se cargan desde `index.html` (ni desde `sw.js`) y ninguna
otra parte del código los referencia. Se movieron aquí en vez de borrarlos
porque el repositorio no tiene control de versiones (`git init` nunca se
corrió), así que un `rm` hubiera sido irreversible.

- **CycleController.js** — implementación de conteo sobre la tabla
  `conteos_realizados`, de una iteración de diseño anterior. El flujo real
  (AuxiliarView/JefeView) termina mutando `tareas.productos` (JSONB)
  directamente en su lugar.
- **LogModel.js** — versión temprana del sistema de auditoría, reemplazada
  por `LogController.js` (que sí se usa en toda la app).
- **Components.js** — biblioteca de componentes HTML (`modal()`, `button()`,
  `badge()`, etc.) pensada para reutilizarse entre vistas. Nunca se conectó:
  cada vista terminó armando sus propios modales/tarjetas inline. Su único
  uso interno (`onclick="Components.closeModal(...)"` dentro de su propio
  `modal()`) tampoco era alcanzable porque `modal()` nunca se invocaba.

Si en el futuro alguno vuelve a ser necesario, muévanlo de regreso a
`js/controllers/`, `js/models/` o `js/views/` y agréguenlo de nuevo en
`index.html` (y en `sw.js` si debe cachearse para offline).
