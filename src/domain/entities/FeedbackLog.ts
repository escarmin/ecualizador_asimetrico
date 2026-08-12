export type FeedbackType = 'estridente' | 'inaudible';

export type SuggestionDecision = 'applied' | 'ignored';

/**
 * Registro con timestamp de interacción de feedback rápido y decisiones tomadas.
 */
export interface FeedbackLogEntry {
  id: string;
  timestamp: number;
  type: FeedbackType;
  frequencyHz: number;
  frequencyIndex: number;
  deltaAppliedDb: number;
  status: SuggestionDecision;
  profileSlot: string;
}

/**
 * Historial completo de retroalimentación persistida.
 */
export interface FeedbackHistory {
  logs: FeedbackLogEntry[];
  totalEstridenteCount: number;
  totalInaudibleCount: number;
}

export function createEmptyFeedbackHistory(): FeedbackHistory {
  return {
    logs: [],
    totalEstridenteCount: 0,
    totalInaudibleCount: 0,
  };
}
