import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Check, MoreVertical, Timer, Activity, Trash2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { supabase } from '../../lib/supabase';

export default function ActiveWorkout() {
  const navigate = useNavigate();
  const user = useAppStore((state) => state.user);
  const activeWorkout = useAppStore((state) => state.activeWorkout);
  const finishWorkout = useAppStore((state) => state.finishWorkout);
  const cancelWorkout = useAppStore((state) => state.cancelWorkout);
  const getPreviousWorkout = useAppStore((state) => state.getPreviousWorkout);
  const getCurrentPRs = useAppStore((state) => state.getCurrentPRs);
  const currentPRs = useAppStore((state) => state.currentPRs);

  const setsData = useAppStore((state) => state.activeWorkoutSets) || {};
  const setSetsData = useAppStore((state) => state.setActiveWorkoutSets);

  const [previousData, setPreviousData] = useState({});
  const [localPRs, setLocalPRs] = useState({});
  const [isFinishing, setIsFinishing] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [elapsed, setElapsed] = useState(0);

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

      if (!isAlreadyInitialized) {
        await getCurrentPRs();
      }

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

        const exId = rx.exercises?.id || rx.exercise_id;
        const history = exId ? await getPreviousWorkout(exId) : [];
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
      const exSets = [...(prev[rxId] || [])];
      const setIdx = exSets.findIndex(s => s.id === setId);
      if (setIdx === -1) return prev;
      exSets[setIdx] = { ...exSets[setIdx], [field]: value };
      return { ...prev, [rxId]: exSets };
    });
  };

  const removeSet = (rxId, setId) => {
    setSetsData(prev => {
      const exSets = (prev[rxId] || []).filter(s => s.id !== setId);
      return { ...prev, [rxId]: exSets };
    });
  };

  const toggleSet = (rxId, setId, exerciseId, exerciseName, imgUrl) => {
    setSetsData(prev => {
      const exSets = [...(prev[rxId] || [])];
      const setIdx = exSets.findIndex(s => s.id === setId);
      if (setIdx === -1) return prev;
      const isNowDone = !exSets[setIdx].done;

      let newKg = exSets[setIdx].kg;
      let newReps = exSets[setIdx].reps;

      if (isNowDone) {
        if (newKg === '' || newKg === null || newKg === undefined) {
          newKg = exSets[setIdx].targetKg != null ? String(exSets[setIdx].targetKg) : '0';
        }
        if (newReps === '' || newReps === null || newReps === undefined) {
          newReps = exSets[setIdx].targetReps != null ? String(exSets[setIdx].targetReps) : '10';
        }
      }

      const weightFloat = parseFloat(newKg) || 0;
      const repsInt = parseInt(newReps) || 0;
      const setVolume = weightFloat * repsInt;
      const set1RM = weightFloat * (1.0 + (repsInt / 30.0));

      let isPR = false;
      let prMessage = '';

      if (isNowDone && weightFloat > 0) {
        const prevPR = currentPRs.find(pr => pr.exercise_id === exerciseId);
        const maxVol = prevPR ? parseFloat(prevPR.max_volume) : 0;
        const max1rm = prevPR ? parseFloat(prevPR.max_1rm) : 0;
        const localBestVol = localPRs[`${exerciseId}_vol`] || 0;
        const localBest1rm = localPRs[`${exerciseId}_1rm`] || 0;

        if (maxVol > 0 && setVolume > maxVol && setVolume > localBestVol) {
          isPR = true;
          prMessage = `¡Nuevo récord de volumen! ${setVolume} kg`;
          setLocalPRs(l => ({ ...l, [`${exerciseId}_vol`]: setVolume }));
        }
        else if (max1rm > 0 && set1RM > max1rm && set1RM > localBest1rm) {
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
        isPR: isNowDone ? isPR : false
      };

      if (isNowDone && isPR) {
        showToast(exerciseName, prMessage, imgUrl);
      }

      return { ...prev, [rxId]: exSets };
    });
  };

  const addSet = (rxId) => {
    setSetsData(prev => {
      const exSets = [...(prev[rxId] || [])];
      const newSet = { 
        id: Math.random().toString(), 
        kg: '', 
        reps: '', 
        targetKg: 0,
        targetReps: 10,
        done: false, 
        isPR: false 
      };

      if (exSets.length > 0) {
        const lastSet = exSets[exSets.length - 1];
        newSet.targetKg = lastSet.targetKg || (lastSet.kg ? parseFloat(lastSet.kg) : 0);
        newSet.targetReps = lastSet.targetReps || (lastSet.reps ? parseInt(lastSet.reps) : 10);
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

        (setsData[rxId] || []).forEach(set => {
          if (set.done) {
            const exName = rx.exercises?.name || 'Ejercicio';
            const exId = rx.exercises?.id || rx.exercise_id;
            exercisesDone.add(exName);
            const kg = parseFloat(set.kg) || 0;
            const reps = parseInt(set.reps) || 0;
            const setVolume = kg * reps;
            const set1RM = kg * (1.0 + (reps / 30.0));

            const prevPR = currentPRs.find(pr => pr.exercise_id === exId);
            const maxVol = prevPR ? parseFloat(prevPR.max_volume) : 0;
            const max1rm = prevPR ? parseFloat(prevPR.max_1rm) : 0;

            const isGenuinePR = (maxVol > 0 && setVolume > maxVol) || (max1rm > 0 && set1RM > max1rm);

            totalVolume += setVolume;
            if (isGenuinePR) prsBroken++;

            if (exId) {
              setsToInsert.push({
                exercise_id: exId,
                weight_kg: kg,
                reps: reps,
                is_pr: isGenuinePR
              });
            }
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

  let totalVolume = 0;
  let totalSets = 0;
  let completedSets = 0;

  Object.values(setsData).forEach(exSets => {
    exSets.forEach(set => {
      totalSets++;
      if (set.done) {
        completedSets++;
        totalVolume += (parseFloat(set.kg) || 0) * (parseInt(set.reps) || 0);
      }
    });
  });

  return (
    <div className="bg-[#0a0a0a] min-h-screen text-white font-sans p-4 pb-32">
      {toast && (
        <div className="fixed top-6 left-4 right-4 z-50 flex justify-center animate-in slide-in-from-top-full duration-300">
          <div className="bg-[#1c1c1e] border border-primary/40 rounded-2xl p-4 shadow-2xl flex items-center space-x-4 max-w-sm w-full">
            {toast.imgUrl ? (
              <img src={toast.imgUrl} alt="PR" className="w-12 h-12 rounded-full object-cover bg-white shrink-0 border border-primary" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-2xl shrink-0">
                🏆
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-white text-sm truncate">{toast.title}</h4>
              <p className="text-primary text-xs font-semibold">{toast.message}</p>
            </div>
          </div>
        </div>
      )}

      <header className="sticky top-0 bg-[#0a0a0a]/90 backdrop-blur-md pt-2 pb-4 z-10 flex justify-between items-center border-b border-surface-2">
        <div className="flex items-center space-x-2">
          <button onClick={() => navigate('/workouts')} className="text-gray-400 p-1 hover:text-white transition-colors">
            <ChevronDown size={24} />
          </button>
          <div>
            <h1 className="font-bold text-lg leading-tight">{activeWorkout.title}</h1>
            <p className="text-gray-400 text-xs">Entrenamiento Activo</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Botón Cancelar/Eliminar Sesión */}
          <button
            type="button"
            onClick={() => setShowCancelConfirm(true)}
            className="p-2.5 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors border border-red-500/20 active:scale-95 flex items-center justify-center shadow-sm"
            title="Cancelar entrenamiento"
          >
            <Trash2 size={18} />
          </button>

          {/* Botón Terminar */}
          <button
            type="button"
            onClick={handleFinishWorkout}
            disabled={isFinishing}
            className="bg-primary text-surface-0 font-bold px-5 py-2.5 rounded-full text-sm hover:opacity-90 transition-opacity active:scale-95 shadow-[0_0_12px_rgba(204,255,0,0.3)]"
          >
            {isFinishing ? 'Guardando...' : 'Terminar'}
          </button>
        </div>
      </header>

      {/* Modal de Confirmación de Cancelación */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#18181a] border border-red-500/30 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
              <Trash2 size={28} />
            </div>

            <div>
              <h4 className="text-lg font-black text-white">¿Cancelar entrenamiento?</h4>
              <p className="text-xs text-gray-300 mt-1.5 leading-relaxed">
                Se descartarán todas las series y kilos registrados en esta sesión.
              </p>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 py-3 rounded-xl bg-surface-2 text-white font-bold text-xs hover:bg-surface-2/80 transition-colors"
              >
                Continuar
              </button>
              <button
                type="button"
                onClick={() => {
                  cancelWorkout();
                  navigate('/workouts');
                }}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white font-black text-xs hover:bg-red-700 transition-colors shadow-lg"
              >
                Sí, cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center py-4 border-b border-surface-2 mb-4 text-center">
        <div>
          <p className="text-xs text-gray-500 font-medium">TIEMPO</p>
          <p className="font-bold text-lg text-primary">{formatTime(elapsed)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 font-medium">VOLUMEN</p>
          <p className="font-bold text-lg">{totalVolume} kg</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 font-medium">SERIES</p>
          <p className="font-bold text-lg">{completedSets}/{totalSets}</p>
        </div>
      </div>

      <div className="space-y-6">
        {exercises.map((rx, exIndex) => {
          const exSets = setsData[rx.id] || [];

          return (
            <div key={rx.id} className="bg-[#1c1c1e] rounded-2xl p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {rx.exercises?.gif_url ? (
                      <img src={rx.exercises.gif_url} alt={rx.exercises.name} className="w-12 h-12 rounded-full object-cover bg-white" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center text-gray-400">
                        <Activity size={24} />
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-primary text-[17px]">{rx.exercises?.name}</h3>
                      <p className="text-xs text-gray-400">{rx.exercises?.muscle_group}</p>
                    </div>
                  </div>

                  <button className="text-gray-400 hover:text-white p-1">
                    <MoreVertical size={20} />
                  </button>
                </div>

                <p className="text-gray-500 text-sm mb-3">Agregar notas aquí...</p>
                <p className="text-primary text-sm font-medium flex items-center mb-4">
                  <Timer size={16} className="mr-1" /> Descanso: APAGADO
                </p>

                <div className="space-y-1 mb-4">
                  <div className="flex items-center text-[11px] text-gray-500 font-bold tracking-wider mb-2">
                    <div className="w-10 text-center">SERIE</div>
                    <div className="flex-1 text-center">ANTERIOR</div>
                    <div className="flex-1 text-center">KG</div>
                    <div className="flex-1 text-center">REPS</div>
                    <div className="w-10 flex justify-center"><Check size={16} /></div>
                    <div className="w-8 flex justify-center"></div>
                  </div>

                  {exSets.map((set, setIndex) => {
                    const prevSet = previousData[rx.id] && previousData[rx.id][setIndex];
                    const prevText = prevSet ? `${prevSet.weight_kg}kg x ${prevSet.reps}` : '-';

                    const targetKgPlaceholder = set.targetKg ? `${set.targetKg}` : '-';
                    const targetRepsPlaceholder = set.targetReps ? `${set.targetReps}` : '10';

                    return (
                      <div
                        key={set.id}
                        className={`flex items-center py-1 transition-colors rounded-lg ${set.done ? 'bg-primary/20 -mx-2 px-2' : ''}`}
                      >
                        <div className="w-10 flex justify-center">
                          {set.isPR ? (
                            <div className="w-7 h-7 rounded-lg bg-yellow-500/20 flex items-center justify-center text-yellow-500 text-base">🏆</div>
                          ) : (
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${set.done ? 'bg-transparent text-primary' : 'bg-surface-2 text-gray-400'}`}>
                              {setIndex + 1}
                            </div>
                          )}
                        </div>

                        <div className="flex-1 text-center text-gray-500 font-medium text-xs truncate px-1">
                          {prevText}
                        </div>

                        <div className="flex-1 flex justify-center px-1">
                          <input
                            type="number"
                            placeholder={targetKgPlaceholder}
                            value={set.kg}
                            onChange={(e) => updateSet(rx.id, set.id, 'kg', e.target.value)}
                            className={`w-full h-9 rounded-lg text-center font-bold focus:outline-none placeholder:text-gray-500 placeholder:font-semibold text-sm ${set.done ? 'bg-transparent text-white' : 'bg-[#141416] text-white border border-surface-2/60 focus:border-primary'}`}
                          />
                        </div>

                        <div className="flex-1 flex justify-center px-1">
                          <input
                            type="number"
                            placeholder={targetRepsPlaceholder}
                            value={set.reps}
                            onChange={(e) => updateSet(rx.id, set.id, 'reps', e.target.value)}
                            className={`w-full h-9 rounded-lg text-center font-bold focus:outline-none placeholder:text-gray-500 placeholder:font-semibold text-sm ${set.done ? 'bg-transparent text-white' : 'bg-[#141416] text-white border border-surface-2/60 focus:border-primary'}`}
                          />
                        </div>

                        <div className="w-10 flex justify-center">
                          <button
                            onClick={() => toggleSet(rx.id, set.id, rx.exercises?.id, rx.exercises?.name, rx.exercises?.gif_url)}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${set.done ? 'bg-primary text-surface-0 shadow-sm' : 'bg-[#141416] text-gray-500 border border-surface-2/60 hover:border-gray-400'}`}
                          >
                            <Check size={16} strokeWidth={3} className={set.done ? 'opacity-100' : 'opacity-0'} />
                          </button>
                        </div>

                        <div className="w-8 flex justify-center">
                          <button
                            onClick={() => removeSet(rx.id, set.id)}
                            className="text-gray-600 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                            title="Eliminar serie"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={() => addSet(rx.id)}
                  className="w-full bg-[#141416] hover:bg-[#2c2c2e] border border-surface-2/60 transition-colors rounded-xl py-3 text-[14px] font-medium text-white flex justify-center items-center"
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
