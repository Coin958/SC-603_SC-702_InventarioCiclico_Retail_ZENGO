-- ═══════════════════════════════════════════════════════════════
-- ZENGO — Fix de rendimiento: búsqueda de ubicaciones por UPC
-- Ejecutar en el SQL Editor de Supabase. Es idempotente.
--
-- Antes, ScannerController.consultarProducto() (usado en cada
-- escaneo de código de barras y cada búsqueda de "Modo Consulta" —
-- el camino más usado del sistema, por los 3 roles) traía la
-- columna `productos` (JSONB) de TODAS las tareas del día sin
-- ningún filtro, y buscaba el UPC en el navegador. El costo crecía
-- con la cantidad de tareas creadas ese día, transfiriendo datos
-- de auxiliares y categorías completamente ajenos a la consulta.
--
-- El fix en JS (ScannerController.js) ahora usa `.contains('productos',
-- [{upc: ...}])`, que Postgres traduce al operador @> sobre JSONB —
-- filtra en el servidor en vez de en el navegador. Este índice es lo
-- que hace que ese filtro sea rápido (sin él, sigue siendo correcto,
-- pero hace table scan en el servidor en vez de en el cliente).
-- ═══════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_tareas_productos_gin
    ON tareas USING GIN (productos jsonb_path_ops);

-- ═══════════════════════════════════════════════════════════════
-- VERIFICACIÓN
-- ═══════════════════════════════════════════════════════════════
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'tareas' AND indexname = 'idx_tareas_productos_gin';

-- Prueba manual recomendada antes de confiar en esto en producción:
-- reemplaza 'UPC_DE_PRUEBA' por un UPC real que sepas que existe en
-- alguna tarea, y confirma que el resultado coincide con lo que
-- devolvía la búsqueda anterior (sin filtro) para ese mismo UPC.
--
-- SELECT id, categoria, auxiliar_nombre
-- FROM tareas
-- WHERE productos @> '[{"upc": "UPC_DE_PRUEBA"}]';
