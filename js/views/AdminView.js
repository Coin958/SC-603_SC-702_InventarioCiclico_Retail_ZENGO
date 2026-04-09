// ═══════════════════════════════════════════════════════════════
// ZENGO - Vista Administrador
// Dashboard + Gestión de Usuarios (CRUD real contra BD)
// ═══════════════════════════════════════════════════════════════

const AdminView = {

    render(container, state = {}) {
        const session = JSON.parse(localStorage.getItem('zengo_session') || '{}');

        state = {
            diffTotal: 0, precision: 0, lineasContadas: 0, lineasTotales: 0,
            mermaMonetaria: 0, sobraMonetaria: 0, logs: [], ranking: [],
            tareasActivas: 0, auxiliaresActivos: 0,
            ...state
        };

        container.innerHTML = `
        <div class="dashboard-wrapper admin-theme">
            <aside id="sidebar" class="sidebar glass">
                <div class="sidebar-header">
                    <div class="logo">ZEN<span>GO</span></div>
                    <span class="badge-role">ADMIN</span>
                    <button class="toggle-btn" onclick="AdminView.toggleSidebar()"><i class="fas fa-bars"></i></button>
                </div>
                <div class="user-card">
                    <div class="user-avatar admin"><i class="fas fa-user-shield"></i></div>
                    <div class="user-info">
                        <span class="user-name">${session.name || 'Administrador'}</span>
                        <span class="user-role">ADMINISTRADOR</span>
                    </div>
                </div>
                <nav class="sidebar-nav">
                    <a href="#" class="nav-item active" data-section="dashboard" onclick="AdminView.showSection('dashboard')">
                        <i class="fas fa-chart-line"></i> <span>Consola Global</span>
                    </a>
                    <label class="nav-item clickable">
                        <i class="fas fa-file-upload"></i> <span>Cargar NetSuite</span>
                        <input type="file" id="excel-input" hidden accept=".xlsx,.xls,.csv" onchange="AdminController.handleNetsuiteImport(event)">
                    </label>
                    <a href="#" class="nav-item" data-section="consulta" onclick="AdminView.showSection('consulta')">
                        <i class="fas fa-search"></i> <span>Modo Consulta</span>
                    </a>
                    <a href="#" class="nav-item" data-section="ciclicos" onclick="AdminView.showSection('ciclicos')">
                        <i class="fas fa-clipboard-check"></i> <span>Cíclicos Confirmados</span>
                    </a>
                    <a href="#" class="nav-item" data-section="auditoria" onclick="AdminView.showSection('auditoria')">
                        <i class="fas fa-history"></i> <span>Auditoría</span>
                    </a>
                    <a href="#" class="nav-item" data-section="usuarios" onclick="AdminView.showSection('usuarios')">
                        <i class="fas fa-users-cog"></i> <span>Gestión Usuarios</span>
                    </a>
                    <a href="#" class="nav-item" data-section="config" onclick="AdminView.showSection('config')">
                        <i class="fas fa-cog"></i> <span>Configuración</span>
                    </a>
                    <div class="nav-spacer"></div>
                    <a href="#" class="nav-item theme-toggle" onclick="AdminView.toggleTheme()">
                        <i class="fas fa-moon"></i> <span>Modo Oscuro</span>
                    </a>
                    <a href="#" class="nav-item logout" onclick="AuthController.logout()">
                        <i class="fas fa-power-off"></i> <span>Cerrar Sesión</span>
                    </a>
                </nav>
            </aside>
            <main class="main-content">
                <header class="top-header glass">
                    <div class="header-left">
                        <button class="mobile-menu" onclick="AdminView.toggleSidebar()"><i class="fas fa-bars"></i></button>
                        <div>
                            <h1>Panel de <span class="accent-red">Administración</span></h1>
                            <p class="text-dim">Consolidado de Diferencias y Auditoría</p>
                        </div>
                    </div>
                    <div class="header-actions">
                        <div id="sync-container" class="sync-badge online">
                            <div id="sync-dot" class="dot"></div>
                            <span id="sync-text">ONLINE</span>
                        </div>
                        <button class="btn-action" onclick="AdminView.refreshData()"><i class="fas fa-sync-alt"></i></button>
                    </div>
                </header>

                <!-- Dashboard -->
                <div id="section-dashboard" class="section-content">
                    <section class="metrics-grid" style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));">
                        <div class="metric-card glass">
                            <div class="metric-header"><i class="fas fa-coins" style="color:#C8102E;"></i></div>
                            <span class="metric-value" id="metric-valor-inv" style="font-size:1.4rem;">₡0</span>
                            <span class="metric-label">Valor Total Inventario</span>
                        </div>
                        <div class="metric-card glass">
                            <div class="metric-header"><i class="fas fa-boxes" style="color:#3b82f6;"></i></div>
                            <span class="metric-value" id="metric-cant-productos">0</span>
                            <span class="metric-label">Total Productos</span>
                        </div>
                        <div class="metric-card glass glow-warning">
                            <div class="metric-header"><i class="fas fa-arrow-down" style="color:#ef4444;"></i></div>
                            <span class="metric-value text-error" id="metric-merma">-₡${state.mermaMonetaria.toLocaleString()}</span>
                            <span class="metric-label">Merma (Faltante)</span>
                        </div>
                        <div class="metric-card glass">
                            <div class="metric-header"><i class="fas fa-arrow-up" style="color:#10b981;"></i></div>
                            <span class="metric-value text-success" id="metric-sobra">+₡${(state.sobraMonetaria || 0).toLocaleString()}</span>
                            <span class="metric-label">Sobra (Sobrante)</span>
                        </div>
                        <div class="metric-card glass">
                            <div class="metric-header"><i class="fas fa-exclamation-triangle" style="color:#f59e0b;"></i></div>
                            <span class="metric-value" id="metric-hallazgos" style="color:#f59e0b;">0</span>
                            <span class="metric-label">Hallazgos</span>
                        </div>
                    </section>

                    <!-- Ranking de Auxiliares -->
                    <div class="glass" style="padding:24px;border-radius:16px;margin-top:20px;">
                        <div class="section-header" style="margin-bottom:16px;">
                            <h3 style="display:flex;align-items:center;gap:8px;">
                                <i class="fas fa-trophy" style="color:#f59e0b;"></i> Ranking de Auxiliares
                            </h3>
                            <span style="font-size:10px;letter-spacing:1px;text-transform:uppercase;opacity:.5;">Precisión histórica acumulada</span>
                        </div>
                        <div id="admin-ranking-container">
                            <div class="empty-state small"><i class="fas fa-medal"></i><p>Cargando ranking...</p></div>
                        </div>
                    </div>

                    <!-- Gráficos Estadísticos Animados (Fila 1) -->
                    <div class="admin-main-grid" style="grid-template-columns: 2fr 1fr; gap: 20px; margin-top: 20px;">
                        <section class="glass" style="padding:24px; border-radius:16px; position:relative; overflow:hidden;">
                            <div class="section-header" style="margin-bottom:20px;">
                                <h3 style="display:flex;align-items:center;gap:8px;"><i class="fas fa-chart-area" style="color:#C8102E;"></i> Tendencia de Inventario</h3>
                                <span style="font-size:10px;letter-spacing:1px;text-transform:uppercase;opacity:.5;">Balance Mensual CRC</span>
                            </div>
                            <div id="chart-trend" style="width:100%;height:220px;position:relative;"></div>
                        </section>
                        <section class="glass chart-dark-card" style="padding:24px; border-radius:16px; background:linear-gradient(135deg,#0b1c30 0%,#1a1a2e 100%); border:1px solid rgba(255,255,255,0.05);">
                            <h3 class="cdc-title" style="font-size:14px;font-weight:700;margin-bottom:20px;color:#fff;"><i class="fas fa-chart-pie" style="color:#C8102E;margin-right:8px;"></i>Distribución por Categoría</h3>
                            <div id="chart-categories" style="width:100%;"></div>
                        </section>
                    </div>
                    <!-- Gráficos (Fila 2) -->
                    <div class="admin-main-grid" style="grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-top: 20px;">
                        <section class="glass" style="padding:24px; border-radius:16px; position:relative; overflow:hidden;">
                            <div class="section-header" style="margin-bottom:16px;">
                                <h3 style="display:flex;align-items:center;gap:8px;"><i class="fas fa-chart-pie" style="color:#10b981;"></i> Composición Merma</h3>
                            </div>
                            <div id="chart-pie" style="width:100%;height:220px;display:flex;align-items:center;justify-content:center;"></div>
                        </section>
                        <section class="glass" style="padding:24px; border-radius:16px; position:relative; overflow:hidden;">
                            <div class="section-header" style="margin-bottom:16px;">
                                <h3 style="display:flex;align-items:center;gap:8px;"><i class="fas fa-chart-bar" style="color:#3b82f6;"></i> Top 5 Categorías (Unidades)</h3>
                            </div>
                            <div id="chart-bars" style="width:100%;height:220px;position:relative;"></div>
                        </section>
                        <section class="glass" style="padding:24px; border-radius:16px; position:relative; overflow:hidden;">
                            <div class="section-header" style="margin-bottom:16px;">
                                <h3 style="display:flex;align-items:center;gap:8px;"><i class="fas fa-tachometer-alt" style="color:#f59e0b;"></i> Cobertura de Conteo</h3>
                            </div>
                            <div id="chart-donut" style="width:100%;height:220px;display:flex;align-items:center;justify-content:center;"></div>
                        </section>
                    </div>
                </div>

                <!-- Usuarios CRUD -->
                <div id="section-usuarios" class="section-content" style="display:none;">
                    <section class="usuarios-gestion">
                        <div class="section-header">
                            <h2><i class="fas fa-users-cog"></i> Gestión de Usuarios</h2>
                            <button class="btn-primary" onclick="AdminView.showNuevoUsuarioModal()">
                                <i class="fas fa-user-plus"></i> Nuevo Usuario
                            </button>
                        </div>
                        <div class="usuarios-stats">
                            <div class="stat-card glass"><i class="fas fa-user-shield"></i><span class="stat-num" id="count-admins">0</span><span>Admins</span></div>
                            <div class="stat-card glass"><i class="fas fa-user-tie"></i><span class="stat-num" id="count-jefes">0</span><span>Jefes</span></div>
                            <div class="stat-card glass"><i class="fas fa-user"></i><span class="stat-num" id="count-auxiliares">0</span><span>Auxiliares</span></div>
                        </div>
                        <div class="usuarios-table glass">
                            <table class="admin-table">
                                <thead><tr><th>USUARIO</th><th>EMAIL</th><th>ROL</th><th>ESTADO</th><th>ACCIONES</th></tr></thead>
                                <tbody id="usuarios-tbody"><tr><td colspan="5" class="text-center">Cargando...</td></tr></tbody>
                            </table>
                        </div>
                    </section>
                </div>

                <!-- Otras secciones -->
                <!-- CÍCLICOS CONFIRMADOS -->
                <div id="section-ciclicos" class="section-content" style="display:none;">
                    <!-- Vista lista -->
                    <div id="ciclicos-lista-wrap">
                        <div class="section-header">
                            <h2><i class="fas fa-clipboard-check"></i> Cíclicos Confirmados</h2>
                        </div>
                        <div class="glass ciclicos-card">
                            <div id="ciclicos-lista">
                                <div class="empty-state"><i class="fas fa-clipboard-check"></i><p>Cargando...</p></div>
                            </div>
                        </div>
                    </div>
                    <!-- Vista detalle -->
                    <div id="ciclicos-detalle-wrap" style="display:none;">
                        <div class="section-header">
                            <div class="ciclico-header-info">
                                <button class="btn-secondary" onclick="AdminView.cerrarCiclicoAdmin()"><i class="fas fa-arrow-left"></i> Volver</button>
                                <div>
                                    <h2 id="ciclico-titulo" style="margin:0;font-size:18px;"></h2>
                                    <span id="ciclico-meta" class="text-dim"></span>
                                </div>
                            </div>
                            <div style="display:flex;gap:10px;">
                                <button class="btn-danger" onclick="AdminView.rechazarCiclico()">
                                    <i class="fas fa-undo"></i> Devolver al Jefe
                                </button>
                                <button class="btn-export" onclick="AdminController.exportarCiclico(AdminView._ciclicoDetalle)">
                                    <i class="fas fa-file-excel"></i> Exportar Excel
                                </button>
                            </div>
                        </div>
                        <div class="glass ciclicos-card" style="overflow-x:auto;">
                            <table class="admin-table">
                                <thead><tr>
                                    <th>#</th><th>UPC</th><th>SKU</th><th>DESCRIPCIÓN</th>
                                    <th>CAT.</th><th>PRECIO</th><th>EXIST.</th>
                                    <th>CONTADO</th><th>DIFERENCIA</th><th>UBICACIÓN</th><th>HALLAZGO</th>
                                </tr></thead>
                                <tbody id="ciclico-admin-tbody"></tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div id="section-auditoria" class="section-content" style="display:none;">
                    <section class="glass audit-full-wrap" style="padding:30px;">
                        <div class="section-header">
                            <div>
                                <h2><i class="fas fa-history"></i> Auditoría Completa</h2>
                                <p class="text-dim">Trazabilidad de hallazgos, usuarios y conteos</p>
                            </div>
                            <button class="btn-primary" onclick="AdminView.cargarAuditoria()">
                                <i class="fas fa-sync"></i> Recargar
                            </button>
                        </div>

                        <div class="audit-filters-grid">
                            <input id="audit-filter-user" class="filter-input" placeholder="Usuario">
                            <input type="date" id="audit-filter-date" class="filter-input">
                            <select id="audit-filter-action" class="filter-input">
                                <option value="">Todas las actividades</option>
                                <option value="SESIÓN">Sesiones (Login/Logout)</option>
                                <option value="TAREA_COMPLETADA">Cíclicos (asignación, conteo, entrega)</option>
                                <option value="HALLAZGO_REPORTADO">Hallazgos (reporte, aprobación)</option>
                                <option value="CONTEOS">Conteos registrados</option>
                                <option value="IMPORT_PRODUCTOS">Importaciones, Exportaciones y Cierre de Ciclo</option>
                                <option value="CREATE_USER">Gestión de usuarios</option>
                            </select>
                            <input id="audit-filter-text" class="filter-input" placeholder="Buscar en detalle...">
                        </div>

                        <div class="audit-filter-actions">
                            <button class="btn-secondary" onclick="AdminView.aplicarFiltroAuditoria()">Aplicar filtros</button>
                            <button class="btn-secondary" onclick="AdminView.limpiarFiltroAuditoria()">Limpiar</button>
                        </div>

                        <div id="audit-full-container" class="table-holder audit-table-wrap">
                            <div class="empty-state"><i class="fas fa-history"></i><p>Cargando auditoría...</p></div>
                        </div>
                    </section>
                </div>
                <div id="section-config" class="section-content" style="display:none;">
                    <section class="glass" style="padding:30px;">
                        <h2><i class="fas fa-cog"></i> Configuración</h2>
                        <div style="margin-top:20px;">
                            <div style="margin-top:20px; display:flex; gap:10px; flex-wrap:wrap;">
                                <button class="btn-primary" onclick="SyncManager.syncPendientes()">
                                    <i class="fas fa-sync"></i> Forzar Sync
                                </button>

                                <button class="btn-danger" onclick="AdminView.limpiarDBLocal()">
                                    <i class="fas fa-laptop"></i> Limpiar BD Local
                                </button>

                                <button class="btn-danger" onclick="AdminView.cerrarCicloDiario()" style="background:#7f1d1d;">
                                    <i class="fas fa-broom"></i> Cerrar Ciclo Diario
                                </button>
                            </div>
                        </div>
                    </section>
                </div>

                <!-- MODO CONSULTA -->
                <div id="section-consulta" class="section-content" style="display:none;">
                    <section class="consulta-v2-wrap">
                        <div class="consulta-v2-searchbar glass">
                            <input type="text" id="admin-consulta-input" placeholder="Buscar por descripcion, UPC o SKU..." onkeyup="if(event.key==='Enter')AdminView.ejecutarConsulta()">
                            <button class="btn-consultar" style="background:var(--primary)" onclick="AdminView.ejecutarConsulta()">Consultar</button>
                        </div>
                        <div class="consulta-v2-body">
                            <div class="consulta-v2-camera glass">
                                <div class="consulta-v2-cam-header">
                                    <span><i class="fas fa-camera"></i> Escaner</span>
                                    <span class="consulta-activo-badge">Activo</span>
                                </div>
                                <div class="consulta-v2-video-wrap">
                                    <div id="admin-consulta-video"></div>
                                    <div class="consulta-scan-line"></div>
                                </div>
                                <div class="consulta-v2-status" id="admin-consulta-status">
                                    <i class="fas fa-barcode"></i> Apunta al codigo de barras
                                </div>
                            </div>
                            <div class="consulta-v2-resultado glass" id="admin-consulta-resultado">
                                <div class="empty-state"><i class="fas fa-search"></i><p>Busca un producto por descripcion, UPC o SKU</p></div>
                            </div>
                        </div>
                    </section>
                </div>

            </main>
        </div>
        ${this.renderModals()}
        `;
        this.injectStyles();
        this.loadDashboardData();
        this.loadUsuarios();
    },

    // ═══════════════════════════════════════════════════════════
    // RENDER HELPERS
    // ═══════════════════════════════════════════════════════════
    renderLogsTable(logs = []) {
        if (logs.length === 0) return '<div class="empty-state"><i class="fas fa-clipboard-list"></i><p>No hay logs</p></div>';
        return `<table class="admin-table"><thead><tr><th>HORA</th><th>USUARIO</th><th>DETALLE</th></tr></thead><tbody>${logs.map(l => `<tr><td class="mono">${l.hora || ''}</td><td>${l.usuario || 'Sistema'}</td><td class="text-dim" style="font-size:12px">${l.mensaje || '-'}</td></tr>`).join('')}</tbody></table>`;
    },

    renderRanking(ranking = []) {
        if (ranking.length === 0) return '<div class="empty-state small"><i class="fas fa-medal"></i><p>Sin datos</p></div>';
        return ranking.map((u, i) => `<div class="rank-item ${i < 3 ? 'top-' + (i + 1) : ''}"><span class="rank-pos">${i + 1}</span><div class="rank-avatar">${i === 0 ? '<i class="fas fa-crown"></i>' : ''}<span>${(u.nombre || 'U').charAt(0)}</span></div><div class="rank-info"><strong>${u.nombre || 'Usuario'}</strong><small>${u.conteos || 0} conteos</small></div><span class="rank-precision">${u.precision || 0}%</span></div>`).join('');
    },

    renderModals() {
        return `
        <div id="consulta-modal" class="modal-overlay" style="display:none;">
            <div class="modal-content glass">
                <div class="modal-header"><h2><i class="fas fa-search"></i> Consulta</h2><button class="modal-close" onclick="AdminView.closeModal()"><i class="fas fa-times"></i></button></div>
                <div class="modal-body">
                    <div class="consulta-search"><input type="text" id="admin-consulta-input" placeholder="UPC/SKU..."><button class="btn-primary" onclick="AdminView.buscarProducto()"><i class="fas fa-search"></i></button></div>
                    <div id="admin-consulta-resultado"><div class="empty-state"><i class="fas fa-barcode"></i><p>Escanea un producto</p></div></div>
                </div>
            </div>
        </div>
        <div id="usuario-modal" class="modal-overlay" style="display:none;">
            <div class="modal-content glass">
                <div class="modal-header"><h2 id="usuario-modal-title"><i class="fas fa-user-plus"></i> Nuevo Usuario</h2><button class="modal-close" onclick="AdminView.closeModal()"><i class="fas fa-times"></i></button></div>
                <div class="modal-body">
                    <form id="usuario-form">
                        <input type="hidden" id="usuario-id">
                        <div class="form-group"><label>Nombre</label><input type="text" id="usuario-nombre" required></div>
                        <div class="form-group"><label>Apellido</label><input type="text" id="usuario-apellido"></div>
                        <div class="form-group"><label>Email</label><input type="email" id="usuario-email" required></div>
                        <div class="form-group"><label>Contraseña</label><input type="password" id="usuario-password" placeholder="Dejar vacío para mantener"></div>
                        <div class="form-group"><label>Rol</label><select id="usuario-role" required><option value="">Seleccionar...</option><option value="ADMIN">Administrador</option><option value="JEFE">Jefe</option><option value="AUXILIAR">Auxiliar</option></select></div>
                    </form>
                </div>
                <div class="modal-footer"><button class="btn-secondary" onclick="AdminView.closeModal()">Cancelar</button><button class="btn-primary" onclick="AdminView.guardarUsuario()"><i class="fas fa-save"></i> Guardar</button></div>
            </div>
        </div>`;
    },

    // ═══════════════════════════════════════════════════════════
    // CRUD USUARIOS (async - consulta BD real)
    // ═══════════════════════════════════════════════════════════
    async loadUsuarios() {
        try {
            const usuarios = await window.AuthModel.getAllUsers();
            const tbody = document.getElementById('usuarios-tbody');
            if (!tbody) return;

            // Contar por rol (solo activos)
            const activos = usuarios.filter(u => u.activo !== false);
            document.getElementById('count-admins').textContent = activos.filter(u => u.role === 'ADMIN').length;
            document.getElementById('count-jefes').textContent = activos.filter(u => u.role === 'JEFE').length;
            document.getElementById('count-auxiliares').textContent = activos.filter(u => u.role === 'AUXILIAR').length;

            if (activos.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center">Sin usuarios</td></tr>';
                return;
            }

            tbody.innerHTML = activos.map(u => `
                <tr data-id="${u.id}">
                    <td>
                        <div class="user-cell">
                            <div class="user-avatar-mini ${u.role.toLowerCase()}">${(u.nombre || 'U').charAt(0)}</div>
                            <span>${u.nombre} ${u.apellido || ''}</span>
                        </div>
                    </td>
                    <td><code>${u.email}</code></td>
                    <td><span class="role-badge ${u.role.toLowerCase()}">${u.role}</span></td>
                    <td><span class="status-badge ${u.activo !== false ? 'active' : 'inactive'}">${u.activo !== false ? 'Activo' : 'Inactivo'}</span></td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-icon edit" onclick="AdminView.editarUsuario(${u.id})"><i class="fas fa-edit"></i></button>
                            ${u.id !== 1 ? `<button class="btn-icon delete" onclick="AdminView.eliminarUsuario(${u.id})"><i class="fas fa-trash"></i></button>` : ''}
                        </div>
                    </td>
                </tr>
            `).join('');
        } catch (err) {
            console.error('Error cargando usuarios:', err);
            const tbody = document.getElementById('usuarios-tbody');
            if (tbody) tbody.innerHTML = '<tr><td colspan="5" class="text-center text-error">Error al cargar usuarios</td></tr>';
        }
    },

    showNuevoUsuarioModal() {
        document.getElementById('usuario-modal-title').innerHTML = '<i class="fas fa-user-plus"></i> Nuevo Usuario';
        document.getElementById('usuario-form').reset();
        document.getElementById('usuario-id').value = '';
        document.getElementById('usuario-modal').style.display = 'flex';
    },

    async editarUsuario(userId) {
        const u = await window.AuthModel.getUserById(userId);
        if (!u) return;
        document.getElementById('usuario-modal-title').innerHTML = '<i class="fas fa-user-edit"></i> Editar Usuario';
        document.getElementById('usuario-id').value = u.id;
        document.getElementById('usuario-nombre').value = u.nombre;
        document.getElementById('usuario-apellido').value = u.apellido || '';
        document.getElementById('usuario-email').value = u.email;
        document.getElementById('usuario-password').value = '';
        document.getElementById('usuario-role').value = u.role;
        document.getElementById('usuario-modal').style.display = 'flex';
    },

    async guardarUsuario() {
        const id = document.getElementById('usuario-id').value;
        const nombre = document.getElementById('usuario-nombre').value.trim();
        const apellido = document.getElementById('usuario-apellido').value.trim();
        const email = document.getElementById('usuario-email').value.trim();
        const password = document.getElementById('usuario-password').value;
        const role = document.getElementById('usuario-role').value;

        if (!nombre || !email || !role) {
            window.ZENGO?.toast('Completa los campos requeridos', 'error');
            return;
        }

        const userData = { nombre, apellido, email, role };
        if (password) userData.password = password;

        if (id) {
            await window.AdminController.actualizarUsuario(parseInt(id), userData);
        } else {
            userData.password = password || '123';
            await window.AdminController.crearUsuario(userData);
        }

        this.closeModal();
        this.loadUsuarios();
    },

    async eliminarUsuario(userId) {
        const result = await window.AdminController.eliminarUsuario(userId);
        if (result) this.loadUsuarios();
    },

    // ═══════════════════════════════════════════════════════════
    // UI FUNCTIONS
    // ═══════════════════════════════════════════════════════════
    toggleSidebar() { document.getElementById('sidebar').classList.toggle('collapsed'); },
    toggleTheme() { document.body.classList.toggle('light-mode'); this.loadDashboardData(); },

    showSection(sectionId) {
        ScannerController.detenerScannerConsulta();
        document.querySelectorAll('.section-content').forEach(s => s.style.display = 'none');
        const section = document.getElementById(`section-${sectionId}`);
        if (section) section.style.display = 'block';
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        document.querySelector(`[data-section="${sectionId}"]`)?.classList.add('active');
        if (sectionId === 'auditoria') this.cargarAuditoria();
        if (sectionId === 'consulta') this._iniciarScannerConsulta();
        if (sectionId === 'usuarios') this.loadUsuarios();
        if (sectionId === 'ciclicos') this.loadCiclicosConfirmados();
    },

    closeModal() { document.querySelectorAll('.modal-overlay').forEach(m => m.style.display = 'none'); },
    filterLogs(q) { document.querySelectorAll('.log-row').forEach(r => r.style.display = r.innerText.toLowerCase().includes(q.toLowerCase()) ? '' : 'none'); },
    async refreshData() {
        window.ZENGO?.toast('Actualizando...', 'info');
        await window.SyncManager?.syncPendientes?.();
        await window.JefeView?.syncProductosFromSupabase?.();
        await window.JefeView?.syncTareasFromSupabase?.();
        await this.loadDashboardData();
        window.ZENGO?.toast('Actualizado', 'success');
    },

    // ═══ MODO CONSULTA ═══
    async ejecutarConsulta() {
        const term = document.getElementById('admin-consulta-input')?.value.trim();
        if (!term) return;
        const panel = document.getElementById('admin-consulta-resultado');
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
            `<div class="consulta-lista-item" onclick="AdminView.verDetalleConsulta('${p.upc}')">
                <span class="consulta-lista-upc">${p.upc || '—'}</span>
                <span class="consulta-lista-desc">${p.descripcion || '—'}</span>
                <span class="consulta-lista-meta">₡${(p.precio || 0).toLocaleString()} · Existencia: ${p.existencia || 0}</span>
            </div>`).join('')}</div>`;
    },

    async verDetalleConsulta(upc) {
        const r = await ScannerController.consultarProducto(upc);
        const panel = document.getElementById('admin-consulta-resultado');
        if (r.encontrado) panel.innerHTML = ScannerController.renderConsultaDetalle(r.producto, r.ubicaciones);
    },

    _iniciarScannerConsulta() {
        ScannerController.iniciarScannerConsulta('admin-consulta-video', (code) => {
            document.getElementById('admin-consulta-status').innerHTML =
                `<i class="fas fa-check-circle" style="color:var(--success)"></i> Detectado: <code>${code}</code>`;
            this.verDetalleConsulta(code);
        });
    },

    async loadDashboardData() {
        try {
            const productos = await window.db.productos.toArray();
            const tareas = await window.db.tareas.toArray();
            const productosMap = new Map(productos.map(p => [p.upc, p]));

            let mermaMonetaria = 0, sobraMonetaria = 0, totalHallazgos = 0;

            // Calcular merma/sobra desde tareas.productos (excluir canceladas)
            // Los datos de conteo viven en tareas.productos[].conteos, no en conteos_realizados
            const tareasConDatos = tareas.filter(t => t.estado !== 'cancelado');
            tareasConDatos.forEach(t => {
                (t.productos || []).forEach(p => {
                    if (p.es_hallazgo) {
                        totalHallazgos++;
                        // Hallazgo aprobado con precio → contribuye a sobra monetaria
                        if (p.hallazgo_estado === 'aprobado' && p.valor_hallazgo) {
                            sobraMonetaria += p.valor_hallazgo;
                        }
                    } else if (p.conteos && p.conteos.length > 0) {
                        // Producto normal con conteos registrados
                        const prod = productosMap.get(p.upc);
                        const precio = prod?.precio || p.precio || 0;
                        const diff = (p.total || 0) - (p.existencia || 0);
                        if (diff < 0) mermaMonetaria += Math.abs(diff) * precio;
                        else if (diff > 0) sobraMonetaria += diff * precio;
                    }
                });
            });

            // Valor Total Inventario
            const valorTotal = productos.reduce((acc, p) => acc + ((p.precio || 0) * (p.existencia || 0)), 0);

            // Actualizar KPIs financieros
            const elValor = document.getElementById('metric-valor-inv');
            if (elValor) elValor.textContent = '₡' + valorTotal.toLocaleString();
            const elCant = document.getElementById('metric-cant-productos');
            if (elCant) elCant.textContent = productos.length.toLocaleString();
            const elMerma = document.getElementById('metric-merma');
            if (elMerma) elMerma.textContent = '-₡' + mermaMonetaria.toLocaleString();
            const elSobra = document.getElementById('metric-sobra');
            if (elSobra) elSobra.textContent = '+₡' + sobraMonetaria.toLocaleString();
            const elHallazgos = document.getElementById('metric-hallazgos');
            if (elHallazgos) elHallazgos.textContent = totalHallazgos;

            // Renderizar gráficos animados (mantener compatibilidad de parámetros)
            const conteosFlat = [];
            tareasConDatos.forEach(t => {
                (t.productos || []).forEach(p => {
                    if (!p.es_hallazgo && p.conteos?.length > 0) {
                        conteosFlat.push({ upc: p.upc, cantidad: p.total || 0 });
                    }
                });
            });
            this.renderTrendChart(tareasConDatos);
            this.renderCategoryChart(productos);
            this.renderPieChart(mermaMonetaria, sobraMonetaria);
            this.renderBarChart(productos);
            this.renderDonutChart(productos, conteosFlat);

            // Ranking de auxiliares
            this.loadRanking();
        } catch (err) { console.error('Error dashboard:', err); }
    },

    async loadRanking() {
        const container = document.getElementById('admin-ranking-container');
        if (!container) return;
        try {
            let todos = [];

            // Intentar desde Supabase
            if (navigator.onLine && window.supabaseClient) {
                const { data } = await window.supabaseClient
                    .from('estadisticas_auxiliares')
                    .select('*')
                    .order('score_ranking', { ascending: false });
                if (data?.length) todos = data;
            }

            // Fallback: Dexie local
            if (!todos.length) {
                todos = await window.db.estadisticas_auxiliares
                    .orderBy('score_ranking').reverse().toArray();
            }

            if (!todos.length) {
                container.innerHTML = '<div class="empty-state small"><i class="fas fa-medal"></i><p>Sin datos de ranking aún. Los auxiliares acumulan estadísticas al completar cíclicos.</p></div>';
                return;
            }

            const medals = ['🥇', '🥈', '🥉'];
            const scoreColor = s => s >= 95 ? '#10b981' : s >= 85 ? '#f59e0b' : '#ef4444';

            container.innerHTML = `
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>AUXILIAR</th>
                            <th>CÍCLICOS</th>
                            <th>PREC. ABSOLUTA</th>
                            <th>PREC. NETA</th>
                            <th>SCORE</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${todos.map((a, i) => `
                            <tr>
                                <td><strong>${medals[i] || (i + 1)}</strong></td>
                                <td>${a.auxiliar_nombre || '—'}</td>
                                <td>${a.total_ciclicos || 0}</td>
                                <td><span style="color:${scoreColor(a.promedio_pa || 0)};font-weight:700;">${a.promedio_pa || 0}%</span></td>
                                <td><span style="color:${scoreColor(a.promedio_pn || 0)};font-weight:700;">${a.promedio_pn || 0}%</span></td>
                                <td><strong style="color:${scoreColor(a.score_ranking || 0)};font-size:15px;">${a.score_ranking || 0}%</strong></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } catch (e) {
            console.error('Error loadRanking Admin:', e);
            container.innerHTML = '<div class="empty-state small"><i class="fas fa-exclamation-triangle"></i><p>Error cargando ranking</p></div>';
        }
    },

    // ═══ GRÁFICOS SVG ANIMADOS ═══
    // renderTrendChart — Productos contados por día (últimos 7 días, datos reales)
    renderTrendChart(tareas = []) {
        const container = document.getElementById('chart-trend');
        if (!container) return;
        const isLight = document.body.classList.contains('light-mode');
        const w = container.offsetWidth || 600;
        const h = 200;
        const txtColor = isLight ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.35)';
        const gridColor = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.04)';

        // Construir últimos 7 días
        const days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return {
                label: d.toLocaleDateString('es-CR', { weekday: 'short' }).toUpperCase().slice(0, 3),
                date: d.toISOString().slice(0, 10),
                count: 0
            };
        });

        // Contar productos contados por día de finalización de tarea
        tareas.forEach(t => {
            const fechaRef = (t.fecha_finalizacion || t.fecha_aprobacion || '').slice(0, 10);
            if (!fechaRef) return;
            const day = days.find(d => d.date === fechaRef);
            if (day) {
                (t.productos || []).forEach(p => {
                    if (p.conteos && p.conteos.length > 0) day.count++;
                });
            }
        });

        const data = days.map(d => d.count);
        const labels = days.map(d => d.label);
        const totalContados = data.reduce((s, v) => s + v, 0);
        const max = Math.max(...data, 1);
        const points = data.map((v, i) => ({ x: (i / (data.length - 1)) * w, y: h - (v / max) * (h * 0.85) }));
        const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
        const areaPath = linePath + ` L ${w} ${h} L 0 ${h} Z`;
        const flatLine = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${h}`).join(' ');
        const flatArea = flatLine + ` L ${w} ${h} L 0 ${h} Z`;

        container.innerHTML = `
            <svg viewBox="0 0 ${w} ${h + 30}" style="width:100%;height:100%;overflow:visible;">
                <defs>
                    <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#C8102E" stop-opacity="0.3"/>
                        <stop offset="100%" stop-color="#C8102E" stop-opacity="0"/>
                    </linearGradient>
                </defs>
                ${[0, 0.25, 0.5, 0.75, 1].map(f => `<line x1="0" y1="${h - f * h * 0.85}" x2="${w}" y2="${h - f * h * 0.85}" stroke="${gridColor}" stroke-width="1"/>
                    <text x="0" y="${h - f * h * 0.85 - 3}" fill="${txtColor}" font-size="8">${Math.round(f * max)}</text>`).join('')}
                <path d="${flatArea}" fill="url(#tg)">
                    <animate attributeName="d" from="${flatArea}" to="${areaPath}" dur="1.2s" fill="freeze" calcMode="spline" keySplines="0.42 0 0.58 1"/>
                </path>
                <path d="${flatLine}" fill="none" stroke="#C8102E" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <animate attributeName="d" from="${flatLine}" to="${linePath}" dur="1.2s" fill="freeze" calcMode="spline" keySplines="0.42 0 0.58 1"/>
                </path>
                ${points.map((p, i) => `
                    <circle cx="${p.x}" cy="${h}" r="5" fill="${isLight ? '#fff' : '#1a1a2e'}" stroke="#C8102E" stroke-width="2.5" opacity="0">
                        <animate attributeName="cy" from="${h}" to="${p.y}" dur="1.2s" fill="freeze" calcMode="spline" keySplines="0.42 0 0.58 1"/>
                        <animate attributeName="opacity" from="0" to="1" dur="0.3s" begin="0.8s" fill="freeze"/>
                    </circle>
                    ${data[i] > 0 ? `<text x="${p.x}" y="${h}" text-anchor="middle" fill="#C8102E" font-size="9" font-weight="800" opacity="0">
                        ${data[i]}
                        <animate attributeName="y" from="${h}" to="${p.y - 10}" dur="1.2s" fill="freeze" calcMode="spline" keySplines="0.42 0 0.58 1"/>
                        <animate attributeName="opacity" from="0" to="1" dur="0.3s" begin="1s" fill="freeze"/>
                    </text>` : ''}
                `).join('')}
                ${labels.map((l, i) => `<text x="${points[i].x}" y="${h + 22}" text-anchor="middle" fill="${txtColor}" font-size="9" font-weight="700" letter-spacing="1">${l}</text>`).join('')}
                <text x="${w}" y="${h + 22}" text-anchor="end" fill="${txtColor}" font-size="8">Total 7d: ${totalContados} prod.</text>
            </svg>
        `;
    },

    renderCategoryChart(productos = []) {
        const container = document.getElementById('chart-categories');
        if (!container) return;
        const catMap = {};
        productos.forEach(p => {
            const cat = (p.categoria || 'OTROS').trim().toUpperCase();
            if (!catMap[cat]) catMap[cat] = 0;
            catMap[cat] += (p.precio || 0) * (p.existencia || 0);
        });
        const allEntries = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
        const total = allEntries.reduce((s, e) => s + e[1], 0) || 1;
        let entries = allEntries.slice(0, 5);
        if (entries.length === 0) entries = [['SIN DATOS', 1]];
        const colors = ['#C8102E', '#10b981', '#3b82f6', '#f59e0b', '#94a3b8'];

        container.innerHTML = entries.map((e, i) => {
            const pct = Math.round((e[1] / total) * 100);
            const monto = '₡' + Math.round(e[1]).toLocaleString();
            return `
                <div style="margin-bottom:16px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                        <span class="cdc-cat" style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.55);text-transform:uppercase;letter-spacing:1px;">${e[0]}</span>
                        <div style="display:flex;gap:8px;align-items:center;">
                            <span class="cdc-pct" style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.35);">${pct}%</span>
                            <span class="cdc-monto" style="font-size:12px;font-weight:800;color:#fff;">${monto}</span>
                        </div>
                    </div>
                    <div class="cdc-bar-bg" style="width:100%;height:6px;background:rgba(255,255,255,0.05);border-radius:4px;overflow:hidden;">
                        <div style="width:0%;height:100%;border-radius:4px;background:${colors[i] || '#C8102E'};transition:width 1.2s cubic-bezier(0.42,0,0.58,1);" class="cat-bar" data-width="${pct}"></div>
                    </div>
                </div>
            `;
        }).join('') + `
            <div class="cdc-footer" style="margin-top:20px;padding-top:14px;border-top:1px solid rgba(255,255,255,0.06);display:flex;justify-content:space-between;align-items:center;">
                <span class="cdc-footer-label" style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.35);text-transform:uppercase;">Valor Total Cargado</span>
                <span class="cdc-footer-val" style="font-size:14px;font-weight:900;color:#fff;">₡${Math.round(total).toLocaleString()}</span>
            </div>
        `;
        setTimeout(() => {
            container.querySelectorAll('.cat-bar').forEach(bar => {
                bar.style.width = bar.dataset.width + '%';
            });
        }, 100);
    },

    // ═══ PIE CHART — Composición Merma ═══
    renderPieChart(merma = 0, sobra = 0) {
        const container = document.getElementById('chart-pie');
        if (!container) return;
        const isLight = document.body.classList.contains('light-mode');
        const txtColor = isLight ? '#1a1a1a' : '#fff';
        const txtDim = isLight ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)';
        const total = merma + sobra || 1;
        const mermaPct = merma / total;
        const sobraPct = sobra / total;
        const r = 80, cx = 100, cy = 100;
        // Arc calculations
        // El donut usa stroke-dasharray con mermaPct/sobraPct directamente

        container.innerHTML = `
            <svg viewBox="0 0 200 220" style="width:200px;height:220px;">
                <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'}" stroke-width="28"/>
                <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#ef4444" stroke-width="28" stroke-dasharray="${mermaPct * 2 * Math.PI * r} ${2 * Math.PI * r}" stroke-dashoffset="0" transform="rotate(-90 ${cx} ${cy})" stroke-linecap="round" opacity="0">
                    <animate attributeName="opacity" from="0" to="1" dur="0.5s" fill="freeze"/>
                    <animate attributeName="stroke-dasharray" from="0 ${2 * Math.PI * r}" to="${mermaPct * 2 * Math.PI * r} ${2 * Math.PI * r}" dur="1s" fill="freeze" calcMode="spline" keySplines="0.42 0 0.58 1"/>
                </circle>
                <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#10b981" stroke-width="28" stroke-dasharray="${sobraPct * 2 * Math.PI * r} ${2 * Math.PI * r}" stroke-dashoffset="${-mermaPct * 2 * Math.PI * r}" transform="rotate(-90 ${cx} ${cy})" stroke-linecap="round" opacity="0">
                    <animate attributeName="opacity" from="0" to="1" dur="0.5s" begin="0.5s" fill="freeze"/>
                    <animate attributeName="stroke-dasharray" from="0 ${2 * Math.PI * r}" to="${sobraPct * 2 * Math.PI * r} ${2 * Math.PI * r}" dur="1s" begin="0.3s" fill="freeze" calcMode="spline" keySplines="0.42 0 0.58 1"/>
                </circle>
                <text x="${cx}" y="${cy - 5}" text-anchor="middle" fill="${txtColor}" font-size="16" font-weight="900">${Math.round(mermaPct * 100)}%</text>
                <text x="${cx}" y="${cy + 12}" text-anchor="middle" fill="${txtDim}" font-size="8" font-weight="700" letter-spacing="1">FALTANTE</text>
                <circle cx="30" cy="205" r="5" fill="#ef4444"/>
                <text x="42" y="209" fill="${txtDim}" font-size="9" font-weight="600">Faltante ₡${merma.toLocaleString()}</text>
                <circle cx="30" cy="220" r="5" fill="#10b981"/>
                <text x="42" y="224" fill="${txtDim}" font-size="9" font-weight="600">Sobrante ₡${sobra.toLocaleString()}</text>
            </svg>
        `;
    },

    // ═══ BAR CHART — Top 5 Categorías por cantidad de SKUs (de más a menos productos) ═══
    renderBarChart(productos = []) {
        const container = document.getElementById('chart-bars');
        if (!container) return;
        const isLight = document.body.classList.contains('light-mode');
        const txtColor = isLight ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.4)';
        const valColor = isLight ? '#1a1a1a' : '#fff';
        const catMap = {};
        productos.forEach(p => {
            const cat = (p.categoria || 'OTROS').trim().toUpperCase();
            if (!catMap[cat]) catMap[cat] = 0;
            catMap[cat]++; // contar SKUs por categoría, no unidades
        });
        const entries = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
        if (!entries.length) { container.innerHTML = '<div style="text-align:center;opacity:.4;padding-top:60px;">Sin datos</div>'; return; }
        const maxVal = Math.max(...entries.map(e => e[1])) || 1;
        const colors = ['#C8102E', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
        const barH = 30, gap = 12;
        const w = container.offsetWidth || 400;
        const totalH = entries.length * (barH + gap);

        container.innerHTML = `
            <svg viewBox="0 0 ${w} ${totalH}" style="width:100%;height:100%;overflow:visible;">
                ${entries.map((e, i) => {
            const barW = (e[1] / maxVal) * (w - 120);
            const y = i * (barH + gap);
            return `
                        <text x="0" y="${y + barH / 2 + 4}" fill="${txtColor}" font-size="9" font-weight="700" letter-spacing="0.5">${e[0].substring(0, 12)}</text>
                        <rect x="100" y="${y + 4}" width="0" height="${barH - 8}" rx="4" fill="${colors[i]}" opacity="0.85">
                            <animate attributeName="width" from="0" to="${barW}" dur="1s" fill="freeze" begin="${i * 0.1}s" calcMode="spline" keySplines="0.42 0 0.58 1"/>
                        </rect>
                        <text x="${100 + barW + 8}" y="${y + barH / 2 + 4}" fill="${valColor}" font-size="11" font-weight="800" opacity="0">
                            ${e[1]} SKUs
                            <animate attributeName="opacity" from="0" to="1" dur="0.3s" begin="${0.8 + i * 0.1}s" fill="freeze"/>
                        </text>
                    `;
        }).join('')}
            </svg>
        `;
    },

    // ═══ DONUT GAUGE — Cobertura de Conteo ═══
    renderDonutChart(productos = [], conteos = []) {
        const container = document.getElementById('chart-donut');
        if (!container) return;
        const isLight = document.body.classList.contains('light-mode');
        const txtColor = isLight ? '#1a1a1a' : '#fff';
        const txtDim = isLight ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.45)';
        const totalProds = productos.length || 1;
        const contados = new Set(conteos.map(c => c.upc)).size;
        const pct = Math.min(Math.round((contados / totalProds) * 100), 100);
        const r = 75, cx = 100, cy = 100;
        const circ = 2 * Math.PI * r;
        const fillLen = (pct / 100) * circ;
        const color = pct > 75 ? '#10b981' : pct > 40 ? '#f59e0b' : '#ef4444';

        container.innerHTML = `
            <svg viewBox="0 0 200 210" style="width:200px;height:210px;">
                <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}" stroke-width="14"/>
                <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="14" stroke-dasharray="0 ${circ}" stroke-linecap="round" transform="rotate(-90 ${cx} ${cy})">
                    <animate attributeName="stroke-dasharray" from="0 ${circ}" to="${fillLen} ${circ}" dur="1.5s" fill="freeze" calcMode="spline" keySplines="0.42 0 0.58 1"/>
                </circle>
                <text x="${cx}" y="${cy - 6}" text-anchor="middle" fill="${txtColor}" font-size="28" font-weight="900">${pct}%</text>
                <text x="${cx}" y="${cy + 12}" text-anchor="middle" fill="${txtDim}" font-size="8" font-weight="700" letter-spacing="1">COBERTURA</text>
                <text x="${cx}" y="205" text-anchor="middle" fill="${txtDim}" font-size="9" font-weight="600">${contados.toLocaleString()} de ${totalProds.toLocaleString()} productos contados</text>
            </svg>
        `;
    },

    async limpiarDBLocal() {
        const ok = await window.ZENGO?.confirm(
            '¿Eliminar TODOS los datos locales de este navegador?',
            'Confirmar'
        );
        if (!ok) return;

        await window.db.clearAll();
        window.ZENGO?.toast('Base local limpiada', 'success');
        await this.loadDashboardData();
    },

    async cerrarCicloDiario() {
        const ok = await window.ZENGO?.confirm(
            'Esto eliminará productos, tareas, hallazgos y conteos tanto de Supabase como de la base local. Úsalo solo al cierre del día. ¿Deseas continuar?',
            'Cerrar ciclo diario'
        );
        if (!ok) return;

        const result = await window.AdminController.cerrarCicloDiario();

        if (result?.ok) {
            window.ZENGO?.toast('Ciclo diario cerrado correctamente', 'success');
            await this.loadDashboardData();
        } else {
            window.ZENGO?.toast(result?.error || 'No se pudo cerrar el ciclo', 'error');
        }
    },

    // ═══════════════════════════════════════════════════════════
    // CÍCLICOS CONFIRMADOS
    // Carga desde Supabase (multi-dispositivo); Dexie como fallback offline
    // ═══════════════════════════════════════════════════════════
    async loadCiclicosConfirmados() {
        const listEl = document.getElementById('ciclicos-lista');
        if (!listEl) return;
        listEl.innerHTML = '<div class="empty-state"><i class="fas fa-spinner fa-spin"></i><p>Cargando...</p></div>';

        let tareas = [];
        try {
            if (navigator.onLine && window.supabaseClient) {
                const { data, error } = await window.supabaseClient
                    .from('tareas')
                    .select('*')
                    .eq('estado', 'aprobado_jefe')
                    .order('fecha_aprobacion', { ascending: false });
                if (!error && data?.length) tareas = data;
            }
            if (!tareas.length) {
                const local = await window.db.tareas.toArray();
                tareas = local
                    .filter(t => t.estado === 'aprobado_jefe')
                    .sort((a, b) => new Date(b.fecha_aprobacion) - new Date(a.fecha_aprobacion));
            }
        } catch (e) { console.error('Error cargando cíclicos:', e); }

        this._ciclicosTareas = tareas;

        if (!tareas.length) {
            listEl.innerHTML = '<div class="empty-state"><i class="fas fa-clipboard-check"></i><p>No hay cíclicos confirmados aún</p></div>';
            return;
        }

        listEl.innerHTML = `
            <table class="admin-table">
                <thead><tr>
                    <th>CATEGORÍA</th><th>AUXILIAR</th><th>CONFIRMADO POR</th>
                    <th>PRODUCTOS</th><th>FECHA</th><th>ACCIÓN</th>
                </tr></thead>
                <tbody>
                    ${tareas.map(t => {
            const prods = t.productos || [];
            const contados = prods.filter(p => p.conteos?.length > 0).length;
            return `<tr>
                            <td><strong>${t.categoria || '—'}</strong></td>
                            <td>${t.auxiliar_nombre || '—'}</td>
                            <td>${t.aprobado_por || '—'}</td>
                            <td>${contados} / ${prods.length}</td>
                            <td class="mono">${t.fecha_aprobacion ? new Date(t.fecha_aprobacion).toLocaleDateString('es-CR') : '—'}</td>
                            <td>
                                <button class="btn-revisar" onclick="AdminView.abrirCiclicoAdmin('${t.id}')">
                                    <i class="fas fa-eye"></i> Revisar
                                </button>
                            </td>
                        </tr>`;
        }).join('')}
                </tbody>
            </table>`;
    },

    abrirCiclicoAdmin(id) {
        const tarea = this._ciclicosTareas?.find(t => String(t.id) === String(id));
        if (!tarea) return;
        this._ciclicoDetalle = tarea;

        document.getElementById('ciclicos-lista-wrap').style.display = 'none';
        document.getElementById('ciclicos-detalle-wrap').style.display = 'block';
        document.getElementById('ciclico-titulo').textContent = `${tarea.categoria || '—'} — ${tarea.auxiliar_nombre || '—'}`;
        document.getElementById('ciclico-meta').textContent =
            `Confirmado por ${tarea.aprobado_por || '—'} · ${tarea.fecha_aprobacion ? new Date(tarea.fecha_aprobacion).toLocaleString('es-CR') : ''}`;
        document.getElementById('ciclico-admin-tbody').innerHTML = this.renderTablaAdmin(tarea.productos || []);
    },

    cerrarCiclicoAdmin() {
        this._ciclicoDetalle = null;
        document.getElementById('ciclicos-detalle-wrap').style.display = 'none';
        document.getElementById('ciclicos-lista-wrap').style.display = 'block';
    },

    async rechazarCiclico() {
        if (!this._ciclicoDetalle) return;
        const motivo = prompt('Motivo del rechazo (requerido):');
        if (!motivo || !motivo.trim()) return;
        const session = JSON.parse(localStorage.getItem('zengo_session') || '{}');
        const tarea = this._ciclicoDetalle;
        const cambios = {
            estado: 'devuelto_admin',
            motivo_rechazo: motivo.trim(),
            rechazado_por: session.name || 'Admin',
            fecha_rechazo: new Date().toISOString()
        };
        try {
            if (navigator.onLine && window.supabaseClient) {
                await window.supabaseClient.from('tareas').update(cambios).eq('id', tarea.id);
            }
        } catch (e) { console.error('Error sync rechazo admin:', e); }
        await window.db.tareas.update(tarea.id, cambios);

        try {
            await window.LogController?.registrar({
                tabla: 'tareas',
                accion: 'TAREA_DEVUELTA',
                registro_id: tarea.id,
                usuario_id: session.id || null,
                usuario_nombre: session.name || 'Admin',
                datos_nuevos: {
                    categoria: tarea.categoria,
                    auxiliar_nombre: tarea.auxiliar_nombre,
                    motivo_rechazo: motivo.trim(),
                    productos_total: tarea.productos_total || (tarea.productos || []).length
                }
            });
        } catch (e) { console.warn('Error log devolver ciclico:', e); }

        window.ZENGO?.toast('Devuelto al Jefe ✓', 'success');
        this.cerrarCiclicoAdmin();
        await this.loadCiclicosConfirmados();
    },

    renderTablaAdmin(productos) {
        if (!productos.length) return '<tr><td colspan="11" class="text-center">Sin productos</td></tr>';
        return productos.map((p, i) => {
            const total = p.total ?? (p.conteos?.reduce((s, c) => s + (c.cantidad || 0), 0) ?? 0);
            const diferencia = total - (p.existencia || 0);
            const diffClass = diferencia < 0 ? 'text-error' : diferencia > 0 ? 'text-success' : '';
            const ubicaciones = p.conteos?.length
                ? [...new Set(p.conteos.map(c => c.ubicacion).filter(Boolean))].join(', ')
                : '—';
            const hallazgo = p.hallazgo_estado
                ? `<span class="status-badge ${p.hallazgo_estado === 'aprobado' ? 'active' : 'inactive'}">${p.hallazgo_estado}</span>`
                : '—';
            return `<tr>
                <td>${i + 1}</td>
                <td class="mono" style="font-size:11px">${p.upc || '—'}</td>
                <td>${p.sku || '—'}</td>
                <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${p.descripcion || ''}">${p.descripcion || '—'}</td>
                <td>${p.categoria || '—'}</td>
                <td>₡${(p.precio || 0).toLocaleString()}</td>
                <td>${p.existencia || 0}</td>
                <td><strong>${total}</strong></td>
                <td class="${diffClass}"><strong>${diferencia >= 0 ? '+' : ''}${diferencia}</strong></td>
                <td>${ubicaciones}</td>
                <td>${hallazgo}</td>
            </tr>`;
        }).join('');
    },

    // Vistas para Logs

    async cargarAuditoria() {
        const logs = await window.LogController.obtenerTodos();
        const container = document.getElementById('audit-full-container');
        if (!container) return;
        container.innerHTML = this.renderAuditoriaTable(logs);
    },

    async aplicarFiltroAuditoria() {
        const usuario = document.getElementById('audit-filter-user')?.value?.trim() || '';
        const group = document.getElementById('audit-filter-action')?.value || '';
        const fecha = document.getElementById('audit-filter-date')?.value || '';
        const texto = document.getElementById('audit-filter-text')?.value?.trim() || '';

        // Mapeo de grupos a acciones reales
        let accion = group;
        if (group === 'SESIÓN') accion = ['LOGIN', 'LOGOUT', 'FAILED_LOGIN'];
        if (group === 'HALLAZGO_REPORTADO') accion = ['HALLAZGO_REPORTADO', 'HALLAZGO_APROBADO', 'HALLAZGO_RECHAZADO', 'HALLAZGO_AGREGADO_JEFE'];
        if (group === 'TAREA_COMPLETADA') accion = ['TAREA_ASIGNADA', 'TAREA_INICIADA', 'TAREA_COMPLETADA', 'TAREA_APROBADA', 'TAREA_RECHAZADA', 'TAREA_DEVUELTA', 'TAREA_CANCELADA'];
        if (group === 'CONTEOS') accion = ['CONTEO_REGISTRADO', 'CONTEO_EDITADO', 'CONTEO_ELIMINADO', 'CONTEO_AGREGADO_REVISION', 'CONTEO_EDITADO_REVISION', 'CONTEO_ELIMINADO_REVISION'];
        if (group === 'IMPORT_PRODUCTOS') accion = ['IMPORT_PRODUCTOS', 'EXPORT_CICLICO', 'CICLO_CERRADO'];
        if (group === 'CREATE_USER') accion = ['CREATE_USER', 'UPDATE_USER', 'DELETE_USER'];

        const logs = await window.LogController.filtrar({ usuario, accion, texto, fecha });
        const container = document.getElementById('audit-full-container');
        if (!container) return;
        container.innerHTML = this.renderAuditoriaTable(logs);
    },

    async limpiarFiltroAuditoria() {
        if (document.getElementById('audit-filter-user')) document.getElementById('audit-filter-user').value = '';
        if (document.getElementById('audit-filter-date')) document.getElementById('audit-filter-date').value = '';
        if (document.getElementById('audit-filter-action')) document.getElementById('audit-filter-action').value = '';
        if (document.getElementById('audit-filter-text')) document.getElementById('audit-filter-text').value = '';
        await this.cargarAuditoria();
    },

    renderAuditoriaTable(logs = []) {
        if (!logs.length) {
            return '<div class="empty-state"><i class="fas fa-history"></i><p>No hay registros</p></div>';
        }

        return `
        <table class="admin-table audit-admin-table">
            <thead>
                <tr>
                    <th>FECHA / HORA</th>
                    <th>USUARIO</th>
                    <th>MENSAJE DE ACTIVIDAD</th>
                </tr>
            </thead>
            <tbody>
                ${logs.map(log => `
                    <tr>
                        <td class="mono" style="font-size:11px">${new Date(log.timestamp).toLocaleString('es-CR')}</td>
                        <td>
                            <div style="display:flex;align-items:center;gap:8px;">
                                <div class="user-avatar-mini" style="width:24px;height:24px;font-size:10px;background:rgba(255,255,255,0.02);">${(log.usuario_nombre || 'S').charAt(0)}</div>
                                <span>${log.usuario_nombre || 'Sistema'}</span>
                            </div>
                        </td>
                        <td style="font-size:13px;color:#e2e6eb;">${log.mensaje || '-'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    },

    formatAuditDetail(log) {
        const prev = log.datos_anteriores
            ? `<div class="audit-json-block"><strong>Antes</strong><pre>${JSON.stringify(log.datos_anteriores, null, 2)}</pre></div>`
            : '';

        const next = log.datos_nuevos
            ? `<div class="audit-json-block"><strong>Después</strong><pre>${JSON.stringify(log.datos_nuevos, null, 2)}</pre></div>`
            : '';

        return `${prev}${next}` || '-';
    },

    // ═══════════════════════════════════════════════════════════
    // ESTILOS (inyectados una sola vez)
    // ═══════════════════════════════════════════════════════════
    injectStyles() {
        if (document.getElementById('admin-styles')) return;
        const style = document.createElement('style');
        style.id = 'admin-styles';
        style.innerHTML = `
:root { --admin-red: #C8102E; --admin-red-glow: rgba(200, 16, 46, 0.25); }
.admin-theme { background: #050505; color: white; }
.accent-red { color: var(--admin-red); }
.dashboard-wrapper { display: flex; min-height: 100vh; }
.sidebar { width: 260px; height: 100vh; position: fixed; left: 0; top: 0; display: flex; flex-direction: column; background: rgba(255,255,255,0.03); backdrop-filter: blur(20px); border-right: 1px solid rgba(255,255,255,0.08); z-index: 100; transition: all 0.3s; }
.sidebar.collapsed { width: 80px; }
.sidebar.collapsed .user-card, .sidebar.collapsed .nav-item span, .sidebar.collapsed .badge-role { display: none; }
.sidebar-header { padding: 20px; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid rgba(255,255,255,0.08); }
.logo { font-size: 24px; font-weight: 900; }
.logo span { color: var(--admin-red); }
.badge-role { background: var(--admin-red); color: white; font-size: 9px; padding: 3px 8px; border-radius: 4px; font-weight: 700; }
.toggle-btn { background: none; border: none; color: white; cursor: pointer; margin-left: auto; }
.user-card { padding: 20px; display: flex; align-items: center; gap: 15px; border-bottom: 1px solid rgba(255,255,255,0.08); }
.user-avatar { width: 45px; height: 45px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
.user-avatar.admin { background: linear-gradient(135deg, var(--admin-red), #a00d24); }
.user-info { display: flex; flex-direction: column; }
.user-name { font-weight: 600; }
.user-role { font-size: 11px; color: rgba(255,255,255,0.5); }
.sidebar-nav { padding: 15px; display: flex; flex-direction: column; gap: 5px; flex: 1; }
.nav-item { display: flex; align-items: center; gap: 12px; padding: 12px 15px; border-radius: 10px; color: rgba(255,255,255,0.6); text-decoration: none; transition: all 0.2s; cursor: pointer; }
.nav-item:hover { background: rgba(255,255,255,0.05); color: white; }
.nav-item.active { background: rgba(200,16,46,0.15); color: var(--admin-red); }
.nav-item.logout { color: #ef4444; }
.nav-item.clickable { cursor: pointer; }
.nav-spacer { flex: 1; }
.main-content { margin-left: 260px; flex: 1; padding: 30px; }
.sidebar.collapsed + .main-content { margin-left: 80px; }
.top-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 25px; border-radius: 16px; margin-bottom: 30px; background: rgba(255,255,255,0.03); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.08); }
.header-left { display: flex; align-items: center; gap: 20px; }
.header-left h1 { font-size: 24px; font-weight: 700; }
.text-dim { color: rgba(255,255,255,0.5); font-size: 13px; }
.mobile-menu { display: none; background: none; border: none; color: white; font-size: 20px; cursor: pointer; }
.header-actions { display: flex; align-items: center; gap: 15px; }
.sync-badge { display: flex; align-items: center; gap: 8px; padding: 8px 15px; border-radius: 20px; font-size: 11px; font-weight: 600; }
.sync-badge.online { background: rgba(34,197,94,0.15); color: #22c55e; }
.sync-badge .dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
.btn-action { background: rgba(255,255,255,0.1); border: none; color: white; width: 40px; height: 40px; border-radius: 10px; cursor: pointer; }
.btn-export { background: var(--admin-red); color: white; border: none; padding: 10px 20px; border-radius: 10px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; }
.metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 25px; }
.metrics-grid.secondary { grid-template-columns: repeat(5, 1fr); }
.metric-card { padding: 25px; border-radius: 16px; background: rgba(255,255,255,0.03); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.08); }
.metric-card.glow-red { border-color: rgba(200,16,46,0.3); box-shadow: 0 0 30px rgba(200,16,46,0.1); }
.metric-card.glow-warning { border-color: rgba(245,158,11,0.3); }
.metric-header { margin-bottom: 15px; }
.metric-header i { font-size: 24px; color: var(--admin-red); }
.metric-value { font-size: 32px; font-weight: 700; display: block; margin-bottom: 5px; }
.metric-label { font-size: 13px; color: rgba(255,255,255,0.6); }
.metric-card-mini { display: flex; align-items: center; gap: 15px; padding: 15px 20px; border-radius: 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); }
.metric-card-mini i { font-size: 20px; color: var(--admin-red); }
.mini-value { font-size: 20px; font-weight: 700; display: block; }
.mini-label { font-size: 11px; color: rgba(255,255,255,0.5); }
.admin-main-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 25px; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.section-header h3, .section-header h2 { font-size: 16px; display: flex; align-items: center; gap: 10px; }
.filter-input { 
    padding: 8px 15px; 
    border-radius: 8px; 
    border: 1px solid rgba(255,255,255,0.1); 
    background: #0a0a0a; 
    color: white; 
    font-size: 13px; 
    accent-color: var(--admin-red);
}
.filter-input option {
    background: #0a0a0a;
    color: white;
}
.filter-input:focus {
    border-color: var(--admin-red);
    outline: none;
}
.audit-section, .ranking-section { padding: 25px; border-radius: 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); }
.admin-table { width: 100%; border-collapse: collapse; }
.admin-table th { text-align: left; padding: 12px 15px; font-size: 11px; color: rgba(255,255,255,0.5); border-bottom: 1px solid rgba(255,255,255,0.08); }
.admin-table td { padding: 12px 15px; border-bottom: 1px solid rgba(255,255,255,0.05); }
.rank-list { display: flex; flex-direction: column; gap: 10px; }
.rank-item { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 10px; background: rgba(255,255,255,0.03); }
.rank-item.top-1 { background: rgba(255,215,0,0.1); border: 1px solid rgba(255,215,0,0.3); }
.rank-pos { font-weight: 700; width: 25px; }
.rank-avatar { width: 35px; height: 35px; border-radius: 8px; background: var(--admin-red); display: flex; align-items: center; justify-content: center; font-weight: 700; position: relative; }
.rank-avatar i { position: absolute; top: -8px; font-size: 12px; color: gold; }
.rank-info { flex: 1; }
.rank-info strong { display: block; font-size: 14px; }
.rank-info small { font-size: 11px; color: rgba(255,255,255,0.5); }
.rank-precision { font-weight: 700; color: #22c55e; }
.empty-state { text-align: center; padding: 40px; color: rgba(255,255,255,0.4); }
.empty-state i { font-size: 40px; margin-bottom: 15px; display: block; }
.empty-state.small { padding: 20px; }
.usuarios-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 25px; }
.stat-card { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 25px; border-radius: 16px; text-align: center; }
.stat-card i { font-size: 28px; color: var(--admin-red); }
.stat-num { font-size: 36px; font-weight: 700; }
.usuarios-table { padding: 20px; border-radius: 16px; }
.user-cell { display: flex; align-items: center; gap: 12px; }
.user-avatar-mini { width: 35px; height: 35px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 700; }
.user-avatar-mini.admin { background: linear-gradient(135deg, #C8102E, #a00d24); }
.user-avatar-mini.jefe { background: linear-gradient(135deg, #7C3AED, #5b21b6); }
.user-avatar-mini.auxiliar { background: linear-gradient(135deg, #2563EB, #1d4ed8); }
.role-badge { padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; }
.role-badge.admin { background: rgba(200,16,46,0.2); color: #C8102E; }
.role-badge.jefe { background: rgba(124,58,237,0.2); color: #7C3AED; }
.role-badge.auxiliar { background: rgba(37,99,235,0.2); color: #2563EB; }
.status-badge { padding: 4px 12px; border-radius: 20px; font-size: 11px; }
.status-badge.active { background: rgba(34,197,94,0.15); color: #22c55e; }
.status-badge.inactive { background: rgba(239,68,68,0.15); color: #ef4444; }
.action-buttons { display: flex; gap: 8px; }
.btn-icon { width: 32px; height: 32px; border-radius: 8px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.btn-icon.edit { background: rgba(59,130,246,0.15); color: #3b82f6; }
.btn-icon.delete { background: rgba(239,68,68,0.15); color: #ef4444; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 10000; }
.modal-content { width: 90%; max-width: 500px; border-radius: 20px; background: rgba(20,20,20,0.95); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 25px; border-bottom: 1px solid rgba(255,255,255,0.08); }
.modal-close { background: none; border: none; color: rgba(255,255,255,0.5); font-size: 20px; cursor: pointer; }
.modal-body { padding: 25px; }
.modal-footer { display: flex; gap: 12px; justify-content: flex-end; padding: 20px 25px; border-top: 1px solid rgba(255,255,255,0.08); }
.form-group { margin-bottom: 20px; }
.form-group label { display: block; font-size: 12px; color: rgba(255,255,255,0.6); margin-bottom: 8px; }
.form-group input, .form-group select { width: 100%; padding: 12px 15px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: white; font-size: 14px; }
.form-group select option { background: #1a1a1a; color: white; }
.form-group input:focus, .form-group select:focus { outline: none; border-color: var(--admin-red); }
.btn-primary { background: var(--admin-red); color: white; border: none; padding: 12px 24px; border-radius: 10px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; }
.btn-secondary { background: rgba(255,255,255,0.1); color: white; border: none; padding: 12px 24px; border-radius: 10px; font-weight: 600; cursor: pointer; }
.btn-danger { background: rgba(239,68,68,0.2); color: #ef4444; border: none; padding: 12px 24px; border-radius: 10px; font-weight: 600; cursor: pointer; }
.consulta-search { display: flex; gap: 10px; margin-bottom: 20px; }
.consulta-search input { flex: 1; padding: 15px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: white; font-size: 16px; }
.consulta-card { padding: 20px; border-radius: 16px; background: rgba(255,255,255,0.05); }
.consulta-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 15px; }
.consulta-grid > div { padding: 12px; background: rgba(255,255,255,0.03); border-radius: 10px; }
.consulta-grid small { display: block; font-size: 11px; color: rgba(255,255,255,0.5); margin-bottom: 5px; }
.text-success { color: #22c55e !important; }
.text-error { color: #ef4444 !important; }
.text-center { text-align: center; }
code { background: rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 4px; font-size: 12px; }
.ciclicos-card { padding: 20px; border-radius: 16px; }
.ciclico-header-info { display: flex; align-items: center; gap: 16px; }
.btn-revisar { background: rgba(59,130,246,0.15); color: #3b82f6; border: none; padding: 6px 14px; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; }
.btn-revisar:hover { background: rgba(59,130,246,0.25); }
.audit-full-wrap { min-height: 70vh; }
.audit-filters-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin: 20px 0 14px 0;
}
.audit-filter-actions {
    display: flex;
    gap: 10px;
    margin-bottom: 18px;
}
.audit-table-wrap {
    max-height: 70vh;
    overflow: auto;
    border-radius: 14px;
    background: rgba(255,255,255,0.02);
}
.audit-admin-table td.audit-detail-cell {
    max-width: 360px;
    white-space: normal;
    vertical-align: top;
}
.audit-json-block {
    margin-bottom: 10px;
    padding: 10px;
    border-radius: 10px;
    background: rgba(255,255,255,0.04);
}
.audit-json-block strong {
    display: block;
    margin-bottom: 6px;
    font-size: 11px;
    color: rgba(255,255,255,0.65);
    text-transform: uppercase;
}
.audit-json-block pre {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
    font-size: 11px;
    color: rgba(255,255,255,0.8);
    font-family: 'JetBrains Mono', monospace;
}
@media (max-width: 1100px) {
    .audit-filters-grid {
        grid-template-columns: 1fr 1fr;
    }
}
@media (max-width: 700px) {
    .audit-filters-grid {
        grid-template-columns: 1fr;
    }
}
@media (max-width: 1200px) { .metrics-grid { grid-template-columns: repeat(2, 1fr); } .metrics-grid.secondary { grid-template-columns: repeat(3, 1fr); } .admin-main-grid { grid-template-columns: 1fr; } }
@media (max-width: 768px) { .sidebar { transform: translateX(-100%); } .sidebar.collapsed { transform: translateX(0); width: 260px; } .main-content { margin-left: 0 !important; } .mobile-menu { display: block; } .metrics-grid { grid-template-columns: 1fr; } .usuarios-stats { grid-template-columns: 1fr; } }
@media (max-width: 480px) { .metrics-grid.secondary { grid-template-columns: repeat(2, 1fr); } .export-actions { flex-direction: column; } .export-actions button { width: 100%; justify-content: center; } }

/* ── MODO CLARO EN ADMIN ── */
body.light-mode .admin-theme { background: #f5f6fa !important; color: #1e1e1e !important; }
body.light-mode .dashboard-wrapper { background: #f5f6fa; color: #1e1e1e; }
body.light-mode .sidebar { background: #ffffff !important; border-right: 1px solid #e0e0e0 !important; }
body.light-mode .nav-item { color: #5f6368 !important; }
body.light-mode .nav-item:hover { background: rgba(0,0,0,0.05) !important; color: #1e1e1e !important; }
body.light-mode .nav-item.active { background: rgba(200,16,46,0.1) !important; color: #C8102E !important; }
body.light-mode .nav-item.logout { color: #ef4444 !important; }
body.light-mode .top-header { background: #ffffff !important; border: 1px solid #e0e0e0 !important; color: #1e1e1e !important; }
body.light-mode .glass,
body.light-mode .metric-card,
body.light-mode .metric-card-mini,
body.light-mode .audit-section,
body.light-mode .ranking-section,
body.light-mode .usuarios-table,
body.light-mode .ciclicos-card {
    background: #ffffff !important;
    border: 1px solid #e0e0e0 !important;
    color: #1e1e1e !important;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
body.light-mode .mini-value, body.light-mode .metric-value, body.light-mode .stat-num,
body.light-mode h1, body.light-mode h2, body.light-mode h3 { color: #1e1e1e !important; }
body.light-mode .mini-label, body.light-mode .metric-label, body.light-mode .text-dim,
body.light-mode .user-role, body.light-mode .section-header span { color: #5f6368 !important; }
body.light-mode .filter-input {
    background: #f1f3f4 !important;
    color: #1e1e1e !important;
    border: 1px solid #dadce0 !important;
}
body.light-mode .filter-input option { background: #ffffff !important; color: #1e1e1e !important; }
body.light-mode .admin-table th { color: #5f6368 !important; border-bottom: 1px solid #e8eaed !important; }
body.light-mode .admin-table td { border-bottom: 1px solid #f1f3f4 !important; color: #1e1e1e !important; }
body.light-mode .audit-table-wrap { background: #fafafa !important; }
body.light-mode .logo { color: #1e1e1e !important; }
body.light-mode .toggle-btn, body.light-mode .mobile-menu, body.light-mode .user-name { color: #1e1e1e !important; }
body.light-mode code { background: #f1f3f4 !important; color: #C8102E !important; }
body.light-mode .btn-secondary, body.light-mode .btn-action { background: #f1f3f4 !important; color: #1e1e1e !important; border: 1px solid #dadce0 !important; }
body.light-mode .btn-secondary:hover { background: #e8eaed !important; }
body.light-mode .rank-item { background: #f8f9fa !important; border: 1px solid #e8eaed !important; color: #1e1e1e !important; }
body.light-mode .rank-info strong { color: #1e1e1e !important; }
body.light-mode .rank-info small { color: #5f6368 !important; }
body.light-mode .rank-pos { color: #1e1e1e !important; }
body.light-mode .empty-state { color: #9aa0a6 !important; }
body.light-mode .modal-overlay { background: rgba(0,0,0,0.4) !important; }
body.light-mode .modal-content { background: #ffffff !important; color: #1e1e1e !important; box-shadow: 0 10px 40px rgba(0,0,0,0.15) !important; }
body.light-mode .modal-header, body.light-mode .modal-footer { border-color: #e8eaed !important; }
body.light-mode .modal-close { color: #5f6368 !important; }
body.light-mode .form-group label { color: #5f6368 !important; }
body.light-mode .form-group input, body.light-mode .form-group select { background: #f1f3f4 !important; color: #1e1e1e !important; border-color: #dadce0 !important; }
body.light-mode .form-group select option { background: #ffffff !important; color: #1e1e1e !important; }
body.light-mode .consulta-search input { background: #f1f3f4 !important; color: #1e1e1e !important; border-color: #dadce0 !important; }
body.light-mode .consulta-card { background: #f8f9fa !important; color: #1e1e1e !important; }
body.light-mode .consulta-grid > div { background: #f1f3f4 !important; }
body.light-mode .consulta-grid small { color: #5f6368 !important; }
body.light-mode .audit-json-block { background: #f1f3f4 !important; }
body.light-mode .audit-json-block strong { color: #5f6368 !important; }
body.light-mode .audit-json-block pre { color: #1e1e1e !important; }
body.light-mode .user-card { border-bottom-color: #e8eaed !important; }
body.light-mode .sidebar-header { border-bottom-color: #e8eaed !important; }
body.light-mode .sync-badge.online { background: rgba(34,197,94,0.1) !important; }
/* Charts dark card → light mode */
body.light-mode .chart-dark-card { background: linear-gradient(135deg,#f0f2ff 0%,#e8ecff 100%) !important; border: 1px solid #dadce0 !important; }
body.light-mode .chart-dark-card h3,
body.light-mode .chart-dark-card .cdc-title { color: #1e1e1e !important; }
body.light-mode .chart-dark-card .cdc-cat { color: rgba(0,0,0,0.6) !important; }
body.light-mode .chart-dark-card .cdc-pct { color: rgba(0,0,0,0.4) !important; }
body.light-mode .chart-dark-card .cdc-monto { color: #1e1e1e !important; }
body.light-mode .chart-dark-card .cdc-bar-bg { background: rgba(0,0,0,0.06) !important; }
body.light-mode .chart-dark-card .cdc-footer { border-top-color: rgba(0,0,0,0.08) !important; }
body.light-mode .chart-dark-card .cdc-footer-label { color: rgba(0,0,0,0.45) !important; }
body.light-mode .chart-dark-card .cdc-footer-val { color: #1e1e1e !important; }
        `;
        document.head.appendChild(style);
    }
};

window.AdminView = AdminView;