/**
 * Frecuencias clínicas audiométricas estándar (11 bandas desde 125 Hz hasta 8 kHz).
 */
export const CLINICAL_FREQUENCIES = [125, 250, 500, 750, 1000, 1500, 2000, 3000, 4000, 6000, 8000] as const;

export type ClinicalFrequency = typeof CLINICAL_FREQUENCIES[number];

export type EarSide = 'left' | 'right';

/**
 * Mapeo de ganancia por índice de frecuencia (0 a 10) en decibelios de pérdida (dB HL: 0 a 80 dB).
 */
export type BandGainMap = Record<number, number>;

/**
 * Configuración estéreo asimétrica para ambos oídos.
 */
export interface EarConfig {
  left: BandGainMap;
  right: BandGainMap;
  isMedicalExam?: boolean;
}

/**
 * Mapa de perfiles autoguardados ("1", "2", "3").
 */
export type ProfilesMap = Record<string, EarConfig>;

/**
 * Regla de compensación clínica: convierte pérdida en dB HL a ganancia de confort en dB.
 * Ganancia = Pérdida * 0.6
 */
export function calculateComfortGain(lossDbHL: number): number {
  const safeLoss = Math.max(0, Math.min(80, lossDbHL));
  return Math.round(safeLoss * 0.6);
}

/**
 * Crea una configuración inicial vacía con 0 dB en todas las bandas.
 */
export function createEmptyEarConfig(): EarConfig {
  const left: BandGainMap = {};
  const right: BandGainMap = {};
  CLINICAL_FREQUENCIES.forEach((_, idx) => {
    left[idx] = 0;
    right[idx] = 0;
  });
  return { left, right, isMedicalExam: false };
}

/**
 * Perfiles por defecto para inicialización.
 */
export function createDefaultProfiles(): ProfilesMap {
  return {
    '1': createEmptyEarConfig(),
    '2': createEmptyEarConfig(),
    '3': createEmptyEarConfig(),
  };
}
