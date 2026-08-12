import React, { useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CLINICAL_FREQUENCIES, EarConfig, EarSide } from '../../domain/entities/AudioProfile';

interface EqualizerSlidersProps {
  config: EarConfig;
  onChangeBandGain: (side: EarSide, index: number, newLossDbHL: number) => void;
  textColor: string;
  cardBg: string;
}

type EarViewMode = 'left' | 'right';

/* ─── Agrupación por Región Sonora ─── */
const getRegionTitle = (freq: number): string | null => {
  if (freq === 125) return '🔉 Graves y Bajos';
  if (freq === 1000) return '🗣️ Zona Conversacional';
  if (freq === 4000) return '🔔 Agudos y Detalle';
  return null;
};

const formatFreqLabel = (freq: number): string =>
  freq >= 1000 ? `${freq / 1000}k` : `${freq}`;

/* ─── Componente de Slider Horizontal tipo Range (Web) ─── */
const HorizontalRangeSlider: React.FC<{
  value: number;
  accentColor: string;
  side: EarSide;
  index: number;
  onChangeEnd: (side: EarSide, index: number, val: number) => void;
}> = ({ value, accentColor, side, index, onChangeEnd }) => {
  if (Platform.OS === 'web') {
    return (
      <input
        type="range"
        min={0}
        max={80}
        step={5}
        value={value}
        onChange={(e: any) => {
          onChangeEnd(side, index, parseInt(e.target.value, 10));
        }}
        style={{
          flex: 1,
          height: 14,
          cursor: 'pointer',
          accentColor,
          margin: '0 6px',
        } as any}
      />
    );
  }

  // Fallback nativo con botones +/- (React Native no tiene slider range nativo fácil)
  return (
    <View style={fbStyles.nativeSliderRow}>
      <TouchableOpacity
        style={[fbStyles.stepBtn, { borderColor: accentColor }]}
        onPress={() => onChangeEnd(side, index, value - 5)}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`Reducir a ${Math.max(0, value - 5)} dB`}
      >
        <Text style={[fbStyles.stepBtnText, { color: accentColor }]}>−</Text>
      </TouchableOpacity>

      <View style={[fbStyles.nativeTrack, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
        <View
          style={[
            fbStyles.nativeTrackFill,
            { width: `${(value / 80) * 100}%`, backgroundColor: accentColor },
          ]}
        />
      </View>

      <TouchableOpacity
        style={[fbStyles.stepBtn, { borderColor: accentColor }]}
        onPress={() => onChangeEnd(side, index, value + 5)}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`Aumentar a ${Math.min(80, value + 5)} dB`}
      >
        <Text style={[fbStyles.stepBtnText, { color: accentColor }]}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const fbStyles = StyleSheet.create({
  nativeSliderRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4, marginHorizontal: 4 },
  stepBtn: {
    width: 32, height: 32, borderRadius: 16, borderWidth: 1.5,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  stepBtnText: { fontSize: 18, fontWeight: 'bold', lineHeight: 20 },
  nativeTrack: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  nativeTrackFill: { height: '100%', borderRadius: 4 },
});

/* ─── Componente Principal ─── */
export const EqualizerSliders: React.FC<EqualizerSlidersProps> = ({
  config,
  onChangeBandGain,
  textColor,
  cardBg,
}) => {
  const [earViewMode, setEarViewMode] = useState<EarViewMode>('left');

  const renderEarColumn = (side: EarSide, title: string, color: string) => {
    const bandMap = config[side] || {};

    return (
      <View style={[styles.earCard, { backgroundColor: cardBg, borderTopColor: color }]}>
        <Text style={[styles.earTitle, { color }]}>{title}</Text>

        {CLINICAL_FREQUENCIES.map((freq, index) => {
          const currentDb = bandMap[index] ?? 0;
          const regionHeader = getRegionTitle(freq);

          return (
            <React.Fragment key={`${side}-${index}`}>
              {regionHeader && (
                <View style={styles.regionHeader}>
                  <Text style={styles.regionHeaderText}>{regionHeader}</Text>
                </View>
              )}

              <View style={styles.sliderRow}>
                <Text style={[styles.freqLabel, { color: textColor }]}>
                  {formatFreqLabel(freq)}Hz
                </Text>

                <HorizontalRangeSlider
                  value={currentDb}
                  accentColor={color}
                  side={side}
                  index={index}
                  onChangeEnd={onChangeBandGain}
                />

                <Text style={[styles.valueLabel, { color }]}>
                  {currentDb}dB
                </Text>
              </View>
            </React.Fragment>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Conmutador Izquierdo / Derecho */}
      <View style={[styles.tabBar, { backgroundColor: cardBg }]}>
        <TouchableOpacity
          style={[styles.tabButton, earViewMode === 'left' && styles.leftTabActive]}
          onPress={() => setEarViewMode('left')}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Ver Oído Izquierdo"
        >
          <Text style={[styles.tabText, earViewMode === 'left' && styles.activeTabText]}>
            🔵 Izquierdo
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, earViewMode === 'right' && styles.rightTabActive]}
          onPress={() => setEarViewMode('right')}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Ver Oído Derecho"
        >
          <Text style={[styles.tabText, earViewMode === 'right' && styles.activeTabText]}>
            🔴 Derecho
          </Text>
        </TouchableOpacity>
      </View>

      {/* Panel de sliders del oído seleccionado */}
      {earViewMode === 'left' &&
        renderEarColumn('left', '🔵 Oído Izq. (X)', '#3b82f6')}

      {earViewMode === 'right' &&
        renderEarColumn('right', '🔴 Oído Der. (O)', '#ef4444')}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 4,
    marginBottom: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: '#475569',
  },
  tabButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  leftTabActive: {
    backgroundColor: '#3b82f6',
  },
  rightTabActive: {
    backgroundColor: '#ef4444',
  },
  tabText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#94a3b8',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  earCard: {
    padding: 10,
    borderRadius: 10,
    borderTopWidth: 3,
    borderWidth: 1,
    borderColor: '#475569',
  },
  earTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  regionHeader: {
    marginTop: 8,
    marginBottom: 4,
    paddingVertical: 3,
    paddingHorizontal: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#fbbf24',
  },
  regionHeaderText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fbbf24',
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
    minHeight: 28,
  },
  freqLabel: {
    width: 42,
    fontSize: 11,
    fontWeight: 'bold',
  },
  valueLabel: {
    width: 36,
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'right',
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
  },
});
