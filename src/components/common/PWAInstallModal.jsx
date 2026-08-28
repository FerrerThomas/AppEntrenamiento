import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Smartphone,
  Share,
  PlusSquare,
  MoreVertical,
  Download,
  Check,
  X,
  Sparkles,
  Zap,
  ChevronRight,
  HelpCircle
} from 'lucide-react';

export default function PWAInstallModal({ isOpen, onClose, onDismissPermanently }) {
  const [platform, setPlatform] = useState('ios');
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Detectar plataforma del dispositivo
    const userAgent = window.navigator.userAgent || '';
    const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
    const isAndroidDevice = /Android/.test(userAgent);

    if (isIOSDevice) {
      setPlatform('ios');
    } else if (isAndroidDevice) {
      setPlatform('android');
    } else {
      setPlatform('ios'); // default
    }

    // Capturar evento de instalación de Android/Chrome
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleNativeInstall = async () => {
    if (!deferredPrompt) return;
    setIsInstalling(true);
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        if (onDismissPermanently) onDismissPermanently();
        onClose();
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.error('Error al solicitar instalación nativa:', err);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleUnderstood = () => {
    if (onDismissPermanently) onDismissPermanently();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 animate-in fade-in duration-200">

        {/* Contenedor Modal */}
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-[#141416] border border-surface-2 w-full max-w-md max-h-[90vh] rounded-t-[32px] sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl relative"
        >

          {/* Barra decorativa superior */}
          <div className="w-12 h-1.5 bg-gray-700 rounded-full mx-auto mt-3 sm:hidden" />

          {/* Header */}
          <div className="p-5 pb-3 flex items-start justify-between">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/40 flex items-center justify-center text-primary shadow-[0_0_15px_rgba(204,255,0,0.2)] shrink-0">
                <Smartphone size={26} />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-black text-white text-lg tracking-tight">Instalar en tu Celular</h3>
                  <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 text-[10px] font-black uppercase">
                    PWA App
                  </span>
                </div>
                <p className="text-xs text-gray-400 font-medium">
                  Úsala a pantalla completa como una app real
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Segmented Selector de Plataforma */}
          <div className="px-5 pt-2 pb-3">
            <div className="bg-[#202024] border border-surface-2 rounded-2xl p-1 flex">
              <button
                type="button"
                onClick={() => setPlatform('ios')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${platform === 'ios'
                    ? 'bg-primary text-black font-extrabold shadow-md'
                    : 'text-gray-400 hover:text-white'
                  }`}
              >
                <span>🍏</span>
                <span>iPhone (iOS)</span>
              </button>

              <button
                type="button"
                onClick={() => setPlatform('android')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${platform === 'android'
                    ? 'bg-primary text-black font-extrabold shadow-md'
                    : 'text-gray-400 hover:text-white'
                  }`}
              >
                <span>🤖</span>
                <span>Android</span>
              </button>
            </div>
          </div>

          {/* Contenido / Pasos según plataforma */}
          <div className="flex-1 overflow-y-auto px-5 py-2 space-y-3.5">

            {platform === 'ios' ? (
              // Pasos para iPhone / iPad
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-[#1c1c1e] border border-[#2a2a2e] flex items-start space-x-3.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center font-black text-sm shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-white mb-0.5 flex items-center space-x-1.5">
                      <span>Toca en Compartir</span>
                      <Share size={15} className="text-blue-400 inline" />
                    </h4>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      En la barra inferior de <strong>Safari</strong>, presiona el ícono del cuadrado con la flecha hacia arriba.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#1c1c1e] border border-[#2a2a2e] flex items-start space-x-3.5">
                  <div className="w-8 h-8 rounded-xl bg-primary/15 border border-primary/30 text-primary flex items-center justify-center font-black text-sm shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-white mb-0.5 flex items-center space-x-1.5">
                      <span>Agregar a Inicio</span>
                      <PlusSquare size={15} className="text-primary inline" />
                    </h4>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Desliza hacia abajo en las opciones y selecciona <strong>"Agregar a pantalla de inicio"</strong>.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#1c1c1e] border border-[#2a2a2e] flex items-start space-x-3.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-black text-sm shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-white mb-0.5">
                      Toca "Agregar"
                    </h4>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Presiona el botón <strong>"Agregar"</strong> arriba a la derecha. ¡Aparecerá el ícono en tu pantalla principal!
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              // Pasos para Android
              <div className="space-y-3">
                {deferredPrompt ? (
                  <div className="p-4 rounded-2xl bg-primary/10 border border-primary/40 text-center space-y-3">
                    <p className="text-xs text-gray-200 font-medium leading-relaxed">
                      ¡Tu navegador permite la instalación automática con 1 solo toque!
                    </p>
                    <button
                      onClick={handleNativeInstall}
                      disabled={isInstalling}
                      className="w-full py-3 rounded-xl bg-primary text-black font-extrabold text-sm shadow-[0_0_15px_rgba(204,255,0,0.35)] flex items-center justify-center space-x-2 active:scale-98 transition-transform"
                    >
                      <Download size={18} />
                      <span>{isInstalling ? 'Instalando...' : 'Instalar App Ahora'}</span>
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="p-3.5 rounded-2xl bg-[#1c1c1e] border border-[#2a2a2e] flex items-start space-x-3.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center font-black text-sm shrink-0 mt-0.5">
                        1
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-white mb-0.5 flex items-center space-x-1.5">
                          <span>Menú del Navegador</span>
                          <MoreVertical size={15} className="text-gray-300 inline" />
                        </h4>
                        <p className="text-xs text-gray-400 leading-relaxed">
                          En <strong>Chrome</strong> u otro navegador, toca los 3 puntos en la esquina superior derecha.
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[#1c1c1e] border border-[#2a2a2e] flex items-start space-x-3.5">
                      <div className="w-8 h-8 rounded-xl bg-primary/15 border border-primary/30 text-primary flex items-center justify-center font-black text-sm shrink-0 mt-0.5">
                        2
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-white mb-0.5 flex items-center space-x-1.5">
                          <span>Instalar aplicación</span>
                          <Download size={15} className="text-primary inline" />
                        </h4>
                        <p className="text-xs text-gray-400 leading-relaxed">
                          Busca y selecciona <strong>"Agregar a la pantalla principal"</strong> o <strong>"Instalar aplicación"</strong>.
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[#1c1c1e] border border-[#2a2a2e] flex items-start space-x-3.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-black text-sm shrink-0 mt-0.5">
                        3
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-white mb-0.5">
                          Confirmar Instalación
                        </h4>
                        <p className="text-xs text-gray-400 leading-relaxed">
                          Presiona <strong>"Instalar"</strong> y listo, tendrás la app con su ícono en tu escritorio.
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Ventajas PWA */}
            <div className="p-3 rounded-2xl bg-[#18181a] border border-surface-2 flex items-center space-x-3">
              <Sparkles size={18} className="text-primary shrink-0" />
              <p className="text-[11px] text-gray-300 font-medium">
                Sin descargas pesadas desde la tienda. Funciona rápido, sin ocupar espacio y sin barras del navegador.
              </p>
            </div>

          </div>

          {/* Footer Actions */}
          <div className="p-5 pt-3 border-t border-surface-2 bg-[#141416] flex flex-col space-y-2">
            <button
              onClick={handleUnderstood}
              className="w-full py-3.5 rounded-2xl bg-primary text-black font-extrabold text-sm shadow-[0_0_15px_rgba(204,255,0,0.3)] hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
            >
              <Check size={18} strokeWidth={3} />
              <span>¡Entendido, ya la agregué!</span>
            </button>

            <button
              onClick={onClose}
              className="w-full py-2.5 text-xs text-gray-400 hover:text-white font-semibold transition-colors"
            >
              Recordar más tarde
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
