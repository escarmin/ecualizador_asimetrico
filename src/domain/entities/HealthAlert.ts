export type AlertCategory = 
  | 'EXPOSURE_WARNING' 
  | 'MEDICAL_CHECKUP_RECOMMENDED' 
  | 'FREQUENCY_IMPROVEMENT_SUGGESTION' 
  | 'GENERAL_HEALTH_ADVICE';

export interface HealthAlert {
  id: string;
  category: AlertCategory;
  title: string;
  message: string;
  timestamp: number;
  actionRequired?: boolean;
  suggestedAction?: {
    type: 'APPLY_GAIN_SUGGESTION' | 'SCHEDULE_CHECKUP' | 'TAKE_AUDIO_REST';
    payload?: any;
  };
}

export interface ExposureMetrics {
  currentVolumeDb: number;
  continuousHoursOver84dB: number;
  lastExposureTimestamp: number;
}
