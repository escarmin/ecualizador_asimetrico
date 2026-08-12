import React, { useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SpectralSuggestion } from '../../application/agents/AnalysisAgent';
import { FeedbackType } from '../../domain/entities/FeedbackLog';

interface FeedbackPanelProps {
  onTriggerFeedback: (type: FeedbackType) => void;
  pendingSuggestion: SpectralSuggestion | null;
  onApplySuggestion: () => void;
  onIgnoreSuggestion: () => void;
  cardBg: string;
  textColor: string;
}

export const FeedbackPanel: React.FC<FeedbackPanelProps> = ({
  onTriggerFeedback,
  pendingSuggestion,
  onApplySuggestion,
  onIgnoreSuggestion,
  cardBg,
  textColor,
}) => {
  const scaleEstridente = useRef(new Animated.Value(1)).current;
  const scaleInaudible = useRef(new Animated.Value(1)).current;

  const animatePress = (scaleRef: Animated.Value, type: FeedbackType) => {
    Animated.sequence([
      Animated.timing(scaleRef, { toValue: 0.93, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleRef, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
    onTriggerFeedback(type);
  };

  return (
    <View style={styles.container}>
      {/* Botones de Feedback Rápido */}
      <View style={styles.buttonsRow}>

        {/* Muy Estridente */}
        <Animated.View style={[styles.buttonWrap, { transform: [{ scale: scaleEstridente }] }]}>
          <TouchableOpacity
            style={[styles.feedbackButton, styles.estridenteButton]}
            onPress={() => animatePress(scaleEstridente, 'estridente')}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Sonido Muy Estridente"
            accessibilityHint="Notifica que el sonido es estridente y sugiere reducir la ganancia"
            activeOpacity={0.85}
          >
            {/* Icono grande de onda sonora con exclamación */}
            <View style={styles.iconContainer}>
              <Text style={styles.iconMain}>📢</Text>
              <View style={styles.iconBadgeRed}>
                <Text style={styles.iconBadgeText}>!</Text>
              </View>
            </View>
            <Text style={styles.buttonLabel}>Muy Estridente</Text>
            <Text style={styles.buttonSubLabel}>Reducir ganancia</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Imperceptible */}
        <Animated.View style={[styles.buttonWrap, { transform: [{ scale: scaleInaudible }] }]}>
          <TouchableOpacity
            style={[styles.feedbackButton, styles.inaudibleButton]}
            onPress={() => animatePress(scaleInaudible, 'inaudible')}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Sonido Imperceptible"
            accessibilityHint="Notifica que el sonido no es audible y sugiere aumentar la ganancia"
            activeOpacity={0.85}
          >
            {/* Icono grande de oreja con punto de interrogación */}
            <View style={styles.iconContainer}>
              <Text style={styles.iconMain}>👂</Text>
              <View style={styles.iconBadgeBlue}>
                <Text style={styles.iconBadgeText}>?</Text>
              </View>
            </View>
            <Text style={styles.buttonLabel}>Imperceptible</Text>
            <Text style={styles.buttonSubLabel}>Aumentar ganancia</Text>
          </TouchableOpacity>
        </Animated.View>

      </View>

      {/* Tarjeta de Recomendación Espectral */}
      {pendingSuggestion && (
        <View style={[styles.recommendationCard, { backgroundColor: cardBg }]}>
          <View style={styles.recHeaderRow}>
            <Text style={styles.recHeaderIcon}>🤖</Text>
            <Text style={styles.recHeaderTitle}>Sugerencia del Agente de Análisis</Text>
          </View>

          <Text style={[styles.recommendationText, { color: textColor }]}>
            {pendingSuggestion.description}
          </Text>

          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.applyButton]}
              onPress={onApplySuggestion}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Aplicar sugerencia"
            >
              <Text style={styles.applyButtonText}>✓ Aplicar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.ignoreButton]}
              onPress={onIgnoreSuggestion}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Ignorar sugerencia"
            >
              <Text style={[styles.ignoreButtonText, { color: textColor }]}>✕ Ignorar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 4,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  buttonWrap: {
    flex: 1,
  },
  feedbackButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  estridenteButton: {
    backgroundColor: '#7f1d1d',
    borderWidth: 1.5,
    borderColor: '#f87171',
    shadowColor: '#f87171',
  },
  inaudibleButton: {
    backgroundColor: '#0c4a6e',
    borderWidth: 1.5,
    borderColor: '#38bdf8',
    shadowColor: '#38bdf8',
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 8,
    width: 52,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconMain: {
    fontSize: 40,
  },
  iconBadgeRed: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#7f1d1d',
  },
  iconBadgeBlue: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0ea5e9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0c4a6e',
  },
  iconBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    lineHeight: 14,
  },
  buttonLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  buttonSubLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.65)',
    marginTop: 3,
    textAlign: 'center',
  },
  recommendationCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#06b6d4',
    shadowColor: '#06b6d4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  recHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  recHeaderIcon: {
    fontSize: 18,
  },
  recHeaderTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#06b6d4',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  recommendationText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  actionButton: {
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButton: {
    backgroundColor: '#06b6d4',
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  ignoreButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#475569',
  },
  ignoreButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
