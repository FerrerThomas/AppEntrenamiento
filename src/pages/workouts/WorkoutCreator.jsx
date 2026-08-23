import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { Dumbbell, Search, Info, Check, GripVertical, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../store/useAppStore';

export default function WorkoutCreator() {
  const navigate = useNavigate();
  const user = useAppStore((state) => state.user);
  const fetchWorkouts = useAppStore((state) => state.fetchWorkouts);
  
  const [title, setTitle] = useState('');
  const [selectedExercises, setSelectedExercises] = useState([]);
  
  // Modal state
  const [dbExercises, setDbExercises] = useState([]);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [draftSelected, setDraftSelected] = useState([]); // Exercises selected in the modal before adding
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchExercises = async () => {
      const { data } = await supabase.from('exercises').select('*').order('name');
      if (data) setDbExercises(data);
    };
    fetchExercises();
  }, []);

  const openModal = () => {
    setDraftSelected([]);
    setSearchQuery('');
    setShowExerciseModal(true);
  };

  const toggleDraftSelection = (exercise) => {
    if (draftSelected.find(e => e.id === exercise.id)) {
      setDraftSelected(draftSelected.filter(e => e.id !== exercise.id));
    } else {
      setDraftSelected([...draftSelected, exercise]);
    }
  };

  const confirmAddExercises = () => {
    const newExercises = draftSelected.map(ex => ({ 
      ...ex, 
      sets: [
        { id: Math.random().toString(36).substr(2, 9), weight: '', reps: '' }
      ] 
    }));
    setSelectedExercises([...selectedExercises, ...newExercises]);
    setShowExerciseModal(false);
  };

  const handleRemoveExercise = (index) => {
    setSelectedExercises(selectedExercises.filter((_, i) => i !== index));
  };

  const addSet = (exerciseIndex) => {
    const newExercises = [...selectedExercises];
    const newSet = { id: Math.random().toString(36).substr(2, 9), weight: '', reps: '' };
    
    // Si hay una serie anterior, copiamos sus valores por comodidad
    const prevSets = newExercises[exerciseIndex].sets;
    if (prevSets.length > 0) {
      const lastSet = prevSets[prevSets.length - 1];
      newSet.weight = lastSet.weight;
      newSet.reps = lastSet.reps;
    }
    
    newExercises[exerciseIndex].sets.push(newSet);
    setSelectedExercises(newExercises);
  };

  const updateSet = (exerciseIndex, setIndex, field, value) => {
    const newExercises = [...selectedExercises];
    newExercises[exerciseIndex].sets[setIndex][field] = value;
    setSelectedExercises(newExercises);
  };

  const handleSaveRoutine = async () => {
    if (!user || selectedExercises.length === 0) return;
    setIsSaving(true);
    try {
      const finalTitle = title.trim() || 'Rutina sin título';
      const { data: routineData, error: routineError } = await supabase
        .from('routines')
        .insert({ user_id: user.id, title: finalTitle, type: 'Fuerza', duration_minutes: selectedExercises.length * 10 })
        .select()
        .single();

      if (routineError) throw routineError;

      const routineExercisesToInsert = selectedExercises.map((ex, idx) => ({
        routine_id: routineData.id,
        exercise_id: ex.id,
        order_index: idx
      }));

      const { data: insertedExercises, error: exercisesError } = await supabase
        .from('routine_exercises')
        .insert(routineExercisesToInsert)
        .select();

      if (exercisesError) throw exercisesError;

      const setsToInsert = [];
      selectedExercises.forEach((ex, idx) => {
        // Encontramos el ID recién creado de este ejercicio en la rutina
        const insertedEx = insertedExercises.find(ie => ie.exercise_id === ex.id && ie.order_index === idx);
        if (insertedEx) {
          ex.sets.forEach((set, setIndex) => {
            setsToInsert.push({
              routine_exercise_id: insertedEx.id,
              set_order: setIndex,
              target_weight_kg: parseFloat(set.weight) || 0,
              target_reps: parseInt(set.reps) || 0
            });
          });
        }
      });

      if (setsToInsert.length > 0) {
        const { error: setsError } = await supabase.from('routine_sets').insert(setsToInsert);
        if (setsError) throw setsError;
      }

      await fetchWorkouts();
      navigate('/workouts');
    } catch (error) {
      console.error('Error saving routine:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredDbExercises = dbExercises.filter(ex => ex.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0a] text-white">
      {/* Top Header */}
      <header className="flex items-center justify-between p-4 pt-6 border-b border-surface-2 bg-[#0a0a0a] sticky top-0 z-20">
        <div className="w-24 text-left">
          <button onClick={() => navigate(-1)} className="text-primary text-[17px] font-medium">
            Cancelar
          </button>
        </div>
        <h1 className="text-[17px] font-bold flex-1 text-center">Crear Rutina</h1>
        <div className="w-24 flex justify-end">
          <button 
            onClick={handleSaveRoutine}
            disabled={isSaving || selectedExercises.length === 0}
            className={`px-4 py-1.5 rounded-full font-bold text-sm transition-colors ${selectedExercises.length > 0 ? 'bg-primary text-surface-0' : 'bg-[#2c2c2e] text-gray-500'}`}
          >
            {isSaving ? '...' : 'Guardar'}
          </button>
        </div>
      </header>

      <div className="p-4 flex-1 flex flex-col relative">
        <div className="relative z-10 bg-[#0a0a0a] pb-2">
          <input 
            type="text" 
            placeholder="Título de la Rutina" 
            className="bg-transparent border-b border-surface-2 text-[22px] font-bold pb-3 focus:outline-none w-full placeholder-gray-500 mb-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {selectedExercises.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <Dumbbell size={48} className="text-gray-500 mb-4" strokeWidth={1} />
            <p className="text-gray-400 text-[15px] mb-6">Empieza agregando un ejercicio a tu rutina.</p>
            <Button className="w-full max-w-sm" onClick={openModal}>
              + Agregar ejercicio
            </Button>
          </div>
        ) : (
          <div className="flex-1 space-y-4 mb-6">
            {selectedExercises.map((ex, exIndex) => (
              <div key={exIndex} className="bg-[#1c1c1e] p-3 rounded-xl">
                {/* Cabecera del Ejercicio */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    {ex.gif_url ? (
                      <img src={ex.gif_url} alt={ex.name} className="w-10 h-10 rounded-full object-cover bg-white" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center text-[10px] text-gray-500">Img</div>
                    )}
                    <h4 className="font-bold text-primary text-[15px]">{ex.name}</h4>
                  </div>
                  <button onClick={() => handleRemoveExercise(exIndex)} className="text-gray-500 hover:text-white p-1">
                    <Trash2 size={20} />
                  </button>
                </div>
                
                {/* Subtítulos */}
                <p className="text-gray-500 text-sm mb-2">Agregar notas de rutina aquí</p>
                <p className="text-primary text-sm font-medium flex items-center mb-4">
                  <span className="mr-1">⏱</span> Descanso: APAGADO
                </p>

                {/* Tabla de Series */}
                <div className="space-y-2 mb-3">
                  <div className="flex text-xs text-gray-400 font-bold uppercase px-2">
                    <div className="w-12 text-center">Serie</div>
                    <div className="flex-1 text-center">KG</div>
                    <div className="flex-1 text-center">Reps</div>
                  </div>
                  
                  {ex.sets.map((set, setIndex) => (
                    <div key={set.id} className="flex space-x-2 items-center">
                      <div className="w-12 h-10 bg-surface-2 rounded-lg flex items-center justify-center font-bold text-sm">
                        {setIndex + 1}
                      </div>
                      <div className="flex-1">
                        <input
                          type="number"
                          placeholder="-"
                          value={set.weight}
                          onChange={(e) => updateSet(exIndex, setIndex, 'weight', e.target.value)}
                          className="w-full h-10 bg-[#0a0a0a] rounded-lg text-center font-bold focus:outline-none focus:ring-1 focus:ring-primary placeholder-gray-600"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="number"
                          placeholder="-"
                          value={set.reps}
                          onChange={(e) => updateSet(exIndex, setIndex, 'reps', e.target.value)}
                          className="w-full h-10 bg-[#0a0a0a] rounded-lg text-center font-bold focus:outline-none focus:ring-1 focus:ring-primary placeholder-gray-600"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => addSet(exIndex)}
                  className="w-full bg-surface-2 hover:bg-[#3c3c3e] transition-colors rounded-lg py-2 text-sm font-bold text-white flex justify-center items-center"
                >
                  + Agregar Serie
                </button>
              </div>
            ))}
            
            <Button className="w-full mt-4" variant="outline" onClick={openModal}>
              + Agregar ejercicio
            </Button>
          </div>
        )}
      </div>

      {/* Modal Agregar Ejercicio */}
      {showExerciseModal && (
        <div className="fixed inset-0 bg-[#0a0a0a] z-50 flex flex-col animate-in slide-in-from-bottom-full duration-200">
          <header className="flex items-center justify-between p-4 pt-6 bg-[#0a0a0a] sticky top-0 z-10 border-b border-surface-2">
            <div className="w-24 text-left">
              <button onClick={() => setShowExerciseModal(false)} className="text-primary text-[17px] font-medium">
                Cancelar
              </button>
            </div>
            <h2 className="text-[17px] font-bold flex-1 text-center">Agregar Ejercicio</h2>
            <div className="w-24 flex justify-end">
              <button className="text-primary text-[17px] font-medium">
                Crear
              </button>
            </div>
          </header>
          
          <div className="p-4 bg-[#0a0a0a] sticky top-[65px] z-10">
            <div className="bg-[#1c1c1e] rounded-xl flex items-center px-3 py-2 mb-3">
              <Search size={20} className="text-gray-500 mr-2" />
              <input 
                type="text" 
                placeholder="Buscar ejercicio" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-transparent border-none text-white focus:outline-none w-full text-[17px]"
              />
            </div>
            
            <div className="flex space-x-2">
              <button className="bg-[#1c1c1e] px-4 py-2 rounded-lg text-sm font-medium flex-1 text-center truncate">
                Todo el Equipamiento
              </button>
              <button className="bg-[#1c1c1e] px-4 py-2 rounded-lg text-sm font-medium flex-1 text-center truncate">
                Todos los Músculos
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pb-32">
            <div className="px-4 py-2 text-[13px] text-gray-500 uppercase tracking-wide font-medium">
              Todos los Ejercicios
            </div>
            
            {filteredDbExercises.map(ex => {
              const isSelected = draftSelected.some(d => d.id === ex.id);
              return (
                <div 
                  key={ex.id} 
                  onClick={() => toggleDraftSelection(ex)}
                  className={`px-4 py-3 cursor-pointer flex items-center justify-between border-b border-surface-2 transition-colors ${isSelected ? 'bg-primary/20' : 'hover:bg-[#1c1c1e]'}`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      {ex.gif_url ? (
                        <img src={ex.gif_url} alt={ex.name} className="w-14 h-14 rounded-full object-cover bg-white" />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-surface-2 flex items-center justify-center text-[10px] text-gray-500 text-center">Sin imagen</div>
                      )}
                      
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 bg-primary rounded-full p-0.5 border-2 border-[#0a0a0a]">
                          <Check size={12} className="text-surface-0" strokeWidth={4} />
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <p className="font-semibold text-[17px]">{ex.name}</p>
                      <p className="text-[13px] text-gray-400 mt-0.5">{ex.muscle_group}</p>
                    </div>
                  </div>
                  
                  <button className="w-6 h-6 rounded-full bg-[#1c1c1e] flex items-center justify-center text-gray-400">
                    <Info size={14} />
                  </button>
                </div>
              );
            })}
            
            {filteredDbExercises.length === 0 && (
              <p className="text-gray-500 text-center mt-10 text-[15px]">No se encontraron ejercicios.</p>
            )}
          </div>

          {/* Sticky Add Button */}
          {draftSelected.length > 0 && (
            <div className="fixed bottom-0 left-0 right-0 p-4 pb-8 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/90 to-transparent">
              <div className="max-w-md mx-auto">
                <Button className="w-full py-4 text-[17px]" onClick={confirmAddExercises}>
                  Agrega {draftSelected.length} {draftSelected.length === 1 ? 'ejercicio' : 'ejercicios'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
