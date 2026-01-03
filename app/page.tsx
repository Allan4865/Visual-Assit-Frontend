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
      <div className="mt-8 p-4 bg-gray-800 rounded-md border border-gray-700">
        <h3 className="font-semibold mb-2">Instrucciones de Uso</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-gray-300">
          <li>Descubre y selecciona una cámara usando el panel lateral</li>
          <li>Presiona "Iniciar Detección" para comenzar el análisis en tiempo real</li>
          <li>Las detecciones se mostrarán con códigos de color según su prioridad:
            <ul className="list-disc list-inside ml-6 mt-1">
              <li className="text-red-400">Rojo: Prioridad muy alta (objetos muy cerca o en el centro)</li>
              <li className="text-yellow-400">Amarillo: Prioridad media (objetos cerca)</li>
              <li className="text-gray-400">Gris: Prioridad baja (objetos lejanos)</li>
            </ul>
          </li>
          <li>Activa el audio para recibir alertas vocales en español</li>
          <li>Presiona "Detener Detección" para finalizar la sesión</li>
        </ol>
      </div>
    </main>
  );
}
