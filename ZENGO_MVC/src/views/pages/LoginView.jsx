import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthController } from '../../controllers/useAuthController';

const LoginView = ({ onLogin }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const { login, isLoading, error } = useAuthController();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (email && password) {
            const success = await login(email, password);
            // onLogin prop might be deprecated in favor of context, 
            // but keeping it for App compatibility if needed, though controller handles state
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center login-bg relative">
            <div className="absolute inset-0 login-overlay"></div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-md mx-auto">
                    {/* Logo y Encabezado */}
                    <motion.div
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="text-center mb-8"
                    >
                        <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 inline-block shadow-2xl mb-6">
                            {/* ZENGO Logo */}
                            <div className="flex flex-col items-center">
                                <div className="flex items-center justify-center gap-3 mb-2">
                                    <i className="fas fa-bolt text-4xl text-od-red animate-pulse"></i>
                                    <h1 className="text-5xl font-black text-white tracking-tight">ZENGO</h1>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl font-bold text-od-red">前後</span>
                                    <span className="w-1 h-1 bg-white rounded-full"></span>
                                    <span className="text-white/80 text-sm font-medium tracking-widest uppercase">Inventario Cíclico</span>
                                </div>
                            </div>
                        </div>
                        <p className="text-gray-300 text-lg">Inicia sesión para comenzar tu turno</p>
                    </motion.div>

                    {/* Formulario de Login */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/20 shadow-2xl"
                    >
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="bg-red-500/80 border border-red-400 text-white px-4 py-3 rounded-xl text-sm flex items-center"
                                >
                                    <i className="fas fa-exclamation-circle mr-2 text-lg"></i>
                                    {error}
                                </motion.div>
                            )}

                            <div>
                                <label className="block text-white/80 text-sm font-semibold mb-2 ml-1">Correo Electrónico</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <i className="fas fa-envelope text-gray-400 group-focus-within:text-od-red transition-colors"></i>
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-od-red focus:border-transparent transition-all"
                                        placeholder="nombre@officedepot.com"
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-white/80 text-sm font-semibold mb-2 ml-1">Contraseña</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <i className="fas fa-lock text-gray-400 group-focus-within:text-od-red transition-colors"></i>
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-od-red focus:border-transparent transition-all"
                                        placeholder="Ingresa tu contraseña"
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            <motion.button
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                whileHover={{ scale: isLoading ? 1 : 1.02 }}
                                whileTap={{ scale: isLoading ? 1 : 0.98 }}
                                type="submit"
                                disabled={isLoading}
                                className={`w-full py-4 bg-gradient-to-r from-od-red to-od-red-dark text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Conectando...
                                    </div>
                                ) : (
                                    <span className="flex items-center justify-center">
                                        Iniciar Sesión <i className="fas fa-arrow-right ml-2"></i>
                                    </span>
                                )}
                            </motion.button>
                        </form>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="mt-8 text-center"
                    >
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="inline-flex items-center bg-white/5 px-4 py-2 rounded-full border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
                        >
                            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center mr-3 shadow-lg">
                                <span className="text-white font-bold text-xs">OD</span>
                            </div>
                            <div className="text-left">
                                <span className="block text-xs text-gray-400">Powered by</span>
                                <span className="text-xl font-bold text-white">DEPOT</span>
                            </div>
                            <p className="text-gray-400 text-xs ml-3 border-l border-white/20 pl-3">2026</p>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default LoginView;
