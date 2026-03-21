// ═══════════════════════════════════════════════════════════════
// ZENGO v1.7 — Configuración Dexie (IndexedDB)
//
// IMPORTANTE — Nombre de BD: ZengoDB_v17
//   Se cambió el nombre intencionalmente desde 'ZengoDB' para
//   forzar una BD nueva y limpia. IndexedDB prohíbe cambiar el
//   tipo de PK (++id → id) en tablas existentes; la única salida
//   robusta es una BD nueva con el esquema correcto desde v1.
//   La BD anterior ('ZengoDB') queda inactiva en el navegador
//   pero no causa ningún conflicto.
//
// Esquema UUID en tablas de captura:
//   conteos_realizados, hallazgos, auditoria, ubicaciones_historico
//   usan 'id' (TEXT/UUID manual) — el cliente genera
//   crypto.randomUUID() antes de insertar en Dexie y en Supabase.
//   Esto permite que 100 laptops offline sincronicen sin colisiones.
//
// Tablas con ++id (auto-increment integer):
//   productos, cola_sync → sus IDs son locales; Supabase genera
//   sus propios IDs BIGINT independientemente.
//
// Tablas con id manual no-auto (string legible):
//   tareas, usuarios → el cliente genera el ID antes de insertar.
// ═══════════════════════════════════════════════════════════════

const db = new Dexie('ZengoDB_v17');

// ═══════════════════════════════════════════════════════════════
// VERSIÓN 1 — Esquema inicial completo (BD nueva, sin historial)
// ═══════════════════════════════════════════════════════════════
db.version(1).stores({
    // Productos: ++id local (Supabase genera su propio BIGINT)
    productos:             '++id, upc, sku, descripcion, categoria, existencia, precio, tipo, estatus',

    // Tareas: id VARCHAR legible ej. 'TELEVISOR_2026-03-21_001'
    tareas:                'id, categoria, auxiliar_id, estado, fecha_asignacion',

    // Tablas de captura: id UUID generado por el cliente
    hallazgos:             'id, upc, auxiliar_id, tarea_id, estado, timestamp',
    conteos_realizados:    'id, upc, cantidad, ubicacion, auxiliar_id, tarea_id, timestamp',
    ubicaciones_historico: 'id, &upc, ubicacion, timestamp',   // &upc = índice único
    auditoria:             'id, tabla, accion, usuario_id, mensaje, timestamp',

    // Cola de sync local: ++id auto-increment (solo vive en Dexie)
    cola_sync:             '++id, tabla, accion, datos, timestamp, intentos',

    // Usuarios: id INTEGER (mismo que Supabase usuarios.id)
    usuarios:              'id, email, nombre, apellido, role_id, activo, fecha_creacion'
});

// ═══════════════════════════════════════════════════════════════
// EVENTOS
// ═══════════════════════════════════════════════════════════════
db.on('ready', () => {
    console.log('✓ Dexie: Base de datos lista (ZengoDB_v17 · v1 · UUID)');
});

db.on('blocked', () => {
    console.warn('⚠ Dexie: Base de datos bloqueada — cierra otras pestañas de ZENGO');
});

// ═══════════════════════════════════════════════════════════════
// MÉTODOS HELPER
// ═══════════════════════════════════════════════════════════════
db.clearAll = async function () {
    await db.productos.clear();
    await db.tareas.clear();
    await db.hallazgos.clear();
    await db.conteos_realizados.clear();
    await db.ubicaciones_historico.clear();
    await db.cola_sync.clear();
    await db.usuarios.clear();
    await db.auditoria.clear();
    console.log('✓ Dexie: Todas las tablas limpiadas');
};

db.getStats = async function () {
    return {
        productos:             await db.productos.count(),
        tareas:                await db.tareas.count(),
        hallazgos:             await db.hallazgos.count(),
        conteos_realizados:    await db.conteos_realizados.count(),
        ubicaciones_historico: await db.ubicaciones_historico.count(),
        cola_sync:             await db.cola_sync.count(),
        usuarios:              await db.usuarios.count(),
        auditoria:             await db.auditoria.count()
    };
};

window.db = db;
