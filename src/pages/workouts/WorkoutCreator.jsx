import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { Dumbbell, Search, Info, Check, GripVertical, Trash2, Plus, Upload, X, Camera, Pencil } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../store/useAppStore';
import ExerciseLibraryModal from '../../components/workouts/ExerciseLibraryModal';

const MUSCLE_CATEGORIES = [
  'Pecho',
  'Espalda',
  'Piernas',
  'Glúteos',
  'Hombros',
  'Bíceps',
  'Tríceps',
  'Abdomen',
  'Cardio',
  'Cuerpo Completo'
];

const MUSCLE_FILTER_OPTIONS = ['Todos', ...MUSCLE_CATEGORIES];

export default function WorkoutCreator() {
  const navigate = useNavigate();
  const { id: editRoutineId } = useParams();
  const user = useAppStore((state) => state.user);
  const workouts = useAppStore((state) => state.workouts);
  const fetchWorkouts = useAppStore((state) => state.fetchWorkouts);

  const [title, setTitle] = useState('');
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);
  const isInitialMount = useRef(true);

  const DRAFT_KEY = editRoutineId
    ? `ftraining_routine_draft_${editRoutineId}`
    : 'ftraining_routine_draft_new';

  // Modal state (Agregar Ejercicio)
  const [dbExercises, setDbExercises] = useState([]);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState('Todos');
  const [draftSelected, setDraftSelected] = useState([]); // Exercises selected in the modal before adding
  const [isSaving, setIsSaving] = useState(false);

  // Modal state (Crear / Editar Ejercicio)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingExerciseId, setEditingExerciseId] = useState(null);
  const [newExName, setNewExName] = useState('');
  const [newExCategory, setNewExCategory] = useState('Pecho');
  const [newExFile, setNewExFile] = useState(null);
  const [newExPreview, setNewExPreview] = useState(null);
  const [isCreatingExercise, setIsCreatingExercise] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchExercises = async () => {
      const { data } = await supabase.from('exercises').select('*').order('name');
      if (data) setDbExercises(data);
    };
    fetchExercises();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingExerciseId(null);
    setNewExName('');
    setNewExCategory('Pecho');
    setNewExFile(null);
    setNewExPreview(null);
    setShowCreateModal(true);
  };

  const handleOpenEditModal = (ex, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setEditingExerciseId(ex.id);
    setNewExName(ex.name || '');
    setNewExCategory(ex.muscle_group || 'Pecho');
    setNewExFile(null);
    setNewExPreview(ex.gif_url || null);
    setShowCreateModal(true);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewExFile(file);
      setNewExPreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setNewExFile(null);
    setNewExPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCreateOrUpdateCustomExercise = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newExName.trim() || isCreatingExercise) return;

    setIsCreatingExercise(true);
    try {
      let uploadedUrl = newExPreview;

      // 1. Subir imagen si se seleccionó archivo nuevo
      if (newExFile) {
        const fileExt = newExFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
        const filePath = `custom-exercises/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('exercises')
          .upload(filePath, newExFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Error al subir imagen a Supabase Storage:', uploadError);
        } else {
          const { data: publicUrlData } = supabase.storage
            .from('exercises')
            .getPublicUrl(filePath);
          uploadedUrl = publicUrlData?.publicUrl || null;
        }
      }

      if (editingExerciseId) {
        // MODO EDICIÓN: Actualizar el ejercicio existente en la BD
        const { data: updatedExercise, error: updateError } = await supabase
          .from('exercises')
          .update({
            name: newExName.trim(),
            muscle_group: newExCategory,
            gif_url: uploadedUrl
          })
          .eq('id', editingExerciseId)
          .select()
          .single();

        if (updateError) throw updateError;

        // Actualizar estado local
        if (updatedExercise) {
          setDbExercises(prev => prev.map(item => item.id === editingExerciseId ? updatedExercise : item));
          setSelectedExercises(prev => prev.map(item => item.id === editingExerciseId ? {
            ...item,
            name: updatedExercise.name,
            muscle_group: updatedExercise.muscle_group,
            gif_url: updatedExercise.gif_url
          } : item));
          setDraftSelected(prev => prev.map(item => item.id === editingExerciseId ? updatedExercise : item));
          
          // Actualizar store global
          useAppStore.getState().fetchDbExercises(true);
        }
      } else {
        // MODO CREACIÓN: Insertar ejercicio nuevo
        const { data: newExercise, error: insertError } = await supabase
          .from('exercises')
          .insert({
            name: newExName.trim(),
            muscle_group: newExCategory,
            gif_url: uploadedUrl
          })
          .select()
          .single();

        if (insertError) throw insertError;

        if (newExercise) {
          setDbExercises(prev => [newExercise, ...prev]);
          setDraftSelected(prev => [...prev, newExercise]);
          useAppStore.getState().fetchDbExercises(true);
        }
      }

      // Limpiar estado y cerrar modal
      setEditingExerciseId(null);
      setNewExName('');
      setNewExCategory('Pecho');
      handleRemoveImage();
      setShowCreateModal(false);

    } catch (err) {
      console.error('Error al guardar ejercicio:', err);
      alert('Error al guardar el ejercicio: ' + (err.message || 'Inténtalo de nuevo'));
    } finally {
      setIsCreatingExercise(false);
    }
  };

  // Cargar datos de la rutina si estamos en modo edición o restaurar borrador de localStorage
  useEffect(() => {
    try {
      const savedDraftRaw = localStorage.getItem(DRAFT_KEY);
      if (savedDraftRaw) {
        const draft = JSON.parse(savedDraftRaw);
        if (draft && (draft.title || (draft.selectedExercises && draft.selectedExercises.length > 0))) {
          if (draft.title) setTitle(draft.title);
          if (draft.selectedExercises && draft.selectedExercises.length > 0) {
            setSelectedExercises(draft.selectedExercises);
          }
          setHasRestoredDraft(true);
          return;
        }
      }
    } catch (e) {
      console.error('Error loading routine draft from localStorage:', e);
    }

    if (editRoutineId && workouts.length > 0) {
      const existing = workouts.find(w => w.id === editRoutineId);
      if (existing) {
        setTitle(existing.title || '');
        const mappedExercises = (existing.routine_exercises || []).map(rx => ({
          id: rx.exercises?.id,
          name: rx.exercises?.name,
          muscle_group: rx.exercises?.muscle_group,
          gif_url: rx.exercises?.gif_url,
          sets: (rx.sets && rx.sets.length > 0)
            ? rx.sets.map(s => ({
              id: s.id || Math.random().toString(36).substr(2, 9),
              weight: s.target_weight_kg ?? '',
              reps: s.target_reps ?? ''
            }))
            : [{ id: Math.random().toString(36).substr(2, 9), weight: '', reps: '' }]
        }));
        setSelectedExercises(mappedExercises);
      }
    }
  }, [editRoutineId, workouts, DRAFT_KEY]);

  // Guardar automáticamente borrador en localStorage cuando el usuario modifica la rutina
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    try {
      if (title.trim() || selectedExercises.length > 0) {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({
          title,
          selectedExercises,
          updatedAt: Date.now()
        }));
      } else {
        localStorage.removeItem(DRAFT_KEY);
      }
    } catch (e) {
      console.error('Error saving routine draft to localStorage:', e);
    }
  }, [title, selectedExercises, DRAFT_KEY]);

  const openModal = () => {
    setDraftSelected([]);
    setSearchQuery('');
    setSelectedMuscle('Todos');
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

  const handleAddSet = (exerciseIndex) => {
    const updated = [...selectedExercises];
    const targetExercise = updated[exerciseIndex];
    const previousSet = targetExercise.sets[targetExercise.sets.length - 1];

    targetExercise.sets.push({
      id: Math.random().toString(36).substr(2, 9),
      weight: previousSet ? previousSet.weight : '',
      reps: previousSet ? previousSet.reps : ''
    });

    setSelectedExercises(updated);
  };

  const handleRemoveSet = (exerciseIndex, setIndex) => {
    const updated = [...selectedExercises];
    if (updated[exerciseIndex].sets.length > 1) {
      updated[exerciseIndex].sets.splice(setIndex, 1);
      setSelectedExercises(updated);
    }
  };

  const handleSetChange = (exerciseIndex, setIndex, field, value) => {
    const updated = [...selectedExercises];
    updated[exerciseIndex].sets[setIndex][field] = value;
    setSelectedExercises(updated);
  };

  const handleSaveRoutine = async () => {
    if (!title.trim() || selectedExercises.length === 0) return;

    setIsSaving(true);
    try {
      let currentRoutineId = editRoutineId;

      if (editRoutineId) {
        const { error: updateError } = await supabase
          .from('routines')
          .update({ title: title.trim() })
          .eq('id', editRoutineId);

        if (updateError) throw updateError;

        await supabase.from('routine_exercises').delete().eq('routine_id', editRoutineId);
      } else {
        const { data: newRoutine, error: routineError } = await supabase
          .from('routines')
          .insert({
            user_id: user.id,
            title: title.trim()
          })
          .select()
          .single();

        if (routineError) throw routineError;
        currentRoutineId = newRoutine.id;
      }

      const routineExercisesToInsert = selectedExercises.map((ex, idx) => ({
        routine_id: currentRoutineId,
        exercise_id: ex.id,
        order_index: idx
      }));

      const { data: insertedRoutineExercises, error: reError } = await supabase
        .from('routine_exercises')
        .insert(routineExercisesToInsert)
        .select();

      if (reError) throw reError;

      const setsToInsert = [];
      insertedRoutineExercises.forEach((re, idx) => {
        const localEx = selectedExercises[idx];
        if (localEx && localEx.sets) {
          localEx.sets.forEach((s, sIdx) => {
            setsToInsert.push({
              routine_exercise_id: re.id,
              set_order: sIdx + 1,
              target_weight_kg: parseFloat(s.weight) || 0,
              target_reps: parseInt(s.reps, 10) || 0
            });
          });
        }
      });

      if (setsToInsert.length > 0) {
        await supabase.from('routine_sets').insert(setsToInsert);
      }

      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch (e) { }

      await fetchWorkouts();
      navigate('/workouts');
    } catch (error) {
      console.error('Error saving routine:', error);
      alert('Error al guardar la rutina: ' + (error.message || 'Inténtalo de nuevo'));
    } finally {
      setIsSaving(false);
    }
  };

  const filteredDbExercises = dbExercises.filter(ex => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q ||
      ex.name.toLowerCase().includes(q) ||
      (ex.muscle_group && ex.muscle_group.toLowerCase().includes(q));

    const matchesMuscle = selectedMuscle === 'Todos' ||
      (ex.muscle_group && ex.muscle_group.toLowerCase().trim() === selectedMuscle.toLowerCase().trim());

    return matchesSearch && matchesMuscle;
  });

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0a] text-white w-full">
      <header className="border-b border-surface-2 bg-[#0a0a0a] sticky top-0 z-20">
        <div className="max-w-md w-full mx-auto flex items-center justify-between p-4 pt-6">
          <div className="w-24 text-left">
            <button onClick={() => navigate(-1)} className="text-primary text-[17px] font-medium">
              Cancelar
            </button>
          </div>
          <h1 className="text-[17px] font-bold flex-1 text-center truncate">{editRoutineId ? 'Editar Rutina' : 'Crear Rutina'}</h1>
          <div className="w-24 flex justify-end">
            <button
              onClick={handleSaveRoutine}
              disabled={isSaving || selectedExercises.length === 0}
              className={`px-4 py-1.5 rounded-full font-bold text-sm transition-colors ${selectedExercises.length > 0 ? 'bg-primary text-surface-0' : 'bg-[#2c2c2e] text-gray-500'}`}
            >
              {isSaving ? '...' : 'Guardar'}
            </button>
          </div>
        </div>
      </header>

      <div className="p-4 flex-1 flex flex-col w-full max-w-md mx-auto relative pb-28">
        {hasRestoredDraft && (
          <div className="mb-4 px-3.5 py-2 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-between text-xs text-primary animate-in fade-in">
            <span className="font-semibold">⚠️​ Borrador recuperado automáticamente</span>
            <button
              type="button"
              onClick={() => {
                try { localStorage.removeItem(DRAFT_KEY); } catch (e) { }
                setTitle('');
                setSelectedExercises([]);
                setHasRestoredDraft(false);
              }}
              className="font-bold underline hover:text-white ml-2 shrink-0"
            >
              Descartar
            </button>
          </div>
        )}

        <input
          type="text"
          placeholder="Nombre de la Rutina"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="bg-transparent border-none text-2xl font-bold text-white focus:outline-none placeholder-gray-600 mb-6 px-1"
        />

        <div className="space-y-4 mb-6">
          {selectedExercises.map((exercise, exerciseIndex) => (
            <div key={exercise.id || exerciseIndex} className="bg-[#1c1c1e] rounded-2xl p-4 border border-surface-2">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className="cursor-grab text-gray-500 shrink-0">
                    <GripVertical size={20} />
                  </div>
                  {exercise.gif_url ? (
                    <img src={exercise.gif_url} alt={exercise.name} className="w-12 h-12 rounded-full object-cover bg-white shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center text-gray-400 shrink-0">
                      <Dumbbell size={20} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-primary text-[17px] truncate">{exercise.name}</h3>
                    <p className="text-xs text-gray-400 truncate">{exercise.muscle_group || 'General'}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-1 shrink-0 ml-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowExerciseModal(true);
                    }}
                    className="text-gray-500 hover:text-primary p-1.5 rounded-lg hover:bg-surface-2 transition-colors"
                    title="Editar datos del ejercicio"
                  >
                    <Pencil size={17} />
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handleRemoveExercise(exerciseIndex)}
                    className="text-gray-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                    title="Quitar de la rutina"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>

              {/* Series Table Responsiva en Móvil */}
              <div className="space-y-2">
                <div className="grid grid-cols-[36px_1fr_1fr_32px] gap-2 text-xs text-gray-500 font-medium px-2 mb-1.5 items-center">
                  <span className="text-center">SERIE</span>
                  <span className="text-center">KG</span>
                  <span className="text-center">REPS</span>
                  <span></span>
                </div>

                {exercise.sets.map((set, setIndex) => (
                  <div key={set.id || setIndex} className="grid grid-cols-[36px_1fr_1fr_32px] gap-2 items-center bg-surface-0/50 p-2 rounded-xl border border-surface-2/30">
                    <span className="text-center font-bold text-sm text-gray-400">
                      {setIndex + 1}
                    </span>
                    <div className="min-w-0">
                      <input
                        type="number"
                        placeholder="0"
                        value={set.weight}
                        onChange={e => handleSetChange(exerciseIndex, setIndex, 'weight', e.target.value)}
                        className="w-full h-10 bg-[#141416] border border-surface-2/60 rounded-lg text-center font-bold text-sm text-white focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div className="min-w-0">
                      <input
                        type="number"
                        placeholder="0"
                        value={set.reps}
                        onChange={e => handleSetChange(exerciseIndex, setIndex, 'reps', e.target.value)}
                        className="w-full h-10 bg-[#141416] border border-surface-2/60 rounded-lg text-center font-bold text-sm text-white focus:outline-none focus:border-primary"
                      />
                    </div>
                    <button
                      onClick={() => handleRemoveSet(exerciseIndex, setIndex)}
                      className="w-8 h-8 text-gray-600 hover:text-red-400 flex justify-center items-center rounded-lg hover:bg-red-500/10 transition-colors shrink-0"
                      title="Eliminar serie"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}

                <button
                  onClick={() => handleAddSet(exerciseIndex)}
                  className="w-full bg-[#141416] hover:bg-[#2c2c2e] border border-surface-2/60 transition-colors rounded-xl py-2.5 text-xs font-semibold text-white flex justify-center items-center mt-2"
                >
                  + Agregar Serie
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => setShowExerciseModal(true)}
          className="w-full py-4 rounded-2xl bg-[#1c1c1e] border border-surface-2 border-dashed flex items-center justify-center space-x-2 text-primary font-bold text-base hover:bg-[#242426] transition-colors"
        >
          <Plus size={20} />
          <span>Agregar Ejercicio</span>
        </button>
      </div>

      {/* Modal Reutilizable de Biblioteca / Selector / Editor de Ejercicios */}
      <ExerciseLibraryModal
        isOpen={showExerciseModal}
        onClose={() => setShowExerciseModal(false)}
        mode="select"
        onConfirmSelection={confirmAddExercises}
        onExerciseUpdated={(updated) => {
          setSelectedExercises(prev => prev.map(e => e.id === updated.id ? {
            ...e,
            name: updated.name,
            muscle_group: updated.muscle_group,
            gif_url: updated.gif_url
          } : e));
        }}
      />
    </div>
  );
}
