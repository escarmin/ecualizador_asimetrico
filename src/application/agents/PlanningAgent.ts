/**
 * Agente de Planificación: Gestiona y programa la ejecución periódica de análisis
 * sobre la actividad auditiva registrada.
 */
export class PlanningAgent {
  private lastAnalysisTimestamp: number = 0;
  private readonly ANALYSIS_INTERVAL_MS = 24 * 60 * 60 * 1000; // Análisis diario

  /**
   * Determina si ha transcurrido el tiempo necesario para ejecutar un análisis de rutina.
   */
  shouldRunPeriodicAnalysis(): boolean {
    const now = Date.now();
    return now - this.lastAnalysisTimestamp >= this.ANALYSIS_INTERVAL_MS;
  }

  /**
   * Registra la ejecución de un ciclo de análisis.
   */
  markAnalysisExecuted(): void {
    this.lastAnalysisTimestamp = Date.now();
  }

  /**
   * Determina si se requiere un análisis inmediato por alta frecuencia de interacción.
   */
  shouldTriggerImmediateAnalysis(feedbackCount: number): boolean {
    return feedbackCount >= 3;
  }
}
