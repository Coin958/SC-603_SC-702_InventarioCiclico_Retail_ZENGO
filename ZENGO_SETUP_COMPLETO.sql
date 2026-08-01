-- ═══════════════════════════════════════════════════════════════════════════════
-- ZENGO v1.7 — Script de instalación COMPLETO y consolidado
-- Sistema de Inventario Cíclico · Office Depot Costa Rica
-- Arquitectura para 100+ usuarios concurrentes · Sync Realtime < 2 segundos
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- Este archivo reemplaza la ejecución manual, en orden, de:
--   1. DB.SQL                 (esquema base: 8 tablas + triggers + RLS + Realtime)
--   2. RANKING_SQL.sql        (tabla estadisticas_auxiliares)
--   3. USUARIOS_NUEVOS.sql    (usuarios de prueba adicionales)
--   4. FIX_CONCURRENCIA_SQL.sql (version + trigger + índice único anti-doble-asignación)
--   5. FIX_RENDIMIENTO_SQL.sql  (índice GIN para búsqueda de ubicaciones por UPC)
--
-- Los 5 quedan integrados en su lugar natural (ej. la columna `version` vive en
-- el CREATE TABLE de `tareas`, no como un ALTER pegado al final) para que el
-- esquema se lea como una sola fuente de verdad coherente, no como "base + parches".
--
-- INSTRUCCIONES:
--   1. Ir a Supabase → SQL Editor → New query
--   2. Pegar TODO este script
--   3. Click "Run" (Ctrl+Enter)
--   4. El mensaje final debe decir: ZENGO v1.7 Setup Completo ✓
--
-- ⚠️  IMPORTANTE — QUÉ ES DESTRUCTIVO Y QUÉ NO:
--   El PASO 1 hace DROP TABLE ... CASCADE de las 8 tablas base (roles, usuarios,
--   productos, tareas, conteos_realizados, hallazgos, ubicaciones_historico,
--   auditoria). Si este script se re-ejecuta más adelante sobre una base con
--   datos reales, ESOS DATOS SE PIERDEN — es un "reset total", no una migración.
--
--   `estadisticas_auxiliares` (el ranking) está DELIBERADAMENTE fuera de ese
--   DROP — usa CREATE TABLE IF NOT EXISTS, así que sobrevive a un re-run. Es
--   la misma regla que ya existe en el código (dexie-db.js / AdminController):
--   el ranking es historial permanente, nunca se borra, ni con "Cerrar Ciclo
--   Diario" ni con un reinstall del esquema.
--
--   TODO lo demás en este script (índices, triggers, políticas RLS) ahora usa
--   IF NOT EXISTS / DROP ... IF EXISTS antes de crear, así que si en el futuro
--   alguien re-ejecuta SOLO una sección de este archivo (sin el DROP TABLE del
--   PASO 1), no truena por "ya existe" — antes esto solo era así en las
--   secciones que venían de RANKING_SQL.sql y los FIX_*.sql; ahora aplica a
--   todo el script.
--
-- DECISIONES DE ARQUITECTURA (heredadas de DB.SQL):
--   · Escrituras aditivas: cada conteo = 1 INSERT en conteos_realizados
--     → 100 auxiliares pueden escanear en paralelo SIN colisiones
--   · tareas.productos (JSONB) = snapshot de la asignación, con los conteos
--     embebidos por producto (así es como el frontend real lo usa hoy)
--   · Trigger auto-actualiza tareas.productos_contados tras cada conteo
--   · Realtime habilitado en tablas calientes para sync < 2s
--   · IDs UUID en tablas de captura: el cliente genera crypto.randomUUID()
--     antes de guardar en Dexie y en Supabase → sin colisión entre dispositivos
--   · NUEVO: tareas.version (concurrencia optimista) — dos escrituras a la
--     misma tarea ya no se pisan en silencio; la segunda falla de forma
--     detectable para que el cliente avise en vez de perder datos.
--   · NUEVO: índice único parcial — un auxiliar no puede tener dos tareas
--     "activas" (no terminales) al mismo tiempo, garantizado por Postgres,
--     no solo por una validación en JavaScript que podía estar desactualizada.
-- ═══════════════════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────────────────
-- EXTENSIÓN UUID (gen_random_uuid() no la requiere en Supabase, se incluye
-- solo por compatibilidad si en el futuro se prefiere uuid_generate_v4())
-- ───────────────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ───────────────────────────────────────────────────────────────────────────────
-- PASO 1: LIMPIAR (orden por dependencias) — ⚠️ DESTRUCTIVO, ver aviso arriba.
-- NO incluye estadisticas_auxiliares a propósito (ranking permanente).
-- ───────────────────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS auditoria             CASCADE;
DROP TABLE IF EXISTS conteos_realizados    CASCADE;
DROP TABLE IF EXISTS hallazgos             CASCADE;
DROP TABLE IF EXISTS ubicaciones_historico CASCADE;
DROP TABLE IF EXISTS tareas                CASCADE;
DROP TABLE IF EXISTS productos             CASCADE;
DROP TABLE IF EXISTS usuarios              CASCADE;
DROP TABLE IF EXISTS roles                 CASCADE;

-- Por si existían nombres viejos (versión en inglés / diseño BD.sql descartado)
DROP TABLE IF EXISTS audit_log  CASCADE;
DROP TABLE IF EXISTS profiles   CASCADE;
DROP TABLE IF EXISTS sync_queue CASCADE;


-- ───────────────────────────────────────────────────────────────────────────────
-- PASO 2: ROLES
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE roles (
    id             INTEGER      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre         VARCHAR(20)  NOT NULL UNIQUE,
    descripcion    VARCHAR(200),
    color          VARCHAR(7)   NOT NULL DEFAULT '#000000',
    activo         BOOLEAN      NOT NULL DEFAULT true,
    fecha_creacion TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

INSERT INTO roles (nombre, descripcion, color) VALUES
    ('ADMIN',    'Administrador del sistema — acceso total',         '#C8102E'),
    ('JEFE',     'Jefe de bodega — gestión de tareas y reportes',    '#7C3AED'),
    ('AUXILIAR', 'Auxiliar de inventario — captura en piso',         '#2563EB');


-- ───────────────────────────────────────────────────────────────────────────────
-- PASO 3: USUARIOS
-- id INTEGER simple — autenticación por email+password en tabla propia,
-- sin dependencia de Supabase Auth (ver nota de seguridad al final del archivo).
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE usuarios (
    id                 INTEGER      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email              VARCHAR(255) NOT NULL UNIQUE,
    password           VARCHAR(100) NOT NULL DEFAULT '123',
    nombre             VARCHAR(100) NOT NULL,
    apellido           VARCHAR(100)           DEFAULT '',
    role_id            INTEGER      NOT NULL REFERENCES roles(id) DEFAULT 3,
    activo             BOOLEAN      NOT NULL DEFAULT true,
    ultimo_acceso      TIMESTAMPTZ,
    fecha_creacion     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    fecha_modificacion TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Usuarios semilla base (contraseña: 123)
INSERT INTO usuarios (email, password, nombre, apellido, role_id) VALUES
    ('admin@zengo.com', '123', 'Administrador', 'Sistema',  1),
    ('jefe@zengo.com',  '123', 'Danny',         'Grijalba', 2),
    ('aux@zengo.com',   '123', 'María',         'López',    3);


-- ───────────────────────────────────────────────────────────────────────────────
-- PASO 3B: USUARIOS DE PRUEBA ADICIONALES (opcional — de USUARIOS_NUEVOS.sql)
-- Va aquí y no al final porque depende de que `usuarios` ya exista con los
-- 3 registros semilla de arriba (desactiva aux@zengo.com como parte del cambio).
-- Usa ON CONFLICT, así que es seguro volver a correr esta sección sola.
-- ───────────────────────────────────────────────────────────────────────────────
UPDATE usuarios SET activo = false
WHERE email IN ('aux@zengo.com');
-- Nota: admin@zengo.com y jefe@zengo.com se mantienen activos como respaldo.

INSERT INTO usuarios (email, password, nombre, apellido, role_id, activo)
VALUES
    -- ADMIN
    ('admin1@zengo.com',    '123', 'Admin',     'Uno',    1, true),

    -- JEFES
    ('jefe1@zengo.com',     '123', 'Jefe',      'Uno',    2, true),
    ('jefe2@zengo.com',     '123', 'Jefe',      'Dos',    2, true),
    ('jefe3@zengo.com',     '123', 'Jefe',      'Tres',   2, true),

    -- AUXILIARES
    ('auxiliar1@zengo.com', '123', 'Auxiliar',  'Uno',    3, true),
    ('auxiliar2@zengo.com', '123', 'Auxiliar',  'Dos',    3, true),
    ('auxiliar3@zengo.com', '123', 'Auxiliar',  'Tres',   3, true),
    ('auxiliar4@zengo.com', '123', 'Auxiliar',  'Cuatro', 3, true),
    ('auxiliar5@zengo.com', '123', 'Auxiliar',  'Cinco',  3, true)

ON CONFLICT (email) DO UPDATE SET
    activo = true,
    password = EXCLUDED.password;


-- ───────────────────────────────────────────────────────────────────────────────
-- PASO 4: PRODUCTOS
-- Se reemplaza completamente en cada importación de NetSuite (InventoryModel.js
-- deduplica por UPC antes de guardar — ver fix de esta sesión).
-- categoria = primera palabra de descripcion (detectada en el frontend).
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE productos (
    id                  INTEGER       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    upc                 VARCHAR(50)   NOT NULL UNIQUE,
    sku                 VARCHAR(50),
    descripcion         VARCHAR(500)  NOT NULL,
    categoria           VARCHAR(100),
    existencia          INTEGER       NOT NULL DEFAULT 0,
    precio              NUMERIC(18,2) NOT NULL DEFAULT 0,
    valor               NUMERIC(18,2),
    estatus             VARCHAR(30)   NOT NULL DEFAULT 'ACTIVO',
    tipo                VARCHAR(50)   NOT NULL DEFAULT 'RESURTIBLE',
    activo              BOOLEAN       NOT NULL DEFAULT true,
    fecha_actualizacion TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);


-- ───────────────────────────────────────────────────────────────────────────────
-- PASO 5: TAREAS
--
-- id VARCHAR: clave legible ej. 'tarea_1769900000000' (Date.now() del Jefe).
-- productos (JSONB): snapshot de la asignación con los conteos embebidos por
--   producto — estructura real usada por AuxiliarView/JefeView hoy:
--   [{ upc, sku, descripcion, existencia, precio, conteos:[{cantidad,
--      ubicacion, timestamp}], total, diferencia, es_hallazgo, hallazgo_estado,
--      modificaciones:[] }]
-- productos_contados: si se usa el flujo aditivo por conteos_realizados, lo
--   actualiza el trigger del PASO 11; el flujo real hoy lo actualiza el propio
--   frontend al mutar `productos` (ver nota en PASO 11).
--
-- version (NUEVO — antes FIX_CONCURRENCIA_SQL.sql): concurrencia optimista.
--   El trigger del PASO 11 la incrementa en cada UPDATE; el cliente manda
--   `.eq('version', miVersion)` en su próxima escritura — si alguien más ya
--   escribió primero, la actualización afecta 0 filas en vez de sobrescribir.
--
-- Flujo de estado real (confirmado en el código, no el original de DB.SQL):
--   pendiente → en_progreso → finalizado_auxiliar → aprobado_jefe
--   con bucle de corrección: aprobado_jefe → devuelto_admin → devuelto_jefe
--   → en_progreso → ... → aprobado_jefe de nuevo
--   y estado terminal alterno: cancelado (anular por mal conteo)
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE tareas (
    id                  VARCHAR(100)  PRIMARY KEY,
    categoria           VARCHAR(100),
    descripcion         VARCHAR(200),
    auxiliar_id         INTEGER       REFERENCES usuarios(id),
    auxiliar_nombre     VARCHAR(150),
    estado              VARCHAR(50)   NOT NULL DEFAULT 'pendiente',
    productos           JSONB         NOT NULL DEFAULT '[]'::JSONB,
    productos_total     INTEGER       NOT NULL DEFAULT 0,
    productos_contados  INTEGER       NOT NULL DEFAULT 0,
    version             INTEGER       NOT NULL DEFAULT 1,
    fecha_asignacion    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    fecha_inicio        TIMESTAMPTZ,
    fecha_finalizacion  TIMESTAMPTZ,
    fecha_aprobacion    TIMESTAMPTZ,
    fecha_rechazo       TIMESTAMPTZ,
    cronometro_inicio   TIMESTAMPTZ,
    aprobado_por        VARCHAR(150),
    rechazado_por       VARCHAR(150),
    motivo_rechazo      VARCHAR(500),
    motivo_jefe         VARCHAR(500),
    devuelto_por_jefe   VARCHAR(150),
    fecha_devuelto_jefe TIMESTAMPTZ
);


-- ───────────────────────────────────────────────────────────────────────────────
-- PASO 6: CONTEOS REALIZADOS
--
-- Arquitectura aditiva pensada para 100 auxiliares en paralelo sin conflicto.
-- Nota honesta: el flujo real de conteo hoy vive embebido en tareas.productos
-- (PASO 5), no aquí — esta tabla existe para el camino alterno de
-- CycleController.js (movido a _legacy/ por no usarse). Se conserva en el
-- esquema por si se retoma ese diseño más adelante; no rompe nada dejarla.
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE conteos_realizados (
    id              UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
    tarea_id        VARCHAR(100)  REFERENCES tareas(id),
    upc             VARCHAR(50)   NOT NULL,
    cantidad        INTEGER       NOT NULL DEFAULT 0,
    ubicacion       VARCHAR(100),
    auxiliar_id     INTEGER       REFERENCES usuarios(id),
    auxiliar_nombre VARCHAR(150),
    dispositivo     VARCHAR(200),
    timestamp       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);


-- ───────────────────────────────────────────────────────────────────────────────
-- PASO 7: HALLAZGOS
--
-- Nota honesta: igual que conteos_realizados, el flujo real de hallazgos vive
-- embebido en tareas.productos (es_hallazgo=true) — ver PASO 5. Esta tabla se
-- conserva por compatibilidad con el diseño original, sin uso activo hoy.
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE hallazgos (
    id               UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
    tarea_id         VARCHAR(100)  REFERENCES tareas(id),
    upc              VARCHAR(50),
    descripcion      VARCHAR(500),
    cantidad         INTEGER       NOT NULL DEFAULT 0,
    ubicacion        VARCHAR(100),
    auxiliar_id      INTEGER       REFERENCES usuarios(id),
    auxiliar_nombre  VARCHAR(150),
    estado           VARCHAR(50)   NOT NULL DEFAULT 'pendiente',
    aprobado_por     VARCHAR(150),
    fecha_aprobacion TIMESTAMPTZ,
    rechazado_por    VARCHAR(150),
    fecha_rechazo    TIMESTAMPTZ,
    motivo_rechazo   VARCHAR(500),
    timestamp        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);


-- ───────────────────────────────────────────────────────────────────────────────
-- PASO 8: UBICACIONES HISTÓRICAS
--
-- Una fila por UPC (UNIQUE). Se usa UPSERT (ON CONFLICT DO UPDATE) desde
-- LocationModel.upsertUbicacion() / guardarUbicacionesTarea().
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE ubicaciones_historico (
    id              UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
    upc             VARCHAR(50)   NOT NULL UNIQUE,
    ubicacion       VARCHAR(100),
    tarea_id        VARCHAR(100),
    auxiliar_id     INTEGER       REFERENCES usuarios(id),
    auxiliar_nombre VARCHAR(150),
    timestamp       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);


-- ───────────────────────────────────────────────────────────────────────────────
-- PASO 9: AUDITORÍA
--
-- mensaje: texto en lenguaje natural generado por LogController.js.
--   "María López reportó hallazgo: MOUSE LOGITECH · 3 uds · Ubic: 3003"
-- datos_anteriores / datos_nuevos: JSON para drill-down técnico.
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE auditoria (
    id               UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
    tabla            VARCHAR(50)   NOT NULL,
    accion           VARCHAR(50)   NOT NULL,
    registro_id      VARCHAR(100),
    usuario_id       INTEGER       REFERENCES usuarios(id),
    usuario_nombre   VARCHAR(200),
    mensaje          TEXT,
    datos_anteriores JSONB,
    datos_nuevos     JSONB,
    ip_address       VARCHAR(50),
    user_agent       TEXT,
    timestamp        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);


-- ───────────────────────────────────────────────────────────────────────────────
-- PASO 9B: RANKING PERMANENTE (antes RANKING_SQL.sql)
-- ⚠️ Esta tabla NUNCA se borra — acumula historial de precisión por auxiliar.
-- Deliberadamente fuera del DROP del PASO 1 (ver aviso al inicio del archivo).
-- score_ranking = (promedio_pa + promedio_pn) / 2, calculado en JefeView.js
-- vía PrecisionCalculator.calcularScore() (fix de unificación de esta sesión).
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS estadisticas_auxiliares (
    auxiliar_id          INTEGER       PRIMARY KEY REFERENCES usuarios(id),
    auxiliar_nombre      VARCHAR(200)  NOT NULL,
    total_ciclicos       INTEGER       NOT NULL DEFAULT 0,
    suma_pa              NUMERIC(12,4) NOT NULL DEFAULT 0,  -- suma acum. precisión absoluta
    suma_pn              NUMERIC(12,4) NOT NULL DEFAULT 0,  -- suma acum. precisión neta
    promedio_pa          NUMERIC(6,2)  NOT NULL DEFAULT 0,  -- promedio precisión absoluta %
    promedio_pn          NUMERIC(6,2)  NOT NULL DEFAULT 0,  -- promedio precisión neta %
    score_ranking        NUMERIC(6,2)  NOT NULL DEFAULT 0,  -- (promedio_pa + promedio_pn) / 2
    ultima_actualizacion TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ranking_score ON estadisticas_auxiliares(score_ranking DESC);

ALTER TABLE estadisticas_auxiliares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ranking_leer"   ON estadisticas_auxiliares;
DROP POLICY IF EXISTS "ranking_crear"  ON estadisticas_auxiliares;
DROP POLICY IF EXISTS "ranking_editar" ON estadisticas_auxiliares;

CREATE POLICY "ranking_leer"   ON estadisticas_auxiliares FOR SELECT USING (true);
CREATE POLICY "ranking_crear"  ON estadisticas_auxiliares FOR INSERT WITH CHECK (true);
CREATE POLICY "ranking_editar" ON estadisticas_auxiliares FOR UPDATE USING (true);

GRANT SELECT, INSERT, UPDATE ON estadisticas_auxiliares TO anon, authenticated;


-- ───────────────────────────────────────────────────────────────────────────────
-- PASO 10: ÍNDICES (todos con IF NOT EXISTS — re-ejecutable sin error)
-- ───────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_usuarios_email      ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_role       ON usuarios(role_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_activo     ON usuarios(activo);

CREATE INDEX IF NOT EXISTS idx_productos_upc       ON productos(upc);
CREATE INDEX IF NOT EXISTS idx_productos_sku       ON productos(sku);
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria);

CREATE INDEX IF NOT EXISTS idx_tareas_auxiliar     ON tareas(auxiliar_id);
CREATE INDEX IF NOT EXISTS idx_tareas_estado       ON tareas(estado);
CREATE INDEX IF NOT EXISTS idx_tareas_categoria    ON tareas(categoria);

-- NUEVO (antes FIX_CONCURRENCIA_SQL.sql): un auxiliar no puede tener dos
-- tareas "activas" (no terminales) al mismo tiempo. Índice ÚNICO PARCIAL —
-- solo aplica a filas cuyo estado no sea uno de los terminales, así que un
-- auxiliar sí puede tener muchas tareas históricas ya aprobadas/completadas/
-- canceladas sin que esto las bloquee.
CREATE UNIQUE INDEX IF NOT EXISTS idx_tareas_auxiliar_activa
    ON tareas(auxiliar_id)
    WHERE estado NOT IN ('aprobado_jefe', 'completado', 'cancelado');

-- NUEVO (antes FIX_RENDIMIENTO_SQL.sql): índice GIN sobre el JSONB de
-- productos, para que ScannerController.consultarProducto() pueda filtrar
-- por UPC en el servidor (.contains()) en vez de traer toda la tabla tareas
-- y filtrar en el navegador en cada escaneo.
CREATE INDEX IF NOT EXISTS idx_tareas_productos_gin
    ON tareas USING GIN (productos jsonb_path_ops);

CREATE INDEX IF NOT EXISTS idx_conteos_tarea       ON conteos_realizados(tarea_id);
CREATE INDEX IF NOT EXISTS idx_conteos_upc         ON conteos_realizados(upc);
CREATE INDEX IF NOT EXISTS idx_conteos_auxiliar    ON conteos_realizados(auxiliar_id);
CREATE INDEX IF NOT EXISTS idx_conteos_timestamp   ON conteos_realizados(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_hallazgos_tarea     ON hallazgos(tarea_id);
CREATE INDEX IF NOT EXISTS idx_hallazgos_estado    ON hallazgos(estado);
CREATE INDEX IF NOT EXISTS idx_hallazgos_auxiliar  ON hallazgos(auxiliar_id);

CREATE INDEX IF NOT EXISTS idx_ubicaciones_upc     ON ubicaciones_historico(upc);

CREATE INDEX IF NOT EXISTS idx_auditoria_tabla     ON auditoria(tabla);
CREATE INDEX IF NOT EXISTS idx_auditoria_accion    ON auditoria(accion);
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario   ON auditoria(usuario_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_timestamp ON auditoria(timestamp DESC);


-- ───────────────────────────────────────────────────────────────────────────────
-- PASO 11: TRIGGERS (todos con DROP TRIGGER IF EXISTS — re-ejecutable sin error)
-- ───────────────────────────────────────────────────────────────────────────────

-- Trigger A: auto-actualiza tareas.productos_contados tras cada INSERT en
-- conteos_realizados. COUNT(DISTINCT upc) = productos distintos escaneados.
-- Nota honesta: como conteos_realizados no recibe INSERTs en el flujo real
-- de hoy (PASO 6), este trigger queda listo pero normalmente no se dispara;
-- productos_contados se actualiza desde el frontend al mutar tareas.productos.
CREATE OR REPLACE FUNCTION fn_actualizar_productos_contados()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE tareas
       SET productos_contados = (
               SELECT COUNT(DISTINCT upc)
               FROM   conteos_realizados
               WHERE  tarea_id = NEW.tarea_id
           )
     WHERE id = NEW.tarea_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_productos_contados ON conteos_realizados;
CREATE TRIGGER trg_productos_contados
    AFTER INSERT ON conteos_realizados
    FOR EACH ROW
    EXECUTE FUNCTION fn_actualizar_productos_contados();


-- Trigger B: auto-actualiza fecha_modificacion en usuarios.
CREATE OR REPLACE FUNCTION fn_set_fecha_modificacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_modificacion = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_usuarios_modificacion ON usuarios;
CREATE TRIGGER trg_usuarios_modificacion
    BEFORE UPDATE ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION fn_set_fecha_modificacion();


-- Trigger C (NUEVO — antes FIX_CONCURRENCIA_SQL.sql): incrementa
-- tareas.version en cada UPDATE. El cliente nunca calcula el próximo
-- número — solo lee el que tiene y lo manda en el WHERE de su próxima
-- escritura (`.eq('version', miVersion)`). Si otra escritura ya pasó por
-- aquí primero, el WHERE no matchea ninguna fila y el cliente recibe 0
-- filas afectadas en vez de pisar el cambio ajeno sin darse cuenta.
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


-- ───────────────────────────────────────────────────────────────────────────────
-- PASO 12: ROW LEVEL SECURITY
-- Permisivo para desarrollo — todas las políticas son USING (true). En
-- producción real: restringir por role_id vía auth.uid() y Supabase Auth
-- (hoy el login es una tabla propia sin Supabase Auth — ver seguridad abajo).
-- Cada política lleva DROP POLICY IF EXISTS antes, para que esta sección se
-- pueda re-ejecutar sola sin el DROP TABLE del PASO 1.
-- ───────────────────────────────────────────────────────────────────────────────
ALTER TABLE roles                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios              ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos             ENABLE ROW LEVEL SECURITY;
ALTER TABLE tareas                ENABLE ROW LEVEL SECURITY;
ALTER TABLE conteos_realizados    ENABLE ROW LEVEL SECURITY;
ALTER TABLE hallazgos             ENABLE ROW LEVEL SECURITY;
ALTER TABLE ubicaciones_historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditoria             ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "roles_leer"         ON roles;
CREATE POLICY "roles_leer"         ON roles                 FOR SELECT USING (true);

DROP POLICY IF EXISTS "usuarios_leer"      ON usuarios;
DROP POLICY IF EXISTS "usuarios_crear"     ON usuarios;
DROP POLICY IF EXISTS "usuarios_editar"    ON usuarios;
DROP POLICY IF EXISTS "usuarios_borrar"    ON usuarios;
CREATE POLICY "usuarios_leer"      ON usuarios              FOR SELECT USING (true);
CREATE POLICY "usuarios_crear"     ON usuarios              FOR INSERT WITH CHECK (true);
CREATE POLICY "usuarios_editar"    ON usuarios              FOR UPDATE USING (true);
CREATE POLICY "usuarios_borrar"    ON usuarios              FOR DELETE USING (true);

DROP POLICY IF EXISTS "productos_leer"     ON productos;
DROP POLICY IF EXISTS "productos_crear"    ON productos;
DROP POLICY IF EXISTS "productos_editar"   ON productos;
DROP POLICY IF EXISTS "productos_borrar"   ON productos;
CREATE POLICY "productos_leer"     ON productos             FOR SELECT USING (true);
CREATE POLICY "productos_crear"    ON productos             FOR INSERT WITH CHECK (true);
CREATE POLICY "productos_editar"   ON productos             FOR UPDATE USING (true);
CREATE POLICY "productos_borrar"   ON productos             FOR DELETE USING (true);

DROP POLICY IF EXISTS "tareas_leer"        ON tareas;
DROP POLICY IF EXISTS "tareas_crear"       ON tareas;
DROP POLICY IF EXISTS "tareas_editar"      ON tareas;
DROP POLICY IF EXISTS "tareas_borrar"      ON tareas;
CREATE POLICY "tareas_leer"        ON tareas                FOR SELECT USING (true);
CREATE POLICY "tareas_crear"       ON tareas                FOR INSERT WITH CHECK (true);
CREATE POLICY "tareas_editar"      ON tareas                FOR UPDATE USING (true);
CREATE POLICY "tareas_borrar"      ON tareas                FOR DELETE USING (true);

DROP POLICY IF EXISTS "conteos_leer"       ON conteos_realizados;
DROP POLICY IF EXISTS "conteos_crear"      ON conteos_realizados;
DROP POLICY IF EXISTS "conteos_editar"     ON conteos_realizados;
DROP POLICY IF EXISTS "conteos_borrar"     ON conteos_realizados;
CREATE POLICY "conteos_leer"       ON conteos_realizados    FOR SELECT USING (true);
CREATE POLICY "conteos_crear"      ON conteos_realizados    FOR INSERT WITH CHECK (true);
CREATE POLICY "conteos_editar"     ON conteos_realizados    FOR UPDATE USING (true);
CREATE POLICY "conteos_borrar"     ON conteos_realizados    FOR DELETE USING (true);

DROP POLICY IF EXISTS "hallazgos_leer"     ON hallazgos;
DROP POLICY IF EXISTS "hallazgos_crear"    ON hallazgos;
DROP POLICY IF EXISTS "hallazgos_editar"   ON hallazgos;
DROP POLICY IF EXISTS "hallazgos_borrar"   ON hallazgos;
CREATE POLICY "hallazgos_leer"     ON hallazgos             FOR SELECT USING (true);
CREATE POLICY "hallazgos_crear"    ON hallazgos             FOR INSERT WITH CHECK (true);
CREATE POLICY "hallazgos_editar"   ON hallazgos             FOR UPDATE USING (true);
CREATE POLICY "hallazgos_borrar"   ON hallazgos             FOR DELETE USING (true);

DROP POLICY IF EXISTS "ubicaciones_leer"   ON ubicaciones_historico;
DROP POLICY IF EXISTS "ubicaciones_crear"  ON ubicaciones_historico;
DROP POLICY IF EXISTS "ubicaciones_editar" ON ubicaciones_historico;
CREATE POLICY "ubicaciones_leer"   ON ubicaciones_historico FOR SELECT USING (true);
CREATE POLICY "ubicaciones_crear"  ON ubicaciones_historico FOR INSERT WITH CHECK (true);
CREATE POLICY "ubicaciones_editar" ON ubicaciones_historico FOR UPDATE USING (true);

DROP POLICY IF EXISTS "auditoria_leer"     ON auditoria;
DROP POLICY IF EXISTS "auditoria_crear"    ON auditoria;
CREATE POLICY "auditoria_leer"     ON auditoria             FOR SELECT USING (true);
CREATE POLICY "auditoria_crear"    ON auditoria             FOR INSERT WITH CHECK (true);


-- ───────────────────────────────────────────────────────────────────────────────
-- PASO 13: GRANTS PARA ANON KEY
-- ───────────────────────────────────────────────────────────────────────────────
GRANT SELECT                         ON roles                 TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON usuarios              TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE usuarios_id_seq                TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON productos             TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE productos_id_seq               TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON tareas                TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON conteos_realizados    TO anon, authenticated;
-- UUID: no requiere SEQUENCE grant

GRANT SELECT, INSERT, UPDATE, DELETE ON hallazgos             TO anon, authenticated;
-- UUID: no requiere SEQUENCE grant

GRANT SELECT, INSERT, UPDATE         ON ubicaciones_historico TO anon, authenticated;
-- UUID: no requiere SEQUENCE grant

GRANT SELECT, INSERT                 ON auditoria             TO anon, authenticated;
-- UUID: no requiere SEQUENCE grant


-- ───────────────────────────────────────────────────────────────────────────────
-- PASO 14: REALTIME — SYNC < 2 SEGUNDOS
--
-- REPLICA IDENTITY FULL: eventos UPDATE incluyen valores anteriores Y nuevos
-- (necesario para que RealtimeManager.js compare payload.old vs payload.new).
-- El bloque DO $$ ... IF NOT EXISTS hace este paso idempotente.
-- ───────────────────────────────────────────────────────────────────────────────
ALTER TABLE tareas              REPLICA IDENTITY FULL;
ALTER TABLE conteos_realizados  REPLICA IDENTITY FULL;
ALTER TABLE hallazgos           REPLICA IDENTITY FULL;
ALTER TABLE auditoria           REPLICA IDENTITY FULL;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'tareas') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE tareas;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'conteos_realizados') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE conteos_realizados;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'hallazgos') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE hallazgos;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'auditoria') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE auditoria;
    END IF;
END $$;


-- ───────────────────────────────────────────────────────────────────────────────
-- PASO 15: RECARGAR SCHEMA CACHE DE POSTGREST
-- Sin esto, la API REST puede seguir devolviendo "tabla no encontrada" un
-- rato después de crear las tablas (el error que nos trajo hasta aquí hoy).
-- ───────────────────────────────────────────────────────────────────────────────
NOTIFY pgrst, 'reload schema';


-- ═══════════════════════════════════════════════════════════════════════════════
-- VERIFICACIÓN FINAL — confirma que TODO quedó en su lugar
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1) Las 9 tablas deben existir
SELECT 'Tablas en public (esperado: 9)' AS check, COUNT(*) AS cantidad
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('roles','usuarios','productos','tareas','conteos_realizados',
                      'hallazgos','ubicaciones_historico','auditoria','estadisticas_auxiliares');

-- 2) La columna version debe existir en tareas
SELECT 'tareas.version existe' AS check, column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'tareas' AND column_name = 'version';

-- 3) Los 2 índices nuevos deben existir
SELECT 'Índices nuevos (esperado: 2)' AS check, indexname
FROM pg_indexes
WHERE tablename = 'tareas'
  AND indexname IN ('idx_tareas_auxiliar_activa', 'idx_tareas_productos_gin');

-- 4) Los 3 triggers deben existir
SELECT 'Triggers (esperado: 3)' AS check, tgname, tgrelid::regclass AS tabla
FROM pg_trigger
WHERE tgname IN ('trg_productos_contados', 'trg_usuarios_modificacion', 'trg_incrementar_version_tarea');

-- 5) Conteo de filas por tabla base
SELECT 'roles' AS tabla, COUNT(*) AS filas FROM roles
UNION ALL SELECT 'usuarios',               COUNT(*) FROM usuarios
UNION ALL SELECT 'productos',              COUNT(*) FROM productos
UNION ALL SELECT 'estadisticas_auxiliares', COUNT(*) FROM estadisticas_auxiliares;

-- 6) Listado de usuarios sembrados (para confirmar login de prueba)
SELECT id, email, nombre, apellido, role_id, activo
FROM usuarios
ORDER BY role_id, id;

SELECT '✅ ZENGO v1.7 Setup Completo (esquema + fixes de concurrencia y rendimiento)' AS status;


-- ═══════════════════════════════════════════════════════════════════════════════
-- NOTA DE SEGURIDAD (no es parte del setup — es un recordatorio, no lo ejecuta
-- nada de lo de arriba): el login de ZENGO compara password en texto plano
-- contra esta tabla `usuarios`, sin Supabase Auth ni hashing, y el RLS de
-- todo este script es permisivo (USING true) — cualquiera con la anon key
-- puede leer/escribir estas tablas directo, sin pasar por la app. Es una
-- decisión de alcance válida para una demo/proyecto académico, pero antes de
-- un uso con datos reales de empleados hace falta: Supabase Auth + hashing
-- (bcrypt/Argon2) + políticas RLS restringidas por role_id vía auth.uid().
-- ═══════════════════════════════════════════════════════════════════════════════
