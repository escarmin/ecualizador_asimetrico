import { EarSide } from './AudioProfile';

/**
 * Estado en tiempo real del barrido audiométrico (Auto-Examen).
 */
export interface AudiometricTestState {
  isActive: boolean;
  currentEar: EarSide;
  currentFreqIndex: number;
  currentVolumeHL: number;
  isComplete: boolean;
}

export function createInitialTestState(): AudiometricTestState {
  return {
    isActive: false,
    currentEar: 'left',
    currentFreqIndex: 0,
    currentVolumeHL: 0,
    isComplete: false,
  };
}
