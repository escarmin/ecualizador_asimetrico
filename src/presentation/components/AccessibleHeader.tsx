import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface AccessibleHeaderProps {
  isEngineActive: boolean;
  onToggleEngine: () => void;
  unreadNotificationsCount: number;
  onOpenNotifications: () => void;
  textColor: string;
  cardBg: string;
}

export const AccessibleHeader: React.FC<AccessibleHeaderProps> = ({
  isEngineActive,
  onToggleEngine,
  unreadNotificationsCount,
  onOpenNotifications,
  textColor,
  cardBg,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipOpacity = useRef(new Animated.Value(0)).current;

  const handleToggle = () => {
    onToggleEngine();
    // Mostrar tooltip breve
    setShowTooltip(true);
    Animated.sequence([
      Animated.timing(tooltipOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1400),
      Animated.timing(tooltipOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setShowTooltip(false));
  };

  return (
    <View style={styles.headerContainer}>
      {/* Fila superior: título + iconos de acción */}
      <View style={styles.topRow}>
        <View style={styles.titleWrapper}>
          <Text
            style={[styles.title, { color: textColor }]}
            accessible={true}
            accessibilityRole="header"
            accessibilityLabel="Ecualizador Audiométrico Estéreo Asimétrico"
          >
            Easy Audio
          </Text>
          <Text style={[styles.subtitle, { color: textColor }]}>
            Ecualizador Audiométrico Estéreo Inteligente con 3 perfiles de memoria
          </Text>
        </View>

        {/* Grupo de iconos de acción: Encendido + Notificaciones */}
        <View style={styles.iconGroup}>

          {/* Botón de Encendido / Apagado */}
          <View style={styles.powerButtonWrapper}>
            <TouchableOpacity
              style={[
                styles.iconButton,
                isEngineActive ? styles.powerButtonOn : styles.powerButtonOff,
              ]}
              onPress={handleToggle}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={isEngineActive ? 'Ecualizador activo. Presiona para apagar.' : 'Ecualizador apagado. Presiona para encender.'}
              accessibilityHint="Activa o desactiva el motor de procesamiento estéreo"
            >
              {/* Icono ⏻ Power */}
              <Text style={[styles.powerIcon, { color: isEngineActive ? '#FFFFFF' : '#94a3b8' }]}>
                ⏻
              </Text>
            </TouchableOpacity>

            {/* Tooltip flotante */}
            {showTooltip && (
              <Animated.View style={[styles.tooltip, { opacity: tooltipOpacity }]}>
                <Text style={styles.tooltipText}>
                  {isEngineActive ? '🟢 Encendido' : '⭘ Apagado'}
                </Text>
              </Animated.View>
            )}
          </View>

          {/* Botón de Campana de Notificaciones */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onOpenNotifications}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Notificaciones de salud auditiva, ${unreadNotificationsCount} no leídas`}
            accessibilityHint="Abre el panel del Monitor de Cuidados y Notificaciones de Salud Auditiva"
          >
            <Text style={styles.bellIconText}>🔔</Text>

            {/* Badge de contador */}
            {unreadNotificationsCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Indicador de estado compacto debajo del título */}
      <View style={[styles.statusBar, { backgroundColor: isEngineActive ? 'rgba(5,150,105,0.15)' : 'rgba(148,163,184,0.1)', borderColor: isEngineActive ? '#059669' : '#475569' }]}>
        <View style={[styles.statusDot, { backgroundColor: isEngineActive ? '#10b981' : '#475569' }]} />
        <Text style={[styles.statusText, { color: isEngineActive ? '#10b981' : '#64748b' }]}>
          {isEngineActive ? 'Motor de audio activo · procesando señal estéreo' : 'Motor apagado · activa para comenzar a ecualizar'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  titleWrapper: {
    flex: 1,
    paddingRight: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 30,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 2,
  },
  iconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  powerButtonWrapper: {
    position: 'relative',
  },
  iconButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  powerButtonOn: {
    backgroundColor: '#059669',
    borderColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 6,
  },
  powerButtonOff: {
    backgroundColor: 'rgba(71, 85, 105, 0.3)',
    borderColor: '#475569',
  },
  powerIcon: {
    fontSize: 26,
    fontWeight: 'bold',
    lineHeight: 30,
  },
  bellIconText: {
    fontSize: 24,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#ef4444',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 2,
    borderColor: '#121824',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  tooltip: {
    position: 'absolute',
    bottom: -34,
    left: '50%',
    transform: [{ translateX: -48 }],
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    zIndex: 999,
    minWidth: 96,
    alignItems: 'center',
  },
  tooltipText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: 'bold',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
