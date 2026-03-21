// ═══════════════════════════════════════════════════════════════
// ZENGO v1.7 — LogController
// Auditoría del sistema con mensajes en lenguaje natural
// Tabla Supabase: auditoria | Tabla Dexie: auditoria
// ═══════════════════════════════════════════════════════════════

const LogController = {

    // ═══════════════════════════════════════════════════════════
    // GENERAR MENSAJE NATURAL
    // Convierte acción + datos en una frase legible para humanos.
    // Ej: "María López reportó un hallazgo: MOUSE LOGITECH · 3 uds · Ubicación: 3003"
    // ═══════════════════════════════════════════════════════════
    generarMensaje({ accion, tabla, usuario_nombre, datos_nuevos, datos_anteriores }) {
        const quien = usuario_nombre || 'Sistema';
        const d = datos_nuevos || {};
        const prev = datos_anteriores || {};
        const ROLES = { 1: 'Administrador', 2: 'Jefe', 3: 'Auxiliar' };
        const fecha = new Date().toLocaleDateString('es-CR');

        switch (accion) {

            // ── Sesión ──────────────────────────────────────────
            case 'LOGIN':
                return `${quien} inició sesión en el sistema`;

            case 'LOGOUT':
                return `${quien} cerró sesión`;

            case 'FAILED_LOGIN':
                return `Intento de acceso fallido para la cuenta: ${d.email || quien}`;

            // ── Usuarios ────────────────────────────────────────
            case 'CREATE_USER': {
                const rol = ROLES[d.role_id] || 'Usuario';
                return `${quien} creó al usuario ${d.nombre || ''} ${d.apellido || ''} (${rol}) · ${d.email || ''}`.trim();
            }

            case 'UPDATE_USER': {
                if (d.activo === false)
                    return `${quien} desactivó al usuario ${prev.nombre || ''} ${prev.apellido || ''} (${prev.email || ''})`.trim();
                if (d.role_id)
                    return `${quien} cambió el rol de ${prev.nombre || 'un usuario'} a ${ROLES[d.role_id] || 'Desconocido'}`;
                return `${quien} actualizó los datos de ${prev.nombre || ''} ${prev.apellido || ''}`.trim();
            }

            case 'DELETE_USER':
                return `${quien} desactivó al usuario ${prev.nombre || ''} ${prev.apellido || ''} (${prev.email || ''})`.trim();

            // ── Tareas ──────────────────────────────────────────
            case 'TAREA_ASIGNADA':
                return `${quien} asignó el cíclico "${d.categoria || ''}" a ${d.auxiliar_nombre || 'un auxiliar'} · ${d.productos_total || 0} productos`;

            case 'TAREA_INICIADA':
                return `${quien} inició el cíclico "${d.categoria || ''}"`;

            case 'TAREA_COMPLETADA':
                return `${quien} completó el cíclico "${d.categoria || ''}" · ${d.productos_contados || 0}/${d.productos_total || 0} productos contados`;

            case 'TAREA_APROBADA':
                return `${quien} aprobó el cíclico "${d.categoria || ''}" de ${d.auxiliar_nombre || 'auxiliar'}`;

            case 'TAREA_RECHAZADA':
                return `${quien} rechazó el cíclico "${d.categoria || ''}" · Motivo: ${d.motivo_rechazo || 'sin especificar'}`;

            case 'TAREA_DEVUELTA':
                return `${quien} devolvió el cíclico "${d.categoria || ''}" para correcciones · Motivo: ${d.motivo_jefe || 'sin especificar'}`;

            // ── Hallazgos ───────────────────────────────────────
            case 'HALLAZGO_REPORTADO': {
                const prod = d.descripcion || d.upc || 'producto desconocido';
                const ubic = d.ubicacion || 'sin ubicar';
                const cant = d.cantidad || 0;
                return `${quien} reportó un hallazgo: ${prod} · ${cant} uds · Ubicación: ${ubic}`;
            }

            case 'HALLAZGO_APROBADO': {
                const prod = d.descripcion || d.upc || 'producto';
                const aux = d.auxiliar_nombre || 'auxiliar';
                const cant = d.cantidad || 0;
                const ubic = d.ubicacion || '';
                return `${quien} aprobó el hallazgo de ${aux}: ${prod} · ${cant} uds${ubic ? ' · Ubic: ' + ubic : ''}`;
            }

            case 'HALLAZGO_RECHAZADO':
                return `${quien} rechazó el hallazgo #${d.id || ''} · Motivo: ${d.motivo_rechazo || 'sin especificar'}`;

            // ── Inventario ──────────────────────────────────────
            case 'IMPORT_PRODUCTOS':
                return `${quien} cargó ${(d.total || 0).toLocaleString()} productos de NetSuite · ${d.categorias || 0} categorías · ${fecha}`;

            case 'CICLO_CERRADO':
                return `${quien} cerró el ciclo diario · ${fecha}`;

            // ── Fallback ────────────────────────────────────────
            default:
                return `${quien} realizó "${accion}" en ${tabla}`;
        }
    },

    // ═══════════════════════════════════════════════════════════
    // REGISTRAR
    // Escribe en Supabase (online) o en la cola_sync (offline).
    // También guarda una copia local en Dexie para consulta rápida.
    // ═══════════════════════════════════════════════════════════
    async registrar({
        tabla = '',
        accion = '',
        registro_id = null,
        usuario_id = null,
        usuario_nombre = null,
        datos_anteriores = null,
        datos_nuevos = null
    }) {
        const id = crypto.randomUUID();

        const mensaje = this.generarMensaje({
            accion,
            tabla,
            usuario_nombre,
            datos_nuevos,
            datos_anteriores
        });

        const payload = {
            id,
            tabla,
            accion,
            registro_id: registro_id ? String(registro_id) : null,
            usuario_id,
            usuario_nombre,
            mensaje,
            datos_anteriores,
            datos_nuevos,
            user_agent: navigator.userAgent,
            timestamp: new Date().toISOString()
        };

        // Guardar copia local en Dexie (siempre, para acceso offline)
        try {
            if (window.db?.auditoria) {
                await window.db.auditoria.add({
                    id,
                    tabla,
                    accion,
                    usuario_id,
                    mensaje,
                    timestamp: payload.timestamp
                });
            }
        } catch (e) { /* no bloquear flujo */ }

        // Enviar a Supabase
        try {
            if (navigator.onLine && window.supabaseClient) {
                const { error } = await window.supabaseClient
                    .from('auditoria')
                    .insert(payload);

                if (error) throw error;
                return true;
            }

            // Offline: encolar para sincronizar cuando haya conexión
            if (window.SyncManager?.addToQueue) {
                await window.SyncManager.addToQueue('auditoria', 'insert', payload);
                return true;
            }

            return false;

        } catch (err) {
            console.warn('⚠ LogController: error al registrar, encolando:', err.message);
            try {
                if (window.SyncManager?.addToQueue) {
                    await window.SyncManager.addToQueue('auditoria', 'insert', payload);
                    return true;
                }
            } catch (qErr) {
                console.warn('⚠ LogController: error en cola:', qErr.message);
            }
            return false;
        }
    },

    // ═══════════════════════════════════════════════════════════
    // OBTENER TODOS (para panel de Admin)
    // Lee desde Supabase; fallback a Dexie local.
    // ═══════════════════════════════════════════════════════════
    async obtenerTodos({ limite = 200 } = {}) {
        try {
            if (navigator.onLine && window.supabaseClient) {
                const { data, error } = await window.supabaseClient
                    .from('auditoria')
                    .select('*')
                    .order('timestamp', { ascending: false })
                    .limit(limite);

                if (error) throw error;
                return data || [];
            }
        } catch (err) {
            console.warn('LogController.obtenerTodos — usando Dexie:', err.message);
        }

        // Fallback local
        try {
            return await window.db.auditoria
                .orderBy('timestamp')
                .reverse()
                .limit(limite)
                .toArray();
        } catch (e) {
            return [];
        }
    },

    // ═══════════════════════════════════════════════════════════
    // FILTRAR
    // ═══════════════════════════════════════════════════════════
    async filtrar({ usuario = '', accion = '', tabla = '', texto = '', limite = 200 } = {}) {
        try {
            if (navigator.onLine && window.supabaseClient) {
                let query = window.supabaseClient
                    .from('auditoria')
                    .select('*')
                    .order('timestamp', { ascending: false })
                    .limit(limite);

                if (usuario) query = query.ilike('usuario_nombre', `%${usuario}%`);
                if (accion) query = query.eq('accion', accion);
                if (tabla) query = query.eq('tabla', tabla);

                const { data, error } = await query;
                if (error) throw error;

                let logs = data || [];

                // Filtro de texto libre sobre el campo mensaje (más rápido que JSON.stringify)
                if (texto) {
                    const q = texto.toLowerCase();
                    logs = logs.filter(log =>
                        (log.mensaje || '').toLowerCase().includes(q) ||
                        (log.usuario_nombre || '').toLowerCase().includes(q)
                    );
                }

                return logs;
            }
        } catch (err) {
            console.warn('LogController.filtrar — usando Dexie:', err.message);
        }

        // Fallback local
        try {
            let logs = await window.db.auditoria.orderBy('timestamp').reverse().toArray();
            if (texto) {
                const q = texto.toLowerCase();
                logs = logs.filter(l => (l.mensaje || '').toLowerCase().includes(q));
            }
            return logs;
        } catch (e) {
            return [];
        }
    }
};

window.LogController = LogController;
