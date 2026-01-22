import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Footer from '../../components/Footer';

const JefeDashboard = ({ onNavigate, onLogout, userName }) => {
    const [discrepancias, setDiscrepancias] = useState(12);
    const [hallazgos, setHallazgos] = useState(5);
    const [zonasCompletadas, setZonasCompletadas] = useState(8);
    const totalZonas = 15;

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-100">
            {/* Header */}
            <motion.header
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                className="bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-2xl"
            >
                <div className="container mx-auto px-4 md:px-6 py-4 md:py-5 flex items-center justify-between">
                    <div className="flex items-center space-x-3 md:space-x-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-full flex items-center justify-center">
                            <i className="fas fa-user-tie text-purple-600 text-xl md:text-2xl"></i>
                        </div>
                        <div>
                            <h1 className="text-lg md:text-2xl font-bold">ZENGO - Jefatura</h1>
                            <p className="text-xs md:text-sm text-purple-100">Panel de Supervisión</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3 md:space-x-4">
                        <div className="flex items-center space-x-2 md:space-x-3 bg-white/10 rounded-xl px-3 py-2">
                            <div className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-full flex items-center justify-center">
                                <i className="fas fa-user text-purple-600"></i>
                            </div>
                            <span className="hidden sm:block text-sm md:text-base font-medium">{userName}</span>
                        </div>

                        <button
                            onClick={onLogout}
                            className="px-4 md:px-6 py-2 bg-white/20 hover:bg-white hover:text-purple-600 rounded-xl font-semibold transition-all border border-white/30 text-sm md:text-base"
                        >
                            <i className="fas fa-sign-out-alt mr-1 md:mr-2"></i>
                            <span className="hidden sm:inline">Salir</span>
                        </button>
                    </div>
                </div>
            </motion.header>

            <div className="container mx-auto px-4 md:px-6 py-8 md:py-12 flex-grow">
                {/* Alertas y Métricas */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8"
                >
                    {/* Discrepancias */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-red-500">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-gray-700 font-semibold">Discrepancias</h3>
                            <i className="fas fa-exclamation-triangle text-red-500 text-2xl"></i>
                        </div>
                        <p className="text-4xl font-bold text-red-600 mb-2">{discrepancias}</p>
                        <p className="text-sm text-gray-600">Requieren re-conteo</p>
                    </div>

                    {/* Hallazgos Pendientes */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-yellow-500">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-gray-700 font-semibold">Hallazgos</h3>
                            <i className="fas fa-clipboard-question text-yellow-500 text-2xl"></i>
                        </div>
                        <p className="text-4xl font-bold text-yellow-600 mb-2">{hallazgos}</p>
                        <p className="text-sm text-gray-600">Pendientes de autorización</p>
                    </div>

                    {/* Progreso de Zonas */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-gray-700 font-semibold">Zonas Completadas</h3>
                            <i className="fas fa-map-marked-alt text-green-500 text-2xl"></i>
                        </div>
                        <p className="text-4xl font-bold text-green-600 mb-2">{zonasCompletadas}/{totalZonas}</p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                            <div
                                className="bg-green-500 h-2 rounded-full"
                                style={{ width: `${(zonasCompletadas / totalZonas) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                </motion.div>

                {/* Navegación Principal */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-8">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        whileHover={{ scale: 1.03, y: -5 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onNavigate("scanner")}
                        className="cursor-pointer bg-white rounded-2xl md:rounded-3xl shadow-xl p-8 md:p-12 hover:shadow-2xl transition-all border-4 border-transparent hover:border-purple-600"
                    >
                        <div className="text-center">
                            <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-lg">
                                <i className="fas fa-search text-white text-3xl md:text-4xl"></i>
                            </div>
                            <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2 md:mb-3">
                                Búsqueda
                            </h3>
                            <p className="text-gray-600 text-base md:text-lg">
                                Consultar productos y stock
                            </p>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        whileHover={{ scale: 1.03, y: -5 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onNavigate("inventory")}
                        className="cursor-pointer bg-white rounded-2xl md:rounded-3xl shadow-xl p-8 md:p-12 hover:shadow-2xl transition-all border-4 border-transparent hover:border-purple-600"
                    >
                        <div className="text-center">
                            <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-lg">
                                <i className="fas fa-clipboard-check text-white text-3xl md:text-4xl"></i>
                            </div>
                            <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2 md:mb-3">
                                Inventario Cíclico
                            </h3>
                            <p className="text-gray-600 text-base md:text-lg">
                                Auditoría y conteo
                            </p>
                        </div>
                    </motion.div>
                </div>

                {/* Mapa de Calor (Placeholder) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white rounded-2xl shadow-xl p-6 md:p-8"
                >
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                        <i className="fas fa-fire text-red-500 mr-3"></i>
                        Mapa de Calor - Progreso por Pasillos
                    </h3>
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                        {[...Array(15)].map((_, i) => (
                            <div
                                key={i}
                                className={`p-4 rounded-lg text-center font-semibold ${i < zonasCompletadas
                                        ? 'bg-green-100 text-green-700 border-2 border-green-500'
                                        : 'bg-gray-100 text-gray-500 border-2 border-gray-300'
                                    }`}
                            >
                                <div className="text-xs mb-1">Pasillo</div>
                                <div className="text-lg">{i + 1}</div>
                                {i < zonasCompletadas && <i className="fas fa-check text-green-600 text-xs mt-1"></i>}
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            <Footer />
        </div>
    );
};

export default JefeDashboard;
