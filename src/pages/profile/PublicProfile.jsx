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
  ExternalLink,
  UserPlus,
  UserCheck,
  UserX,
  Clock,
  Check
} from 'lucide-react';
import Button from '../../components/ui/Button';
import { calculateLevel } from '../../utils/levelSystem';
import PrestigeModal from '../../components/common/PrestigeModal';

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
  const getFollowStatus = useAppStore((state) => state.getFollowStatus);
  const sendFollowRequest = useAppStore((state) => state.sendFollowRequest);
  const cancelFollowRequest = useAppStore((state) => state.cancelFollowRequest);
  const acceptFollowRequest = useAppStore((state) => state.acceptFollowRequest);
  const rejectFollowRequest = useAppStore((state) => state.rejectFollowRequest);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [followStatus, setFollowStatus] = useState('loading'); // 'loading', 'none', 'pending_sent', 'pending_received', 'following', 'self'
  const [actionLoading, setActionLoading] = useState(false);
  const [isPrestigeOpen, setIsPrestigeOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await fetchPublicProfile(profileUserId);
        setProfile(data);

        if (currentUser?.id && profileUserId) {
          if (currentUser.id === profileUserId) {
            setFollowStatus('self');
          } else {
            const status = await getFollowStatus(profileUserId);
            setFollowStatus(status);
          }
        }
      } catch (err) {
        console.error('Error loading public profile:', err);
      } finally {
        setLoading(false);
      }
    };

    if (profileUserId) {
      loadData();
    }
  }, [profileUserId, currentUser, fetchPublicProfile, getFollowStatus]);

  const handleSendFollow = async () => {
    setActionLoading(true);
    try {
      await sendFollowRequest(profileUserId);
      setFollowStatus('pending_sent');
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelFollow = async () => {
    setActionLoading(true);
    try {
      await cancelFollowRequest(profileUserId);
      setFollowStatus('none');
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent mb-3"></div>
        <p className="text-gray-400 text-xs font-semibold">Cargando perfil...</p>
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

  const cleanInsta = (profile.instagram || '').replace(/^@/, '');
  const isOwnProfile = followStatus === 'self';
  const levelInfo = calculateLevel(profile.totalVolume || 0);
  const rank = levelInfo.rank;

  return (
    <div className="w-full flex-1 flex flex-col px-4 pt-1 pb-32 text-white animate-in fade-in duration-200">
      
      {/* Modal de Prestigio */}
      <PrestigeModal 
        isOpen={isPrestigeOpen} 
        onClose={() => setIsPrestigeOpen(false)} 
        totalVolumeKg={profile.totalVolume || 0} 
      />

      {/* Header Sticky */}
      <header className="flex items-center justify-between mb-4 pt-1 sticky top-0 bg-[#0a0a0a]/90 backdrop-blur-md z-10 pb-2 border-b border-surface-2/60">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 rounded-full bg-[#1c1c1e] text-gray-300 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-[17px] font-bold">Perfil de Atleta</h1>
        <div className="w-9"></div>
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

        {/* Gym Badge */}
        <div className="mt-1 mb-3">
          {profile.gymName ? (
            <div className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-surface-2/80 text-primary text-xs font-semibold">
              <MapPin size={12} />
              <span>{profile.gymName}</span>
            </div>
          ) : (
            <div className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-surface-2/80 text-gray-400 text-xs font-semibold">
              <Dumbbell size={12} />
              <span>Comunidad FTraining</span>
            </div>
          )}
        </div>

        {/* Bio / Description */}
        {profile.bio && (
          <p className="text-sm text-gray-300 mb-4 px-3 italic font-normal leading-relaxed">
            "{profile.bio}"
          </p>
        )}

        {/* Botón de Seguimiento / Amistad */}
        {!isOwnProfile && (
          <div className="mb-5 flex justify-center">
            {followStatus === 'following' && (
              <button
                onClick={handleCancelFollow}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-full bg-[#2c2c2e] text-primary border border-primary/30 font-bold text-xs hover:bg-[#3c3c3e] transition-all flex items-center space-x-1.5 active:scale-95"
              >
                <UserCheck size={14} />
                <span>✓ Siguiendo</span>
              </button>
            )}

            {followStatus === 'pending_sent' && (
              <button
                onClick={handleCancelFollow}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-full bg-[#2c2c2e] text-gray-400 border border-surface-2 font-bold text-xs hover:text-red-400 transition-all flex items-center space-x-1.5"
                title="Toca para cancelar solicitud"
              >
                <Clock size={14} />
                <span>Solicitud enviada</span>
              </button>
            )}

            {followStatus === 'pending_received' && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={async () => {
                    setActionLoading(true);
                    setFollowStatus('following');
                    setActionLoading(false);
                  }}
                  className="px-4 py-2 rounded-full bg-primary text-surface-0 font-bold text-xs hover:opacity-90 transition-all active:scale-95"
                >
                  ✓ Aceptar Solicitud
                </button>
                <button
                  onClick={async () => {
                    setActionLoading(true);
                    setFollowStatus('none');
                    setActionLoading(false);
                  }}
                  className="px-3 py-2 rounded-full bg-[#2c2c2e] text-gray-400 font-semibold text-xs"
                >
                  Rechazar
                </button>
              </div>
            )}

            {followStatus === 'none' && (
              <button
                onClick={handleSendFollow}
                disabled={actionLoading}
                className="px-6 py-2.5 rounded-full bg-primary text-surface-0 font-black text-xs hover:opacity-90 transition-all active:scale-95 flex items-center space-x-1.5 shadow-glow"
              >
                <UserPlus size={14} />
                <span>+ Seguir Atleta</span>
              </button>
            )}
          </div>
        )}

        {/* Redes Sociales */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-3 border-t border-surface-2/60">
          {cleanInsta && (
            <a
              href={`https://instagram.com/${cleanInsta}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#833ab4]/30 via-[#fd1d1d]/30 to-[#fcb045]/30 border border-[#fd1d1d]/40 text-white hover:opacity-90 transition-all active:scale-95 text-xs font-bold"
            >
              <InstagramIcon size={15} className="text-[#fcb045]" />
              <span>@{cleanInsta}</span>
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
          <p className="text-2xl font-black text-white">{levelInfo.formattedTons}</p>
          <p className="text-xs text-gray-400 font-medium mt-0.5">Tonelaje Total</p>
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
                  <span className="text-base font-black text-primary">{Math.round(pr.max_weight_kg)} kg</span>
                  <span className="text-[10px] text-gray-400 block font-medium">1RM Máx</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
