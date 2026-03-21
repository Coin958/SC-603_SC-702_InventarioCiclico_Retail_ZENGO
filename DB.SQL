-- ═══════════════════════════════════════════════════════════════════════════════
-- ZENGO v1.7 — Script SQL para Supabase
-- Sistema de Inventario Cíclico · Office Depot
-- Arquitectura para 100+ usuarios concurrentes · Sync Realtime < 2 segundos
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- INSTRUCCIONES:
--   1. Ir a Supabase → SQL Editor → New query
--   2. Pegar TODO este script
--   3. Click "Run"  (Ctrl+Enter)
--   4. El mensaje final debe decir: ZENGO v1.7 Setup Completado ✓
--
-- DECISIONES DE ARQUITECTURA:
--   · Escrituras aditivas: cada conteo = 1 INSERT en conteos_realizados
--     → 100 auxiliares pueden escanear en paralelo SIN colisiones
--   · tareas.productos (JSONB) = snapshot inmutable de la asignación
--     → NUNCA se modifica durante el conteo; el progreso viene de conteos_realizados
--   · Trigger auto-actualiza tareas.productos_contados tras cada conteo
--   · Realtime habilitado en tablas calientes para sync < 2s
--   · Nombres de tablas en español alineados con Dexie (frontend)
--   · IDs UUID en tablas de captura: el cliente genera crypto.randomUUID() antes
--     de guardar en Dexie y en Supabase → 100 laptops offline sin colisión de IDs
-- ═══════════════════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────────────────
-- EXTENSIÓN UUID (disponible en PG13+; gen_random_uuid() no la requiere pero
-- se incluye para compatibilidad con uuid_generate_v4() si se prefiere)
-- ───────────────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ───────────────────────────────────────────────────────────────────────────────
-- PASO 1: LIMPIAR (orden por dependencias)
-- ───────────────────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS auditoria             CASCADE;
DROP TABLE IF EXISTS conteos_realizados    CASCADE;
DROP TABLE IF EXISTS hallazgos             CASCADE;
DROP TABLE IF EXISTS ubicaciones_historico CASCADE;
DROP TABLE IF EXISTS tareas                CASCADE;
DROP TABLE IF EXISTS productos             CASCADE;
DROP TABLE IF EXISTS usuarios              CASCADE;
DROP TABLE IF EXISTS roles                 CASCADE;

-- Por si existían nombres viejos (inglés)
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
-- PASO 3: USUARIOS  (antes: profiles)
-- id INTEGER simple — autenticación por email+password en tabla,
-- sin dependencia de Supabase Auth
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

-- Usuarios semilla (contraseña: 123)
INSERT INTO usuarios (email, password, nombre, apellido, role_id) VALUES
    ('admin@zengo.com', '123', 'Administrador', 'Sistema',  1),
    ('jefe@zengo.com',  '123', 'Danny',         'Grijalba', 2),
    ('aux@zengo.com',   '123', 'María',         'López',    3);


-- ───────────────────────────────────────────────────────────────────────────────
-- PASO 4: PRODUCTOS
-- Se reemplaza completamente en cada importación de NetSuite.
-- categoria = primera palabra de descripcion (detectada en InventoryModel.js).
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
-- id VARCHAR: clave legible ej. 'TELEVISOR_2026-03-21_001'
-- productos (JSONB): snapshot inmutable de la asignación.
--   Estructura: [{ upc, sku, descripcion, categoria, existencia, precio, conteos:[] }]
--   NUNCA SE MODIFICA durante el conteo — el progreso viene de conteos_realizados.
-- productos_contados: actualizado por trigger (PASO 11).
--
-- Flujo de estado:
--   pendiente → en_progreso → completada → revision → aprobada
--                                                    → rechazada
--                           ← devuelta ←
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
-- Arquitectura aditiva: cada escaneo = 1 INSERT independiente.
-- 100 auxiliares haciendo INSERT simultáneo = CERO CONFLICTOS.
-- El progreso se calcula con COUNT(DISTINCT upc) WHERE tarea_id = ?
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
-- Flujo de aprobación:
--   pendiente → aprobado  (jefe)
--             → rechazado (jefe con motivo)
-- Concurrencia: UPDATE usa WHERE estado = 'pendiente' como lock optimista.
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
-- Una fila por UPC (UNIQUE). Se usa UPSERT (ON CONFLICT DO UPDATE).
-- Guarda la última ubicación física conocida del producto.
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
-- PASO 9: AUDITORÍA  (antes: audit_log)
--
-- mensaje: texto en lenguaje natural generado por LogController.js.
--   "María López reportó hallazgo: MOUSE LOGITECH · 3 uds · Ubic: 3003"
--   "Danny Grijalba aprobó el cíclico TELEVISOR de María López"
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
-- PASO 10: ÍNDICES
-- ───────────────────────────────────────────────────────────────────────────────
CREATE INDEX idx_usuarios_email      ON usuarios(email);
CREATE INDEX idx_usuarios_role       ON usuarios(role_id);
CREATE INDEX idx_usuarios_activo     ON usuarios(activo);

CREATE INDEX idx_productos_upc       ON productos(upc);
CREATE INDEX idx_productos_sku       ON productos(sku);
CREATE INDEX idx_productos_categoria ON productos(categoria);

CREATE INDEX idx_tareas_auxiliar     ON tareas(auxiliar_id);
CREATE INDEX idx_tareas_estado       ON tareas(estado);
CREATE INDEX idx_tareas_categoria    ON tareas(categoria);

CREATE INDEX idx_conteos_tarea       ON conteos_realizados(tarea_id);
CREATE INDEX idx_conteos_upc         ON conteos_realizados(upc);
CREATE INDEX idx_conteos_auxiliar    ON conteos_realizados(auxiliar_id);
CREATE INDEX idx_conteos_timestamp   ON conteos_realizados(timestamp DESC);

CREATE INDEX idx_hallazgos_tarea     ON hallazgos(tarea_id);
CREATE INDEX idx_hallazgos_estado    ON hallazgos(estado);
CREATE INDEX idx_hallazgos_auxiliar  ON hallazgos(auxiliar_id);

CREATE INDEX idx_ubicaciones_upc     ON ubicaciones_historico(upc);

CREATE INDEX idx_auditoria_tabla     ON auditoria(tabla);
CREATE INDEX idx_auditoria_accion    ON auditoria(accion);
CREATE INDEX idx_auditoria_usuario   ON auditoria(usuario_id);
CREATE INDEX idx_auditoria_timestamp ON auditoria(timestamp DESC);


-- ───────────────────────────────────────────────────────────────────────────────
-- PASO 11: TRIGGERS
-- ───────────────────────────────────────────────────────────────────────────────

-- Trigger A: auto-actualiza tareas.productos_contados tras cada INSERT en conteos.
-- COUNT(DISTINCT upc) = productos distintos escaneados en esa tarea.
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

CREATE TRIGGER trg_usuarios_modificacion
    BEFORE UPDATE ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION fn_set_fecha_modificacion();


-- ───────────────────────────────────────────────────────────────────────────────
-- PASO 12: ROW LEVEL SECURITY
-- Permisivo para desarrollo. En producción: restringir por role_id.
-- ───────────────────────────────────────────────────────────────────────────────
ALTER TABLE roles                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios              ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos             ENABLE ROW LEVEL SECURITY;
ALTER TABLE tareas                ENABLE ROW LEVEL SECURITY;
ALTER TABLE conteos_realizados    ENABLE ROW LEVEL SECURITY;
ALTER TABLE hallazgos             ENABLE ROW LEVEL SECURITY;
ALTER TABLE ubicaciones_historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditoria             ENABLE ROW LEVEL SECURITY;

CREATE POLICY "roles_leer"         ON roles                 FOR SELECT USING (true);

CREATE POLICY "usuarios_leer"      ON usuarios              FOR SELECT USING (true);
CREATE POLICY "usuarios_crear"     ON usuarios              FOR INSERT WITH CHECK (true);
CREATE POLICY "usuarios_editar"    ON usuarios              FOR UPDATE USING (true);
CREATE POLICY "usuarios_borrar"    ON usuarios              FOR DELETE USING (true);

CREATE POLICY "productos_leer"     ON productos             FOR SELECT USING (true);
CREATE POLICY "productos_crear"    ON productos             FOR INSERT WITH CHECK (true);
CREATE POLICY "productos_editar"   ON productos             FOR UPDATE USING (true);
CREATE POLICY "productos_borrar"   ON productos             FOR DELETE USING (true);

CREATE POLICY "tareas_leer"        ON tareas                FOR SELECT USING (true);
CREATE POLICY "tareas_crear"       ON tareas                FOR INSERT WITH CHECK (true);
CREATE POLICY "tareas_editar"      ON tareas                FOR UPDATE USING (true);
CREATE POLICY "tareas_borrar"      ON tareas                FOR DELETE USING (true);

CREATE POLICY "conteos_leer"       ON conteos_realizados    FOR SELECT USING (true);
CREATE POLICY "conteos_crear"      ON conteos_realizados    FOR INSERT WITH CHECK (true);
CREATE POLICY "conteos_editar"     ON conteos_realizados    FOR UPDATE USING (true);
CREATE POLICY "conteos_borrar"     ON conteos_realizados    FOR DELETE USING (true);

CREATE POLICY "hallazgos_leer"     ON hallazgos             FOR SELECT USING (true);
CREATE POLICY "hallazgos_crear"    ON hallazgos             FOR INSERT WITH CHECK (true);
CREATE POLICY "hallazgos_editar"   ON hallazgos             FOR UPDATE USING (true);
CREATE POLICY "hallazgos_borrar"   ON hallazgos             FOR DELETE USING (true);

CREATE POLICY "ubicaciones_leer"   ON ubicaciones_historico FOR SELECT USING (true);
CREATE POLICY "ubicaciones_crear"  ON ubicaciones_historico FOR INSERT WITH CHECK (true);
CREATE POLICY "ubicaciones_editar" ON ubicaciones_historico FOR UPDATE USING (true);

CREATE POLICY "auditoria_leer"     ON auditoria             FOR SELECT USING (true);
CREATE POLICY "auditoria_crear"    ON auditoria             FOR INSERT WITH CHECK (true);


-- ───────────────────────────────────────────────────────────────────────────────
-- PASO 13: GRANTS PARA ANON KEY
-- ───────────────────────────────────────────────────────────────────────────────
GRANT SELECT                         ON roles                 TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON usuarios              TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE usuarios_id_seq               TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON productos             TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE productos_id_seq              TO anon, authenticated;

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
-- (necesario para detectar cambios de estado en tareas y hallazgos).
--
-- supabase_realtime publication: Supabase empuja cambios a los clientes
-- suscritos en ~300ms (manejado por RealtimeManager.js en el frontend).
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
-- PASO 15: RECARGAR SCHEMA CACHE
-- ───────────────────────────────────────────────────────────────────────────────
NOTIFY pgrst, 'reload schema';


-- ───────────────────────────────────────────────────────────────────────────────
-- VERIFICACIÓN FINAL
-- ───────────────────────────────────────────────────────────────────────────────
SELECT 'Tablas en public' AS check, COUNT(*) AS cantidad
FROM information_schema.tables WHERE table_schema = 'public';

SELECT 'roles'    AS tabla, COUNT(*) AS filas FROM roles
UNION ALL SELECT 'usuarios',  COUNT(*) FROM usuarios
UNION ALL SELECT 'productos', COUNT(*) FROM productos;

SELECT '✅ ZENGO v1.7 Setup Completado' AS status;
