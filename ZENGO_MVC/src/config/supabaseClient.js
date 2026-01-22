import { createClient } from '@supabase/supabase-js'

// IMPORTANTE: Reemplaza estos valores con tus credenciales de Supabase
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

let supabaseClient = null;

// Inicialización con soporte para modo DEMO
if (SUPABASE_URL !== 'YOUR_SUPABASE_URL' && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY') {
    try {
        supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (error) {
        console.error('Error inicializando Supabase:', error);
    }
} else {
    console.warn('⚠️ Supabase no configurado. Usando modo DEMO.');
    // Mock de Supabase para modo demo
    supabaseClient = {
        auth: {
            signInWithPassword: async ({ email, password }) => {
                // Simulación de login para demo
                const demoUsers = {
                    'auxiliar@demo.com': { role: 'auxiliar', name: 'Juan Pérez Demo' },
                    'jefe@demo.com': { role: 'jefe', name: 'María González Demo' },
                    'admin@demo.com': { role: 'admin', name: 'Carlos Rodríguez Demo' }
                };

                if (demoUsers[email] && password === 'demo123') {
                    return {
                        data: {
                            user: {
                                email: email,
                                user_metadata: {
                                    role: demoUsers[email].role,
                                    full_name: demoUsers[email].name
                                }
                            }
                        },
                        error: null
                    };
                }
                return { data: null, error: { message: 'Credenciales inválidas (Demo: password=demo123)' } };
            },
            signOut: async () => ({ error: null }),
            getSession: async () => ({ data: { session: null }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } })
        }
    };
}

export const supabase = supabaseClient;
