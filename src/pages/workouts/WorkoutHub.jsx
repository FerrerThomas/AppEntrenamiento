import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { ChevronDown, Plus, ClipboardList, MoreHorizontal, Edit3, Trash2, X, AlertTriangle, Dumbbell, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Button from '../../components/ui/Button';

export default function WorkoutHub() {
  const workouts = useAppStore((state) => state.workouts);
  const startWorkout = useAppStore((state) => state.startWorkout);
  const fetchWorkouts = useAppStore((state) => state.fetchWorkouts);
  const navigate = useNavigate();

  const [isMyRoutinesOpen, setIsMyRoutinesOpen] = useState(true);
  const [activeRoutineMenu, setActiveRoutineMenu] = useState(null); // Rutina seleccionada para el menú ...
  const [selectedRoutineDetail, setSelectedRoutineDetail] = useState(null); // Rutina seleccionada para ver detalles
  const [routineToDelete, setRoutineToDelete] = useState(null); // Rutina pendiente de confirmación de borrado
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts]);

  const handleDeleteRoutine = async () => {
    if (!routineToDelete) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('routines').delete().eq('id', routineToDelete.id);
      if (error) throw error;
      await fetchWorkouts();
      setRoutineToDelete(null);
    } catch (err) {
      console.error('Error deleting routine:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-[#0a0a0a] min-h-screen text-white font-sans p-4 pb-24">
      {/* Header */}
      <header className="flex justify-between items-center mb-6 pt-2">
        <h1 className="text-[28px] font-extrabold">Entrenamiento</h1>
      </header>

      {/* Empezar Entrenamiento Vacío */}
      <Button 
        onClick={() => navigate('/workouts/active')}
        className="w-full flex items-center justify-start py-4 mb-8"
        variant="outline"
      >
        <Plus size={20} className="mr-3" />
        <span className="font-bold">Empezar Entrenamiento Vacío</span>
      </Button>

      {/* Rutinas Section */}
      <div className="mb-4">
        <h2 className="text-lg font-bold">Rutinas</h2>
      </div>

      <div className="mb-8">
        <Button 
          onClick={() => navigate('/workouts/create')}
          className="w-full py-4 flex flex-row justify-center items-center space-x-2 bg-surface-1 hover:bg-surface-2 text-white border-none"
        >
          <ClipboardList size={20} />
          <span className="font-bold">Nueva Rutina</span>
        </Button>
      </div>

      {/* Mis rutinas */}
      <div 
        className="flex items-center space-x-2 mb-4 cursor-pointer text-gray-400 hover:text-white transition-colors"
        onClick={() => setIsMyRoutinesOpen(!isMyRoutinesOpen)}
      >
        <ChevronDown size={16} className={`transform transition-transform ${isMyRoutinesOpen ? '' : '-rotate-90'}`} />
        <span className="text-sm font-medium">Mis rutinas ({workouts.length})</span>
      </div>

      {isMyRoutinesOpen && (
        <div className="space-y-4">
          {workouts.length === 0 ? (
            <div className="text-center text-gray-500 py-6 text-sm">
              No tienes rutinas aún.
            </div>
          ) : (
            workouts.map((w) => {
              const exerciseNames = w.routine_exercises?.map(rx => rx.exercises?.name).join(', ') || 'Sin ejercicios';
              
              return (
                <div 
                  key={w.id} 
                  onClick={() => setSelectedRoutineDetail(w)}
                  className="bg-[#1c1c1e] rounded-2xl p-4 flex flex-col cursor-pointer border border-transparent hover:border-surface-2 transition-all active:scale-[0.99]"
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-[17px] hover:text-primary transition-colors">{w.title}</h3>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveRoutineMenu(w);
                      }}
                      className="text-gray-400 hover:text-white p-1.5 -mt-1 -mr-1 rounded-lg hover:bg-[#2c2c2e] transition-colors"
                    >
                      <MoreHorizontal size={20} />
                    </button>
                  </div>
                  
                  <p className="text-[#8e8e93] text-[13px] leading-tight mb-4 line-clamp-2">
                    {exerciseNames}
                  </p>
                  
                  <Button 
                    onClick={(e) => {
                      e.stopPropagation();
                      startWorkout(w);
                      navigate('/workouts/active');
                    }}
                    className="w-full py-3"
                  >
                    Empezar Rutina
                  </Button>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Routine Detail Modal */}
      {selectedRoutineDetail && (
        <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex flex-col justify-end md:justify-center items-center p-0 md:p-4 animate-in fade-in duration-200">
          <div className="bg-[#131313] border border-surface-2 w-full max-w-md h-[90vh] md:h-[82vh] rounded-t-[32px] md:rounded-3xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
            {/* Header Modal */}
            <header className="flex items-center justify-between p-5 border-b border-surface-2 bg-[#131313] sticky top-0 z-10">
              <div className="flex-1 min-w-0 pr-4">
                <h2 className="text-xl font-bold text-white truncate">{selectedRoutineDetail.title}</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {selectedRoutineDetail.routine_exercises?.length || 0} {selectedRoutineDetail.routine_exercises?.length === 1 ? 'ejercicio' : 'ejercicios'} • ~{selectedRoutineDetail.duration}
                </p>
              </div>
              <div className="flex items-center space-x-2 shrink-0">
                <button 
                  onClick={() => {
                    const rId = selectedRoutineDetail.id;
                    setSelectedRoutineDetail(null);
                    navigate(`/workouts/edit/${rId}`);
                  }}
                  className="p-2 rounded-full bg-[#1c1c1e] text-primary hover:bg-[#2c2c2e] transition-colors"
                  title="Editar Rutina"
                >
                  <Edit3 size={18} />
                </button>
                <button 
                  onClick={() => setSelectedRoutineDetail(null)}
                  className="p-2 rounded-full bg-[#1c1c1e] text-gray-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </header>

            {/* Scrollable Exercise Detail Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {(!selectedRoutineDetail.routine_exercises || selectedRoutineDetail.routine_exercises.length === 0) ? (
                <div className="text-center text-gray-500 py-12 text-sm">
                  Esta rutina no tiene ejercicios asignados aún.
                </div>
              ) : (
                selectedRoutineDetail.routine_exercises.map((rx, exIdx) => (
                  <div key={rx.id || exIdx} className="bg-[#1c1c1e] border border-surface-2 rounded-2xl p-4">
                    {/* Exercise Info */}
                    <div className="flex items-center space-x-3 mb-3">
                      {rx.exercises?.gif_url ? (
                        <img src={rx.exercises.gif_url} alt={rx.exercises?.name} className="w-12 h-12 rounded-xl object-cover bg-white" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-surface-2 flex items-center justify-center text-gray-400">
                          <Dumbbell size={22} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-[16px] text-white truncate">{rx.exercises?.name || 'Ejercicio'}</h4>
                        <p className="text-xs text-primary font-medium">{rx.exercises?.muscle_group || 'General'}</p>
                      </div>
                    </div>

                    {/* Sets Breakdown */}
                    {rx.sets && rx.sets.length > 0 && (
                      <div className="bg-[#131313] rounded-xl p-2.5 space-y-1.5 text-xs">
                        <div className="grid grid-cols-3 text-gray-400 font-bold uppercase tracking-wider text-[10px] pb-1 border-b border-surface-2/60 text-center">
                          <span>SERIE</span>
                          <span>PESO (KG)</span>
                          <span>REPETICIONES</span>
                        </div>
                        {rx.sets.map((s, sIdx) => (
                          <div key={s.id || sIdx} className="grid grid-cols-3 text-center py-1 font-medium text-gray-200">
                            <span className="text-gray-400 font-bold">{s.set_order != null ? s.set_order + 1 : sIdx + 1}</span>
                            <span className="text-white font-semibold">{s.target_weight_kg || s.weight || '-'} kg</span>
                            <span className="text-white font-semibold">{s.target_reps || s.reps || '-'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer Action */}
            <div className="p-4 border-t border-surface-2 bg-[#131313]">
              <Button 
                onClick={() => {
                  const routine = selectedRoutineDetail;
                  setSelectedRoutineDetail(null);
                  startWorkout(routine);
                  navigate('/workouts/active');
                }}
                className="w-full py-4 text-base font-bold flex items-center justify-center gap-2"
              >
                <Play size={18} fill="currentColor" />
                Empezar Rutina
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Action Menu Modal for Routine */}
      {activeRoutineMenu && (
        <div 
          onClick={() => setActiveRoutineMenu(null)}
          className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-sm flex items-end justify-center p-4 pb-28 animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-[#1c1c1e] border border-surface-2 w-full max-w-md rounded-3xl p-5 shadow-2xl animate-in slide-in-from-bottom duration-200"
          >
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-surface-2">
              <h3 className="font-bold text-lg text-white truncate pr-2">{activeRoutineMenu.title}</h3>
              <button 
                onClick={() => setActiveRoutineMenu(null)}
                className="text-gray-400 hover:text-white p-1.5 rounded-full bg-[#2c2c2e]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2">
              <button 
                onClick={() => {
                  const routine = activeRoutineMenu;
                  setActiveRoutineMenu(null);
                  setSelectedRoutineDetail(routine);
                }}
                className="w-full flex items-center p-3.5 rounded-2xl bg-[#2c2c2e]/60 hover:bg-[#2c2c2e] transition-colors text-white font-semibold text-[15px]"
              >
                <ClipboardList size={18} className="mr-3 text-primary" />
                Ver Detalle de Rutina
              </button>

              <button 
                onClick={() => {
                  const routineId = activeRoutineMenu.id;
                  setActiveRoutineMenu(null);
                  navigate(`/workouts/edit/${routineId}`);
                }}
                className="w-full flex items-center p-3.5 rounded-2xl bg-[#2c2c2e]/60 hover:bg-[#2c2c2e] transition-colors text-white font-semibold text-[15px]"
              >
                <Edit3 size={18} className="mr-3 text-primary" />
                Editar Rutina
              </button>

              <button 
                onClick={() => {
                  const r = activeRoutineMenu;
                  setActiveRoutineMenu(null);
                  setRoutineToDelete(r);
                }}
                className="w-full flex items-center p-3.5 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors font-semibold text-[15px]"
              >
                <Trash2 size={18} className="mr-3 text-red-400" />
                Eliminar Rutina
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {routineToDelete && (
        <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-[#1c1c1e] border border-surface-2 w-full max-w-sm rounded-3xl p-6 text-center animate-in zoom-in-95 duration-200 shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-red-500/15 text-red-400 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={28} />
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2">¿Eliminar Rutina?</h3>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              ¿Estás seguro de que deseas eliminar <span className="text-white font-semibold">"{routineToDelete.title}"</span>? Esta acción no se puede deshacer.
            </p>

            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setRoutineToDelete(null)}
                disabled={isDeleting}
                className="flex-1 py-3 border-surface-2 text-white"
              >
                Cancelar
              </Button>
              <button 
                onClick={handleDeleteRoutine}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-2xl font-bold bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Borrando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
