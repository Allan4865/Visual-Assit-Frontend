'use client';

import { useState, useEffect, useRef } from 'react';
import { useAccessibility } from '@/context/AccessibilityContext';

export default function AccessibilitySettings() {
    const {
        theme,
        toggleTheme,
        textSize,
        cycleTextSize,
        isScreenReaderOptimized,
        setScreenReaderOptimized,
        speak
    } = useAccessibility();
    const [isOpen, setIsOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    // Keyboard shortcut for accessibility panel
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in an input
            if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement
            ) return;

            if (e.key.toLowerCase() === 'a') {
                e.preventDefault();
                setIsOpen(prev => {
                    const newState = !prev;
                    const message = newState
                        ? "Panel de accesibilidad abierto, navega con Tab y presiona Enter para confirmar" : "Panel de accesibilidad cerrado";
                    speak(message, true);
                    return newState;
                });
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [speak]);

    // Focus the panel when it opens for accessibility
    useEffect(() => {
        if (isOpen && panelRef.current) {
            // Small delay to ensure panel is rendered
            setTimeout(() => {
                panelRef.current?.focus();
            }, 100);
        }
    }, [isOpen]);

    return (
        <div className="fixed bottom-4 right-4 z-[10000]">
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                onFocus={() => speak(isOpen ? "Cerrar ajustes de accesibilidad" : "Abrir ajustes de accesibilidad")}
                aria-label={isOpen ? "Cerrar ajustes de accesibilidad" : "Abrir ajustes de accesibilidad"}
                className={`
          w-14 h-14 rounded-full shadow-lg flex items-center justify-center
          transition-transform hover:scale-105 focus:outline-none focus:ring-4
          ${theme === 'high-contrast'
                        ? 'bg-yellow-400 text-black border-4 border-white ring-yellow-400'
                        : 'bg-blue-600 text-white ring-blue-400'}
        `}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-8 h-8"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                </svg>
            </button>

            {/* Panel */}
            {isOpen && (
                <div
                    ref={panelRef}
                    tabIndex={-1}
                    className={`
            absolute bottom-16 right-0 w-80 p-4 rounded-lg shadow-xl border-2 focus:outline-none focus:ring-2 focus:ring-blue-400
            ${theme === 'high-contrast'
                            ? 'bg-black border-white text-white'
                            : 'bg-gray-800 border-gray-700 text-gray-100'}
          `}
                    role="dialog"
                    aria-label="Ajustes de accesibilidad"
                >
                    <h2 className="text-lg font-bold mb-4 flex justify-between items-center">
                        Accesibilidad
                        <button
                            onClick={() => setIsOpen(false)}
                            onFocus={() => speak("Cerrar panel")}
                            className="p-1 hover:bg-gray-700 rounded"
                            aria-label="Cerrar panel"
                        >
                            ✕
                        </button>
                    </h2>

                    <div className="space-y-4">
                        {/* High Contrast Toggle */}
                        <div className="flex items-center justify-between">
                            <span className="font-medium">Alto Contraste</span>
                            <button
                                onClick={() => {
                                    toggleTheme();
                                    // Anunciar el NUEVO estado después del cambio
                                    const newState = theme === 'high-contrast' ? 'Desactivado' : 'Activado';
                                    setTimeout(() => speak(`Alto Contraste: ${newState}`), 100);
                                }}
                                onFocus={() => speak(`Alto Contraste: ${theme === 'high-contrast' ? 'Activado' : 'Desactivado'}`)}
                                className={`w-12 h-6 rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-offset-2 ${theme === 'high-contrast'
                                    ? 'bg-yellow-400 focus:ring-yellow-400'
                                    : 'bg-gray-600 focus:ring-gray-400'
                                    }`}
                                aria-label={`Alternar alto contraste. Actual: ${theme === 'high-contrast' ? 'Activado' : 'Desactivado'}`}
                            >
                                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${theme === 'high-contrast' ? 'left-7 bg-black' : 'left-1'
                                    }`} />
                            </button>
                        </div>

                        {/* Text Size Toggle */}
                        <div className="flex items-center justify-between">
                            <span className="font-medium">Tamaño de Texto</span>
                            <button
                                onClick={() => {
                                    cycleTextSize();
                                    // Anunciar el NUEVO tamaño después del cambio
                                    const newSize = textSize === 'normal' ? 'Grande' : textSize === 'large' ? 'Extra Grande' : 'Normal';
                                    setTimeout(() => speak(`Tamaño de texto: ${newSize}`), 100);
                                }}
                                onFocus={() => speak(`Tamaño de texto actual: ${textSize === 'normal' ? 'Normal' : textSize === 'large' ? 'Grande' : 'Extra Grande'}`)}
                                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                                aria-label={`Cambiar tamaño de texto. Actual: ${textSize === 'normal' ? 'Normal' : textSize === 'large' ? 'Grande' : 'Extra Grande'}`}
                            >
                                {textSize === 'normal' ? 'Normal' : textSize === 'large' ? 'Grande' : 'Extra'}
                            </button>
                        </div>

                        <hr className={`border-t ${theme === 'high-contrast' ? 'border-white' : 'border-gray-600'}`} />

                        {/* Screen Reader Optimization Toggle */}
                        <div className="flex items-center justify-between">
                            <span className="font-medium">Modo Accesibilidad (Voz)</span>
                            <button
                                onClick={() => {
                                    const newState = !isScreenReaderOptimized;
                                    setScreenReaderOptimized(newState);
                                    // Use speechSynthesis directly since state hasn't updated yet
                                    const synth = window.speechSynthesis;
                                    synth.cancel(); // Cancel any pending speech first
                                    const message = newState
                                        ? "Alertas por voz activadas"
                                        : "Alertas por voz desactivadas";
                                    const utter = new SpeechSynthesisUtterance(message);
                                    utter.lang = 'es-ES';
                                    utter.rate = 1.2;
                                    synth.speak(utter);
                                }}
                                onFocus={() => {
                                    // Anunciar estado actual usando speechSynthesis directamente
                                    // para que funcione incluso si las alertas por voz están desactivadas
                                    const synth = window.speechSynthesis;
                                    const message = `Modo Accesibilidad Voz: ${isScreenReaderOptimized ? 'Activado' : 'Desactivado'}`;
                                    const utter = new SpeechSynthesisUtterance(message);
                                    utter.lang = 'es-ES';
                                    utter.rate = 1.2;
                                    synth.speak(utter);
                                }}
                                className={`w-12 h-6 rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-offset-2 ${isScreenReaderOptimized
                                    ? 'bg-green-500 focus:ring-green-400'
                                    : 'bg-gray-600 focus:ring-gray-400'
                                    }`}
                                aria-label={`Alternar modo accesibilidad con voz. Actual: ${isScreenReaderOptimized ? 'Activado' : 'Desactivado'}`}
                            >
                                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${isScreenReaderOptimized ? 'left-7' : 'left-1'
                                    }`} />
                            </button>
                        </div>
                        <p className="text-xs opacity-70">
                            Activa la lectura en voz alta de botones y acciones.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
