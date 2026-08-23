import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Clock, Dumbbell, Trophy, Share2, ArrowRight } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export default function WorkoutSummary() {
  const navigate = useNavigate();
  const summary = useAppStore((state) => state.lastCompletedWorkout);
  const clearWorkout = useAppStore((state) => state.clearWorkout);
  
  // Si alguien entra a esta ruta sin haber terminado un entreno, lo redirigimos al inicio
  useEffect(() => {
    if (!summary) {
      navigate('/');
    }
  }, [summary, navigate]);

  if (!summary) return null;

  return (
    <div className="min-h-screen bg-surface-0 text-white flex flex-col items-center pt-12 pb-24 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none"></div>

      <motion.div 
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
        className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mb-6 text-primary z-10 relative"
      >
        <div className="absolute inset-0 rounded-full border-4 border-primary animate-ping opacity-20"></div>
        <Check size={48} strokeWidth={3} />
      </motion.div>

      <motion.h1 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-3xl font-bold text-center mb-2 z-10"
      >
        ¡Entrenamiento Completado!
      </motion.h1>
      
      <motion.p 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-gray-400 text-lg mb-10 text-center z-10"
      >
        {summary.title} • {summary.date}
      </motion.p>

      <div className="w-full max-w-sm grid grid-cols-2 gap-4 px-6 z-10">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-surface-1 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-lg border border-surface-2"
        >
          <Clock size={28} className="text-gray-400 mb-2" />
          <span className="text-2xl font-bold text-white">{summary.duration}</span>
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-1">Tiempo</span>
        </motion.div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-surface-1 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-lg border border-surface-2"
        >
          <Dumbbell size={28} className="text-gray-400 mb-2" />
          <span className="text-2xl font-bold text-white">{summary.volume} <span className="text-sm">kg</span></span>
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-1">Volumen Total</span>
        </motion.div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-surface-1 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-lg border border-surface-2 col-span-2"
        >
          <div className="flex items-center space-x-3 mb-2">
            <Trophy size={28} className={summary.prsCount > 0 ? "text-yellow-500" : "text-gray-400"} />
            <span className="text-2xl font-bold text-white">{summary.prsCount}</span>
          </div>
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-1">Récords Personales (PRs) Rotos</span>
        </motion.div>
      </div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-12 w-full max-w-sm px-6 flex flex-col gap-3 z-10"
      >
        <button 
          className="w-full h-14 bg-primary text-surface-0 font-bold rounded-2xl flex items-center justify-center space-x-2 active:scale-[0.98] transition-transform shadow-[0_0_20px_rgba(204,255,0,0.3)]"
          onClick={() => {
            clearWorkout();
            navigate('/');
          }}
        >
          <span>Finalizar</span>
          <ArrowRight size={20} />
        </button>

        <button 
          className="w-full h-14 bg-surface-1 text-white font-medium rounded-2xl flex items-center justify-center space-x-2 active:scale-[0.98] transition-transform border border-surface-2"
          onClick={() => {
            // Dummy share logic
            alert('¡Pronto podrás compartir tus entrenamientos en redes!');
          }}
        >
          <Share2 size={20} />
          <span>Compartir Resultados</span>
        </button>
      </motion.div>
    </div>
  );
}
