import { CLINICAL_FREQUENCIES, EarConfig } from '../../domain/entities/AudioProfile';
import { FeedbackType } from '../../domain/entities/FeedbackLog';
import { AudioEngineService } from '../../domain/services/AudioEngineService';

export interface SpectralSuggestion {
  dominantIndex: number;
  dominantFreqHz: number;
  type: FeedbackType;
  suggestedDeltaDb: number;
  description: string;
}

/**
 * Agente de Análisis: Revisa el espectro en tiempo real y analiza tendencias históricas de ganancias.
 */
export class AnalysisAgent {
  constructor(private audioEngine: AudioEngineService) {}

  /**
   * Analiza la señal FFT en vivo y calcula la sugerencia de ajuste rápido.
   */
  async analyzeLiveFeedback(type: FeedbackType): Promise<SpectralSuggestion | null> {
    const { dominantIndex, maxAmplitude } = await this.audioEngine.analyzeSpectrum();

    // Regla de seguridad de audio: Si la amplitud es inferior al umbral de ruido (5),
    // se devuelve por defecto la banda central de 1000 Hz (index 4) para evitar falsos positivos.
    const safeIdx = maxAmplitude < 5 ? 4 : dominantIndex;
    const freqHz = CLINICAL_FREQUENCIES[safeIdx];

    const delta = type === 'estridente' ? -15 : 15;
    const freqDisplay = freqHz >= 1000 ? `${freqHz / 1000} kHz` : `${freqHz} Hz`;

    const description =
      type === 'estridente'
        ? `⚠️ Pico detectado en ${freqDisplay}. ¿Sugerir bajar la ganancia en 15 dB de confort para suavizar?`
        : `💡 Vacío detectado en ${freqDisplay}. ¿Sugerir compensar subiendo 15 dB de pérdida para ganar detalle?`;

    return {
      dominantIndex: safeIdx,
      dominantFreqHz: freqHz,
      type,
      suggestedDeltaDb: delta,
      description,
    };
  }

  /**
   * Revisa si hay variaciones bruscas entre bandas adyacentes (delta >= 15 dB).
   */
  detectAbruptVariations(config: EarConfig): { ear: 'left' | 'right'; bandIndex: number; delta: number }[] {
    const abrupt: { ear: 'left' | 'right'; bandIndex: number; delta: number }[] = [];
    const sides: ('left' | 'right')[] = ['left', 'right'];

    sides.forEach((side) => {
      CLINICAL_FREQUENCIES.forEach((_, idx) => {
        if (idx === 0) return;
        const prev = config[side][idx - 1] ?? 0;
        const curr = config[side][idx] ?? 0;
        const diff = Math.abs(curr - prev);
        if (diff >= 15) {
          abrupt.push({ ear: side, bandIndex: idx, delta: diff });
        }
      });
    });

    return abrupt;
  }
}
