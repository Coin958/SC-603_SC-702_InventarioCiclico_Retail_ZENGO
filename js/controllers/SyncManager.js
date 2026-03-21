// ═══════════════════════════════════════════════════════════════
// ZENGO v1.7 — SyncManager (Orquestador Reactivo)
//
// Estrategia:
//   - Dexie hook en cola_sync.hook('creating') reemplaza setInterval.
//     Cada nuevo item encola un disparo con debounce de 100 ms.
//   - Inserts se agrupan por tabla y se suben en un único .insert([])
//     por tabla (reduce round-trips HTTP).
//   - Operaciones no-insert (update, upsert, delete) se procesan
//     individualmente por su naturaleza idempotente.
//   - Prioridad: usuarios → tareas → conteos_realizados →
//                hallazgos → ubicaciones_historico → auditoria
//   - MAX_RETRIES: 5. Al superar el límite, el item se descarta.
// ═══════════════════════════════════════════════════════════════

const SyncManager = {
    isSyncing: false,
    syncInterval: null,   // mantenido por compatibilidad (no usado para polling)
    MAX_RETRIES: 5,
    _debounceTimer: null,

    // Prioridad de tablas: menor número → sincroniza primero
    TABLE_PRIORITY: {
        'usuarios':              1,
        'tareas':                2,
        'conteos_realizados':    3,
        'hallazgos':             4,
        'ubicaciones_historico': 5,
        'auditoria':             6
    },

    // ═══════════════════════════════════════════════════════════
    // INICIALIZAR
    // ═══════════════════════════════════════════════════════════
    init() {
        window.addEventListener('online',  () => this.onOnline());
        window.addEventListener('offline', () => this.onOffline());

        // Hook reactivo: cada vez que se inserta en cola_sync
        // programa un sync con debounce de 100 ms.
        window.db.cola_sync.hook('creating', () => {
            // El hook corre dentro de una transacción Dexie;
            // setTimeout saca el disparo fuera de ella.
            setTimeout(() => this._scheduleSync(), 0);
        });

        // Sync inicial (da tiempo a que la app termine de cargar)
        if (navigator.onLine) {
            setTimeout(() => this.syncPendientes(), 3000);
        }

        console.log('✓ SyncManager inicializado (reactivo, MAX_RETRIES: ' + this.MAX_RETRIES + ')');
    },

    // ═══════════════════════════════════════════════════════════
    // PROGRAMAR SYNC CON DEBOUNCE
    // ═══════════════════════════════════════════════════════════
    _scheduleSync() {
        if (!navigator.onLine) return;
        clearTimeout(this._debounceTimer);
        this._debounceTimer = setTimeout(() => this.syncPendientes(), 100);
    },

    // ═══════════════════════════════════════════════════════════
    // EVENTOS DE CONECTIVIDAD
    // ═══════════════════════════════════════════════════════════
    onOnline() {
        console.log('✓ Conexión restaurada');
        window.ZENGO?.toast('Conexión restaurada', 'success');
        this.syncPendientes();
    },

    onOffline() {
        console.log('⚠ Sin conexión');
        window.ZENGO?.toast('Modo offline activado', 'warning');
    },

    // ═══════════════════════════════════════════════════════════
    // AGREGAR A COLA DE SINCRONIZACIÓN
    // El hook 'creating' disparará el sync automáticamente.
    // ═══════════════════════════════════════════════════════════
    async addToQueue(tabla, accion, datos) {
        try {
            await window.db.cola_sync.add({
                tabla,
                accion,
                datos: JSON.stringify(datos),
                timestamp: new Date().toISOString(),
                intentos: 0
            });
            console.log(`+ Cola de sync: ${accion} en ${tabla}`);
        } catch (err) {
            console.error('Error agregando a cola:', err);
        }
    },

    // ═══════════════════════════════════════════════════════════
    // SINCRONIZAR PENDIENTES
    // ═══════════════════════════════════════════════════════════
    async syncPendientes() {
        if (this.isSyncing || !navigator.onLine || !window.supabaseClient) return;

        this.isSyncing = true;

        try {
            const pendientes = await window.db.cola_sync.toArray();

            if (pendientes.length === 0) {
                this.isSyncing = false;
                return;
            }

            // Ordenar por prioridad de tabla, luego FIFO por id
            const priority = this.TABLE_PRIORITY;
            pendientes.sort((a, b) => {
                const pa = priority[a.tabla] ?? 99;
                const pb = priority[b.tabla] ?? 99;
                if (pa !== pb) return pa - pb;
                return (a.id || 0) - (b.id || 0);
            });

            console.log(`Sincronizando ${pendientes.length} elementos pendientes...`);

            let syncedCount    = 0;
            let failedCount    = 0;
            let abandonedCount = 0;

            // ── Separar inserts del resto ──────────────────────
            const inserts = pendientes.filter(i => i.accion === 'insert');
            const others  = pendientes.filter(i => i.accion !== 'insert');

            // ── Batch inserts agrupados por tabla ──────────────
            const insertsByTable = new Map();
            for (const item of inserts) {
                if (!insertsByTable.has(item.tabla)) insertsByTable.set(item.tabla, []);
                insertsByTable.get(item.tabla).push(item);
            }

            // Respetar el orden de prioridad entre tablas
            const tablasSorted = [...insertsByTable.keys()].sort(
                (a, b) => (priority[a] ?? 99) - (priority[b] ?? 99)
            );

            for (const tabla of tablasSorted) {
                const items = insertsByTable.get(tabla);

                const abandonar = items.filter(i => (i.intentos || 0) >= this.MAX_RETRIES);
                const procesar  = items.filter(i => (i.intentos || 0) <  this.MAX_RETRIES);

                for (const item of abandonar) {
                    console.warn(`✗ Abandonando item ${item.id} (insert en ${tabla}): superó ${this.MAX_RETRIES} intentos`);
                    await window.db.cola_sync.delete(item.id);
                    abandonedCount++;
                }

                if (procesar.length === 0) continue;

                try {
                    const rows = procesar.map(i => JSON.parse(i.datos));

                    const { error } = await window.supabaseClient
                        .from(tabla)
                        .insert(rows);

                    if (!error) {
                        await Promise.all(procesar.map(i => window.db.cola_sync.delete(i.id)));
                        syncedCount += procesar.length;
                        console.log(`✓ Batch insert ${tabla}: ${procesar.length} registros`);
                    } else {
                        // Incrementar intentos en todos los items del batch
                        for (const item of procesar) {
                            const ni = (item.intentos || 0) + 1;
                            await window.db.cola_sync.update(item.id, {
                                intentos: ni,
                                ultimo_error: error.message
                            });
                        }
                        failedCount += procesar.length;
                        console.warn(`⚠ Batch insert fallo en ${tabla} (${procesar.length} items): ${error.message}`);
                    }
                } catch (err) {
                    for (const item of procesar) {
                        const ni = (item.intentos || 0) + 1;
                        await window.db.cola_sync.update(item.id, {
                            intentos: ni,
                            ultimo_error: err.message
                        }).catch(() => {});
                    }
                    failedCount += procesar.length;
                    console.error(`Error batch insert ${tabla}:`, err);
                }
            }

            // ── Operaciones individuales (update, upsert, delete) ──
            for (const item of others) {
                try {
                    if ((item.intentos || 0) >= this.MAX_RETRIES) {
                        console.warn(`✗ Abandonando item ${item.id} (${item.accion} en ${item.tabla}): superó ${this.MAX_RETRIES} intentos`);
                        await window.db.cola_sync.delete(item.id);
                        abandonedCount++;
                        continue;
                    }

                    const datos = JSON.parse(item.datos);
                    let success  = false;
                    let errorMsg = '';

                    switch (item.accion) {
                        case 'update': {
                            const { error } = await window.supabaseClient
                                .from(item.tabla)
                                .update(datos.changes || datos)
                                .eq('id', datos.id);
                            success  = !error;
                            errorMsg = error?.message || '';
                            break;
                        }
                        case 'upsert': {
                            const { error } = await window.supabaseClient
                                .from(item.tabla)
                                .upsert(datos);
                            success  = !error;
                            errorMsg = error?.message || '';
                            break;
                        }
                        case 'delete': {
                            const { error } = await window.supabaseClient
                                .from(item.tabla)
                                .delete()
                                .eq('id', datos.id);
                            success  = !error;
                            errorMsg = error?.message || '';
                            break;
                        }
                    }

                    if (success) {
                        await window.db.cola_sync.delete(item.id);
                        syncedCount++;
                        console.log(`✓ Sincronizado: ${item.accion} en ${item.tabla}`);
                    } else {
                        const ni = (item.intentos || 0) + 1;
                        await window.db.cola_sync.update(item.id, {
                            intentos: ni,
                            ultimo_error: errorMsg
                        });
                        failedCount++;
                        console.warn(`⚠ Fallo sync (intento ${ni}/${this.MAX_RETRIES}): ${item.accion} en ${item.tabla} - ${errorMsg}`);
                    }

                } catch (err) {
                    console.error(`Error sincronizando item ${item.id}:`, err);
                    const ni = (item.intentos || 0) + 1;
                    await window.db.cola_sync.update(item.id, {
                        intentos: ni,
                        ultimo_error: err.message
                    }).catch(() => {});
                    failedCount++;
                }
            }

            if (syncedCount > 0 || abandonedCount > 0) {
                console.log(`Sync completado: ${syncedCount} exitosos, ${failedCount} fallidos, ${abandonedCount} abandonados`);
            }

        } catch (err) {
            console.error('Error en sincronización:', err);
        }

        this.isSyncing = false;
    },

    // ═══════════════════════════════════════════════════════════
    // ESTADO DE SINCRONIZACIÓN
    // ═══════════════════════════════════════════════════════════
    async getStatus() {
        try {
            const pendientes = await window.db.cola_sync.count();
            return {
                online: navigator.onLine,
                pendientes,
                syncing: this.isSyncing
            };
        } catch (err) {
            return { online: navigator.onLine, pendientes: 0, syncing: false };
        }
    },

    // ═══════════════════════════════════════════════════════════
    // LIMPIAR COLA
    // ═══════════════════════════════════════════════════════════
    async clearQueue() {
        try {
            await window.db.cola_sync.clear();
            console.log('✓ Cola de sincronización limpiada');
        } catch (err) {
            console.error('Error limpiando cola:', err);
        }
    }
};

// Exponer globalmente
window.SyncManager = SyncManager;
