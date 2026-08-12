import React, { useRef, useState } from 'react';
import { Animated, LayoutAnimation, Platform, StyleSheet, Text, TouchableOpacity, UIManager, View } from 'react-native';

// Habilitar LayoutAnimation en Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface CollapsibleSectionProps {
  title: string;
  icon: string;
  accentColor: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  badge?: string | null;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon,
  accentColor,
  children,
  defaultExpanded = true,
  badge = null,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const spinAnim = useRef(new Animated.Value(defaultExpanded ? 1 : 0)).current;

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    Animated.timing(spinAnim, {
      toValue: expanded ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    setExpanded(!expanded);
  };

  const rotateZ = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  return (
    <View style={[styles.container, { borderLeftColor: accentColor }]}>
      {/* Cabecera tocable */}
      <TouchableOpacity
        style={styles.header}
        onPress={toggle}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`${expanded ? 'Contraer' : 'Expandir'} sección ${title}`}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.headerIcon}>{icon}</Text>
          <Text style={[styles.headerTitle, { color: accentColor }]}>{title}</Text>
          {badge && (
            <View style={[styles.badgePill, { backgroundColor: accentColor }]}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          )}
        </View>

        <Animated.Text style={[styles.chevron, { transform: [{ rotateZ }] }]}>
          ▸
        </Animated.Text>
      </TouchableOpacity>

      {/* Contenido colapsable */}
      {expanded && (
        <View style={styles.body}>
          {children}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    borderRadius: 10,
    borderLeftWidth: 4,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.5)',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  headerIcon: {
    fontSize: 18,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badgePill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  chevron: {
    fontSize: 18,
    color: '#94a3b8',
    marginLeft: 8,
  },
  body: {
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
});
