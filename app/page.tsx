'use client';

/*
 * Página principal del frontend de asistencia visual.
 * Incluye el selector de cámara y el componente de transmisión de video
 * con detección de objetos en tiempo real mediante Socket.IO.
 * Las notificaciones se anuncian a través de un área aria-live para
 * asegurar la accesibilidad.
 */

import dynamic from 'next/dynamic';

// Cargar componentes en cliente (Next.js App Router)
const VideoStream = dynamic(() => import('../components/VideoStream'), { ssr: false });
const CameraSelector = dynamic(() => import('../components/CameraSelector'), { ssr: false });

export default function HomePage() {
  return (
    <main id="main-content" tabIndex={-1} className="flex min-h-screen flex-col items-center justify-between p-4 md:p-8 relative focus:outline-none">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Sistema de Asistencia Visual</h1>
        <p className="text-gray-400">
          Sistema de asistencia visual para entornos de oficina. Detecta objetos en tiempo real usando YOLOv8
          y estimación de profundidad con MiDaS, proporcionando retroalimentación auditiva para personas con discapacidad visual.
        </p>
      </div>

      {/* Main content grid - Sidebar más compacto, video más grande */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 w-full">
        {/* Sidebar - Camera Selector (1 de 5 columnas) */}
        <div className="lg:col-span-1">
          <div className="sticky top-4 z-50">
            <CameraSelector />
          </div>
        </div>

        {/* Main content - Video Stream (4 de 5 columnas) */}
        <div className="lg:col-span-4">
          <VideoStream />
        </div>
      </div>

      {/* Footer info */}
      <div id="instrucciones-uso" tabIndex={-1} className="mt-8 p-4 bg-gray-800 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400">
        <h3 className="font-semibold mb-2">Instrucciones de Uso</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
          <li><strong>Selecciona una cámara:</strong> Presiona <kbd className="px-1 bg-gray-700 rounded">C</kbd> para ir a la lista de cámaras. Usa las flechas ↑↓ para navegar y <kbd className="px-1 bg-gray-700 rounded">Enter</kbd> para seleccionar.</li>
          <li><strong>Agregar cámara:</strong> Presiona <kbd className="px-1 bg-gray-700 rounded">D</kbd> para ir a los botones de descubrir. Puedes agregar cámaras locales o remotas (RTSP).</li>
          <li><strong>Iniciar detección:</strong> Con una cámara seleccionada, presiona <kbd className="px-1 bg-gray-700 rounded">Espacio</kbd> o <kbd className="px-1 bg-gray-700 rounded">Enter</kbd> para iniciar/detener la detección de objetos.</li>
          <li><strong>Alertas de voz:</strong> El sistema anuncia los objetos detectados y su distancia aproximada (cerca, lejos, muy cerca). Usa <kbd className="px-1 bg-gray-700 rounded">M</kbd> para silenciar/activar el audio de detecciones.</li>
          <li><strong>Modo texto:</strong> Presiona <kbd className="px-1 bg-gray-700 rounded">T</kbd> para alternar entre video y lista de texto de detecciones.</li>
          <li><strong>Accesibilidad:</strong> Presiona <kbd className="px-1 bg-gray-700 rounded">A</kbd> para abrir el panel de accesibilidad donde puedes activar alto contraste, cambiar tamaño de texto, y activar/desactivar alertas por voz.</li>
        </ol>
      </div>
    </main>
  );
}
