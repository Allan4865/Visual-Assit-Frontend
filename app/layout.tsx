/*
 * Diseño raíz para la aplicación Next.js.
 * Define la estructura básica del documento HTML y aplica un tema oscuro
 * sencillo mediante clases de Tailwind CSS. Este diseño también prepara
 * espacio para que los lectores de pantalla anuncien cambios de ruta
 * mediante el componente incorporado de Next.js.
 */

import type { ReactNode } from 'react';
import './globals.css';
import { SessionProvider } from '@/context/SessionContext';
import { AccessibilityProvider } from '@/context/AccessibilityContext';
import AccessibilitySettings from '@/components/AccessibilitySettings';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head>
        <title>Sistema de Asistencia Visual</title>
      </head>
      <body className="bg-slate-900 text-gray-100 min-h-screen transition-colors duration-200">
        <a href="#main-content" className="skip-link">
          Saltar al contenido principal
        </a>
        <AccessibilityProvider>
          <SessionProvider>
            {children}
            <AccessibilitySettings />
          </SessionProvider>
        </AccessibilityProvider>
      </body>
    </html>
  );
}