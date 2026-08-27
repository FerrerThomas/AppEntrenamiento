import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { Dumbbell, Search, Info, Check, GripVertical, Trash2, Plus, Upload, X, Camera } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../store/useAppStore';

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

  // Modal state (Crear Nuevo Ejercicio)
  const [showCreateModal, setShowCreateModal] = useState(false);
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

  const handleCreateCustomExercise = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newExName.trim() || isCreatingExercise) return;

    setIsCreatingExercise(true);
    try {
      let uploadedUrl = null;

      // 1. Subir imagen si se seleccionó archivo
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

      // 2. Insertar ejercicio en la tabla exercises
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

      // 3. Actualizar la lista local de ejercicios y seleccionarlo
      if (newExercise) {
        setDbExercises(prev => [newExercise, ...prev]);
        setDraftSelected(prev => [...prev, newExercise]);
      }

      // 4. Limpiar estado y cerrar modal de creación
      setNewExName('');
      setNewExCategory('Pecho');
      handleRemoveImage();
      setShowCreateModal(false);

    } catch (err) {
      console.error('Error al crear ejercicio:', err);
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
                <button
                  onClick={() => handleRemoveExercise(exerciseIndex)}
                  className="text-gray-500 hover:text-red-400 p-1 shrink-0 ml-2"
                >
                  <Trash2 size={18} />
                </button>
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
          onClick={openModal}
          className="w-full py-4 rounded-2xl bg-[#1c1c1e] border border-surface-2 border-dashed flex items-center justify-center space-x-2 text-primary font-bold text-base hover:bg-[#242426] transition-colors"
        >
          <Plus size={20} />
          <span>Agregar Ejercicio</span>
        </button>
      </div>

      {showExerciseModal && (
        <div className="fixed inset-0 bg-[#0a0a0a] z-50 flex flex-col pt-safe animate-in slide-in-from-bottom-full duration-200">
          <header className="flex items-center justify-between p-4 py-3 bg-[#0a0a0a] sticky top-0 z-10 border-b border-surface-2">
            <div className="w-24 text-left">
              <button onClick={() => setShowExerciseModal(false)} className="text-primary text-[17px] font-medium">
                Cancelar
              </button>
            </div>
            <h2 className="text-[17px] font-bold flex-1 text-center">Agregar Ejercicio</h2>
            <div className="w-24 flex justify-end">
              <button
                onClick={() => setShowCreateModal(true)}
                className="text-primary text-[17px] font-medium hover:opacity-80 transition-opacity"
              >
                Crear
              </button>
            </div>
          </header>

          <div className="p-4 bg-[#0a0a0a] sticky top-[53px] z-10 border-b border-surface-2/40 space-y-3">
            <div className="bg-[#1c1c1e] rounded-xl flex items-center px-3 py-2.5 border border-surface-2/60 focus-within:border-primary transition-colors">
              <Search size={20} className="text-gray-500 mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Buscar ejercicio..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-transparent border-none text-white focus:outline-none w-full text-base placeholder-gray-500 font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-1 rounded-full text-gray-400 hover:text-white bg-surface-2 ml-1"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-0.5">
              {MUSCLE_FILTER_OPTIONS.map((muscle) => {
                const isSelected = selectedMuscle === muscle;
                const count = muscle === 'Todos'
                  ? dbExercises.length
                  : dbExercises.filter(e => (e.muscle_group || '').toLowerCase().trim() === muscle.toLowerCase().trim()).length;

                return (
                  <button
                    key={muscle}
                    onClick={() => setSelectedMuscle(muscle)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 shrink-0 ${isSelected
                        ? 'bg-primary text-surface-0 shadow-[0_0_12px_rgba(204,255,0,0.35)] scale-[1.02]'
                        : 'bg-[#1c1c1e] text-gray-300 hover:text-white border border-[#2a2a2c] hover:border-gray-500'
                      }`}
                  >
                    <span>{muscle}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${isSelected ? 'bg-surface-0/20 text-surface-0' : 'bg-surface-2 text-gray-400'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pb-32">
            <div className="px-4 py-2.5 text-[12px] flex items-center justify-between text-gray-400 border-b border-surface-2/20">
              <span className="uppercase tracking-wider font-semibold">
                {selectedMuscle === 'Todos' ? 'Todos los Ejercicios' : `Ejercicios de ${selectedMuscle}`} ({filteredDbExercises.length})
              </span>
              {(selectedMuscle !== 'Todos' || searchQuery) && (
                <button
                  onClick={() => { setSelectedMuscle('Todos'); setSearchQuery(''); }}
                  className="text-primary text-xs font-bold hover:underline"
                >
                  Limpiar filtros
                </button>
              )}
            </div>

            {filteredDbExercises.map(ex => {
              const isSelected = draftSelected.some(d => d.id === ex.id);
              return (
                <div
                  key={ex.id}
                  onClick={() => toggleDraftSelection(ex)}
                  className={`px-4 py-3 cursor-pointer flex items-center justify-between border-b border-surface-2 transition-colors ${isSelected ? 'bg-primary/20' : 'hover:bg-[#1c1c1e]'}`}
                >
                  <div className="flex items-center space-x-4 min-w-0">
                    <div className="relative shrink-0">
                      {ex.gif_url ? (
                        <img src={ex.gif_url} alt={ex.name} className="w-14 h-14 rounded-full object-cover bg-white" />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-surface-2 flex items-center justify-center text-gray-400">
                          <Dumbbell size={24} />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="font-semibold text-[17px] truncate">{ex.name}</p>
                      <span className="inline-block text-[11px] font-bold text-gray-400 mt-0.5 bg-[#1c1c1e] px-2 py-0.5 rounded-md border border-[#2a2a2c]">
                        {ex.muscle_group || 'General'}
                      </span>
                    </div>
                  </div>

                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ml-2 transition-colors ${isSelected ? 'border-primary bg-primary' : 'border-gray-600'}`}>
                    {isSelected && <Check size={14} className="text-surface-0" strokeWidth={3.5} />}
                  </div>
                </div>
              );
            })}

            {filteredDbExercises.length === 0 && (
              <div className="text-center py-16 px-4">
                <Dumbbell size={40} className="mx-auto text-gray-600 mb-3 opacity-50" />
                <p className="text-white font-bold text-base mb-1">No se encontraron ejercicios</p>
                <p className="text-gray-400 text-xs max-w-xs mx-auto mb-4">
                  No hay ejercicios que coincidan con "{searchQuery || selectedMuscle}".
                </p>
                <button
                  onClick={() => { setSelectedMuscle('Todos'); setSearchQuery(''); }}
                  className="px-4 py-2 rounded-xl bg-[#1c1c1e] text-primary text-xs font-bold border border-surface-2 hover:border-primary transition-colors"
                >
                  Mostrar todos los ejercicios
                </button>
              </div>
            )}
          </div>

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

      {/* Modal Crear Ejercicio Personalizado */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-[#0a0a0a] z-[60] flex flex-col pt-safe animate-in slide-in-from-bottom-full duration-200">
          <header className="flex items-center justify-between p-4 py-3 bg-[#0a0a0a] sticky top-0 z-10 border-b border-surface-2">
            <div className="w-24 text-left">
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-primary text-[17px] font-medium"
              >
                Cancelar
              </button>
            </div>
            <h2 className="text-[17px] font-bold flex-1 text-center">Nuevo Ejercicio</h2>
            <div className="w-24 flex justify-end">
              <button
                onClick={handleCreateExercise}
                disabled={!newExName.trim() || isCreatingExercise}
                className={`px-4 py-1.5 rounded-full font-bold text-sm transition-colors ${newExName.trim() && !isCreatingExercise
                    ? 'bg-primary text-surface-0'
                    : 'bg-[#2c2c2e] text-gray-500'
                  }`}
              >
                {isCreatingExercise ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-5 space-y-6 pb-24">
            {/* Selector de Foto / GIF */}
            <div className="flex flex-col items-center justify-center p-6 bg-[#1c1c1e] rounded-2xl border border-surface-2">
              <div className="relative mb-3">
                {newExPreview ? (
                  <div className="relative w-28 h-28 rounded-2xl overflow-hidden border-2 border-primary bg-white shadow-lg">
                    <img src={newExPreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-1.5 right-1.5 bg-black/75 hover:bg-black p-1 rounded-full text-white transition-colors"
                      title="Eliminar foto"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-28 h-28 rounded-2xl bg-surface-2/70 border border-dashed border-gray-600 hover:border-primary flex flex-col items-center justify-center cursor-pointer transition-colors group"
                  >
                    <Dumbbell size={36} className="text-gray-400 group-hover:text-primary transition-colors mb-1" />
                    <span className="text-[11px] text-gray-400 text-center font-medium px-2">Sin imagen</span>
                  </div>
                )}
              </div>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*,.gif"
                onChange={handleImageSelect}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-2 text-sm font-semibold text-primary hover:underline mt-1"
              >
                <Camera size={16} />
                <span>{newExPreview ? 'Cambiar foto o GIF' : 'Subir foto o GIF (opcional)'}</span>
              </button>
              <p className="text-[12px] text-gray-500 text-center mt-1">
                Si no subes foto, se mostrará el ícono de mancuerna por defecto.
              </p>
            </div>

            {/* Nombre del Ejercicio */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Nombre del Ejercicio <span className="text-primary">*</span>
              </label>
              <input
                type="text"
                placeholder="Ej: Press Militar con Mancuernas"
                value={newExName}
                onChange={(e) => setNewExName(e.target.value)}
                className="w-full bg-[#1c1c1e] border border-surface-2 rounded-xl p-4 text-white text-[16px] placeholder-gray-600 focus:outline-none focus:border-primary font-medium"
              />
            </div>

            {/* Grupo Muscular / Categoría */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Grupo Muscular / Categoría
              </label>
              <div className="flex flex-wrap gap-2">
                {MUSCLE_CATEGORIES.map((cat) => {
                  const isSelected = newExCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setNewExCategory(cat)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${isSelected
                          ? 'bg-primary text-surface-0 shadow-md scale-[1.02]'
                          : 'bg-[#1c1c1e] text-gray-300 border border-surface-2 hover:bg-[#2c2c2e]'
                        }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
