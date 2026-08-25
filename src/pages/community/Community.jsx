import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { 
  ArrowLeft, 
  Search, 
  UserPlus, 
  Users, 
  Check, 
  X, 
  Clock, 
  Flame, 
  Dumbbell, 
  UserCheck, 
  UserX,
  MapPin
} from 'lucide-react';
import Button from '../../components/ui/Button';
import { calculateLevel } from '../../utils/levelSystem';

function InstagramIcon({ size = 14, className = "" }) {
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

export default function Community() {
  const navigate = useNavigate();
  
  const friends = useAppStore((state) => state.friends) || [];
  const friendsTraining = useAppStore((state) => state.friendsTraining) || [];
  const pendingRequests = useAppStore((state) => state.pendingFollowRequests) || [];
  
  const fetchFriends = useAppStore((state) => state.fetchFriends);
  const fetchPendingFollowRequests = useAppStore((state) => state.fetchPendingFollowRequests);
  const acceptFollowRequest = useAppStore((state) => state.acceptFollowRequest);
  const rejectFollowRequest = useAppStore((state) => state.rejectFollowRequest);
  const sendFollowRequest = useAppStore((state) => state.sendFollowRequest);
  const searchUsers = useAppStore((state) => state.searchUsers);

  const [activeTab, setActiveTab] = useState('friends'); // 'friends', 'search', 'requests'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sentRequests, setSentRequests] = useState({});

  useEffect(() => {
    fetchFriends();
    fetchPendingFollowRequests();
  }, [fetchFriends, fetchPendingFollowRequests]);

  // Búsqueda en tiempo real
  useEffect(() => {
    const handleSearch = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      const res = await searchUsers(searchQuery);
      setSearchResults(res);
      setIsSearching(false);
    };

    const debounceTimer = setTimeout(handleSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, searchUsers]);

  const handleSendRequest = async (targetUserId) => {
    try {
      await sendFollowRequest(targetUserId);
      setSentRequests(prev => ({ ...prev, [targetUserId]: true }));
    } catch (err) {
      console.error('Error enviando solicitud:', err);
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col p-4 pb-32 animate-in fade-in duration-200">
      
      {/* Header */}
      <header className="flex items-center justify-between mb-4 pt-1 sticky top-0 bg-surface-0/95 backdrop-blur-md z-20 pb-2 border-b border-surface-2/60">
        <button 
          onClick={() => navigate('/')}
          className="p-2 rounded-full bg-[#1c1c1e] text-gray-300 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-black">Comunidad</h1>
        <div className="w-9"></div>
      </header>

      {/* Tabs Navigation Segmentada */}
      <div className="w-full bg-[#242426] p-1 rounded-[14px] mb-5 border border-surface-2 flex relative">
        <button
          onClick={() => setActiveTab('friends')}
          className={`flex-1 py-2.5 rounded-[10px] text-xs font-bold transition-colors flex items-center justify-center space-x-1.5 relative z-10 ${
            activeTab === 'friends' ? 'text-black font-black' : 'text-gray-400 hover:text-white'
          }`}
        >
          {activeTab === 'friends' && (
            <motion.div
              layoutId="communityTabPill"
              className="absolute inset-0 bg-primary rounded-[10px] shadow-md -z-10"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
          <Users size={15} />
          <span>Amigos ({friends.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('search')}
          className={`flex-1 py-2.5 rounded-[10px] text-xs font-bold transition-colors flex items-center justify-center space-x-1.5 relative z-10 ${
            activeTab === 'search' ? 'text-black font-black' : 'text-gray-400 hover:text-white'
          }`}
        >
          {activeTab === 'search' && (
            <motion.div
              layoutId="communityTabPill"
              className="absolute inset-0 bg-primary rounded-[10px] shadow-md -z-10"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
          <Search size={15} />
          <span>Buscar</span>
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`flex-1 py-2.5 rounded-[10px] text-xs font-bold transition-colors flex items-center justify-center space-x-1.5 relative z-10 ${
            activeTab === 'requests' ? 'text-black font-black' : 'text-gray-400 hover:text-white'
          }`}
        >
          {activeTab === 'requests' && (
            <motion.div
              layoutId="communityTabPill"
              className="absolute inset-0 bg-primary rounded-[10px] shadow-md -z-10"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
          <UserPlus size={15} />
          <span>Solicitudes</span>
          {pendingRequests.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center ml-1 animate-pulse">
              {pendingRequests.length}
            </span>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* PESTAÑA 1: AMIGOS */}
      {/* ========================================================================= */}
      {activeTab === 'friends' && (
        <div className="space-y-6">
          {/* Amigos entrenando hoy */}
          {friendsTraining.length > 0 && (
            <div className="bg-gradient-to-r from-primary/15 to-transparent border border-primary/40 rounded-3xl p-4 shadow-lg">
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-2.5 h-2.5 rounded-full bg-primary animate-ping"></div>
                <h3 className="font-extrabold text-sm text-primary uppercase tracking-wider flex items-center">
                  <Flame size={16} className="mr-1.5" /> Entrenando Hoy ({friendsTraining.length})
                </h3>
              </div>

              <div className="space-y-2">
                {friendsTraining.map(friend => (
                  <div 
                    key={friend.id}
                    onClick={() => navigate(`/profile/${friend.id}`)}
                    className="flex items-center justify-between p-2.5 bg-[#141416]/80 rounded-2xl border border-surface-2 cursor-pointer hover:border-primary transition-all"
                  >
                    <div className="flex items-center space-x-3">
                      <img src={friend.avatar_url || `https://ui-avatars.com/api/?name=${friend.username}`} className="w-10 h-10 rounded-full object-cover border border-primary" />
                      <div>
                        <p className="font-bold text-sm text-white">{friend.username}</p>
                        <p className="text-[11px] text-gray-400">Activo recientemente</p>
                      </div>
                    </div>
                    <span className="text-xs text-primary font-bold">Ver perfil →</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lista completa de amigos */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Mis Amigos ({friends.length})
              </h3>
            </div>

            {friends.length === 0 ? (
              <div className="bg-[#1c1c1e] border border-surface-2 rounded-3xl p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-surface-2 flex items-center justify-center text-gray-500 mx-auto mb-3">
                  <Users size={32} />
                </div>
                <h4 className="font-bold text-base mb-1">Aún no tienes amigos agregados</h4>
                <p className="text-xs text-gray-400 mb-5 leading-relaxed">
                  Busca a otros atletas de tu gimnasio o del Ranking para ver sus progresos y entrenamientos.
                </p>
                <Button onClick={() => setActiveTab('search')} className="py-3 text-sm">
                  <Search size={16} className="mr-2" /> Buscar Atletas
                </Button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {friends.map(friend => {
                  const cleanInsta = (friend.instagram || '').replace(/^@/, '');
                  return (
                    <div 
                      key={friend.id}
                      onClick={() => navigate(`/profile/${friend.id}`)}
                      className="bg-[#1c1c1e] border border-surface-2 rounded-2xl p-3.5 flex items-center justify-between cursor-pointer hover:border-primary/40 transition-all active:scale-[0.99]"
                    >
                      <div className="flex items-center space-x-3 min-w-0 pr-2">
                        <img 
                          src={friend.avatar_url || `https://ui-avatars.com/api/?name=${friend.username}`} 
                          alt={friend.username}
                          className="w-12 h-12 rounded-full object-cover border border-surface-2 shrink-0" 
                        />
                        <div className="min-w-0">
                          <div className="flex items-center space-x-1.5">
                            <h4 className="font-bold text-sm text-white truncate">{friend.username}</h4>
                            <span className="px-1.5 py-0.2 rounded bg-surface-2 text-primary font-black text-[10px] shrink-0 border border-white/5">
                              Lv. {friend.current_level || calculateLevel(friend.lifetime_volume_kg || 0).level}
                            </span>
                          </div>
                          {cleanInsta ? (
                            <span className="text-[11px] text-[#fcb045] flex items-center font-medium mt-0.5">
                              <InstagramIcon size={12} className="mr-1 shrink-0" />
                              @{cleanInsta}
                            </span>
                          ) : (
                            <p className="text-[11px] text-gray-400 truncate mt-0.5">
                              {friend.bio || 'Atleta FTraining'}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center space-x-1.5 text-xs text-gray-400">
                        <span className="font-semibold text-primary">Perfil</span>
                        <span>→</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 2: BUSCAR ATLETAS */}
      {/* ========================================================================= */}
      {activeTab === 'search' && (
        <div className="space-y-4 w-full">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
            <input 
              type="text"
              placeholder="Buscar por nombre o usuario..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1c1c1e] border border-surface-2 text-white pl-10 pr-4 py-3.5 rounded-2xl focus:outline-none focus:border-primary text-base font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white p-1"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {isSearching && (
            <div className="text-center py-8 text-gray-400 text-xs font-semibold">
              Buscando atletas...
            </div>
          )}

          {!isSearching && searchResults.length > 0 && (
            <div className="space-y-2.5 w-full">
              {searchResults.map(user => {
                const isFriend = friends.some(f => f.id === user.id);
                const isSent = sentRequests[user.id];

                return (
                  <div 
                    key={user.id}
                    className="bg-[#1c1c1e] border border-surface-2 rounded-2xl p-3.5 flex items-center justify-between"
                  >
                    <div 
                      onClick={() => navigate(`/profile/${user.id}`)}
                      className="flex items-center space-x-3 flex-1 min-w-0 cursor-pointer pr-2"
                    >
                      <img 
                        src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.username}`} 
                        alt={user.username}
                        className="w-12 h-12 rounded-full object-cover border border-surface-2 shrink-0" 
                      />
                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <h4 className="font-bold text-sm text-white truncate hover:text-primary transition-colors">{user.username}</h4>
                          <span className="px-1.5 py-0.2 rounded bg-surface-2 text-primary font-black text-[10px] shrink-0 border border-white/5">
                            Lv. {user.current_level || calculateLevel(user.lifetime_volume_kg || 0).level}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 truncate mt-0.5">{user.bio || 'Atleta FTraining'}</p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isFriend ? (
                        <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center space-x-1">
                          <Check size={12} />
                          <span>Amigos</span>
                        </span>
                      ) : isSent ? (
                        <span className="px-3 py-1.5 rounded-full bg-[#2c2c2e] text-gray-400 text-xs font-semibold flex items-center space-x-1">
                          <Clock size={12} />
                          <span>Enviada</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSendRequest(user.id)}
                          className="px-4 py-2 rounded-full bg-primary text-black font-extrabold text-xs hover:opacity-90 transition-all active:scale-95 flex items-center space-x-1 shadow-sm"
                        >
                          <UserPlus size={13} />
                          <span>Seguir</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!isSearching && searchQuery && searchResults.length === 0 && (
            <div className="bg-[#1c1c1e] border border-surface-2 rounded-2xl p-8 text-center my-2">
              <p className="text-gray-400 text-sm">
                No se encontraron atletas con "{searchQuery}".
              </p>
            </div>
          )}

          {!searchQuery && (
            <div className="text-center py-12 text-gray-500 text-xs">
              Escribe el nombre de un amigo para encontrar su perfil y enviarle solicitud.
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 3: SOLICITUDES ENTRANTES */}
      {/* ========================================================================= */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1 mb-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Solicitudes Pendientes ({pendingRequests.length})
            </h3>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="bg-[#1c1c1e] border border-surface-2 rounded-3xl p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-surface-2 flex items-center justify-center text-gray-500 mx-auto mb-3">
                <Check size={28} className="text-primary" />
              </div>
              <h4 className="font-bold text-base mb-1">Todo al día</h4>
              <p className="text-xs text-gray-400">No tienes solicitudes de seguimiento pendientes.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map(req => (
                <div 
                  key={req.id}
                  className="bg-[#1c1c1e] border border-surface-2 rounded-2xl p-4"
                >
                  <div 
                    onClick={() => navigate(`/profile/${req.sender_id}`)}
                    className="flex items-center space-x-3 mb-3 cursor-pointer"
                  >
                    <img 
                      src={req.sender.avatar_url || `https://ui-avatars.com/api/?name=${req.sender.username}`} 
                      className="w-12 h-12 rounded-full object-cover border border-primary shadow-glow" 
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-white truncate hover:text-primary transition-colors">{req.sender.username}</h4>
                      <p className="text-xs text-gray-400 truncate">{req.sender.bio || 'Quiere seguir tu actividad'}</p>
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-2 border-t border-surface-2/60">
                    <button
                      onClick={() => acceptFollowRequest(req.id)}
                      className="flex-1 py-2.5 rounded-xl bg-primary text-black font-black text-xs hover:opacity-90 transition-all flex items-center justify-center space-x-1.5"
                    >
                      <UserCheck size={14} />
                      <span>Aceptar</span>
                    </button>

                    <button
                      onClick={() => rejectFollowRequest(req.id)}
                      className="flex-1 py-2.5 rounded-xl bg-[#2c2c2e] text-gray-300 hover:text-white font-semibold text-xs transition-colors flex items-center justify-center space-x-1.5"
                    >
                      <UserX size={14} />
                      <span>Rechazar</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
