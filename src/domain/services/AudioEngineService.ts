import { EarConfig, EarSide } from '../entities/AudioProfile';

/**
 * Contrato abstracto del servicio del motor de audio (DSP).
 * Permite cambiar de implementación entre Web (Web Audio API) y Nativo (Oboe / CoreAudio).
 */
export interface AudioEngineService {
  /**
   * Inicializa el motor de procesamiento de audio con la configuración dada.
   */
  startEngine(config: EarConfig): Promise<boolean>;

  /**
   * Detiene el motor de audio.
   */
  stopEngine(): Promise<void>;

  /**
   * Modifica un filtro en caliente sin pausar la reproducción.
   */
  updateFilter(side: EarSide, index: number, gainDb: number): Promise<void>;

  /**
   * Aplica la configuración estéreo completa a los 22 filtros (11 izquierda, 11 derecha).
   */
  applyFullConfig(config: EarConfig): Promise<void>;

  /**
   * Emite un tono senoidal puro para el examen audiométrico.
   */
  playTestTone(frequencyHz: number, ear: EarSide, gainDbFS: number): Promise<void>;

  /**
   * Detiene el tono senoidal audiométrico.
   */
  stopTestTone(): Promise<void>;

  /**
   * Realiza un análisis FFT del espectro actual y devuelve la banda clínica dominante.
   */
  analyzeSpectrum(): Promise<{ dominantIndex: number; maxAmplitude: number }>;
}
