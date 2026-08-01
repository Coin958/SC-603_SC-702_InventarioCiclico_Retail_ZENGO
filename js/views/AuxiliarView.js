// ═══════════════════════════════════════════════════════════════
// ZENGO - AuxiliarView v1.7.0
// Solo lógica + HTML — CSS en archivos separados
// Hallazgos almacenados en tarea.productos[] con es_hallazgo=true
// ═══════════════════════════════════════════════════════════════

const AuxiliarView = {

    tareaActual: null,
    upcSeleccionado: null,

    // ═══ RENDER ═══
    render(container) {
        const session = JSON.parse(localStorage.getItem('zengo_session') || '{}');
        container.innerHTML = `
        <div class="dashboard-wrapper aux-theme">
            <aside id="sidebar" class="sidebar glass">
                <div class="sidebar-header">
                    <div class="logo">ZEN<span>GO</span></div>
                    <span class="badge-aux">AUX</span>
                    <button class="toggle-btn" onclick="AuxiliarView.toggleSidebar()"><i class="fas fa-bars"></i></button>
                </div>
                <div class="user-card">
                    <div class="user-avatar aux"><i class="fas fa-user"></i></div>
                    <div class="user-info">
                        <span class="user-name">${session.name || 'Auxiliar'}</span>
                        <span class="user-role">AUXILIAR</span>
                    </div>
                </div>
                <nav class="sidebar-nav">
                    <a href="#" class="nav-item active" data-section="ciclico" onclick="AuxiliarView.showSection('ciclico')"><i class="fas fa-clipboard-list"></i><span>Mi Ciclico</span></a>
                    <a href="#" class="nav-item" data-section="consulta" onclick="AuxiliarView.showSection('consulta')"><i class="fas fa-search"></i><span>Modo Consulta</span></a>
                    <a href="#" class="nav-item" data-section="devueltos" onclick="AuxiliarView.showSection('devueltos')"><i class="fas fa-undo"></i><span>Devueltos</span><span class="badge-alert" id="devueltos-aux-count" style="display:none;">0</span></a>
                    <div class="nav-spacer"></div>
                    <a href="#" class="nav-item theme-toggle" onclick="AuxiliarView.toggleTheme()"><i class="fas fa-moon"></i><span>Modo Oscuro</span></a>
                    <a href="#" class="nav-item logout" onclick="AuthController.logout()"><i class="fas fa-power-off"></i><span>Cerrar Sesion</span></a>
                </nav>
            </aside>

            <main class="main-content">
                <header class="top-header glass">
                    <div class="header-left">
                        <button class="mobile-menu" onclick="AuxiliarView.toggleSidebar()"><i class="fas fa-bars"></i></button>
                        <div><h1>Conteo <span class="accent-blue">Ciclico</span></h1><p class="text-dim" id="tarea-info">Cargando...</p></div>
                    </div>
                    <div class="header-stats">
                        <div class="sync-badge online">
                            <div class="dot"></div>
                            <span>ONLINE</span>
                        </div>

                        <button class="btn-refresh" onclick="AuxiliarView.refreshAll()">
                            <i class="fas fa-sync-alt"></i>
                        </button>

                        <div class="cronometro-badge">
                            <i class="fas fa-stopwatch"></i>
                            <span id="cronometro" class="cronometro-time">00:00:00</span>
                        </div>
                    </div>
                </header>

                <div id="section-ciclico" class="section-content">
                    <div id="sin-tarea" style="display:none;"><div class="empty-state-big"><i class="fas fa-inbox"></i><h2>Sin tarea asignada</h2><p>Espera a que el Jefe te asigne una categoría</p></div></div>
                    <div id="con-tarea" style="display:none;">
                        <section class="search-section glass">
                            <div class="search-bar"><input type="text" id="buscar-producto" placeholder="Buscar por UPC, SKU o descripcion..." onkeyup="AuxiliarView.filtrarProductos(this.value)"><button class="btn-scan" onclick="AuxiliarView.abrirScanner()"><i class="fas fa-camera"></i></button></div>
                            <button class="btn-hallazgo" onclick="AuxiliarView.reportarHallazgo()"><i class="fas fa-plus"></i> Reportar Hallazgo</button>
                        </section>
                        <section class="kpi-grid">
                            <div class="kpi-card glass">
                                <div class="kpi-header"><span class="kpi-label">Progreso</span><i class="fas fa-clipboard-check kpi-icon blue"></i></div>
                                <div class="kpi-body">
                                    <span class="kpi-categoria" id="kpi-categoria">—</span>
                                    <div class="kpi-progress-detail"><span id="contados-label">0</span> / <span id="total-label">0</span> productos · <span id="kpi-pct">0</span>%</div>
                                    <div class="progress-bar"><div class="progress-fill" id="progress-fill"></div></div>
                                    <span id="hallazgos-pendientes-label" class="hallazgos-warn" style="display:none;"><i class="fas fa-exclamation-triangle"></i> <span id="hallazgos-pend-count">0</span> hallazgo(s) pendiente(s)</span>
                                </div>
                            </div>
                            <div class="kpi-card glass">
                                <div class="kpi-header"><span class="kpi-label">Precision</span><i class="fas fa-bullseye kpi-icon green"></i></div>
                                <div class="kpi-body">
                                    <div class="kpi-precision-row"><span class="kpi-precision-label">Absoluta</span><span class="kpi-precision-value" id="kpi-precision-abs">—</span></div>
                                    <div class="kpi-precision-row"><span class="kpi-precision-label">Neta</span><span class="kpi-precision-value" id="kpi-precision-net">—</span></div>
                                </div>
                            </div>
                            <div class="kpi-card glass">
                                <div class="kpi-header"><span class="kpi-label">Diferencias</span><i class="fas fa-exchange-alt kpi-icon orange"></i></div>
                                <div class="kpi-body kpi-diff-body">
                                    <div class="kpi-diff"><span class="kpi-diff-value text-success" id="kpi-sobrantes">+0</span><span class="kpi-diff-label">Sobrantes</span></div>
                                    <div class="kpi-diff-divider"></div>
                                    <div class="kpi-diff"><span class="kpi-diff-value text-error" id="kpi-faltantes">-0</span><span class="kpi-diff-label">Faltantes</span></div>
                                </div>
                            </div>
                            <div class="kpi-card glass">
                                <div class="kpi-header"><span class="kpi-label">Mi Ranking</span><i class="fas fa-trophy kpi-icon purple"></i></div>
                                <div class="kpi-body kpi-ranking-body">
                                    <span class="kpi-ranking-pos" id="kpi-ranking-pos">—</span>
                                    <span class="kpi-ranking-score" id="kpi-ranking-score">Score: —</span>
                                </div>
                            </div>
                        </section>
                        <section class="tabla-section glass">
                            <div class="tabla-scroll"><table class="tabla-ciclico" id="tabla-productos"><thead><tr>
                                <th class="col-num">#</th><th class="col-upc">UPC</th><th class="col-sku">SKU</th>
                                <th class="col-desc">DESCRIPCIÓN</th><th class="col-precio">PRECIO</th>
                                <th class="col-existencia">EXISTENCIA</th><th class="col-cantidad">CANTIDAD</th>
                                <th class="col-ubicacion">UBICACIÓN</th><th class="col-total">TOTAL</th>
                                <th class="col-diferencia">DIFERENCIA</th><th class="col-acciones">+</th>
                            </tr></thead><tbody id="productos-tbody"></tbody></table></div>
                        </section>
                        <div id="finalizar-section" style="display:none;"><button class="btn-finalizar" onclick="AuxiliarView.confirmarFinalizacion()"><i class="fas fa-check-circle"></i> Finalizar Ciclico</button></div>
                    </div>
                </div>

                <!-- MODO CONSULTA -->
                <div id="section-consulta" class="section-content" style="display:none;">
                    <section class="consulta-v2-wrap">
                        <div class="consulta-v2-searchbar glass">
                            <input type="text" id="aux-consulta-input" placeholder="Buscar por descripcion, UPC o SKU..." onkeyup="if(event.key==='Enter')AuxiliarView.ejecutarConsulta()">
                            <button class="btn-consultar" style="background:var(--blue)" onclick="AuxiliarView.ejecutarConsulta()">Consultar</button>
                        </div>
                        <div class="consulta-v2-body">
                            <div class="consulta-v2-camera glass">
                                <div class="consulta-v2-cam-header">
                                    <span><i class="fas fa-camera"></i> Escaner</span>
                                    <span class="consulta-activo-badge">Activo</span>
                                </div>
                                <div class="consulta-v2-video-wrap">
                                    <div id="aux-consulta-video"></div>
                                    <div class="consulta-scan-line"></div>
                                </div>
                                <div class="consulta-v2-status" id="aux-consulta-status">
                                    <i class="fas fa-barcode"></i> Apunta al codigo de barras
                                </div>
                            </div>
                            <div class="consulta-v2-resultado glass" id="aux-consulta-resultado">
                                <div class="empty-state"><i class="fas fa-search"></i><p>Busca un producto por descripcion, UPC o SKU</p></div>
                            </div>
                        </div>
                    </section>
                </div>

                <!-- DEVUELTOS POR JEFE -->
                <div id="section-devueltos" class="section-content" style="display:none;">
                    <section>
                        <div class="section-header">
                            <h2><i class="fas fa-undo"></i> Cíclicos Devueltos</h2>
                        </div>
                        <div class="glass" style="padding:20px;border-radius:16px;" id="devueltos-aux-list">
                            <div class="empty-state"><p>Sin cíclicos devueltos</p></div>
                        </div>
                    </section>
                </div>

            </main>
        </div>
        ${this.renderModals()}`;
        this.cargarTarea();
    },

    // ═══ SYNC ═══
    async syncTareaFromSupabase(auxiliarId) {
        try {
            if (!navigator.onLine || !window.supabaseClient) return null;
            const { data, error } = await window.supabaseClient
                .from('tareas').select('*')
                .eq('auxiliar_id', auxiliarId)
                .in('estado', ['pendiente', 'en_progreso'])
                .limit(1);
            if (error || !data || !data.length) return null;

            const remota = data[0];
            const local = await window.db.tareas.get(remota.id);

            if (!local) {
                await window.db.tareas.put(remota);
                return remota;
            }

            const localContados = local.productos_contados || 0;
            const remotaContados = remota.productos_contados || 0;
            const remotaResueltos = (remota.productos || []).filter(p => p.es_hallazgo && p.hallazgo_estado !== 'pendiente').length;
            const localResueltos = (local.productos || []).filter(p => p.es_hallazgo && p.hallazgo_estado !== 'pendiente').length;

            if (remotaContados >= localContados && remotaResueltos >= localResueltos) {
                await window.db.tareas.put(remota);
                return remota;
            }

            // Local tiene más progreso → mantener local, pero aplicar decisiones
            // del jefe y adoptar el número de `version` remoto (ver
            // FIX_CONCURRENCIA_SQL.sql): la fila en Supabase ya avanzó de
            // versión por la escritura del jefe, así que si no actualizamos
            // esto aquí, el próximo guardado del auxiliar chocaría consigo
            // mismo (creería tener la versión vieja y sería rechazado).
            local.version = remota.version;
            if (remotaResueltos > localResueltos) {
                for (const rp of (remota.productos || [])) {
                    if (rp.es_hallazgo && rp.hallazgo_estado !== 'pendiente') {
                        const li = local.productos.findIndex(p => p.upc === rp.upc && p.es_hallazgo);
                        if (li !== -1) {
                            local.productos[li].hallazgo_estado = rp.hallazgo_estado;
                            local.productos[li].hallazgo_aprobado_por = rp.hallazgo_aprobado_por;
                            local.productos[li].hallazgo_rechazado_por = rp.hallazgo_rechazado_por;
                            local.productos[li].precio = rp.precio;
                            local.productos[li].precio_hallazgo = rp.precio_hallazgo;
                        }
                    }
                }
            }
            await window.db.tareas.put(local);
            return local;
        } catch (e) { return null; }
    },

    async syncTareaToSupabase() {
        try {
            if (!this.tareaActual) return false;

            if (!navigator.onLine || !window.supabaseClient) {
                // Sin conexión: encolar en vez de simplemente abandonar. Antes
                // esto retornaba false sin encolar nada y los callers ni
                // siquiera revisaban el resultado — el conteo quedaba SOLO en
                // el Dexie de este dispositivo. Si el dispositivo nunca volvía
                // a sincronizar esta tarea antes de que otro (Jefe/otro
                // dispositivo) la modificara, el conteo offline se perdía
                // para siempre sin ningún aviso — justo el tipo de perdida
                // silenciosa que un escenario real de 3 laptops con WiFi
                // inestable puede disparar.
                await window.SyncManager?.addToQueue('tareas', 'update', {
                    id: this.tareaActual.id,
                    changes: {
                        productos: this.tareaActual.productos,
                        productos_contados: this.tareaActual.productos_contados,
                        estado: this.tareaActual.estado,
                        cronometro_inicio: this.tareaActual.cronometro_inicio || null,
                        fecha_finalizacion: this.tareaActual.fecha_finalizacion || null
                    }
                });
                return 'queued';
            }
            // Concurrencia optimista: solo escribe si nadie más tocó esta
            // fila desde que la leímos (misma `version`). Si 0 filas resultan
            // afectadas, un Jefe la modificó primero o la tarea ya no existe
            // (ver FIX_CONCURRENCIA_SQL.sql) — antes esto se sobrescribía
            // en silencio ("el último que escribe gana") y el auxiliar veía
            // "Conteo guardado ✓" aunque nada se hubiera persistido.
            const { data, error } = await window.supabaseClient.from('tareas')
                .update({
                    productos: this.tareaActual.productos,
                    productos_contados: this.tareaActual.productos_contados,
                    estado: this.tareaActual.estado,
                    cronometro_inicio: this.tareaActual.cronometro_inicio || null,
                    fecha_finalizacion: this.tareaActual.fecha_finalizacion || null
                })
                .eq('id', this.tareaActual.id)
                .eq('version', this.tareaActual.version || 1)
                .select('id, version');

            if (error) return false;

            if (!data || data.length === 0) {
                await this._resolverConflictoTarea();
                return false;
            }

            this.tareaActual.version = data[0].version;
            await window.db.tareas.put(this.tareaActual);
            return true;
        } catch (e) { return false; }
    },

    // Se llama cuando una escritura a la tarea activa no afectó ninguna
    // fila: o la tarea ya no existe (ej. Admin cerró el ciclo diario
    // mientras el auxiliar seguía offline) o el Jefe la modificó primero
    // desde la pantalla de revisión. En ambos casos avisamos en vez de
    // dejar que el auxiliar crea que su conteo se guardó.
    async _resolverConflictoTarea() {
        if (!this.tareaActual) return;
        const tareaId = this.tareaActual.id;
        try {
            const { data } = await window.supabaseClient
                .from('tareas').select('*').eq('id', tareaId).limit(1);

            if (!data || !data.length) {
                await window.db.tareas.delete(tareaId);
                this.tareaActual = null;
                const sinTarea = document.getElementById('sin-tarea');
                const conTarea = document.getElementById('con-tarea');
                const info = document.getElementById('tarea-info');
                if (sinTarea) sinTarea.style.display = 'block';
                if (conTarea) conTarea.style.display = 'none';
                if (info) info.textContent = 'Sin tarea asignada';
                window.ZENGO?.toast('Este cíclico ya no existe (fue cerrado por un administrador) — tu último cambio no se guardó', 'error', 8000);
                return;
            }

            await window.db.tareas.put(data[0]);
            this.tareaActual = data[0];
            window.ZENGO?.toast('El Jefe modificó este cíclico mientras trabajabas — se cargó la versión más reciente. Verifica tu último cambio', 'warning', 8000);
            this.renderProductos();
            this.actualizarProgreso();
        } catch (e) { console.error('Error resolviendo conflicto de tarea:', e); }
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

    // ═══ CARGAR TAREA ═══
    async cargarTarea() {
        await this.syncProductosFromSupabase();
        const session = JSON.parse(localStorage.getItem('zengo_session') || '{}');
        let miTarea = await this.syncTareaFromSupabase(session.id);
        if (!miTarea) {
            const tareas = await window.db.tareas.toArray();
            miTarea = tareas.find(t => t.auxiliar_id === session.id && (t.estado === 'pendiente' || t.estado === 'en_progreso'));
        }
        if (!miTarea) {
            document.getElementById('sin-tarea').style.display = 'block';
            document.getElementById('con-tarea').style.display = 'none';
            document.getElementById('tarea-info').textContent = 'Sin tarea asignada';
            return;
        }
        this.tareaActual = miTarea;
        if (miTarea.estado === 'pendiente') {
            this.tareaActual.estado = 'en_progreso';
            await window.db.tareas.update(miTarea.id, { estado: 'en_progreso' });
            await this.syncTareaToSupabase();
            try {
                const session = JSON.parse(localStorage.getItem('zengo_session') || '{}');
                await window.LogController?.registrar({
                    tabla: 'tareas',
                    accion: 'TAREA_INICIADA',
                    registro_id: miTarea.id,
                    usuario_id: session.id || null,
                    usuario_nombre: session.name || 'Auxiliar',
                    datos_nuevos: {
                        categoria: miTarea.categoria,
                        productos_total: miTarea.productos_total || (miTarea.productos || []).length
                    }
                });
            } catch (e) { console.warn('Error log tarea iniciada:', e); }
        }
        document.getElementById('sin-tarea').style.display = 'none';
        document.getElementById('con-tarea').style.display = 'block';
        document.getElementById('tarea-info').textContent = `Categoría: ${miTarea.categoria}`;
        this.renderProductos();
        this.actualizarProgreso();
        this.cargarRanking();
        // Si ya tiene cronómetro iniciado, restaurar
        if (miTarea.cronometro_inicio) await this.iniciarCronometro();
    },

    // ═══ TABLA EXCEL ═══
    renderProductos(filtro = '') {
        if (!this.tareaActual) return;
        const tbody = document.getElementById('productos-tbody');
        let productos = this.tareaActual.productos || [];

        if (filtro) {
            const f = filtro.toUpperCase();
            productos = productos.filter(p =>
                (p.upc || '').includes(f) || (p.sku || '').toUpperCase().includes(f) ||
                (p.descripcion || '').toUpperCase().includes(f)
            );
        }

        // Ordenar: normales → aprobados → pendientes → rechazados
        const normales = productos.filter(p => !p.es_hallazgo);
        const aprobados = productos.filter(p => p.es_hallazgo && p.hallazgo_estado === 'aprobado');
        const pendientes = productos.filter(p => p.es_hallazgo && p.hallazgo_estado === 'pendiente');
        const rechazados = productos.filter(p => p.es_hallazgo && p.hallazgo_estado === 'rechazado');
        const ordenados = [...normales, ...aprobados, ...pendientes, ...rechazados];

        if (!ordenados.length) { tbody.innerHTML = '<tr><td colspan="11" class="empty-cell">No hay productos</td></tr>'; return; }

        tbody.innerHTML = ordenados.map((p, i) => {
            const realIndex = this.tareaActual.productos.indexOf(p);
            const esH = p.es_hallazgo || false;
            const hEstado = p.hallazgo_estado || '';
            const completo = p.conteos && p.conteos.length > 0;
            const total = p.total || 0;
            const diferencia = total - (p.existencia || 0);

            // Badges
            let badges = '';
            if (esH) {
                badges += '<span class="pill-badge amarillo">HALLAZGO</span>';
                if (p.hallazgo_reportado_por) badges += `<span class="pill-badge celeste">${p.hallazgo_reportado_por}</span>`;
                if (hEstado === 'aprobado' && p.hallazgo_aprobado_por) badges += `<span class="pill-badge purpura">✓ ${p.hallazgo_aprobado_por}</span>`;
                if (hEstado === 'rechazado' && p.hallazgo_rechazado_por) badges += `<span class="pill-badge ${p.hallazgo_rechazado_color || 'purpura'}">✗ ${p.hallazgo_rechazado_por}</span>`;
            }
            if (p.modificaciones) p.modificaciones.forEach(m => { badges += `<span class="pill-badge ${m.color}">${window.ZENGO.esc(m.nombre)}</span>`; });

            // Conteos y ubicaciones
            let cantHtml = '<span class="sin-conteo">—</span>';
            let ubicHtml = '<span class="sin-conteo">—</span>';
            if (completo) {
                cantHtml = p.conteos.map((c, ci) => `<div class="conteo-inline"><span class="conteo-cant">${c.cantidad}</span><button class="btn-edit-mini" onclick="AuxiliarView.editarConteo(${realIndex},${ci})"><i class="fas fa-pen"></i></button><button class="btn-del-mini" onclick="AuxiliarView.eliminarConteo(${realIndex},${ci})"><i class="fas fa-times"></i></button></div>`).join('');
                ubicHtml = p.conteos.map(c => `<div class="ubic-inline">${window.ZENGO.esc(c.ubicacion)}</div>`).join('');
            }

            let diffClass = '';
            if (completo) { if (diferencia < 0) diffClass = 'diff-falta'; else if (diferencia > 0) diffClass = 'diff-sobra'; else diffClass = 'diff-cero'; }

            let rowClass = '';
            if (hEstado === 'pendiente') rowClass = 'row-hallazgo-pendiente';
            else if (hEstado === 'rechazado') rowClass = 'row-hallazgo-rechazado';
            else if (esH && hEstado === 'aprobado') rowClass = 'row-hallazgo-aprobado';
            else if (completo) rowClass = 'row-completo';

            const puedeContar = !esH || hEstado === 'aprobado';
            const btnConteo = puedeContar
                ? `<button class="btn-add-conteo" onclick="AuxiliarView.abrirConteo(${realIndex})"><i class="fas fa-plus"></i></button>`
                : (hEstado === 'pendiente'
                    ? '<span class="icon-pending"><i class="fas fa-clock"></i></span>'
                    : '<span class="icon-rejected"><i class="fas fa-ban"></i></span>');

            return `<tr class="${rowClass}" data-idx="${realIndex}">
                <td class="col-num">${i + 1}</td>
                <td class="col-upc"><code>${window.ZENGO.esc(p.upc) || '—'}</code></td>
                <td class="col-sku">${window.ZENGO.esc(p.sku) || '—'}</td>
                <td class="col-desc" title="${window.ZENGO.esc(p.descripcion)}">${window.ZENGO.esc(p.descripcion) || '—'} ${badges}</td>
                <td class="col-precio">${p.precio ? '₡' + p.precio.toLocaleString() : '—'}</td>
                <td class="col-existencia">${p.existencia || 0}</td>
                <td class="col-cantidad">${cantHtml}</td>
                <td class="col-ubicacion">${ubicHtml}</td>
                <td class="col-total"><strong>${total}</strong></td>
                <td class="col-diferencia ${diffClass}"><strong>${completo ? diferencia : '—'}</strong></td>
                <td class="col-acciones">${btnConteo}</td>
            </tr>`;
        }).join('');
    },

    filtrarProductos(v) { this.renderProductos(v); },

    // ═══ CONTEO ═══
    abrirConteo(index) {
        // Guarda: si una sincronización de fondo cerró/borró la tarea justo
        // antes de este clic (ver _resolverConflictoTarea), tareaActual
        // puede ser null.
        if (!this.tareaActual) return;
        const p = this.tareaActual.productos[index];
        if (!p) return;
        // Se guarda el UPC, no el índice: si el arreglo de productos cambia
        // de tamaño u orden mientras el modal está abierto (ej. el Jefe
        // agrega un hallazgo y llega una sincronización de fondo), un
        // índice numérico podría terminar apuntando a otro producto.
        this.upcSeleccionado = p.upc;
        document.getElementById('conteo-upc').textContent = p.upc || '';
        document.getElementById('conteo-desc').textContent = p.descripcion || '';
        document.getElementById('conteo-cantidad').value = '';
        document.getElementById('conteo-ubicacion').value = '';
        document.getElementById('conteo-modal').style.display = 'flex';
        document.getElementById('conteo-cantidad').focus();
    },

    async guardarConteo() {
        if (!this.tareaActual || !this.upcSeleccionado) {
            window.ZENGO?.toast('Este cíclico ya no está disponible — cierra este formulario', 'error');
            this.closeModal();
            return;
        }
        const cantidad = parseInt(document.getElementById('conteo-cantidad').value);
        const ubicacion = document.getElementById('conteo-ubicacion').value.trim();
        if (isNaN(cantidad) || cantidad < 0) { window.ZENGO?.toast('Cantidad inválida', 'error'); return; }
        if (!ubicacion) { window.ZENGO?.toast('Ingresa ubicación', 'error'); return; }

        const p = this.tareaActual.productos.find(x => x.upc === this.upcSeleccionado);
        if (!p) {
            window.ZENGO?.toast('Este producto ya no existe en la tarea', 'error');
            this.closeModal();
            return;
        }
        if (!p.conteos) p.conteos = [];
        const ubicUpper = ubicacion.toUpperCase();
        const existente = p.conteos.findIndex(c => c.ubicacion === ubicUpper);
        if (existente !== -1) {
            if (!await window.ZENGO?.confirm(`Ya existe un conteo en ${ubicUpper} con cantidad ${p.conteos[existente].cantidad}. ¿Reemplazar?`, 'Duplicado detectado')) return;
            p.conteos[existente].cantidad = cantidad;
            p.conteos[existente].timestamp = new Date().toISOString();
        } else {
            p.conteos.push({ cantidad, ubicacion: ubicUpper, timestamp: new Date().toISOString() });
        }
        p.total = p.conteos.reduce((s, c) => s + c.cantidad, 0);
        p.diferencia = p.total - p.existencia;
        this.tareaActual.productos_contados = this.tareaActual.productos.filter(x => x.conteos && x.conteos.length > 0).length;
        const tareaId = this.tareaActual.id; // capturado antes del sync: si hay conflicto, tareaActual puede quedar null

        // Iniciar cronómetro en primer conteo
        if (!this.cronometroInicio) await this.iniciarCronometro();

        await window.db.tareas.put(this.tareaActual);
        const synced = await this.syncTareaToSupabase();

        try {
            const session = JSON.parse(localStorage.getItem('zengo_session') || '{}');

            await window.LogController?.registrar({
                tabla: 'conteos_realizados',
                accion: 'CONTEO_REGISTRADO',
                registro_id: `${tareaId}_${p.upc}`,
                usuario_id: session.id || null,
                usuario_nombre: session.name || 'Auxiliar',
                datos_nuevos: {
                    upc: p.upc,
                    total: p.total || 0,
                    conteos: p.conteos || []
                }
            });
        } catch (e) {
            console.warn('Error log conteo:', e);
        }

        this.closeModal(); this.renderProductos(); this.actualizarProgreso();
        if (synced === true) window.ZENGO?.toast('Conteo guardado ✓', 'success');
        else if (synced === 'queued') window.ZENGO?.toast('Conteo guardado localmente — se sincronizará cuando haya conexión', 'warning');
        // synced === false: _resolverConflictoTarea() ya mostró su propio aviso
    },

    async editarConteo(pi, ci) {
        if (!this.tareaActual) return;
        const p = this.tareaActual.productos[pi];
        if (!p || !p.conteos || !p.conteos[ci]) return;
        const antes = JSON.parse(JSON.stringify(p));

        const nv = prompt(`Editar cantidad (${p.conteos[ci].ubicacion}):`, p.conteos[ci].cantidad);
        if (nv === null) return;

        p.conteos[ci].cantidad = parseInt(nv) || 0;
        p.total = p.conteos.reduce((s, c) => s + c.cantidad, 0);
        p.diferencia = p.total - p.existencia;

        await window.db.tareas.put(this.tareaActual);
        const synced = await this.syncTareaToSupabase();

        try {
            await window.LogController?.registrar({
                tabla: 'conteos_realizados',
                accion: 'CONTEO_EDITADO',
                registro_id: `${this.tareaActual.id}_${pi}_${ci}`,
                usuario_id: sessionStorage.getItem('zengo_session')
                    ? JSON.parse(sessionStorage.getItem('zengo_session')).id
                    : (JSON.parse(localStorage.getItem('zengo_session') || '{}').id || null),
                usuario_nombre: JSON.parse(localStorage.getItem('zengo_session') || '{}').name || 'Auxiliar',
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
        } catch (e) {
            console.warn('Error log editar conteo:', e);
        }

        this.renderProductos();
        this.actualizarProgreso();
        if (synced === true) window.ZENGO?.toast('Editado ✓', 'success');
        else if (synced === 'queued') window.ZENGO?.toast('Editado localmente — se sincronizará cuando haya conexión', 'warning');
    },

    async eliminarConteo(pi, ci) {
        if (!this.tareaActual || !this.tareaActual.productos[pi]?.conteos?.[ci]) return;

        const confirmado = await window.ZENGO?.confirm('¿Eliminar conteo?', 'Confirmar');
        if (!confirmado) return;

        // Revalidar tras el confirm: es un diálogo async, y de fondo pudo
        // haber llegado una sincronización que invalidó la tarea o el
        // producto mientras el usuario decidía.
        if (!this.tareaActual || !this.tareaActual.productos[pi]?.conteos?.[ci]) {
            window.ZENGO?.toast('Este conteo ya no existe', 'error');
            return;
        }

        const session = JSON.parse(localStorage.getItem('zengo_session') || '{}');
        const p = this.tareaActual.productos[pi];
        const antes = JSON.parse(JSON.stringify(p));

        p.conteos.splice(ci, 1);
        p.total = p.conteos.reduce((s, c) => s + c.cantidad, 0);
        p.diferencia = p.total - p.existencia;

        this.tareaActual.productos_contados = this.tareaActual.productos.filter(
            x => x.conteos && x.conteos.length > 0
        ).length;

        await window.db.tareas.put(this.tareaActual);
        const synced = await this.syncTareaToSupabase();

        try {
            await window.LogController?.registrar({
                tabla: 'conteos_realizados',
                accion: 'CONTEO_ELIMINADO',
                registro_id: `${this.tareaActual.id}_${pi}_${ci}`,
                usuario_id: session.id || null,
                usuario_nombre: session.name || 'Auxiliar',
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
        } catch (e) {
            console.warn('Error log eliminar conteo:', e);
        }

        this.renderProductos();
        this.actualizarProgreso();
        if (synced === true) window.ZENGO?.toast('Eliminado', 'success');
        else if (synced === 'queued') window.ZENGO?.toast('Eliminado localmente — se sincronizará cuando haya conexión', 'warning');
    },

    // ═══ HALLAZGOS ═══
    reportarHallazgo() {
        document.getElementById('hallazgo-upc').value = '';
        document.getElementById('hallazgo-sku').value = '';
        document.getElementById('hallazgo-desc').value = '';
        document.getElementById('hallazgo-modal').style.display = 'flex';
    },

    async guardarHallazgo() {
        if (!this.tareaActual) {
            window.ZENGO?.toast('Este cíclico ya no está disponible — cierra este formulario', 'error');
            this.closeModal();
            return;
        }
        const upc = document.getElementById('hallazgo-upc').value.trim();
        const desc = document.getElementById('hallazgo-desc').value.trim();
        const sku = document.getElementById('hallazgo-sku').value.trim();

        if (!upc) {
            window.ZENGO?.toast('Ingresa el UPC', 'error');
            return;
        }

        const session = JSON.parse(localStorage.getItem('zengo_session') || '{}');

        this.tareaActual.productos.push({
            upc,
            sku: sku || '',
            descripcion: desc || 'Hallazgo',
            existencia: 0,
            precio: 0,
            conteos: [],
            total: 0,
            diferencia: 0,
            es_hallazgo: true,
            hallazgo_estado: 'pendiente',
            hallazgo_reportado_por: session.name,
            hallazgo_reportado_color: 'celeste',
            hallazgo_fecha: new Date().toISOString(),
            modificaciones: []
        });

        const nuevo = this.tareaActual.productos[this.tareaActual.productos.length - 1];
        const idx = this.tareaActual.productos.length - 1;
        const tareaId = this.tareaActual.id; // capturado antes del sync (ver nota en guardarConteo)

        await window.db.tareas.put(this.tareaActual);
        const synced = await this.syncTareaToSupabase();

        try {
            await window.LogController?.registrar({
                tabla: 'hallazgos',
                accion: 'HALLAZGO_REPORTADO',
                registro_id: `${tareaId}_${idx}`,
                usuario_id: session.id || null,
                usuario_nombre: session.name || 'Auxiliar',
                datos_nuevos: {
                    upc: nuevo.upc,
                    sku: nuevo.sku || '',
                    descripcion: nuevo.descripcion || '',
                    cantidad: nuevo.total || 0,
                    ubicacion: nuevo.conteos?.[0]?.ubicacion || '',
                    estado: nuevo.hallazgo_estado || 'pendiente',
                    total: nuevo.total || 0,
                    conteos: nuevo.conteos || []
                }
            });
        } catch (e) {
            console.warn('Error log hallazgo:', e);
        }

        this.closeModal();
        this.renderProductos();
        this.actualizarProgreso();
        if (synced === true) window.ZENGO?.toast('Hallazgo reportado — esperando aprobación del Jefe', 'success');
        else if (synced === 'queued') window.ZENGO?.toast('Hallazgo guardado localmente — se enviará al Jefe cuando haya conexión', 'warning');
    },

    // ═══ PROGRESO Y FINALIZACION ═══
    cronometroInterval: null,
    cronometroInicio: null,

    async iniciarCronometro() {
        if (this.cronometroInterval) return;
        if (!this.tareaActual) return;
        // Restaurar inicio guardado o marcar ahora
        if (this.tareaActual.cronometro_inicio) {
            this.cronometroInicio = new Date(this.tareaActual.cronometro_inicio).getTime();
        } else {
            this.cronometroInicio = Date.now();
            this.tareaActual.cronometro_inicio = new Date().toISOString();
            await window.db.tareas.put(this.tareaActual);
            // Se espera este sync (antes era "fire and forget"): si no se
            // espera, queda corriendo en paralelo con el próximo
            // `syncTareaToSupabase()` de guardarConteo() —ambos leyendo la
            // misma `version` vieja— y el segundo en llegar se rechaza como
            // si "otro usuario" hubiera modificado la tarea, cuando en
            // realidad es el mismo dispositivo compitiendo consigo mismo.
            await this.syncTareaToSupabase();
        }
        this.cronometroInterval = setInterval(() => this.actualizarCronometro(), 1000);
        this.actualizarCronometro();
    },

    actualizarCronometro() {
        if (!this.cronometroInicio) return;
        const elapsed = Math.floor((Date.now() - this.cronometroInicio) / 1000);
        const h = String(Math.floor(elapsed / 3600)).padStart(2, '0');
        const m = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
        const s = String(elapsed % 60).padStart(2, '0');
        const el = document.getElementById('cronometro');
        if (el) el.textContent = `${h}:${m}:${s}`;
    },

    detenerCronometro() {
        if (this.cronometroInterval) { clearInterval(this.cronometroInterval); this.cronometroInterval = null; }
        this.cronometroInicio = null;
    },

    calcularPrecision() {
        if (!this.tareaActual) return { absoluta: 0, neta: 0, score: 0 };
        // Delega a PrecisionCalculator (js/models/PrecisionCalculator.js):
        // antes esta fórmula vivía duplicada aquí con pesos (60/40) y hasta
        // un criterio de "neta" distintos a los de JefeView.calcularYGuardarEstadisticas
        // (50/50, sin neteo entre sobrantes y faltantes de productos
        // distintos) — que es la que realmente se persiste en el ranking.
        // Ahora ambas vistas usan la misma fórmula, así que el KPI en vivo
        // que ve el auxiliar coincide con lo que terminará contando oficialmente.
        return window.PrecisionCalculator.calcularCiclo(this.tareaActual.productos);
    },

    actualizarProgreso() {
        if (!this.tareaActual) return;
        const prods = this.tareaActual.productos || [];
        const contables = prods.filter(p => !p.es_hallazgo || p.hallazgo_estado === 'aprobado');
        const total = contables.length;
        const contados = contables.filter(p => p.conteos && p.conteos.length > 0).length;
        const hPend = prods.filter(p => p.es_hallazgo && p.hallazgo_estado === 'pendiente').length;
        const pct = total > 0 ? Math.round((contados / total) * 100) : 0;

        // KPI Progreso
        document.getElementById('contados-label').textContent = contados;
        document.getElementById('total-label').textContent = total;
        document.getElementById('kpi-pct').textContent = pct;
        document.getElementById('progress-fill').style.width = pct + '%';
        document.getElementById('kpi-categoria').textContent = this.tareaActual.categoria || '—';

        // Hallazgos: mostrar total reportados (nunca baja a cero una vez hay hallazgos)
        const hTotal = prods.filter(p => p.es_hallazgo).length;
        const hw = document.getElementById('hallazgos-pendientes-label');
        const hwCount = document.getElementById('hallazgos-pend-count');
        if (hTotal > 0) {
            hw.style.display = 'inline';
            if (hPend > 0) {
                hwCount.textContent = hPend;
                hw.title = `${hTotal} hallazgo(s) total · ${hPend} pendiente(s)`;
            } else {
                hwCount.textContent = hTotal;
                hw.style.color = 'var(--success, #10b981)';
                hw.title = `${hTotal} hallazgo(s) resuelto(s)`;
            }
        } else {
            hw.style.display = 'none';
        }

        // KPI Precisión
        const prec = this.calcularPrecision();
        document.getElementById('kpi-precision-abs').textContent = contados > 0 ? prec.absoluta + '%' : '—';
        document.getElementById('kpi-precision-net').textContent = contados > 0 ? prec.neta + '%' : '—';

        // KPI Diferencias (sobrantes/faltantes)
        let sobrantes = 0, faltantes = 0;
        contables.forEach(p => {
            if (p.conteos && p.conteos.length > 0) {
                const dif = (p.total || 0) - (p.existencia || 0);
                if (dif > 0) sobrantes += dif;
                else if (dif < 0) faltantes += Math.abs(dif);
            }
        });
        document.getElementById('kpi-sobrantes').textContent = '+' + sobrantes;
        document.getElementById('kpi-faltantes').textContent = '-' + faltantes;

        // Finalizar
        document.getElementById('finalizar-section').style.display =
            (contados === total && total > 0 && hPend === 0) ? 'block' : 'none';
    },

    async actualizarRankingUsuario(prec) {
        try {
            const session = JSON.parse(localStorage.getItem('zengo_session') || '{}');
            const auxId = session.id;
            if (!auxId) return;

            // Leer registro previo de estadisticas_auxiliares
            const prev = await window.db.estadisticas_auxiliares.get(auxId);
            const total = (prev?.total_ciclicos || 0) + 1;
            const sumaPA = (prev?.suma_pa || 0) + prec.absoluta;
            const sumaPN = (prev?.suma_pn || 0) + prec.neta;
            const promPA = parseFloat((sumaPA / total).toFixed(2));
            const promPN = parseFloat((sumaPN / total).toFixed(2));
            const score = parseFloat(((promPA + promPN) / 2).toFixed(2));

            const row = {
                auxiliar_id: auxId,
                auxiliar_nombre: session.name || session.nombre || 'Auxiliar',
                total_ciclicos: total,
                suma_pa: sumaPA,
                suma_pn: sumaPN,
                promedio_pa: promPA,
                promedio_pn: promPN,
                score_ranking: score,
                ultima_actualizacion: new Date().toISOString()
            };

            // Guardar en Dexie
            await window.db.estadisticas_auxiliares.put(row);

            // Sincronizar con Supabase
            try {
                if (navigator.onLine && window.supabaseClient) {
                    await window.supabaseClient
                        .from('estadisticas_auxiliares')
                        .upsert(row, { onConflict: 'auxiliar_id' });
                }
            } catch (e) { console.warn('Sync ranking falló:', e); }

            console.log(`✓ Ranking actualizado: score=${score}% (ciclo ${total})`);
        } catch (e) { console.warn('Error actualizando ranking:', e); }
    },

    async cargarRanking() {
        const posEl = document.getElementById('kpi-ranking-pos');
        const scoreEl = document.getElementById('kpi-ranking-score');
        if (!posEl || !scoreEl) return;
        try {
            const session = JSON.parse(localStorage.getItem('zengo_session') || '{}');
            let todos = [];

            // Intentar desde Supabase primero
            if (navigator.onLine && window.supabaseClient) {
                const { data } = await window.supabaseClient
                    .from('estadisticas_auxiliares')
                    .select('auxiliar_id, score_ranking')
                    .order('score_ranking', { ascending: false });
                if (data?.length) todos = data;
            }

            // Fallback: Dexie local
            if (!todos.length) {
                todos = await window.db.estadisticas_auxiliares
                    .orderBy('score_ranking').reverse().toArray();
            }

            const miPos = todos.findIndex(a => a.auxiliar_id === session.id);
            if (miPos !== -1) {
                posEl.textContent = '#' + (miPos + 1);
                scoreEl.textContent = 'Score: ' + todos[miPos].score_ranking + '%';
            } else {
                posEl.textContent = '—';
                scoreEl.textContent = 'Sin ciclos aún';
            }
        } catch (e) {
            posEl.textContent = '—';
            scoreEl.textContent = 'Sin datos';
        }
    },

    async confirmarFinalizacion() {
        const pend = (this.tareaActual.productos || []).filter(p => p.es_hallazgo && p.hallazgo_estado === 'pendiente');
        if (pend.length > 0) {
            window.ZENGO?.toast(`${pend.length} hallazgo(s) pendiente(s). El Jefe debe aprobarlos.`, 'error', 5000);
            return;
        }
        if (!await window.ZENGO?.confirm('¿Confirmar cierre de conteo cíclico?\n\nLos datos no podrán modificarse tras la confirmación.', 'Confirmar')) return;

        this.detenerCronometro();
        this.tareaActual.estado = 'finalizado_auxiliar';
        this.tareaActual.fecha_finalizacion = new Date().toISOString();

        // Calcular precisión del cíclico
        const prec = this.calcularPrecision();
        this.tareaActual.precision_absoluta = prec.absoluta;
        this.tareaActual.precision_neta = prec.neta;
        this.tareaActual.precision_score = prec.score;

        await window.db.tareas.put(this.tareaActual);
        const synced = await this.syncTareaToSupabase();

        // Actualizar ranking del auxiliar
        await this.actualizarRankingUsuario(prec);

        try {
            const session = JSON.parse(localStorage.getItem('zengo_session') || '{}');
            await window.LogController?.registrar({
                tabla: 'tareas',
                accion: 'TAREA_COMPLETADA',
                registro_id: this.tareaActual.id,
                usuario_id: session.id || null,
                usuario_nombre: session.name || 'Auxiliar',
                datos_nuevos: {
                    categoria: this.tareaActual.categoria,
                    productos_contados: this.tareaActual.productos_contados || 0,
                    productos_total: this.tareaActual.productos_total || (this.tareaActual.productos || []).length
                }
            });
        } catch (e) { console.warn('Error log tarea completada:', e); }

        window.ZENGO?.toast(synced ? 'Cíclico finalizado y enviado al Jefe ✓' : 'Finalizado (pendiente sincronizar)', synced ? 'success' : 'warning');

        // Limpiar vista inmediatamente
        this.tareaActual = null;
        document.getElementById('con-tarea').style.display = 'none';
        document.getElementById('sin-tarea').style.display = 'block';
        document.getElementById('tarea-info').textContent = 'Cíclico enviado al Jefe';
        document.getElementById('finalizar-section').style.display = 'none';
    },

    // ═══ SCANNER CÍCLICO ═══
    abrirScanner() {
        if (!this.tareaActual || !this.tareaActual.productos) {
            window.ZENGO?.toast('No hay tarea activa', 'error');
            return;
        }
        ScannerController.abrirScannerCiclico(
            this.tareaActual.productos,
            (idx) => {
                // Limpiar filtro y mostrar tabla completa
                const input = document.getElementById('buscar-producto');
                if (input) input.value = '';
                this.renderProductos('');

                const isLight = document.body.classList.contains('light-mode');
                const bgColor = isLight ? '#93c5fd' : 'rgba(37,99,235,0.55)';
                const textColor = isLight ? '#1e3a8a' : '';

                const row = document.querySelector(`#productos-tbody tr[data-idx="${idx}"]`);
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
                // No encontrado → solo aviso, sin crear hallazgo
                window.ZENGO?.toast(`UPC ${code} no pertenece a este ciclo`, 'warning');
            }
        );
    },

    // ═══ UI ═══
    toggleSidebar() { document.getElementById('sidebar').classList.toggle('collapsed'); },
    toggleTheme() { document.body.classList.toggle('light-mode'); },

    //═══ ACCION REFRESH ═══
    async refreshAll() {
        try {
            const btn = document.querySelector('.btn-refresh i');
            if (btn) btn.classList.add('fa-spin');

            const session = JSON.parse(localStorage.getItem('zengo_session') || '{}');

            await this.syncProductosFromSupabase();
            await this.syncTareaFromSupabase(session.id);
            await this.syncDevueltosFromSupabase(session.id);

            await this.cargarTarea();

            const devueltosVisible =
                document.getElementById('section-devueltos')?.style.display !== 'none';

            if (devueltosVisible) {
                await this.loadDevueltosAux();
            }

            this.resetConsulta();

            window.ZENGO?.toast('Datos actualizados ✓', 'success');

        } catch (e) {
            console.error('Error refresh auxiliar:', e);
            window.ZENGO?.toast('Error al actualizar', 'error');

        } finally {
            const btn = document.querySelector('.btn-refresh i');
            if (btn) btn.classList.remove('fa-spin');
        }
    },

    showSection(id) {
        ScannerController.detenerScannerConsulta();
        document.querySelectorAll('.section-content').forEach(s => s.style.display = 'none');
        document.getElementById(`section-${id}`).style.display = 'block';
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        document.querySelector(`[data-section="${id}"]`)?.classList.add('active');
        if (id === 'consulta') this._iniciarScannerConsulta();
        if (id === 'devueltos') this.loadDevueltosAux();
    },

    // ═══ MODO CONSULTA ═══
    resetConsulta() {
        const input = document.getElementById('aux-consulta-input');
        if (input) input.value = '';
        const panel = document.getElementById('aux-consulta-resultado');
        if (panel) panel.innerHTML = '<div class="empty-state"><i class="fas fa-search"></i><p>Busca un producto por descripcion, UPC o SKU</p></div>';
    },

    async ejecutarConsulta() {
        const term = document.getElementById('aux-consulta-input')?.value.trim();
        if (!term) return;
        const panel = document.getElementById('aux-consulta-resultado');
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
            `<div class="consulta-lista-item" onclick="AuxiliarView.verDetalleConsulta('${window.ZENGO.escJs(p.upc)}')">
                <span class="consulta-lista-upc">${window.ZENGO.esc(p.upc) || '—'}</span>
                <span class="consulta-lista-desc">${window.ZENGO.esc(p.descripcion) || '—'}</span>
                <span class="consulta-lista-meta">₡${(p.precio || 0).toLocaleString()} · Existencia: ${p.existencia || 0}</span>
            </div>`).join('')}</div>`;
    },

    async verDetalleConsulta(upc) {
        const r = await ScannerController.consultarProducto(upc);
        const panel = document.getElementById('aux-consulta-resultado');
        if (r.encontrado) panel.innerHTML = ScannerController.renderConsultaDetalle(r.producto, r.ubicaciones);
    },

    _iniciarScannerConsulta() {
        ScannerController.iniciarScannerConsulta('aux-consulta-video', (code) => {
            document.getElementById('aux-consulta-status').innerHTML =
                `<i class="fas fa-check-circle" style="color:var(--success)"></i> Detectado: <code>${code}</code>`;
            this.verDetalleConsulta(code);
        });
    },

    // ═══ DEVUELTOS POR JEFE ═══
    async syncDevueltosFromSupabase(auxiliarId) {
        try {
            if (!navigator.onLine || !window.supabaseClient) return;
            const { data, error } = await window.supabaseClient
                .from('tareas').select('*')
                .eq('auxiliar_id', auxiliarId)
                .eq('estado', 'devuelto_jefe');
            if (error || !data) return;
            for (const remota of data) {
                await window.db.tareas.put(remota);
            }
        } catch (e) { }
    },

    async loadDevueltosAux() {
        const session = JSON.parse(localStorage.getItem('zengo_session') || '{}');
        await this.syncDevueltosFromSupabase(session.id);
        const tareas = await window.db.tareas.toArray();
        const devueltas = tareas.filter(t => t.auxiliar_id === session.id && t.estado === 'devuelto_jefe');
        const badge = document.getElementById('devueltos-aux-count');
        if (badge) { badge.textContent = devueltas.length; badge.style.display = devueltas.length ? '' : 'none'; }
        const el = document.getElementById('devueltos-aux-list');
        if (!el) return;
        if (!devueltas.length) {
            el.innerHTML = '<div class="empty-state"><i class="fas fa-check-circle"></i><p>Sin cíclicos devueltos</p></div>';
            return;
        }
        el.innerHTML = devueltas.map(t => `
            <div class="ciclico-row" style="flex-direction:column;align-items:flex-start;gap:10px;padding:16px;">
                <div class="ciclico-info">
                    <strong>${t.categoria}</strong>
                    <small>Devuelto por: ${window.ZENGO.esc(t.devuelto_por_jefe) || 'Jefe'} · ${t.fecha_devuelto_jefe ? new Date(t.fecha_devuelto_jefe).toLocaleString('es-CR') : '—'}</small>
                    ${t.motivo_jefe ? `<small style="color:#f59e0b"><i class="fas fa-comment-alt"></i> ${window.ZENGO.esc(t.motivo_jefe)}</small>` : ''}
                </div>
                <button class="btn-primary" onclick="AuxiliarView.corregirCiclico('${t.id}')">
                    <i class="fas fa-edit"></i> Corregir
                </button>
            </div>`).join('');
    },

    async corregirCiclico(tareaId) {
        const tarea = await window.db.tareas.get(tareaId);
        if (!tarea) { window.ZENGO?.toast('Tarea no encontrada', 'error'); return; }
        this.tareaActual = tarea;
        this._modoCorreccion = true;
        document.getElementById('tarea-info').textContent = `Categoría: ${tarea.categoria} (Corrigiendo)`;
        document.getElementById('sin-tarea').style.display = 'none';
        document.getElementById('con-tarea').style.display = 'block';
        this.showSection('ciclico');
        this.renderProductos();
        this.actualizarProgreso();
        // En modo corrección siempre mostrar el botón de reenviar
        const fs = document.getElementById('finalizar-section');
        fs.style.display = 'block';
        fs.innerHTML = `<button class="btn-finalizar" onclick="AuxiliarView.reenviarAlJefe()">
            <i class="fas fa-paper-plane"></i> Reenviar al Jefe
        </button>`;
    },

    async reenviarAlJefe() {
        if (!this.tareaActual) return;
        if (!await window.ZENGO?.confirm('¿Reenviar cíclico corregido al Jefe?', 'Confirmar')) return;
        this.tareaActual.estado = 'finalizado_auxiliar';
        this.tareaActual.fecha_finalizacion = new Date().toISOString();
        await window.db.tareas.put(this.tareaActual);
        const synced = await this.syncTareaToSupabase();
        this._modoCorreccion = false;
        window.ZENGO?.toast(synced ? 'Cíclico reenviado al Jefe ✓' : 'Enviado (pendiente sincronizar)', synced ? 'success' : 'warning');
        this.tareaActual = null;
        document.getElementById('con-tarea').style.display = 'none';
        document.getElementById('sin-tarea').style.display = 'block';
        document.getElementById('tarea-info').textContent = 'Cíclico reenviado al Jefe';
        this.showSection('devueltos');
    },

    closeModal() {
        document.querySelectorAll('.modal-overlay').forEach(m => m.style.display = 'none');
        if (this.scannerStream) this.scannerStream.getTracks().forEach(t => t.stop());
    },

    renderModals() {
        return `
        <div id="conteo-modal" class="modal-overlay" style="display:none;"><div class="modal-content glass">
            <div class="modal-header"><h2><i class="fas fa-plus"></i> Agregar Conteo</h2><button class="modal-close" onclick="AuxiliarView.closeModal()"><i class="fas fa-times"></i></button></div>
            <div class="modal-body">
                <div class="conteo-producto-info"><code id="conteo-upc"></code><p id="conteo-desc"></p></div>
                <div class="form-group"><label>Cantidad</label><input type="number" id="conteo-cantidad" min="0" placeholder="0"></div>
                <div class="form-group"><label>Ubicación</label><input type="text" id="conteo-ubicacion" placeholder="Ej: BODEGA, GONDOLA"></div>
            </div>
            <div class="modal-footer"><button class="btn-secondary" onclick="AuxiliarView.closeModal()">Cancelar</button><button class="btn-primary" onclick="AuxiliarView.guardarConteo()"><i class="fas fa-save"></i> Guardar</button></div>
        </div></div>
        <div id="hallazgo-modal" class="modal-overlay" style="display:none;"><div class="modal-content glass">
            <div class="modal-header"><h2><i class="fas fa-exclamation-triangle"></i> Reportar Hallazgo</h2><button class="modal-close" onclick="AuxiliarView.closeModal()"><i class="fas fa-times"></i></button></div>
            <div class="modal-body">
                <p class="text-dim">Producto encontrado fuera de tu cíclico</p>
                <div class="form-group"><label>UPC</label><input type="text" id="hallazgo-upc" placeholder="Código UPC"></div>
                <div class="form-group"><label>SKU (opcional)</label><input type="text" id="hallazgo-sku" placeholder="Código SKU"></div>
                <div class="form-group"><label>Descripción</label><input type="text" id="hallazgo-desc" placeholder="Descripción del producto"></div>
            </div>
            <div class="modal-footer"><button class="btn-secondary" onclick="AuxiliarView.closeModal()">Cancelar</button><button class="btn-primary" onclick="AuxiliarView.guardarHallazgo()"><i class="fas fa-paper-plane"></i> Reportar</button></div>
        </div></div>
`;

    }
};

window.AuxiliarView = AuxiliarView;
console.log('✓ AuxiliarView v1.7.0 cargado');
