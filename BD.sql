-- ============================================================
-- SISTEMA DE GESTIÓN DE INVENTARIO - BMS LOGMART
-- Migración a PostgreSQL (basado en tu script SQL Server)
-- Versión: 1.0
-- Fecha: Enero 2026
-- ============================================================

-- ============================================================
-- 0) CREAR BASE DE DATOS (EJECUTA ESTO CONECTADO A "postgres")
-- ============================================================
-- CREATE DATABASE inventariobms;

-- Luego conéctate a la DB inventariobms y corre TODO lo de abajo.

-- ============================================================
-- 1) ESQUEMA (opcional pero recomendado)
-- ============================================================
CREATE SCHEMA IF NOT EXISTS bms;
SET search_path TO bms, public;

-- ============================================================
-- 2) TABLAS
-- ============================================================

-- TABLA: Rol
CREATE TABLE IF NOT EXISTS rol (
    id_rol            INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre            VARCHAR(50) NOT NULL UNIQUE,
    descripcion       VARCHAR(200),
    activo            BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: Usuario
CREATE TABLE IF NOT EXISTS usuario (
    id_usuario        INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre_completo   VARCHAR(150) NOT NULL,
    email             VARCHAR(100) NOT NULL UNIQUE,
    password_hash     VARCHAR(256) NOT NULL,
    id_rol            INT NOT NULL,
    foto_url          VARCHAR(500),
    activo            BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ultimo_acceso     TIMESTAMP,
    CONSTRAINT fk_usuario_rol FOREIGN KEY (id_rol) REFERENCES rol(id_rol)
);

CREATE INDEX IF NOT EXISTS ix_usuario_rol ON usuario(id_rol);

-- TABLA: Proveedor
CREATE TABLE IF NOT EXISTS proveedor (
    id_proveedor      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo            VARCHAR(20) NOT NULL UNIQUE,
    nombre            VARCHAR(200) NOT NULL,
    contacto          VARCHAR(150),
    telefono          VARCHAR(50),
    email             VARCHAR(100),
    activo            BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: Producto
CREATE TABLE IF NOT EXISTS producto (
    id_producto        INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sku                VARCHAR(20) NOT NULL UNIQUE,
    codigo_upc         VARCHAR(50),
    id_interno_netsuite INT,
    descripcion        VARCHAR(500) NOT NULL,
    numero_parte       VARCHAR(50),
    as400_code         VARCHAR(20),
    id_proveedor       INT,
    estatus            VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
    tipo               VARCHAR(50) NOT NULL DEFAULT '01 - RESURTIBLE',
    precio_final       NUMERIC(18,2) NOT NULL DEFAULT 0,
    costo_promedio     NUMERIC(18,2),
    existencia_sistema INT NOT NULL DEFAULT 0,
    ubicacion_teorica  VARCHAR(100),
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    activo             BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_producto_proveedor FOREIGN KEY (id_proveedor) REFERENCES proveedor(id_proveedor),
    CONSTRAINT ck_producto_estatus CHECK (estatus IN ('ACTIVO', 'DESCONTINUADO')),
    CONSTRAINT ck_producto_tipo CHECK (tipo IN ('01 - RESURTIBLE', '02 - NO RESURTIBLE', '03 - EXISTENCIA LIMITADA'))
);

CREATE INDEX IF NOT EXISTS ix_producto_sku ON producto(sku);
CREATE INDEX IF NOT EXISTS ix_producto_upc ON producto(codigo_upc);
CREATE INDEX IF NOT EXISTS ix_producto_descripcion ON producto(descripcion);
-- Índice parcial (equivalente a WHERE activo = 1 de SQL Server)
CREATE INDEX IF NOT EXISTS ix_producto_estatus_activo ON producto(estatus) WHERE activo = TRUE;

-- TABLA: CicloInventario
CREATE TABLE IF NOT EXISTS cicloinventario (
    id_ciclo           INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo             VARCHAR(20) NOT NULL UNIQUE,
    descripcion        VARCHAR(200),
    id_usuario_creador INT NOT NULL,
    fecha_inicio       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_cierre       TIMESTAMP,
    estado             VARCHAR(30) NOT NULL DEFAULT 'ABIERTO',
    id_ciclo_padre     INT,
    es_segregado       BOOLEAN NOT NULL DEFAULT FALSE,
    precision_general  NUMERIC(5,2),
    valor_merma_total  NUMERIC(18,2),
    fecha_creacion     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ciclo_usuario FOREIGN KEY (id_usuario_creador) REFERENCES usuario(id_usuario),
    CONSTRAINT fk_ciclo_padre FOREIGN KEY (id_ciclo_padre) REFERENCES cicloinventario(id_ciclo),
    CONSTRAINT ck_ciclo_estado CHECK (estado IN (
        'ABIERTO', 'EN_PROCESO', 'EN_VERIFICACION',
        'PENDIENTE_APROBACION', 'APROBADO_JEFATURA',
        'APROBADO', 'CERRADO', 'RECHAZADO'
    ))
);

CREATE INDEX IF NOT EXISTS ix_ciclo_estado ON cicloinventario(estado);
CREATE INDEX IF NOT EXISTS ix_ciclo_fecha ON cicloinventario(fecha_inicio DESC);

-- TABLA: TareaConteo
CREATE TABLE IF NOT EXISTS tareaconteo (
    id_tarea              INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_ciclo              INT NOT NULL,
    id_auxiliar_asignado   INT NOT NULL,
    descripcion            VARCHAR(200),
    fecha_asignacion       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_inicio_conteo    TIMESTAMP,
    fecha_fin_conteo       TIMESTAMP,
    estado                 VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE',
    total_productos        INT NOT NULL DEFAULT 0,
    productos_contados     INT NOT NULL DEFAULT 0,
    productos_con_diferencia INT NOT NULL DEFAULT 0,
    porcentaje_avance      NUMERIC(5,2)
        GENERATED ALWAYS AS (
            CASE WHEN total_productos > 0
                 THEN (productos_contados::NUMERIC(5,2) / total_productos) * 100
                 ELSE 0
            END
        ) STORED,
    porcentaje_precision   NUMERIC(5,2),
    observaciones_jefatura VARCHAR(500),
    id_usuario_aprobador   INT,
    fecha_aprobacion       TIMESTAMP,
    CONSTRAINT fk_tarea_ciclo FOREIGN KEY (id_ciclo) REFERENCES cicloinventario(id_ciclo),
    CONSTRAINT fk_tarea_auxiliar FOREIGN KEY (id_auxiliar_asignado) REFERENCES usuario(id_usuario),
    CONSTRAINT fk_tarea_aprobador FOREIGN KEY (id_usuario_aprobador) REFERENCES usuario(id_usuario),
    CONSTRAINT ck_tarea_estado CHECK (estado IN (
        'PENDIENTE', 'EN_PROCESO', 'FINALIZADA',
        'EN_VERIFICACION', 'APROBADA', 'RECHAZADA'
    ))
);

CREATE INDEX IF NOT EXISTS ix_tarea_ciclo ON tareaconteo(id_ciclo);
CREATE INDEX IF NOT EXISTS ix_tarea_auxiliar ON tareaconteo(id_auxiliar_asignado);
CREATE INDEX IF NOT EXISTS ix_tarea_estado ON tareaconteo(estado);

-- TABLA: DetalleConteo
CREATE TABLE IF NOT EXISTS detalleconteo (
    id_detalle            INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_tarea              INT NOT NULL,
    id_producto           INT NOT NULL,
    cantidad_teorica      INT NOT NULL DEFAULT 0,
    cantidad_contada      INT NOT NULL DEFAULT 0,
    diferencia            INT
        GENERATED ALWAYS AS (cantidad_contada - cantidad_teorica) STORED,
    tipo_diferencia       VARCHAR(20)
        GENERATED ALWAYS AS (
            CASE
                WHEN cantidad_contada > cantidad_teorica THEN 'POSITIVO'
                WHEN cantidad_contada < cantidad_teorica THEN 'NEGATIVO'
                ELSE 'SIN_DIFERENCIA'
            END
        ) STORED,
    valor_diferencia      NUMERIC(18,2),
    requiere_verificacion BOOLEAN NOT NULL DEFAULT FALSE,
    verificado            BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_conteo          TIMESTAMP,
    fecha_ultima_modificacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_detalle_tarea FOREIGN KEY (id_tarea) REFERENCES tareaconteo(id_tarea),
    CONSTRAINT fk_detalle_producto FOREIGN KEY (id_producto) REFERENCES producto(id_producto),
    CONSTRAINT uq_detalle_tarea_producto UNIQUE (id_tarea, id_producto)
);

CREATE INDEX IF NOT EXISTS ix_detalle_tarea ON detalleconteo(id_tarea);
CREATE INDEX IF NOT EXISTS ix_detalle_producto ON detalleconteo(id_producto);
CREATE INDEX IF NOT EXISTS ix_detalle_diferencia ON detalleconteo(tipo_diferencia)
    WHERE tipo_diferencia <> 'SIN_DIFERENCIA';

-- TABLA: ConteoUbicacion
CREATE TABLE IF NOT EXISTS conteoubicacion (
    id_conteo_ubicacion INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_detalle          INT NOT NULL,
    ubicacion_fidedigna VARCHAR(100) NOT NULL,
    cantidad            INT NOT NULL DEFAULT 0,
    observaciones       VARCHAR(300),
    fecha_registro      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_auxiliar         INT NOT NULL,
    CONSTRAINT fk_conteoubic_detalle FOREIGN KEY (id_detalle) REFERENCES detalleconteo(id_detalle),
    CONSTRAINT fk_conteoubic_auxiliar FOREIGN KEY (id_auxiliar) REFERENCES usuario(id_usuario)
);

CREATE INDEX IF NOT EXISTS ix_conteoubic_detalle ON conteoubicacion(id_detalle);
CREATE INDEX IF NOT EXISTS ix_conteoubic_ubicacion ON conteoubicacion(ubicacion_fidedigna);

-- TABLA: AprobacionCiclo
CREATE TABLE IF NOT EXISTS aprobacionciclo (
    id_aprobacion    INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_ciclo         INT NOT NULL,
    id_usuario       INT NOT NULL,
    nivel_aprobacion VARCHAR(20) NOT NULL,
    accion           VARCHAR(20) NOT NULL,
    comentarios      VARCHAR(500),
    fecha_aprobacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_aprobacion_ciclo FOREIGN KEY (id_ciclo) REFERENCES cicloinventario(id_ciclo),
    CONSTRAINT fk_aprobacion_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
    CONSTRAINT ck_aprobacion_nivel CHECK (nivel_aprobacion IN ('JEFATURA', 'GERENCIA')),
    CONSTRAINT ck_aprobacion_accion CHECK (accion IN ('APROBADO', 'RECHAZADO'))
);

CREATE INDEX IF NOT EXISTS ix_aprobacion_ciclo ON aprobacionciclo(id_ciclo);

-- TABLA: LogAuditoria
CREATE TABLE IF NOT EXISTS logauditoria (
    id_log             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_usuario         INT,
    accion             VARCHAR(50) NOT NULL,
    tabla_afectada     VARCHAR(50),
    registro_afectado_id INT,
    valor_anterior     TEXT,
    valor_nuevo        TEXT,
    ip_address         VARCHAR(50),
    user_agent         VARCHAR(300),
    fecha_hora         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    duracion_segundos  INT,
    CONSTRAINT fk_log_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

CREATE INDEX IF NOT EXISTS ix_log_usuario ON logauditoria(id_usuario);
CREATE INDEX IF NOT EXISTS ix_log_fecha ON logauditoria(fecha_hora DESC);
CREATE INDEX IF NOT EXISTS ix_log_accion ON logauditoria(accion);

-- TABLA: CargaExcel
CREATE TABLE IF NOT EXISTS cargaexcel (
    id_carga            INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_usuario          INT NOT NULL,
    nombre_archivo      VARCHAR(200) NOT NULL,
    tipo_carga          VARCHAR(30) NOT NULL DEFAULT 'INVENTARIO_TEORICO',
    total_registros     INT NOT NULL DEFAULT 0,
    registros_exitosos  INT NOT NULL DEFAULT 0,
    registros_fallidos  INT NOT NULL DEFAULT 0,
    estado              VARCHAR(20) NOT NULL DEFAULT 'EN_PROCESO',
    errores_detalle     TEXT,
    fecha_carga         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_carga_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
    CONSTRAINT ck_carga_tipo CHECK (tipo_carga IN ('INVENTARIO_TEORICO', 'CATALOGO_PRODUCTOS', 'ACTUALIZACION_PRECIOS')),
    CONSTRAINT ck_carga_estado CHECK (estado IN ('EN_PROCESO', 'COMPLETADA', 'ERROR', 'COMPLETADA_CON_ERRORES'))
);

-- TABLA: MetricasAuxiliar
CREATE TABLE IF NOT EXISTS metricasauxiliar (
    id_metrica                 INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_auxiliar                INT NOT NULL,
    periodo                    VARCHAR(10) NOT NULL, -- 'YYYY-MM'
    total_tareas_asignadas     INT NOT NULL DEFAULT 0,
    total_tareas_completadas   INT NOT NULL DEFAULT 0,
    total_productos_contados   INT NOT NULL DEFAULT 0,
    promedio_precision         NUMERIC(5,2),
    promedio_tiempo_por_producto NUMERIC(10,2), -- segundos
    conteos_sin_diferencia     INT NOT NULL DEFAULT 0,
    conteos_con_diferencia     INT NOT NULL DEFAULT 0,
    fecha_calculo              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_metricas_auxiliar FOREIGN KEY (id_auxiliar) REFERENCES usuario(id_usuario),
    CONSTRAINT uq_metricas_aux_periodo UNIQUE (id_auxiliar, periodo)
);

CREATE INDEX IF NOT EXISTS ix_metricas_auxiliar ON metricasauxiliar(id_auxiliar);
CREATE INDEX IF NOT EXISTS ix_metricas_periodo ON metricasauxiliar(periodo DESC);

-- ============================================================
-- 3) VISTAS
-- ============================================================

CREATE OR REPLACE VIEW vw_resumenciclos AS
SELECT
    c.id_ciclo,
    c.codigo,
    c.descripcion,
    c.estado,
    c.es_segregado,
    c.fecha_inicio,
    c.fecha_cierre,
    u.nombre_completo AS creador,
    c.precision_general,
    c.valor_merma_total,
    (SELECT COUNT(*) FROM tareaconteo t WHERE t.id_ciclo = c.id_ciclo) AS total_tareas,
    (SELECT COUNT(*) FROM tareaconteo t WHERE t.id_ciclo = c.id_ciclo AND t.estado = 'FINALIZADA') AS tareas_completadas
FROM cicloinventario c
JOIN usuario u ON c.id_usuario_creador = u.id_usuario;

CREATE OR REPLACE VIEW vw_productoscondiferencia AS
SELECT
    d.id_detalle,
    t.id_ciclo,
    ci.codigo AS codigo_ciclo,
    p.sku,
    p.codigo_upc,
    p.descripcion,
    d.cantidad_teorica,
    d.cantidad_contada,
    d.diferencia,
    d.tipo_diferencia,
    p.precio_final,
    (d.diferencia * p.precio_final) AS valor_diferencia,
    d.requiere_verificacion,
    d.verificado,
    u.nombre_completo AS auxiliar_conteo,
    t.fecha_fin_conteo
FROM detalleconteo d
JOIN tareaconteo t ON d.id_tarea = t.id_tarea
JOIN cicloinventario ci ON t.id_ciclo = ci.id_ciclo
JOIN producto p ON d.id_producto = p.id_producto
JOIN usuario u ON t.id_auxiliar_asignado = u.id_usuario
WHERE d.diferencia <> 0;

CREATE OR REPLACE VIEW vw_rankingauxiliares AS
SELECT
    u.id_usuario,
    u.nombre_completo,
    m.periodo,
    m.total_tareas_completadas,
    m.total_productos_contados,
    m.promedio_precision,
    m.promedio_tiempo_por_producto,
    m.conteos_sin_diferencia,
    m.conteos_con_diferencia,
    CASE
        WHEN m.total_productos_contados > 0
        THEN (m.conteos_sin_diferencia::NUMERIC(5,2) / m.total_productos_contados) * 100
        ELSE 0
    END AS porcentaje_exactitud
FROM metricasauxiliar m
JOIN usuario u ON m.id_auxiliar = u.id_usuario;

-- ============================================================
-- 4) PROCEDIMIENTOS (PL/pgSQL)
-- ============================================================

-- SP: Registrar Log de Auditoría
CREATE OR REPLACE PROCEDURE sp_registrarlog(
    IN p_id_usuario INT,
    IN p_accion VARCHAR(50),
    IN p_tabla_afectada VARCHAR(50) DEFAULT NULL,
    IN p_registro_afectado_id INT DEFAULT NULL,
    IN p_valor_anterior TEXT DEFAULT NULL,
    IN p_valor_nuevo TEXT DEFAULT NULL,
    IN p_ip_address VARCHAR(50) DEFAULT NULL,
    IN p_user_agent VARCHAR(300) DEFAULT NULL,
    IN p_duracion_segundos INT DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO logauditoria (
        id_usuario, accion, tabla_afectada, registro_afectado_id,
        valor_anterior, valor_nuevo, ip_address, user_agent, duracion_segundos
    )
    VALUES (
        p_id_usuario, p_accion, p_tabla_afectada, p_registro_afectado_id,
        p_valor_anterior, p_valor_nuevo, p_ip_address, p_user_agent, p_duracion_segundos
    );
END;
$$;

-- SP: Actualizar cantidad contada (suma de ubicaciones)
CREATE OR REPLACE PROCEDURE sp_actualizarcantidadcontada(IN p_id_detalle INT)
LANGUAGE plpgsql
AS $$
DECLARE
    v_total INT;
    v_precio NUMERIC(18,2);
    v_diferencia INT;
BEGIN
    SELECT COALESCE(SUM(cantidad), 0)
    INTO v_total
    FROM conteoubicacion
    WHERE id_detalle = p_id_detalle;

    SELECT p.precio_final
    INTO v_precio
    FROM detalleconteo d
    JOIN producto p ON d.id_producto = p.id_producto
    WHERE d.id_detalle = p_id_detalle;

    UPDATE detalleconteo
    SET cantidad_contada = v_total,
        fecha_ultima_modificacion = CURRENT_TIMESTAMP,
        valor_diferencia = (v_total - cantidad_teorica) * v_precio
    WHERE id_detalle = p_id_detalle;

    SELECT diferencia
    INTO v_diferencia
    FROM detalleconteo
    WHERE id_detalle = p_id_detalle;

    IF v_diferencia <> 0 THEN
        UPDATE detalleconteo
        SET requiere_verificacion = TRUE
        WHERE id_detalle = p_id_detalle;
    END IF;
END;
$$;

-- SP: Calcular métricas de ciclo al cerrar
CREATE OR REPLACE PROCEDURE sp_calcularmetricasciclo(IN p_id_ciclo INT)
LANGUAGE plpgsql
AS $$
DECLARE
    v_total_productos INT;
    v_productos_sin_diferencia INT;
    v_precision NUMERIC(5,2);
    v_valor_merma NUMERIC(18,2);
BEGIN
    SELECT
        COUNT(*),
        COALESCE(SUM(CASE WHEN d.diferencia = 0 THEN 1 ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN d.diferencia < 0 THEN ABS(d.diferencia) * p.precio_final ELSE 0 END), 0)
    INTO v_total_productos, v_productos_sin_diferencia, v_valor_merma
    FROM detalleconteo d
    JOIN tareaconteo t ON d.id_tarea = t.id_tarea
    JOIN producto p ON d.id_producto = p.id_producto
    WHERE t.id_ciclo = p_id_ciclo;

    IF v_total_productos > 0 THEN
        v_precision := (v_productos_sin_diferencia::NUMERIC(5,2) / v_total_productos) * 100;
    ELSE
        v_precision := 0;
    END IF;

    UPDATE cicloinventario
    SET precision_general = v_precision,
        valor_merma_total = v_valor_merma
    WHERE id_ciclo = p_id_ciclo;
END;
$$;

-- SP: Crear ciclo segregado para verificación
CREATE OR REPLACE PROCEDURE sp_crearciclosegregado(
    IN p_id_ciclo_padre INT,
    IN p_id_usuario_creador INT,
    IN p_descripcion VARCHAR(200),
    OUT p_id_ciclo_nuevo INT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_codigo_padre VARCHAR(20);
    v_contador INT;
    v_codigo_nuevo VARCHAR(20);
BEGIN
    SELECT codigo INTO v_codigo_padre
    FROM cicloinventario
    WHERE id_ciclo = p_id_ciclo_padre;

    SELECT COUNT(*) + 1 INTO v_contador
    FROM cicloinventario
    WHERE id_ciclo_padre = p_id_ciclo_padre;

    v_codigo_nuevo := v_codigo_padre || '-V' || v_contador::VARCHAR(2);

    INSERT INTO cicloinventario (
        codigo, descripcion, id_usuario_creador, estado,
        id_ciclo_padre, es_segregado
    )
    VALUES (
        v_codigo_nuevo, p_descripcion, p_id_usuario_creador, 'ABIERTO',
        p_id_ciclo_padre, TRUE
    )
    RETURNING id_ciclo INTO p_id_ciclo_nuevo;

    UPDATE detalleconteo dc
    SET requiere_verificacion = TRUE
    FROM tareaconteo t
    WHERE dc.id_tarea = t.id_tarea
      AND t.id_ciclo = p_id_ciclo_padre
      AND dc.diferencia <> 0;
END;
$$;

-- ============================================================
-- 5) TRIGGERS
-- ============================================================

-- Trigger function: actualizar contadores de tarea al insertar/actualizar detalleconteo
CREATE OR REPLACE FUNCTION fn_actualizarcontadorestarea()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE tareaconteo t
    SET productos_contados = (
            SELECT COUNT(*)
            FROM detalleconteo d
            WHERE d.id_tarea = t.id_tarea
              AND d.cantidad_contada > 0
        ),
        productos_con_diferencia = (
            SELECT COUNT(*)
            FROM detalleconteo d
            WHERE d.id_tarea = t.id_tarea
              AND d.diferencia <> 0
        )
    WHERE t.id_tarea IN (SELECT DISTINCT id_tarea FROM new_rows);

    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS tr_actualizarcontadorestarea ON detalleconteo;

CREATE TRIGGER tr_actualizarcontadorestarea
AFTER INSERT OR UPDATE ON detalleconteo
REFERENCING NEW TABLE AS new_rows
FOR EACH STATEMENT
EXECUTE FUNCTION fn_actualizarcontadorestarea();

-- ============================================================
-- 6) DATOS INICIALES / PRUEBA (IDEMPOTENTE)
-- ============================================================

-- Roles iniciales
INSERT INTO rol (nombre, descripcion)
VALUES
    ('Gerencia', 'Aprobación final de ciclos de inventario y acceso total al sistema'),
    ('Jefatura', 'Carga de Excel, asignación de tareas, aprobación de conteos'),
    ('Auxiliar', 'Realiza conteos físicos y registra ubicaciones'),
    ('Auditoria', 'Solo lectura de logs, reportes y métricas históricas')
ON CONFLICT (nombre) DO NOTHING;

-- Usuarios de prueba (solo si no existen)
INSERT INTO usuario (nombre_completo, email, password_hash, id_rol)
VALUES
    ('Carlos Rodríguez', 'gerente@bmslogmart.com', 'HASH_PENDIENTE', 1),
    ('María Fernández', 'jefe.bodega@bmslogmart.com', 'HASH_PENDIENTE', 2),
    ('Juan Pérez', 'auxiliar1@bmslogmart.com', 'HASH_PENDIENTE', 3),
    ('Ana García', 'auxiliar2@bmslogmart.com', 'HASH_PENDIENTE', 3),
    ('Luis Mora', 'auditor@bmslogmart.com', 'HASH_PENDIENTE', 4)
ON CONFLICT (email) DO NOTHING;

DO $$
BEGIN
    RAISE NOTICE 'Base de datos InventarioBMS preparada en PostgreSQL.';
    RAISE NOTICE 'Tablas: 11';
    RAISE NOTICE 'Vistas: 3';
    RAISE NOTICE 'Procedimientos: 4';
    RAISE NOTICE 'Triggers: 1';
END $$;