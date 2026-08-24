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
  Ruler
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

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

  const [isEditOpen, setIsEditOpen] = useState(false);
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
    prsCount: 0,
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

  // Cargar estadísticas del usuario
  useEffect(() => {
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
            prsCount: 0
          });
        }
      } catch (e) {
        console.error('Error loading stats:', e);
      }
    };
    loadStats();
  }, [user]);

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
          const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
          avatar_url = publicUrlData.publicUrl;
        }
      }

      // 2. Limpiar instagram handle
      const cleanInstagram = formData.instagram.trim().replace(/^@/, '');

      // 3. Guardar en base de datos
      await updateUserProfile({
        username: formData.username.trim(),
        bio: formData.bio.trim(),
        instagram: cleanInstagram || null,
        social_link: formData.social_link.trim() || null,
        weight_kg: parseFloat(formData.weight_kg) || null,
        height_cm: parseFloat(formData.height_cm) || null,
        avatar_url
      });

      setIsEditOpen(false);
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const cleanInsta = (userProfile?.instagram || '').replace(/^@/, '');

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 pb-32 max-w-md mx-auto">
      {/* Header */}
      <header className="flex justify-between items-center mb-6 pt-2">
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
      <div className="bg-[#1c1c1e] border border-surface-2 rounded-3xl p-6 mb-6 text-center relative overflow-hidden shadow-xl">
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

      {/* Fitness Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-6">
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
      <div className="bg-[#1c1c1e] border border-surface-2 rounded-2xl p-5 mb-8">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Estadísticas de Entrenamiento</h3>
        
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="p-3 bg-[#141416] rounded-xl border border-surface-2/60">
            <p className="text-2xl font-black text-primary mb-0.5">{stats.workoutsCount}</p>
            <p className="text-xs text-gray-400 font-medium">Sesiones Realizadas</p>
          </div>
          <div className="p-3 bg-[#141416] rounded-xl border border-surface-2/60">
            <p className="text-2xl font-black text-white mb-0.5">{stats.totalVolume.toLocaleString()}</p>
            <p className="text-xs text-gray-400 font-medium">Volumen Total (kg)</p>
          </div>
        </div>
      </div>

      {/* Edit Profile Quick Button */}
      <Button 
        onClick={() => setIsEditOpen(true)}
        className="w-full py-4 mb-4 flex items-center justify-center space-x-2 bg-surface-1 hover:bg-surface-2 text-white border-none font-bold"
      >
        <Edit3 size={18} className="text-primary" />
        <span>Editar Perfil y Redes</span>
      </Button>

      {/* Logout Button */}
      <Button 
        variant="secondary" 
        className="w-full py-4 text-left justify-start border-red-500/20 bg-red-500/5 hover:bg-red-500/10" 
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
                className={`px-4 py-1.5 rounded-full font-bold text-sm transition-colors ${
                  formData.username.trim() && !isSaving ? 'bg-primary text-surface-0' : 'bg-[#2c2c2e] text-gray-500'
                }`}
              >
                {isSaving ? 'Guardando...' : 'Guardar'}
              </button>
            </header>

            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 pb-24">
              
              {/* Avatar Selector */}
              <div className="flex flex-col items-center justify-center p-4 bg-[#1c1c1e] rounded-2xl border border-surface-2">
                <div className="relative mb-2">
                  <div className="w-24 h-24 rounded-full border-2 border-primary overflow-hidden bg-surface-2 shadow-glow">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <User size={40} />
                      </div>
                    )}
                  </div>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center space-x-2 text-xs font-bold text-primary hover:underline mt-1"
                >
                  <Camera size={15} />
                  <span>Cambiar foto de perfil</span>
                </button>
              </div>

              {/* Nombre de Usuario */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Nombre de Usuario <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Tu nombre o alias"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full bg-[#1c1c1e] border border-surface-2 rounded-xl p-3.5 text-white font-semibold text-sm focus:outline-none focus:border-primary"
                />
              </div>

              {/* Biografía */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Biografía / Descripción
                </label>
                <textarea
                  rows={3}
                  maxLength={160}
                  placeholder="Cuéntale a la comunidad tus metas o disciplina favorita (ej: Powerlifting & Calistenia 🏋️‍♂️)"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full bg-[#1c1c1e] border border-surface-2 rounded-xl p-3.5 text-white text-sm focus:outline-none focus:border-primary resize-none placeholder-gray-600"
                />
                <p className="text-[11px] text-gray-500 text-right">{formData.bio.length}/160</p>
              </div>

              {/* Instagram */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <InstagramIcon size={14} className="text-[#fcb045]" />
                  <span>Usuario de Instagram</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-gray-500 font-bold text-sm">@</span>
                  <input
                    type="text"
                    placeholder="usuario"
                    value={formData.instagram}
                    onChange={(e) => setFormData({ ...formData, instagram: e.target.value.replace(/^@/, '') })}
                    className="w-full bg-[#1c1c1e] border border-surface-2 rounded-xl py-3.5 pl-8 pr-3.5 text-white font-semibold text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <p className="text-[11px] text-gray-500">
                  Aparecerá en tu perfil para que otros atletas puedan ver tus redes.
                </p>
              </div>

              {/* Link / Red Social Adicional */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <Globe size={14} className="text-primary" />
                  <span>Enlace Web o Red Social Adicional</span>
                </label>
                <input
                  type="text"
                  placeholder="tiktok.com/@tu_usuario o youtube.com/..."
                  value={formData.social_link}
                  onChange={(e) => setFormData({ ...formData, social_link: e.target.value })}
                  className="w-full bg-[#1c1c1e] border border-surface-2 rounded-xl p-3.5 text-white text-sm focus:outline-none focus:border-primary"
                />
              </div>

              {/* Peso y Altura */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Peso (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="75.0"
                    value={formData.weight_kg}
                    onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                    className="w-full bg-[#1c1c1e] border border-surface-2 rounded-xl p-3.5 text-white font-semibold text-sm focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Altura (cm)
                  </label>
                  <input
                    type="number"
                    placeholder="178"
                    value={formData.height_cm}
                    onChange={(e) => setFormData({ ...formData, height_cm: e.target.value })}
                    className="w-full bg-[#1c1c1e] border border-surface-2 rounded-xl p-3.5 text-white font-semibold text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
