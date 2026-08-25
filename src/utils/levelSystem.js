// Sistema de Niveles y Rangos de Prestigio por Tonelaje (Kilos Acumulados)

export const PRESTIGE_RANKS = [
  {
    id: 'hierro',
    name: 'Hierro',
    fullName: 'Rango Hierro',
    badge: '🛡️',
    minKg: 0,
    maxKg: 25000,
    minTons: 0,
    maxTons: 25,
    color: '#9e9e9e',
    textClass: 'text-gray-300',
    bgClass: 'bg-gray-500/15',
    borderClass: 'border-gray-500/40',
    gradientClass: 'from-gray-500/20 to-transparent'
  },
  {
    id: 'bronce',
    name: 'Bronce',
    fullName: 'Rango Bronce',
    badge: '🥉',
    minKg: 25000,
    maxKg: 100000,
    minTons: 25,
    maxTons: 100,
    color: '#cd7f32',
    textClass: 'text-[#cd7f32]',
    bgClass: 'bg-[#cd7f32]/15',
    borderClass: 'border-[#cd7f32]/40',
    gradientClass: 'from-[#cd7f32]/20 to-transparent'
  },
  {
    id: 'plata',
    name: 'Plata',
    fullName: 'Rango Plata',
    badge: '🥈',
    minKg: 100000,
    maxKg: 300000,
    minTons: 100,
    maxTons: 300,
    color: '#e0e0e0',
    textClass: 'text-gray-200',
    bgClass: 'bg-gray-300/15',
    borderClass: 'border-gray-300/40',
    gradientClass: 'from-gray-300/20 to-transparent'
  },
  {
    id: 'oro',
    name: 'Oro',
    fullName: 'Rango Oro',
    badge: '🥇',
    minKg: 300000,
    maxKg: 750000,
    minTons: 300,
    maxTons: 750,
    color: '#ffcc00',
    textClass: 'text-[#ffcc00]',
    bgClass: 'bg-[#ffcc00]/15',
    borderClass: 'border-[#ffcc00]/40',
    gradientClass: 'from-[#ffcc00]/20 to-transparent'
  },
  {
    id: 'platino',
    name: 'Platino',
    fullName: 'Rango Platino',
    badge: '💎',
    minKg: 750000,
    maxKg: 1500000,
    minTons: 750,
    maxTons: 1500,
    color: '#00e5ff',
    textClass: 'text-[#00e5ff]',
    bgClass: 'bg-[#00e5ff]/15',
    borderClass: 'border-[#00e5ff]/40',
    gradientClass: 'from-[#00e5ff]/20 to-transparent'
  },
  {
    id: 'diamante',
    name: 'Diamante',
    fullName: 'Rango Diamante',
    badge: '👑',
    minKg: 1500000,
    maxKg: 3500000,
    minTons: 1500,
    maxTons: 3500,
    color: '#b388ff',
    textClass: 'text-[#b388ff]',
    bgClass: 'bg-[#b388ff]/15',
    borderClass: 'border-[#b388ff]/40',
    gradientClass: 'from-[#b388ff]/20 to-transparent'
  },
  {
    id: 'elite',
    name: 'Elite',
    fullName: 'Rango Elite',
    badge: '🔥',
    minKg: 3500000,
    maxKg: Infinity,
    minTons: 3500,
    maxTons: Infinity,
    color: '#ccff00',
    textClass: 'text-primary',
    bgClass: 'bg-primary/15',
    borderClass: 'border-primary/40',
    gradientClass: 'from-primary/20 to-transparent'
  }
];

/**
 * Devuelve el umbral de kg requerido para alcanzar un nivel dado L
 */
export function getKgForLevel(level) {
  if (level <= 1) return 0;
  return Math.round(2500 * Math.pow(level - 1, 1.45));
}

/**
 * Calcula el nivel actual, rango, porcentaje y detalles a partir del volumen total acumulado
 */
export function calculateLevel(totalVolumeKg = 0) {
  const kg = Math.max(0, parseFloat(totalVolumeKg) || 0);

  // Buscar el nivel iterando la curva
  let level = 1;
  while (getKgForLevel(level + 1) <= kg) {
    level++;
    if (level >= 999) break; // Límite de seguridad
  }

  const currentLevelMinKg = getKgForLevel(level);
  const nextLevelKg = getKgForLevel(level + 1);
  const kgInCurrentLevel = kg - currentLevelMinKg;
  const kgNeededForLevel = nextLevelKg - currentLevelMinKg;
  
  const progressPercent = kgNeededForLevel > 0 
    ? Math.min(100, Math.max(0, Math.round((kgInCurrentLevel / kgNeededForLevel) * 100))) 
    : 100;

  const rank = getPrestigeRank(kg);
  const tons = (kg / 1000).toFixed(1);

  return {
    level,
    totalKg: Math.round(kg),
    totalTons: parseFloat(tons),
    formattedTons: formatTons(kg),
    currentLevelMinKg,
    nextLevelKg,
    kgInCurrentLevel: Math.round(kgInCurrentLevel),
    kgNeededForLevel: Math.round(kgNeededForLevel),
    remainingKg: Math.max(0, Math.round(nextLevelKg - kg)),
    progressPercent,
    rank
  };
}

/**
 * Obtiene el objeto del rango de prestigio correspondiente a los kilos acumulados
 */
export function getPrestigeRank(totalVolumeKg = 0) {
  const kg = Math.max(0, parseFloat(totalVolumeKg) || 0);
  const found = PRESTIGE_RANKS.find(r => kg >= r.minKg && (r.maxKg === Infinity || kg < r.maxKg));
  return found || PRESTIGE_RANKS[0];
}

/**
 * Formatea kilos a toneladas legibles (ej. "14.2 t" o "1.450 kg")
 */
export function formatTons(kg = 0) {
  const val = Math.max(0, parseFloat(kg) || 0);
  if (val >= 1000) {
    const tons = val / 1000;
    return `${tons >= 100 ? Math.round(tons).toLocaleString() : tons.toFixed(1)} t`;
  }
  return `${Math.round(val).toLocaleString()} kg`;
}

/**
 * Lista todos los rangos para modales y guías informativas
 */
export function getAllRanks() {
  return PRESTIGE_RANKS;
}
