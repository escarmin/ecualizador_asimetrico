import { CLINICAL_FREQUENCIES, EarConfig, EarSide } from '../../domain/entities/AudioProfile';
import { AudioEngineService } from '../../domain/services/AudioEngineService';

/**
 * Implementación del motor de audio basada en Web Audio API (para entorno Web y pruebas de UI).
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

  async startEngine(config: EarConfig): Promise<boolean> {
    try {
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

        const lossVal = config.left[index] ?? 0;
        filter.gain.value = Math.round(lossVal * 0.6);

        this.filtersLeft.push(filter);

        if (index === 0) {
          this.splitter!.connect(filter, 0);
        } else {
          lastNodeLeft.connect(filter);
        }
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

        const lossVal = config.right[index] ?? 0;
        filter.gain.value = Math.round(lossVal * 0.6);

        this.filtersRight.push(filter);

        if (index === 0) {
          this.splitter!.connect(filter, 1);
        } else {
          lastNodeRight.connect(filter);
        }
        lastNodeRight = filter;
      });
      lastNodeRight.connect(this.merger, 0, 1);

      this.merger.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);

      this.isEngineActive = true;
      console.log('[WebAudioEngine] Motor de audio inicializado correctamente.');
      return true;
    } catch (error) {
      console.error('[WebAudioEngine] Error al inicializar:', error);
      return false;
    }
  }

  async stopEngine(): Promise<void> {
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
    CLINICAL_FREQUENCIES.forEach((_, index) => {
      const leftVal = config.left[index] ?? 0;
      const rightVal = config.right[index] ?? 0;
      if (this.filtersLeft[index]) {
        this.filtersLeft[index].gain.value = Math.round(leftVal * 0.6);
      }
      if (this.filtersRight[index]) {
        this.filtersRight[index].gain.value = Math.round(rightVal * 0.6);
      }
    });
  }

  async playTestTone(frequencyHz: number, ear: EarSide, gainDbFS: number): Promise<void> {
    await this.stopTestTone();

    if (!this.audioContext) {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) this.audioContext = new AudioContextClass();
    }
    if (!this.audioContext) return;

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    this.testOscillator = this.audioContext.createOscillator();
    this.testGainNode = this.audioContext.createGain();

    this.testOscillator.type = 'sine';
    this.testOscillator.frequency.value = frequencyHz;

    const linearGain = Math.pow(10, gainDbFS / 20);
    this.testGainNode.gain.value = linearGain;

    this.testOscillator.connect(this.testGainNode);

    if (this.merger) {
      const outputChannel = ear === 'left' ? 0 : 1;
      this.testGainNode.connect(this.merger, 0, outputChannel);
    } else {
      this.testGainNode.connect(this.audioContext.destination);
    }

    this.testOscillator.start();
  }

  async stopTestTone(): Promise<void> {
    if (this.testOscillator) {
      try {
        this.testOscillator.stop();
        this.testOscillator.disconnect();
      } catch (e) {}
      this.testOscillator = null;
    }
    if (this.testGainNode) {
      this.testGainNode.disconnect();
      this.testGainNode = null;
    }
  }

  async analyzeSpectrum(): Promise<{ dominantIndex: number; maxAmplitude: number }> {
    if (!this.audioContext || !this.analyser) {
      return { dominantIndex: 4, maxAmplitude: 0 }; // Default 1000 Hz (index 4)
    }

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);

    const sampleRate = this.audioContext.sampleRate;
    let maxVal = -1;
    let dominantIndex = 4; // Banda central de 1 kHz por defecto

    CLINICAL_FREQUENCIES.forEach((freq, index) => {
      const bin = Math.round((freq * 2048) / sampleRate);
      if (bin < bufferLength) {
        const val1 = dataArray[bin - 1] ?? 0;
        const val2 = dataArray[bin] ?? 0;
        const val3 = dataArray[bin + 1] ?? 0;
        const avgAmp = (val1 + val2 + val3) / 3;

        if (avgAmp > maxVal) {
          maxVal = avgAmp;
          dominantIndex = index;
        }
      }
    });

    if (maxVal < 5) {
      return { dominantIndex: 4, maxAmplitude: maxVal };
    }

    return { dominantIndex, maxAmplitude: maxVal };
  }
}
