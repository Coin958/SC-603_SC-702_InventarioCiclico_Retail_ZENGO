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

            case 'TAREA_APROBADA': {
                const contados = d.productos_contados !== undefined
                    ? ` · ${d.productos_contados}/${d.productos_total || 0} productos contados`
                    : '';
                return `${quien} entregó a Admin el cíclico "${d.categoria || ''}" de ${d.auxiliar_nombre || 'auxiliar'}${contados}`;
            }

            case 'TAREA_RECHAZADA': {
                const auxR = d.auxiliar_nombre ? ` · Auxiliar: ${d.auxiliar_nombre}` : '';
                return `${quien} devolvió al auxiliar el cíclico "${d.categoria || ''}"${auxR} · Motivo: ${d.motivo_rechazo || 'sin especificar'}`;
            }

            case 'TAREA_CANCELADA': {
                const auxC = d.auxiliar_nombre ? ` de ${d.auxiliar_nombre}` : '';
                return `${quien} canceló el cíclico "${d.categoria || ''}"${auxC} · Estado anterior: ${d.estado_anterior || '—'}`;
            }

            case 'TAREA_DEVUELTA': {
                const motivo = d.motivo_rechazo || d.motivo_jefe || 'sin especificar';
                const auxDev = d.auxiliar_nombre ? ` (aux: ${d.auxiliar_nombre})` : '';
                return `${quien} devolvió el cíclico "${d.categoria || ''}"${auxDev} para correcciones · Motivo: ${motivo}`;
            }

            // ── Hallazgos ───────────────────────────────────────
            case 'HALLAZGO_REPORTADO': {
                const prod = d.descripcion || d.upc || 'producto desconocido';
                const ubic = d.ubicacion || 'sin ubicar';
                const cant = d.cantidad || 0;
                return `${quien} reportó un hallazgo: ${prod} · ${cant} uds · Ubicación: ${ubic}`;
            }

            case 'HALLAZGO_APROBADO': {
                const prod = d.descripcion || d.upc || 'producto';
                const aux = d.auxiliar_nombre || prev.hallazgo_reportado_por || 'auxiliar';
                const cant = d.cantidad || 0;
                const ubic = d.ubicacion || '';
                const precioStr = d.precio_hallazgo ? ` · ₡${Number(d.precio_hallazgo).toLocaleString()} c/u` : '';
                const valorStr = d.valor_hallazgo ? ` · Total: ₡${Number(d.valor_hallazgo).toLocaleString()}` : '';
                return `${quien} aprobó el hallazgo de ${aux}: ${prod} · ${cant} uds${precioStr}${valorStr}${ubic ? ' · Ubic: ' + ubic : ''}`;
            }

            case 'HALLAZGO_RECHAZADO': {
                const prod = d.descripcion || d.upc || 'producto';
                const aux = d.auxiliar_nombre || prev.hallazgo_reportado_por || 'auxiliar';
                const cant = d.cantidad || 0;
                return `${quien} rechazó el hallazgo de ${aux}: ${prod} · ${cant} uds`;
            }

            // ── Conteos (Auxiliar) ──────────────────────────────
            case 'CONTEO_REGISTRADO': {
                const total = d.total || (d.conteos || []).reduce((s, c) => s + (c.cantidad || 0), 0) || 0;
                const ubic = (d.conteos || []).map(c => c.ubicacion).filter(Boolean).join(', ') || 'sin ubicar';
                return `${quien} registró conteo: UPC ${d.upc || '—'} · ${total} uds · Ubic: ${ubic}`;
            }

            case 'CONTEO_EDITADO': {
                const antes = (prev.conteos || []).reduce((s, c) => s + (c.cantidad || 0), 0);
                const despues = (d.conteos || []).reduce((s, c) => s + (c.cantidad || 0), 0);
                return `${quien} editó conteo: UPC ${d.upc || '—'} · ${antes} → ${despues} uds`;
            }

            case 'CONTEO_ELIMINADO': {
                const totalEliminado = (prev.conteos || []).reduce((s, c) => s + (c.cantidad || 0), 0);
                return `${quien} eliminó conteo: UPC ${prev.upc || d.upc || '—'} · ${totalEliminado} uds`;
            }

            // ── Conteos en Revisión (Jefe) ───────────────────────
            case 'CONTEO_AGREGADO_REVISION': {
                const desc = d.descripcion || d.upc || '—';
                const cantR = d.total || d.cantidad || 0;
                const ubicR = d.ubicacion || 'sin ubicar';
                return `${quien} agregó conteo en revisión: ${desc} · ${cantR} uds · Ubic: ${ubicR}`;
            }

            case 'CONTEO_EDITADO_REVISION': {
                const descE = d.descripcion || d.upc || '—';
                const antesR = (prev.conteos || []).reduce((s, c) => s + (c.cantidad || 0), 0) || prev.total || 0;
                const despuesR = (d.conteos || []).reduce((s, c) => s + (c.cantidad || 0), 0) || d.total || 0;
                return `${quien} corrigió conteo en revisión: ${descE} · ${antesR} → ${despuesR} uds`;
            }

            case 'CONTEO_ELIMINADO_REVISION': {
                const descEl = prev.descripcion || prev.upc || d.upc || '—';
                const cantEl = (prev.conteos || []).reduce((s, c) => s + (c.cantidad || 0), 0) || prev.total || 0;
                return `${quien} eliminó conteo en revisión: ${descEl} · ${cantEl} uds`;
            }

            // ── Hallazgo agregado por Jefe ───────────────────────
            case 'HALLAZGO_AGREGADO_JEFE': {
                const prodH = d.descripcion || d.upc || 'producto';
                const cantH = d.cantidad || d.total || 0;
                const ubicH = d.ubicacion || '';
                return `${quien} agregó hallazgo durante revisión: ${prodH} · ${cantH} uds${ubicH ? ' · Ubic: ' + ubicH : ''}`;
            }

            // ── Inventario y exportaciones ──────────────────────
            case 'IMPORT_PRODUCTOS':
                return `${quien} importó ${(d.total || 0).toLocaleString()} productos desde NetSuite · ${d.categorias || 0} categorías · Archivo: ${d.archivo || '—'} · ${fecha}`;

            case 'EXPORT_CICLICO': {
                const auxEx = d.auxiliar_nombre ? ` · Aux: ${d.auxiliar_nombre}` : '';
                return `${quien} exportó a Excel el cíclico "${d.categoria || ''}"${auxEx} · ${d.productos_total || 0} productos · ${d.archivo || '—'}`;
            }

            case 'CICLO_CERRADO':
                return `${quien} cerró el ciclo diario (datos eliminados) · ${fecha}`;

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
                    usuario_nombre,
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
    async filtrar({ usuario = '', accion = '', tabla = '', texto = '', fecha = '', limite = 200 } = {}) {
        const isOnline = navigator.onLine;

        if (isOnline) {
            try {
                let query = window.supabaseClient // Changed from window.supabase to window.supabaseClient to match original code
                    .from('auditoria')
                    .select('*')
                    .order('timestamp', { ascending: false })
                    .limit(limite);

                if (usuario) query = query.ilike('usuario_nombre', `%${usuario}%`);
                if (accion) {
                    if (Array.isArray(accion)) query = query.in('accion', accion);
                    else query = query.eq('accion', accion);
                }
                if (tabla) query = query.eq('tabla', tabla);
                
                if (fecha) {
                    const start = `${fecha}T00:00:00`;
                    const end = `${fecha}T23:59:59`;
                    query = query.gte('timestamp', start).lte('timestamp', end);
                }

                if (texto) {
                    query = query.ilike('mensaje', `%${texto}%`);
                }
                
                const { data, error } = await query;
                if (error) throw error;
                return data || [];

            } catch (err) {
                console.warn('LogController.filtrar — usando Dexie:', err.message);
            }
        }

        // Fallback local
        try {
            let logs = await window.db.auditoria.orderBy('timestamp').reverse().toArray();
            
            if (usuario) {
                const q = usuario.toLowerCase();
                logs = logs.filter(l => (l.usuario_nombre || '').toLowerCase().includes(q));
            }
            if (accion) {
                const actions = Array.isArray(accion) ? accion : [accion];
                logs = logs.filter(l => actions.includes(l.accion));
            }
            if (tabla) { // Added tabla filtering for local mode
                logs = logs.filter(l => l.tabla === tabla);
            }
            if (fecha) {
                logs = logs.filter(l => l.timestamp.startsWith(fecha));
            }
            if (texto) {
                const q = texto.toLowerCase();
                logs = logs.filter(l => 
                    (l.mensaje || '').toLowerCase().includes(q) ||
                    (l.usuario_nombre || '').toLowerCase().includes(q)
                );
            }
            return logs.slice(0, limite);
        } catch (err) {
            console.error('Error filtrando logs locales:', err);
            return [];
        }
    }
};

window.LogController = LogController;
