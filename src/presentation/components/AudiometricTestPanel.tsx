import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CLINICAL_FREQUENCIES } from '../../domain/entities/AudioProfile';
import { AudiometricTestState } from '../../domain/entities/AudiometricTestState';

interface AudiometricTestPanelProps {
  testState: AudiometricTestState;
  onStartTest: () => void;
  onHearTone: () => void;
  onAbortTest: () => void;
  textColor: string;
  cardBg: string;
}

export const AudiometricTestPanel: React.FC<AudiometricTestPanelProps> = ({
  testState,
  onStartTest,
  onHearTone,
  onAbortTest,
  textColor,
  cardBg,
}) => {
  const { isActive, currentEar, currentFreqIndex, currentVolumeHL } = testState;
  const currentFreqHz = CLINICAL_FREQUENCIES[currentFreqIndex] ?? 125;
  const freqDisplay = currentFreqHz >= 1000 ? `${currentFreqHz / 1000} kHz` : `${currentFreqHz} Hz`;

  return (
    <View style={[styles.container, { backgroundColor: cardBg }]}>
      <View style={styles.headerRow}>
        <Text style={styles.headerIcon}>🩺</Text>
        <Text style={styles.headerTitle}>ASISTENTE DE BARRIDO AUDIOMÉTRICO</Text>
      </View>

      {!isActive ? (
        <View style={styles.idleContainer}>
          <Text style={[styles.descriptionText, { color: textColor }]}>
            Autodiagnostica tu umbral auditivo estéreo paso a paso. Se emitirá un tono puro en cada oído.
          </Text>
          <TouchableOpacity
            style={styles.startButton}
            onPress={onStartTest}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Iniciar Examen Audiométrico"
          >
            <Text style={styles.startButtonText}>Iniciar Examen</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.activeContainer}>
          <View
            style={[
              styles.earBadge,
              currentEar === 'left' ? styles.leftBadge : styles.rightBadge,
            ]}
          >
            <Text style={styles.earBadgeText}>
              {currentEar === 'left' ? 'OÍDO IZQUIERDO' : 'OÍDO DERECHO'}
            </Text>
          </View>

          <Text style={[styles.freqText, { color: textColor }]}>
            Frecuencia: {freqDisplay}
          </Text>

          <Text style={styles.volumeText}>
            Intensidad: {Math.round(currentVolumeHL)} dB HL
          </Text>

          {/* Barra de progreso de volumen */}
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressBar,
                { width: `${Math.min(100, (currentVolumeHL / 80) * 100)}%` },
              ]}
            />
          </View>

          {/* Botón Principal: ¡LO ESCUCHO! */}
          <TouchableOpacity
            style={styles.hearButton}
            onPress={onHearTone}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="¡Lo escucho!"
            accessibilityHint="Presiona este botón tan pronto como comiences a percibir el tono en tu oído"
          >
            <Text style={styles.hearButtonText}>¡LO ESCUCHO!</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.abortButton} onPress={onAbortTest}>
            <Text style={styles.abortButtonText}>Cancelar Examen</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fbbf24',
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  headerIcon: {
    fontSize: 20,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fbbf24',
    letterSpacing: 0.5,
  },
  idleContainer: {
    alignItems: 'center',
  },
  descriptionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 22,
  },
  startButton: {
    borderWidth: 1,
    borderColor: '#fbbf24',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fbbf24',
  },
  activeContainer: {
    alignItems: 'center',
  },
  earBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  leftBadge: {
    backgroundColor: '#3b82f6',
  },
  rightBadge: {
    backgroundColor: '#ef4444',
  },
  earBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  freqText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  volumeText: {
    fontSize: 16,
    color: '#fbbf24',
    marginBottom: 10,
  },
  progressTrack: {
    width: '100%',
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#06b6d4',
  },
  hearButton: {
    width: '90%',
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    marginBottom: 12,
  },
  hearButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  abortButton: {
    padding: 8,
  },
  abortButtonText: {
    fontSize: 14,
    color: '#94a3b8',
    textDecorationLine: 'underline',
  },
});
