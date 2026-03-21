// ═══════════════════════════════════════════════════════════════
// ZENGO v1.7 — RealtimeManager
// Sincronización en tiempo real vía Supabase Realtime (< 2s)
//
// ESTRATEGIA:
//   · Suscribe a las tablas calientes (tareas, hallazgos, conteos_realizados, auditoria)
//   · Al recibir un cambio, despacha un evento DOM personalizado
//   · Las vistas escuchan esos eventos y se refrescan automáticamente
//   · Si hay offline, muestra banner persistente y avisa para moverse a WiFi
//
// USO EN LAS VISTAS:
//   window.addEventListener('zengo:tarea-cambio',     e => { ... e.detail ... })
//   window.addEventListener('zengo:hallazgo-cambio',  e => { ... e.detail ... })
//   window.addEventListener('zengo:conteo-nuevo',     e => { ... e.detail ... })
//   window.addEventListener('zengo:auditoria-nueva',  e => { ... e.detail ... })
// ═══════════════════════════════════════════════════════════════

const RealtimeManager = {

    _canales:      {},
    _heartbeatId:  null,
    _bannerEl:     null,
    _estabaOnline: true,

    // ═══════════════════════════════════════════════════════════
    // INICIALIZAR
    // Llamar una vez desde app.js después de initDatabase()
    // ═══════════════════════════════════════════════════════════
    init() {
        this._monitorConexion();
        this._iniciarHeartbeat();

        if (navigator.onLine) {
            this._suscribirTablas();
        }

        window.addEventListener('online',  () => this._alConectarse());
        window.addEventListener('offline', () => this._alDesconectarse());

        console.log('✓ RealtimeManager inicializado');
    },

    // ═══════════════════════════════════════════════════════════
    // SUSCRIBIR TABLAS REALTIME
    // ═══════════════════════════════════════════════════════════
    _suscribirTablas() {
        if (!window.supabaseClient?.channel) {
            console.warn('⚠ RealtimeManager: Supabase no soporta Realtime en este cliente');
            return;
        }

        // ── tareas ──────────────────────────────────────────────
        this._canales.tareas = window.supabaseClient
            .channel('zengo-tareas')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'tareas' },
                (payload) => {
                    this._despachar('zengo:tarea-cambio', {
                        tipo:    payload.eventType,   // INSERT | UPDATE | DELETE
                        nuevo:   payload.new,
                        antiguo: payload.old
                    });
                })
            .subscribe();

        // ── hallazgos ───────────────────────────────────────────
        this._canales.hallazgos = window.supabaseClient
            .channel('zengo-hallazgos')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'hallazgos' },
                (payload) => {
                    this._despachar('zengo:hallazgo-cambio', {
                        tipo:    payload.eventType,
                        nuevo:   payload.new,
                        antiguo: payload.old
                    });
                })
            .subscribe();

        // ── conteos_realizados ──────────────────────────────────
        this._canales.conteos = window.supabaseClient
            .channel('zengo-conteos')
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'conteos_realizados' },
                (payload) => {
                    this._despachar('zengo:conteo-nuevo', { datos: payload.new });
                })
            .subscribe();

        // ── auditoria ───────────────────────────────────────────
        this._canales.auditoria = window.supabaseClient
            .channel('zengo-auditoria')
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'auditoria' },
                (payload) => {
                    this._despachar('zengo:auditoria-nueva', { datos: payload.new });
                })
            .subscribe();

        console.log('✓ RealtimeManager: suscripciones activas');
    },

    // ═══════════════════════════════════════════════════════════
    // DESCONECTAR SUSCRIPCIONES
    // ═══════════════════════════════════════════════════════════
    _desconectar() {
        if (!window.supabaseClient?.removeChannel) return;
        Object.values(this._canales).forEach(canal => {
            try { window.supabaseClient.removeChannel(canal); } catch (e) {}
        });
        this._canales = {};
    },

    // ═══════════════════════════════════════════════════════════
    // HEARTBEAT — Verifica conectividad real cada 15s
    // navigator.onLine puede mentir en algunas redes corporativas.
    // ═══════════════════════════════════════════════════════════
    _iniciarHeartbeat() {
        this._heartbeatId = setInterval(async () => {
            const online = await this._verificarConexion();
            if (!online && this._estabaOnline) {
                this._alDesconectarse();
            } else if (online && !this._estabaOnline) {
                this._alConectarse();
            }
        }, 15000);
    },

    async _verificarConexion() {
        try {
            if (!navigator.onLine) return false;
            // Ping ligero a Supabase — consulta vacía a una tabla pequeña
            const { error } = await window.supabaseClient
                .from('roles')
                .select('id')
                .limit(1);
            return !error;
        } catch (e) {
            return false;
        }
    },

    // ═══════════════════════════════════════════════════════════
    // MONITOREO DE CONEXIÓN
    // ═══════════════════════════════════════════════════════════
    _monitorConexion() {
        this._estabaOnline = navigator.onLine;
    },

    _alConectarse() {
        const yaEstaba = this._estabaOnline;
        this._estabaOnline = true;
        this._ocultarBannerOffline();
        this._suscribirTablas();

        if (!yaEstaba) {
            // Reconexión: sincronizar cola pendiente
            window.SyncManager?.syncPendientes?.();
            window.ZENGO?.toast('Conexión restaurada · Sincronizando...', 'success', 3000);
            console.log('✓ RealtimeManager: reconectado, sincronizando cola');
        }
    },

    _alDesconectarse() {
        this._estabaOnline = false;
        this._desconectar();
        this._mostrarBannerOffline();
        console.warn('⚠ RealtimeManager: sin conexión');
    },

    // ═══════════════════════════════════════════════════════════
    // BANNER OFFLINE PERSISTENTE
    // Avisa al usuario que se mueva a una zona con WiFi.
    // ═══════════════════════════════════════════════════════════
    _mostrarBannerOffline() {
        if (this._bannerEl) return;

        const banner = document.createElement('div');
        banner.id = 'zengo-offline-banner';
        banner.innerHTML = `
            <span style="font-size:20px;">📡</span>
            <div>
                <strong>Sin conexión</strong>
                <span>Muévete a una zona con WiFi · Los cambios se guardan localmente</span>
            </div>
        `;
        banner.style.cssText = `
            position: fixed;
            top: 0; left: 0; right: 0;
            z-index: 99999;
            background: #b45309;
            color: white;
            padding: 12px 20px;
            display: flex;
            align-items: center;
            gap: 14px;
            font-size: 13px;
            font-weight: 500;
            box-shadow: 0 4px 20px rgba(0,0,0,0.4);
            animation: zengoSlideDown 0.3s ease;
        `;

        // Inyectar animación si no existe
        if (!document.getElementById('zengo-offline-styles')) {
            const style = document.createElement('style');
            style.id = 'zengo-offline-styles';
            style.textContent = `
                @keyframes zengoSlideDown {
                    from { transform: translateY(-100%); opacity: 0; }
                    to   { transform: translateY(0);     opacity: 1; }
                }
                @keyframes zengoSlideUp {
                    from { transform: translateY(0);     opacity: 1; }
                    to   { transform: translateY(-100%); opacity: 0; }
                }
                #zengo-offline-banner div {
                    display: flex; flex-direction: column; gap: 2px;
                }
                #zengo-offline-banner strong { font-size: 14px; }
                #zengo-offline-banner span   { opacity: 0.85; }
            `;
            document.head.appendChild(style);
        }

        document.body.prepend(banner);
        this._bannerEl = banner;

        // Desplazar contenido principal para que no quede debajo del banner
        const app = document.getElementById('app-container');
        if (app) app.style.marginTop = '52px';
    },

    _ocultarBannerOffline() {
        if (!this._bannerEl) return;
        this._bannerEl.style.animation = 'zengoSlideUp 0.3s ease forwards';
        setTimeout(() => {
            this._bannerEl?.remove();
            this._bannerEl = null;
            const app = document.getElementById('app-container');
            if (app) app.style.marginTop = '';
        }, 300);
    },

    // ═══════════════════════════════════════════════════════════
    // DESPACHAR EVENTO DOM
    // Las vistas escuchan: window.addEventListener('zengo:tarea-cambio', ...)
    // ═══════════════════════════════════════════════════════════
    _despachar(nombre, detalle) {
        window.dispatchEvent(new CustomEvent(nombre, { detail: detalle }));
    },

    // ═══════════════════════════════════════════════════════════
    // ESTADO ACTUAL
    // ═══════════════════════════════════════════════════════════
    isOnline() {
        return this._estabaOnline;
    },

    // ═══════════════════════════════════════════════════════════
    // LIMPIAR (para logout)
    // ═══════════════════════════════════════════════════════════
    destroy() {
        this._desconectar();
        if (this._heartbeatId) clearInterval(this._heartbeatId);
        this._ocultarBannerOffline();
    }
};

window.RealtimeManager = RealtimeManager;
