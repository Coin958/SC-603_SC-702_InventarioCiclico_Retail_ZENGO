import { useState } from 'react';
import { supabase } from '../config/supabaseClient';
import { useAuthModel } from '../models/AuthContext';

export const useAuthController = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const { setUser, setUserRole, setIsAuthenticated } = useAuthModel();

    const login = async (email, password) => {
        setIsLoading(true);
        setError(null);

        try {
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) throw signInError;

            if (data.user) {
                const role = data.user.user_metadata?.role || 'auxiliar';
                setUser(data.user);
                setUserRole(role);
                setIsAuthenticated(true);
                return true;
            }
        } catch (err) {
            console.error('Login error:', err);
            setError(err.message === 'Invalid login credentials'
                ? 'Credenciales incorrectas. Por favor verifica tu correo y contraseña.'
                : 'Error al iniciar sesión. Inténtalo de nuevo.');
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            await supabase.auth.signOut();
            setUser(null);
            setUserRole("");
            setIsAuthenticated(false);
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    return {
        login,
        logout,
        isLoading,
        error
    };
};
