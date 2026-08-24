import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { 
  ArrowLeft, 
  Globe, 
  Dumbbell, 
  Trophy, 
  MapPin, 
  User, 
  Activity,
  Flame,
  ExternalLink
} from 'lucide-react';
import Button from '../../components/ui/Button';

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

export default function PublicProfile() {
  const { id: profileUserId } = useParams();
  const navigate = useNavigate();
  
  const currentUser = useAppStore((state) => state.user);
  const fetchPublicProfile = useAppStore((state) => state.fetchPublicProfile);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      if (profileUserId) {
        const data = await fetchPublicProfile(profileUserId);
        setProfile(data);
      }
      setLoading(false);
    };
    loadData();
  }, [profileUserId, fetchPublicProfile]);

  const isOwnProfile = currentUser?.id === profileUserId;
  const cleanInsta = (profile?.instagram || '').replace(/^@/, '');

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white p-4 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-400 font-semibold text-sm">Cargando perfil del atleta...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white p-4 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-surface-2 flex items-center justify-center text-gray-500 mb-4">
          <User size={32} />
        </div>
        <h2 className="text-xl font-bold mb-2">Atleta no encontrado</h2>
        <p className="text-gray-400 text-sm mb-6">El perfil que buscas no existe o no está disponible.</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Volver atrás
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 pb-32 max-w-md mx-auto animate-in fade-in duration-200">
      
      {/* Header Sticky */}
      <header className="flex items-center justify-between mb-6 pt-2 sticky top-0 bg-[#0a0a0a]/90 backdrop-blur-md z-10 pb-2 border-b border-surface-2/60">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 rounded-full bg-[#1c1c1e] text-gray-300 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-[17px] font-bold">Perfil de Atleta</h1>
        <div className="w-9"></div> {/* Espaciador balanceador */}
      </header>

      {/* Main Athlete Card */}
      <div className="bg-[#1c1c1e] border border-surface-2 rounded-3xl p-6 mb-6 text-center relative overflow-hidden shadow-xl">
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-primary/15 via-primary/5 to-transparent"></div>

        {/* Avatar */}
        <div className="relative inline-block mb-3 z-10">
          <div className="w-24 h-24 rounded-full border-2 border-primary overflow-hidden mx-auto bg-surface-2 shadow-glow">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <User size={40} />
              </div>
            )}
          </div>
        </div>

        {/* Username */}
        <h2 className="text-2xl font-black text-white z-10 relative mb-1">{profile.username || 'Atleta'}</h2>
        
        {/* Gym Badge */}
        {profile.gymName ? (
          <div className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-surface-2/80 text-primary text-xs font-semibold mb-3">
            <MapPin size={12} />
            <span>{profile.gymName}</span>
          </div>
        ) : (
          <div className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-surface-2/80 text-gray-400 text-xs font-semibold mb-3">
            <Dumbbell size={12} />
            <span>Comunidad FTraining</span>
          </div>
        )}

        {/* Bio / Description */}
        {profile.bio && (
          <p className="text-sm text-gray-300 mb-4 px-3 italic font-normal leading-relaxed">
            "{profile.bio}"
          </p>
        )}

        {/* Social Actions */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-3 border-t border-surface-2/60">
          {cleanInsta && (
            <a
              href={`https://instagram.com/${cleanInsta}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white hover:opacity-95 transition-all shadow-md active:scale-95 text-xs font-extrabold"
            >
              <InstagramIcon size={16} />
              <span>Ver Instagram (@{cleanInsta})</span>
              <ExternalLink size={12} className="opacity-80" />
            </a>
          )}

          {profile.social_link && (
            <a
              href={profile.social_link.startsWith('http') ? profile.social_link : `https://${profile.social_link}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-full bg-[#2c2c2e] text-gray-200 hover:text-white transition-colors text-xs font-semibold border border-surface-2"
            >
              <Globe size={14} className="text-primary" />
              <span className="truncate max-w-[140px]">{profile.social_link.replace(/^https?:\/\//, '')}</span>
              <ExternalLink size={12} className="opacity-70" />
            </a>
          )}

          {!cleanInsta && !profile.social_link && (
            <p className="text-xs text-gray-500">Este atleta aún no ha vinculado redes sociales.</p>
          )}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-[#1c1c1e] border border-surface-2 rounded-2xl p-4 text-center">
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
            <Activity size={18} />
          </div>
          <p className="text-2xl font-black text-primary">{profile.totalWorkouts || 0}</p>
          <p className="text-xs text-gray-400 font-medium mt-0.5">Entrenamientos</p>
        </div>

        <div className="bg-[#1c1c1e] border border-surface-2 rounded-2xl p-4 text-center">
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
            <Flame size={18} />
          </div>
          <p className="text-2xl font-black text-white">{(profile.totalVolume || 0).toLocaleString()}</p>
          <p className="text-xs text-gray-400 font-medium mt-0.5">Kg Totales</p>
        </div>
      </div>

      {/* Récords Personales (PRs) */}
      {profile.prs && profile.prs.length > 0 && (
        <div className="bg-[#1c1c1e] border border-surface-2 rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center">
              <Trophy size={16} className="text-yellow-500 mr-2" />
              Mejores Récords
            </h3>
            <span className="text-xs text-gray-500 font-medium">{profile.prs.length} ejercicios</span>
          </div>

          <div className="space-y-2.5">
            {profile.prs.slice(0, 5).map((pr, idx) => (
              <div key={idx} className="bg-[#141416] border border-surface-2/60 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">{pr.exercise_name || 'Ejercicio'}</h4>
                  <p className="text-[11px] text-gray-400">{pr.muscle_group || 'General'}</p>
                </div>
                <div className="text-right">
                  <span className="text-base font-black text-primary">{Math.round(pr.max_1rm || 0)} kg</span>
                  <p className="text-[10px] text-gray-500 font-bold uppercase">1RM Est.</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Si es su propio perfil */}
      {isOwnProfile && (
        <Button 
          onClick={() => navigate('/profile')}
          className="w-full py-4 font-bold"
        >
          Ir a Mi Perfil Editable
        </Button>
      )}
    </div>
  );
}
