import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Footer from '../../components/Footer';

const AdminDashboard = ({ onNavigate, onLogout, userName }) => {
    const [mermaTotal, setMermaTotal] = useState(125000);
    const [precisionPromedio, setPrecisionPromedio] = useState(94.5);
    const [productosAuditados, setProductosAuditados] = useState(18750);

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-100">
            {/* Header */}
            <motion.header
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                className="bg-gradient-to-r from-od-red to-od-red-dark text-white shadow-2xl"
            >
                <div className="container mx-auto px-4 md:px-6 py-4 md:py-5 flex items-center justify-between">
                    <div className="flex items-center space-x-3 md:space-x-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-full flex items-center justify-center">
                            <i className="fas fa-crown text-od-red text-xl md:text-2xl"></i>
                        </div>
                        <div>
                            <h1 className="text-lg md:text-2xl font-bold">ZENGO - Administración</h1>
                            <p className="text-xs md:text-sm text-red-100">Panel Gerencial</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3 md:space-x-4">
                        <div className="flex items-center space-x-2 md:space-x-3 bg-white/10 rounded-xl px-3 py-2">
                            <div className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-full flex items-center justify-center">
                                <i className="fas fa-user text-od-red"></i>
                            </div>
                            <span className="hidden sm:block text-sm md:text-base font-medium">{userName}</span>
                        </div>

                        <button
                            onClick={onLogout}
                            className="px-4 md:px-6 py-2 bg-white/20 hover:bg-white hover:text-od-red rounded-xl font-semibold transition-all border border-white/30 text-sm md:text-base"
                        >
                            <i className="fas fa-sign-out-alt mr-1 md:mr-2"></i>
                            <span className="hidden sm:inline">Salir</span>
                        </button>
                    </div>
                </div>
            </motion.header>

            <div className="container mx-auto px-4 md:px-6 py-8 md:py-12 flex-grow">
                {/* KPIs Financieros */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8"
                >
                    {/* Merma Total */}
                    <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl shadow-lg p-6 border-l-4 border-red-600">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-gray-700 font-semibold">Merma Total</h3>
                            <i className="fas fa-chart-line-down text-red-600 text-2xl"></i>
                        </div>
                        <p className="text-3xl font-bold text-red-700 mb-2">
                            ₡{mermaTotal.toLocaleString('es-CR')}
                        </p>
                        <p className="text-sm text-gray-600">Valor de faltantes</p>
                    </div>

                    {/* Precisión Promedio */}
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl shadow-lg p-6 border-l-4 border-green-600">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-gray-700 font-semibold">Precisión</h3>
                            <i className="fas fa-bullseye text-green-600 text-2xl"></i>
                        </div>
                        <p className="text-3xl font-bold text-green-700 mb-2">{precisionPromedio}%</p>
                        <p className="text-sm text-gray-600">Exactitud de conteos</p>
                    </div>

                    {/* Productos Auditados */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg p-6 border-l-4 border-blue-600">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-gray-700 font-semibold">Auditados</h3>
                            <i className="fas fa-box-check text-blue-600 text-2xl"></i>
                        </div>
                        <p className="text-3xl font-bold text-blue-700 mb-2">
                            {productosAuditados.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">Productos verificados</p>
                    </div>
                </motion.div>

                {/* Navegación Principal */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-8">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        whileHover={{ scale: 1.03, y: -5 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onNavigate("scanner")}
                        className="cursor-pointer bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all border-4 border-transparent hover:border-od-red"
                    >
                        <div className="text-center">
                            <div className="w-20 h-20 bg-gradient-to-br from-od-red to-od-red-dark rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                                <i className="fas fa-search text-white text-3xl"></i>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">
                                Búsqueda
                            </h3>
                            <p className="text-gray-600 text-sm">
                                Consultar productos
                            </p>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        whileHover={{ scale: 1.03, y: -5 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onNavigate("inventory")}
                        className="cursor-pointer bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all border-4 border-transparent hover:border-od-red"
                    >
                        <div className="text-center">
                            <div className="w-20 h-20 bg-gradient-to-br from-od-red to-od-red-dark rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                                <i className="fas fa-clipboard-check text-white text-3xl"></i>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">
                                Cíclico
                            </h3>
                            <p className="text-gray-600 text-sm">
                                Auditoría completa
                            </p>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        whileHover={{ scale: 1.03, y: -5 }}
                        className="cursor-pointer bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all border-4 border-yellow-400"
                    >
                        <div className="text-center">
                            <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                                <i className="fas fa-users-gear text-white text-3xl"></i>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">
                                Gestión
                            </h3>
                            <p className="text-gray-600 text-sm">
                                Usuarios y permisos
                            </p>
                        </div>
                    </motion.div>
                </div>

                {/* Exportación NetSuite */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-2xl p-8 text-white"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-2xl font-bold mb-2 flex items-center">
                                <i className="fas fa-file-export mr-3"></i>
                                Exportación NetSuite
                            </h3>
                            <p className="text-indigo-100">
                                Genera el archivo CSV listo para Oracle NetSuite con todos los ajustes de inventario
                            </p>
                        </div>
                        <button className="px-8 py-4 bg-white text-indigo-600 font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all">
                            <i className="fas fa-download mr-2"></i>
                            Exportar
                        </button>
                    </div>
                </motion.div>
            </div>

            <Footer />
        </div>
    );
};

export default AdminDashboard;
