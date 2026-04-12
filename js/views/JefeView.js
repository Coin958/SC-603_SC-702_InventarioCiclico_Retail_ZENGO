// ═══════════════════════════════════════════════════════════════
// ZENGO - JefeView v1.7.0
// Solo lógica + HTML — CSS en archivos separados
// Revisión con tabla Excel CRUD + hallazgos en JSON de tarea
// ═══════════════════════════════════════════════════════════════

const JefeView = {

    asignacionActual: { categoriaId: null, categoriaNombre: null, categoriaProductos: 0, auxiliarId: null, auxiliarNombre: null },
    revisionActual: null,

    // ═══ RENDER ═══
    render(container) {
        const session = JSON.parse(localStorage.getItem('zengo_session') || '{}');
        container.innerHTML = `
        <div class="dashboard-wrapper jefe-theme">
            <aside id="sidebar" class="sidebar glass">
                <div class="sidebar-header">
                    <div class="logo">ZEN<span>GO</span></div>
                    <span class="badge-boss">JEFE</span>
                    <button class="toggle-btn" onclick="JefeView.toggleSidebar()"><i class="fas fa-bars"></i></button>
                </div>
                <div class="user-card">
                    <div class="user-avatar jefe"><i class="fas fa-user-tie"></i></div>
                    <div class="user-info"><span class="user-name">${session.name || 'Jefe'}</span><span class="user-role">JEFATURA</span></div>
                </div>
                <nav class="sidebar-nav">
                    <a href="#" class="nav-item active" data-section="mando" onclick="JefeView.showSection('mando')"><i class="fas fa-satellite-dish"></i><span>Consola Central</span></a>
                    <a href="#" class="nav-item" data-section="hallazgos" onclick="JefeView.showSection('hallazgos')"><i class="fas fa-exclamation-triangle"></i><span>Hallazgos</span><span class="badge-alert" id="hallazgos-count">0</span></a>
                    <a href="#" class="nav-item" data-section="revisar" onclick="JefeView.showSection('revisar')"><i class="fas fa-clipboard-check"></i><span>Revisar Ciclicos</span></a>
                    <a href="#" class="nav-item" data-section="devueltos" onclick="JefeView.showSection('devueltos')"><i class="fas fa-undo"></i><span>Devueltos</span><span class="badge-alert" id="devueltos-jefe-count" style="display:none;">0</span></a>
                    <a href="#" class="nav-item" data-section="consulta" onclick="JefeView.showSection('consulta')"><i class="fas fa-search"></i><span>Modo Consulta</span></a>
                    <div class="nav-spacer"></div>
                    <a href="#" class="nav-item theme-toggle" onclick="JefeView.toggleTheme()"><i class="fas fa-moon"></i><span>Modo Oscuro</span></a>
                    <a href="#" class="nav-item logout" onclick="AuthController.logout()"><i class="fas fa-power-off"></i><span>Cerrar Turno</span></a>
                </nav>
            </aside>
            <main class="main-content">
                <header class="top-header glass">
                    <div class="header-left"><button class="mobile-menu" onclick="JefeView.toggleSidebar()"><i class="fas fa-bars"></i></button><div><h1>Panel de <span class="accent-purple">Jefatura</span></h1><p class="text-dim">Control de Cíclicos</p></div></div>
                    <div class="header-stats"><div class="sync-badge online"><div class="dot"></div><span>ONLINE</span></div><button class="btn-refresh" onclick="JefeView.refreshAll()"><i class="fas fa-sync-alt"></i></button></div>
                </header>

                <!-- MANDO CENTRAL -->
                <div id="section-mando" class="section-content">
                    <section class="metrics-grid" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px;">
                        <div class="metric-card glass">
                            <div class="metric-header"><i class="fas fa-boxes" style="color:#7C3AED;"></i></div>
                            <span class="metric-value" id="jefe-existencia-total">0</span>
                            <span class="metric-label">Existencia Total</span>
                        </div>
                        <div class="metric-card glass">
                            <div class="metric-header"><i class="fas fa-arrow-up" style="color:#10b981;"></i></div>
                            <span class="metric-value text-success" id="jefe-diff-positivo">0</span>
                            <span class="metric-label">Diferencia (+)</span>
                        </div>
                        <div class="metric-card glass">
                            <div class="metric-header"><i class="fas fa-arrow-down" style="color:#ef4444;"></i></div>
                            <span class="metric-value text-error" id="jefe-diff-negativo">0</span>
                            <span class="metric-label">Diferencia (-)</span>
                        </div>
                        <div class="metric-card glass">
                            <div class="metric-header"><i class="fas fa-exclamation-triangle" style="color:#f59e0b;"></i></div>
                            <span class="metric-value" id="hallazgos-pendientes" style="color:#f59e0b;">0</span>
                            <span class="metric-label">Hallazgos</span>
                        </div>
                    </section>

                    <section class="ranking-section glass">
                        <div class="section-header">
                            <h3><i class="fas fa-medal"></i> Ranking de Precisión</h3>
                            <button class="btn-refresh" onclick="JefeView.loadRanking()"><i class="fas fa-sync-alt"></i></button>
                        </div>
                        <div id="jefe-ranking-wrap">
                            <div class="empty-state"><i class="fas fa-medal"></i><p>Cargando ranking...</p></div>
                        </div>
                    </section>

                    <section>
                        <div class="section-header"><h2><i class="fas fa-tasks"></i> Asignar Categoria a Auxiliar</h2></div>
                        <div class="asignar-grid">
                            <div class="asignar-card glass"><h4><i class="fas fa-folder"></i> 1. Categoria</h4><div class="categorias-asignar" id="categorias-disponibles"></div></div>
                            <div class="asignar-card glass"><h4><i class="fas fa-user"></i> 2. Auxiliar</h4><div class="auxiliares-list" id="auxiliares-disponibles"></div></div>
                            <div class="asignar-card glass wide"><h4><i class="fas fa-clipboard-check"></i> 3. Confirmar</h4><div class="asignar-resumen" id="asignar-resumen"><div class="resumen-empty"><p>Selecciona categoria y auxiliar</p></div></div><div class="asignar-actions"><button class="btn-secondary" onclick="JefeView.limpiarAsignacion()"><i class="fas fa-eraser"></i> Limpiar</button><button class="btn-primary" id="btn-confirmar" onclick="JefeView.confirmarAsignacion()" disabled><i class="fas fa-paper-plane"></i> Asignar</button></div></div>
                        </div>
                    </section>
                    <section class="monitor-section">
                        <div class="section-header">
                            <h3><i class="fas fa-satellite-dish"></i> Monitor de Cíclicos Activos</h3>
                            <button class="btn-refresh" onclick="JefeView.loadMonitorMando()"><i class="fas fa-sync-alt"></i></button>
                        </div>
                        <div class="monitor-grid" id="monitor-grid">
                            <div class="empty-state"><i class="fas fa-satellite-dish"></i><p>Cargando...</p></div>
                        </div>
                    </section>
                </div>

                <!-- HALLAZGOS -->
                <div id="section-hallazgos" class="section-content" style="display:none;">
                    <section><div class="section-header"><h2><i class="fas fa-exclamation-triangle"></i> Hallazgos Pendientes</h2></div><div class="hallazgos-list glass" id="hallazgos-list"><div class="empty-state"><p>Sin hallazgos</p></div></div></section>
                </div>

                <!-- LISTA CICLICOS -->
                <div id="section-revisar" class="section-content" style="display:none;">
                    <section><div class="section-header"><h2><i class="fas fa-clipboard-check"></i> Ciclicos por Revisar</h2></div><div class="ciclicos-list glass" id="ciclicos-revisar"><div class="empty-state"><p>Sin ciclicos</p></div></div></section>
                </div>

                <!-- REVISION DETALLE (tabla Excel) -->
                <div id="section-revision-detalle" class="section-content" style="display:none;">
                    <section class="revision-header-section glass">
                        <div class="section-header"><h2><i class="fas fa-clipboard-check"></i> <span id="revision-titulo">Revision</span></h2><button class="btn-secondary" onclick="JefeView.cerrarRevision()"><i class="fas fa-arrow-left"></i> Volver</button></div>
                        <div class="revision-actions-top"><button class="btn-hallazgo-jefe" onclick="JefeView.agregarHallazgoJefe()"><i class="fas fa-plus"></i> Agregar Hallazgo</button></div>
                    </section>
                    <section class="search-section glass">
                        <div class="search-bar"><input type="text" id="revision-buscar" placeholder="Buscar por UPC, SKU o descripcion..." onkeyup="JefeView.filtrarProductosRevision(this.value)"><button class="btn-scan" onclick="JefeView.abrirScannerRevision()"><i class="fas fa-camera"></i></button></div>
                    </section>
                    <section class="tabla-section glass"><div class="tabla-scroll"><table class="tabla-ciclico"><thead><tr>
                        <th class="col-num">#</th><th class="col-upc">UPC</th><th class="col-sku">SKU</th>
                        <th class="col-desc">DESCRIPCION</th><th class="col-precio">PRECIO</th>
                        <th class="col-existencia">EXISTENCIA</th><th class="col-cantidad">CANTIDAD</th>
                        <th class="col-ubicacion">UBICACION</th><th class="col-total">TOTAL</th>
                        <th class="col-diferencia">DIFERENCIA</th><th class="col-acciones">+</th>
                    </tr></thead><tbody id="revision-tbody"></tbody></table></div></section>
                    <div class="revision-footer"><button class="btn-entregar" onclick="JefeView.entregarAAdmin()"><i class="fas fa-paper-plane"></i> Entregar a Administracion</button></div>
                </div>

                <!-- DEVUELTOS POR ADMIN -->
                <div id="section-devueltos" class="section-content" style="display:none;">
                    <section>
                        <div class="section-header">
                            <h2><i class="fas fa-undo"></i> Cíclicos Devueltos por Admin</h2>
                        </div>
                        <div class="ciclicos-list glass" id="devueltos-jefe-list">
                            <div class="empty-state"><p>Sin cíclicos devueltos</p></div>
                        </div>
                    </section>
                </div>

                <!-- MODO CONSULTA -->
                <div id="section-consulta" class="section-content" style="display:none;">
                    <section class="consulta-v2-wrap">
                        <div class="consulta-v2-searchbar glass">
                            <input type="text" id="jefe-consulta-input" placeholder="Buscar por descripcion, UPC o SKU..." onkeyup="if(event.key==='Enter')JefeView.ejecutarConsulta()">
                            <button class="btn-consultar" style="background:var(--purple)" onclick="JefeView.ejecutarConsulta()">Consultar</button>
                        </div>
                        <div class="consulta-v2-body">
                            <div class="consulta-v2-camera glass">
                                <div class="consulta-v2-cam-header">
                                    <span><i class="fas fa-camera"></i> Escaner</span>
                                    <span class="consulta-activo-badge">Activo</span>
                                </div>
                                <div class="consulta-v2-video-wrap">
                                    <div id="jefe-consulta-video"></div>
                                    <div class="consulta-scan-line"></div>
                                </div>
                                <div class="consulta-v2-status" id="jefe-consulta-status">
                                    <i class="fas fa-barcode"></i> Apunta al codigo de barras
                                </div>
                            </div>
                            <div class="consulta-v2-resultado glass" id="jefe-consulta-resultado">
                                <div class="empty-state"><i class="fas fa-search"></i><p>Busca un producto por descripcion, UPC o SKU</p></div>
                            </div>
                        </div>
                    </section>
                </div>

            </main>
        </div>
        ${this.renderModals()}`;
        this.injectStyles();
        this.loadDashboardData();
    },

    // SYNC DE TAREAS
    async syncTareasFromSupabase() {
        try {
            if (!navigator.onLine || !window.supabaseClient) return;

            const { data, error } = await window.supabaseClient
                .from('tareas')
                .select('*');

            if (error || !data) return;

            const remotas = data || [];
            const remoteIds = new Set(remotas.map(t => String(t.id)));

            // 1. Borrar tareas locales que ya no existen en Supabase
            const locales = await window.db.tareas.toArray();
            for (const local of locales) {
                if (!remoteIds.has(String(local.id))) {
                    await window.db.tareas.delete(local.id);
                }
            }

            // 2. Insertar / actualizar tareas remotas
            for (const remota of remotas) {
                const local = await window.db.tareas.get(remota.id);

                if (!local) {
                    await window.db.tareas.put(remota);
                } else {
                    const localContados = local.productos_contados || 0;
                    const remotaContados = remota.productos_contados || 0;
                    const localHallazgos = (local.productos || []).filter(p => p.es_hallazgo).length;
                    const remotaHallazgos = (remota.productos || []).filter(p => p.es_hallazgo).length;

                    if (remotaContados > localContados || remotaHallazgos > localHallazgos) {
                        await window.db.tareas.put(remota);
                    } else if (remotaContados === localContados && remotaHallazgos === localHallazgos) {
                        const remotaAprobados = (remota.productos || [])
                            .filter(p => p.es_hallazgo && p.hallazgo_estado !== 'pendiente').length;

                        const localAprobados = (local.productos || [])
                            .filter(p => p.es_hallazgo && p.hallazgo_estado !== 'pendiente').length;

                        if (remotaAprobados >= localAprobados) {
                            await window.db.tareas.put(remota);
                        }
                    }
                }
            }
        } catch (e) {
            console.warn('Sync tareas fallido:', e);
        }
    },

    async syncTareaToSupabase(tarea) {
        try {
            if (!navigator.onLine || !window.supabaseClient) return false;
            const payload = {
                productos: tarea.productos,
                productos_contados: tarea.productos_contados,
                estado: tarea.estado,
                aprobado_por: tarea.aprobado_por || null,
                fecha_aprobacion: tarea.fecha_aprobacion || null,
                motivo_jefe: tarea.motivo_jefe || null,
                devuelto_por_jefe: tarea.devuelto_por_jefe || null,
                fecha_devuelto_jefe: tarea.fecha_devuelto_jefe || null
            };
            const { error } = await window.supabaseClient.from('tareas').update(payload).eq('id', tarea.id);
            return !error;
        } catch (e) { return false; }
    },

    // ═══ SYNC PRODUCTOS ═══
    async syncProductosFromSupabase() {
        try {
            if (!navigator.onLine || !window.supabaseClient) return;

            const { data, error } = await window.supabaseClient
                .from('productos')
                .select('*');

            if (error || !data) {
                console.warn('Error cargando productos desde Supabase:', error);
                return;
            }

            // Reemplazar Dexie local con copia actualizada desde Supabase
            await window.db.productos.clear();
            await window.db.productos.bulkPut(data);

            console.log(`✓ Productos sincronizados: ${data.length}`);
        } catch (e) {
            console.warn('Sync productos fallido:', e);
        }
    },

    // ═══ DATOS ═══
    async loadDashboardData() {
        await this.syncProductosFromSupabase();
        await this.syncTareasFromSupabase();
        await this.loadCategorias();
        await this.loadTareas();
        await this.loadHallazgos();
        await this.loadAuxiliares();
        await this.loadCiclicosParaRevisar();
        await this.loadMonitorMando();
        await this.loadExistenciaMetrics();
        await this.loadRanking();
    },

    async refreshAll() {
        window.ZENGO?.toast('Actualizando...', 'info');
        await this.loadDashboardData();
        window.ZENGO?.toast('Actualizado', 'success');
    },

    async getTareasActivas() {
        const estadosBloqueantes = [
            'pendiente',
            'en_progreso',
            'finalizado_auxiliar',
            'aprobado_jefe',
            'devuelto_admin',
            'devuelto_jefe'
        ];

        return (await window.db.tareas.toArray())
            .filter(t => estadosBloqueantes.includes(t.estado));
    },

    async loadCategorias() {
        const dc = document.getElementById('categorias-disponibles');
        try {
            const productos = await window.db.productos.toArray();
            if (!productos.length) {
                if (dc) dc.innerHTML = '<div class="empty-state"><i class="fas fa-database"></i><p>No hay productos</p><small>El admin debe cargar el Excel</small></div>';
                return;
            }
            const categorias = new Map();
            productos.forEach(p => {
                const cat = p.categoria || 'GENERAL';
                if (!categorias.has(cat)) categorias.set(cat, { nombre: cat, productos: [], existencia: 0 });
                categorias.get(cat).productos.push(p);
                categorias.get(cat).existencia += p.existencia || 0;
            });
            const arr = Array.from(categorias.values()).sort((a, b) => b.productos.length - a.productos.length);
            const elCat = document.getElementById('total-categorias'); if (elCat) elCat.textContent = arr.length;

            const activas = await this.getTareasActivas();
            const asignadas = new Set(activas.map(t => t.categoria));

            if (dc) {
                dc.innerHTML = arr.length
                    ? arr.map(c => {
                        const isAsignada = asignadas.has(c.nombre);
                        return `<div class="categoria-item${isAsignada ? ' cat-asignada' : ''}" data-id="${c.nombre}" ${!isAsignada ? `onclick="JefeView.selectCategoria('${c.nombre}', ${c.productos.length})"` : ''}>
                            <div class="cat-info"><strong>${c.nombre}</strong><small>${c.productos.length} productos · ${c.existencia.toLocaleString()} uds</small></div>
                            ${isAsignada ? '<span class="pill-asignada">Asignada</span>' : '<i class="fas fa-chevron-right"></i>'}
                        </div>`;
                    }).join('')
                    : '<div class="empty-state small"><p>Sin categorías</p></div>';
            }
        } catch (err) {
            console.error('loadCategorias:', err);
        }
    },
    async loadAuxiliares() {
        const auxs = await window.AuthModel?.getAuxiliares() || [];
        const elAux = document.getElementById('auxiliares-count'); if (elAux) elAux.textContent = auxs.length;
        const c = document.getElementById('auxiliares-disponibles');
        c.innerHTML = auxs.length
            ? auxs.map(a => `<div class="auxiliar-item" data-id="${a.id}" onclick="JefeView.selectAuxiliar(${a.id}, '${a.nombre}')"><div class="aux-avatar">${a.nombre.charAt(0)}</div><div class="aux-info"><strong>${a.nombre} ${a.apellido || ''}</strong><small>${a.email}</small></div><i class="fas fa-chevron-right"></i></div>`).join('')
            : '<div class="empty-state small"><p>Sin auxiliares</p></div>';
    },

    async loadTareas() {
        const activas = await this.getTareasActivas();
        const counter = document.getElementById('ciclicos-activos');
        if (counter) counter.textContent = activas.length;
    },

    async loadExistenciaMetrics() {
        try {
            const productos = await window.db.productos.toArray();
            // Incluir TODAS las tareas (no sólo activas) excepto canceladas
            // para que los KPIs acumulen diferencias de cíclicos entregados/aprobados
            const todasTareas = (await window.db.tareas.toArray()).filter(t => t.estado !== 'cancelado');
            // Existencia total
            const existTotal = productos.reduce((s, p) => s + (p.existencia || 0), 0);
            const elExist = document.getElementById('jefe-existencia-total');
            if (elExist) elExist.textContent = existTotal.toLocaleString();
            // Diferencias positivas y negativas desde conteos de tareas
            let diffPos = 0, diffNeg = 0;
            todasTareas.forEach(t => {
                (t.productos || []).forEach(p => {
                    if (p.conteos && p.conteos.length > 0 && !p.es_hallazgo) {
                        const dif = (p.total || 0) - (p.existencia || 0);
                        if (dif > 0) diffPos += dif;
                        else if (dif < 0) diffNeg += Math.abs(dif);
                    }
                });
            });
            const elPos = document.getElementById('jefe-diff-positivo');
            if (elPos) elPos.textContent = diffPos.toLocaleString();
            const elNeg = document.getElementById('jefe-diff-negativo');
            if (elNeg) elNeg.textContent = diffNeg.toLocaleString();
        } catch (e) { console.error('loadExistenciaMetrics:', e); }
    },

    // ═══ HALLAZGOS (desde JSON de tareas) ═══
    async loadHallazgos() {
        const todasTareas = (await window.db.tareas.toArray()).filter(t => t.estado !== 'cancelado');
        // Para la lista de pendientes: solo tareas donde el jefe aún puede actuar
        const estadosAccionables = ['en_progreso', 'finalizado_auxiliar', 'devuelto_admin', 'devuelto_jefe'];
        const pend = [];
        let totalHallazgos = 0;
        todasTareas.forEach(t => {
            (t.productos || []).forEach((p, i) => {
                if (p.es_hallazgo) {
                    totalHallazgos++; // KPI acumulado: nunca baja
                    if (p.hallazgo_estado === 'pendiente' && estadosAccionables.includes(t.estado))
                        pend.push({ ...p, tarea_id: t.id, tarea_cat: t.categoria, idx: i, auxiliar_nombre: t.auxiliar_nombre });
                }
            });
        });
        // Badge sidebar = pendientes (atención); KPI = total acumulado (nunca baja)
        const badgeEl = document.getElementById('hallazgos-count');
        if (badgeEl) badgeEl.textContent = pend.length;
        const kpiEl = document.getElementById('hallazgos-pendientes');
        if (kpiEl) kpiEl.textContent = totalHallazgos;
        const c = document.getElementById('hallazgos-list');
        c.innerHTML = pend.length
            ? pend.map(h => `<div class="hallazgo-row"><div class="hallazgo-info"><code>${h.upc}</code><span>${h.descripcion || 'Sin desc'}</span><small>${h.tarea_cat} — <span class="pill-badge celeste">${h.hallazgo_reportado_por || 'Aux'}</span></small></div><div class="hallazgo-actions"><button class="btn-approve" onclick="JefeView.aprobarHallazgo('${h.tarea_id}',${h.idx})"><i class="fas fa-check"></i> Aprobar</button><button class="btn-reject" onclick="JefeView.rechazarHallazgo('${h.tarea_id}',${h.idx})"><i class="fas fa-times"></i> Rechazar</button></div></div>`).join('')
            : '<div class="empty-state"><i class="fas fa-check-circle"></i><p>Sin hallazgos pendientes</p></div>';
    },

    async pedirPrecioHallazgo(descripcion, cantidad) {
        return new Promise(resolve => {
            // Crear modal de precio inline
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;';
            overlay.innerHTML = `
                <div class="modal-box glass" style="max-width:400px;width:90%;padding:24px;border-radius:16px;">
                    <h3 style="margin:0 0 8px;color:#7C3AED;"><i class="fas fa-tag"></i> Precio del Hallazgo</h3>
                    <p style="margin:0 0 16px;font-size:13px;opacity:0.8;">${descripcion || 'Producto'} · ${cantidad} ud(s)</p>
                    <label style="display:block;font-size:12px;margin-bottom:6px;opacity:0.7;">Precio unitario (₡)</label>
                    <input id="hallazgo-precio-input" type="number" min="0" step="1" placeholder="Ej: 15000"
                        style="width:100%;padding:10px 14px;border-radius:8px;border:1px solid rgba(124,58,237,0.4);background:rgba(255,255,255,0.08);color:inherit;font-size:16px;box-sizing:border-box;">
                    <div style="display:flex;gap:10px;margin-top:16px;">
                        <button id="hallazgo-precio-cancel" class="btn-secondary" style="flex:1;">Cancelar</button>
                        <button id="hallazgo-precio-ok" class="btn-primary" style="flex:2;background:#7C3AED;"><i class="fas fa-check"></i> Aprobar</button>
                    </div>
                </div>`;
            document.body.appendChild(overlay);
            const input = overlay.querySelector('#hallazgo-precio-input');
            input.focus();
            overlay.querySelector('#hallazgo-precio-cancel').onclick = () => { overlay.remove(); resolve(null); };
            overlay.querySelector('#hallazgo-precio-ok').onclick = () => {
                const val = parseFloat(input.value) || 0;
                overlay.remove();
                resolve(val);
            };
            input.addEventListener('keydown', e => {
                if (e.key === 'Enter') { const val = parseFloat(input.value) || 0; overlay.remove(); resolve(val); }
                if (e.key === 'Escape') { overlay.remove(); resolve(null); }
            });
        });
    },

    async aprobarHallazgo(tid, pi) {
        const t = await window.db.tareas.get(tid);
        if (!t) return;
        const hallazgo = t.productos[pi];
        const cantidad = hallazgo.total || hallazgo.cantidad || 0;

        // Pedir precio antes de aprobar
        const precio = await this.pedirPrecioHallazgo(hallazgo.descripcion || hallazgo.upc, cantidad);
        if (precio === null) return; // usuario canceló

        const s = JSON.parse(localStorage.getItem('zengo_session') || '{}');
        const hallazgoAntes = JSON.parse(JSON.stringify(hallazgo));

        t.productos[pi].hallazgo_estado = 'aprobado';
        t.productos[pi].hallazgo_aprobado_por = s.name;
        t.productos[pi].hallazgo_aprobado_color = 'purpura';
        t.productos[pi].precio = precio;
        t.productos[pi].precio_hallazgo = precio;  // Se mantiene para historial y logs
        t.productos[pi].valor_hallazgo = precio * cantidad; // para KPI Admin

        await window.db.tareas.put(t);
        await this.syncTareaToSupabase(t);

        try {
            await window.LogController?.registrar({
                tabla: 'hallazgos',
                accion: 'HALLAZGO_APROBADO',
                registro_id: `${tid}_${pi}`,
                usuario_id: s.id || null,
                usuario_nombre: s.name || 'Jefe',
                datos_anteriores: {
                    upc: hallazgoAntes.upc,
                    descripcion: hallazgoAntes.descripcion,
                    cantidad: hallazgoAntes.total || hallazgoAntes.cantidad || 0,
                    estado: hallazgoAntes.hallazgo_estado || 'pendiente'
                },
                datos_nuevos: {
                    upc: t.productos[pi].upc,
                    descripcion: t.productos[pi].descripcion,
                    cantidad: t.productos[pi].total || t.productos[pi].cantidad || 0,
                    estado: t.productos[pi].hallazgo_estado,
                    aprobado_por: t.productos[pi].hallazgo_aprobado_por,
                    precio_hallazgo: precio,
                    valor_hallazgo: t.productos[pi].valor_hallazgo,
                    auxiliar_nombre: t.auxiliar_nombre || t.productos[pi].hallazgo_reportado_por || 'auxiliar'
                }
            });
        } catch (err) {
            console.warn('Error log aprobacion hallazgo:', err);
        }

        window.ZENGO?.toast(
            `Hallazgo aprobado ✓ · Precio unitario asignado: ₡${precio.toLocaleString()}`,
            'success'
        );
        await this.loadDashboardData();
    },

    async rechazarHallazgo(tid, pi) {
        const s = JSON.parse(localStorage.getItem('zengo_session') || '{}');
        const t = await window.db.tareas.get(tid);
        if (!t) return;

        const hallazgoAntes = JSON.parse(JSON.stringify(t.productos[pi]));

        t.productos[pi].hallazgo_estado = 'rechazado';
        t.productos[pi].hallazgo_rechazado_por = s.name;
        t.productos[pi].hallazgo_rechazado_color = 'purpura';

        await window.db.tareas.put(t);
        await this.syncTareaToSupabase(t);

        try {
            await window.LogController?.registrar({
                tabla: 'hallazgos',
                accion: 'HALLAZGO_RECHAZADO',
                registro_id: `${tid}_${pi}`,
                usuario_id: s.id || null,
                usuario_nombre: s.name || 'Jefe',
                datos_anteriores: {
                    upc: hallazgoAntes.upc,
                    descripcion: hallazgoAntes.descripcion,
                    cantidad: hallazgoAntes.total || hallazgoAntes.cantidad || 0,
                    estado: hallazgoAntes.hallazgo_estado || 'pendiente'
                },
                datos_nuevos: {
                    upc: t.productos[pi].upc,
                    descripcion: t.productos[pi].descripcion,
                    cantidad: t.productos[pi].total || t.productos[pi].cantidad || 0,
                    estado: t.productos[pi].hallazgo_estado,
                    rechazado_por: t.productos[pi].hallazgo_rechazado_por,
                    auxiliar_nombre: t.auxiliar_nombre || t.productos[pi].hallazgo_reportado_por || 'auxiliar'
                }
            });
        } catch (err) {
            console.warn('Error log rechazo hallazgo:', err);
        }

        window.ZENGO?.toast('Hallazgo rechazado', 'success');
        await this.loadDashboardData();
    },

    async loadCiclicosParaRevisar() {
        const fin = (await window.db.tareas.toArray()).filter(t => t.estado === 'finalizado_auxiliar');
        const c = document.getElementById('ciclicos-revisar');
        c.innerHTML = fin.length
            ? fin.map(t => `<div class="ciclico-row"><div class="ciclico-info"><strong>${t.categoria}</strong><small>${t.productos_total} prod - ${t.auxiliar_nombre}</small></div><button class="btn-primary" onclick="JefeView.abrirRevisionCiclico('${t.id}')"><i class="fas fa-eye"></i> Revisar</button></div>`).join('')
            : '<div class="empty-state"><p>Sin ciclicos pendientes</p></div>';
    },

    // ═══ ASIGNACION ═══
    selectCategoria(nombre, count) {
        this.asignacionActual.categoriaId = nombre;
        this.asignacionActual.categoriaNombre = nombre;
        this.asignacionActual.categoriaProductos = count;
        document.querySelectorAll('.categoria-item').forEach(el => el.classList.remove('selected'));
        document.querySelector(`.categoria-item[data-id="${nombre}"]`)?.classList.add('selected');
        this.updateResumen();
    },

    selectAuxiliar(id, nombre) {
        this.asignacionActual.auxiliarId = id;
        this.asignacionActual.auxiliarNombre = nombre;
        document.querySelectorAll('.auxiliar-item').forEach(el => el.classList.remove('selected'));
        document.querySelector(`.auxiliar-item[data-id="${id}"]`)?.classList.add('selected');
        this.updateResumen();
    },

    updateResumen() {
        const { categoriaNombre: cn, categoriaProductos: cp, auxiliarId: ai, auxiliarNombre: an } = this.asignacionActual;
        const c = document.getElementById('asignar-resumen');
        const b = document.getElementById('btn-confirmar');
        if (cn && ai) {
            c.innerHTML = `<div class="resumen-preview"><div class="resumen-item"><i class="fas fa-folder"></i><div><strong>${cn}</strong><small>${cp} productos</small></div></div><i class="fas fa-arrow-right"></i><div class="resumen-item"><i class="fas fa-user"></i><div><strong>${an}</strong><small>Auxiliar</small></div></div></div>`;
            b.disabled = false;
        } else {
            c.innerHTML = '<div class="resumen-empty"><p>Selecciona categoria y auxiliar</p></div>';
            b.disabled = true;
        }
    },

    async confirmarAsignacion() {
        const { categoriaId, categoriaNombre, auxiliarId, auxiliarNombre } = this.asignacionActual;
        if (!categoriaId || !auxiliarId) return;
        // Solo bloquear si el auxiliar tiene una tarea en estado NO terminal
        const ESTADOS_TERMINALES = ['aprobado_jefe', 'completado', 'cancelado'];
        const todasTareas = await window.db.tareas.toArray();
        const tareaActiva = todasTareas.find(t =>
            t.auxiliar_id === auxiliarId && !ESTADOS_TERMINALES.includes(t.estado)
        );
        if (tareaActiva) {
            window.ZENGO?.toast(`${auxiliarNombre} ya tiene una tarea activa (${tareaActiva.categoria})`, 'error');
            return;
        }
        const productos = await window.InventoryModel.getProductosPorCategoria(categoriaId);
        const tarea = {
            id: 'tarea_' + Date.now(),
            categoria: categoriaNombre,
            auxiliar_id: auxiliarId,
            auxiliar_nombre: auxiliarNombre,
            productos_total: productos.length,
            productos_contados: 0,
            estado: 'pendiente',
            fecha_asignacion: new Date().toISOString(),
            productos: productos.map(p => ({
                upc: p.upc, sku: p.sku, descripcion: p.descripcion,
                existencia: p.existencia, precio: p.precio,
                conteos: [], total: 0, diferencia: 0,
                es_hallazgo: false, hallazgo_estado: null, modificaciones: []
            }))
        };
        let ok = false;
        try {
            if (navigator.onLine && window.supabaseClient) {
                const { error } = await window.supabaseClient.from('tareas').insert(tarea);
                ok = !error;
            }
        } catch (e) { }
        await window.db.tareas.put(tarea);

        try {
            const s = JSON.parse(localStorage.getItem('zengo_session') || '{}');
            await window.LogController?.registrar({
                tabla: 'tareas',
                accion: 'TAREA_ASIGNADA',
                registro_id: tarea.id,
                usuario_id: s.id || null,
                usuario_nombre: s.name || 'Jefe',
                datos_nuevos: {
                    categoria: categoriaNombre,
                    auxiliar_nombre: auxiliarNombre,
                    productos_total: productos.length
                }
            });
        } catch (e) { console.warn('Error log asignacion:', e); }

        window.ZENGO?.toast(`✓ ${categoriaNombre} → ${auxiliarNombre}`, ok ? 'success' : 'warning');
        this.limpiarAsignacion();
        await this.loadDashboardData();
        this.showSection('mando');
    },

    limpiarAsignacion() {
        this.asignacionActual = { categoriaId: null, categoriaNombre: null, categoriaProductos: 0, auxiliarId: null, auxiliarNombre: null };
        document.querySelectorAll('.categoria-item, .auxiliar-item').forEach(el => el.classList.remove('selected'));
        this.updateResumen();
    },

    async cancelarTarea(tid) {
        if (!await window.ZENGO?.confirm('¿Cancelar esta tarea?', 'Confirmar')) return;
        const tarea = await window.db.tareas.get(tid);
        try { if (navigator.onLine && window.supabaseClient) await window.supabaseClient.from('tareas').update({ estado: 'cancelado' }).eq('id', tid); } catch (e) { }
        await window.db.tareas.update(tid, { estado: 'cancelado' });

        try {
            const s = JSON.parse(localStorage.getItem('zengo_session') || '{}');
            await window.LogController?.registrar({
                tabla: 'tareas',
                accion: 'TAREA_CANCELADA',
                registro_id: tid,
                usuario_id: s.id || null,
                usuario_nombre: s.name || 'Jefe',
                datos_nuevos: {
                    categoria: tarea?.categoria || '—',
                    auxiliar_nombre: tarea?.auxiliar_nombre || '—',
                    estado_anterior: tarea?.estado || '—'
                }
            });
        } catch (e) { console.warn('Error log cancelar tarea:', e); }

        window.ZENGO?.toast('Cancelada', 'success');
        await this.loadDashboardData();
    },

    // ═══ REVISION CICLICO (tabla Excel con CRUD) ═══
    async abrirRevisionCiclico(tareaId) {
        await this.syncTareasFromSupabase();
        const tarea = await window.db.tareas.get(tareaId);
        if (!tarea) { window.ZENGO?.toast('No encontrada', 'error'); return; }
        this.revisionActual = tarea;
        document.getElementById('revision-titulo').textContent = `Revision: ${tarea.categoria} — ${tarea.auxiliar_nombre}`;
        document.querySelectorAll('.section-content').forEach(s => s.style.display = 'none');
        document.getElementById('section-revision-detalle').style.display = 'block';
        this.renderRevision();
    },

    renderRevision(filtro = '') {
        if (!this.revisionActual) return;
        const tbody = document.getElementById('revision-tbody');
        const allProds = this.revisionActual.productos || [];

        // Construir lista con índice real para que los botones siempre apunten al array original
        let items = allProds.map((p, i) => ({ p, realIdx: i }));
        if (filtro) {
            const f = filtro.toUpperCase();
            items = items.filter(({ p }) =>
                (p.upc || '').includes(f) || (p.sku || '').toUpperCase().includes(f) ||
                (p.descripcion || '').toUpperCase().includes(f)
            );
        }

        if (!items.length) { tbody.innerHTML = '<tr><td colspan="11" class="empty-cell">No hay productos</td></tr>'; return; }

        tbody.innerHTML = items.map(({ p, realIdx }, displayIdx) => {
            const esH = p.es_hallazgo || false;
            const comp = p.conteos && p.conteos.length > 0;
            const tot = p.total || 0;
            const dif = tot - (p.existencia || 0);

            let badges = '';
            if (esH) {
                badges += '<span class="pill-badge amarillo">HALLAZGO</span>';
                if (p.hallazgo_reportado_por) badges += `<span class="pill-badge celeste">${p.hallazgo_reportado_por}</span>`;
                if (p.hallazgo_aprobado_por) badges += `<span class="pill-badge purpura">✓ ${p.hallazgo_aprobado_por}</span>`;
            }
            if (p.modificaciones && p.modificaciones.length) {
                const nombres = [...new Set(p.modificaciones.map(m => m.nombre))];
                nombres.forEach(n => { badges += `<span class="pill-badge purpura">${n}</span>`; });
            }

            let cantH = '<span class="sin-conteo">—</span>';
            if (comp) cantH = p.conteos.map((c, ci) => `<div class="conteo-inline"><span class="conteo-cant">${c.cantidad}</span><button class="btn-edit-mini" onclick="JefeView.editarConteoRevision(${realIdx},${ci})"><i class="fas fa-pen"></i></button><button class="btn-del-mini" onclick="JefeView.eliminarConteoRevision(${realIdx},${ci})"><i class="fas fa-times"></i></button></div>`).join('');

            let ubicH = '<span class="sin-conteo">—</span>';
            if (comp) ubicH = p.conteos.map(c => `<div class="ubic-inline">${c.ubicacion}</div>`).join('');

            let dc = '';
            if (comp) { if (dif < 0) dc = 'diff-falta'; else if (dif > 0) dc = 'diff-sobra'; else dc = 'diff-cero'; }
            let rc = esH ? 'row-hallazgo-aprobado' : (comp ? 'row-completo' : '');

            return `<tr class="${rc}" data-idx="${realIdx}">
                <td class="col-num">${displayIdx + 1}</td>
                <td class="col-upc"><code>${p.upc || '—'}</code></td>
                <td class="col-sku">${p.sku || '—'}</td>
                <td class="col-desc">${p.descripcion || '—'} ${badges}</td>
                <td class="col-precio">${p.precio ? '₡' + p.precio.toLocaleString() : '—'}</td>
                <td class="col-existencia">${p.existencia || 0}</td>
                <td class="col-cantidad">${cantH}</td>
                <td class="col-ubicacion">${ubicH}</td>
                <td class="col-total"><strong>${tot}</strong></td>
                <td class="col-diferencia ${dc}"><strong>${comp ? dif : '—'}</strong></td>
                <td class="col-acciones"><button class="btn-add-conteo" onclick="JefeView.agregarConteoRevision(${realIdx})"><i class="fas fa-plus"></i></button></td>
            </tr>`;
        }).join('');
    },

    async agregarConteoRevision(idx) {
        const s = JSON.parse(localStorage.getItem('zengo_session') || '{}');

        const cantidad = prompt('Cantidad:');
        if (cantidad === null) return;

        const ubicacion = prompt('Ubicación:');
        if (!ubicacion) return;

        const p = this.revisionActual.productos[idx];
        const antes = JSON.parse(JSON.stringify(p));

        if (!p.conteos) p.conteos = [];

        p.conteos.push({
            cantidad: parseInt(cantidad) || 0,
            ubicacion: ubicacion.toUpperCase(),
            timestamp: new Date().toISOString()
        });

        p.total = p.conteos.reduce((suma, c) => suma + c.cantidad, 0);
        p.diferencia = p.total - (p.existencia || 0);

        if (!p.modificaciones) p.modificaciones = [];
        p.modificaciones.push({
            nombre: s.name,
            color: 'purpura',
            fecha: new Date().toISOString(),
            accion: 'conteo_agregado_revision'
        });

        await this.guardarRevision();

        try {
            await window.LogController?.registrar({
                tabla: 'conteos_realizados',
                accion: 'CONTEO_AGREGADO_REVISION',
                registro_id: `${this.revisionActual.id}_${idx}`,
                usuario_id: s.id || null,
                usuario_nombre: s.name || 'Jefe',
                datos_anteriores: {
                    upc: antes.upc,
                    total: antes.total || 0,
                    conteos: antes.conteos || []
                },
                datos_nuevos: {
                    upc: p.upc,
                    total: p.total || 0,
                    conteos: p.conteos || []
                }
            });
        } catch (err) {
            console.warn('Error log agregar conteo revision:', err);
        }

        this.renderRevisionProductos();
        window.ZENGO?.toast('Conteo agregado en revisión ✓', 'success');
    },

    async editarConteoRevision(pi, ci) {
        const s = JSON.parse(localStorage.getItem('zengo_session') || '{}');

        const p = this.revisionActual.productos[pi];
        const antes = JSON.parse(JSON.stringify(p));

        const nuevo = prompt(
            `Editar cantidad (${p.conteos[ci].ubicacion}):`,
            p.conteos[ci].cantidad
        );

        if (nuevo === null) return;

        p.conteos[ci].cantidad = parseInt(nuevo) || 0;

        p.total = p.conteos.reduce((suma, c) => suma + c.cantidad, 0);
        p.diferencia = p.total - (p.existencia || 0);

        if (!p.modificaciones) p.modificaciones = [];
        p.modificaciones.push({
            nombre: s.name,
            color: 'purpura',
            fecha: new Date().toISOString(),
            accion: 'conteo_editado_revision'
        });

        await this.guardarRevision();

        try {
            await window.LogController?.registrar({
                tabla: 'conteos_realizados',
                accion: 'CONTEO_EDITADO_REVISION',
                registro_id: `${this.revisionActual.id}_${pi}_${ci}`,
                usuario_id: s.id || null,
                usuario_nombre: s.name || 'Jefe',
                datos_anteriores: {
                    upc: antes.upc,
                    total: antes.total || 0,
                    conteos: antes.conteos || []
                },
                datos_nuevos: {
                    upc: p.upc,
                    total: p.total || 0,
                    conteos: p.conteos || []
                }
            });
        } catch (err) {
            console.warn('Error log editar conteo revision:', err);
        }

        this.renderRevisionProductos();
        window.ZENGO?.toast('Conteo editado ✓', 'success');
    },

    async eliminarConteoRevision(pi, ci) {
        const confirmado = await window.ZENGO?.confirm('¿Eliminar conteo?', 'Confirmar');
        if (!confirmado) return;

        const s = JSON.parse(localStorage.getItem('zengo_session') || '{}');

        const p = this.revisionActual.productos[pi];
        const antes = JSON.parse(JSON.stringify(p));

        p.conteos.splice(ci, 1);

        p.total = p.conteos.reduce((suma, c) => suma + c.cantidad, 0);
        p.diferencia = p.total - (p.existencia || 0);

        if (!p.modificaciones) p.modificaciones = [];
        p.modificaciones.push({
            nombre: s.name,
            color: 'purpura',
            fecha: new Date().toISOString(),
            accion: 'conteo_eliminado_revision'
        });

        await this.guardarRevision();

        try {
            await window.LogController?.registrar({
                tabla: 'conteos_realizados',
                accion: 'CONTEO_ELIMINADO_REVISION',
                registro_id: `${this.revisionActual.id}_${pi}_${ci}`,
                usuario_id: s.id || null,
                usuario_nombre: s.name || 'Jefe',
                datos_anteriores: {
                    upc: antes.upc,
                    total: antes.total || 0,
                    conteos: antes.conteos || []
                },
                datos_nuevos: {
                    upc: p.upc,
                    total: p.total || 0,
                    conteos: p.conteos || []
                }
            });
        } catch (err) {
            console.warn('Error log eliminar conteo revision:', err);
        }

        this.renderRevisionProductos();
        window.ZENGO?.toast('Conteo eliminado', 'success');
    },

    async agregarHallazgoJefe() {
        const upc = prompt('UPC del hallazgo:');
        if (!upc) return;

        const desc = prompt('Descripcion:', '') || 'Hallazgo Jefe';
        const cant = prompt('Cantidad:', '0');
        const ubic = prompt('Ubicacion:', '') || 'SIN UBICACION';
        const s = JSON.parse(localStorage.getItem('zengo_session') || '{}');
        const cantidad = parseInt(cant) || 0;

        this.revisionActual.productos.push({
            upc,
            sku: '',
            descripcion: desc,
            existencia: 0,
            precio: 0,
            conteos: [{ cantidad, ubicacion: ubic.toUpperCase(), timestamp: new Date().toISOString() }],
            total: cantidad,
            diferencia: cantidad,
            es_hallazgo: true,
            hallazgo_estado: 'aprobado',
            hallazgo_reportado_por: s.name,
            hallazgo_reportado_color: 'purpura',
            hallazgo_aprobado_por: s.name,
            hallazgo_aprobado_color: 'purpura',
            hallazgo_fecha: new Date().toISOString(),
            modificaciones: [{ nombre: s.name, color: 'purpura', fecha: new Date().toISOString(), accion: 'hallazgo_jefe' }]
        });

        await this.guardarRevision();

        const nuevo = this.revisionActual.productos[this.revisionActual.productos.length - 1];

        try {
            await window.LogController?.registrar({
                tabla: 'hallazgos',
                accion: 'HALLAZGO_AGREGADO_JEFE',
                registro_id: `${this.revisionActual.id}_${this.revisionActual.productos.length - 1}`,
                usuario_id: s.id || null,
                usuario_nombre: s.name || 'Jefe',
                datos_nuevos: {
                    upc: nuevo.upc,
                    descripcion: nuevo.descripcion,
                    cantidad: nuevo.total || 0,
                    ubicacion: nuevo.conteos?.[0]?.ubicacion || '',
                    estado: nuevo.hallazgo_estado
                }
            });
        } catch (err) {
            console.warn('Error log hallazgo jefe:', err);
        }

        window.ZENGO?.toast('Hallazgo agregado ✓', 'success');
    },

    async guardarRevision() {
        await window.db.tareas.put(this.revisionActual);
        await this.syncTareaToSupabase(this.revisionActual);
        this.renderRevision();
    },

    async entregarAAdmin() {
        if (!await window.ZENGO?.confirm('¿Confirmar entrega a Administración?\n\nLos datos no podrán modificarse tras la confirmación.', 'Confirmar entrega')) return;
        const s = JSON.parse(localStorage.getItem('zengo_session') || '{}');
        this.revisionActual.estado = 'aprobado_jefe';
        this.revisionActual.aprobado_por = s.name;
        this.revisionActual.fecha_aprobacion = new Date().toISOString();
        // Guardar ubicaciones canónicas (upsert por UPC) antes de cerrar
        await window.LocationModel.guardarUbicacionesTarea(this.revisionActual);
        await window.db.tareas.put(this.revisionActual);
        await this.syncTareaToSupabase(this.revisionActual);
        // Actualizar ranking del auxiliar (datos permanentes)
        await this.calcularYGuardarEstadisticas(this.revisionActual);

        try {
            const tEntregada = this.revisionActual;
            const contados = (tEntregada.productos || []).filter(p => p.conteos && p.conteos.length > 0).length;
            await window.LogController?.registrar({
                tabla: 'tareas',
                accion: 'TAREA_APROBADA',
                registro_id: tEntregada.id,
                usuario_id: s.id || null,
                usuario_nombre: s.name || 'Jefe',
                datos_nuevos: {
                    categoria: tEntregada.categoria,
                    auxiliar_nombre: tEntregada.auxiliar_nombre,
                    productos_contados: contados,
                    productos_total: tEntregada.productos_total || (tEntregada.productos || []).length
                }
            });
        } catch (e) { console.warn('Error log entrega admin:', e); }

        window.ZENGO?.toast('Entregado a Administracion ✓', 'success');
        this.revisionActual = null;
        this.showSection('mando');
        await this.loadDashboardData();
    },

    // ═══ RANKING — Cálculo de Precisión Absoluta y Neta ═══
    async calcularYGuardarEstadisticas(tarea) {
        try {
            let totalExist = 0, totalDiff = 0, totalFalt = 0;

            (tarea.productos || []).forEach(p => {
                if (p.conteos && p.conteos.length > 0) {
                    const exist = p.existencia || 0;
                    const dif = (p.total || 0) - exist;
                    totalExist += exist;
                    totalDiff += Math.abs(dif);
                    if (dif < 0) totalFalt += Math.abs(dif);
                }
            });

            // PA: penaliza sobrantes y faltantes · PN: solo penaliza faltantes (merma)
            const pa = totalExist > 0 ? Math.max(0, (1 - totalDiff / totalExist) * 100) : 100;
            const pn = totalExist > 0 ? Math.max(0, (1 - totalFalt / totalExist) * 100) : 100;

            const auxId = tarea.auxiliar_id;
            const auxNombre = tarea.auxiliar_nombre || 'Desconocido';

            // Leer registro existente (promedio acumulado)
            const prev = await window.db.estadisticas_auxiliares.get(auxId);
            const total = (prev?.total_ciclicos || 0) + 1;
            const sumaPA = (prev?.suma_pa || 0) + pa;
            const sumaPN = (prev?.suma_pn || 0) + pn;
            const promPA = parseFloat((sumaPA / total).toFixed(2));
            const promPN = parseFloat((sumaPN / total).toFixed(2));
            const score = parseFloat(((promPA + promPN) / 2).toFixed(2));

            const stats = {
                auxiliar_id: auxId,
                auxiliar_nombre: auxNombre,
                total_ciclicos: total,
                suma_pa: parseFloat(sumaPA.toFixed(4)),
                suma_pn: parseFloat(sumaPN.toFixed(4)),
                promedio_pa: promPA,
                promedio_pn: promPN,
                score_ranking: score,
                ultima_actualizacion: new Date().toISOString()
            };

            // Guardar en Dexie (permanente)
            await window.db.estadisticas_auxiliares.put(stats);

            // Sincronizar a Supabase
            if (navigator.onLine && window.supabaseClient) {
                await window.supabaseClient
                    .from('estadisticas_auxiliares')
                    .upsert(stats, { onConflict: 'auxiliar_id' });
            }

            console.log(`✓ Ranking actualizado: ${auxNombre} | PA:${promPA}% PN:${promPN}% Score:${score}%`);
        } catch (e) {
            console.error('Error calcularYGuardarEstadisticas:', e);
        }
    },

    // ═══ DEVUELTOS POR ADMIN ═══
    async loadDevueltosJefe() {
        await this.syncTareasFromSupabase();
        const tareas = await window.db.tareas.toArray();
        const devueltas = tareas.filter(t => t.estado === 'devuelto_admin');
        const badge = document.getElementById('devueltos-jefe-count');
        if (badge) { badge.textContent = devueltas.length; badge.style.display = devueltas.length ? '' : 'none'; }
        const el = document.getElementById('devueltos-jefe-list');
        if (!el) return;
        if (!devueltas.length) {
            el.innerHTML = '<div class="empty-state"><i class="fas fa-check-circle"></i><p>Sin cíclicos devueltos</p></div>';
            return;
        }
        el.innerHTML = devueltas.map(t => `
            <div class="ciclico-row" style="flex-direction:column;align-items:flex-start;gap:10px;padding:16px;">
                <div class="ciclico-info">
                    <strong>${t.categoria} — ${t.auxiliar_nombre || '—'}</strong>
                    <small>Rechazado por: ${t.rechazado_por || 'Admin'} · ${t.fecha_rechazo ? new Date(t.fecha_rechazo).toLocaleString('es-CR') : '—'}</small>
                    ${t.motivo_rechazo ? `<small style="color:#ef4444"><i class="fas fa-comment-alt"></i> ${t.motivo_rechazo}</small>` : ''}
                </div>
                <button class="btn-primary" onclick="JefeView.devolverAlAuxiliar('${t.id}')">
                    <i class="fas fa-undo"></i> Devolver al Auxiliar
                </button>
            </div>`).join('');
    },

    async devolverAlAuxiliar(tareaId) {
        const motivo = prompt('Instrucción para el auxiliar (requerido):');
        if (!motivo || !motivo.trim()) return;
        const session = JSON.parse(localStorage.getItem('zengo_session') || '{}');
        const tarea = await window.db.tareas.get(tareaId);
        if (!tarea) { window.ZENGO?.toast('Tarea no encontrada', 'error'); return; }
        tarea.estado = 'devuelto_jefe';
        tarea.motivo_jefe = motivo.trim();
        tarea.devuelto_por_jefe = session.name || 'Jefe';
        tarea.fecha_devuelto_jefe = new Date().toISOString();
        await window.db.tareas.put(tarea);
        await this.syncTareaToSupabase(tarea);

        try {
            await window.LogController?.registrar({
                tabla: 'tareas',
                accion: 'TAREA_RECHAZADA',
                registro_id: tarea.id,
                usuario_id: session.id || null,
                usuario_nombre: session.name || 'Jefe',
                datos_nuevos: {
                    categoria: tarea.categoria,
                    auxiliar_nombre: tarea.auxiliar_nombre,
                    motivo_rechazo: motivo.trim(),
                    productos_total: tarea.productos_total || (tarea.productos || []).length
                }
            });
        } catch (e) { console.warn('Error log devolver auxiliar:', e); }

        window.ZENGO?.toast('Devuelto al Auxiliar ✓', 'success');
        await this.loadDevueltosJefe();
    },

    cerrarRevision() { this.revisionActual = null; this.showSection('revisar'); },

    filtrarProductosRevision(v) { this.renderRevision(v); },

    abrirScannerRevision() {
        if (!this.revisionActual || !this.revisionActual.productos) {
            window.ZENGO?.toast('No hay revision activa', 'error');
            return;
        }
        ScannerController.abrirScannerCiclico(
            this.revisionActual.productos,
            (idx) => {
                // Encontrado: limpiar búsqueda, mostrar tabla completa y resaltar fila
                const input = document.getElementById('revision-buscar');
                if (input) input.value = '';
                this.renderRevision('');

                const isLight = document.body.classList.contains('light-mode');
                const bgColor = isLight ? '#93c5fd' : 'rgba(37,99,235,0.55)';
                const textColor = isLight ? '#1e3a8a' : '';

                const row = document.querySelector(`#revision-tbody tr[data-idx="${idx}"]`);
                if (row) {
                    row.style.boxShadow = 'inset 4px 0 0 #2563EB';
                    row.querySelectorAll('td').forEach(td => {
                        td.style.background = bgColor;
                        if (textColor) td.style.color = textColor;
                    });
                    row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            },
            (code) => {
                window.ZENGO?.toast(`UPC ${code} no pertenece a este ciclico`, 'warning');
            }
        );
    },

    // ═══ UI ═══
    toggleSidebar() { document.getElementById('sidebar').classList.toggle('collapsed'); },
    toggleTheme() { document.body.classList.toggle('light-mode'); },

    showSection(id) {
        if (this._monitorInterval) { clearInterval(this._monitorInterval); this._monitorInterval = null; }
        ScannerController.detenerScannerConsulta();
        document.querySelectorAll('.section-content').forEach(s => s.style.display = 'none');
        document.getElementById(`section-${id}`).style.display = 'block';
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        document.querySelector(`[data-section="${id}"]`)?.classList.add('active');
        if (id === 'mando') { this.loadMonitorMando(); this.loadRanking(); }
        if (id === 'consulta') this._iniciarScannerConsulta();
        if (id === 'hallazgos') this.loadHallazgos();
        if (id === 'revisar') this.loadCiclicosParaRevisar();
        if (id === 'devueltos') this.loadDevueltosJefe();
    },

    closeModal() { document.querySelectorAll('.modal-overlay').forEach(m => m.style.display = 'none'); },

    // ═══ MODO CONSULTA ═══
    async ejecutarConsulta() {
        const term = document.getElementById('jefe-consulta-input')?.value.trim();
        if (!term) return;
        const panel = document.getElementById('jefe-consulta-resultado');
        const resultados = await ScannerController.buscarProductos(term);
        if (!resultados.length) {
            panel.innerHTML = '<div class="empty-state"><i class="fas fa-search"></i><p>Sin resultados</p></div>';
            return;
        }
        if (resultados.length === 1) {
            const r = await ScannerController.consultarProducto(resultados[0].upc);
            if (r.encontrado) panel.innerHTML = ScannerController.renderConsultaDetalle(r.producto, r.ubicaciones);
            return;
        }
        panel.innerHTML = `<div class="consulta-lista">${resultados.map(p =>
            `<div class="consulta-lista-item" onclick="JefeView.verDetalleConsulta('${p.upc}')">
                <span class="consulta-lista-upc">${p.upc || '—'}</span>
                <span class="consulta-lista-desc">${p.descripcion || '—'}</span>
                <span class="consulta-lista-meta">₡${(p.precio || 0).toLocaleString()} · Existencia: ${p.existencia || 0}</span>
            </div>`).join('')}</div>`;
    },

    async verDetalleConsulta(upc) {
        const r = await ScannerController.consultarProducto(upc);
        const panel = document.getElementById('jefe-consulta-resultado');
        if (r.encontrado) panel.innerHTML = ScannerController.renderConsultaDetalle(r.producto, r.ubicaciones);
    },

    _iniciarScannerConsulta() {
        ScannerController.iniciarScannerConsulta('jefe-consulta-video', (code) => {
            document.getElementById('jefe-consulta-status').innerHTML =
                `<i class="fas fa-check-circle" style="color:var(--success)"></i> Detectado: <code>${code}</code>`;
            this.verDetalleConsulta(code);
        });
    },

    // ═══ MONITOR DE CÍCLICOS ACTIVOS ═══
    _monitorInterval: null,

    async loadMonitorMando() {
        await this.syncTareasFromSupabase();
        const todasTareas = await window.db.tareas.toArray();
        const activas = todasTareas.filter(t =>
            !['completado', 'cancelado', 'aprobado_jefe'].includes(t.estado)
        );

        const grid = document.getElementById('monitor-grid');
        if (!grid) return;

        if (!activas.length) {
            grid.innerHTML = '<div class="empty-state"><i class="fas fa-satellite-dish"></i><p>Sin cíclicos activos en este momento</p></div>';
            return;
        }

        grid.innerHTML = activas.map(t => this._renderMonitorCard(t)).join('');

        // Cronómetro live — tick cada segundo
        if (this._monitorInterval) clearInterval(this._monitorInterval);
        this._monitorInterval = setInterval(() => {
            activas.forEach(t => {
                if (!t.cronometro_inicio) return;
                const el = document.getElementById(`mcrono-${t.id}`);
                if (!el) return;
                const elapsed = Math.floor((Date.now() - new Date(t.cronometro_inicio).getTime()) / 1000);
                const h = String(Math.floor(elapsed / 3600)).padStart(2, '0');
                const m = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
                const s = String(elapsed % 60).padStart(2, '0');
                el.textContent = `${h}:${m}:${s}`;
            });
        }, 1000);
    },

    _renderMonitorCard(t) {
        const total = t.productos_total || (t.productos || []).length || 0;
        const contados = t.productos_contados || 0;
        const pct = total > 0 ? Math.round((contados / total) * 100) : 0;

        const estadoMap = {
            'pendiente': { label: 'Pendiente', cls: 'mc-estado-pend' },
            'en_progreso': { label: 'En Progreso', cls: 'mc-estado-prog' },
            'finalizado_auxiliar': { label: 'Listo para Revisar', cls: 'mc-estado-listo' },
            'devuelto_jefe': { label: 'Devuelto al Aux', cls: 'mc-estado-dev' },
            'devuelto_admin': { label: 'Devuelto por Admin', cls: 'mc-estado-rej' }
        };
        const estado = estadoMap[t.estado] || { label: t.estado, cls: '' };

        const barColor = pct < 30 ? '#7C3AED' : pct < 70 ? '#a78bfa' : '#22c55e';

        let cronoHtml = '—';
        if (t.cronometro_inicio) {
            const elapsed = Math.floor((Date.now() - new Date(t.cronometro_inicio).getTime()) / 1000);
            const h = String(Math.floor(elapsed / 3600)).padStart(2, '0');
            const m = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
            const s = String(elapsed % 60).padStart(2, '0');
            cronoHtml = `<span id="mcrono-${t.id}">${h}:${m}:${s}</span>`;
        }

        return `
        <div class="monitor-card glass">
            <div class="mc-header">
                <div class="mc-categoria"><i class="fas fa-folder"></i> ${t.categoria || '—'}</div>
                <span class="mc-estado ${estado.cls}">${estado.label}</span>
            </div>
            <div class="mc-aux"><i class="fas fa-user"></i> ${t.auxiliar_nombre || '—'}</div>
            <div class="mc-stats">
                <div class="mc-stat"><span class="mc-stat-lbl">Sistema</span><span class="mc-stat-val">${total}</span></div>
                <div class="mc-stat"><span class="mc-stat-lbl">Contados</span><span class="mc-stat-val">${contados}</span></div>
                <div class="mc-stat"><span class="mc-stat-lbl">Progreso</span><span class="mc-stat-val" style="color:${barColor}">${pct}%</span></div>
            </div>
            <div class="mc-progress-wrap">
                <div class="mc-progress-bg">
                    <div class="mc-progress-fill" style="width:${pct}%;background:${barColor};box-shadow:0 0 8px ${barColor}80"></div>
                </div>
            </div>
            <div class="mc-footer">
                <div class="mc-crono"><i class="fas fa-stopwatch"></i> ${cronoHtml}</div>
                <span class="mc-fecha">${t.fecha_asignacion ? new Date(t.fecha_asignacion).toLocaleDateString('es-CR') : '—'}</span>
            </div>
            <button class="mc-cancel-btn" onclick="JefeView.cancelarTarea('${t.id}')"><i class="fas fa-times"></i> Cancelar tarea</button>
        </div>`;
    },

    // ═══ RANKING ═══
    async loadRanking() {
        const el = document.getElementById('jefe-ranking-wrap');
        if (!el) return;

        // Intentar sync desde Supabase primero
        try {
            if (navigator.onLine && window.supabaseClient) {
                const { data } = await window.supabaseClient
                    .from('estadisticas_auxiliares')
                    .select('*')
                    .order('score_ranking', { ascending: false });
                if (data && data.length) {
                    for (const row of data) await window.db.estadisticas_auxiliares.put(row);
                }
            }
        } catch (e) { /* offline — usa Dexie */ }

        const stats = await window.db.estadisticas_auxiliares
            .orderBy('score_ranking').reverse().toArray();

        if (!stats.length) {
            el.innerHTML = '<div class="empty-state"><i class="fas fa-medal"></i><p>Sin datos aún — el ranking se genera al entregar cíclicos</p></div>';
            return;
        }

        const medals = ['🥇', '🥈', '🥉'];
        el.innerHTML = `
        <table class="rk-table">
            <thead><tr>
                <th>#</th><th>Auxiliar</th><th>Cíclicos</th>
                <th>Prec. Absoluta</th><th>Prec. Neta</th><th>Score</th>
            </tr></thead>
            <tbody>
                ${stats.map((s, i) => {
            const scoreColor = s.score_ranking >= 95 ? '#22c55e' : s.score_ranking >= 85 ? '#f59e0b' : '#ef4444';
            return `<tr class="${i < 3 ? 'rk-top' : ''}">
                        <td class="rk-pos">${medals[i] || (i + 1)}</td>
                        <td class="rk-name"><div class="rk-avatar">${(s.auxiliar_nombre || 'A').charAt(0).toUpperCase()}</div>${s.auxiliar_nombre || '—'}</td>
                        <td class="rk-num">${s.total_ciclicos}</td>
                        <td class="rk-num">${s.promedio_pa?.toFixed(1)}%</td>
                        <td class="rk-num">${s.promedio_pn?.toFixed(1)}%</td>
                        <td class="rk-score" style="color:${scoreColor}">${s.score_ranking?.toFixed(1)}%</td>
                    </tr>`;
        }).join('')}
            </tbody>
        </table>`;
    },

    // ═══ ESTILOS (inyectados una sola vez) ═══
    injectStyles() {
        if (document.getElementById('jefe-monitor-styles')) return;
        const style = document.createElement('style');
        style.id = 'jefe-monitor-styles';
        style.innerHTML = `
.cat-asignada { opacity: 0.45; cursor: not-allowed; pointer-events: none; }
.cat-asignada .cat-info strong { color: rgba(255,255,255,0.5); }
body.light-mode .cat-asignada .cat-info strong { color: rgba(0,0,0,0.35); }
.monitor-section { margin-top: 20px; }
.monitor-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 16px;
    margin-top: 16px;
}
.monitor-card {
    border-radius: 16px;
    padding: 20px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    display: flex;
    flex-direction: column;
    gap: 14px;
    transition: border-color 0.2s, box-shadow 0.2s;
}
.monitor-card:hover { border-color: rgba(124,58,237,0.4); box-shadow: 0 0 20px rgba(124,58,237,0.1); }
.mc-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
.mc-categoria { font-size: 0.95rem; font-weight: 700; display: flex; align-items: center; gap: 7px; }
.mc-categoria i { color: var(--purple, #7C3AED); }
.mc-estado { font-size: 0.65rem; font-weight: 700; padding: 3px 8px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.04em; white-space: nowrap; }
.mc-estado-pend  { background: rgba(100,116,139,0.2); color: #94a3b8; }
.mc-estado-prog  { background: rgba(124,58,237,0.2);  color: #a78bfa; }
.mc-estado-listo { background: rgba(34,197,94,0.2);   color: #22c55e; }
.mc-estado-dev   { background: rgba(245,158,11,0.2);  color: #f59e0b; }
.mc-estado-rej   { background: rgba(239,68,68,0.2);   color: #ef4444; }
.mc-aux { font-size: 0.82rem; color: rgba(255,255,255,0.6); display: flex; align-items: center; gap: 7px; }
.mc-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; }
.mc-stat { display: flex; flex-direction: column; gap: 2px; background: rgba(255,255,255,0.04); border-radius: 8px; padding: 8px; text-align: center; }
.mc-stat-lbl { font-size: 0.62rem; color: rgba(255,255,255,0.45); text-transform: uppercase; letter-spacing: 0.05em; }
.mc-stat-val { font-size: 1rem; font-weight: 700; }
.mc-progress-wrap { }
.mc-progress-bg { width: 100%; height: 6px; background: rgba(255,255,255,0.08); border-radius: 10px; overflow: hidden; }
.mc-progress-fill { height: 100%; border-radius: 10px; transition: width 0.6s ease; }
.mc-footer { display: flex; justify-content: space-between; align-items: center; }
.mc-crono { font-size: 0.82rem; font-weight: 600; font-family: 'JetBrains Mono', monospace; display: flex; align-items: center; gap: 6px; color: rgba(255,255,255,0.7); }
.mc-crono i { color: var(--purple, #7C3AED); }
.mc-fecha { font-size: 0.72rem; color: rgba(255,255,255,0.35); }
.mc-cancel-btn { width: 100%; padding: 6px; border-radius: 8px; border: 1px solid rgba(239,68,68,0.25); background: rgba(239,68,68,0.08); color: #ef4444; font-size: 0.72rem; cursor: pointer; transition: background 0.2s; }
.mc-cancel-btn:hover { background: rgba(239,68,68,0.2); }
/* Light mode */
body.light-mode .monitor-card { background: rgba(0,0,0,0.03); border-color: rgba(0,0,0,0.08); }
body.light-mode .mc-aux { color: rgba(0,0,0,0.55); }
body.light-mode .mc-stat { background: rgba(0,0,0,0.04); }
body.light-mode .mc-stat-lbl { color: rgba(0,0,0,0.4); }
body.light-mode .mc-crono { color: rgba(0,0,0,0.6); }
body.light-mode .mc-fecha { color: rgba(0,0,0,0.3); }
body.light-mode .mc-progress-bg { background: rgba(0,0,0,0.1); }
/* ── Ranking ── */
.ranking-section { margin-top: 24px; padding: 20px; border-radius: 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); }
.rk-table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
.rk-table thead tr { border-bottom: 1px solid rgba(255,255,255,0.08); }
.rk-table th { padding: 10px 12px; text-align: left; font-size: 0.7rem; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.05em; }
.rk-table td { padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.04); }
.rk-top td { background: rgba(124,58,237,0.06); }
.rk-pos { font-size: 1.1rem; text-align: center; width: 40px; }
.rk-name { display: flex; align-items: center; gap: 10px; font-weight: 600; }
.rk-avatar { width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg,#7C3AED,#a78bfa); display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; flex-shrink: 0; }
.rk-num { color: rgba(255,255,255,0.7); text-align: center; }
.rk-score { font-weight: 700; font-size: 1rem; text-align: center; }
body.light-mode .ranking-section { background: rgba(0,0,0,0.02); border-color: rgba(0,0,0,0.07); }
body.light-mode .rk-table th { color: rgba(0,0,0,0.4); }
body.light-mode .rk-table td { border-bottom-color: rgba(0,0,0,0.05); }
body.light-mode .rk-num { color: rgba(0,0,0,0.6); }
        `;
        document.head.appendChild(style);
    },

    renderModals() { return ''; }
};

window.JefeView = JefeView;
console.log('✓ JefeView v1.7.0 cargado');
