import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { ChevronDown, Plus, ClipboardList, MoreHorizontal, Edit3, Trash2, X, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Button from '../../components/ui/Button';

export default function WorkoutHub() {
  const workouts = useAppStore((state) => state.workouts);
  const startWorkout = useAppStore((state) => state.startWorkout);
  const fetchWorkouts = useAppStore((state) => state.fetchWorkouts);
  const navigate = useNavigate();

  const [isMyRoutinesOpen, setIsMyRoutinesOpen] = useState(true);
  const [activeRoutineMenu, setActiveRoutineMenu] = useState(null); // Rutina seleccionada para el menú
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
                <div key={w.id} className="bg-[#1c1c1e] rounded-2xl p-4 flex flex-col">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-[17px]">{w.title}</h3>
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
                    onClick={() => {
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

      {/* Action Menu Modal for Routine */}
      {activeRoutineMenu && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end justify-center p-4">
          <div className="bg-[#1c1c1e] border border-surface-2 w-full max-w-md rounded-3xl p-5 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-surface-2">
              <h3 className="font-bold text-lg text-white truncate pr-2">{activeRoutineMenu.title}</h3>
              <button 
                onClick={() => setActiveRoutineMenu(null)}
                className="text-gray-400 hover:text-white p-1 rounded-full bg-[#2c2c2e]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2">
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-[#1c1c1e] border border-surface-2 w-full max-w-sm rounded-3xl p-6 text-center animate-in zoom-in-95 duration-200">
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
