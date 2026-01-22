import React from 'react';

const Footer = () => {
    return (
        <footer className="bg-od-black text-white/80 py-6 md:py-8 mt-auto border-t border-white/10 relative overflow-hidden">
            <div className="container mx-auto px-6 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">

                    {/* Logo y Copyright */}
                    <div className="flex items-center gap-4">
                        <div className="bg-white p-2 rounded-lg">
                            <span className="text-od-red font-black text-lg tracking-tight" style={{ fontFamily: 'Arial Black, sans-serif' }}>Office</span>
                            <span className="text-od-black font-black text-lg" style={{ fontFamily: 'Arial Black, sans-serif' }}>DEPOT</span>
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-medium text-white">Office Depot Costa Rica</p>
                            <p className="text-xs text-white/50">&copy; 2026 Todos los derechos reservados</p>
                        </div>
                    </div>

                    {/* Información del Sistema */}
                    <div className="flex items-center gap-6 md:gap-12">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                                <i className="fas fa-box-open text-white text-sm"></i>
                            </div>
                            <div className="text-left">
                                <p className="text-white/60 text-xs">Módulo</p>
                                <p className="text-white text-sm font-semibold">Inventarios</p>
                            </div>
                        </div>
                        <div className="w-px h-8 bg-white/20 hidden md:block"></div>
                        <div className="flex items-center gap-2 hidden md:flex">
                            <div className="w-8 h-8 bg-od-red rounded-lg flex items-center justify-center">
                                <i className="fas fa-calendar text-white text-sm"></i>
                            </div>
                            <div className="text-left">
                                <p className="text-white/60 text-xs">Año</p>
                                <p className="text-white text-sm font-semibold">2026</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Partículas decorativas */}
            <div className="absolute top-1/4 left-10 w-2 h-2 bg-od-red rounded-full opacity-50 floating-particle"></div>
            <div className="absolute top-1/3 right-20 w-3 h-3 bg-white/30 rounded-full floating-particle" style={{ animationDelay: '1s' }}></div>
        </footer>
    );
};

export default Footer;
