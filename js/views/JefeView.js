// ═══════════════════════════════════════════════════════════════
// ZENGO - JefeView v1.5
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
                    <a href="#" class="nav-item active" data-section="mando" onclick="JefeView.showSection('mando')"><i class="fas fa-satellite-dish"></i><span>Mando Central</span></a>
                    <a href="#" class="nav-item" data-section="asignar" onclick="JefeView.showSection('asignar')"><i class="fas fa-tasks"></i><span>Asignar Tareas</span></a>
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
                    <section class="quick-metrics">
                        <div class="qm-card glass"><div class="qm-icon purple"><i class="fas fa-layer-group"></i></div><div class="qm-data"><span class="qm-value" id="total-categorias">0</span><span class="qm-label">Categorias</span></div></div>
                        <div class="qm-card glass"><div class="qm-icon blue"><i class="fas fa-clipboard-list"></i></div><div class="qm-data"><span class="qm-value" id="tareas-activas">0</span><span class="qm-label">Tareas Activas</span></div></div>
                        <div class="qm-card glass"><div class="qm-icon orange"><i class="fas fa-exclamation-circle"></i></div><div class="qm-data"><span class="qm-value" id="hallazgos-pendientes">0</span><span class="qm-label">Hallazgos</span></div></div>
                        <div class="qm-card glass"><div class="qm-icon green"><i class="fas fa-users"></i></div><div class="qm-data"><span class="qm-value" id="auxiliares-count">0</span><span class="qm-label">Auxiliares</span></div></div>
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

                <!-- ASIGNAR -->
                <div id="section-asignar" class="section-content" style="display:none;">
                    <section><div class="section-header"><h2><i class="fas fa-tasks"></i> Asignar Categoria a Auxiliar</h2></div>
                    <div class="asignar-grid">
                        <div class="asignar-card glass"><h4><i class="fas fa-folder"></i> 1. Categoria</h4><div class="categorias-asignar" id="categorias-disponibles"></div></div>
                        <div class="asignar-card glass"><h4><i class="fas fa-user"></i> 2. Auxiliar</h4><div class="auxiliares-list" id="auxiliares-disponibles"></div></div>
                        <div class="asignar-card glass wide"><h4><i class="fas fa-clipboard-check"></i> 3. Confirmar</h4><div class="asignar-resumen" id="asignar-resumen"><div class="resumen-empty"><p>Selecciona categoria y auxiliar</p></div></div><div class="asignar-actions"><button class="btn-secondary" onclick="JefeView.limpiarAsignacion()"><i class="fas fa-eraser"></i> Limpiar</button><button class="btn-primary" id="btn-confirmar" onclick="JefeView.confirmarAsignacion()" disabled><i class="fas fa-paper-plane"></i> Asignar</button></div></div>
                    </div></section>
                    <section class="categorias-resumen glass" style="margin-top:20px;"><div class="section-header"><h3><i class="fas fa-th-large"></i> Categorias del Inventario</h3><span class="text-dim" id="productos-total-label">0 productos</span></div><div class="categorias-grid" id="categorias-mando"><div class="loading-state"><i class="fas fa-spinner fa-spin"></i></div></div></section>
                    <section class="tareas-activas glass" style="margin-top:16px;"><div class="section-header"><h3><i class="fas fa-tasks"></i> Tareas en Progreso</h3></div><div class="tareas-list" id="tareas-list"><div class="empty-state small"><p>Sin tareas</p></div></div></section>
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

    // ═══ SYNC ═══
    async syncTareasFromSupabase() {
        try {
            if (!navigator.onLine || !window.supabaseClient) return;
            const { data, error } = await window.supabaseClient.from('tareas').select('*');
            if (error || !data) return;

            for (const remota of data) {
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
                        const remotaAprobados = (remota.productos || []).filter(p => p.es_hallazgo && p.hallazgo_estado !== 'pendiente').length;
                        const localAprobados = (local.productos || []).filter(p => p.es_hallazgo && p.hallazgo_estado !== 'pendiente').length;
                        if (remotaAprobados >= localAprobados) {
                            await window.db.tareas.put(remota);
                        }
                    }
                    // Si local tiene más progreso → no sobrescribir
                }
            }
        } catch (e) { console.warn('Sync tareas fallido:', e); }
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

    // ═══ DATOS ═══
    async loadDashboardData() {
        await this.syncTareasFromSupabase();
        await this.loadCategorias();
        await this.loadTareas();
        await this.loadHallazgos();
        await this.loadAuxiliares();
        await this.loadCiclicosParaRevisar();
        await this.loadMonitorMando();
    },

    async refreshAll() {
        window.ZENGO?.toast('Actualizando...', 'info');
        await this.loadDashboardData();
        window.ZENGO?.toast('Actualizado', 'success');
    },

    async getTareasActivas() {
        return (await window.db.tareas.toArray()).filter(t => t.estado !== 'completado' && t.estado !== 'cancelado');
    },

    async loadCategorias() {
        const mc = document.getElementById('categorias-mando');
        const dc = document.getElementById('categorias-disponibles');
        try {
            const productos = await window.db.productos.toArray();
            if (!productos.length) {
                mc.innerHTML = '<div class="empty-state"><i class="fas fa-database"></i><p>No hay productos</p><small>El admin debe cargar el Excel</small></div>';
                dc.innerHTML = mc.innerHTML;
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
            document.getElementById('total-categorias').textContent = arr.length;
            document.getElementById('productos-total-label').textContent = productos.length + ' productos';

            const activas = await this.getTareasActivas();
            const asignadas = new Set(activas.map(t => t.categoria));
            const colores = ['#C8102E', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

            mc.innerHTML = arr.map((c, i) => `
                <div class="categoria-card ${asignadas.has(c.nombre) ? 'asignada' : ''}" style="border-left: 4px solid ${colores[i % 6]}">
                    <div class="cat-header"><span class="cat-name">${c.nombre}</span>${asignadas.has(c.nombre) ? '<span class="pill-asignada">Asignada</span>' : ''}</div>
                    <div class="cat-stats"><span>${c.productos.length} productos</span><span>${c.existencia.toLocaleString()} uds</span></div>
                </div>`).join('');

            const disp = arr.filter(c => !asignadas.has(c.nombre));
            dc.innerHTML = disp.length
                ? disp.map((c, i) => `<div class="categoria-item" data-id="${c.nombre}" onclick="JefeView.selectCategoria('${c.nombre}', ${c.productos.length})" style="border-left: 4px solid ${colores[i % 6]}"><div class="cat-info"><strong>${c.nombre}</strong><small>${c.productos.length} productos</small></div><i class="fas fa-chevron-right"></i></div>`).join('')
                : '<div class="empty-state small"><p>Todas asignadas</p></div>';
        } catch (err) {
            console.error('loadCategorias:', err);
            mc.innerHTML = '<div class="empty-state"><p>Error cargando</p></div>';
        }
    },
async loadAuxiliares() {
    const auxs = await window.AuthModel?.getAuxiliares() || [];
        document.getElementById('auxiliares-count').textContent = auxs.length;
        const c = document.getElementById('auxiliares-disponibles');
        c.innerHTML = auxs.length
            ? auxs.map(a => `<div class="auxiliar-item" data-id="${a.id}" onclick="JefeView.selectAuxiliar(${a.id}, '${a.nombre}')"><div class="aux-avatar">${a.nombre.charAt(0)}</div><div class="aux-info"><strong>${a.nombre} ${a.apellido || ''}</strong><small>${a.email}</small></div><i class="fas fa-chevron-right"></i></div>`).join('')
            : '<div class="empty-state small"><p>Sin auxiliares</p></div>';
    },

    async loadTareas() {
        const activas = await this.getTareasActivas();
        document.getElementById('tareas-activas').textContent = activas.length;
        const c = document.getElementById('tareas-list');
        c.innerHTML = activas.length
            ? activas.map(t => `<div class="tarea-row"><div class="tarea-info"><strong>${t.categoria}</strong><small>${t.productos_total || 0} prod - ${t.auxiliar_nombre}</small></div><span class="status-pill ${t.estado}">${t.estado === 'en_progreso' ? 'En Progreso' : t.estado === 'finalizado_auxiliar' ? 'Por Revisar' : 'Pendiente'}</span><button class="btn-icon danger" onclick="JefeView.cancelarTarea('${t.id}')"><i class="fas fa-times"></i></button></div>`).join('')
            : '<div class="empty-state small"><p>Sin tareas activas</p></div>';
    },

    // ═══ HALLAZGOS (desde JSON de tareas) ═══
    async loadHallazgos() {
        const activas = await this.getTareasActivas();
        const pend = [];
        activas.forEach(t => {
            (t.productos || []).forEach((p, i) => {
                if (p.es_hallazgo && p.hallazgo_estado === 'pendiente')
                    pend.push({ ...p, tarea_id: t.id, tarea_cat: t.categoria, idx: i });
            });
        });
        document.getElementById('hallazgos-count').textContent = pend.length;
        document.getElementById('hallazgos-pendientes').textContent = pend.length;
        const c = document.getElementById('hallazgos-list');
        c.innerHTML = pend.length
            ? pend.map(h => `<div class="hallazgo-row"><div class="hallazgo-info"><code>${h.upc}</code><span>${h.descripcion || 'Sin desc'}</span><small>${h.tarea_cat} — <span class="pill-badge celeste">${h.hallazgo_reportado_por || 'Aux'}</span></small></div><div class="hallazgo-actions"><button class="btn-approve" onclick="JefeView.aprobarHallazgo('${h.tarea_id}',${h.idx})"><i class="fas fa-check"></i> Aprobar</button><button class="btn-reject" onclick="JefeView.rechazarHallazgo('${h.tarea_id}',${h.idx})"><i class="fas fa-times"></i> Rechazar</button></div></div>`).join('')
            : '<div class="empty-state"><i class="fas fa-check-circle"></i><p>Sin hallazgos pendientes</p></div>';
    },

    async aprobarHallazgo(tid, pi) {
        const s = JSON.parse(localStorage.getItem('zengo_session') || '{}');
        const t = await window.db.tareas.get(tid);
        if (!t) return;
        t.productos[pi].hallazgo_estado = 'aprobado';
        t.productos[pi].hallazgo_aprobado_por = s.name;
        t.productos[pi].hallazgo_aprobado_color = 'purpura';
        await window.db.tareas.put(t);
        await this.syncTareaToSupabase(t);
        window.ZENGO?.toast('Hallazgo aprobado ✓', 'success');
        await this.loadDashboardData();
    },

    async rechazarHallazgo(tid, pi) {
        const s = JSON.parse(localStorage.getItem('zengo_session') || '{}');
        const t = await window.db.tareas.get(tid);
        if (!t) return;
        t.productos[pi].hallazgo_estado = 'rechazado';
        t.productos[pi].hallazgo_rechazado_por = s.name;
        t.productos[pi].hallazgo_rechazado_color = 'purpura';
        await window.db.tareas.put(t);
        await this.syncTareaToSupabase(t);
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
        const activas = await this.getTareasActivas();
        if (activas.find(t => t.auxiliar_id === auxiliarId)) {
            window.ZENGO?.toast(`${auxiliarNombre} ya tiene tarea activa`, 'error');
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
        } catch (e) {}
        await window.db.tareas.put(tarea);
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
        try { if (navigator.onLine && window.supabaseClient) await window.supabaseClient.from('tareas').update({ estado: 'cancelado' }).eq('id', tid); } catch (e) {}
        await window.db.tareas.update(tid, { estado: 'cancelado' });
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
        const p = this.revisionActual.productos[idx];
        const cant = prompt(`Cantidad para ${p.upc}:`, '0');
        if (cant === null) return;
        const ubic = prompt('Ubicacion:', '');
        if (!ubic) return;
        const s = JSON.parse(localStorage.getItem('zengo_session') || '{}');
        if (!p.conteos) p.conteos = [];
        p.conteos.push({ cantidad: parseInt(cant) || 0, ubicacion: ubic.toUpperCase(), timestamp: new Date().toISOString() });
        p.total = p.conteos.reduce((a, c) => a + c.cantidad, 0);
        p.diferencia = p.total - p.existencia;
        if (!p.modificaciones) p.modificaciones = [];
        p.modificaciones.push({ nombre: s.name, color: 'purpura', fecha: new Date().toISOString(), accion: 'agregar_conteo' });
        await this.guardarRevision();
    },

    async editarConteoRevision(pi, ci) {
        const p = this.revisionActual.productos[pi];
        const c = p.conteos[ci];
        const nv = prompt(`Editar cantidad (${c.ubicacion}):`, c.cantidad);
        if (nv === null) return;
        const s = JSON.parse(localStorage.getItem('zengo_session') || '{}');
        p.conteos[ci].cantidad = parseInt(nv) || 0;
        p.total = p.conteos.reduce((a, x) => a + x.cantidad, 0);
        p.diferencia = p.total - p.existencia;
        if (!p.modificaciones) p.modificaciones = [];
        p.modificaciones.push({ nombre: s.name, color: 'purpura', fecha: new Date().toISOString(), accion: 'edicion' });
        await this.guardarRevision();
    },

    async eliminarConteoRevision(pi, ci) {
        if (!await window.ZENGO?.confirm('¿Eliminar conteo?', 'Confirmar')) return;
        const s = JSON.parse(localStorage.getItem('zengo_session') || '{}');
        const p = this.revisionActual.productos[pi];
        p.conteos.splice(ci, 1);
        p.total = p.conteos.reduce((a, x) => a + x.cantidad, 0);
        p.diferencia = p.total - p.existencia;
        if (!p.modificaciones) p.modificaciones = [];
        p.modificaciones.push({ nombre: s.name, color: 'purpura', fecha: new Date().toISOString(), accion: 'eliminar' });
        await this.guardarRevision();
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
            upc, sku: '', descripcion: desc, existencia: 0, precio: 0,
            conteos: [{ cantidad, ubicacion: ubic.toUpperCase(), timestamp: new Date().toISOString() }],
            total: cantidad, diferencia: cantidad,
            es_hallazgo: true, hallazgo_estado: 'aprobado',
            hallazgo_reportado_por: s.name, hallazgo_reportado_color: 'purpura',
            hallazgo_aprobado_por: s.name, hallazgo_aprobado_color: 'purpura',
            hallazgo_fecha: new Date().toISOString(),
            modificaciones: [{ nombre: s.name, color: 'purpura', fecha: new Date().toISOString(), accion: 'hallazgo_jefe' }]
        });
        await this.guardarRevision();
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
        window.ZENGO?.toast('Entregado a Administracion ✓', 'success');
        this.revisionActual = null;
        this.showSection('mando');
        await this.loadDashboardData();
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
        if (id === 'mando') this.loadMonitorMando();
        if (id === 'asignar') { this.loadCategorias(); this.loadTareas(); }
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
                <span class="consulta-lista-meta">₡${(p.precio||0).toLocaleString()} · Existencia: ${p.existencia||0}</span>
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
            'pendiente':           { label: 'Pendiente',          cls: 'mc-estado-pend' },
            'en_progreso':         { label: 'En Progreso',         cls: 'mc-estado-prog' },
            'finalizado_auxiliar': { label: 'Listo para Revisar',  cls: 'mc-estado-listo' },
            'devuelto_jefe':       { label: 'Devuelto al Aux',     cls: 'mc-estado-dev' },
            'devuelto_admin':      { label: 'Devuelto por Admin',  cls: 'mc-estado-rej' }
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
        </div>`;
    },

    // ═══ ESTILOS (inyectados una sola vez) ═══
    injectStyles() {
        if (document.getElementById('jefe-monitor-styles')) return;
        const style = document.createElement('style');
        style.id = 'jefe-monitor-styles';
        style.innerHTML = `
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
/* Light mode */
body.light-mode .monitor-card { background: rgba(0,0,0,0.03); border-color: rgba(0,0,0,0.08); }
body.light-mode .mc-aux { color: rgba(0,0,0,0.55); }
body.light-mode .mc-stat { background: rgba(0,0,0,0.04); }
body.light-mode .mc-stat-lbl { color: rgba(0,0,0,0.4); }
body.light-mode .mc-crono { color: rgba(0,0,0,0.6); }
body.light-mode .mc-fecha { color: rgba(0,0,0,0.3); }
body.light-mode .mc-progress-bg { background: rgba(0,0,0,0.1); }
        `;
        document.head.appendChild(style);
    },

    renderModals() { return ''; }
};

window.JefeView = JefeView;
console.log('✓ JefeView v1.5 cargado');
