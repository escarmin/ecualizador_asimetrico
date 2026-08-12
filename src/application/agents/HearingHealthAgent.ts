import { CLINICAL_FREQUENCIES, EarConfig } from '../../domain/entities/AudioProfile';
import { HealthAlert } from '../../domain/entities/HealthAlert';

/**
 * Agente de Salud Auditiva (Monitor de Cuidados): Chequea límites de riesgo de exposición,
 * asimetrías estéreo y genera recomendaciones de salud general con aviso médico.
 */
export class HearingHealthAgent {
  /**
   * Evalúa la configuración actual y métricas de uso para generar alertas de salud.
   */
  evaluateHealthState(
    config: EarConfig,
    continuousHoursOver84dB: number = 0
  ): HealthAlert[] {
    const alerts: HealthAlert[] = [];
    const now = Date.now();

    // 1. Alerta por exceso de exposición (> 84 dB por más de 8 horas)
    if (continuousHoursOver84dB >= 8) {
      alerts.push({
        id: `alert-exposure-${now}`,
        category: 'EXPOSURE_WARNING',
        title: '⚠️ ALERTA DE EXPOSICIÓN PROLONGADA',
        message: 'Ha superado las 8 horas con un sonido superior a los 84 dB. Se recomienda realizar un descanso auditivo inmediato para proteger sus oídos.',
        timestamp: now,
        actionRequired: true,
        suggestedAction: { type: 'TAKE_AUDIO_REST' },
      });
    }

    // 2. Evaluación de asimetría estéreo (diferencia >= 25 dB entre oídos)
    let maxAsymmetryDb = 0;
    let asymmetricFreqHz = 0;

    CLINICAL_FREQUENCIES.forEach((freq, idx) => {
      const leftVal = config.left[idx] ?? 0;
      const rightVal = config.right[idx] ?? 0;
      const diff = Math.abs(leftVal - rightVal);
      if (diff > maxAsymmetryDb) {
        maxAsymmetryDb = diff;
        asymmetricFreqHz = freq;
      }
    });

    if (maxAsymmetryDb >= 25) {
      const freqDisplay = asymmetricFreqHz >= 1000 ? `${asymmetricFreqHz / 1000} kHz` : `${asymmetricFreqHz} Hz`;
      alerts.push({
        id: `alert-asymmetry-${now}`,
        category: 'MEDICAL_CHECKUP_RECOMMENDED',
        title: '🩺 RECOMENDACIÓN POR ASIMETRÍA ESTÉREO',
        message: `De acuerdo al análisis, su perfil registra una diferencia asimétrica significativa de ${maxAsymmetryDb} dB en la frecuencia de ${freqDisplay}. Le recomendamos asistir a un chequeo audiológico profesional.`,
        timestamp: now,
        actionRequired: false,
        suggestedAction: { type: 'SCHEDULE_CHECKUP' },
      });
    }

    // 3. Evaluación de pérdidas severas (> 40 dB HL en alguna banda)
    const hasSevereLoss = CLINICAL_FREQUENCIES.some((_, idx) => (config.left[idx] ?? 0) > 40 || (config.right[idx] ?? 0) > 40);

    if (hasSevereLoss) {
      alerts.push({
        id: `alert-severe-${now}`,
        category: 'MEDICAL_CHECKUP_RECOMMENDED',
        title: '🩺 RECOMENDACIÓN DE EVALUACIÓN CLÍNICA',
        message: 'Se han detectado umbrales de pérdida moderada a severa (> 40 dB HL). Le sugerimos consultar a un médico especialista en audición para evaluar el uso de audífonos graduados.',
        timestamp: now,
        actionRequired: false,
        suggestedAction: { type: 'SCHEDULE_CHECKUP' },
      });
    }

    // 4. Recomendación General de Salud Auditiva
    alerts.push({
      id: `alert-general-${now}`,
      category: 'GENERAL_HEALTH_ADVICE',
      title: '🎧 CONSEJO DE SALUD AUDITIVA',
      message: 'Evite el uso continuo de auriculares a volumen máximo. Esta herramienta es una alternativa de accesibilidad digital y no sustituye el criterio ni la opinión médica profesional.',
      timestamp: now,
    });

    return alerts;
  }
}
