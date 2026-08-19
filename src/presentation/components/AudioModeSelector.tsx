import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AudioMode } from '../../infrastructure/audio/WebAudioEngineServiceImpl';

interface AudioModeSelectorProps {
  mode: AudioMode;
  onModeChange: (mode: AudioMode) => void;
  disabled?: boolean;
  textColor: string;
  cardBg: string;
}

export const AudioModeSelector: React.FC<AudioModeSelectorProps> = ({
  mode,
  onModeChange,
  disabled = false,
  textColor,
  cardBg,
}) => {
  return (
    <View style={[styles.container, { backgroundColor: cardBg, opacity: disabled ? 0.4 : 1 }]}>
      <Text style={[styles.label, { color: textColor }]}>Modo de ecualización</Text>
      <View style={styles.row}>

        {/* Opción A: Micrófono Ambiental */}
        <TouchableOpacity
          style={[
            styles.pill,
            mode === 'ambient'
              ? styles.pillActiveAmbient
              : styles.pillInactive,
          ]}
          onPress={() => !disabled && onModeChange('ambient')}
          accessibilityRole="button"
          accessibilityLabel="Modo Micrófono Ambiental"
          accessibilityState={{ selected: mode === 'ambient' }}
        >
          <Text style={styles.pillIcon}>🎙️</Text>
          <View>
            <Text style={[styles.pillTitle, mode === 'ambient' ? styles.pillTitleActive : { color: textColor }]}>
              Ambiente
            </Text>
            <Text style={[styles.pillSub, mode === 'ambient' ? styles.pillSubActive : { color: textColor, opacity: 0.55 }]}>
              Micrófono en{'\n'}tiempo real
            </Text>
          </View>
        </TouchableOpacity>

        {/* Opción B: Sistema Global */}
        <TouchableOpacity
          style={[
            styles.pill,
            styles.pillInactive,
            { opacity: 0.5 }
          ]}
          onPress={() => {
            // Disabled, show an alert or just do nothing
          }}
          accessibilityRole="button"
          accessibilityLabel="Modo Sistema Global - Próximamente"
          accessibilityState={{ disabled: true }}
          activeOpacity={0.8}
        >
          <Text style={styles.pillIcon}>📱</Text>
          <View>
            <Text style={[styles.pillTitle, { color: textColor }]}>
              Sistema
            </Text>
            <Text style={[styles.pillSub, { color: textColor, opacity: 0.55 }]}>
              EQ global del{'\n'}dispositivo
            </Text>
          </View>
        </TouchableOpacity>

      </View>

      {mode === 'ambient' && (
        <Text style={styles.hint}>
          🟢 Conecta auriculares y coloca el teléfono cerca del oído para escuchar el audio del entorno ecualizado.
        </Text>
      )}
      <Text style={styles.hint}>
        ⚠️ Sistema: Esta característica se lanzará próximamente.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  label: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    opacity: 0.6,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  pillInactive: {
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  pillActiveAmbient: {
    borderColor: '#22d3ee',
    backgroundColor: 'rgba(34,211,238,0.12)',
  },
  pillActiveGlobal: {
    borderColor: '#818cf8',
    backgroundColor: 'rgba(129,140,248,0.12)',
  },
  pillIcon: {
    fontSize: 22,
  },
  pillTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  pillTitleActive: {
    color: '#f8fafc',
  },
  pillSub: {
    fontSize: 10,
    marginTop: 1,
  },
  pillSubActive: {
    color: 'rgba(248,250,252,0.65)',
  },
  hint: {
    fontSize: 11,
    color: 'rgba(200,210,220,0.75)',
    marginTop: 10,
    lineHeight: 16,
  },
});
