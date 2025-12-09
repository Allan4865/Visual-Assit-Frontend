# Frontend - Sistema de Asistencia Visual

Frontend de Next.js para el sistema de asistencia visual con detección de objetos en tiempo real usando YOLOv8 y estimación de profundidad con MiDaS.

## 🚀 Tecnologías Utilizadas

- **Next.js 15.5.4** - Framework React con App Router
- **React 18.2.0** - Biblioteca UI
- **TypeScript** - Tipado estático
- **Tailwind CSS 3.4** - Estilos CSS utility-first
- **Socket.IO Client** - Comunicación WebSocket en tiempo real
- **Axios** - Cliente HTTP para API REST

## 📁 Estructura del Proyecto

```
frontend/
├── app/                          # App Router de Next.js
│   ├── layout.tsx               # Layout raíz con SessionProvider
│   ├── page.tsx                 # Página principal
│   └── globals.css              # Estilos globales con Tailwind
│
├── components/                   # Componentes React
│   ├── VideoStream.tsx          # Streaming de video y detecciones
│   └── CameraSelector.tsx       # Selector y gestión de cámaras
│
├── services/                     # Servicios de comunicación
│   ├── api.ts                   # Cliente API REST (axios)
│   └── socket.ts                # Cliente Socket.IO
│
├── hooks/                        # Custom hooks
│   ├── useSocket.ts             # Hook para Socket.IO
│   └── useDetections.ts         # Hook para gestión de detecciones
│
├── context/                      # Context API
│   └── SessionContext.tsx       # Estado global de sesión
│
├── .env                          # Variables de entorno
├── tsconfig.json                # Configuración TypeScript
├── tailwind.config.js           # Configuración Tailwind CSS
├── postcss.config.js            # Configuración PostCSS
├── next.config.js               # Configuración Next.js
└── package.json                 # Dependencias del proyecto
```

## ⚙️ Configuración

### 1. Variables de Entorno

Copia `.env.example` a `.env` y configura las variables:

```env
# Backend API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_API_HOST=localhost:5000

# Socket.IO Configuration
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_NAMESPACE=/detection

# Application Settings
NEXT_PUBLIC_DEFAULT_LANGUAGE=es
```

### 2. Instalación de Dependencias

```bash
npm install
```

## 🎯 Uso

### Modo Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

### Build de Producción

```bash
npm run build
npm start
```

## 🔧 Arquitectura

### Flujo de Datos

```
Usuario interactúa con UI
    ↓
SessionContext (estado global)
    ↓
useSocket Hook → Socket.IO → Backend
    ↓
Frames de video (base64) + Detecciones
    ↓
useDetections Hook (procesamiento)
    ↓
VideoStream Component (renderizado)
```

### Componentes Principales

#### 1. **VideoStream** ([components/VideoStream.tsx](components/VideoStream.tsx))

Componente principal que:
- Muestra video en tiempo real usando Canvas
- Recibe frames en base64 desde Socket.IO
- Procesa y prioriza detecciones
- Proporciona retroalimentación auditiva (TTS)
- Control de inicio/parada de detección

#### 2. **CameraSelector** ([components/CameraSelector.tsx](components/CameraSelector.tsx))

Componente para:
- Listar cámaras configuradas
- Descubrir nuevas cámaras
- Agregar/eliminar cámaras
- Seleccionar cámara activa

### Servicios

#### **API Service** ([services/api.ts](services/api.ts))

Cliente HTTP para endpoints REST del backend:
- `getCameras()`, `createCamera()`, `deleteCamera()`
- `getSessions()`, `createSession()`, `endSession()`
- `getDetections()`, `getSessionStats()`
- Manejo automático de errores
- Interceptores de request/response

#### **Socket Service** ([services/socket.ts](services/socket.ts))

Cliente Socket.IO para comunicación en tiempo real:
- Conexión al namespace `/detection`
- Eventos: `start_detection`, `stop_detection`, `frame`
- Reconexión automática
- Manejo de errores robusto

### Hooks Personalizados

#### **useSocket** ([hooks/useSocket.ts](hooks/useSocket.ts))

Hook para gestión de Socket.IO:
```tsx
const {
  isConnected,
  latestFrame,
  frameCount,
  startDetection,
  stopDetection,
  error
} = useSocket({ autoConnect: true });
```

#### **useDetections** ([hooks/useDetections.ts](hooks/useDetections.ts))

Hook para procesamiento de detecciones:
```tsx
const {
  detections,
  latestDetection,
  priorityDetections,
  addDetections,
  clearDetections
} = useDetections({ maxHistorySize: 50 });
```

### Context

#### **SessionContext** ([context/SessionContext.tsx](context/SessionContext.tsx))

Estado global para:
- Cámaras disponibles y seleccionada
- Sesión actual activa
- Operaciones CRUD de cámaras y sesiones
- Manejo de errores

## 🎨 Características

### ✅ Implementado

- ✅ Conexión Socket.IO en tiempo real
- ✅ Streaming de video con frames base64
- ✅ Detección de objetos con YOLOv8
- ✅ Priorización inteligente de detecciones
- ✅ Retroalimentación auditiva (TTS en español)
- ✅ Gestión de cámaras (CRUD)
- ✅ Gestión de sesiones
- ✅ Diseño responsive con Tailwind CSS
- ✅ Accesibilidad (ARIA-live regions)
- ✅ Indicadores visuales de estado
- ✅ Código de colores por prioridad

### 🔮 Futuras Mejoras

- ⏳ Autenticación y gestión de usuarios
- ⏳ Historial de sesiones con filtros
- ⏳ Estadísticas y gráficos
- ⏳ Exportación de datos
- ⏳ Configuración avanzada de parámetros
- ⏳ Modo offline/PWA
- ⏳ Internacionalización (i18n)
- ⏳ Testing (unit, integration, e2e)

## 🐛 Resolución de Problemas

### El video no se muestra

1. Verifica que el backend esté corriendo en `http://localhost:5000`
2. Comprueba que Socket.IO esté conectado (indicador verde)
3. Asegúrate de haber seleccionado una cámara
4. Presiona "Iniciar Detección"

### Error de conexión Socket.IO

1. Verifica las variables de entorno en `.env`
2. Asegúrate de que el puerto sea `5000` (no `8000`)
3. Comprueba que el backend esté ejecutándose
4. Revisa la consola del navegador para errores detallados

### No hay audio

1. Activa el checkbox "Activar audio"
2. Asegúrate de que el navegador permita TTS (Web Speech API)
3. Verifica el volumen del sistema

### Build falla

1. Elimina `.next/` y `node_modules/`
2. Ejecuta `npm install` nuevamente
3. Verifica que TypeScript compile: `npx tsc --noEmit`

## 📚 Endpoints del Backend

### REST API

- `GET /api/cameras` - Listar cámaras
- `POST /api/cameras` - Crear cámara
- `GET /api/cameras/discover` - Descubrir dispositivos
- `POST /api/sessions` - Crear sesión
- `POST /api/sessions/:id/end` - Finalizar sesión
- `GET /api/detections/session/:id` - Detecciones de sesión
- `GET /api/detections/session/:id/stats` - Estadísticas

### WebSocket (Socket.IO)

**Namespace**: `/detection`

**Eventos del Cliente**:
- `start_detection` - Iniciar detección
  ```json
  { "session_id": 1, "camera_id": 1 }
  ```
- `stop_detection` - Detener detección
  ```json
  { "session_id": 1 }
  ```

**Eventos del Servidor**:
- `frame` - Frame de video con detecciones
  ```json
  {
    "frame": "base64_encoded_image",
    "detections": [...],
    "frame_number": 123,
    "timestamp": 1234567890
  }
  ```
- `detection_started` - Confirmación de inicio
- `detection_stopped` - Confirmación de parada
- `error` - Errores

## 👥 Contribuir

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es parte del Sistema de Asistencia Visual.

## 🙏 Agradecimientos

- **YOLOv8** (Ultralytics) - Detección de objetos
- **MiDaS** (Intel ISL) - Estimación de profundidad
- **Next.js** - Framework React
- **Socket.IO** - WebSocket en tiempo real
