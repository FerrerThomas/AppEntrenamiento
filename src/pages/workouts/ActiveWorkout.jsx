import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Check, MoreVertical, Timer, Activity } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { supabase } from '../../lib/supabase';

export default function ActiveWorkout() {
  const navigate = useNavigate();
  const user = useAppStore((state) => state.user);
  const activeWorkout = useAppStore((state) => state.activeWorkout);
  const finishWorkout = useAppStore((state) => state.finishWorkout);
  const getPreviousWorkout = useAppStore((state) => state.getPreviousWorkout);
  const getCurrentPRs = useAppStore((state) => state.getCurrentPRs);
  const currentPRs = useAppStore((state) => state.currentPRs);

  const setsData = useAppStore((state) => state.activeWorkoutSets) || {};
  const setSetsData = useAppStore((state) => state.setActiveWorkoutSets);

  const [previousData, setPreviousData] = useState({}); // Para almacenar la columna "ANTERIOR"
  const [localPRs, setLocalPRs] = useState({}); // PRs superados en la sesión actual para no repetir alertas
  const [isFinishing, setIsFinishing] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  // Toast notification state
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!activeWorkout) {
      navigate('/workouts');
      return;
    }

    const loadInitialData = async () => {
      const initialData = {};
      const prevData = {};

      const isAlreadyInitialized = Object.keys(setsData).length > 0;

      // Cargar PRs del usuario para compararlos en vivo
      if (!isAlreadyInitialized) {
        await getCurrentPRs();
      }

      // Cargar historial en paralelo para todos los ejercicios
      const promises = activeWorkout.routine_exercises?.map(async (rx) => {
        if (!isAlreadyInitialized) {
          const setsArray = [];
          const numSets = rx.sets && Array.isArray(rx.sets) ? rx.sets.length : (rx.sets || 3);

          for (let i = 0; i < numSets; i++) {
            const target = Array.isArray(rx.sets) ? rx.sets[i] : null;
            setsArray.push({
              id: Math.random().toString(),
              kg: '',
              reps: '',
              targetReps: target ? target.target_reps : (rx.reps || 10),
              targetKg: target ? target.target_weight_kg : 0,
              done: false,
              isPR: false
            });
          }
          initialData[rx.id] = setsArray;
        }

        // Cargar historial "ANTERIOR" (siempre)
        const history = await getPreviousWorkout(rx.exercises.id);
        prevData[rx.id] = history;
      });

      if (promises) {
        await Promise.all(promises);
      }

      if (!isAlreadyInitialized) {
        setSetsData(initialData);
      }
      setPreviousData(prevData);
    };

    loadInitialData();

    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - activeWorkout.startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeWorkout, navigate]);

  if (!activeWorkout) return null;

  const exercises = activeWorkout.routine_exercises || [];

  const formatTime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}min ${s}s`;
    return `${s}s`;
  };

  const updateSet = (rxId, setId, field, value) => {
    setSetsData(prev => {
      const exSets = [...prev[rxId]];
      const setIdx = exSets.findIndex(s => s.id === setId);
      exSets[setIdx] = { ...exSets[setIdx], [field]: value };
      return { ...prev, [rxId]: exSets };
    });
  };

  const toggleSet = (rxId, setId, exerciseId, exerciseName, imgUrl) => {
    setSetsData(prev => {
      const exSets = [...prev[rxId]];
      const setIdx = exSets.findIndex(s => s.id === setId);
      const isNowDone = !exSets[setIdx].done;

      let newKg = exSets[setIdx].kg;
      let newReps = exSets[setIdx].reps;

      // Autocompletado si se hace check y está vacío
      if (isNowDone) {
        if (newKg === '') newKg = exSets[setIdx].targetKg || 0;
        if (newReps === '') newReps = exSets[setIdx].targetReps || 10;
      }

      const weightFloat = parseFloat(newKg) || 0;
      const repsInt = parseInt(newReps) || 0;
      const setVolume = weightFloat * repsInt;
      const set1RM = weightFloat * (1.0 + (repsInt / 30.0));

      let isPR = false;
      let prMessage = '';

      if (isNowDone && weightFloat > 0) {
        // Encontrar PR anterior
        const prevPR = currentPRs.find(pr => pr.exercise_id === exerciseId);
        const maxVol = prevPR ? parseFloat(prevPR.max_volume) : 0;
        const max1rm = prevPR ? parseFloat(prevPR.max_1rm) : 0;

        // Verificar si rompió el récord de Volumen
        const localBestVol = localPRs[`${exerciseId}_vol`] || 0;
        const localBest1rm = localPRs[`${exerciseId}_1rm`] || 0;

        if (setVolume > maxVol && setVolume > localBestVol) {
          isPR = true;
          prMessage = `¡Nuevo récord de volumen! ${setVolume} kg`;
          setLocalPRs(l => ({ ...l, [`${exerciseId}_vol`]: setVolume }));
        }
        else if (set1RM > max1rm && set1RM > localBest1rm) {
          isPR = true;
          prMessage = `¡Nuevo 1RM estimado! ${set1RM.toFixed(1)} kg`;
          setLocalPRs(l => ({ ...l, [`${exerciseId}_1rm`]: set1RM }));
        }
      }

      exSets[setIdx] = {
        ...exSets[setIdx],
        kg: newKg,
        reps: newReps,
        done: isNowDone,
        isPR
      };

      if (isNowDone && isPR) {
        showToast(exerciseName, prMessage, imgUrl);
      }

      return { ...prev, [rxId]: exSets };
    });
  };

  const addSet = (rxId) => {
    setSetsData(prev => {
      const exSets = [...prev[rxId]];
      const newSet = { id: Math.random().toString(), kg: '', reps: '', done: false, isPR: false };

      if (exSets.length > 0) {
        const lastSet = exSets[exSets.length - 1];
        newSet.kg = lastSet.kg;
        newSet.reps = lastSet.reps;
      }

      exSets.push(newSet);
      return { ...prev, [rxId]: exSets };
    });
  };

  const showToast = (title, message, imgUrl) => {
    setToast({ title, message, imgUrl });
    setTimeout(() => setToast(null), 4000);
  };

  const handleFinishWorkout = async () => {
    if (!user) return;
    setIsFinishing(true);

    try {
      let totalVolume = 0;
      let prsBroken = 0;
      const setsToInsert = [];
      const exercisesDone = new Set();

      Object.keys(setsData).forEach(rxId => {
        const rx = exercises.find(e => e.id === rxId);
        if (!rx) return;

        setsData[rxId].forEach(set => {
          if (set.done) {
            exercisesDone.add(rx.exercises.name);
            const kg = parseFloat(set.kg) || 0;
            const reps = parseInt(set.reps) || 0;
            totalVolume += kg * reps;

            if (set.isPR) prsBroken++;

            setsToInsert.push({
              exercise_id: rx.exercises.id,
              weight_kg: kg,
              reps: reps,
              is_pr: set.isPR
            });
          }
        });
      });

      const endedAt = new Date().toISOString();
      const startedAt = new Date(activeWorkout.startTime).toISOString();

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

      if (setsToInsert.length > 0) {
        const finalSets = setsToInsert.map(s => ({ ...s, session_id: sessionData.id }));
        const { error: setsError } = await supabase.from('workout_sets').insert(finalSets);
        if (setsError) throw setsError;
      }

      // Preparamos datos para la pantalla de resumen
      const summaryData = {
        title: activeWorkout.title,
        duration: formatTime(elapsed),
        volume: totalVolume,
        prsCount: prsBroken,
        exercisesCount: exercisesDone.size,
        date: new Date().toLocaleDateString()
      };

      finishWorkout(summaryData);
      navigate('/workouts/summary');

    } catch (error) {
      console.error("Error al guardar sesión:", error);
    } finally {
      setIsFinishing(false);
    }
  };

  // Stats calculation
  let totalVolume = 0;
  let completedSets = 0;
  Object.values(setsData).forEach(sets => {
    sets.forEach(s => {
      if (s.done) {
        completedSets++;
        totalVolume += (parseFloat(s.kg) || 0) * (parseInt(s.reps) || 0);
      }
    });
  });

  return (
    <div className="flex flex-col min-h-screen bg-[#000000] text-white">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 left-0 right-0 z-50 flex justify-center px-4 animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="bg-[#1c1c1e] rounded-full p-2 pr-6 flex items-center shadow-lg border border-[#3c3c3e] max-w-sm w-full">
            {toast.imgUrl ? (
              <img src={toast.imgUrl} alt="" className="w-10 h-10 rounded-full object-cover bg-white mr-3" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center mr-3">🏆</div>
            )}
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white">{toast.title}</span>
              <span className="text-xs font-bold text-yellow-500">{toast.message}</span>
            </div>
          </div>
        </div>
      )}

      {/* Top Header */}
      <header className="flex items-center justify-between p-4 pt-6 bg-[#1c1c1e] sticky top-0 z-20">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center text-white mr-3">
            <ChevronDown size={24} />
          </button>
          <h1 className="text-[17px] font-bold">Entreno</h1>
        </div>
        <div className="flex items-center space-x-4">
          <Timer size={24} className="text-gray-400" />
          <button
            onClick={handleFinishWorkout}
            disabled={isFinishing}
            className="px-6 py-2 rounded-full bg-primary text-surface-0 font-bold text-sm"
          >
            {isFinishing ? '...' : 'Terminar'}
          </button>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="flex justify-between items-center p-4 border-b border-[#1c1c1e]">
        <div>
          <p className="text-[11px] text-gray-500 font-bold tracking-wider mb-1">Duración</p>
          <p className="text-primary font-bold">{formatTime(elapsed)}</p>
        </div>
        <div className="text-center">
          <p className="text-[11px] text-gray-500 font-bold tracking-wider mb-1">Volumen</p>
          <p className="font-bold">{totalVolume.toLocaleString()} kg</p>
        </div>
        <div className="text-center">
          <p className="text-[11px] text-gray-500 font-bold tracking-wider mb-1">Series</p>
          <p className="font-bold">{completedSets}</p>
        </div>
        <div>
          <Activity size={28} className="text-gray-400" />
        </div>
      </div>

      {/* Exercise List */}
      <div className="flex-1 pb-24">
        {exercises.map((rx, exIdx) => {
          const exSets = setsData[rx.id] || [];

          return (
            <div key={rx.id} className="pt-6 pb-2 border-b border-[#1c1c1e]">
              <div className="px-4">
                {/* Cabecera del Ejercicio */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {rx.exercises.gif_url ? (
                      <img src={rx.exercises.gif_url} alt={rx.exercises.name} className="w-12 h-12 rounded-full object-cover bg-white" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center text-[10px] text-gray-500">Img</div>
                    )}
                    <h4 className="font-bold text-primary text-[17px]">{rx.exercises.name}</h4>
                  </div>
                  <button className="text-gray-400 hover:text-white p-1">
                    <MoreVertical size={20} />
                  </button>
                </div>

                {/* Subtítulos */}
                <p className="text-gray-500 text-sm mb-3">Agregar notas aquí...</p>
                <p className="text-primary text-sm font-medium flex items-center mb-4">
                  <Timer size={16} className="mr-1" /> Descanso: APAGADO
                </p>

                {/* Tabla de Series */}
                <div className="space-y-1 mb-4">
                  <div className="flex text-[11px] text-gray-500 font-bold tracking-wider mb-2">
                    <div className="w-12 text-center">SERIE</div>
                    <div className="flex-1 text-center">ANTERIOR</div>
                    <div className="flex-1 text-center">KG</div>
                    <div className="flex-1 text-center">REPS</div>
                    <div className="w-12 flex justify-center"><Check size={16} /></div>
                  </div>

                  {exSets.map((set, setIndex) => {
                    const prevSet = previousData[rx.id] && previousData[rx.id][setIndex];
                    const prevText = prevSet ? `${prevSet.weight_kg}kg x ${prevSet.reps}` : '-';

                    return (
                      <div
                        key={set.id}
                        className={`flex items-center py-1 transition-colors ${set.done ? 'bg-primary/20 -mx-4 px-4' : ''}`}
                      >
                        <div className="w-12 flex justify-center">
                          {set.isPR ? (
                            <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center text-yellow-500 text-lg">🏆</div>
                          ) : (
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${set.done ? 'bg-transparent text-primary' : 'bg-surface-2 text-gray-400'}`}>
                              {setIndex + 1}
                            </div>
                          )}
                        </div>

                        <div className="flex-1 text-center text-gray-500 font-medium text-sm">
                          {prevText}
                        </div>

                        <div className="flex-1 flex justify-center px-1">
                          <input
                            type="number"
                            placeholder="-"
                            value={set.kg}
                            onChange={(e) => updateSet(rx.id, set.id, 'kg', e.target.value)}
                            className={`w-full h-9 rounded-lg text-center font-bold focus:outline-none placeholder-gray-600 ${set.done ? 'bg-transparent text-white' : 'bg-[#1c1c1e] text-white'}`}
                          />
                        </div>

                        <div className="flex-1 flex justify-center px-1">
                          <input
                            type="number"
                            placeholder="-"
                            value={set.reps}
                            onChange={(e) => updateSet(rx.id, set.id, 'reps', e.target.value)}
                            className={`w-full h-9 rounded-lg text-center font-bold focus:outline-none placeholder-gray-600 ${set.done ? 'bg-transparent text-white' : 'bg-[#1c1c1e] text-white'}`}
                          />
                        </div>

                        <div className="w-12 flex justify-center">
                          <button
                            onClick={() => toggleSet(rx.id, set.id, rx.exercises.id, rx.exercises.name, rx.exercises.gif_url)}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${set.done ? 'bg-primary text-surface-0' : 'bg-[#1c1c1e] text-gray-500'}`}
                          >
                            <Check size={18} strokeWidth={3} className={set.done ? 'opacity-100' : 'opacity-0'} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={() => addSet(rx.id)}
                  className="w-full bg-[#1c1c1e] hover:bg-[#2c2c2e] transition-colors rounded-xl py-3 text-[15px] font-medium text-white flex justify-center items-center"
                >
                  + Agregar Serie
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
