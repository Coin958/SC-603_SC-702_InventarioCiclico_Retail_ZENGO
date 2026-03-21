// ═══════════════════════════════════════════════════════════════
// ZENGO - Controlador de Administración
// Gestiona carga de datos, reportes y operaciones administrativas
// ═══════════════════════════════════════════════════════════════

const AdminController = {

    // ═══════════════════════════════════════════════════════════
    // IMPORTAR ARCHIVO NETSUITE
    // ═══════════════════════════════════════════════════════════
    async handleNetsuiteImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const extension = file.name.split('.').pop().toLowerCase();
        if (!['xlsx', 'xls', 'csv'].includes(extension)) {
            window.ZENGO?.toast('Formato no válido. Usa Excel o CSV', 'error');
            return;
        }

        window.ZENGO?.toast('Procesando archivo...', 'info');

        try {
            const result = await window.InventoryModel.processFile(file);
            const sync = result.syncResult || { supabaseOk: false, dexieOk: false };

            if (sync.supabaseOk && sync.dexieOk) {
                window.ZENGO?.toast('Base de datos cargada correctamente y sincronizada', 'success', 5000);
            } else if (sync.dexieOk && !sync.supabaseOk) {
                window.ZENGO?.toast('Guardado local OK. Pendiente sincronizar con Supabase', 'warning', 5000);
            } else {
                window.ZENGO?.toast('Error al guardar los productos', 'error');
            }

            this.showImportSummary(result);

            if (typeof window.AdminView !== 'undefined') {
                window.AdminView.refreshData?.();
            }

        } catch (error) {
            console.error('Error importando:', error);
            window.ZENGO?.toast('Error al procesar archivo: ' + error, 'error');
        }

        event.target.value = '';
    },

    // ═══════════════════════════════════════════════════════════
    // MOSTRAR RESUMEN DE IMPORTACIÓN
    // ═══════════════════════════════════════════════════════════
    showImportSummary(result) {
        const { items, stats, categories, syncResult } = result;
        const sync = syncResult || { supabaseOk: false, dexieOk: false, supabaseCount: 0, dexieCount: 0 };
        const existenciaTotal = items.reduce((acc, p) => acc + (p.existencia || 0), 0);

        // Categorías ordenadas por volumen descendente
        const catsSorted = [...categories].sort((a, b) => b[1] - a[1]);

        const catCards = catsSorted.map(([nombre, count]) => {
            const pct = ((count / stats.total) * 100).toFixed(1);
            return `
                <div style="background:#1c2023;padding:18px;border-radius:12px;">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;">
                        <div>
                            <p style="font-weight:700;color:#e2e6eb;margin:0 0 3px;font-size:13px;">${nombre}</p>
                            <p style="color:#a8abb0;font-size:11px;margin:0;">${count} productos</p>
                        </div>
                        <span style="background:rgba(200,16,46,.12);color:#C8102E;font-size:10px;font-weight:700;padding:3px 8px;border-radius:6px;white-space:nowrap;">${pct}%</span>
                    </div>
                    <div style="width:100%;background:#111416;height:3px;border-radius:4px;overflow:hidden;">
                        <div style="background:#C8102E;height:100%;width:${pct}%;border-radius:4px;"></div>
                    </div>
                </div>`;
        }).join('');

        // Colores dinámicos según estado
        const dc = sync.dexieOk    ? '#C8102E' : '#fa746f';
        const sc = sync.supabaseOk ? '#C8102E' : '#f59e0b';
        const dbg = sync.dexieOk    ? 'rgba(200,16,46,.07)' : 'rgba(250,116,111,.07)';
        const sbg = sync.supabaseOk ? 'rgba(200,16,46,.07)' : 'rgba(245,158,11,.07)';
        const dbd = sync.dexieOk    ? 'rgba(200,16,46,.15)' : 'rgba(250,116,111,.15)';
        const sbd = sync.supabaseOk ? 'rgba(200,16,46,.15)' : 'rgba(245,158,11,.15)';

        const dexieTxt = sync.dexieOk
            ? `${sync.dexieCount} productos guardados`
            : (sync.dexieError || 'Error al guardar');
        const supTxt = sync.supabaseOk
            ? `${sync.supabaseCount} productos sincronizados`
            : 'Pendiente de sincronizar';

        const modal = document.createElement('div');
        modal.className = 'zengo-import-summary';
        modal.style.cssText = 'position:fixed;inset:0;z-index:10000;display:flex;align-items:stretch;justify-content:center;background:rgba(12,14,16,.97);overflow:hidden;font-family:Inter,sans-serif;';

        modal.innerHTML = `
            <main style="display:flex;flex-direction:column;width:100%;max-width:1100px;margin:0 auto;padding:44px 48px 0;overflow:hidden;">

                <!-- Header -->
                <header style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:36px;gap:24px;">
                    <div>
                        <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
                            <i class="fas fa-cloud-upload-alt" style="color:#C8102E;font-size:26px;"></i>
                            <h1 style="font-family:'Manrope','Nunito',sans-serif;font-size:clamp(22px,3vw,34px);font-weight:800;color:#e2e6eb;margin:0;letter-spacing:-.5px;">Importación Completada</h1>
                        </div>
                        <p style="color:#a8abb0;font-size:14px;margin:0;">Los datos han sido procesados y catalogados en el sistema ZENGO.</p>
                    </div>
                    <div style="display:flex;gap:10px;flex-shrink:0;">
                        <button onclick="this.closest('.zengo-import-summary').remove()"
                            style="padding:9px 20px;border-radius:10px;background:#22262a;color:#e2e6eb;font-weight:600;border:1px solid rgba(68,72,77,.5);cursor:pointer;font-size:13px;">
                            Cerrar
                        </button>
                        <button onclick="AdminController.verDashboard();this.closest('.zengo-import-summary').remove()"
                            style="padding:9px 20px;border-radius:10px;background:linear-gradient(135deg,#C8102E,#8B0A20);color:#fff;font-weight:700;border:none;cursor:pointer;font-size:13px;box-shadow:0 4px 20px rgba(200,16,46,.15);">
                            Ver Dashboard
                        </button>
                    </div>
                </header>

                <!-- KPI Bento Grid -->
                <section style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:28px;">
                    <div style="background:#171a1d;padding:22px 24px;border-radius:14px;">
                        <span style="color:#a8abb0;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">Total productos</span>
                        <div style="margin-top:12px;">
                            <span style="font-family:'Manrope','Nunito',sans-serif;font-size:clamp(28px,3.5vw,44px);font-weight:900;color:#C8102E;">${stats.total.toLocaleString()}</span>
                        </div>
                    </div>
                    <div style="background:#171a1d;padding:22px 24px;border-radius:14px;">
                        <span style="color:#a8abb0;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">Categorías</span>
                        <div style="margin-top:12px;">
                            <span style="font-family:'Manrope','Nunito',sans-serif;font-size:clamp(28px,3.5vw,44px);font-weight:900;color:#e2e6eb;">${stats.categories}</span>
                        </div>
                    </div>
                    <div style="background:#171a1d;padding:22px 24px;border-radius:14px;">
                        <span style="color:#a8abb0;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">Existencia total</span>
                        <div style="margin-top:12px;display:flex;align-items:baseline;gap:6px;">
                            <span style="font-family:'Manrope','Nunito',sans-serif;font-size:clamp(28px,3.5vw,44px);font-weight:900;color:#e2e6eb;">${existenciaTotal.toLocaleString()}</span>
                            <span style="color:#a8abb0;font-size:12px;">uds</span>
                        </div>
                    </div>
                    <div style="background:#171a1d;padding:22px 24px;border-radius:14px;">
                        <span style="color:#a8abb0;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">Valor inventario</span>
                        <div style="margin-top:12px;">
                            <span style="font-family:'Manrope','Nunito',sans-serif;font-size:clamp(16px,2vw,24px);font-weight:900;color:#C8102E;display:block;line-height:1.2;">₡${stats.totalValue.toLocaleString()}</span>
                            <span style="color:#a8abb0;font-size:10px;margin-top:3px;display:block;">Valor estimado</span>
                        </div>
                    </div>
                </section>

                <!-- Category Breakdown -->
                <section style="flex:1;min-height:0;display:flex;flex-direction:column;">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
                        <h2 style="font-family:'Manrope','Nunito',sans-serif;font-size:15px;font-weight:700;color:#e2e6eb;margin:0;display:flex;align-items:center;gap:8px;">
                            <i class="fas fa-chart-bar" style="color:#C8102E;"></i>
                            Desglose por Categoría
                        </h2>
                        <span style="color:#a8abb0;font-size:10px;">Ordenado por volumen</span>
                    </div>
                    <div style="flex:1;overflow-y:auto;padding-right:6px;margin-right:-6px;scrollbar-width:thin;scrollbar-color:#22262a transparent;">
                        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;padding-bottom:20px;">
                            ${catCards}
                        </div>
                    </div>
                </section>

                <!-- Footer Status -->
                <footer style="padding:16px 0;border-top:1px solid rgba(68,72,77,.2);display:flex;align-items:center;gap:10px;flex-shrink:0;">
                    <div style="display:flex;align-items:center;gap:10px;padding:8px 14px;background:${dbg};border-radius:8px;border:1px solid ${dbd};">
                        <span style="width:7px;height:7px;border-radius:50%;background:${dc};box-shadow:0 0 8px ${dc};flex-shrink:0;"></span>
                        <div>
                            <span style="font-size:11px;color:#e2e6eb;font-weight:500;display:block;">Dexie (local)</span>
                            <span style="font-size:10px;color:${dc};display:block;">${dexieTxt}</span>
                        </div>
                    </div>
                    <div style="display:flex;align-items:center;gap:10px;padding:8px 14px;background:${sbg};border-radius:8px;border:1px solid ${sbd};">
                        <span style="width:7px;height:7px;border-radius:50%;background:${sc};box-shadow:0 0 8px ${sc};flex-shrink:0;"></span>
                        <div>
                            <span style="font-size:11px;color:#e2e6eb;font-weight:500;display:block;">Supabase</span>
                            <span style="font-size:10px;color:${sc};display:block;">${supTxt}</span>
                        </div>
                    </div>
                </footer>

            </main>
            <div style="position:fixed;top:0;right:0;width:500px;height:500px;background:radial-gradient(circle,rgba(200,16,46,.04) 0%,transparent 70%);pointer-events:none;"></div>
            <div style="position:fixed;bottom:0;left:0;width:400px;height:400px;background:radial-gradient(circle,rgba(249,135,135,.04) 0%,transparent 70%);pointer-events:none;"></div>
        `;

        document.body.appendChild(modal);
    },

    injectModalStyles() { /* estilos ahora son inline en showImportSummary */ },

    verDashboard() {
        window.AdminView?.showSection?.('dashboard');
    },

    // ═══════════════════════════════════════════════════════════
    // EXPORTAR DIFERENCIAS
    // FIX: Usa 'existencia' (campo real en Supabase/Dexie)
    //      en vez de 'stock_sistema' que no existe
    // ═══════════════════════════════════════════════════════════
    async exportDiferencias() {
        try {
            const conteos = await window.db.conteos_realizados.toArray();
            const productos = await window.db.productos.toArray();

            const productosMap = new Map(productos.map(p => [p.upc, p]));

            const diferencias = conteos.map(c => {
                const prod = productosMap.get(c.upc) || {};
                const existenciaSistema = prod.existencia || 0;
                const cantidadContada = c.cantidad || 0;
                return {
                    UPC: c.upc,
                    SKU: prod.sku || '',
                    Descripcion: prod.descripcion || '',
                    Categoria: prod.categoria || '',
                    'Stock Sistema': existenciaSistema,
                    'Conteo Físico': cantidadContada,
                    Diferencia: cantidadContada - existenciaSistema,
                    Ubicacion: c.ubicacion || '',
                    Fecha: new Date(c.timestamp).toLocaleString('es-CR')
                };
            });

            const ws = XLSX.utils.json_to_sheet(diferencias);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Diferencias');

            XLSX.writeFile(wb, `ZENGO_Diferencias_${new Date().toISOString().split('T')[0]}.xlsx`);

            window.ZENGO?.toast('Reporte exportado', 'success');

        } catch (err) {
            console.error('Error exportando:', err);
            window.ZENGO?.toast('Error al exportar', 'error');
        }
    },

    // ═══════════════════════════════════════════════════════════
    // CRUD DE USUARIOS (delega a AuthModel)
    // ═══════════════════════════════════════════════════════════
    async crearUsuario(userData) {
        try {
            const nuevoUsuario = await window.AuthModel.addUser(userData);
            window.ZENGO?.toast('Usuario creado exitosamente', 'success');
            return nuevoUsuario;
        } catch (err) {
            console.error('Error creando usuario:', err);
            window.ZENGO?.toast('Error al crear usuario: ' + err.message, 'error');
            return null;
        }
    },

    async actualizarUsuario(userId, userData) {
        try {
            const usuario = await window.AuthModel.updateUser(userId, userData);
            window.ZENGO?.toast('Usuario actualizado', 'success');
            return usuario;
        } catch (err) {
            console.error('Error actualizando usuario:', err);
            window.ZENGO?.toast('Error al actualizar: ' + err.message, 'error');
            return null;
        }
    },

    async eliminarUsuario(userId) {
        try {
            const confirmado = await window.ZENGO?.confirm(
                '¿Estás seguro de desactivar este usuario?',
                'Confirmar desactivación'
            );

            if (!confirmado) return false;

            await window.AuthModel.deleteUser(userId);
            window.ZENGO?.toast('Usuario desactivado', 'success');
            return true;
        } catch (err) {
            console.error('Error eliminando usuario:', err);
            window.ZENGO?.toast('Error al desactivar: ' + err.message, 'error');
            return false;
        }
    },

    // ═══════════════════════════════════════════════════════════
    // EXPORTAR CÍCLICO CONFIRMADO A EXCEL
    // ═══════════════════════════════════════════════════════════
    async exportarCiclico(tarea) {
        if (!tarea) { window.ZENGO?.toast('No hay cíclico seleccionado', 'error'); return; }
        try {
            const productos = tarea.productos || [];
            const rows = productos.map((p, i) => {
                const total = p.total ?? (p.conteos?.reduce((s, c) => s + (c.cantidad || 0), 0) ?? 0);
                const diferencia = total - (p.existencia || 0);
                const ubicaciones = p.conteos?.length
                    ? [...new Set(p.conteos.map(c => c.ubicacion).filter(Boolean))].join(', ')
                    : '';
                return {
                    'N°': i + 1,
                    'UPC': p.upc || '',
                    'SKU / NetSuite': p.sku || '',
                    'Descripción': p.descripcion || '',
                    'Categoría': p.categoria || tarea.categoria || '',
                    'Precio': p.precio || 0,
                    'Existencia Sistema': p.existencia || 0,
                    'Total Contado': total,
                    'Diferencia': diferencia,
                    'Ubicación': ubicaciones,
                    'Hallazgo': p.hallazgo_estado || '',
                    'Estado': tarea.estado || ''
                };
            });

            const ws = XLSX.utils.json_to_sheet(rows);
            const wb = XLSX.utils.book_new();
            const fecha = (tarea.fecha_aprobacion || new Date().toISOString()).split('T')[0];
            const nombre = `${tarea.categoria || 'Ciclico'}_${fecha}`.replace(/[^a-zA-Z0-9_-]/g, '_');
            XLSX.utils.book_append_sheet(wb, ws, nombre.substring(0, 31));
            XLSX.writeFile(wb, `ZENGO_Ciclico_${nombre}.xlsx`);

            window.ZENGO?.toast('Exportado correctamente', 'success');
        } catch (err) {
            console.error('Error exportando cíclico:', err);
            window.ZENGO?.toast('Error al exportar', 'error');
        }
    },

    async obtenerLogs() {
        return await window.LogController.obtenerTodos({ limite: 200 });
    },

    async cerrarCicloDiario() {
        try {
            // 1. Limpiar Supabase primero
            if (navigator.onLine && window.supabaseClient) {
                const { error: errorConteos } = await window.supabaseClient
                    .from('conteos_realizados')
                    .delete()
                    .not('id', 'is', null);

                if (errorConteos) throw errorConteos;

                const { error: errorHallazgos } = await window.supabaseClient
                    .from('hallazgos')
                    .delete()
                    .not('id', 'is', null);

                if (errorHallazgos) throw errorHallazgos;

                const { error: errorTareas } = await window.supabaseClient
                    .from('tareas')
                    .delete()
                    .neq('id', '');

                if (errorTareas) throw errorTareas;

                const { error: errorProductos } = await window.supabaseClient
                    .from('productos')
                    .delete()
                    .neq('id', 0);

                if (errorProductos) throw errorProductos;
            }

            // 2. Limpiar Dexie/local
            if (window.db) {
                if (window.db.conteos_realizados)    await window.db.conteos_realizados.clear();
                if (window.db.hallazgos)             await window.db.hallazgos.clear();
                if (window.db.tareas)                await window.db.tareas.clear();
                if (window.db.productos)             await window.db.productos.clear();
                if (window.db.cola_sync)             await window.db.cola_sync.clear();
                if (window.db.ubicaciones_historico) await window.db.ubicaciones_historico.clear();
            }

            return { ok: true };
        } catch (error) {
            console.error('Error cerrando ciclo diario:', error);
            return { ok: false, error: error.message || 'Error al cerrar ciclo diario' };
        }
    },

};

// Exponer globalmente
window.AdminController = AdminController;