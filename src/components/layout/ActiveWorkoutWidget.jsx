import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronUp, Trash2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export default function ActiveWorkoutWidget() {
  const navigate = useNavigate();
  const activeWorkout = useAppStore((state) => state.activeWorkout);
  const cancelWorkout = useAppStore((state) => state.cancelWorkout);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!activeWorkout) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - activeWorkout.startTime) / 1000));
    }, 1000);
    // Ejecutar una vez al inicio para que no haya delay
    setElapsed(Math.floor((Date.now() - activeWorkout.startTime) / 1000));

    return () => clearInterval(interval);
  }, [activeWorkout]);

  if (!activeWorkout) return null;

  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60);
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    if (m > 60) {
      const h = Math.floor(m / 60);
      const remainingM = (m % 60).toString().padStart(2, '0');
      return `${h}h ${remainingM}m ${s}s`;
    }
    return `${m}min ${s}s`;
  };

  // Obtener el nombre del primer ejercicio para mostrarlo como preview
  const firstExercise = activeWorkout.routine_exercises?.[0]?.exercises?.name || 'Entrenamiento';

  return (
    <div className="fixed bottom-[88px] left-0 right-0 max-w-md mx-auto px-4 pb-4 z-40 animate-in slide-in-from-bottom-2 duration-300">
      <div
        onClick={() => navigate('/workouts/active')}
        className="w-full bg-[#1c1c1e] rounded-[32px] p-2 flex items-center justify-between cursor-pointer shadow-[0_8px_30px_rgb(0,0,0,0.5)] border border-[#2c2c2e]"
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate('/workouts/active');
          }}
          className="w-12 h-12 rounded-full bg-[#2c2c2e] flex items-center justify-center text-white"
        >
          <ChevronUp size={24} />
        </button>

        <div className="flex-1 flex flex-col items-center justify-center px-4 overflow-hidden">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
            <span className="font-bold text-white text-[15px]">Entrenamiento</span>
            <span className="font-mono text-gray-300 text-sm">{formatTime(elapsed)}</span>
          </div>
          <span className="text-gray-500 text-xs truncate w-full text-center">
            {firstExercise}
          </span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm('¿Estás seguro de que quieres cancelar este entrenamiento? Se perderá el progreso.')) {
              cancelWorkout();
            }
          }}
          className="w-12 h-12 rounded-full bg-error/10 hover:bg-error/20 flex items-center justify-center text-error transition-colors"
        >
          <Trash2 size={20} />
        </button>
      </div>
    </div>
  );
}
