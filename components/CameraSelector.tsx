'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from '@/context/SessionContext';
import { Camera, apiClient } from '@/services/api';
import { useAccessibility } from '@/context/AccessibilityContext';
import { useFocusTrap } from '@/hooks/useFocusTrap';

export default function CameraSelector() {
  const { speak } = useAccessibility();
  const {
    selectedCamera,
    availableCameras,
    setSelectedCamera,
    loadCameras,
    discoverCameras,
    isLoading,
    error,
  } = useSession();

  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveredDevices, setDiscoveredDevices] = useState<
    { index: number; name: string }[]
  >([]);
  const [showDiscovery, setShowDiscovery] = useState(false);
  const [newCameraName, setNewCameraName] = useState('');
  const [selectedDeviceIndex, setSelectedDeviceIndex] = useState<number | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    cameraId: number | null;
    cameraName: string;
  }>({
    isOpen: false,
    cameraId: null,
    cameraName: '',
  });

  // Refs for focus management
  const discoveryModalRef = useRef<HTMLDivElement>(null);
  const deleteModalRef = useRef<HTMLDivElement>(null);

  // Apply focus traps
  useFocusTrap(showDiscovery, discoveryModalRef);
  useFocusTrap(deleteConfirmation.isOpen, deleteModalRef);

  // Load cameras on mount
  useEffect(() => {
    loadCameras();
  }, [loadCameras]);

  /**
   * Discover available camera devices
   */
  const handleDiscover = async () => {
    setIsDiscovering(true);
    try {
      const devices = await discoverCameras();
      setDiscoveredDevices(devices);
      setShowDiscovery(true);
    } catch (err) {
      console.error('Error discovering cameras:', err);
    } finally {
      setIsDiscovering(false);
    }
  };

  /**
   * Create new camera from discovered device
   */
  const handleCreateCamera = async () => {
    if (selectedDeviceIndex === null || !newCameraName.trim()) {
      alert('Por favor selecciona un dispositivo y proporciona un nombre');
      return;
    }

    try {
      console.log('Creating camera with data:', {
        name: newCameraName.trim(),
        device_index: selectedDeviceIndex,
        user_id: 1,
        location: 'Default',
      });

      const newCamera = await apiClient.createCamera({
        name: newCameraName.trim(),
        device_index: selectedDeviceIndex,
        user_id: 1, // TODO: Replace with actual user ID when auth is implemented
        location: 'Default',
      });

      console.log('Camera created successfully:', newCamera);

      // Reload cameras and select the new one
      await loadCameras();
      setSelectedCamera(newCamera);

      // Reset form
      setNewCameraName('');
      setSelectedDeviceIndex(null);
      setShowDiscovery(false);
      alert('Cámara creada exitosamente!');
    } catch (err: any) {
      console.error('Error creating camera:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error message:', err.message);

      let errorMessage = 'Error al crear la cámara';
      if (err.response?.data?.error) {
        errorMessage += `: ${err.response.data.error}`;
      } else if (err.message) {
        errorMessage += `: ${err.message}`;
      }

      alert(errorMessage);
    }
  };

  /**
   * Initiate delete process
   */
  const confirmDelete = (e: React.MouseEvent, camera: Camera) => {
    e.stopPropagation();
    setDeleteConfirmation({
      isOpen: true,
      cameraId: camera.id,
      cameraName: camera.name,
    });
  };

  /**
   * Execute deletion
   */
  const handleDeleteCamera = async () => {
    if (!deleteConfirmation.cameraId) return;

    try {
      await apiClient.deleteCamera(deleteConfirmation.cameraId);

      // If deleted camera was selected, clear selection
      if (selectedCamera?.id === deleteConfirmation.cameraId) {
        setSelectedCamera(null);
      }

      // Reload cameras
      await loadCameras();

      // Close modal
      setDeleteConfirmation({ isOpen: false, cameraId: null, cameraName: '' });
    } catch (err) {
      console.error('Error deleting camera:', err);
      alert('Error al eliminar la cámara');
    }
  };

  // Handle Escape key to close modals
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showDiscovery) setShowDiscovery(false);
        if (deleteConfirmation.isOpen) setDeleteConfirmation({ isOpen: false, cameraId: null, cameraName: '' });
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showDiscovery, deleteConfirmation.isOpen]);

  // Announce instructions when discovery modal opens
  useEffect(() => {
    if (showDiscovery) {
      // Small delay to ensure modal is rendered and previous announcements are finished
      setTimeout(() => {
        speak("Dispositivos descubiertos. Usa las flechas arriba y abajo para elegir una opción.");
      }, 500);
    }
  }, [showDiscovery, speak]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Seleccionar Cámara</h2>
        <button
          onClick={handleDiscover}
          onFocus={() => speak("Botón Descubrir Cámaras")}
          disabled={isDiscovering}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-900"
          aria-busy={isDiscovering}
        >
          {isDiscovering ? 'Descubriendo...' : 'Descubrir Cámaras'}
        </button>
      </div>

      {/* Error display */}
      {error && (
        <div className="p-3 bg-red-900/50 border border-red-700 rounded-md text-red-200 text-sm" role="alert">
          {error}
        </div>
      )}

      {/* Camera list */}
      {availableCameras.length > 0 ? (
        <div className="grid gap-2" role="list" aria-label="Lista de cámaras disponibles">
          {availableCameras.map((camera) => (
            <div
              key={camera.id}
              role="listitem"
              tabIndex={0}
              className={`p-3 rounded-md border-2 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 ${selectedCamera?.id === camera.id
                ? 'border-blue-500 bg-blue-900/30'
                : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                }`}
              onClick={() => setSelectedCamera(camera)}
              onFocus={() => speak(`Cámara: ${camera.name}. ${selectedCamera?.id === camera.id ? 'Seleccionada' : 'No seleccionada'}`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedCamera(camera);
                }
              }}
              aria-selected={selectedCamera?.id === camera.id}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{camera.name}</div>
                  <div className="text-sm text-gray-400">
                    Dispositivo {camera.device_index}
                    {camera.location && ` • ${camera.location}`}
                  </div>
                </div>
                <button
                  onClick={(e) => confirmDelete(e, camera)}
                  onFocus={(e) => {
                    e.stopPropagation();
                    speak(`Eliminar cámara ${camera.name}`);
                  }}
                  className="px-2 py-1 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
                  aria-label={`Eliminar cámara ${camera.name}`}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 bg-gray-800 rounded-md text-gray-400 text-center">
          {isLoading ? 'Cargando cámaras...' : 'No hay cámaras configuradas. Descubre cámaras para agregar una.'}
        </div>
      )}

      {/* Discovery modal */}
      {showDiscovery && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[9999] overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="discovery-title"
        >
          <div
            ref={discoveryModalRef}
            className="bg-gray-800 rounded-lg p-6 max-w-md w-full space-y-4 my-8 relative focus:outline-none"
            tabIndex={-1}
          >
            <h3 id="discovery-title" className="text-lg font-semibold">Dispositivos Descubiertos</h3>

            {discoveredDevices.length > 0 ? (
              <div className="space-y-4">
                {/* Device selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium" id="device-select-label">Selecciona un dispositivo:</label>
                  <p className="text-xs text-gray-400" id="device-select-desc">
                    Usa las flechas arriba/abajo para elegir una opción.
                  </p>
                  <div
                    className="space-y-2 max-h-48 overflow-y-auto"
                    role="radiogroup"
                    aria-labelledby="device-select-label"
                    aria-describedby="device-select-desc"
                  >
                    {discoveredDevices.map((device) => (
                      <label
                        key={device.index}
                        className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${selectedDeviceIndex === device.index
                          ? 'bg-blue-900/50 border border-blue-700'
                          : 'bg-gray-700 hover:bg-gray-600'
                          }`}
                      >
                        <input
                          type="radio"
                          name="device"
                          value={device.index}
                          checked={selectedDeviceIndex === device.index}
                          onChange={(e) => {
                            setSelectedDeviceIndex(parseInt(e.target.value));
                            speak(`Seleccionado: ${device.name}`);
                          }}
                          onFocus={() => speak(`Opción: ${device.name}`)}
                          className="form-radio h-4 w-4 text-blue-500 focus:ring-blue-500"
                        />
                        <span className="text-sm">
                          {device.name} (Índice: {device.index})
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Camera name input */}
                <div className="space-y-2">
                  <label htmlFor="camera-name-input" className="text-sm font-medium">Nombre de la cámara:</label>
                  <input
                    id="camera-name-input"
                    type="text"
                    value={newCameraName}
                    onChange={(e) => setNewCameraName(e.target.value)}
                    onFocus={() => speak("Campo de texto: Nombre de la cámara")}
                    placeholder="Ej: Cámara Principal"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      setShowDiscovery(false);
                      setSelectedDeviceIndex(null);
                      setNewCameraName('');
                    }}
                    onFocus={() => speak("Botón Cancelar")}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreateCamera}
                    onFocus={() => speak("Botón Agregar Cámara")}
                    disabled={selectedDeviceIndex === null || !newCameraName.trim()}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-green-400"
                  >
                    Agregar Cámara
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-400">
                No se encontraron dispositivos de cámara
              </div>
            )}

            {discoveredDevices.length === 0 && (
              <button
                onClick={() => setShowDiscovery(false)}
                onFocus={() => speak("Botón Cerrar")}
                className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                Cerrar
              </button>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.isOpen && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[9999]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-title"
          aria-describedby="delete-desc"
        >
          <div
            ref={deleteModalRef}
            className="bg-gray-800 rounded-lg p-6 max-w-sm w-full space-y-4 border border-gray-700 shadow-xl focus:outline-none"
            tabIndex={-1}
          >
            <h3 id="delete-title" className="text-lg font-semibold text-red-400">Eliminar Cámara</h3>
            <p id="delete-desc" className="text-gray-300">
              ¿Estás seguro de que deseas eliminar la cámara <span className="font-semibold text-white">"{deleteConfirmation.cameraName}"</span>?
            </p>
            <p className="text-sm text-gray-400">
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 justify-end mt-4">
              <button
                onClick={() => setDeleteConfirmation({ isOpen: false, cameraId: null, cameraName: '' })}
                onFocus={() => speak("Botón Cancelar eliminación")}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteCamera}
                onFocus={() => speak("Botón Confirmar Eliminar")}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md text-sm font-medium transition-colors text-white focus:outline-none focus:ring-2 focus:ring-red-400"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
