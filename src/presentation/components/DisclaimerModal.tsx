import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface DisclaimerModalProps {
  visible: boolean;
  onAccept: () => void;
  cardBg: string;
  textColor: string;
}

export const DisclaimerModal: React.FC<DisclaimerModalProps> = ({
  visible,
  onAccept,
  cardBg,
  textColor,
}) => {
  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: cardBg }]}>
          <Text style={styles.icon}>🩺</Text>
          <Text style={styles.title}>Aviso Importante de Salud Auditiva</Text>
          
          <Text style={[styles.bodyText, { color: textColor }]}>
            Esta aplicación es una alternativa de accesibilidad digital diseñada para compensar el confort sonoro en dispositivos digitales.
            {'\n\n'}
            <Text style={{ fontWeight: 'bold' }}>
              En ningún caso esta herramienta sustituye el criterio, diagnóstico o tratamiento de un profesional de la salud auditiva.
            </Text>
            {'\n\n'}
            Si experimenta molestias, dolor, tinitus o una pérdida auditiva súbita, le recomendamos encarecidamente consultar a un médico especialista.
          </Text>

          <TouchableOpacity
            style={styles.acceptButton}
            onPress={onAccept}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Entendido y Acepto las Condiciones"
          >
            <Text style={styles.acceptButtonText}>ENTENDIDO Y ACEPTO</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fbbf24',
  },
  icon: {
    fontSize: 40,
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fbbf24',
    textAlign: 'center',
    marginBottom: 16,
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  acceptButton: {
    width: '100%',
    height: 52,
    backgroundColor: '#fbbf24',
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#121824',
  },
});
