import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Footer from '../../components/Footer';

const AuxiliarDashboard = ({ onNavigate, onLogout, userName }) => {
    const [progress, setProgress] = useState(30); // Simulado: 30% completado
    const [scannedToday, setScannedToday] = useState(150);
    const dailyGoal = 500;
    const ranking = 3;

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-100">
            {/* Header */}
            <motion.header
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-2xl"
            >
                <div className="container mx-auto px-4 md:px-6 py-4 md:py-5 flex items-center justify-between">
                    <div className="flex items-center space-x-3 md:space-x-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-full flex items-center justify-center">
                            <i className="fas fa-barcode text-blue-600 text-xl md:text-2xl"></i>
                        </div>
                        <div>
                            <h1 className="text-lg md:text-2xl font-bold">ZENGO - Auxiliar</h1>
                            <p className="text-xs md:text-sm text-blue-100">Modo Operador</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3 md:space-x-4">
                        <div className="flex items-center space-x-2 md:space-x-3 bg-white/10 rounded-xl px-3 py-2">
                            <div className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-full flex items-center justify-center">
                                <i className="fas fa-user text-blue-600"></i>
                            </div>
                            <span className="hidden sm:block text-sm md:text-base font-medium">{userName}</span>
                        </div>

                        <button
                            onClick={onLogout}
                            className="px-4 md:px-6 py-2 bg-white/20 hover:bg-white hover:text-blue-600 rounded-xl font-semibold transition-all border border-white/30 text-sm md:text-base"
                        >
                            <i className="fas fa-sign-out-alt mr-1 md:mr-2"></i>
                            <span className="hidden sm:inline">Salir</span>
                        </button>
                    </div>
                </div>
            </motion.header>

            <div className="container mx-auto px-4 md:px-6 py-8 md:py-12 flex-grow">
                {/* Estadísticas del Día */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8"
                >
                    {/* Meta Diaria */}
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-gray-700 font-semibold">Meta Diaria</h3>
                            <i className="fas fa-bullseye text-blue-600 text-2xl"></i>
                        </div>
                        <div className="mb-2">
                            <div className="flex justify-between text-sm text-gray-600 mb-1">
                                <span>{scannedToday} productos</span>
                                <span>{dailyGoal} objetivo</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                                <div
                                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-blue-600">{progress}% Completado</p>
                    </div>

                    {/* Ranking */}
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-gray-700 font-semibold">Tu Ranking</h3>
                            <i className="fas fa-trophy text-yellow-500 text-2xl"></i>
                        </div>
                        <p className="text-4xl font-bold text-yellow-600 mb-2">#{ranking}</p>
                        <p className="text-sm text-gray-600">Más rápido de la tienda</p>
                    </div>

                    {/* Productos Hoy */}
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-gray-700 font-semibold">Escaneados Hoy</h3>
                            <i className="fas fa-box text-green-600 text-2xl"></i>
                        </div>
                        <p className="text-4xl font-bold text-green-600 mb-2">{scannedToday}</p>
                        <p className="text-sm text-gray-600">Productos contados</p>
                    </div>
                </motion.div>

                {/* Botón Principal de Escaneo */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mb-8"
                >
                    <motion.div
                        whileHover={{ scale: 1.02, y: -5 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onNavigate("scanner")}
                        className="cursor-pointer bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl shadow-2xl p-12 text-center hover:shadow-3xl transition-all border-4 border-blue-400"
                    >
                        <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                            <i className="fas fa-barcode text-blue-600 text-6xl"></i>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                            Iniciar Escaneo
                        </h2>
                        <p className="text-blue-100 text-lg">
                            Toca para comenzar a escanear productos
                        </p>
                    </motion.div>
                </motion.div>

                {/* Acceso Rápido */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        whileHover={{ scale: 1.03 }}
                        onClick={() => onNavigate("scanner")}
                        className="cursor-pointer bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all"
                    >
                        <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                                <i className="fas fa-search text-white text-2xl"></i>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">Búsqueda Rápida</h3>
                                <p className="text-gray-600">Consultar productos</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-gray-100 rounded-2xl shadow-lg p-8 opacity-50 cursor-not-allowed"
                    >
                        <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 bg-gray-400 rounded-xl flex items-center justify-center">
                                <i className="fas fa-lock text-white text-2xl"></i>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-500">Inventario Cíclico</h3>
                                <p className="text-gray-400">Acceso restringido</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default AuxiliarDashboard;
