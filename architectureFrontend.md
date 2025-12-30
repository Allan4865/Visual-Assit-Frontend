# Arquitectura del Frontend - Sistema de Asistencia Visual

## 1. Visión General

El frontend del **Sistema de Asistencia Visual** es una aplicación web moderna basada en React/Next.js con navegación de tipo SPA (client-side routing) e interacción en tiempo real. Proporciona retroalimentación visual y auditiva basada en la detección de objetos, actuando como interfaz principal para el sistema de visión por computadora. Gestiona la visualización de detecciones procesadas y la emisión de alertas accesibles.

El objetivo arquitectónico principal fue asegurar una latencia mínima en la transmisión de video y la máxima accesibilidad web, cumpliendo con principios de diseño inclusivo para personas con discapacidad visual.

## 2. Tecnologías y Stack Tecnológico

El proyecto está construido sobre un stack moderno basado en **React** y **Next.js**, optimizado para rendimiento y escalabilidad.

### 2.1. Núcleo del Framework
*   **Next.js 15 (App Router)**: Utilizado como meta-framework de React para manejar el enrutamiento, la optimización de carga y la estructura modular de la aplicación.
*   **React 18**: Biblioteca base para la construcción de interfaces de usuario interactivas mediante componentes funcionales y hooks.
*   **TypeScript**: Lenguaje de programación principal que añade tipado estático a JavaScript, mejorando la robustez y mantenibilidad del código.

### 2.2. Comunicación y Red
*   **Socket.IO Client**: Gestiona la comunicación bidireccional en tiempo real con el servidor para la transmisión de frames de video y eventos de detección.
*   **Axios**: Cliente HTTP basado en promesas para consumir la API REST del backend (gestión de cámaras, usuarios y sesiones).

### 2.3. Interfaz y Estilos
*   **Tailwind CSS**: Framework de utilidades CSS para un diseño rápido, responsivo y mantenible.
*   **Headless UI / Radix UI**: Componentes accesibles sin estilos (headless) para elementos interactivos como diálogos y notificaciones, asegurando cumplimiento con estándares WAI-ARIA.
*   **React Icons / Heroicons**: Bibliotecas de iconos vectoriales.

### 2.4. Calidad y Desarrollo
*   **ESLint & Prettier**: Herramientas para el análisis estático de código y formateo.
*   **PostCSS & Autoprefixer**: Procesamiento de CSS para compatibilidad entre navegadores.

## 3. Arquitectura de Software

El frontend sigue una arquitectura basada en componentes y servicios, separando claramente la responsabilidad de presentación de la lógica de negocio y comunicación.

### 3.1. Estructura de Directorios

La organización del proyecto sigue las convenciones del *App Router* de Next.js:

```plaintext
/frontend
├── app/                 # Rutas, layouts y páginas (Next.js App Directory)
│   ├── layout.tsx       # Layout raíz global
│   └── page.tsx         # Página principal (Dashboard)
├── components/          # Componentes de UI reutilizables
│   ├── VideoStream.tsx  # Componente crítico de visualización
│   └── CameraSelector.tsx # Gestión de dispositivos
├── context/             # Estado global de la aplicación (React Context)
│   ├── SessionContext.tsx
│   └── AccessibilityContext.tsx
├── services/            # Capa de abstracción de API y WebSocket
│   ├── api.ts           # Cliente REST (Axios)
│   └── socket.ts        # Cliente WebSocket (Singleton)
└── hooks/               # Custom Hooks para lógica encapsulada
```

### 3.2. Capa de Servicios

La capa de servicios abstrae la complejidad de la red de los componentes de UI.

*   **REST Service (`api.ts`)**: Implementa el patrón *Repository/DAO* de facto, centralizando todas las llamadas HTTP. Define interfaces TypeScript (`Camera`, `Session`, `Detection`) que actúan como contrato de datos con el backend.
*   **Socket Service (`socket.ts`)**: Implementa un patrón *Singleton* para gestionar una única conexión WebSocket activa. Expone métodos para suscribirse a eventos (`onFrame`, `onDetectionStarted`) y emitir comandos, desacoplando la lógica de socket de los componentes visuales.

### 3.3. Gestión de Estado

Se utiliza **React Context API** para manejar el estado global que debe persistir a través de diferentes componentes:

*   **SessionContext**: Almacena la información de la sesión activa (ID de sesión, cámara seleccionada, estado de grabación).
*   **AccessibilityContext**: Gestiona las preferencias del usuario (activación de voz, volumen, contraste), permitiendo que la configuración de accesibilidad afecte a toda la app globalmente.

## 4. Componentes Principales

### 4.1. VideoStream (`components/VideoStream.tsx`)
Este es el componente más complejo y crítico del sistema. Sus responsabilidades incluyen:
1.  **Renderizado Canvas**: Recibe frames codificados en Base64 vía WebSocket y los dibuja en un elemento `<canvas>` para alto rendimiento.
2.  **Visualización de Detecciones**: Superpone cuadros delimitadores (bounding boxes) y etiquetas sobre el video basándose en los metadatos recibidos.
3.  **Feedback Auditivo (Text-to-Speech)**: Utiliza la *Web Speech API* del navegador para sintetizar alertas vocales cuando se detectan objetos de alta prioridad, integrándose con el `AccessibilityContext` para respetar las preferencias del usuario.

### 4.2. CameraSelector (`components/CameraSelector.tsx`)
Gestiona el descubrimiento y selección de dispositivos de entrada. Se comunica con la API REST (`/cameras/discover`) para listar dispositivos disponibles y permite al usuario iniciar una sesión de detección.

## 5. Flujo de Datos y Comunicación

El flujo de información en la aplicación es híbrido:

1.  **Inicialización (REST)**: Al cargar, la aplicación consulta la configuración y estado inicial mediante peticiones HTTP estándar.
2.  **Ciclo de Detección (WebSocket)**:
    *   **Inicio**: El usuario selecciona una cámara -> Frontend emite `start_detection`.
    *   **Procesamiento**: El backend captura, procesa y emite eventos `frame`.
    *   **Recepción**: El servicio de Socket recibe el evento `frame` conteniendo:
        *   Imagen procesada (buffer/base64).
        *   Lista de detecciones (coordenadas, clase, confianza).
        *   Metadatos de profundidad/distancia.
    *   **Presentación**: El componente `VideoStream` actualiza la interfaz con un objetivo de ~30 FPS, condicionado por la capacidad del dispositivo y la carga del modelo.

### 5.1. Protocolo WebSocket (Socket.IO)

El cliente utiliza Socket.IO para comunicación bidireccional bajo el namespace `/detection`.

#### Eventos Cliente → Servidor (Input)
| Evento | Payload | Descripción |
|--------|---------|-------------|
| `start_detection` | `{session_id, camera_id}` | Inicia sesión de detección |
| `stop_detection` | `{session_id}` | Detiene sesión activa |

#### Eventos Servidor → Cliente (Output)
| Evento | Payload | Descripción |
|--------|---------|-------------|
| `connected` | `{message}` | Confirmación de conexión |
| `detection_started` | `{session_id, camera_id, message}` | Confirmación de inicio |
| `detection_stopped` | `{message, session_id}` | Confirmación de parada |
| `frame` | `{frame, detections[], frame_number, timestamp}` | Frame procesado (base64) con detecciones |
| `error` | `{error, details?}` | Mensaje de error |

**Estructura de `detections[]`:**
```typescript
{
  object_class: { id, english_name, spanish_name },
  confidence: number,
  position: 'izquierda' | 'centro' | 'derecha',
  distance_category: 'muy cerca' | 'cerca' | 'medio' | 'lejos',
  bbox_x1, bbox_y1, bbox_x2, bbox_y2: number
}
```

> **Nota**: El frontend **no envía frames de video**. El servidor captura directamente desde la cámara local y transmite los resultados procesados.

## 6. Consideraciones de Seguridad y Accesibilidad

### 6.1. Accesibilidad (A11y)

*   **Atributos ARIA**: Uso extensivo de `aria-live`, `aria-label` y roles semánticos para notificar a lectores de pantalla sobre cambios dinámicos.
*   **Text-to-Speech (TTS)**: Integración con la Web Speech API del navegador para alertas vocales.
*   **Control de Spam Auditivo**: Para evitar saturación de alertas, el sistema implementa:
    *   Throttling de anuncios (intervalo mínimo entre alertas del mismo tipo).
    *   Priorización de alertas por proximidad (objetos cercanos tienen prioridad).
    *   El backend aplica cooldown anti-spam antes de emitir alertas repetitivas.

### 6.2. Seguridad Frontend

*   **Variables de Entorno**: Solo variables `NEXT_PUBLIC_*` son expuestas al cliente. URLs sensibles gestionadas mediante `.env.local`.
*   **Sanitización de Datos**: Las etiquetas de detección (labels) se renderizan como texto plano; no se utiliza `dangerouslySetInnerHTML`, previniendo ataques XSS.
*   **Reconexión Segura**: Socket.IO implementa reconexión automática con backoff exponencial (1-5s) y límite de 5 reintentos. Los listeners se limpian antes de re-registrar para evitar duplicación.
*   **Manejo de Errores**: Errores de socket y API se capturan y muestran al usuario sin exponer detalles técnicos internos.
