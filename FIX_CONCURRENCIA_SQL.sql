-- ═══════════════════════════════════════════════════════════════
-- ZENGO — Fix de concurrencia multi-dispositivo
-- Ejecutar en el SQL Editor de Supabase. Es idempotente: se puede
-- correr más de una vez sin error.
--
-- Corrige dos escenarios encontrados en la simulación de QA de
-- uso simultáneo multi-usuario:
--
--   #2  Dos Jefes en máquinas distintas podían asignar la misma
--       tarea (no-terminal) al mismo auxiliar casi al mismo tiempo,
--       porque la única validación era contra la copia local
--       (Dexie) de cada Jefe, sin ninguna garantía en la base de
--       datos. Esto agrega un índice único parcial que hace que
--       Postgres RECHACE la segunda inserción.
--
--   #3/#4  Dos escrituras simultáneas a la misma fila de `tareas`
--       (ej. Auxiliar contando offline + Jefe editando la revisión)
--       se resolvían "el último que escribe gana" en silencio, sin
--       ningún aviso. Esto agrega control de concurrencia optimista
--       (columna `version` + trigger) para que la segunda escritura
--       falle de forma detectable por el cliente, en vez de
--       sobrescribir el trabajo del otro usuario sin avisar.
-- ═══════════════════════════════════════════════════════════════

-- 1) Columna de versión para concurrencia optimista.
--    Arranca en 1 para las filas existentes y las nuevas.
ALTER TABLE tareas ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

-- 2) Trigger: cada UPDATE incrementa `version` automáticamente en
--    el servidor. El cliente nunca calcula el próximo número —
--    solo lee el que tiene y lo manda en el WHERE de su próxima
--    escritura (`.eq('version', miVersion)`). Si otra escritura ya
--    pasó por aquí primero, el WHERE no matchea ninguna fila y el
--    cliente recibe 0 filas afectadas, en vez de pisar el cambio
--    ajeno sin darse cuenta.
CREATE OR REPLACE FUNCTION fn_incrementar_version_tarea()
RETURNS TRIGGER AS $$
BEGIN
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_incrementar_version_tarea ON tareas;
CREATE TRIGGER trg_incrementar_version_tarea
    BEFORE UPDATE ON tareas
    FOR EACH ROW
    EXECUTE FUNCTION fn_incrementar_version_tarea();

-- 3) Constraint real (no solo en JavaScript): un auxiliar no puede
--    tener dos tareas "activas" (no terminales) al mismo tiempo.
--    Es un índice ÚNICO PARCIAL — solo aplica a filas cuyo estado
--    no sea uno de los terminales, así que un auxiliar sí puede
--    tener muchas tareas históricas ya aprobadas/completadas/
--    canceladas sin que esto las bloquee.
CREATE UNIQUE INDEX IF NOT EXISTS idx_tareas_auxiliar_activa
    ON tareas(auxiliar_id)
    WHERE estado NOT IN ('aprobado_jefe', 'completado', 'cancelado');

-- ═══════════════════════════════════════════════════════════════
-- VERIFICACIÓN
-- ═══════════════════════════════════════════════════════════════
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'tareas' AND column_name = 'version';

SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'tareas' AND indexname = 'idx_tareas_auxiliar_activa';

SELECT tgname, tgrelid::regclass AS tabla
FROM pg_trigger
WHERE tgname = 'trg_incrementar_version_tarea';
