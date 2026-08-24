import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Bell, ArrowRight, Maximize2, Heart, MessageSquare, Trophy, Users, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const currentWorkout = useAppStore((state) => state.activeWorkout);
  const userProfile = useAppStore((state) => state.userProfile);
  const friends = useAppStore((state) => state.friends) || [];
  const friendsTraining = useAppStore((state) => state.friendsTraining) || [];
  const pendingRequests = useAppStore((state) => state.pendingFollowRequests) || [];
  const fetchFriends = useAppStore((state) => state.fetchFriends);
  const fetchPendingFollowRequests = useAppStore((state) => state.fetchPendingFollowRequests);
  const navigate = useNavigate();

  const [likes, setLikes] = useState({ 1: 12, 2: 24 });
  const [hasLiked, setHasLiked] = useState({ 1: false, 2: true });

  useEffect(() => {
    fetchFriends();
    fetchPendingFollowRequests();
  }, [fetchFriends, fetchPendingFollowRequests]);

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

  return (
    <div className="p-6 pb-32 min-h-screen bg-surface-0 flex flex-col max-w-md mx-auto">
      
      {/* Header */}
      <header className="flex justify-between items-center mb-6 pt-2">
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

      {/* Amigos entrenando / Tu comunidad Bar */}
      <div 
        onClick={() => navigate('/community')}
        className="bg-surface-1 border border-surface-2 rounded-2xl p-3.5 flex items-center justify-between mb-6 cursor-pointer hover:border-primary/50 transition-all active:scale-[0.99] shadow-md group"
      >
        <div className="flex items-center space-x-3">
          {trainingCount > 0 ? (
            <>
              <div className="flex -space-x-2">
                {friendsTraining.slice(0, 3).map((f, i) => (
                  <img 
                    key={f.id} 
                    src={f.avatar_url || `https://ui-avatars.com/api/?name=${f.username}`} 
                    className="w-8 h-8 rounded-full border-2 border-surface-1 object-cover" 
                  />
                ))}
                {trainingCount > 3 && (
                  <div className="w-8 h-8 rounded-full bg-surface-2 border-2 border-surface-1 flex items-center justify-center text-xs font-bold z-10 text-primary">
                    +{trainingCount - 3}
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
                <span className="text-sm font-bold text-white group-hover:text-primary transition-colors">
                  {trainingCount} {trainingCount === 1 ? 'amigo entrenando' : 'amigos entrenando'}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Users size={18} />
              </div>
              <div>
                <span className="text-sm font-bold text-white group-hover:text-primary transition-colors block">
                  Tu comunidad
                </span>
                <span className="text-[11px] text-gray-400">
                  {friends.length > 0 ? `${friends.length} amigos conectados` : 'Encuentra amigos y atletas'}
                </span>
              </div>
            </>
          )}
        </div>

        <button className="text-primary text-sm font-bold flex items-center group-hover:translate-x-0.5 transition-transform">
          Ver <ArrowRight size={16} className="ml-1" />
        </button>
      </div>

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
    </div>
  );
}
