import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, ArrowRight, Maximize2, Heart, MessageSquare, Trophy, Users, Flame, Shield, Sparkles, Smartphone } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useAppStore } from '../../store/useAppStore';
import { calculateLevel } from '../../utils/levelSystem';
import PrestigeModal from '../../components/common/PrestigeModal';
import PWAInstallModal from '../../components/common/PWAInstallModal';

export default function Dashboard() {
  const navigate = useNavigate();
  const currentWorkout = useAppStore((state) => state.activeWorkout);
  const userProfile = useAppStore((state) => state.userProfile);
  const lifetimeVolumeKg = useAppStore((state) => state.lifetimeVolumeKg) || 0;
  
  const friends = useAppStore((state) => state.friends) || [];
  const friendsTraining = useAppStore((state) => state.friendsTraining) || [];
  const pendingRequests = useAppStore((state) => state.pendingFollowRequests) || [];
  
  const subscribeToLiveSocialActivity = useAppStore((state) => state.subscribeToLiveSocialActivity);

  const [likes, setLikes] = useState({ 1: 12, 2: 24 });
  const [hasLiked, setHasLiked] = useState({ 1: false, 2: true });
  const [isPrestigeOpen, setIsPrestigeOpen] = useState(false);
  const [isPWAInstallOpen, setIsPWAInstallOpen] = useState(false);

  useEffect(() => {
    // Verificar si ya está en modo standalone (PWA ya instalada)
    const isStandalone = typeof window !== 'undefined' && 
      (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true);
    
    const hasSeenPrompt = localStorage.getItem('ftraining_pwa_install_prompt_seen');

    if (!isStandalone && !hasSeenPrompt) {
      const timer = setTimeout(() => {
        setIsPWAInstallOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismissPermanently = () => {
    localStorage.setItem('ftraining_pwa_install_prompt_seen', 'true');
  };

  useEffect(() => {
    const unsubscribe = subscribeToLiveSocialActivity();
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [subscribeToLiveSocialActivity]);

  const toggleLike = (postId) => {
    setHasLiked(prev => {
      const isLiked = !prev[postId];
      setLikes(l => ({
        ...l,
        [postId]: isLiked ? (l[postId] || 0) + 1 : Math.max(0, (l[postId] || 0) - 1)
      }));
      return { ...prev, [postId]: isLiked };
    });
  };

  const trainingCount = friendsTraining.length;
  const levelInfo = calculateLevel(lifetimeVolumeKg);
  const rank = levelInfo.rank;

  return (
    <div className="px-4 pt-1 pb-32 flex-1 flex flex-col w-full">
      
      {/* Header */}
      <header className="flex justify-between items-center mb-4 pt-1">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">Hola, {userProfile?.username?.split(' ')[0] || 'Atleta'}</h1>
          <p className="text-gray-400 font-medium text-sm">Listo para aplastar tus metas?</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Bell / Solicitudes pendientes */}
          <button 
            onClick={() => navigate('/community')}
            className="relative p-2.5 rounded-full bg-[#1c1c1e] text-gray-300 hover:text-white transition-colors border border-surface-2"
            title="Comunidad y Solicitudes"
          >
            <Users size={20} />
            {pendingRequests.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-surface-0 text-[10px] font-black rounded-full flex items-center justify-center animate-pulse">
                {pendingRequests.length}
              </span>
            )}
          </button>

          {/* Avatar Profile */}
          <div 
            onClick={() => navigate('/profile')}
            className="w-11 h-11 rounded-full overflow-hidden border-2 border-primary cursor-pointer hover:opacity-90 transition-transform active:scale-95 shadow-glow"
            title="Ver mi perfil"
          >
            <img src={userProfile?.avatar_url || "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=150&q=80"} alt="Profile" className="w-full h-full object-cover" />
          </div>
        </div>
      </header>

      {/* Tarjeta de Nivel y Rango de Prestigio */}
      <div 
        onClick={() => setIsPrestigeOpen(true)}
        className={`bg-surface-1 border ${rank.borderClass} rounded-2xl p-4 mb-4 cursor-pointer hover:border-primary/60 transition-all active:scale-[0.99] shadow-lg relative overflow-hidden group`}
      >
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center space-x-2.5">
            <span className="text-2xl">{rank.badge}</span>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-white font-black text-base">Nivel {levelInfo.level}</span>
                <span className={`px-2 py-0.5 rounded-full ${rank.bgClass} ${rank.textClass} border ${rank.borderClass} text-[11px] font-extrabold uppercase`}>
                  {rank.fullName}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 font-medium">
                {levelInfo.formattedKg} acumulados • Toca para ver rangos
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-black text-primary group-hover:underline flex items-center">
              {levelInfo.progressPercent}% <ArrowRight size={13} className="ml-0.5" />
            </span>
          </div>
        </div>

        {/* Barra de Progreso XP */}
        <div className="space-y-1">
          <div className="w-full h-2 bg-[#121214] rounded-full overflow-hidden p-0.5 border border-white/5">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(204,255,0,0.4)]"
              style={{ width: `${levelInfo.progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 font-medium px-0.5">
            <span>{levelInfo.kgInCurrentLevel.toLocaleString()} kg</span>
            <span>Faltan {levelInfo.remainingKg.toLocaleString()} kg para Nv. {levelInfo.level + 1}</span>
          </div>
        </div>
      </div>

      {/* Banner discreto para instalar como App si no está instalada */}
      {typeof window !== 'undefined' && 
        !(window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) && (
        <div 
          onClick={() => setIsPWAInstallOpen(true)}
          className="mb-4 p-3 rounded-2xl bg-gradient-to-r from-primary/15 via-[#1c1c1e] to-[#1c1c1e] border border-primary/30 flex items-center justify-between cursor-pointer hover:border-primary/60 transition-all active:scale-[0.99] group shadow-sm"
        >
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-primary text-black flex items-center justify-center font-bold shrink-0 shadow-[0_0_10px_rgba(204,255,0,0.3)]">
              <Smartphone size={18} strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-black text-white group-hover:text-primary transition-colors truncate flex items-center space-x-1.5">
                <span>Instalar FTraining en tu Celular</span>
                <span className="px-1.5 py-0.2 bg-primary/20 text-primary border border-primary/30 rounded text-[9px] font-bold">PWA</span>
              </h4>
              <p className="text-[10px] text-gray-400 truncate">
                Toca aquí para ver cómo agregarla a tu pantalla de inicio
              </p>
            </div>
          </div>
          <ArrowRight size={15} className="text-primary group-hover:translate-x-1 transition-transform shrink-0 ml-2" />
        </div>
      )}

      {/* Modal de Prestigio */}
      <PrestigeModal 
        isOpen={isPrestigeOpen} 
        onClose={() => setIsPrestigeOpen(false)} 
        totalVolumeKg={lifetimeVolumeKg} 
      />

      {/* Barra de Amigos Entrenando en Vivo (Aparece y desaparece en Realtime) */}
      <AnimatePresence>
        {trainingCount > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={() => navigate('/community')}
            className="bg-surface-1 border border-primary/40 rounded-2xl p-3.5 flex items-center justify-between mb-6 cursor-pointer hover:border-primary transition-all active:scale-[0.99] shadow-md group overflow-hidden"
          >
            <div className="flex items-center space-x-3">
              <div className="flex -space-x-2">
                {friendsTraining.slice(0, 3).map((f) => (
                  <img 
                    key={f.id} 
                    src={f.avatar_url || `https://ui-avatars.com/api/?name=${f.username}`} 
                    className="w-8 h-8 rounded-full border-2 border-surface-1 object-cover" 
                    alt={f.username}
                  />
                ))}
                {trainingCount > 3 && (
                  <div className="w-8 h-8 rounded-full bg-surface-2 border-2 border-surface-1 flex items-center justify-center text-xs font-bold z-10 text-primary">
                    +{trainingCount - 3}
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary animate-ping"></span>
                <span className="text-sm font-bold text-white group-hover:text-primary transition-colors">
                  {trainingCount} {trainingCount === 1 ? 'amigo entrenando' : 'amigos entrenando'}
                </span>
              </div>
            </div>

            <button className="text-primary text-xs font-bold flex items-center group-hover:translate-x-0.5 transition-transform bg-primary/10 px-3 py-1.5 rounded-full">
              Ver en vivo <ArrowRight size={14} className="ml-1" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Workout Card */}
      <div className="relative rounded-[24px] overflow-hidden mb-6 p-5 flex flex-col justify-between min-h-[300px] border border-surface-2 shadow-[0_0_20px_rgba(204,255,0,0.05)] bg-surface-1">
        {/* Background Image */}
        <img 
          src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000&auto=format&fit=crop" 
          className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay"
        />
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-90"></div>

        <div className="relative z-10 flex justify-between items-start mb-12">
          <div className="bg-surface-1/90 backdrop-blur-md rounded-full px-3 py-1.5 flex items-center border border-surface-2">
            <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
            <span className="text-xs font-bold text-white">Rutina de hoy</span>
          </div>
          <div className="bg-surface-1/90 backdrop-blur-md rounded-full px-3 py-1.5 border border-surface-2">
            <span className="text-lg font-black text-primary">45:00</span>
          </div>
        </div>

        <div className="relative z-10">
          <h2 className="text-3xl font-extrabold mb-3 text-white shadow-sm">Pecho y Tríceps</h2>
          <div className="flex flex-wrap gap-2 mb-6">
            {['FUERZA', 'HIPERTROFIA', 'AVANZADO'].map(tag => (
              <span key={tag} className="bg-surface-2/90 backdrop-blur-sm text-xs font-bold px-3 py-1.5 rounded-full border border-surface-2 text-gray-200">
                {tag}
              </span>
            ))}
          </div>
          <Button className="w-full text-lg shadow-none font-bold" onClick={() => navigate('/workouts')}>
            Ir a Entrenamientos
          </Button>
        </div>
      </div>

      {/* Alert Notification Card */}
      <div className="bg-surface-1 border border-[#3c4d00]/40 rounded-xl p-4 flex items-center mb-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5"></div>
        <div className="w-12 h-12 bg-surface-2 rounded-full flex items-center justify-center mr-4 relative z-10 flex-shrink-0">
          <span className="text-2xl">🔥</span>
        </div>
        <div className="relative z-10 flex-1">
          <p className="text-sm text-gray-200 leading-snug mb-1">
            Mira los nuevos récords de <span className="font-bold text-white">Fuerza</span> en tu gimnasio hoy.
          </p>
          <button className="text-primary text-sm font-bold flex items-center hover:text-primary-dim transition-colors" onClick={() => navigate('/rankings')}>
            ¡Mirá el ranking! <ArrowRight size={14} className="ml-1" />
          </button>
        </div>
      </div>

      {/* Social Feed Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">Actividad de la Comunidad</h3>
        <button onClick={() => navigate('/rankings')} className="text-xs text-primary font-bold hover:underline">
          Ver Ranking
        </button>
      </div>

      {/* Social Feed List */}
      <div className="space-y-4">
        
        {/* Feed Item 1 */}
        <Card className="p-4" padding="">
          <div className="flex items-center mb-3">
            <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&q=80" className="w-10 h-10 rounded-full object-cover mr-3 border border-surface-2" />
            <div>
              <p className="text-sm"><span className="font-bold text-white">Carlos</span> completó una rutina</p>
              <p className="text-xs text-gray-400">Hace 2 horas</p>
            </div>
          </div>
          
          <div className="bg-surface-2 rounded-lg p-3 flex justify-between items-center mb-4">
            <div className="flex items-center text-sm font-medium">
              <Maximize2 size={16} className="text-primary mr-2" />
              Espalda y Bíceps
            </div>
            <span className="text-sm text-gray-400">60 min</span>
          </div>

          <div className="flex space-x-6 text-gray-400">
            <button 
              onClick={() => toggleLike(1)}
              className={`flex items-center text-sm transition-colors ${hasLiked[1] ? 'text-red-400 font-bold' : 'hover:text-white'}`}
            >
              <Heart size={18} className="mr-2" fill={hasLiked[1] ? 'currentColor' : 'none'} /> {likes[1]}
            </button>
            <button className="flex items-center text-sm hover:text-white">
              <MessageSquare size={18} className="mr-2" /> 3
            </button>
          </div>
        </Card>

        {/* Feed Item 2 */}
        <Card className="p-4" padding="">
          <div className="flex items-center mb-3">
            <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&q=80" className="w-10 h-10 rounded-full object-cover mr-3 border border-surface-2" />
            <div>
              <p className="text-sm"><span className="font-bold text-white">Sofia</span> batió su récord personal</p>
              <p className="text-xs text-gray-400">Hace 4 horas</p>
            </div>
          </div>
          
          <div className="bg-[#1e3a2b]/30 border border-primary/20 rounded-lg p-4 mb-4 flex items-center">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mr-4 flex-shrink-0">
              <Trophy size={20} className="text-surface-0" />
            </div>
            <div>
              <p className="text-sm font-bold text-white mb-1">Peso Muerto</p>
              <div className="flex items-end">
                <span className="text-2xl font-black text-primary leading-none mr-2">100 kg</span>
                <span className="text-xs text-gray-500 line-through pb-0.5">95 kg</span>
              </div>
            </div>
          </div>

          <div className="flex space-x-6 text-gray-400">
            <button 
              onClick={() => toggleLike(2)}
              className={`flex items-center text-sm transition-colors ${hasLiked[2] ? 'text-red-400 font-bold' : 'hover:text-white'}`}
            >
              <Heart size={18} className="mr-2" fill={hasLiked[2] ? 'currentColor' : 'none'} /> {likes[2]}
            </button>
            <button className="flex items-center text-sm hover:text-white">
              <MessageSquare size={18} className="mr-2" /> 5
            </button>
          </div>
        </Card>
      </div>

      {/* Modal de Instrucciones de Instalación PWA */}
      <PWAInstallModal 
        isOpen={isPWAInstallOpen} 
        onClose={() => setIsPWAInstallOpen(false)} 
        onDismissPermanently={handleDismissPermanently} 
      />
    </div>
  );
}
