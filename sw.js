// ZENGO Service Worker v1.5.2 — Estructura MVC
const CACHE_NAME = 'zengo-v1.5.2';
const ASSETS = [
    '/', '/index.html',
    // CSS
    '/css/base.css', '/css/layout.css', '/css/components.css',
    '/css/tables.css', '/css/jefe.css', '/css/auxiliar.css', '/css/main.css', '/css/scanner.css',
    // Config
    '/js/config/supabase.js', '/js/config/dexie-db.js',
    // Models
    '/js/models/AuthModel.js', '/js/models/InventoryModel.js', '/js/models/LocationModel.js',
    '/js/models/PrecisionCalculator.js',
    // Controllers
    '/js/controllers/SyncManager.js', '/js/controllers/ScannerController.js',
    '/js/controllers/AdminController.js', '/js/controllers/RealtimeManager.js',
    '/js/controllers/AuthController.js','/js/controllers/LogController.js',
    // Views
    '/js/views/LoginView.js',
    '/js/views/AdminView.js', '/js/views/JefeView.js', '/js/views/AuxiliarView.js',
    // App
    '/js/app.js'
];

self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE_NAME)
            .then(c => c.addAll(ASSETS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', e => {
    if (e.request.url.includes('supabase.co') ||
        e.request.url.includes('cdnjs.cloudflare.com') ||
        e.request.url.includes('fonts.googleapis.com') ||
        e.request.url.includes('fonts.gstatic.com') ||
        e.request.url.includes('unpkg.com') ||
        e.request.url.includes('cdn.jsdelivr.net')) return;

    e.respondWith(
        fetch(e.request)
            .then(r => {
                const clone = r.clone();
                caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
                return r;
            })
            // Si el request no estaba precacheado y tampoco hay red, el
            // fallback NO debe ser texto arbitrario: un <script> que falta
            // del precache (ver ASSETS arriba) terminaba ejecutando el
            // string "Offline" como si fuera JS -> ReferenceError que
            // trababa el arranque completo de la app sin red. Vacío es un
            // no-op seguro para JS/CSS en vez de un crash.
            .catch(() => caches.match(e.request).then(r => r || new Response('', { status: 503 })))
    );
});

console.log('[SW] v1.5.1 — Estructura MVC');
