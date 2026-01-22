import React, { useState, useEffect, useRef } from 'react';

const IntroView = ({ onComplete }) => {
    const videoRef = useRef(null);
    const [isVideoLoaded, setIsVideoLoaded] = useState(false);
    const [showContent, setShowContent] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowContent(true);
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    const handleVideoLoad = () => {
        setIsVideoLoaded(true);
        if (videoRef.current) {
            videoRef.current.play().catch(e => console.log('Autoplay prevented'));
        }
    };

    return (
        <div className="intro-overlay">
            {/* Video de fondo - Reemplazar src con el video real si está disponible en public folder */}
            <video
                ref={videoRef}
                className="intro-video"
                autoPlay
                muted
                loop
                playsInline
                onLoadedData={handleVideoLoad}
                style={{ opacity: isVideoLoaded ? 1 : 0, transition: 'opacity 1s ease' }}
            >
                <source src="/videos/watermarked-c0f55b8e-301e-4daf-b531-bbb7cef120f4.mp4" type="video/mp4" />
            </video>

            {/* Overlay gradiente */}
            <div className="intro-gradient-overlay"></div>

            {/* Viñeta */}
            <div className="intro-vignette"></div>

            {/* Logo Office Depot - Esquina superior derecha */}
            <div className="watermark-cover">
                <div className="flex items-center gap-1">
                    <span className="text-white font-black text-lg tracking-tight" style={{ fontFamily: 'Arial Black, sans-serif' }}>Office</span>
                    <span className="text-white font-black text-lg" style={{ fontFamily: 'Arial Black, sans-serif' }}>DEPOT</span>
                </div>
            </div>

            {/* Contenido principal */}
            {showContent && (
                <div className="absolute inset-0 flex flex-col items-center justify-center px-4 md:px-8">

                    {/* ZENGO Badge - Esquina superior izquierda */}
                    <div className="absolute top-6 left-6 opacity-0 animate-fade-in delay-300" style={{ animationFillMode: 'forwards' }}>
                        <div className="glass-dark px-6 py-3 rounded-xl border-2 border-od-red/50">
                            <p className="text-white font-bold text-lg md:text-xl" style={{ fontFamily: 'Poppins, sans-serif', letterSpacing: '0.1em' }}>
                                <i className="fas fa-bolt mr-2 text-od-red"></i>
                                ZENGO <span className="text-od-red ml-2">前後</span>
                            </p>
                            <p className="text-white/60 text-xs mt-1">Auditoría Inteligente</p>
                        </div>
                    </div>

                    {/* Contenedor central - Compacto */}
                    <div className="text-center max-w-4xl mx-auto py-4 md:py-6">

                        {/* Icono principal */}
                        <div className="mb-4 md:mb-5 opacity-0 animate-fade-in-up" style={{ animationFillMode: 'forwards' }}>
                            <div className="w-16 h-16 md:w-20 md:h-20 mx-auto bg-gradient-to-br from-od-red to-od-red-dark rounded-2xl flex items-center justify-center shadow-2xl animate-pulse-glow">
                                <i className="fas fa-warehouse text-white text-2xl md:text-3xl"></i>
                            </div>
                        </div>

                        {/* Línea decorativa superior */}
                        <div className="flex justify-center mb-3 md:mb-4 opacity-0 animate-fade-in delay-200" style={{ animationFillMode: 'forwards' }}>
                            <div className="animated-line delay-300"></div>
                        </div>

                        {/* Título del proyecto - ZENGO Compacto */}
                        <h1 className="project-title text-4xl md:text-5xl lg:text-6xl font-black text-white mb-2 md:mb-3 opacity-0 animate-fade-in-up delay-300" style={{ animationFillMode: 'forwards', letterSpacing: '0.05em' }}>
                            ZENGO
                        </h1>
                        <h2 className="project-title text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4 opacity-0 animate-fade-in-up delay-400" style={{ animationFillMode: 'forwards', color: '#ff6b7a' }}>
                            前後
                        </h2>
                        <div className="opacity-0 animate-fade-in-up delay-500 mb-4 md:mb-5" style={{ animationFillMode: 'forwards' }}>
                            <p className="text-lg md:text-xl lg:text-2xl text-white font-semibold mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                Sistema de Inventario Cíclico
                            </p>
                            <p className="text-sm md:text-base text-white/70 font-light px-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                Auditoría Inteligente • Resiliencia Offline • Optimización de Hardware
                            </p>
                        </div>

                        {/* Línea decorativa inferior */}
                        <div className="flex justify-center mb-5 md:mb-6 opacity-0 animate-fade-in delay-600" style={{ animationFillMode: 'forwards' }}>
                            <div className="animated-line delay-700"></div>
                        </div>

                        {/* Integrantes - Compacto */}
                        <div className="mb-5 md:mb-6 opacity-0 animate-fade-in-up delay-700" style={{ animationFillMode: 'forwards' }}>
                            <p className="text-white/60 text-xs md:text-sm uppercase tracking-widest mb-3 md:mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                <i className="fas fa-code mr-2"></i>
                                Desarrollado por
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 max-w-2xl mx-auto px-4">
                                <div className="team-member text-white/95 text-xs md:text-sm font-semibold px-4 py-2 rounded-lg bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-md border border-white/20 hover:border-od-red/50 transition-all">
                                    <i className="fas fa-user-circle mr-2 text-od-red text-xs"></i>
                                    Danny Enrique Grijalba Gutierrez
                                </div>
                                <div className="team-member text-white/95 text-xs md:text-sm font-semibold px-4 py-2 rounded-lg bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-md border border-white/20 hover:border-od-red/50 transition-all">
                                    <i className="fas fa-user-circle mr-2 text-od-red text-xs"></i>
                                    Nicolas Kankrini Morales
                                </div>
                                <div className="team-member text-white/95 text-xs md:text-sm font-semibold px-4 py-2 rounded-lg bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-md border border-white/20 hover:border-od-red/50 transition-all">
                                    <i className="fas fa-user-circle mr-2 text-od-red text-xs"></i>
                                    Danny Aguilar Umaña
                                </div>
                                <div className="team-member text-white/95 text-xs md:text-sm font-semibold px-4 py-2 rounded-lg bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-md border border-white/20 hover:border-od-red/50 transition-all">
                                    <i className="fas fa-user-circle mr-2 text-od-red text-xs"></i>
                                    Verny Cubero Galán
                                </div>
                            </div>
                        </div>

                        {/* Botón de entrada - Compacto */}
                        <div className="opacity-0 animate-fade-in-up delay-1000 mb-4" style={{ animationFillMode: 'forwards' }}>
                            <button
                                onClick={onComplete}
                                className="enter-btn px-8 py-3 text-white font-black text-base md:text-lg rounded-xl shadow-2xl relative overflow-hidden group"
                            >
                                <span className="relative z-10 flex items-center justify-center">
                                    <i className="fas fa-rocket mr-2 group-hover:animate-bounce"></i>
                                    Ingresar al Sistema ZENGO
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                            </button>
                        </div>

                        {/* Indicador de scroll/click */}
                        <div className="mt-4 opacity-0 animate-fade-in delay-1200" style={{ animationFillMode: 'forwards' }}>
                            <p className="text-white/40 text-[10px]" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                <i className="fas fa-mouse mr-2"></i>
                                Click para continuar
                            </p>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default IntroView;
