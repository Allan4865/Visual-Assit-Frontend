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

  // Estado para modal RTSP
  const [showRtspModal, setShowRtspModal] = useState(false);
  const [rtspName, setRtspName] = useState('');
  const [rtspUrl, setRtspUrl] = useState('');
  const [rtspRequiresAuth, setRtspRequiresAuth] = useState(false);
  const [rtspUsername, setRtspUsername] = useState('');
  const [rtspPassword, setRtspPassword] = useState('');
  const [rtspLocation, setRtspLocation] = useState('');
  const [isTestingRtsp, setIsTestingRtsp] = useState(false);
  const [rtspTestResult, setRtspTestResult] = useState<{
    success: boolean;
    message: string;
    resolution: [number, number] | null;
  } | null>(null);
  const [isCreatingRtsp, setIsCreatingRtsp] = useState(false);

  // Estado para edición de cámaras
  const [editingCamera, setEditingCamera] = useState<Camera | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editLocation, setEditLocation] = useState('');

  // Estado para navegación con flechas en la lista de cámaras
  const [focusedCameraIndex, setFocusedCameraIndex] = useState<number>(0);

  // Refs for focus management
  const discoveryModalRef = useRef<HTMLDivElement>(null);
  const deleteModalRef = useRef<HTMLDivElement>(null);
  const rtspModalRef = useRef<HTMLDivElement>(null);
  const editModalRef = useRef<HTMLDivElement>(null);
  const cameraListRef = useRef<HTMLDivElement>(null);
  const cameraItemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const discoverLocalBtnRef = useRef<HTMLButtonElement>(null);

  // Apply focus traps
  useFocusTrap(showDiscovery, discoveryModalRef);
  useFocusTrap(deleteConfirmation.isOpen, deleteModalRef);
  useFocusTrap(showRtspModal, rtspModalRef);
  useFocusTrap(showEditModal, editModalRef);

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

  /**
   * Open edit modal for a camera
   */
  const openEditModal = (e: React.MouseEvent, camera: Camera) => {
    e.stopPropagation();
    setEditingCamera(camera);
    setEditName(camera.name);
    setEditLocation(camera.location || '');

    // For RTSP cameras, use the RTSP modal in edit mode
    if (camera.camera_type === 'rtsp') {
      setRtspName(camera.name);
      setRtspUrl(camera.rtsp_url || '');
      setRtspLocation(camera.location || '');
      setRtspRequiresAuth(camera.has_credentials || false);
      setRtspUsername(''); // Don't populate password for security
      setRtspPassword('');
      setShowRtspModal(true);
    } else {
      // For local cameras, use simple edit modal
      setShowEditModal(true);
    }
  };

  /**
   * Update camera
   */
  const handleUpdateCamera = async () => {
    if (!editingCamera) return;

    if (!editName.trim()) {
      alert('Por favor proporciona un nombre para la cámara');
      return;
    }

    try {
      const updatedCamera = await apiClient.updateCamera(editingCamera.id, {
        name: editName.trim(),
        location: editLocation.trim() || undefined,
      });

      // If updated camera was selected, update selection
      if (selectedCamera?.id === editingCamera.id) {
        setSelectedCamera(updatedCamera);
      }

      // Reload cameras
      await loadCameras();

      // Close modal
      setShowEditModal(false);
      setEditingCamera(null);
      alert('Cámara actualizada exitosamente!');
    } catch (err: any) {
      console.error('Error updating camera:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Error al actualizar la cámara';
      alert('Error al actualizar la cámara: ' + errorMsg);
    }
  };

  // Handle Escape key to close modals
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showDiscovery) setShowDiscovery(false);
        if (deleteConfirmation.isOpen) setDeleteConfirmation({ isOpen: false, cameraId: null, cameraName: '' });
        if (showRtspModal) {
          closeRtspModal();
          setEditingCamera(null); // Clear editing state when closing RTSP modal
        }
        if (showEditModal) {
          setShowEditModal(false);
          setEditingCamera(null);
        }
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showDiscovery, deleteConfirmation.isOpen, showRtspModal, showEditModal]);

  // Keyboard shortcuts for camera navigation: C for camera list, D for discover buttons
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input or if any modal is open
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        showDiscovery ||
        deleteConfirmation.isOpen ||
        showRtspModal ||
        showEditModal
      ) return;

      if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        // Focus the camera list
        if (cameraListRef.current) {
          cameraListRef.current.focus();
          speak('Lista de cámaras');
        }
      } else if (e.key.toLowerCase() === 'd') {
        e.preventDefault();
        // Focus the discover camera button
        if (discoverLocalBtnRef.current) {
          discoverLocalBtnRef.current.focus();
          speak('Botones para agregar cámara');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDiscovery, deleteConfirmation.isOpen, showRtspModal, showEditModal, speak]);

  /**
   * Reset RTSP modal state
   */
  const closeRtspModal = () => {
    setShowRtspModal(false);
    setRtspName('');
    setRtspUrl('');
    setRtspRequiresAuth(false);
    setRtspUsername('');
    setRtspPassword('');
    setRtspLocation('');
    setRtspTestResult(null);
  };

  /**
   * Test RTSP connection
   */
  const handleTestRtsp = async () => {
    if (!rtspUrl.trim()) {
      alert('Por favor ingresa una URL RTSP');
      return;
    }

    setIsTestingRtsp(true);
    setRtspTestResult(null);

    try {
      const result = await apiClient.testRtspConnection(
        rtspUrl.trim(),
        rtspRequiresAuth ? rtspUsername : undefined,
        rtspRequiresAuth ? rtspPassword : undefined
      );
      setRtspTestResult(result);
      if (result.success) {
        speak('Conexion exitosa');
      } else {
        speak('Error de conexion: ' + result.message);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Error al probar conexion';
      setRtspTestResult({
        success: false,
        message: errorMsg,
        resolution: null,
      });
      speak('Error: ' + errorMsg);
    } finally {
      setIsTestingRtsp(false);
    }
  };

  /**
   * Create or Update RTSP camera
   */
  const handleCreateRtspCamera = async () => {
    if (!rtspName.trim()) {
      alert('Por favor ingresa un nombre para la camara');
      return;
    }
    if (!rtspUrl.trim()) {
      alert('Por favor ingresa una URL RTSP');
      return;
    }

    setIsCreatingRtsp(true);

    try {
      let camera;

      if (editingCamera && editingCamera.camera_type === 'rtsp') {
        // Update existing RTSP camera
        const updateData: any = {
          name: rtspName.trim(),
          rtsp_url: rtspUrl.trim(),
          location: rtspLocation.trim() || undefined,
        };

        // Only include credentials if they were provided
        if (rtspRequiresAuth && rtspUsername) {
          updateData.rtsp_username = rtspUsername;
        }
        if (rtspRequiresAuth && rtspPassword) {
          updateData.rtsp_password = rtspPassword;
        }

        camera = await apiClient.updateCamera(editingCamera.id, updateData);

        // If updated camera was selected, update selection
        if (selectedCamera?.id === editingCamera.id) {
          setSelectedCamera(camera);
        }

        speak('Cámara RTSP actualizada exitosamente');
        alert('Cámara RTSP actualizada exitosamente!');
      } else {
        // Create new RTSP camera
        camera = await apiClient.createRtspCamera({
          user_id: 1, // TODO: Replace with actual user ID when auth is implemented
          name: rtspName.trim(),
          rtsp_url: rtspUrl.trim(),
          rtsp_username: rtspRequiresAuth ? rtspUsername : undefined,
          rtsp_password: rtspRequiresAuth ? rtspPassword : undefined,
          location: rtspLocation.trim() || undefined,
        });

        setSelectedCamera(camera);
        speak('Cámara RTSP creada exitosamente');
        alert('Cámara RTSP creada exitosamente!');
      }

      await loadCameras();
      closeRtspModal();
      setEditingCamera(null);
    } catch (err: any) {
      console.error('Error with RTSP camera:', err);
      const action = editingCamera ? 'actualizar' : 'crear';
      const errorMsg = err.response?.data?.error || err.message || `Error al ${action} la camara`;
      alert(`Error al ${action} la camara RTSP: ${errorMsg}`);
    } finally {
      setIsCreatingRtsp(false);
    }
  };

  // Announce instructions when discovery modal opens
  useEffect(() => {
    if (showDiscovery) {
      // Small delay to ensure modal is rendered and previous announcements are finished
      setTimeout(() => {
        speak("Dispositivos descubiertos. Usa las flechas arriba y abajo para elegir una opción.");
      }, 500);
    }
  }, [showDiscovery, speak]);

  /**
   * Handle keyboard navigation in camera list (for assisted navigation)
   */
  const handleCameraListKeyDown = (e: React.KeyboardEvent) => {
    if (availableCameras.length === 0) return;

    let newIndex = focusedCameraIndex;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        newIndex = Math.min(focusedCameraIndex + 1, availableCameras.length - 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        newIndex = Math.max(focusedCameraIndex - 1, 0);
        break;
      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        newIndex = availableCameras.length - 1;
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        const focusedCamera = availableCameras[focusedCameraIndex];
        if (focusedCamera) {
          setSelectedCamera(focusedCamera);
          speak(`Cámara ${focusedCamera.name} seleccionada`);
        }
        return;
      default:
        return;
    }

    if (newIndex !== focusedCameraIndex) {
      setFocusedCameraIndex(newIndex);
      const camera = availableCameras[newIndex];
      if (camera) {
        speak(`${camera.name}. ${selectedCamera?.id === camera.id ? 'Seleccionada' : 'No seleccionada'}. ${newIndex + 1} de ${availableCameras.length}`);
      }
      // Scroll into view if needed
      cameraItemRefs.current[newIndex]?.scrollIntoView({ block: 'nearest' });
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Seleccionar Cámara</h2>

      {/* Error display */}
      {error && (
        <div className="p-3 bg-red-900/50 border border-red-700 rounded-md text-red-200 text-sm" role="alert">
          {error}
        </div>
      )}

      {/* Camera list */}
      {availableCameras.length > 0 ? (
        <>
          {/* Instrucciones para navegación asistida */}
          <p className="text-xs text-gray-400 mb-2" id="camera-list-instructions">
            Usa las flechas arriba y abajo para navegar. Enter o Espacio para seleccionar. Tab para ir a las acciones.
          </p>

          {/* Lista de cámaras con navegación por flechas */}
          <div
            ref={cameraListRef}
            className="grid gap-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-md"
            role="listbox"
            aria-label="Lista de cámaras disponibles"
            aria-describedby="camera-list-instructions"
            aria-activedescendant={availableCameras[focusedCameraIndex] ? `camera-option-${availableCameras[focusedCameraIndex].id}` : undefined}
            tabIndex={0}
            onKeyDown={handleCameraListKeyDown}
            onFocus={() => {
              const camera = availableCameras[focusedCameraIndex];
              if (camera) {
                speak(`Lista de cámaras. ${camera.name}. ${selectedCamera?.id === camera.id ? 'Seleccionada' : 'No seleccionada'}. ${focusedCameraIndex + 1} de ${availableCameras.length}. Usa flechas arriba y abajo para navegar y Enter para seleccionar.`);
              }
            }}
          >
            {availableCameras.map((camera, index) => (
              <div
                key={camera.id}
                id={`camera-option-${camera.id}`}
                ref={(el) => { cameraItemRefs.current[index] = el; }}
                role="option"
                aria-selected={selectedCamera?.id === camera.id}
                className={`p-3 rounded-md border-2 cursor-pointer transition-colors ${focusedCameraIndex === index
                  ? 'ring-2 ring-blue-400'
                  : ''
                  } ${selectedCamera?.id === camera.id
                    ? 'border-blue-500 bg-blue-900/30'
                    : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                  }`}
                onClick={() => {
                  setFocusedCameraIndex(index);
                  setSelectedCamera(camera);
                  speak(`Cámara ${camera.name} seleccionada`);
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {camera.camera_type === 'rtsp' ? (
                        <span className="text-purple-400" title="Cámara RTSP">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clipRule="evenodd" />
                          </svg>
                        </span>
                      ) : (
                        <span className="text-blue-400" title="Cámara Local">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                      {camera.name}
                      {selectedCamera?.id === camera.id && (
                        <span className="text-xs bg-blue-600 px-2 py-0.5 rounded-full">Activa</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-400">
                      {camera.camera_type === 'rtsp' ? (
                        <>
                          RTSP {camera.has_credentials && '(con credenciales)'}
                          {camera.location && ` • ${camera.location}`}
                        </>
                      ) : (
                        <>
                          Dispositivo {camera.device_index}
                          {camera.location && ` • ${camera.location}`}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Acciones para la cámara seleccionada (separadas de la lista para navegación asistida) */}
          {selectedCamera && (
            <div className="flex gap-2 p-2 bg-gray-800 rounded-md border border-gray-700">
              <span className="text-sm text-gray-400 flex-1">
                Acciones para: <strong className="text-white">{selectedCamera.name}</strong>
              </span>
              <button
                onClick={(e) => openEditModal(e, selectedCamera)}
                onFocus={() => speak(`Editar cámara ${selectedCamera.name}`)}
                className="px-3 py-1 text-sm text-blue-400 hover:text-blue-300 hover:bg-blue-900/30 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                aria-label={`Editar cámara ${selectedCamera.name}`}
              >
                Editar
              </button>
              <button
                onClick={(e) => confirmDelete(e, selectedCamera)}
                onFocus={() => speak(`Eliminar cámara ${selectedCamera.name}`)}
                className="px-3 py-1 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
                aria-label={`Eliminar cámara ${selectedCamera.name}`}
              >
                Eliminar
              </button>
            </div>
          )}

          {/* Buttons to add cameras */}
          <div className="flex gap-2">
            <button
              ref={discoverLocalBtnRef}
              onClick={handleDiscover}
              onFocus={() => speak("Botón Agregar Cámara Local")}
              disabled={isDiscovering}
              className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-gray-900"
              aria-busy={isDiscovering}
            >
              {isDiscovering ? 'Descubriendo...' : '+ Cámara Local'}
            </button>
            <button
              onClick={() => setShowRtspModal(true)}
              onFocus={() => speak("Botón Agregar Cámara RTSP")}
              className="flex-1 px-3 py-2 bg-purple-700 hover:bg-purple-600 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-gray-900"
            >
              + Cámara RTSP
            </button>
          </div>
        </>
      ) : (
        <div className="p-4 bg-gray-800 rounded-md text-center space-y-3">
          <p className="text-gray-400">
            {isLoading ? 'Cargando camaras...' : 'No hay camaras configuradas.'}
          </p>
          {!isLoading && (
            <div className="flex gap-2 justify-center">
              <button
                ref={discoverLocalBtnRef}
                onClick={handleDiscover}
                onFocus={() => speak("Botón Descubrir Cámaras Locales")}
                disabled={isDiscovering}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-900"
                aria-busy={isDiscovering}
              >
                {isDiscovering ? 'Descubriendo...' : 'Cámara Local'}
              </button>
              <button
                onClick={() => setShowRtspModal(true)}
                onFocus={() => speak("Botón Agregar Cámara RTSP")}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-gray-900"
              >
                Cámara RTSP
              </button>
            </div>
          )}
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
              Estas seguro de que deseas eliminar la camara <span className="font-semibold text-white">"{deleteConfirmation.cameraName}"</span>?
            </p>
            <p className="text-sm text-gray-400">
              Esta accion no se puede deshacer.
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
                onFocus={() => speak("Botón Confirmar eliminación")}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md text-sm font-medium transition-colors text-white focus:outline-none focus:ring-2 focus:ring-red-400"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RTSP Camera Modal */}
      {showRtspModal && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[9999] overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="rtsp-title"
        >
          <div
            ref={rtspModalRef}
            className="bg-gray-800 rounded-lg p-6 max-w-md w-full space-y-4 my-8 relative focus:outline-none border border-purple-700"
            tabIndex={-1}
          >
            <h3 id="rtsp-title" className="text-lg font-semibold flex items-center gap-2">
              <span className="text-purple-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clipRule="evenodd" />
                </svg>
              </span>
              {editingCamera && editingCamera.camera_type === 'rtsp' ? 'Editar' : 'Agregar'} Cámara RTSP
            </h3>

            <div className="space-y-4">
              {/* Camera name */}
              <div className="space-y-2">
                <label htmlFor="rtsp-name" className="text-sm font-medium">
                  Nombre de la camara *
                </label>
                <input
                  id="rtsp-name"
                  type="text"
                  value={rtspName}
                  onChange={(e) => setRtspName(e.target.value)}
                  onFocus={() => speak("Campo de texto: Nombre de la camara")}
                  placeholder="Ej: Cámara Entrada Principal"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
              </div>

              {/* RTSP URL */}
              <div className="space-y-2">
                <label htmlFor="rtsp-url" className="text-sm font-medium">
                  URL RTSP *
                </label>
                <input
                  id="rtsp-url"
                  type="text"
                  value={rtspUrl}
                  onChange={(e) => setRtspUrl(e.target.value)}
                  onFocus={() => speak("Campo de texto: URL RTSP")}
                  placeholder="rtsp://192.168.1.100:554/stream1"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 font-mono text-sm"
                />
                <p className="text-xs text-gray-400">
                  Formato: rtsp://host:puerto/ruta
                </p>
              </div>

              {/* Authentication checkbox */}
              <div className="flex items-center gap-2">
                <input
                  id="rtsp-auth"
                  type="checkbox"
                  checked={rtspRequiresAuth}
                  onChange={(e) => setRtspRequiresAuth(e.target.checked)}
                  onFocus={() => speak("Casilla: Requiere autenticacion")}
                  className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-purple-500"
                />
                <label htmlFor="rtsp-auth" className="text-sm">
                  Requiere autenticacion
                </label>
              </div>

              {/* Credentials (conditional) */}
              {rtspRequiresAuth && (
                <div className="space-y-3 pl-6 border-l-2 border-purple-700">
                  <div className="space-y-2">
                    <label htmlFor="rtsp-username" className="text-sm font-medium">
                      Usuario
                    </label>
                    <input
                      id="rtsp-username"
                      type="text"
                      value={rtspUsername}
                      onChange={(e) => setRtspUsername(e.target.value)}
                      onFocus={() => speak("Campo de texto: Usuario")}
                      placeholder="admin"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="rtsp-password" className="text-sm font-medium">
                      Contrasena
                    </label>
                    <input
                      id="rtsp-password"
                      type="password"
                      value={rtspPassword}
                      onChange={(e) => setRtspPassword(e.target.value)}
                      onFocus={() => speak("Campo de texto: Contrasena")}
                      placeholder="********"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                </div>
              )}

              {/* Location (optional) */}
              <div className="space-y-2">
                <label htmlFor="rtsp-location" className="text-sm font-medium">
                  Ubicacion <span className="text-gray-400">(opcional)</span>
                </label>
                <input
                  id="rtsp-location"
                  type="text"
                  value={rtspLocation}
                  onChange={(e) => setRtspLocation(e.target.value)}
                  onFocus={() => speak("Campo de texto: Ubicacion")}
                  placeholder="Ej: Puerta principal"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
              </div>

              {/* Test result */}
              {rtspTestResult && (
                <div
                  className={`p-3 rounded-md ${rtspTestResult.success
                    ? 'bg-green-900/50 border border-green-700 text-green-200'
                    : 'bg-red-900/50 border border-red-700 text-red-200'
                    }`}
                  role="alert"
                >
                  <p className="text-sm font-medium">
                    {rtspTestResult.success ? 'Conexion exitosa' : 'Error de conexion'}
                  </p>
                  <p className="text-xs mt-1">{rtspTestResult.message}</p>
                  {rtspTestResult.resolution && (
                    <p className="text-xs mt-1">
                      Resolucion: {rtspTestResult.resolution[0]}x{rtspTestResult.resolution[1]}
                    </p>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2 justify-end pt-2">
                <button
                  onClick={closeRtspModal}
                  onFocus={() => speak("Botón Cancelar")}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleTestRtsp}
                  onFocus={() => speak("Botón Probar Conexión")}
                  disabled={isTestingRtsp || !rtspUrl.trim()}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  {isTestingRtsp ? 'Probando...' : 'Probar'}
                </button>
                <button
                  onClick={handleCreateRtspCamera}
                  onFocus={() => speak(editingCamera && editingCamera.camera_type === 'rtsp' ? "Botón Actualizar Cámara" : "Botón Guardar Cámara")}
                  disabled={isCreatingRtsp || !rtspName.trim() || !rtspUrl.trim()}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  {isCreatingRtsp
                    ? (editingCamera && editingCamera.camera_type === 'rtsp' ? 'Actualizando...' : 'Guardando...')
                    : (editingCamera && editingCamera.camera_type === 'rtsp' ? 'Actualizar' : 'Guardar')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Local Camera Modal */}
      {showEditModal && editingCamera && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[9999]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-title"
        >
          <div
            ref={editModalRef}
            className="bg-gray-800 rounded-lg p-6 max-w-md w-full space-y-4 border border-blue-700 shadow-xl focus:outline-none"
            tabIndex={-1}
          >
            <h3 id="edit-title" className="text-lg font-semibold flex items-center gap-2">
              <span className="text-blue-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </span>
              Editar Cámara
            </h3>

            <div className="space-y-4">
              {/* Camera name */}
              <div className="space-y-2">
                <label htmlFor="edit-name" className="text-sm font-medium">
                  Nombre de la cámara *
                </label>
                <input
                  id="edit-name"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onFocus={() => speak("Campo de texto: Nombre de la cámara")}
                  placeholder="Ej: Cámara Principal"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Location */}
              <div className="space-y-2">
                <label htmlFor="edit-location" className="text-sm font-medium">
                  Ubicación <span className="text-gray-400">(opcional)</span>
                </label>
                <input
                  id="edit-location"
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  onFocus={() => speak("Campo de texto: Ubicación")}
                  placeholder="Ej: Escritorio"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Device info (read-only) */}
              <div className="p-3 bg-gray-700/50 border border-gray-600 rounded-md">
                <p className="text-sm text-gray-400">
                  Dispositivo: <span className="text-white font-medium">{editingCamera.device_index}</span>
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 justify-end pt-2">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingCamera(null);
                  }}
                  onFocus={() => speak("Botón Cancelar")}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpdateCamera}
                  onFocus={() => speak("Botón Actualizar Cámara")}
                  disabled={!editName.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  Actualizar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
