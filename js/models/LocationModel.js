// ═══════════════════════════════════════════════════════════════
// ZENGO - Modelo de Ubicaciones
// Gestiona historial de ubicaciones de productos
// ═══════════════════════════════════════════════════════════════

const LocationModel = {

    // ═══════════════════════════════════════════════════════════
    // OBTENER HISTORIAL DE UBICACIONES
    // ═══════════════════════════════════════════════════════════
    async getHistorial(upc) {
        try {
            const ubicaciones = await window.db.ubicaciones_historico
                .where('upc')
                .equals(upc)
                .toArray();

            // Ordenar por fecha descendente
            return ubicaciones.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        } catch (err) {
            console.error('Error obteniendo historial:', err);
            return [];
        }
    },

    // ═══════════════════════════════════════════════════════════
    // OBTENER TODAS LAS UBICACIONES ÚNICAS
    // ═══════════════════════════════════════════════════════════
    async getUbicacionesUnicas(upc) {
        try {
            const historial = await this.getHistorial(upc);
            const unicas = [...new Set(historial.map(h => h.ubicacion))];
            return unicas.filter(u => u && u.trim() !== '');
        } catch (err) {
            return [];
        }
    },

    // ═══════════════════════════════════════════════════════════
    // UPSERT CANÓNICO — UNA UBICACIÓN POR UPC
    // Sobrescribe si existe, inserta si no
    // ═══════════════════════════════════════════════════════════
    async upsertUbicacion(upc, ubicacion, auxiliarId = null) {
        try {
            const existing = await window.db.ubicaciones_historico.where('upc').equals(upc).first();
            if (existing) {
                await window.db.ubicaciones_historico.update(existing.id, {
                    ubicacion: ubicacion,
                    auxiliar_id: auxiliarId,
                    timestamp: new Date().toISOString()
                });
            } else {
                await window.db.ubicaciones_historico.add({
                    id: crypto.randomUUID(),
                    upc: upc,
                    ubicacion: ubicacion,
                    auxiliar_id: auxiliarId,
                    timestamp: new Date().toISOString()
                });
            }
            return true;
        } catch (err) {
            console.error('Error en upsert ubicación:', err);
            return false;
        }
    },

    // ═══════════════════════════════════════════════════════════
    // GUARDAR UBICACIONES DE UNA TAREA AL ENTREGAR A ADMIN
    // Lee tarea.productos[].conteos[] (embedded), el último
    // conteo con ubicación por UPC gana (sobrescribe el histórico)
    // ═══════════════════════════════════════════════════════════
    async guardarUbicacionesTarea(tarea) {
        try {
            const ubicPorUpc = {};

            // Los conteos están embedded en cada producto de la tarea
            (tarea.productos || []).forEach(prod => {
                if (!prod.upc || !prod.conteos || prod.conteos.length === 0) return;

                // Ascendente por timestamp: la última ubicación por UPC gana
                const ordenados = [...prod.conteos].sort(
                    (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
                );
                ordenados.forEach(c => {
                    if (c.ubicacion && c.ubicacion.trim()) {
                        ubicPorUpc[prod.upc] = {
                            ubicacion: c.ubicacion.trim(),
                            auxiliar_id: tarea.auxiliar_id
                        };
                    }
                });
            });

            for (const [upc, data] of Object.entries(ubicPorUpc)) {
                await this.upsertUbicacion(upc, data.ubicacion, data.auxiliar_id);
            }
            return true;
        } catch (err) {
            console.error('Error guardando ubicaciones de tarea:', err);
            return false;
        }
    },

    // NOTA: existía aquí un syncToCloud() que nadie del proyecto invocaba
    // (verificado con grep en todo el repo) — subía TODO el histórico
    // local de ubicaciones de este dispositivo, incluyendo el `id`
    // generado localmente, con upsert por `upc`. Si alguien lo hubiera
    // activado sin revisar, dos dispositivos con una fila local para el
    // mismo UPC podían pisarse el `id` entre sí. Se quitó por muerto y
    // por ese riesgo latente. Cada ubicación real ya se sincroniza al
    // vuelo vía upsertUbicacion() (usado por guardarUbicacionesTarea()).
};

// Exponer globalmente
window.LocationModel = LocationModel;
