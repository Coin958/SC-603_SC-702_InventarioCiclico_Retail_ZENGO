import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuthModel } from './models/AuthContext';
import { useNavigationController } from './controllers/useNavigationController';
import { useAuthController } from './controllers/useAuthController';

// Views
import IntroView from './views/pages/IntroView';
import LoginView from './views/pages/LoginView';
import AuxiliarDashboard from './views/pages/dashboards/AuxiliarDashboard';
import JefeDashboard from './views/pages/dashboards/JefeDashboard';
import AdminDashboard from './views/pages/dashboards/AdminDashboard';
import DashboardView from './views/pages/dashboards/AuxiliarDashboard'; // Fallback

// Wrapper component to use hooks inside AuthProvider
const AppContent = () => {
    const { userRole, user, isAuthenticated, loading } = useAuthModel();
    const { currentView, navigateTo } = useNavigationController();
    const { logout } = useAuthController();

    const handleLogout = () => {
        logout();
        navigateTo('login');
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}>
                <div className="loader"></div>
            </div>
        );
    }

    // Dashboard factory based on role
    const getDashboardComponent = () => {
        switch (userRole) {
            case 'auxiliar':
                return <AuxiliarDashboard onNavigate={navigateTo} onLogout={handleLogout} userName={user?.user_metadata?.full_name || user?.email} />;
            case 'jefe':
                return <JefeDashboard onNavigate={navigateTo} onLogout={handleLogout} userName={user?.user_metadata?.full_name || user?.email} />;
            case 'admin':
                return <AdminDashboard onNavigate={navigateTo} onLogout={handleLogout} userName={user?.user_metadata?.full_name || user?.email} />;
            default:
                return <DashboardView onNavigate={navigateTo} onLogout={handleLogout} userName={user?.user_metadata?.full_name || user?.email} />;
        }
    };

    return (
        <AnimatePresence mode="wait">
            {currentView === "intro" && (
                <motion.div
                    key="intro"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <IntroView onComplete={() => navigateTo('login')} />
                </motion.div>
            )}

            {currentView === "login" && !isAuthenticated && (
                <motion.div
                    key="login"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <LoginView onLogin={() => navigateTo('dashboard')} />
                </motion.div>
            )}

            {(currentView === "dashboard" || isAuthenticated) && (
                <motion.div
                    key="dashboard"
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                >
                    {getDashboardComponent()}
                </motion.div>
            )}

            {/* 
        Para simplificar en esta migración inicial, Scanner e Inventory 
        se mostrarán conceptualmente o redirigirán al dashboard.
        En una implementación real completa, también serían componentes separados.
      */}
            {currentView === "scanner" && (
                <motion.div
                    key="scanner"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="min-h-screen flex items-center justify-center bg-gray-900 text-white"
                >
                    <div className="text-center">
                        <h2 className="text-2xl mb-4">Vista de Escáner</h2>
                        <p className="mb-4">Funcionalidad en desarrollo para MVC...</p>
                        <button onClick={() => navigateTo('dashboard')} className="px-4 py-2 bg-od-red rounded">Volver</button>
                    </div>
                </motion.div>
            )}

            {currentView === "inventory" && (
                <motion.div
                    key="inventory"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="min-h-screen flex items-center justify-center bg-gray-900 text-white"
                >
                    <div className="text-center">
                        <h2 className="text-2xl mb-4">Vista de Inventario</h2>
                        <p className="mb-4">Funcionalidad en desarrollo para MVC...</p>
                        <button onClick={() => navigateTo('dashboard')} className="px-4 py-2 bg-od-red rounded">Volver</button>
                    </div>
                </motion.div>
            )}

        </AnimatePresence>
    );
};

const App = () => {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
};

export default App;
