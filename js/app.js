// ═══════════════════════════════════════════════════════════════
// ZENGO - Aplicación Principal
// Sistema de Inventario Cíclico - Office Depot
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// INICIALIZACIÓN DE LA APP
// ═══════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async () => {
    const appContainer = document.getElementById('app-container');
    
    // Inicializar base de datos local
    await initDatabase();
    
    // Sincronizar usuarios desde Supabase a Dexie
    await window.AuthModel.init();
    
    // Quitar pantalla de carga
    hideLoadingScreen();
    
    // Verificar sesión existente
    const hasSession = window.AuthController.checkExistingSession();
    
    if (!hasSession) {
        // Mostrar Login
        window.LoginView.render(appContainer);
        setupLoginHandler();
    }
    
    // Iniciar monitor de conexión
    setupConnectionMonitor();
    
    // Iniciar sincronización en background
    window.SyncManager.init();

    // Iniciar Realtime + monitor offline
    window.RealtimeManager.init();

    // Avisar (sin sobrescribir nada) cuando llegan cambios de otro usuario
    setupRealtimeNotifications();
});

// ═══════════════════════════════════════════════════════════════
// FUNCIONES DE INICIALIZACIÓN
// ═══════════════════════════════════════════════════════════════

async function initDatabase() {
    try {
        await window.db.open();
        console.log('✓ Base de datos local inicializada');
    } catch (err) {
        console.warn('⚠ Error inicializando DB local:', err.message);
    }
}

function hideLoadingScreen() {
    setTimeout(() => {
        const loader = document.getElementById('loading-screen');
        if (loader) {
            loader.style.opacity = '0';
            loader.style.transition = 'opacity 0.5s ease';
            setTimeout(() => loader.remove(), 500);
        }
    }, 800);
}

function setupLoginHandler() {
    document.addEventListener('submit', (e) => {
        if (e.target.id === 'login-form') {
            e.preventDefault();
            const email = document.getElementById('email')?.value?.trim();
            const pass = document.getElementById('password')?.value;
            
            if (email && pass) {
                window.AuthController.login(email, pass);
            }
        }
    });
    
    // Enter en password también hace submit
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target.id === 'password') {
            e.preventDefault();
            document.getElementById('login-form')?.requestSubmit();
        }
    });
}

function setupConnectionMonitor() {
    const updateStatus = () => {
        const isOnline = navigator.onLine;
        document.body.classList.toggle('offline-mode', !isOnline);

        // .sync-badge existe en las 3 vistas (Admin la marca ademas con
        // id="sync-container", pero Jefe/Auxiliar no tienen esos ids —
        // por eso se actualiza por clase, no por id, para cubrir las 3).
        document.querySelectorAll('.sync-badge').forEach(badge => {
            badge.classList.toggle('online', isOnline);
            badge.classList.toggle('offline', !isOnline);
            const texto = badge.querySelector('span');
            if (texto) texto.textContent = isOnline ? 'ONLINE' : 'OFFLINE';
        });

        // Si vuelve online, intentar sincronizar
        if (isOnline) {
            window.SyncManager.syncPendientes();
        }
    };
    
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);

    // Estado inicial
    updateStatus();
}

// RealtimeManager suscribe canales de Supabase y despacha eventos
// 'zengo:tarea-cambio' / 'zengo:hallazgo-cambio' en cuanto otro usuario
// cambia algo — pero nadie los escuchaba, así que nunca llegaban a la
// pantalla. En vez de auto-refrescar en silencio (riesgoso: podría
// sobrescribir una tabla de revisión o un conteo que el usuario está
// editando ahora mismo), solo avisamos con un toast para que decida
// cuándo refrescar con el botón que ya existe en cada vista.
function setupRealtimeNotifications() {
    let avisoActivo = false;
    const avisarCambiosDisponibles = () => {
        if (avisoActivo) return; // no duplicar el aviso si llegan varios eventos seguidos
        avisoActivo = true;
        window.ZENGO?.toast('Hay cambios nuevos de otro usuario — pulsa refrescar para verlos', 'info', 6000);
        setTimeout(() => { avisoActivo = false; }, 15000);
    };
    window.addEventListener('zengo:tarea-cambio', avisarCambiosDisponibles);
    window.addEventListener('zengo:hallazgo-cambio', avisarCambiosDisponibles);
}

// ═══════════════════════════════════════════════════════════════
// UTILIDADES GLOBALES
// ═══════════════════════════════════════════════════════════════

window.ZENGO = {
    version: '1.7.0',

    // Escapa texto antes de insertarlo en HTML armado con template
    // literals (todo el sistema renderiza así, sin un framework de por
    // medio). Usar SIEMPRE que se interpole texto que un usuario escribió
    // libremente (motivo de un prompt(), descripción de un hallazgo,
    // nombre de usuario, etc.) — sin esto, alguien puede guardar algo
    // como <img src=x onerror="..."> y que se ejecute en el navegador de
    // OTRO usuario que simplemente vea esa pantalla.
    esc(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },

    // Para texto que se interpola DENTRO de un onclick="Algo('${valor}')"
    // inline — un caso distinto a esc(): el HTML se decodifica ANTES de
    // que el navegador interprete el atributo como JavaScript, así que
    // &#39; no evita que un usuario "rompa" el string de JS con una
    // comilla. Aquí se escapa para JS (comilla simple) y para el
    // atributo HTML que lo contiene (comilla doble) al mismo tiempo.
    escJs(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'")
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    },

    // Mostrar notificación toast
    toast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `zengo-toast toast-${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        toast.style.cssText = `
            position: fixed; bottom: 30px; right: 30px; z-index: 10000;
            background: ${type === 'success' ? 'rgba(34, 197, 94, 0.9)' : type === 'error' ? 'rgba(239, 68, 68, 0.9)' : type === 'warning' ? 'rgba(245, 158, 11, 0.9)' : 'rgba(59, 130, 246, 0.9)'};
            color: white; padding: 15px 25px; border-radius: 12px;
            display: flex; align-items: center; gap: 10px;
            font-weight: 500; box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            animation: toastIn 0.3s ease;
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'toastOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },
    
    // Confirmar acción
    async confirm(message, title = 'Confirmar') {
        return new Promise(resolve => {
            const modal = document.createElement('div');
            modal.className = 'zengo-confirm-modal';
            modal.innerHTML = `
                <div class="confirm-overlay"></div>
                <div class="confirm-box glass">
                    <h3>${title}</h3>
                    <p>${message}</p>
                    <div class="confirm-actions">
                        <button class="btn-cancel">Cancelar</button>
                        <button class="btn-confirm">Confirmar</button>
                    </div>
                </div>
            `;
            modal.style.cssText = `
                position: fixed; inset: 0; z-index: 10001;
                display: flex; align-items: center; justify-content: center;
            `;
            document.body.appendChild(modal);
            
            modal.querySelector('.confirm-overlay').style.cssText = `
                position: absolute; inset: 0; background: rgba(0,0,0,0.8);
            `;
            modal.querySelector('.confirm-box').style.cssText = `
                position: relative; padding: 30px; border-radius: 20px;
                background: rgba(255,255,255,0.05); backdrop-filter: blur(20px);
                border: 1px solid rgba(255,255,255,0.1); text-align: center;
                min-width: 300px;
            `;
            modal.querySelector('.confirm-actions').style.cssText = `
                display: flex; gap: 15px; margin-top: 25px; justify-content: center;
            `;
            modal.querySelector('.btn-cancel').style.cssText = `
                padding: 12px 25px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.2);
                background: transparent; color: white; cursor: pointer;
            `;
            modal.querySelector('.btn-confirm').style.cssText = `
                padding: 12px 25px; border-radius: 10px; border: none;
                background: var(--admin-red, #C8102E); color: white; cursor: pointer;
            `;
            
            modal.querySelector('.btn-cancel').onclick = () => { modal.remove(); resolve(false); };
            modal.querySelector('.btn-confirm').onclick = () => { modal.remove(); resolve(true); };
            modal.querySelector('.confirm-overlay').onclick = () => { modal.remove(); resolve(false); };
        });
    },
    
    // Formatear número
    formatNumber(num) {
        return new Intl.NumberFormat('es-CR').format(num);
    },
    
    // Formatear moneda
    formatCurrency(num) {
        return new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC' }).format(num);
    }
};

console.log('✓ ZENGO v1.7.0 inicializado');