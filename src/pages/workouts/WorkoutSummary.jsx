import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Clock, Dumbbell, Trophy, Share2, ArrowRight, Sparkles, Flame } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { calculateLevel } from '../../utils/levelSystem';

export default function WorkoutSummary() {
  const navigate = useNavigate();
  const summary = useAppStore((state) => state.lastCompletedWorkout);
  const lifetimeVolumeKg = useAppStore((state) => state.lifetimeVolumeKg) || 0;
  const clearWorkout = useAppStore((state) => state.clearWorkout);
  
  // Si alguien entra a esta ruta sin haber terminado un entreno, lo redirigimos al inicio
  useEffect(() => {
    if (!summary) {
      navigate('/');
    }
  }, [summary, navigate]);

  if (!summary) return null;

  const currentTotal = lifetimeVolumeKg;
  const sessionVolume = parseFloat(summary.volume) || 0;
  const previousTotal = Math.max(0, currentTotal - sessionVolume);

  const prevLevelInfo = calculateLevel(previousTotal);
  const newLevelInfo = calculateLevel(currentTotal);

  const isLevelUp = newLevelInfo.level > prevLevelInfo.level;
  const isRankUp = newLevelInfo.rank.id !== prevLevelInfo.rank.id;
  const rank = newLevelInfo.rank;

  return (
    <div className="min-h-screen bg-surface-0 text-white flex flex-col items-center pt-8 pb-24 relative overflow-hidden px-4">
      {/* Background Glow */}
      <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none"></div>

      <motion.div 
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
        className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-4 text-primary z-10 relative"
      >
        <div className="absolute inset-0 rounded-full border-4 border-primary animate-ping opacity-20"></div>
        <Check size={40} strokeWidth={3} />
      </motion.div>

      <motion.h1 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-2xl md:text-3xl font-black text-center mb-1 z-10"
      >
        ¡Entrenamiento Completado!
      </motion.h1>
      
      <motion.p 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-gray-400 text-sm mb-6 text-center z-10 font-medium"
      >
        {summary.title} • {summary.date}
      </motion.p>

      {/* LEVEL UP / RANK UP HERO BANNER */}
      {(isLevelUp || isRankUp) && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.6, delay: 0.4 }}
          className="w-full max-w-sm mb-5 p-4 rounded-2xl bg-gradient-to-r from-primary/25 via-primary/15 to-primary/25 border-2 border-primary text-center shadow-[0_0_25px_rgba(204,255,0,0.35)] relative overflow-hidden z-10"
        >
          <div className="flex items-center justify-center space-x-2 text-primary font-black text-xs uppercase tracking-widest mb-1">
            <Sparkles size={16} />
            <span>{isRankUp ? '¡ASCENSO DE RANGO!' : '¡LEVEL UP!'}</span>
            <Sparkles size={16} />
          </div>
          <h3 className="text-xl font-black text-white">
            {isRankUp ? `¡Has alcanzado ${rank.fullName}! ${rank.badge}` : `¡Has alcanzado el Nivel ${newLevelInfo.level}! 🚀`}
          </h3>
          <p className="text-xs text-gray-300 mt-0.5">
            ¡Sigue sumando kilos a tu legado de fuerza!
          </p>
        </motion.div>
      )}

      {/* Tarjeta de Ganancia de Experiencia (XP) */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.45 }}
        className={`w-full max-w-sm bg-surface-1 border ${rank.borderClass} rounded-2xl p-4 mb-4 shadow-lg z-10`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{rank.badge}</span>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-white font-black text-sm">Nivel {newLevelInfo.level}</span>
                <span className={`px-2 py-0.5 rounded-full ${rank.bgClass} ${rank.textClass} text-[10px] font-black uppercase`}>
                  {rank.fullName}
                </span>
              </div>
              <p className="text-[11px] text-primary font-bold">
                +{sessionVolume.toLocaleString()} kg XP de entreno
              </p>
            </div>
          </div>

          <span className="text-xs font-black text-primary">
            {newLevelInfo.progressPercent}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2.5 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/10 mt-2">
          <motion.div
            initial={{ width: `${prevLevelInfo.progressPercent}%` }}
            animate={{ width: `${newLevelInfo.progressPercent}%` }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.5 }}
            className="h-full bg-primary rounded-full shadow-[0_0_10px_rgba(204,255,0,0.5)]"
          />
        </div>

        <div className="flex justify-between text-[10px] text-gray-400 font-medium pt-1.5">
          <span>{newLevelInfo.formattedKg} acumulados</span>
          <span>Faltan {newLevelInfo.remainingKg.toLocaleString()} kg para Nv. {newLevelInfo.level + 1}</span>
        </div>
      </motion.div>

      {/* Grid de Estadísticas */}
      <div className="w-full max-w-sm grid grid-cols-2 gap-3 z-10">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-surface-1 rounded-2xl p-3.5 flex flex-col items-center justify-center text-center shadow-lg border border-surface-2"
        >
          <Clock size={24} className="text-gray-400 mb-1.5" />
          <span className="text-xl font-black text-white">{summary.duration}</span>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Tiempo</span>
        </motion.div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="bg-surface-1 rounded-2xl p-3.5 flex flex-col items-center justify-center text-center shadow-lg border border-surface-2"
        >
          <Dumbbell size={24} className="text-gray-400 mb-1.5" />
          <span className="text-xl font-black text-white">{summary.volume} <span className="text-xs">kg</span></span>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Volumen Total</span>
        </motion.div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-surface-1 rounded-2xl p-3.5 flex flex-col items-center justify-center text-center shadow-lg border border-surface-2 col-span-2"
        >
          <div className="flex items-center space-x-2.5 mb-1">
            <Trophy size={24} className={summary.prsCount > 0 ? "text-yellow-400 animate-bounce" : "text-gray-400"} />
            <span className="text-xl font-black text-white">{summary.prsCount}</span>
          </div>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Récords Personales (PRs) Rotos</span>
        </motion.div>
      </div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-8 w-full max-w-sm flex flex-col gap-3 z-10"
      >
        <button 
          className="w-full h-13 py-3.5 bg-primary text-black font-black rounded-2xl flex items-center justify-center space-x-2 active:scale-[0.98] transition-transform shadow-[0_0_20px_rgba(204,255,0,0.3)]"
          onClick={() => {
            clearWorkout();
            navigate('/');
          }}
        >
          <span>Finalizar y Guardar</span>
          <ArrowRight size={18} />
        </button>

        <button 
          className="w-full h-12 bg-surface-1 text-gray-300 font-bold rounded-2xl flex items-center justify-center space-x-2 active:scale-[0.98] transition-transform border border-surface-2 hover:text-white"
          onClick={() => {
            alert('¡Pronto podrás compartir tus entrenamientos en redes!');
          }}
        >
          <Share2 size={18} />
          <span className="text-xs">Compartir Resultados</span>
        </button>
      </motion.div>
    </div>
  );
}
