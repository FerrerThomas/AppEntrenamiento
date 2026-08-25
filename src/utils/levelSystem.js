// Sistema de Niveles y Rangos de Prestigio por Kilos Acumulados

export const PRESTIGE_RANKS = [
  {
    id: 'hierro',
    name: 'Hierro',
    fullName: 'Rango Hierro',
    badge: '🛡️',
    minKg: 0,
    maxKg: 25000,
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
 * Formatea kilos a formato legible con separador de miles (ej. "142.500 kg")
 */
export function formatKg(kg = 0) {
  const val = Math.max(0, Math.round(parseFloat(kg) || 0));
  return `${val.toLocaleString()} kg`;
}

// Alias compatible
export const formatTons = formatKg;

/**
 * Calcula el nivel actual, rango, porcentaje y detalles a partir de los kilos acumulados
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

  return {
    level,
    totalKg: Math.round(kg),
    formattedKg: formatKg(kg),
    formattedTons: formatKg(kg), // Compatible
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
 * Lista todos los rangos para modales y guías informativas
 */
export function getAllRanks() {
  return PRESTIGE_RANKS;
}
