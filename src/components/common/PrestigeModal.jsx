import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Flame, ChevronRight, Lock, CheckCircle2, Dumbbell } from 'lucide-react';
import { getAllRanks, calculateLevel, formatKg } from '../../utils/levelSystem';

export default function PrestigeModal({ isOpen, onClose, totalVolumeKg = 0 }) {
  if (!isOpen) return null;

  const levelInfo = calculateLevel(totalVolumeKg);
  const ranks = getAllRanks();
  const currentRank = levelInfo.rank;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[90] bg-black/85 backdrop-blur-md flex flex-col justify-end md:justify-center items-center p-0 md:p-4 animate-in fade-in duration-200">
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 350 }}
          className="bg-[#121214] border border-surface-2 w-full max-w-md max-h-[90vh] rounded-t-[32px] md:rounded-3xl flex flex-col overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-surface-2 bg-[#141416] sticky top-0 z-10">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                <Trophy size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-white">Rangos de Prestigio</h3>
                <p className="text-xs text-gray-400 font-medium">Basado en tus kilos acumulados</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-[#1c1c1e] text-gray-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Current Level Hero Card */}
          <div className="p-5 pb-3">
            <div className={`p-4 rounded-2xl border ${currentRank.borderClass} ${currentRank.bgClass} relative overflow-hidden shadow-lg`}>
              <div className="flex items-center justify-between mb-3 relative z-10">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">{currentRank.badge}</span>
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">Tu Rango Actual</span>
                    <h4 className={`text-lg font-black ${currentRank.textClass}`}>{currentRank.fullName}</h4>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-gray-400 font-medium">Nivel</span>
                  <p className="text-2xl font-black text-white">Lv. {levelInfo.level}</p>
                </div>
              </div>

              {/* Progress to Next Level */}
              <div className="space-y-1.5 relative z-10">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-gray-300">Progreso a Nivel {levelInfo.level + 1}</span>
                  <span className="text-primary">{levelInfo.progressPercent}%</span>
                </div>
                
                <div className="w-full h-2.5 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${levelInfo.progressPercent}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full bg-primary rounded-full shadow-[0_0_8px_rgba(204,255,0,0.5)]"
                  />
                </div>

                <div className="flex justify-between text-[11px] text-gray-400 pt-0.5">
                  <span>{levelInfo.kgInCurrentLevel.toLocaleString()} kg</span>
                  <span>Faltan {levelInfo.remainingKg.toLocaleString()} kg</span>
                </div>
              </div>

              {/* Stat Footer */}
              <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-gray-400">Kilos Totales Históricos:</span>
                <span className="font-black text-white text-sm">{levelInfo.formattedKg}</span>
              </div>
            </div>
          </div>

          {/* Ranks Roadmap List */}
          <div className="flex-1 overflow-y-auto px-5 pb-8 space-y-2.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 my-2">
              Camino de Prestigio
            </h4>

            {ranks.map((r) => {
              const isCurrent = r.id === currentRank.id;
              const isUnlocked = totalVolumeKg >= r.minKg;

              return (
                <div
                  key={r.id}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                    isCurrent
                      ? `${r.borderClass} bg-surface-1 shadow-md scale-[1.01]`
                      : isUnlocked
                      ? 'border-surface-2 bg-[#18181a]/60 opacity-90'
                      : 'border-surface-2/40 bg-[#121214]/40 opacity-50'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0 pr-2">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${r.bgClass} border ${r.borderClass}`}>
                      {r.badge}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <h5 className={`font-black text-sm ${r.textClass} truncate`}>
                          {r.fullName}
                        </h5>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full bg-primary text-black font-black text-[10px] uppercase shrink-0">
                            Actual
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {r.maxKg === Infinity 
                          ? `+${r.minKg.toLocaleString()} kg` 
                          : `${r.minKg.toLocaleString()} – ${r.maxKg.toLocaleString()} kg`}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isUnlocked ? (
                      <CheckCircle2 size={18} className="text-primary" />
                    ) : (
                      <Lock size={16} className="text-gray-500" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
