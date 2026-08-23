import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { Check, PlaySquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { supabase } from '../../lib/supabase';

export default function ActiveWorkout() {
  const navigate = useNavigate();
  const user = useAppStore((state) => state.user);
  const activeWorkout = useAppStore((state) => state.activeWorkout);
  const finishWorkout = useAppStore((state) => state.finishWorkout);
  
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [setsData, setSetsData] = useState({});
  const [isFinishing, setIsFinishing] = useState(false);
  
  // Timer state
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!activeWorkout) {
      navigate('/workouts');
      return;
    }

    // Initialize sets data for all exercises
    const initialData = {};
    activeWorkout.routine_exercises?.forEach((rx) => {
      const setsArray = [];
      for (let i = 0; i < rx.sets; i++) {
        setsArray.push({ id: i, kg: 0, reps: rx.reps, done: false });
      }
      initialData[rx.id] = setsArray;
    });
    setSetsData(initialData);

    // Timer
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - activeWorkout.startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeWorkout, navigate]);

  if (!activeWorkout) return null;

  const exercises = activeWorkout.routine_exercises || [];
  const currentRx = exercises[currentExerciseIndex];
  
  if (!currentRx) {
    return <div className="p-6">Error cargando ejercicios</div>;
  }

  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleNextExercise = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
    }
  };

  const handlePrevExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1);
    }
  };

  const updateSet = (setId, field, value) => {
    setSetsData(prev => {
      const exSets = [...prev[currentRx.id]];
      const setIdx = exSets.findIndex(s => s.id === setId);
      exSets[setIdx] = { ...exSets[setIdx], [field]: value };
      return { ...prev, [currentRx.id]: exSets };
    });
  };

  const toggleSet = (setId) => {
    setSetsData(prev => {
      const exSets = [...prev[currentRx.id]];
      const setIdx = exSets.findIndex(s => s.id === setId);
      exSets[setIdx] = { ...exSets[setIdx], done: !exSets[setIdx].done };
      return { ...prev, [currentRx.id]: exSets };
    });
  };

  const handleFinishWorkout = async () => {
    if (!user) return;
    setIsFinishing(true);
    
    try {
      let totalVolume = 0;
      const setsToInsert = [];

      // Recopilar todas las series completadas
      Object.keys(setsData).forEach(rxId => {
        const rx = exercises.find(e => e.id === rxId);
        if (!rx) return;
        
        setsData[rxId].forEach(set => {
          if (set.done) {
            const kg = parseFloat(set.kg) || 0;
            const reps = parseInt(set.reps) || 0;
            totalVolume += kg * reps;
            
            setsToInsert.push({
              exercise_id: rx.exercises.id,
              weight_kg: kg,
              reps: reps,
              is_pr: false
            });
          }
        });
      });

      const endedAt = new Date().toISOString();
      const startedAt = new Date(activeWorkout.startTime).toISOString();

      // 1. Guardar sesión
      const { data: sessionData, error: sessionError } = await supabase
        .from('workout_sessions')
        .insert({
          user_id: user.id,
          routine_id: activeWorkout.id,
          started_at: startedAt,
          ended_at: endedAt,
          total_volume_kg: totalVolume
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // 2. Guardar series si hay alguna completada
      if (setsToInsert.length > 0) {
        const finalSets = setsToInsert.map(s => ({ ...s, session_id: sessionData.id }));
        const { error: setsError } = await supabase.from('workout_sets').insert(finalSets);
        if (setsError) throw setsError;
      }

      finishWorkout();
      navigate('/workouts/summary'); // En el futuro implementar un resumen real

    } catch (error) {
      console.error("Error al guardar sesión:", error);
    } finally {
      setIsFinishing(false);
    }
  };

  const currentSets = setsData[currentRx.id] || [];

  return (
    <div className="flex flex-col min-h-screen">
      <header className="p-6 pb-2 pt-10 flex justify-between items-center bg-surface-1 border-b border-surface-2 sticky top-0 z-10">
        <div>
          <h2 className="text-xs text-primary font-bold uppercase tracking-wider">Entrenando</h2>
          <h1 className="text-xl font-bold truncate max-w-[180px]">{activeWorkout.title}</h1>
        </div>
        <div className="text-right">
          <p className="text-2xl font-mono font-bold">{formatTime(elapsed)}</p>
          <button 
            className="text-xs text-error font-bold" 
            onClick={handleFinishWorkout}
            disabled={isFinishing}
          >
            {isFinishing ? 'GUARDANDO...' : 'TERMINAR'}
          </button>
        </div>
      </header>

      <div className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <button onClick={handlePrevExercise} className={`p-2 bg-surface-1 rounded-full ${currentExerciseIndex === 0 ? 'opacity-30' : ''}`} disabled={currentExerciseIndex === 0}>
            <ChevronLeft size={24}/>
          </button>
          <div className="text-center flex-1 mx-2">
            <h3 className="font-extrabold text-2xl leading-tight">{currentRx.exercises.name}</h3>
            <p className="text-gray-400 text-sm mt-1">Ejercicio {currentExerciseIndex + 1} de {exercises.length}</p>
          </div>
          <button onClick={handleNextExercise} className={`p-2 bg-surface-1 rounded-full ${currentExerciseIndex === exercises.length - 1 ? 'opacity-30' : ''}`} disabled={currentExerciseIndex === exercises.length - 1}>
            <ChevronRight size={24}/>
          </button>
        </div>

        <Card className="aspect-video mb-8 flex items-center justify-center bg-surface-2 overflow-hidden relative border border-surface-2">
          {currentRx.exercises.gif_url ? (
            <img src={currentRx.exercises.gif_url} className="w-full h-full object-cover bg-white" alt={currentRx.exercises.name} />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-surface-1 text-gray-500 text-sm">
              Imagen no disponible
            </div>
          )}
        </Card>

        <div className="space-y-3 pb-24">
          <div className="flex text-xs font-bold text-gray-500 uppercase px-4 mb-2">
            <span className="w-12">Set</span>
            <span className="flex-1 text-center">kg</span>
            <span className="flex-1 text-center">Reps</span>
            <span className="w-12 text-center">Check</span>
          </div>

          {currentSets.map((set, i) => (
            <Card key={set.id} className={`flex items-center px-4 py-2 ${set.done ? 'bg-primary/5 border-primary/30' : ''}`} padding="">
              <span className="w-12 font-bold text-gray-400">{i + 1}</span>
              
              <div className="flex-1 flex justify-center">
                <input 
                  type="number" 
                  value={set.kg === 0 ? '' : set.kg} 
                  placeholder="0"
                  onChange={(e) => updateSet(set.id, 'kg', e.target.value)}
                  className={`w-16 bg-transparent text-center font-bold text-xl focus:outline-none placeholder-gray-600 ${set.done ? 'text-primary' : 'text-white'}`} 
                />
              </div>
              
              <div className="flex-1 flex justify-center">
                <input 
                  type="number" 
                  value={set.reps} 
                  onChange={(e) => updateSet(set.id, 'reps', e.target.value)}
                  className={`w-16 bg-transparent text-center font-bold text-xl focus:outline-none ${set.done ? 'text-primary' : 'text-white'}`} 
                />
              </div>
              
              <div className="w-12 flex justify-center">
                <button 
                  onClick={() => toggleSet(set.id)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${set.done ? 'bg-primary text-surface-0 shadow-glow' : 'bg-surface-2 text-surface-2'}`}
                >
                  <Check size={20} className={set.done ? 'opacity-100' : 'opacity-0'} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
