import { useState, useCallback } from 'react';
import { useAuthModel } from '../models/AuthContext';

export const useNavigationController = () => {
    const [currentView, setCurrentView] = useState("intro");
    const { userRole } = useAuthModel();

    const navigateTo = useCallback((view) => {
        // Permission validation logic
        if (view === "inventory" && userRole === "auxiliar") {
            alert("No tienes permisos para acceder a Inventario Cíclico");
            return;
        }

        if (view === "dashboard" || view === "intro" || view === "login") {
            setCurrentView(view);
            return;
        }

        // Default navigation
        setCurrentView(view);
    }, [userRole]);

    return {
        currentView,
        navigateTo
    };
};
