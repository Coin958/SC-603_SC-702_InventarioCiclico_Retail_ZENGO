import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userRole, setUserRole] = useState(""); // auxiliar, jefe, admin
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active session
        const checkSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (session) {
                    const role = session.user.user_metadata?.role || 'auxiliar';
                    setUser(session.user);
                    setUserRole(role);
                    setIsAuthenticated(true);
                }
            } catch (error) {
                console.error('Error checking session:', error);
            } finally {
                setLoading(false);
            }
        };

        checkSession();

        // Listen for auth changes
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                const role = session.user.user_metadata?.role || 'auxiliar';
                setUser(session.user);
                setUserRole(role);
                setIsAuthenticated(true);
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setUserRole("");
                setIsAuthenticated(false);
            }
        });

        return () => {
            authListener?.subscription?.unsubscribe();
        };
    }, []);

    const value = {
        user,
        userRole,
        isAuthenticated,
        loading,
        setUser,
        setUserRole,
        setIsAuthenticated
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthModel = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuthModel must be used within an AuthProvider');
    }
    return context;
};
