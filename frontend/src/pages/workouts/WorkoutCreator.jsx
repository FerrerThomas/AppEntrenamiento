import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { ChevronLeft, Plus, GripVertical, Trash2, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../store/useAppStore';

export default function WorkoutCreator() {
  const navigate = useNavigate();
  const user = useAppStore((state) => state.user);
  const fetchWorkouts = useAppStore((state) => state.fetchWorkouts);
  
  const [title, setTitle] = useState('Nueva Rutina');
  const [selectedExercises, setSelectedExercises] = useState([]);
  
  const [dbExercises, setDbExercises] = useState([]);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchExercises = async () => {
      const { data } = await supabase.from('exercises').select('*').order('name');
      if (data) setDbExercises(data);
    };
    fetchExercises();
  }, []);

  const handleAddExercise = (exercise) => {
    setSelectedExercises([...selectedExercises, { ...exercise, sets: 3, reps: 10 }]);
    setShowExerciseModal(false);
  };

  const handleRemoveExercise = (index) => {
    setSelectedExercises(selectedExercises.filter((_, i) => i !== index));
  };

  const updateExercise = (index, field, value) => {
    const newValue = Math.max(1, value);
    const newExercises = [...selectedExercises];
    newExercises[index][field] = newValue;
    setSelectedExercises(newExercises);
  };

  const handleSaveRoutine = async () => {
    if (!user || selectedExercises.length === 0) return;
    setIsSaving(true);
    try {
      // 1. Insertar Rutina
      const { data: routineData, error: routineError } = await supabase
        .from('routines')
        .insert({ user_id: user.id, title, type: 'Fuerza', duration_minutes: selectedExercises.length * 10 })
        .select()
        .single();

      if (routineError) throw routineError;

      // 2. Insertar Ejercicios de la Rutina
      const routineExercisesToInsert = selectedExercises.map((ex, idx) => ({
        routine_id: routineData.id,
        exercise_id: ex.id,
        sets: ex.sets,
        reps: ex.reps,
        order_index: idx
      }));

      const { error: exercisesError } = await supabase.from('routine_exercises').insert(routineExercisesToInsert);
      if (exercisesError) throw exercisesError;

      // Actualizar listado global y volver
      await fetchWorkouts();
      navigate('/workouts');
    } catch (error) {
      console.error('Error saving routine:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen p-6 relative">
      <header className="flex items-center mb-8 pt-4">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-400 hover:text-white">
          <ChevronLeft size={28} />
        </button>
        <input 
          type="text" 
          placeholder="Nombre de la rutina..." 
          className="bg-transparent border-none text-2xl font-bold ml-2 focus:outline-none w-full placeholder-gray-600"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </header>

      <div className="flex-1 space-y-3">
        {selectedExercises.map((ex, i) => (
          <Card key={i} className="flex items-center justify-between p-3">
            <div className="flex items-center space-x-3 w-full">
              <GripVertical size={20} className="text-gray-500 cursor-grab shrink-0" />
              <div className="flex-1">
                <h4 className="font-bold text-sm mb-2">{ex.name}</h4>
                <div className="flex items-center space-x-6">
                  {/* Series */}
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] text-gray-400 font-bold tracking-wider">SERIES</span>
                    <button onClick={() => updateExercise(i, 'sets', ex.sets - 1)} className="w-6 h-6 rounded bg-surface-2 hover:bg-surface-2/80 flex items-center justify-center text-white">-</button>
                    <span className="text-sm font-bold w-4 text-center">{ex.sets}</span>
                    <button onClick={() => updateExercise(i, 'sets', ex.sets + 1)} className="w-6 h-6 rounded bg-surface-2 hover:bg-surface-2/80 flex items-center justify-center text-white">+</button>
                  </div>
                  {/* Reps */}
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] text-gray-400 font-bold tracking-wider">REPS</span>
                    <button onClick={() => updateExercise(i, 'reps', ex.reps - 1)} className="w-6 h-6 rounded bg-surface-2 hover:bg-surface-2/80 flex items-center justify-center text-white">-</button>
                    <span className="text-sm font-bold w-6 text-center">{ex.reps}</span>
                    <button onClick={() => updateExercise(i, 'reps', ex.reps + 1)} className="w-6 h-6 rounded bg-surface-2 hover:bg-surface-2/80 flex items-center justify-center text-white">+</button>
                  </div>
                </div>
              </div>
            </div>
            <button onClick={() => handleRemoveExercise(i)} className="text-gray-500 hover:text-error p-2 shrink-0 self-start">
              <Trash2 size={20} />
            </button>
          </Card>
        ))}

        <button 
          onClick={() => setShowExerciseModal(true)}
          className="w-full border-2 border-dashed border-surface-2 rounded-xl p-4 flex items-center justify-center text-gray-400 hover:text-white hover:border-gray-500 transition-colors mt-4"
        >
          <Plus size={20} className="mr-2" /> Agregar Ejercicio
        </button>
      </div>

      <div className="mt-8">
        <Button 
          className="w-full" 
          size="lg" 
          onClick={handleSaveRoutine}
          disabled={isSaving || selectedExercises.length === 0}
        >
          {isSaving ? 'Guardando...' : 'Guardar Rutina'}
        </Button>
      </div>

      {/* Modal de Ejercicios Simple */}
      {showExerciseModal && (
        <div className="fixed inset-0 bg-black/90 z-50 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6 pt-4">
            <h2 className="text-2xl font-bold">Seleccionar Ejercicio</h2>
            <button onClick={() => setShowExerciseModal(false)} className="p-2 text-gray-400 hover:text-white">
              <X size={28} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-2">
            {dbExercises.map(ex => (
              <div 
                key={ex.id} 
                onClick={() => handleAddExercise(ex)}
                className="p-3 bg-surface-1 border border-surface-2 rounded-xl cursor-pointer hover:border-primary transition-colors flex items-center space-x-4"
              >
                {ex.gif_url ? (
                  <img src={ex.gif_url} alt={ex.name} className="w-16 h-16 rounded-lg object-cover bg-white" />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-surface-2 flex items-center justify-center text-xs text-gray-500">Sin GIF</div>
                )}
                <div>
                  <p className="font-bold">{ex.name}</p>
                  <p className="text-xs text-gray-400">{ex.muscle_group}</p>
                </div>
              </div>
            ))}
            {dbExercises.length === 0 && <p className="text-gray-500 text-center mt-10">Cargando catálogo...</p>}
          </div>
        </div>
      )}
    </div>
  );
}
