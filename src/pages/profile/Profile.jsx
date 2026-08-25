import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import Button from '../../components/ui/Button';
import { 
  LogOut, 
  Edit3, 
  Globe, 
  Dumbbell, 
  Flame, 
  Trophy, 
  MapPin, 
  Camera, 
  X, 
  Check, 
  ChevronRight,
  User,
  Scale,
  Ruler,
  Calendar,
  Clock,
  Trash2,
  Activity,
  Layers,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { calculateLevel } from '../../utils/levelSystem';
import PrestigeModal from '../../components/common/PrestigeModal';
import WorkoutDetailModal from '../../components/workouts/WorkoutDetailModal';

function InstagramIcon({ size = 16, className = "" }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export default function Profile() {
  const user = useAppStore((state) => state.user);
  const userProfile = useAppStore((state) => state.userProfile);
  const updateUserProfile = useAppStore((state) => state.updateUserProfile);
  const logout = useAppStore((state) => state.logout);
  const navigate = useNavigate();

  // Historial y PRs del Store
  const workoutHistory = useAppStore((state) => state.workoutHistory);
  const isLoadingHistory = useAppStore((state) => state.isLoadingHistory);
  const fetchWorkoutHistory = useAppStore((state) => state.fetchWorkoutHistory);
  const deleteWorkoutSession = useAppStore((state) => state.deleteWorkoutSession);
  const currentPRs = useAppStore((state) => state.currentPRs);
  const getCurrentPRs = useAppStore((state) => state.getCurrentPRs);

  const [activeTab, setActiveTab] = useState('stats'); // 'stats' | 'history' | 'prs'
  const [selectedWorkoutModal, setSelectedWorkoutModal] = useState(null);
  const [isDeletingSession, setIsDeletingSession] = useState(false);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPrestigeOpen, setIsPrestigeOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    username: '',
    bio: '',
    instagram: '',
    social_link: '',
    weight_kg: '',
    height_cm: '',
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);

  // Stats state
  const [stats, setStats] = useState({
    workoutsCount: 0,
    totalVolume: 0,
  });

  useEffect(() => {
    if (userProfile) {
      setFormData({
        username: userProfile.username || '',
        bio: userProfile.bio || '',
        instagram: (userProfile.instagram || '').replace(/^@/, ''),
        social_link: userProfile.social_link || '',
        weight_kg: userProfile.weight_kg || '',
        height_cm: userProfile.height_cm || '',
      });
      setAvatarPreview(userProfile.avatar_url || null);
    }
  }, [userProfile]);

  const loadStats = async () => {
    if (!user?.id) return;
    try {
      const { data: sessions } = await supabase
        .from('workout_sessions')
        .select('id, total_volume_kg')
        .eq('user_id', user.id);

      if (sessions) {
        const totalVol = sessions.reduce((acc, s) => acc + (parseFloat(s.total_volume_kg) || 0), 0);
        setStats({
          workoutsCount: sessions.length,
          totalVolume: Math.round(totalVol),
        });
      }
    } catch (e) {
      console.error('Error loading stats:', e);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadStats();
      fetchWorkoutHistory(user.id);
      getCurrentPRs();
    }
  }, [user, fetchWorkoutHistory, getCurrentPRs]);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async () => {
    if (!formData.username.trim()) return;
    setIsSaving(true);

    try {
      let avatar_url = userProfile?.avatar_url || null;

      // 1. Subir nuevo avatar si se seleccionó archivo
      if (avatarFile && user?.id) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}_${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile, { upsert: true });

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);
          avatar_url = publicUrlData.publicUrl;
        }
      }

      // 2. Guardar datos en la tabla users
      await updateUserProfile({
        username: formData.username.trim(),
        bio: formData.bio.trim() || null,
        instagram: formData.instagram.trim() ? `@${formData.instagram.trim().replace(/^@/, '')}` : null,
        social_link: formData.social_link.trim() || null,
        weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
        height_cm: formData.height_cm ? parseFloat(formData.height_cm) : null,
        avatar_url: avatar_url,
      });

      setIsEditOpen(false);
      setAvatarFile(null);
    } catch (e) {
      console.error('Error saving profile:', e);
      alert('Error al guardar el perfil: ' + (e.message || 'Inténtalo de nuevo'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleDeleteSession = async (sessionId) => {
    setIsDeletingSession(true);
    try {
      await deleteWorkoutSession(sessionId);
      await loadStats();
      if (user?.id) {
        await fetchWorkoutHistory(user.id);
        await getCurrentPRs();
      }
    } catch (e) {
      alert('Error al eliminar entrenamiento: ' + (e.message || e));
    } finally {
      setIsDeletingSession(false);
    }
  };

  const cleanInsta = (userProfile?.instagram || '').replace(/^@/, '');
  const totalEffectiveVol = stats.totalVolume || parseFloat(userProfile?.lifetime_volume_kg) || 0;
  const levelInfo = calculateLevel(totalEffectiveVol);
  const rank = levelInfo.rank;

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  return (
    <div className="px-4 pt-1 pb-32 flex-1 flex flex-col w-full text-white">
      
      {/* Prestige Roadmap Modal */}
      <PrestigeModal 
        isOpen={isPrestigeOpen} 
        onClose={() => setIsPrestigeOpen(false)} 
        totalVolumeKg={totalEffectiveVol} 
      />

      {/* Workout Detail & Delete Modal */}
      <WorkoutDetailModal
        isOpen={!!selectedWorkoutModal}
        onClose={() => setSelectedWorkoutModal(null)}
        workout={selectedWorkoutModal}
        onDelete={handleDeleteSession}
        isDeleting={isDeletingSession}
      />

      {/* Header */}
      <header className="flex justify-between items-center mb-4 pt-1">
        <h1 className="text-[28px] font-extrabold">Mi Perfil</h1>
        <button 
          onClick={() => setIsEditOpen(true)}
          className="p-2.5 rounded-full bg-[#1c1c1e] text-primary hover:bg-[#2c2c2e] transition-colors"
          title="Editar Perfil"
        >
          <Edit3 size={20} />
        </button>
      </header>

      {/* Main Profile Card */}
      <div className="bg-[#1c1c1e] border border-surface-2 rounded-3xl p-6 mb-5 text-center relative overflow-hidden shadow-xl">
        <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-primary/10 to-transparent"></div>
        
        {/* Avatar */}
        <div className="relative inline-block mb-3 z-10">
          <div className="w-24 h-24 rounded-full border-2 border-primary overflow-hidden mx-auto bg-surface-2 shadow-glow">
            {userProfile?.avatar_url ? (
              <img src={userProfile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <User size={40} />
              </div>
            )}
          </div>
        </div>

        {/* Name & Email */}
        <h2 className="text-2xl font-black text-white z-10 relative">{userProfile?.username || 'Atleta'}</h2>
        
        {/* Prestige & Level Badge */}
        <div 
          onClick={() => setIsPrestigeOpen(true)}
          className="inline-flex items-center space-x-2 my-2 px-3.5 py-1 rounded-full bg-[#121214] border border-surface-2 cursor-pointer hover:border-primary/60 transition-all z-10 relative group"
        >
          <span className="text-sm font-black text-white">Lv. {levelInfo.level}</span>
          <span className="text-gray-500">•</span>
          <span className={`text-xs font-black ${rank.textClass} flex items-center space-x-1`}>
            <span>{rank.badge}</span>
            <span>{rank.fullName}</span>
          </span>
        </div>

        <p className="text-xs text-gray-400 mb-3 z-10 relative">{user?.email}</p>

        {/* Bio */}
        {userProfile?.bio ? (
          <p className="text-sm text-gray-300 mb-4 px-2 italic font-normal leading-relaxed">
            "{userProfile.bio}"
          </p>
        ) : (
          <button 
            onClick={() => setIsEditOpen(true)}
            className="text-xs text-primary/80 hover:text-primary mb-4 block mx-auto underline cursor-pointer"
          >
            + Agregar una biografía corta
          </button>
        )}

        {/* Social Links Row */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2 border-t border-surface-2/60">
          {cleanInsta ? (
            <a
              href={`https://instagram.com/${cleanInsta}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#833ab4]/30 via-[#fd1d1d]/30 to-[#fcb045]/30 border border-[#fd1d1d]/40 text-white hover:opacity-90 transition-all active:scale-95 text-xs font-bold"
            >
              <InstagramIcon size={15} className="text-[#fcb045]" />
              <span>@{cleanInsta}</span>
            </a>
          ) : (
            <button
              onClick={() => setIsEditOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-[#2c2c2e] text-gray-400 hover:text-white transition-colors text-xs font-semibold"
            >
              <InstagramIcon size={14} />
              <span>Conectar Instagram</span>
            </button>
          )}

          {userProfile?.social_link && (
            <a
              href={userProfile.social_link.startsWith('http') ? userProfile.social_link : `https://${userProfile.social_link}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-full bg-[#2c2c2e] text-gray-300 hover:text-white transition-colors text-xs font-semibold"
            >
              <Globe size={14} className="text-primary" />
              <span className="truncate max-w-[120px]">{userProfile.social_link.replace(/^https?:\/\//, '')}</span>
            </a>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SEGMENTED TAB NAVIGATION */}
      {/* ========================================================================= */}
      <div className="flex bg-[#1c1c1e] border border-surface-2 rounded-[16px] p-1 mb-5 relative">
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex-1 py-2 rounded-[12px] text-xs font-black transition-colors relative z-10 flex items-center justify-center space-x-1.5 ${
            activeTab === 'stats' ? 'text-black' : 'text-gray-400 hover:text-white'
          }`}
        >
          {activeTab === 'stats' && (
            <motion.div
              layoutId="profileTabPill"
              className="absolute inset-0 bg-primary rounded-[12px] shadow-[0_0_12px_rgba(204,255,0,0.35)] -z-10"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
          <Activity size={14} />
          <span>Datos</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2 rounded-[12px] text-xs font-black transition-colors relative z-10 flex items-center justify-center space-x-1.5 ${
            activeTab === 'history' ? 'text-black' : 'text-gray-400 hover:text-white'
          }`}
        >
          {activeTab === 'history' && (
            <motion.div
              layoutId="profileTabPill"
              className="absolute inset-0 bg-primary rounded-[12px] shadow-[0_0_12px_rgba(204,255,0,0.35)] -z-10"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
          <Calendar size={14} />
          <span>Historial ({workoutHistory.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('prs')}
          className={`flex-1 py-2 rounded-[12px] text-xs font-black transition-colors relative z-10 flex items-center justify-center space-x-1.5 ${
            activeTab === 'prs' ? 'text-black' : 'text-gray-400 hover:text-white'
          }`}
        >
          {activeTab === 'prs' && (
            <motion.div
              layoutId="profileTabPill"
              className="absolute inset-0 bg-primary rounded-[12px] shadow-[0_0_12px_rgba(204,255,0,0.35)] -z-10"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
          <Trophy size={14} />
          <span>Récords</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: HISTORIAL DE ENTRENAMIENTOS */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <div className="space-y-3 mb-6">
          {isLoadingHistory ? (
            <div className="text-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mx-auto mb-2"></div>
              <p className="text-xs text-gray-400">Cargando tus entrenamientos...</p>
            </div>
          ) : workoutHistory.length === 0 ? (
            <div className="bg-[#1c1c1e] border border-surface-2 rounded-3xl p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-surface-2 flex items-center justify-center text-gray-500 mx-auto mb-3">
                <Dumbbell size={28} />
              </div>
              <h4 className="font-bold text-base mb-1">Sin entrenamientos guardados</h4>
              <p className="text-xs text-gray-400 mb-5 leading-relaxed">
                Tus sesiones terminadas aparecerán aquí con el detalle de kilos, ejercicios y PRs alcanzados.
              </p>
              <Button onClick={() => navigate('/workouts')} className="py-3 text-sm">
                Ir a Entrenar
              </Button>
            </div>
          ) : (
            workoutHistory.map((sess) => (
              <div
                key={sess.id}
                onClick={() => setSelectedWorkoutModal(sess)}
                className="bg-[#1c1c1e] border border-surface-2 rounded-2xl p-4 cursor-pointer hover:border-primary/50 transition-all active:scale-[0.99] shadow-md group"
              >
                <div className="flex items-start justify-between mb-2.5">
                  <div>
                    <span className="text-[11px] text-gray-400 font-bold flex items-center space-x-1 mb-0.5">
                      <Calendar size={12} className="text-primary" />
                      <span>{formatDate(sess.started_at)}</span>
                      <span>•</span>
                      <span>{sess.durationMinutes} min</span>
                    </span>
                    <h4 className="font-black text-base text-white group-hover:text-primary transition-colors">
                      {sess.title}
                    </h4>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-black text-primary block">
                      {sess.total_volume_kg.toLocaleString()} kg
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">
                      {sess.totalSetsCount} series
                    </span>
                  </div>
                </div>

                {/* PRs badge & Exercises Preview */}
                <div className="flex items-center justify-between pt-2 border-t border-surface-2/60 text-xs">
                  <div className="flex items-center space-x-2 truncate pr-2">
                    {sess.prsCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 font-black text-[10px] flex items-center space-x-1 shrink-0">
                        <Trophy size={11} />
                        <span>{sess.prsCount} PR{sess.prsCount > 1 ? 's' : ''}</span>
                      </span>
                    )}
                    <span className="text-gray-400 truncate text-[11px]">
                      {sess.exercises.map(e => e.name).slice(0, 3).join(', ')}
                      {sess.exercises.length > 3 ? ` +${sess.exercises.length - 3}` : ''}
                    </span>
                  </div>

                  <span className="text-primary text-xs font-bold shrink-0 flex items-center group-hover:translate-x-0.5 transition-transform">
                    Ver detalle <ChevronRight size={14} className="ml-0.5" />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: RÉCORDS PERSONALES (PRs) */}
      {/* ========================================================================= */}
      {activeTab === 'prs' && (
        <div className="space-y-3 mb-6">
          {currentPRs.length === 0 ? (
            <div className="bg-[#1c1c1e] border border-surface-2 rounded-3xl p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-surface-2 flex items-center justify-center text-yellow-500 mx-auto mb-3">
                <Trophy size={28} />
              </div>
              <h4 className="font-bold text-base mb-1">Aún no hay récords registrados</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Completa entrenamientos para registrar tus 1RM máximos y récords de volumen por ejercicio.
              </p>
            </div>
          ) : (
            currentPRs.map((pr, idx) => (
              <div key={idx} className="bg-[#1c1c1e] border border-surface-2 rounded-2xl p-4 flex items-center justify-between shadow-md">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-yellow-500/10 text-yellow-400 flex items-center justify-center shrink-0 border border-yellow-500/20">
                    <Trophy size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white">{pr.exercise_name || 'Ejercicio'}</h4>
                    <p className="text-[11px] text-gray-400 uppercase font-medium">{pr.muscle_group || 'General'}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-lg font-black text-primary">{Math.round(pr.max_1rm || pr.max_weight_kg || 0)} kg</span>
                  <span className="text-[10px] text-gray-400 block font-bold">1RM Estimado</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ESTADÍSTICAS Y DATOS */}
      {/* ========================================================================= */}
      {activeTab === 'stats' && (
        <div className="space-y-4 mb-6">
          {/* Fitness Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#1c1c1e] border border-surface-2 rounded-2xl p-4 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Scale size={20} />
              </div>
              <div>
                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Peso</p>
                <p className="text-lg font-black text-white">{userProfile?.weight_kg ? `${userProfile.weight_kg} kg` : '-'}</p>
              </div>
            </div>

            <div className="bg-[#1c1c1e] border border-surface-2 rounded-2xl p-4 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Ruler size={20} />
              </div>
              <div>
                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Altura</p>
                <p className="text-lg font-black text-white">{userProfile?.height_cm ? `${userProfile.height_cm} cm` : '-'}</p>
              </div>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="bg-[#1c1c1e] border border-surface-2 rounded-2xl p-5">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-4">Resumen Histórico</h3>
            
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 bg-[#141416] rounded-xl border border-surface-2/60">
                <p className="text-2xl font-black text-primary mb-0.5">{stats.workoutsCount}</p>
                <p className="text-xs text-gray-400 font-medium">Sesiones Realizadas</p>
              </div>
              <div className="p-3 bg-[#141416] rounded-xl border border-surface-2/60">
                <p className="text-2xl font-black text-white mb-0.5">{levelInfo.formattedKg}</p>
                <p className="text-xs text-gray-400 font-medium">Kilos Totales</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logout Button */}
      <Button 
        variant="secondary" 
        className="w-full py-4 text-left justify-start border-red-500/20 bg-red-500/5 hover:bg-red-500/10 mt-2 mb-8" 
        onClick={handleLogout}
      >
        <LogOut size={20} className="mr-3 text-red-400" /> 
        <span className="text-red-400 font-bold">Cerrar Sesión</span>
      </Button>

      {/* ========================================================================= */}
      {/* MODAL EDITAR PERFIL */}
      {/* ========================================================================= */}
      {isEditOpen && (
        <div className="fixed inset-0 z-[80] bg-black/85 backdrop-blur-sm flex flex-col justify-end md:justify-center items-center p-0 md:p-4 animate-in fade-in duration-200">
          <div className="bg-[#131313] border border-surface-2 w-full max-w-md h-[92vh] md:h-[86vh] rounded-t-[32px] md:rounded-3xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
            
            {/* Header Modal */}
            <header className="flex items-center justify-between p-5 border-b border-surface-2 bg-[#131313] sticky top-0 z-10">
              <button 
                onClick={() => setIsEditOpen(false)}
                className="text-primary text-[17px] font-medium"
              >
                Cancelar
              </button>
              <h2 className="text-lg font-bold text-white">Editar Perfil</h2>
              <button 
                onClick={handleSaveProfile}
                disabled={isSaving || !formData.username.trim()}
                className="text-primary text-[17px] font-bold disabled:opacity-50"
              >
                {isSaving ? 'Guardando...' : 'Listo'}
              </button>
            </header>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Avatar Picker */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full border-2 border-primary overflow-hidden bg-surface-2 shadow-lg">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <User size={40} />
                      </div>
                    )}
                  </div>
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-2 bg-primary text-black rounded-full shadow-md hover:opacity-90 transition-opacity"
                  >
                    <Camera size={16} />
                  </button>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleAvatarChange} 
                  accept="image/*" 
                  className="hidden" 
                />
                <span className="text-xs text-gray-400 mt-2 font-medium">Cambiar foto de perfil</span>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Nombre de Usuario *</label>
                  <input 
                    type="text" 
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Ej. Juan Pérez"
                    className="w-full bg-[#1c1c1e] border border-surface-2 rounded-xl px-4 py-3 text-white text-base focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Biografía Corta</label>
                  <textarea 
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Escribe algo sobre tus metas, disciplinas o lema..."
                    rows={2}
                    className="w-full bg-[#1c1c1e] border border-surface-2 rounded-xl px-4 py-3 text-white text-base focus:outline-none focus:border-primary resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Usuario de Instagram</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-4 text-gray-400 font-bold">@</span>
                    <input 
                      type="text" 
                      value={formData.instagram}
                      onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                      placeholder="tu_usuario"
                      className="w-full bg-[#1c1c1e] border border-surface-2 rounded-xl pl-9 pr-4 py-3 text-white text-base focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Enlace Personal / Web</label>
                  <input 
                    type="url" 
                    value={formData.social_link}
                    onChange={(e) => setFormData({ ...formData, social_link: e.target.value })}
                    placeholder="https://..."
                    className="w-full bg-[#1c1c1e] border border-surface-2 rounded-xl px-4 py-3 text-white text-base focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Peso (kg)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={formData.weight_kg}
                      onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                      placeholder="75.0"
                      className="w-full bg-[#1c1c1e] border border-surface-2 rounded-xl px-4 py-3 text-white text-base focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Altura (cm)</label>
                    <input 
                      type="number" 
                      value={formData.height_cm}
                      onChange={(e) => setFormData({ ...formData, height_cm: e.target.value })}
                      placeholder="178"
                      className="w-full bg-[#1c1c1e] border border-surface-2 rounded-xl px-4 py-3 text-white text-base focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
