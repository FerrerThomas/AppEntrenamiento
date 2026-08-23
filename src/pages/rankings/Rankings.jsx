import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, ArrowUp, ArrowDown, Minus, Crown, Dumbbell, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

const timeMapping = {
  'Hoy': 'daily',
  'Esta Semana': 'weekly',
  'Este Mes': 'monthly',
  'Siempre': 'all_time'
};

export default function Rankings() {
  const [filter, setFilter] = useState('local'); // 'local' (Mi Gimnasio) or 'global'
  const [metric, setMetric] = useState('Total'); // 'Total' (Volume) or 'RM'
  const [time, setTime] = useState('Este Mes');
  
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const userProfile = useAppStore((state) => state.userProfile);
  const currentRanking = useAppStore((state) => state.currentRanking) || [];
  const isRankingLoading = useAppStore((state) => state.isRankingLoading);
  const fetchVolumeRanking = useAppStore((state) => state.fetchVolumeRanking);
  const fetchExerciseRanking = useAppStore((state) => state.fetchExerciseRanking);
  
  const dbExercises = useAppStore((state) => state.dbExercises) || [];
  const fetchDbExercises = useAppStore((state) => state.fetchDbExercises);

  // Fetch Exercises on Mount
  useEffect(() => {
    fetchDbExercises();
  }, [fetchDbExercises]);

  // Handle switching to RM
  const handleMetricChange = (newMetric) => {
    setMetric(newMetric);
    if (newMetric === 'Total') {
      setSelectedExercise(null);
      setSearchQuery('');
    }
  };

  // Fetch Rankings
  useEffect(() => {
    const gymId = filter === 'local' ? (userProfile?.gym_id || null) : null;
    const tf = timeMapping[time] || 'monthly';

    if (metric === 'Total') {
      fetchVolumeRanking(tf, gymId);
    } else if (metric === 'RM' && selectedExercise) {
      // metric passed to DB is '1rm' for the RPC
      fetchExerciseRanking(selectedExercise.id, '1rm', tf, gymId);
    }
  }, [filter, metric, time, selectedExercise, userProfile, fetchVolumeRanking, fetchExerciseRanking]);

  // Derived data
  const podium = currentRanking.slice(0, 3).map((u, i) => ({
    ...u,
    position: i + 1,
    weight: metric === 'Total' ? `${Math.round(u.total_volume || u.best_score || 0)} kg` : `${Math.round(u.total_volume || u.best_score || 0)} kg`,
    avatar: u.avatar_url || `https://ui-avatars.com/api/?name=${u.username}&background=random`
  }));

  // Fix podium order for display: 2, 1, 3
  const displayPodium = [
    podium[1] || null, // Position 2
    podium[0] || null, // Position 1 (Crown)
    podium[2] || null  // Position 3
  ];

  const list = currentRanking.slice(3).map((u, i) => ({
    ...u,
    position: i + 4,
    weight: metric === 'Total' ? `${Math.round(u.total_volume || u.best_score || 0)} kg` : `${Math.round(u.total_volume || u.best_score || 0)} kg`,
    avatar: u.avatar_url || `https://ui-avatars.com/api/?name=${u.username}&background=random`
  }));

  const filteredExercises = dbExercises.filter(ex => 
    ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ex.muscle_group.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 pb-32 min-h-screen bg-surface-0 flex flex-col items-center">
      <div className="w-full max-w-md">
        
        {/* Header & Main Toggle */}
        <div className="flex items-center justify-between mb-6 mt-2">
          <h1 className="text-2xl font-bold text-white">Rankings</h1>
          <div className="flex bg-surface-2 rounded-lg p-1">
            <button 
              className={`px-4 py-1.5 text-sm font-bold rounded-md transition-colors ${filter === 'local' ? 'bg-primary text-surface-0' : 'text-gray-400'}`}
              onClick={() => setFilter('local')}
            >
              Mi Gimnasio
            </button>
            <button 
              className={`px-4 py-1.5 text-sm font-bold rounded-md transition-colors ${filter === 'global' ? 'bg-surface-2 text-white' : 'text-gray-400'}`}
              onClick={() => setFilter('global')}
            >
              Global
            </button>
          </div>
        </div>

        {/* Search & Metric Toggle */}
        <div className="flex space-x-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder={metric === 'Total' ? "Buscar usuario..." : "Buscar ejercicio..."}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (metric === 'RM' && selectedExercise) {
                  setSelectedExercise(null); // Si empieza a escribir, borramos la selección para que vea la lista de nuevo
                }
              }}
              className="w-full bg-surface-1 border border-surface-2 rounded-lg py-2.5 pl-10 pr-10 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-primary/50 transition-colors"
            />
            {searchQuery && (
              <button 
                onClick={() => {
                  setSearchQuery('');
                  if (metric === 'RM') setSelectedExercise(null);
                }}
                className="absolute right-3 top-3 text-gray-400 hover:text-white"
              >
                <X size={18} />
              </button>
            )}
          </div>
          <div className="flex bg-surface-1 border border-surface-2 rounded-lg p-1">
            <button 
              className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${metric === 'Total' ? 'text-white' : 'text-gray-400'}`}
              onClick={() => handleMetricChange('Total')}
            >
              Total
            </button>
            <button 
              className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${metric === 'RM' ? 'text-white' : 'text-gray-400'}`}
              onClick={() => handleMetricChange('RM')}
            >
              RM
            </button>
          </div>
        </div>

        {/* Time Filters */}
        <div className="flex space-x-2 overflow-x-auto pb-2 mb-10 scrollbar-hide">
          {['Hoy', 'Esta Semana', 'Este Mes', 'Siempre'].map((t) => (
            <button 
              key={t}
              onClick={() => setTime(t)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-lg text-xs font-semibold ${time === t ? 'bg-surface-2 text-white border border-surface-2' : 'bg-surface-1 border border-surface-2 text-gray-400'}`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Exercise Selection List (Only when RM is selected and no exercise is confirmed) */}
        {metric === 'RM' && !selectedExercise ? (
          <div className="flex-1 overflow-y-auto mt-4">
            {filteredExercises.length === 0 ? (
              <p className="text-gray-500 text-center mt-10 text-sm">No se encontraron ejercicios.</p>
            ) : (
              filteredExercises.map((ex) => (
                <div 
                  key={ex.id} 
                  onClick={() => {
                    setSelectedExercise(ex);
                    setSearchQuery(ex.name); // Ponemos el nombre en el buscador
                  }}
                  className="flex items-center p-3 mb-2 bg-surface-1 hover:bg-surface-2 rounded-xl cursor-pointer transition-colors border border-surface-2 hover:border-primary/30"
                >
                  {ex.gif_url ? (
                    <img src={ex.gif_url} alt={ex.name} className="w-12 h-12 rounded-lg object-cover bg-white" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-surface-2 flex items-center justify-center text-gray-500">
                      <Dumbbell size={20} />
                    </div>
                  )}
                  <div className="ml-4 flex-1">
                    <h3 className="font-bold text-white">{ex.name}</h3>
                    <p className="text-xs text-gray-400">{ex.muscle_group}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <>
            {/* Selected Exercise Badge for RM (If they want to clear it without using the X in search) */}
            {metric === 'RM' && selectedExercise && (
              <div className="flex justify-center mb-6">
                <div className="flex items-center space-x-2 bg-primary/10 border border-primary/50 text-primary px-4 py-2 rounded-full text-sm font-bold shadow-[0_0_15px_rgba(204,255,0,0.1)]">
                  <Dumbbell size={16} />
                  <span>{selectedExercise.name}</span>
                </div>
              </div>
            )}

            {/* Loading State */}
            {isRankingLoading ? (
              <div className="flex justify-center items-center h-48">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : currentRanking.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-500">
                <Dumbbell size={48} className="mb-4 opacity-20" />
                <p>No hay datos suficientes para este ranking aún.</p>
                <p className="text-sm mt-2">¡Sé el primero en liderar!</p>
              </div>
            ) : (
              <>
                {/* Podium */}
                <div className="flex items-end justify-center mb-12 h-48 px-4">
                  
                  {/* Pos 2 */}
                  {displayPodium[0] && (
                    <div className="flex flex-col items-center -mr-4 z-10 pb-4">
                      <div className="relative">
                        <img src={displayPodium[0].avatar} className="w-20 h-20 rounded-full border-4 border-gray-300 object-cover" />
                        <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-surface-1 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border border-gray-300">
                          2
                        </div>
                      </div>
                      <span className="font-bold text-sm mt-5 text-center px-1 max-w-[80px] truncate">{displayPodium[0].username}</span>
                      <span className="font-black text-primary text-xl">{displayPodium[0].weight}</span>
                    </div>
                  )}

                  {/* Pos 1 */}
                  {displayPodium[1] && (
                    <div className="flex flex-col items-center z-20 mx-2">
                      <Crown className="text-primary mb-2" size={36} strokeWidth={2.5} />
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full shadow-glow opacity-50"></div>
                        <img src={displayPodium[1].avatar} className="w-28 h-28 rounded-full border-[4px] border-primary object-cover relative z-10" />
                        <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-primary text-surface-0 text-sm font-black w-8 h-8 rounded-full flex items-center justify-center z-20">
                          1
                        </div>
                      </div>
                      <span className="font-bold mt-6 text-center px-1 max-w-[100px] truncate">{displayPodium[1].username}</span>
                      <span className="font-black text-primary text-2xl">{displayPodium[1].weight}</span>
                    </div>
                  )}

                  {/* Pos 3 */}
                  {displayPodium[2] && (
                    <div className="flex flex-col items-center -ml-4 z-10 pb-6">
                      <div className="relative">
                        <img src={displayPodium[2].avatar} className="w-20 h-20 rounded-full border-4 border-[#b07d50] object-cover" />
                        <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-surface-1 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border border-[#b07d50]">
                          3
                        </div>
                      </div>
                      <span className="font-bold text-sm mt-5 text-center px-1 max-w-[80px] truncate">{displayPodium[2].username}</span>
                      <span className="font-black text-primary text-xl">{displayPodium[2].weight}</span>
                    </div>
                  )}
                </div>

                {/* List */}
                <div className="space-y-3">
                  {list.map((r) => (
                    <div key={r.user_id} className={`border rounded-xl flex items-center justify-between p-3 px-4 ${r.user_id === userProfile?.id ? 'bg-primary/10 border-primary' : 'bg-[#1c1b1b] border-[#2a2a2a]'}`}>
                      <div className="flex items-center space-x-4">
                        <span className="text-gray-400 font-mono w-4 text-center">{r.position}</span>
                        <img src={r.avatar} className="w-10 h-10 rounded-full object-cover" />
                        <span className="text-white text-base">{r.username}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-white text-base">{r.weight}</span>
                        <div className="bg-[#2a2a2a] rounded-full p-1">
                          <Minus className="text-gray-400" size={14} strokeWidth={3} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
