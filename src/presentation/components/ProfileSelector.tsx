import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

interface ProfileSelectorProps {
  activeSlot: string;
  onSelectSlot: (slot: string) => void;
  textColor: string;
  cardBg: string;
  primaryColor: string;
}

export const ProfileSelector: React.FC<ProfileSelectorProps> = ({
  activeSlot,
  onSelectSlot,
  textColor,
  cardBg,
  primaryColor,
}) => {
  const slots = [
    { key: '1', label: 'Perfil 1' },
    { key: '2', label: 'Perfil 2' },
    { key: '3', label: '🩺 Perfil Clínico' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: cardBg }]}>

      <View style={styles.tabsContainer}>
        {slots.map((slot) => {
          const isActive = activeSlot === slot.key;
          const isClinical = slot.key === '3';

          const buttonStyle: ViewStyle[] = [styles.tabButtonBase];
          if (isActive) {
            buttonStyle.push(isClinical ? styles.tabButtonClinicalActive : styles.tabButtonActive);
          } else {
            buttonStyle.push(styles.tabButtonInactive);
          }

          return (
            <TouchableOpacity
              key={slot.key}
              style={[
                buttonStyle,
                isActive && !isClinical ? { backgroundColor: primaryColor } : null,
              ]}
              onPress={() => onSelectSlot(slot.key)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Seleccionar ${slot.label}`}
              accessibilityState={{ selected: isActive }}
            >
              <Text
                style={[
                  styles.tabText,
                  isActive ? styles.tabTextActive : { color: textColor },
                ]}
              >
                {slot.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tabButtonBase: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabButtonInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  tabButtonActive: {
    backgroundColor: '#0033CC',
  },
  tabButtonClinicalActive: {
    backgroundColor: '#d97706',
    borderColor: '#fbbf24',
    borderWidth: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
});
