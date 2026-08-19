import { CLINICAL_FREQUENCIES, EarConfig, EarSide } from '../../domain/entities/AudioProfile';
import { AudioEngineService } from '../../domain/services/AudioEngineService';
import { NativeModules, Platform } from 'react-native';

export type AudioMode = 'global' | 'ambient';

/**
 * Motor de audio: Web Audio API en browser, módulo nativo en Android.
 */
export class WebAudioEngineServiceImpl implements AudioEngineService {
  private audioContext: AudioContext | null = null;
  private splitter: ChannelSplitterNode | null = null;
  private merger: ChannelMergerNode | null = null;
  private analyser: AnalyserNode | null = null;
  private filtersLeft: BiquadFilterNode[] = [];
  private filtersRight: BiquadFilterNode[] = [];
  private testOscillator: OscillatorNode | null = null;
  private testGainNode: GainNode | null = null;
  private isEngineActive: boolean = false;
  private audioMode: AudioMode = 'global';

  /** Seleccionar modo antes de llamar a startEngine() */
  setAudioMode(mode: AudioMode) {
    this.audioMode = mode;
  }

  async startEngine(config: EarConfig): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        try {
          if (this.audioMode === 'ambient') {
            const leftGains  = CLINICAL_FREQUENCIES.map((_, i) => config.left[i]  || 0);
            const rightGains = CLINICAL_FREQUENCIES.map((_, i) => config.right[i] || 0);
            await NativeModules.NativeAudioEngine.startAmbientEqualizer(leftGains, rightGains);
          } else {
            await NativeModules.NativeAudioEngine.startGlobalEqualizer();
            const avgGains = CLINICAL_FREQUENCIES.map((_, i) =>
              ((config.left[i] || 0) + (config.right[i] || 0)) / 2);
            await NativeModules.NativeAudioEngine.applyGlobalConfig(avgGains);
          }
          this.isEngineActive = true;
          return true;
        } catch (e) {
          console.error('[AudioEngine] Error al iniciar:', e);
          return false;
        }
      }

      if (typeof window === 'undefined') return false;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return false;

      if (!this.audioContext) {
        this.audioContext = new AudioContextClass();
      }

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;

      this.splitter = this.audioContext.createChannelSplitter(2);
      this.merger = this.audioContext.createChannelMerger(2);

      this.filtersLeft = [];
      this.filtersRight = [];

      // 🔵 Oído Izquierdo (Canal 0)
      let lastNodeLeft: AudioNode = this.splitter;
      CLINICAL_FREQUENCIES.forEach((freq, index) => {
        const filter = this.audioContext!.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.value = freq;
        filter.Q.value = 1.0;
        filter.gain.value = Math.round((config.left[index] ?? 0) * 0.6);
        this.filtersLeft.push(filter);
        if (index === 0) this.splitter!.connect(filter, 0);
        else lastNodeLeft.connect(filter);
        lastNodeLeft = filter;
      });
      lastNodeLeft.connect(this.merger, 0, 0);

      // 🔴 Oído Derecho (Canal 1)
      let lastNodeRight: AudioNode = this.splitter;
      CLINICAL_FREQUENCIES.forEach((freq, index) => {
        const filter = this.audioContext!.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.value = freq;
        filter.Q.value = 1.0;
        filter.gain.value = Math.round((config.right[index] ?? 0) * 0.6);
        this.filtersRight.push(filter);
        if (index === 0) this.splitter!.connect(filter, 1);
        else lastNodeRight.connect(filter);
        lastNodeRight = filter;
      });
      lastNodeRight.connect(this.merger, 0, 1);

      this.merger.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);

      this.isEngineActive = true;
      return true;
    } catch (error) {
      console.error('[WebAudioEngine] Error al inicializar:', error);
      return false;
    }
  }

  async stopEngine(): Promise<void> {
    if (Platform.OS === 'android') {
      await this.stopTestTone();
      try {
        if (this.audioMode === 'ambient') {
          await NativeModules.NativeAudioEngine.stopAmbientEqualizer();
        } else {
          await NativeModules.NativeAudioEngine.stopGlobalEqualizer();
        }
      } catch(e) {}
      this.isEngineActive = false;
      return;
    }

    if (this.audioContext) {
      await this.stopTestTone();
      this.audioContext.close();
      this.audioContext = null;
    }
    this.isEngineActive = false;
  }

  async updateFilter(side: EarSide, index: number, lossDbHL: number): Promise<void> {
    const gainValue = Math.round(lossDbHL * 0.6);
    if (side === 'left' && this.filtersLeft[index]) {
      this.filtersLeft[index].gain.value = gainValue;
    } else if (side === 'right' && this.filtersRight[index]) {
      this.filtersRight[index].gain.value = gainValue;
    }
  }

  async applyFullConfig(config: EarConfig): Promise<void> {
    if (Platform.OS === 'android') {
      try {
        if (this.audioMode === 'ambient') {
          const leftGains  = CLINICAL_FREQUENCIES.map((_, i) => config.left[i]  || 0);
          const rightGains = CLINICAL_FREQUENCIES.map((_, i) => config.right[i] || 0);
          await NativeModules.NativeAudioEngine.updateAmbientConfig(leftGains, rightGains);
        } else {
          const avgGains = CLINICAL_FREQUENCIES.map((_, i) =>
            ((config.left[i] || 0) + (config.right[i] || 0)) / 2);
          await NativeModules.NativeAudioEngine.applyGlobalConfig(avgGains);
        }
      } catch(e) {}
      return;
    }

    CLINICAL_FREQUENCIES.forEach((_, index) => {
      const leftVal  = config.left[index]  ?? 0;
      const rightVal = config.right[index] ?? 0;
      if (this.filtersLeft[index])  this.filtersLeft[index].gain.value  = Math.round(leftVal  * 0.6);
      if (this.filtersRight[index]) this.filtersRight[index].gain.value = Math.round(rightVal * 0.6);
    });
  }

  async playTestTone(frequencyHz: number, ear: EarSide, gainDbFS: number): Promise<void> {
    if (Platform.OS === 'android') {
      try { await NativeModules.NativeAudioEngine.playTestTone(frequencyHz, ear, gainDbFS); } catch(e) {}
      return;
    }

    await this.stopTestTone();
    if (!this.audioContext) {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) this.audioContext = new AudioContextClass();
    }
    if (!this.audioContext) return;
    if (this.audioContext.state === 'suspended') await this.audioContext.resume();

    this.testOscillator = this.audioContext.createOscillator();
    this.testGainNode   = this.audioContext.createGain();
    this.testOscillator.type = 'sine';
    this.testOscillator.frequency.value = frequencyHz;
    this.testGainNode.gain.value = Math.pow(10, gainDbFS / 20);
    this.testOscillator.connect(this.testGainNode);

    if (this.merger) {
      this.testGainNode.connect(this.merger, 0, ear === 'left' ? 0 : 1);
    } else {
      this.testGainNode.connect(this.audioContext.destination);
    }
    this.testOscillator.start();
  }

  async stopTestTone(): Promise<void> {
    if (Platform.OS === 'android') {
      try { await NativeModules.NativeAudioEngine.stopTestTone(); } catch(e) {}
      return;
    }
    if (this.testOscillator) {
      try { this.testOscillator.stop(); this.testOscillator.disconnect(); } catch (e) {}
      this.testOscillator = null;
    }
    if (this.testGainNode) { this.testGainNode.disconnect(); this.testGainNode = null; }
  }

  async analyzeSpectrum(): Promise<{ dominantIndex: number; maxAmplitude: number }> {
    if (!this.audioContext || !this.analyser) return { dominantIndex: 4, maxAmplitude: 0 };
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray    = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);
    const sampleRate = this.audioContext.sampleRate;
    let maxVal = -1;
    let dominantIndex = 4;
    CLINICAL_FREQUENCIES.forEach((freq, index) => {
      const bin = Math.round((freq * 2048) / sampleRate);
      if (bin < bufferLength) {
        const avg = ((dataArray[bin - 1] ?? 0) + (dataArray[bin] ?? 0) + (dataArray[bin + 1] ?? 0)) / 3;
        if (avg > maxVal) { maxVal = avg; dominantIndex = index; }
      }
    });
    return { dominantIndex, maxAmplitude: maxVal < 5 ? 0 : maxVal };
  }
}
