import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Calendar, Clock, Dumbbell, Trophy, AlertTriangle, ChevronRight, Check } from 'lucide-react';
import Button from '../ui/Button';

export default function WorkoutDetailModal({ 
  isOpen, 
  onClose, 
  workout, 
  onDelete, 
  isDeleting = false,
  readOnly = false 
}) {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  if (!isOpen || !workout) return null;

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const formatHour = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const handleDeleteClick = () => {
    setShowConfirmDelete(true);
  };

  const handleConfirmDelete = async () => {
    if (onDelete) {
      await onDelete(workout.id);
      setShowConfirmDelete(false);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[95] bg-black/85 backdrop-blur-md flex flex-col justify-end md:justify-center items-center p-0 md:p-4 animate-in fade-in duration-200">
        
        {/* Modal Window */}
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 350 }}
          className="bg-[#121214] border border-surface-2 w-full max-w-md max-h-[92vh] rounded-t-[32px] md:rounded-3xl flex flex-col overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-surface-2 bg-[#141416] sticky top-0 z-10">
            <div className="min-w-0 pr-3">
              <span className="text-[11px] font-black text-primary uppercase tracking-wider block">
                Detalle de Entrenamiento
              </span>
              <h3 className="font-extrabold text-lg text-white truncate">
                {workout.title || 'Entrenamiento'}
              </h3>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-[#1c1c1e] text-gray-400 hover:text-white transition-colors shrink-0"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            
            {/* Meta Row (Date, Duration, Total Volume) */}
            <div className="bg-[#18181a] border border-surface-2/80 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center space-x-2 text-xs text-gray-300 font-semibold capitalize">
                <Calendar size={14} className="text-primary shrink-0" />
                <span>{formatDate(workout.started_at)} • {formatHour(workout.started_at)}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-surface-2/60 text-center">
                <div className="p-2 bg-[#121214] rounded-xl border border-white/5">
                  <span className="text-[10px] text-gray-400 font-bold block uppercase">Tiempo</span>
                  <span className="text-sm font-black text-white">{workout.durationMinutes} min</span>
                </div>

                <div className="p-2 bg-[#121214] rounded-xl border border-white/5">
                  <span className="text-[10px] text-gray-400 font-bold block uppercase">Volumen</span>
                  <span className="text-sm font-black text-primary">{workout.total_volume_kg.toLocaleString()} kg</span>
                </div>

                <div className="p-2 bg-[#121214] rounded-xl border border-white/5">
                  <span className="text-[10px] text-gray-400 font-bold block uppercase">Series</span>
                  <span className="text-sm font-black text-white">{workout.totalSetsCount || 0}</span>
                </div>
              </div>
            </div>

            {/* PRs Highlight if any */}
            {workout.prsCount > 0 && (
              <div className="bg-gradient-to-r from-yellow-500/15 via-yellow-500/5 to-transparent border border-yellow-500/30 rounded-2xl p-3 flex items-center space-x-2.5 text-yellow-400">
                <Trophy size={18} className="shrink-0 animate-bounce" />
                <span className="text-xs font-bold">
                  ¡Rompiste {workout.prsCount} {workout.prsCount === 1 ? 'Récord Personal (PR)' : 'Récords Personales (PRs)'} en esta sesión!
                </span>
              </div>
            )}

            {/* Exercises & Sets Breakdown */}
            <div className="space-y-3 pt-1">
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 px-1">
                Ejercicios Realizados ({workout.exercises?.length || 0})
              </h4>

              {workout.exercises && workout.exercises.length > 0 ? (
                workout.exercises.map((ex, idx) => (
                  <div key={ex.id || idx} className="bg-[#18181a] border border-surface-2 rounded-2xl p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-black text-sm text-white">{ex.name}</h5>
                        <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{ex.muscle_group}</span>
                      </div>
                      <span className="text-xs font-bold text-gray-400 bg-[#121214] px-2.5 py-1 rounded-lg border border-white/5">
                        {ex.sets?.length || 0} series
                      </span>
                    </div>

                    {/* Sets Table */}
                    <div className="space-y-1.5 pt-1">
                      {ex.sets?.map((st, sIdx) => (
                        <div 
                          key={st.id || sIdx} 
                          className={`flex items-center justify-between p-2 rounded-xl text-xs font-bold ${
                            st.is_pr 
                              ? 'bg-yellow-500/15 border border-yellow-500/30 text-yellow-400' 
                              : 'bg-[#121214] text-gray-300 border border-white/5'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center text-[10px] text-gray-400">
                              {sIdx + 1}
                            </span>
                            <span>{st.weight_kg} kg × {st.reps} reps</span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <span className="text-[11px] text-gray-400">
                              = {(st.weight_kg * st.reps).toLocaleString()} kg
                            </span>
                            {st.is_pr && (
                              <span className="px-1.5 py-0.5 rounded bg-yellow-500 text-black font-black text-[9px] uppercase">
                                PR
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-500 text-xs font-semibold">
                  No hay detalle de ejercicios guardados para esta sesión.
                </div>
              )}
            </div>
          </div>

          {/* Delete Action Footer (Only if not readOnly) */}
          {!readOnly && (
            <div className="p-4 border-t border-surface-2 bg-[#141416]">
              <button
                onClick={handleDeleteClick}
                disabled={isDeleting}
                className="w-full py-3 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-black text-xs transition-colors flex items-center justify-center space-x-2 border border-red-500/20 active:scale-98"
              >
                <Trash2 size={16} />
                <span>Eliminar este Entrenamiento</span>
              </button>
            </div>
          )}
        </motion.div>

        {/* Confirmation Modal for Delete */}
        {showConfirmDelete && (
          <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-[#18181a] border border-red-500/30 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
                <AlertTriangle size={28} />
              </div>

              <div>
                <h4 className="text-lg font-black text-white">¿Eliminar entrenamiento?</h4>
                <p className="text-xs text-gray-300 mt-1.5 leading-relaxed">
                  Se restarán los <strong className="text-white font-bold">{workout.total_volume_kg.toLocaleString()} kg</strong> de tu historial y se recalculará tu nivel y récords asociados. Esta acción no se puede deshacer.
                </p>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  onClick={() => setShowConfirmDelete(false)}
                  className="flex-1 py-3 rounded-xl bg-surface-2 text-white font-bold text-xs hover:bg-surface-2/80 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="flex-1 py-3 rounded-xl bg-red-600 text-white font-black text-xs hover:bg-red-700 transition-colors flex items-center justify-center space-x-1 shadow-lg"
                >
                  {isDeleting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  ) : (
                    <span>Sí, eliminar</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AnimatePresence>
  );
}
