import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Minus, Crown, Dumbbell, X, Trophy, Flame, MapPin } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

const timeMapping = {
  'Hoy': 'daily',
  'Esta Semana': 'weekly',
  'Este Mes': 'monthly',
  'Siempre': 'all_time'
};

export default function Rankings() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('global'); // 'global' or 'local' (Mi Gimnasio)
  const [metric, setMetric] = useState('Total'); // 'Total' (Volumen) or 'RM' (1RM)
  const [time, setTime] = useState('Este Mes');
  
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const searchContainerRef = useRef(null);

  const userProfile = useAppStore((state) => state.userProfile);
  const currentRanking = useAppStore((state) => state.currentRanking) || [];
  const isRankingLoading = useAppStore((state) => state.isRankingLoading);
  const fetchVolumeRanking = useAppStore((state) => state.fetchVolumeRanking);
  const fetchExerciseRanking = useAppStore((state) => state.fetchExerciseRanking);
  
  const dbExercises = useAppStore((state) => state.dbExercises) || [];
  const fetchDbExercises = useAppStore((state) => state.fetchDbExercises);

  // Cargar lista de ejercicios de la BD al montar
  useEffect(() => {
    fetchDbExercises();
  }, [fetchDbExercises]);

  // Cierre de dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearching(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Consultar Rankings
  useEffect(() => {
    const gymId = filter === 'local' ? (userProfile?.gym_id || null) : null;
    const tf = timeMapping[time] || 'monthly';

    if (selectedExercise) {
      // Ranking específico de este ejercicio (Volumen o 1RM)
      const rpcMetric = metric === 'Total' ? 'volume' : '1rm';
      fetchExerciseRanking(selectedExercise.id, rpcMetric, tf, gymId);
    } else {
      // Ranking General de todo el entrenamiento
      fetchVolumeRanking(tf, gymId);
    }
  }, [filter, metric, time, selectedExercise, userProfile, fetchVolumeRanking, fetchExerciseRanking]);

  // Formateo de podio y lista
  const podium = currentRanking.slice(0, 3).map((u, i) => ({
    ...u,
    position: i + 1,
    weight: `${Math.round(u.total_volume || u.best_score || 0)} kg`,
    avatar: u.avatar_url || `https://ui-avatars.com/api/?name=${u.username}&background=random`
  }));

  const displayPodium = [
    podium[1] || null, // 2º lugar
    podium[0] || null, // 1º lugar
    podium[2] || null  // 3º lugar
  ];

  const list = currentRanking.slice(3).map((u, i) => ({
    ...u,
    position: i + 4,
    weight: `${Math.round(u.total_volume || u.best_score || 0)} kg`,
    avatar: u.avatar_url || `https://ui-avatars.com/api/?name=${u.username}&background=random`
  }));

  // Filtrar ejercicios para el autocompletado en el buscador
  const matchingExercises = dbExercises.filter(ex => 
    ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ex.muscle_group.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 8);

  const handleSelectExercise = (ex) => {
    setSelectedExercise(ex);
    setSearchQuery('');
    setIsSearching(false);
  };

  const handleClearExercise = () => {
    setSelectedExercise(null);
    setSearchQuery('');
  };

  return (
    <div className="px-4 pt-1 pb-32 flex-1 flex flex-col items-center w-full">
      <div className="w-full max-w-md">
        
        {/* Header & Local/Global Segmented Bar */}
        <div className="flex items-center justify-between mb-3 mt-1">
          <h1 className="text-2xl font-black text-white">Rankings</h1>
          
          <div className="flex bg-[#242426] border border-surface-2 rounded-[14px] p-1 relative">
            <button 
              onClick={() => setFilter('global')}
              className={`relative px-4 py-1.5 text-xs font-black rounded-[10px] transition-colors z-10 ${
                filter === 'global' ? 'text-black font-black' : 'text-gray-400 hover:text-white font-bold'
              }`}
            >
              {filter === 'global' && (
                <motion.div 
                  layoutId="filterPill" 
                  className="absolute inset-0 bg-primary rounded-[10px] shadow-md -z-10"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              Global
            </button>

            <button 
              onClick={() => setFilter('local')}
              className={`relative px-4 py-1.5 text-xs font-black rounded-[10px] transition-colors z-10 ${
                filter === 'local' ? 'text-black font-black' : 'text-gray-400 hover:text-white font-bold'
              }`}
            >
              {filter === 'local' && (
                <motion.div 
                  layoutId="filterPill" 
                  className="absolute inset-0 bg-primary rounded-[10px] shadow-md -z-10"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              Mi Gimnasio
            </button>
          </div>
        </div>

        {/* Search Bar y Filtro Total/RM Integrados */}
        <div className="space-y-3 mb-4">
          <div className="flex space-x-2">
            
            {/* Buscador de Ejercicios */}
            <div ref={searchContainerRef} className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-500" size={17} />
              <input 
                type="text"
                placeholder={selectedExercise ? selectedExercise.name : "Buscar ejercicio (ej. Hack, Banca...)"}
                value={searchQuery}
                onFocus={() => setIsSearching(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearching(true);
                }}
                className={`w-full bg-[#1c1c1e] border text-white pl-10 pr-9 py-2.5 rounded-[14px] text-sm font-medium focus:outline-none transition-colors ${
                  selectedExercise ? 'border-primary/60 text-primary font-bold placeholder-primary' : 'border-surface-2 focus:border-primary placeholder-gray-500'
                }`}
              />

              {/* Botón X para limpiar */}
              {(selectedExercise || searchQuery) && (
                <button 
                  onClick={handleClearExercise}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white p-0.5"
                  title="Quitar filtro de ejercicio"
                >
                  <X size={16} />
                </button>
              )}

              {/* Dropdown de Autocompletado */}
              {isSearching && searchQuery.trim() && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#141416] border border-surface-2 rounded-2xl shadow-2xl z-50 max-h-64 overflow-y-auto p-1.5 animate-in fade-in zoom-in-95 duration-150">
                  {matchingExercises.length === 0 ? (
                    <p className="text-gray-500 text-xs p-3 text-center">No se encontraron ejercicios con "{searchQuery}"</p>
                  ) : (
                    matchingExercises.map(ex => (
                      <div
                        key={ex.id}
                        onClick={() => handleSelectExercise(ex)}
                        className="flex items-center p-2.5 hover:bg-[#252528] rounded-xl cursor-pointer transition-colors"
                      >
                        {ex.gif_url ? (
                          <img src={ex.gif_url} alt={ex.name} className="w-9 h-9 rounded-lg object-cover bg-white shrink-0 mr-3 border border-surface-2" />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-surface-2 flex items-center justify-center text-gray-400 shrink-0 mr-3">
                            <Dumbbell size={16} />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-xs text-white truncate">{ex.name}</h4>
                          <p className="text-[10px] text-gray-400">{ex.muscle_group}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Segmented Selector Total / RM */}
            <div className="flex bg-[#242426] border border-surface-2 rounded-[14px] p-1 shrink-0 relative">
              <button 
                onClick={() => setMetric('Total')}
                className={`relative px-3.5 py-1 text-xs font-black rounded-[10px] transition-colors z-10 ${
                  metric === 'Total' ? 'text-black font-black' : 'text-gray-400 hover:text-white font-bold'
                }`}
                title="Volumen total acumulado en kg"
              >
                {metric === 'Total' && (
                  <motion.div 
                    layoutId="metricPill" 
                    className="absolute inset-0 bg-primary rounded-[10px] shadow-md -z-10"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                Total
              </button>

              <button 
                onClick={() => setMetric('RM')}
                className={`relative px-3.5 py-1 text-xs font-black rounded-[10px] transition-colors z-10 ${
                  metric === 'RM' ? 'text-black font-black' : 'text-gray-400 hover:text-white font-bold'
                }`}
                title="Récord máximo 1RM estimado"
              >
                {metric === 'RM' && (
                  <motion.div 
                    layoutId="metricPill" 
                    className="absolute inset-0 bg-primary rounded-[10px] shadow-md -z-10"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                RM
              </button>
            </div>
          </div>

          {/* Badge del ejercicio activo */}
          {selectedExercise && (
            <div className="flex items-center justify-between bg-primary/10 border border-primary/40 rounded-[14px] px-3.5 py-2 text-xs">
              <div className="flex items-center space-x-2 min-w-0 pr-2">
                <Dumbbell size={15} className="text-primary shrink-0" />
                <span className="text-primary font-extrabold truncate">
                  {selectedExercise.name}
                </span>
                <span className="text-gray-400 text-[11px] shrink-0 font-medium">
                  ({metric === 'Total' ? 'Volumen Total' : '1RM Máximo'})
                </span>
              </div>
              <button 
                onClick={handleClearExercise}
                className="text-gray-400 hover:text-white font-bold text-[11px] underline shrink-0 cursor-pointer"
              >
                Ver General
              </button>
            </div>
          )}
        </div>

        {/* Time Filters Segmented Bar (Exacta misma curvatura armónica) */}
        <div className="w-full bg-[#242426] border border-surface-2 rounded-[14px] p-1 flex mb-8 relative">
          {['Hoy', 'Esta Semana', 'Este Mes', 'Siempre'].map((t) => (
            <button 
              key={t}
              onClick={() => setTime(t)}
              className={`flex-1 py-2 rounded-[10px] text-xs text-center transition-colors relative z-10 ${
                time === t ? 'text-black font-black' : 'text-gray-400 hover:text-white font-bold'
              }`}
            >
              {time === t && (
                <motion.div 
                  layoutId="timePill" 
                  className="absolute inset-0 bg-primary rounded-[10px] shadow-[0_0_12px_rgba(204,255,0,0.35)] -z-10"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              {t}
            </button>
          ))}
        </div>

        {/* Content / Rankings Display */}
        {filter === 'local' && !userProfile?.gym_id ? (
          <div className="bg-[#1c1c1e] border border-surface-2 rounded-3xl p-8 text-center my-4 animate-in fade-in">
            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-4 text-primary">
              <MapPin size={28} />
            </div>
            <h4 className="font-bold text-lg text-white mb-2">No tienes un gimnasio asociado</h4>
            <p className="text-xs text-gray-400 mb-6 leading-relaxed max-w-xs mx-auto">
              Para competir en la tabla de clasificación de tu sede contra tus compañeros, asocia tu gimnasio en tu perfil.
            </p>
            <button
              onClick={() => navigate('/profile')}
              className="px-5 py-2.5 rounded-full bg-primary text-black font-bold text-sm shadow-[0_0_15px_rgba(204,255,0,0.3)] hover:opacity-90 transition-all active:scale-95"
            >
              Seleccionar mi Gimnasio
            </button>
          </div>
        ) : isRankingLoading ? (
          <div className="flex flex-col justify-center items-center h-52">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent mb-3"></div>
            <p className="text-gray-400 text-xs font-semibold">Cargando posiciones...</p>
          </div>
        ) : currentRanking.length === 0 ? (
          <div className="bg-[#1c1c1e] border border-surface-2 rounded-3xl p-8 text-center my-4">
            <div className="w-14 h-14 rounded-full bg-surface-2 flex items-center justify-center text-gray-500 mx-auto mb-3">
              <Dumbbell size={28} />
            </div>
            <h4 className="font-bold text-base mb-1">Sin registros todavía</h4>
            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
              {selectedExercise 
                ? `Nadie ha registrado ${metric === 'Total' ? 'volumen' : 'récords'} en ${selectedExercise.name} en este período.`
                : 'No hay datos de entrenamiento registrados para este período aún.'}
            </p>
            {selectedExercise && (
              <button 
                onClick={handleClearExercise}
                className="text-xs font-bold text-primary underline"
              >
                Volver al ranking general
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Podium */}
            <div className="grid grid-cols-3 items-end justify-items-center w-full max-w-sm mx-auto mb-10 pt-2 px-1">
              
              {/* Pos 2 (Plata / Silver - Columna 1 Izquierda) */}
              {displayPodium[0] && (
                <div 
                  onClick={() => navigate(`/profile/${displayPodium[0].user_id}`)}
                  className="col-start-1 col-span-1 flex flex-col items-center w-full pb-1 cursor-pointer hover:opacity-90 transition-transform active:scale-95 group"
                >
                  <div className="relative mb-3 flex items-center justify-center">
                    <img 
                      src={displayPodium[0].avatar} 
                      className="w-20 h-20 sm:w-[84px] sm:h-[84px] rounded-full border-[3.5px] border-[#CBD5E1] shadow-[0_0_16px_rgba(203,213,225,0.3)] object-cover shrink-0 aspect-square group-hover:scale-105 transition-all" 
                      alt={displayPodium[0].username}
                    />
                    <div className="absolute -bottom-2.5 left-1/2 transform -translate-x-1/2 bg-[#181C24] text-[#E2E8F0] text-xs font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-[#CBD5E1] shadow-md z-10">
                      2
                    </div>
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-center px-0.5 truncate w-full tracking-tight text-white group-hover:text-primary transition-colors">
                    {displayPodium[0].username}
                    {displayPodium[0].user_id === userProfile?.id ? ' (Tú)' : ''}
                  </span>
                  <span className="font-black text-primary text-base sm:text-lg tracking-tight mt-0.5">{displayPodium[0].weight}</span>
                </div>
              )}

              {/* Pos 1 (Oro / Gold - Columna 2 Centro Siempre) */}
              {displayPodium[1] && (
                <div 
                  onClick={() => navigate(`/profile/${displayPodium[1].user_id}`)}
                  className="col-start-2 col-span-1 flex flex-col items-center w-full -mt-6 pb-0 cursor-pointer hover:opacity-90 transition-transform active:scale-95 group z-10"
                >
                  {/* Corona dorada a juego con el anillo */}
                  <Crown className="text-[#FACC15] fill-[#FACC15] mb-1.5 drop-shadow-[0_0_12px_rgba(250,204,21,0.6)] animate-bounce" size={32} strokeWidth={2} />
                  
                  <div className="relative mb-3.5 flex items-center justify-center">
                    {/* Resplandor dorado */}
                    <div className="absolute inset-0 rounded-full bg-[#FACC15]/20 blur-md scale-110 pointer-events-none"></div>
                    <img 
                      src={displayPodium[1].avatar} 
                      className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-[4px] border-[#FACC15] shadow-[0_0_25px_rgba(250,204,21,0.5)] object-cover shrink-0 aspect-square relative z-10 group-hover:scale-105 transition-all" 
                      alt={displayPodium[1].username}
                    />
                    <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-primary text-surface-0 text-sm font-black w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border-2 border-[#0A0A0A] shadow-lg z-20">
                      1
                    </div>
                  </div>
                  <span className="font-extrabold text-sm sm:text-base text-center px-0.5 truncate w-full tracking-tight text-white group-hover:text-primary transition-colors">
                    {displayPodium[1].username}
                    {displayPodium[1].user_id === userProfile?.id ? ' (Tú)' : ''}
                  </span>
                  <span className="font-black text-primary text-xl sm:text-2xl tracking-tight mt-0.5">{displayPodium[1].weight}</span>
                </div>
              )}

              {/* Pos 3 (Bronce / Bronze - Columna 3 Derecha) */}
              {displayPodium[2] && (
                <div 
                  onClick={() => navigate(`/profile/${displayPodium[2].user_id}`)}
                  className="col-start-3 col-span-1 flex flex-col items-center w-full pb-1 cursor-pointer hover:opacity-90 transition-transform active:scale-95 group"
                >
                  <div className="relative mb-3 flex items-center justify-center">
                    <img 
                      src={displayPodium[2].avatar} 
                      className="w-20 h-20 sm:w-[84px] sm:h-[84px] rounded-full border-[3.5px] border-[#F59E0B] shadow-[0_0_16px_rgba(245,158,11,0.35)] object-cover shrink-0 aspect-square group-hover:scale-105 transition-all" 
                      alt={displayPodium[2].username}
                    />
                    <div className="absolute -bottom-2.5 left-1/2 transform -translate-x-1/2 bg-[#231508] text-[#F59E0B] text-xs font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-[#F59E0B] shadow-md z-10">
                      3
                    </div>
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-center px-0.5 truncate w-full tracking-tight text-white group-hover:text-primary transition-colors">
                    {displayPodium[2].username}
                    {displayPodium[2].user_id === userProfile?.id ? ' (Tú)' : ''}
                  </span>
                  <span className="font-black text-primary text-base sm:text-lg tracking-tight mt-0.5">{displayPodium[2].weight}</span>
                </div>
              )}
            </div>

            {/* List */}
            <div className="space-y-3">
              {list.map((r) => (
                <div 
                  key={r.user_id} 
                  onClick={() => navigate(`/profile/${r.user_id}`)}
                  className={`border rounded-2xl flex items-center justify-between p-3.5 px-4 cursor-pointer hover:border-primary/50 transition-all active:scale-[0.99] group ${r.user_id === userProfile?.id ? 'bg-primary/10 border-primary' : 'bg-[#1c1b1b] border-[#2a2a2a]'}`}
                >
                  <div className="flex items-center space-x-4">
                    <span className="text-gray-400 font-mono w-4 text-center font-bold">{r.position}</span>
                    <img src={r.avatar} className="w-10 h-10 rounded-full object-cover border border-surface-2 group-hover:border-primary transition-colors" />
                    <span className="text-white text-base font-semibold group-hover:text-primary transition-colors">{r.username}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-white text-base font-bold">{r.weight}</span>
                    <div className="bg-[#2a2a2a] rounded-full p-1 group-hover:bg-primary group-hover:text-surface-0 transition-colors">
                      <Minus className="text-gray-400 group-hover:text-surface-0" size={14} strokeWidth={3} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
