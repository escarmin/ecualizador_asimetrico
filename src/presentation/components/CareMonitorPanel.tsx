import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { HealthAlert } from '../../domain/entities/HealthAlert';

interface CareMonitorPanelProps {
  visible: boolean;
  onClose: () => void;
  alerts: HealthAlert[];
  onMarkAllAsRead: () => void;
  cardBg: string;
  textColor: string;
}

export const CareMonitorPanel: React.FC<CareMonitorPanelProps> = ({
  visible,
  onClose,
  alerts,
  onMarkAllAsRead,
  cardBg,
  textColor,
}) => {
  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: cardBg }]}>
          {/* Cabecera del Panel de Notificaciones */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.bellIcon}>🔔</Text>
              <Text style={styles.title}>Notificaciones de Salud Auditiva</Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Cerrar panel de notificaciones"
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Lista de Alertas */}
          <ScrollView style={styles.scrollList}>
            {alerts.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: textColor }]}>
                  No tienes notificaciones pendientes. ¡Tu salud auditiva está al día!
                </Text>
              </View>
            ) : (
              alerts.map((alert) => {
                let borderColor = '#3A3A3C';
                let badgeColor = '#94a3b8';

                if (alert.category === 'EXPOSURE_WARNING') {
                  borderColor = '#ef4444';
                  badgeColor = '#ef4444';
                } else if (alert.category === 'MEDICAL_CHECKUP_RECOMMENDED') {
                  borderColor = '#fbbf24';
                  badgeColor = '#fbbf24';
                } else if (alert.category === 'GENERAL_HEALTH_ADVICE') {
                  borderColor = '#06b6d4';
                  badgeColor = '#06b6d4';
                }

                return (
                  <View
                    key={alert.id}
                    style={[styles.alertCard, { borderColor }]}
                    accessible={true}
                    accessibilityRole="text"
                    accessibilityLabel={`${alert.title}: ${alert.message}`}
                  >
                    <Text style={[styles.alertTitle, { color: badgeColor }]}>{alert.title}</Text>
                    <Text style={[styles.alertMessage, { color: textColor }]}>{alert.message}</Text>
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Pie de modal con botón de marcar como leídas */}
          {alerts.length > 0 && (
            <TouchableOpacity
              style={styles.markReadButton}
              onPress={onMarkAllAsRead}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Marcar todas las notificaciones como leídas"
            >
              <Text style={styles.markReadButtonText}>Marcar Notificaciones como Leídas</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    width: '100%',
    maxHeight: '80%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#06b6d4',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A3C',
    paddingBottom: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bellIcon: {
    fontSize: 22,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#06b6d4',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scrollList: {
    marginBottom: 16,
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  alertCard: {
    padding: 14,
    borderRadius: 10,
    borderLeftWidth: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    marginBottom: 12,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  alertMessage: {
    fontSize: 15,
    lineHeight: 22,
  },
  markReadButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: '#06b6d4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  markReadButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#121824',
  },
});
