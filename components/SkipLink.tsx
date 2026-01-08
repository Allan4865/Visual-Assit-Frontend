'use client';

import { useAccessibility } from '@/context/AccessibilityContext';

export default function SkipLink() {
    const { isScreenReaderOptimized } = useAccessibility();

    // Direct speak function that works even if context isn't fully ready
    const speak = (message: string) => {
        if (!isScreenReaderOptimized) return;
        if (typeof window !== 'undefined') {
            const synth = window.speechSynthesis;
            synth.cancel();
            const utter = new SpeechSynthesisUtterance(message);
            utter.lang = 'es-ES';
            utter.rate = 1.2;
            synth.speak(utter);
        }
    };

    const navigateToInstructions = () => {
        const target = document.getElementById('instrucciones-uso');
        if (target) {
            target.focus();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });

            // Read the instructions aloud
            setTimeout(() => {
                const instructionsText = `
          Instrucciones de Uso.
          1. Selecciona una cámara: Presiona C para ir a la lista de cámaras. Usa las flechas arriba y abajo para navegar y Enter para seleccionar.
          2. Agregar cámara: Presiona D para ir a los botones de descubrir. Puedes agregar cámaras locales o remotas RTSP.
          3. Iniciar detección: Con una cámara seleccionada, presiona Espacio o Enter para iniciar o detener la detección de objetos.
          4. Alertas de voz: El sistema anuncia los objetos detectados y su distancia aproximada: cerca, lejos, o muy cerca. Usa M para silenciar o activar el audio de detecciones.
          5. Modo texto: Presiona T para alternar entre video y lista de texto de detecciones.
          6. Accesibilidad: Presiona A para abrir el panel de accesibilidad donde puedes activar alto contraste, cambiar tamaño de texto, y activar o desactivar alertas por voz.
        `;
                speak(instructionsText);
            }, 300);
        }
    };

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        e.stopPropagation();
        navigateToInstructions();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLAnchorElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            navigateToInstructions();
        }
    };

    return (
        <a
            href="#instrucciones-uso"
            className="skip-link"
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            onFocus={() => speak('¿Necesitas ayuda para usar esta página? Presiona Enter para escuchar las instrucciones.')}
        >
            ¿Necesitas ayuda para usar esta página?
        </a>
    );
}
