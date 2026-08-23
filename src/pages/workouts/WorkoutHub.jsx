import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { ChevronDown, Plus, ClipboardList, MoreHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';

export default function WorkoutHub() {
  const workouts = useAppStore((state) => state.workouts);
  const startWorkout = useAppStore((state) => state.startWorkout);
  const fetchWorkouts = useAppStore((state) => state.fetchWorkouts);
  const navigate = useNavigate();

  const [isMyRoutinesOpen, setIsMyRoutinesOpen] = useState(true);

  useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts]);

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
                    <button className="text-gray-400 hover:text-white p-1 -mt-1 -mr-1">
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
    </div>
  );
}
