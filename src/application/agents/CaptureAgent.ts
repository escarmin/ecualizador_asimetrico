import { EarConfig, ProfilesMap, createDefaultProfiles } from '../../domain/entities/AudioProfile';
import { FeedbackHistory, FeedbackLogEntry, FeedbackType, SuggestionDecision, createEmptyFeedbackHistory } from '../../domain/entities/FeedbackLog';
import { Repository } from '../../domain/repositories/Repository';

const PROFILES_STORAGE_KEY = 'audiometria_profiles';
const ACTIVE_PROFILE_KEY = 'audiometria_active_profile';
const FEEDBACK_HISTORY_KEY = 'audiometria_feedback_history';

/**
 * Agente de Captura: Se encarga del registro continuo de perfiles de ganancia,
 * auto-exámenes y eventos de retroalimentación rápida con timestamp.
 */
export class CaptureAgent {
  constructor(
    private profilesRepo: Repository<ProfilesMap>,
    private configRepo: Repository<{ activeProfile: string }>,
    private feedbackRepo: Repository<FeedbackHistory>
  ) {}

  /**
   * Carga todos los perfiles de la memoria persistente local.
   */
  async loadProfiles(): Promise<ProfilesMap> {
    const saved = await this.profilesRepo.get(PROFILES_STORAGE_KEY);
    if (!saved) {
      const defaults = createDefaultProfiles();
      await this.profilesRepo.set(PROFILES_STORAGE_KEY, defaults);
      return defaults;
    }
    return saved;
  }

  /**
   * Carga el perfil activo seleccionado ('1', '2' o '3').
   */
  async loadActiveProfileSlot(): Promise<string> {
    const saved = await this.configRepo.get(ACTIVE_PROFILE_KEY);
    return saved?.activeProfile || '1';
  }

  /**
   * Guarda el slot activo.
   */
  async setActiveProfileSlot(slot: string): Promise<void> {
    await this.configRepo.set(ACTIVE_PROFILE_KEY, { activeProfile: slot });
  }

  /**
   * Actualiza el valor de una banda específica ajustándolo a pasos discretos de 5 dB (0 a 80 dB).
   */
  async updateBandGain(
    slot: string,
    side: 'left' | 'right',
    bandIndex: number,
    lossDbHL: number
  ): Promise<ProfilesMap> {
    const profiles = await this.loadProfiles();
    if (!profiles[slot]) {
      profiles[slot] = createDefaultProfiles()['1'];
    }

    // Cuantizar a pasos discretos de 5 dB (ej. 0, 5, 10, 15, ..., 80)
    const discretizedDb = Math.max(0, Math.min(80, Math.round(lossDbHL / 5) * 5));
    profiles[slot][side][bandIndex] = discretizedDb;

    await this.profilesRepo.set(PROFILES_STORAGE_KEY, profiles);
    return profiles;
  }

  /**
   * Guarda la configuración completa de un perfil (ej. tras finalizar el auto-examen).
   */
  async saveFullProfile(slot: string, earConfig: EarConfig): Promise<ProfilesMap> {
    const profiles = await this.loadProfiles();
    profiles[slot] = earConfig;
    await this.profilesRepo.set(PROFILES_STORAGE_KEY, profiles);
    return profiles;
  }

  /**
   * Registra un evento de feedback rápido ("Muy Estridente" o "Imperceptible") con timestamp.
   */
  async logFeedbackEvent(
    slot: string,
    type: FeedbackType,
    freqHz: number,
    freqIndex: number,
    deltaDb: number,
    decision: SuggestionDecision
  ): Promise<FeedbackHistory> {
    let history = await this.feedbackRepo.get(FEEDBACK_HISTORY_KEY);
    if (!history) {
      history = createEmptyFeedbackHistory();
    }

    const newEntry: FeedbackLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: Date.now(),
      type,
      frequencyHz: freqHz,
      frequencyIndex: freqIndex,
      deltaAppliedDb: deltaDb,
      status: decision,
      profileSlot: slot,
    };

    history.logs.push(newEntry);
    if (type === 'estridente') history.totalEstridenteCount++;
    else history.totalInaudibleCount++;

    await this.feedbackRepo.set(FEEDBACK_HISTORY_KEY, history);
    return history;
  }

  /**
   * Carga el historial de feedback.
   */
  async getFeedbackHistory(): Promise<FeedbackHistory> {
    const history = await this.feedbackRepo.get(FEEDBACK_HISTORY_KEY);
    return history || createEmptyFeedbackHistory();
  }
}
