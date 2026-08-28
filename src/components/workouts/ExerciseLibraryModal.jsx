import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dumbbell, Search, Check, X, Camera, Pencil, Plus, Trash2, Sparkles } from 'lucide-react';
import Button from '../ui/Button';
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

export default function ExerciseLibraryModal({
  isOpen,
  onClose,
  mode = 'manage', // 'manage' (explorar y editar) | 'select' (seleccionar para rutina)
  selectedIds = [],
  onConfirmSelection = null,
  onExerciseUpdated = null
}) {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState('Todos');
  const [draftSelected, setDraftSelected] = useState([]);

  // Modal para Crear / Editar
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingExerciseId, setEditingExerciseId] = useState(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Pecho');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      loadExercises();
      setDraftSelected([]);
      setSearchQuery('');
      setSelectedMuscle('Todos');
    }
  }, [isOpen]);

  const loadExercises = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('exercises').select('*').order('name');
      if (!error && data) {
        setExercises(data);
      }
    } catch (err) {
      console.error('Error cargando ejercicios:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredExercises = exercises.filter(ex => {
    const matchesSearch = !searchQuery || 
      (ex.name && ex.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (ex.muscle_group && ex.muscle_group.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesMuscle = selectedMuscle === 'Todos' || 
      (ex.muscle_group && ex.muscle_group.toLowerCase().trim() === selectedMuscle.toLowerCase().trim());
    return matchesSearch && matchesMuscle;
  });

  const toggleSelect = (ex) => {
    if (mode !== 'select') return;
    if (draftSelected.some(d => d.id === ex.id)) {
      setDraftSelected(draftSelected.filter(d => d.id !== ex.id));
    } else {
      setDraftSelected([...draftSelected, ex]);
    }
  };

  const handleOpenCreate = () => {
    setEditingExerciseId(null);
    setName('');
    setCategory('Pecho');
    setFile(null);
    setPreview(null);
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (ex, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setEditingExerciseId(ex.id);
    setName(ex.name || '');
    setCategory(ex.muscle_group || 'Pecho');
    setFile(null);
    setPreview(ex.gif_url || null);
    setIsEditModalOpen(true);
  };

  const handleFileSelect = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleRemoveImage = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSaveExercise = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!name.trim() || isSaving) return;

    setIsSaving(true);
    try {
      let finalUrl = preview;

      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
        const filePath = `custom-exercises/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('exercises')
          .upload(filePath, file, { cacheControl: '3600', upsert: false });

        if (uploadError) {
          console.error('Error al subir imagen:', uploadError);
        } else {
          const { data: publicUrlData } = supabase.storage.from('exercises').getPublicUrl(filePath);
          finalUrl = publicUrlData?.publicUrl || null;
        }
      }

      if (editingExerciseId) {
        // Actualizar ejercicio existente
        const { data: updated, error } = await supabase
          .from('exercises')
          .update({
            name: name.trim(),
            muscle_group: category,
            gif_url: finalUrl
          })
          .eq('id', editingExerciseId)
          .select()
          .single();

        if (error) throw error;

        if (updated) {
          setExercises(prev => prev.map(item => item.id === editingExerciseId ? updated : item));
          setDraftSelected(prev => prev.map(item => item.id === editingExerciseId ? updated : item));
          if (onExerciseUpdated) onExerciseUpdated(updated);
          useAppStore.getState().fetchDbExercises(true);
        }
      } else {
        // Crear ejercicio nuevo
        const { data: created, error } = await supabase
          .from('exercises')
          .insert({
            name: name.trim(),
            muscle_group: category,
            gif_url: finalUrl
          })
          .select()
          .single();

        if (error) throw error;

        if (created) {
          setExercises(prev => [created, ...prev]);
          if (mode === 'select') {
            setDraftSelected(prev => [...prev, created]);
          }
          if (onExerciseUpdated) onExerciseUpdated(created);
          useAppStore.getState().fetchDbExercises(true);
        }
      }

      setIsEditModalOpen(false);
      setEditingExerciseId(null);
      setName('');
      handleRemoveImage();
    } catch (err) {
      console.error('Error guardando ejercicio:', err);
      alert('Error al guardar el ejercicio: ' + (err.message || 'Inténtalo de nuevo'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] z-50 flex flex-col pt-safe animate-in slide-in-from-bottom-full duration-200">
      
      {/* Header */}
      <header className="flex items-center justify-between p-4 py-3 bg-[#0a0a0a] sticky top-0 z-10 border-b border-surface-2">
        <div className="w-24 text-left">
          <button onClick={onClose} className="text-primary text-[17px] font-medium">
            Cerrar
          </button>
        </div>

        <h2 className="text-[17px] font-bold flex-1 text-center">
          {mode === 'select' ? 'Agregar Ejercicio' : 'Biblioteca de Ejercicios'}
        </h2>

        <div className="w-24 flex justify-end">
          <button
            type="button"
            onClick={handleOpenCreate}
            className="text-primary text-[15px] font-bold flex items-center space-x-1 hover:opacity-80 transition-opacity bg-primary/10 px-3 py-1.5 rounded-full border border-primary/30"
          >
            <Plus size={16} />
            <span>Crear</span>
          </button>
        </div>
      </header>

      {/* Buscador y Categorías */}
      <div className="p-4 bg-[#0a0a0a] sticky top-[53px] z-10 border-b border-surface-2/40 space-y-3">
        <div className="bg-[#1c1c1e] rounded-xl flex items-center px-3 py-2.5 border border-surface-2/60 focus-within:border-primary transition-colors">
          <Search size={20} className="text-gray-500 mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Buscar por nombre o músculo..."
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

        {/* Filtros de Músculos */}
        <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-0.5">
          {MUSCLE_FILTER_OPTIONS.map((muscle) => {
            const isSelected = selectedMuscle === muscle;
            const count = muscle === 'Todos'
              ? exercises.length
              : exercises.filter(e => (e.muscle_group || '').toLowerCase().trim() === muscle.toLowerCase().trim()).length;

            return (
              <button
                key={muscle}
                onClick={() => setSelectedMuscle(muscle)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 shrink-0 ${
                  isSelected
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

      {/* Lista de Ejercicios */}
      <div className="flex-1 overflow-y-auto pb-32">
        <div className="px-4 py-2.5 text-[12px] flex items-center justify-between text-gray-400 border-b border-surface-2/20">
          <span className="uppercase tracking-wider font-semibold">
            {selectedMuscle === 'Todos' ? 'Todos los Ejercicios' : `Ejercicios de ${selectedMuscle}`} ({filteredExercises.length})
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

        {filteredExercises.map(ex => {
          const isSelected = draftSelected.some(d => d.id === ex.id);
          return (
            <div
              key={ex.id}
              onClick={() => toggleSelect(ex)}
              className={`px-4 py-3 flex items-center justify-between border-b border-surface-2 transition-colors ${
                mode === 'select' ? 'cursor-pointer' : ''
              } ${isSelected ? 'bg-primary/20' : 'hover:bg-[#1c1c1e]'}`}
            >
              {/* Info Ejercicio */}
              <div className="flex items-center space-x-4 min-w-0 flex-1 mr-2">
                <div className="relative shrink-0">
                  {ex.gif_url ? (
                    <img src={ex.gif_url} alt={ex.name} className="w-14 h-14 rounded-full object-cover bg-white shadow-sm" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-surface-2 flex items-center justify-center text-gray-400">
                      <Dumbbell size={24} />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[17px] truncate text-white">{ex.name}</p>
                  <span className="inline-block text-[11px] font-bold text-gray-400 mt-0.5 bg-[#1c1c1e] px-2 py-0.5 rounded-md border border-[#2a2a2c]">
                    {ex.muscle_group || 'General'}
                  </span>
                </div>
              </div>

              {/* Botón Editar y/o Selección */}
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={(e) => handleOpenEdit(ex, e)}
                  className="px-3 py-1.5 rounded-xl bg-[#242426] hover:bg-primary/20 border border-surface-2 text-gray-300 hover:text-primary transition-all flex items-center space-x-1 text-xs font-bold"
                  title="Editar nombre, músculo o foto"
                >
                  <Pencil size={14} />
                  <span>Editar</span>
                </button>

                {mode === 'select' && (
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'border-primary bg-primary' : 'border-gray-600'}`}>
                    {isSelected && <Check size={14} className="text-surface-0" strokeWidth={3.5} />}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredExercises.length === 0 && !loading && (
          <div className="text-center py-16 px-4">
            <Dumbbell size={40} className="mx-auto text-gray-600 mb-3 opacity-50" />
            <p className="text-white font-bold text-base mb-1">No se encontraron ejercicios</p>
            <p className="text-gray-400 text-xs max-w-xs mx-auto mb-4">
              No hay ejercicios que coincidan con "{searchQuery || selectedMuscle}".
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
              <button
                onClick={() => { setSelectedMuscle('Todos'); setSearchQuery(''); }}
                className="px-4 py-2 rounded-xl bg-[#1c1c1e] text-primary text-xs font-bold border border-surface-2 hover:border-primary transition-colors"
              >
                Mostrar todos los ejercicios
              </button>
              <button
                onClick={handleOpenCreate}
                className="px-4 py-2 rounded-xl bg-primary text-black text-xs font-black hover:opacity-90 transition-opacity"
              >
                + Crear este ejercicio
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Botón flotante inferior para confirmar selección (Modo Select) */}
      {mode === 'select' && draftSelected.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 pb-8 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/90 to-transparent">
          <div className="max-w-md mx-auto">
            <Button 
              className="w-full py-4 text-[17px]" 
              onClick={() => {
                if (onConfirmSelection) onConfirmSelection(draftSelected);
                onClose();
              }}
            >
              Agrega {draftSelected.length} {draftSelected.length === 1 ? 'ejercicio' : 'ejercicios'}
            </Button>
          </div>
        </div>
      )}

      {/* Modal Crear / Editar Ejercicio */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-[#0a0a0a] z-[70] flex flex-col pt-safe animate-in slide-in-from-bottom-full duration-200">
          <header className="flex items-center justify-between p-4 py-3 bg-[#0a0a0a] sticky top-0 z-10 border-b border-surface-2">
            <div className="w-24 text-left">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-primary text-[17px] font-medium"
              >
                Cancelar
              </button>
            </div>
            
            <h2 className="text-[17px] font-bold flex-1 text-center">
              {editingExerciseId ? 'Editar Ejercicio' : 'Nuevo Ejercicio'}
            </h2>
            
            <div className="w-24 flex justify-end">
              <button
                type="button"
                onClick={handleSaveExercise}
                disabled={!name.trim() || isSaving}
                className={`px-4 py-1.5 rounded-full font-bold text-sm transition-colors ${
                  name.trim() && !isSaving
                    ? 'bg-primary text-surface-0 cursor-pointer shadow-md'
                    : 'bg-[#2c2c2e] text-gray-500'
                }`}
              >
                {isSaving ? 'Guardando...' : editingExerciseId ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-5 space-y-6 pb-24 max-w-md w-full mx-auto">
            {/* Selector de Foto / GIF */}
            <div className="flex flex-col items-center justify-center p-6 bg-[#1c1c1e] rounded-2xl border border-surface-2">
              <div className="relative mb-3">
                {preview ? (
                  <div className="relative w-28 h-28 rounded-2xl overflow-hidden border-2 border-primary bg-white shadow-lg">
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
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
                onChange={handleFileSelect}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-2 text-sm font-semibold text-primary hover:underline mt-1"
              >
                <Camera size={16} />
                <span>{preview ? 'Cambiar foto o GIF' : 'Subir foto o GIF (opcional)'}</span>
              </button>
              <p className="text-[12px] text-gray-500 text-center mt-1">
                Puedes subir una imagen o un GIF animado para visualizar la técnica.
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
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                  const isSelected = category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        isSelected
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
