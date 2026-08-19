import React, { useEffect, useMemo, useState } from 'react';
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  useColorScheme,
  View,
} from 'react-native';
import { AnalysisAgent, SpectralSuggestion } from '../../application/agents/AnalysisAgent';
import { CaptureAgent } from '../../application/agents/CaptureAgent';
import { HearingHealthAgent } from '../../application/agents/HearingHealthAgent';
import { PlanningAgent } from '../../application/agents/PlanningAgent';
import { CLINICAL_FREQUENCIES, EarSide, ProfilesMap, createDefaultProfiles } from '../../domain/entities/AudioProfile';
import { AudiometricTestState, createInitialTestState } from '../../domain/entities/AudiometricTestState';
import { FeedbackType } from '../../domain/entities/FeedbackLog';
import { HealthAlert } from '../../domain/entities/HealthAlert';
import { AudioMode, WebAudioEngineServiceImpl } from '../../infrastructure/audio/WebAudioEngineServiceImpl';
import { MMKVRepositoryImpl } from '../../infrastructure/repositories/MMKVRepositoryImpl';
import { WebStorageRepositoryImpl } from '../../infrastructure/repositories/WebStorageRepositoryImpl';
import { AccessibleHeader } from '../components/AccessibleHeader';
import { AudioModeSelector } from '../components/AudioModeSelector';
import { CollapsibleSection } from '../components/CollapsibleSection';
import { AudiometricTestPanel } from '../components/AudiometricTestPanel';
import { CareMonitorPanel } from '../components/CareMonitorPanel';
import { DisclaimerModal } from '../components/DisclaimerModal';
import { EqualizerSliders } from '../components/EqualizerSliders';
import { FeedbackPanel } from '../components/FeedbackPanel';
import { ProfileSelector } from '../components/ProfileSelector';

export const HomeScreen: React.FC = () => {
  const isDarkMode = useColorScheme() === 'dark';

  const theme = useMemo(
    () => ({
      background: isDarkMode ? '#121824' : '#FFFFFF',
      text: isDarkMode ? '#F8FAFC' : '#0F172A',
      cardBg: isDarkMode ? '#1E293B' : '#F1F5F9',
      primary: isDarkMode ? '#FFCC00' : '#0033CC',
    }),
    [isDarkMode]
  );

  const repoInstance = useMemo(() => {
    return Platform.OS === 'web'
      ? new WebStorageRepositoryImpl<any>('v1')
      : new MMKVRepositoryImpl<any>('v1');
  }, []);

  const audioEngine = useMemo(() => new WebAudioEngineServiceImpl(), []);

  const captureAgent = useMemo(() => new CaptureAgent(repoInstance, repoInstance, repoInstance), [repoInstance]);
  const planningAgent = useMemo(() => new PlanningAgent(), []);
  const analysisAgent = useMemo(() => new AnalysisAgent(audioEngine), [audioEngine]);
  const healthAgent = useMemo(() => new HearingHealthAgent(), []);

  const [profiles, setProfiles] = useState<ProfilesMap>(createDefaultProfiles());
  const [activeSlot, setActiveSlot] = useState<string>('1');
  const [isEngineActive, setIsEngineActive] = useState<boolean>(false);
  const [testState, setTestState] = useState<AudiometricTestState>(createInitialTestState());
  const [pendingSuggestion, setPendingSuggestion] = useState<SpectralSuggestion | null>(null);
  const [healthAlerts, setHealthAlerts] = useState<HealthAlert[]>([]);
  const [readAlertIds, setReadAlertIds] = useState<Set<string>>(new Set());
  const [isCareMonitorVisible, setIsCareMonitorVisible] = useState<boolean>(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);
  const [showDisclaimer, setShowDisclaimer] = useState<boolean>(false);
  const [audioMode, setAudioMode] = useState<AudioMode>('ambient');

  useEffect(() => {
    (async () => {
      const loadedProfiles = await captureAgent.loadProfiles();
      const loadedSlot = await captureAgent.loadActiveProfileSlot();
      setProfiles(loadedProfiles);
      setActiveSlot(loadedSlot);

      const currentConfig = loadedProfiles[loadedSlot] || loadedProfiles['1'];
      const initialAlerts = healthAgent.evaluateHealthState(currentConfig, 0);
      setHealthAlerts(initialAlerts);
      setUnreadNotificationsCount(initialAlerts.length);
    })();
  }, [captureAgent, healthAgent]);

  const handleToggleEngine = async () => {
    if (isEngineActive) {
      await audioEngine.stopEngine();
      setIsEngineActive(false);
    } else {
      if (Platform.OS === 'android') {
        const { PermissionsAndroid } = require('react-native');
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: "Permiso de Micrófono",
            message: "La app necesita usar el micrófono para aplicar el ecualizador asimétrico ambiental.",
            buttonNeutral: "Preguntar Luego",
            buttonNegative: "Cancelar",
            buttonPositive: "OK"
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.warn("Permiso de micrófono denegado");
          // Continuar de todos modos, quizá funciona modo sistema
        }
      }
      
      const currentConfig = profiles[activeSlot] || profiles['1'];
      audioEngine.setAudioMode(audioMode);
      const success = await audioEngine.startEngine(currentConfig);
      setIsEngineActive(success);
    }
  };

  const handleAudioModeChange = async (mode: AudioMode) => {
    setAudioMode(mode);
    if (isEngineActive) {
      await audioEngine.stopEngine();
      audioEngine.setAudioMode(mode);
      const currentConfig = profiles[activeSlot] || profiles['1'];
      const success = await audioEngine.startEngine(currentConfig);
      setIsEngineActive(success);
    }
  };

  const handleSelectSlot = async (slot: string) => {
    setActiveSlot(slot);
    await captureAgent.setActiveProfileSlot(slot);
    setPendingSuggestion(null);

    const currentConfig = profiles[slot] || profiles['1'];

    if (isEngineActive) {
      await audioEngine.applyFullConfig(currentConfig);
    }

    const updatedAlerts = healthAgent.evaluateHealthState(currentConfig, 0);
    setHealthAlerts(updatedAlerts);
    setUnreadNotificationsCount(updatedAlerts.length);
  };

  const handleChangeBandGain = async (side: EarSide, index: number, newLossDbHL: number) => {
    const updatedProfiles = await captureAgent.updateBandGain(activeSlot, side, index, newLossDbHL);
    setProfiles(updatedProfiles);

    const updatedConfig = updatedProfiles[activeSlot];

    if (isEngineActive) {
      await audioEngine.updateFilter(side, index, updatedConfig[side][index]);
    }

    const alerts = healthAgent.evaluateHealthState(updatedConfig, 0);
    setHealthAlerts(alerts);
  };

  const handleTriggerFeedback = async (type: FeedbackType) => {
    const suggestion = await analysisAgent.analyzeLiveFeedback(type);
    if (suggestion) {
      setPendingSuggestion(suggestion);
    }
  };

  const handleApplySuggestion = async () => {
    if (!pendingSuggestion) return;

    const { dominantIndex, suggestedDeltaDb, type, dominantFreqHz } = pendingSuggestion;
    const currentConfig = profiles[activeSlot];

    const currentLeft = currentConfig.left[dominantIndex] ?? 0;
    const currentRight = currentConfig.right[dominantIndex] ?? 0;

    const newLeft = Math.max(0, Math.min(80, currentLeft + suggestedDeltaDb));
    const newRight = Math.max(0, Math.min(80, currentRight + suggestedDeltaDb));

    let updatedProfiles = await captureAgent.updateBandGain(activeSlot, 'left', dominantIndex, newLeft);
    updatedProfiles = await captureAgent.updateBandGain(activeSlot, 'right', dominantIndex, newRight);

    setProfiles(updatedProfiles);

    if (isEngineActive) {
      await audioEngine.applyFullConfig(updatedProfiles[activeSlot]);
    }

    await captureAgent.logFeedbackEvent(
      activeSlot,
      type,
      dominantFreqHz,
      dominantIndex,
      suggestedDeltaDb,
      'applied'
    );

    setPendingSuggestion(null);
  };

  const handleIgnoreSuggestion = async () => {
    if (pendingSuggestion) {
      await captureAgent.logFeedbackEvent(
        activeSlot,
        pendingSuggestion.type,
        pendingSuggestion.dominantFreqHz,
        pendingSuggestion.dominantIndex,
        pendingSuggestion.suggestedDeltaDb,
        'ignored'
      );
    }
    setPendingSuggestion(null);
  };

  const handleStartTest = () => {
    setTestState({
      isActive: true,
      currentEar: 'left',
      currentFreqIndex: 0,
      currentVolumeHL: 0,
      isComplete: false,
    });
  };

  const handleHearTone = async () => {
    await audioEngine.stopTestTone();

    const { currentEar, currentFreqIndex, currentVolumeHL } = testState;
    const recommendedLoss = Math.max(0, Math.round(currentVolumeHL) - 20);

    const updatedProfiles = await captureAgent.updateBandGain('3', currentEar, currentFreqIndex, recommendedLoss);
    setProfiles(updatedProfiles);

    const nextFreqIdx = currentFreqIndex + 1;

    if (nextFreqIdx >= CLINICAL_FREQUENCIES.length) {
      if (currentEar === 'left') {
        setTestState({
          isActive: true,
          currentEar: 'right',
          currentFreqIndex: 0,
          currentVolumeHL: 0,
          isComplete: false,
        });
      } else {
        await audioEngine.stopTestTone();
        setTestState(createInitialTestState());
        setActiveSlot('3');
        await captureAgent.setActiveProfileSlot('3');
        if (isEngineActive) {
          await audioEngine.applyFullConfig(updatedProfiles['3']);
        }
      }
    } else {
      setTestState((prev) => ({
        ...prev,
        currentFreqIndex: nextFreqIdx,
        currentVolumeHL: 0,
      }));
    }
  };

  const handleAbortTest = async () => {
    await audioEngine.stopTestTone();
    setTestState(createInitialTestState());
  };

  useEffect(() => {
    let interval: any = null;

    if (testState.isActive) {
      interval = setInterval(async () => {
        setTestState((prev) => {
          if (!prev.isActive) return prev;

          const nextVol = prev.currentVolumeHL + 1.25;

          if (nextVol > 80) {
            handleHearTone();
            return prev;
          }

          const freqHz = CLINICAL_FREQUENCIES[prev.currentFreqIndex];
          const gainDbFS = -70 + (nextVol / 80) * 60;
          audioEngine.playTestTone(freqHz, prev.currentEar, gainDbFS);

          return { ...prev, currentVolumeHL: nextVol };
        });
      }, 120);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [testState.isActive, testState.currentFreqIndex, testState.currentEar]);

  const handleMarkAllAsRead = () => {
    // Guardar los IDs actuales como leídos y ocultarlos del panel
    setReadAlertIds(prev => new Set([...prev, ...healthAlerts.map(a => a.id)]));
    setUnreadNotificationsCount(0);
    setIsCareMonitorVisible(false);
  };

  // Solo mostrar alertas que no han sido leídas
  const unreadAlerts = healthAlerts.filter(a => !readAlertIds.has(a.id));

  const currentEarConfig = profiles[activeSlot] || createDefaultProfiles()['1'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* 📌 BARRA SUPERIOR FIJA (STICKY HEADER) */}
      <View style={[styles.stickyHeaderContainer, { backgroundColor: theme.background }]}>
        <AccessibleHeader
          isEngineActive={isEngineActive}
          onToggleEngine={handleToggleEngine}
          unreadNotificationsCount={unreadNotificationsCount}
          onOpenNotifications={() => setIsCareMonitorVisible(true)}
          textColor={theme.text}
          cardBg={theme.cardBg}
        />
      </View>

      {/* Capa de opacidad + bloqueo táctil cuando el motor está apagado */}
      <View
        style={[styles.contentWrapper, !isEngineActive && styles.contentDisabled]}
        pointerEvents={isEngineActive ? 'auto' : 'none'}
      >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Selector de Perfiles (1, 2, Perfil Clínico) */}
        <ProfileSelector
          activeSlot={activeSlot}
          onSelectSlot={handleSelectSlot}
          textColor={theme.text}
          cardBg={theme.cardBg}
          primaryColor={theme.primary}
        />

        {/* ── SECCIÓN 1: Retroalimentación en Tiempo Real ── */}
        <CollapsibleSection
          title="Retroalimentación"
          icon="🎙️"
          accentColor="#06b6d4"
          defaultExpanded={false}
          badge={pendingSuggestion ? '1' : null}
        >
          <FeedbackPanel
            onTriggerFeedback={handleTriggerFeedback}
            pendingSuggestion={pendingSuggestion}
            onApplySuggestion={handleApplySuggestion}
            onIgnoreSuggestion={handleIgnoreSuggestion}
            cardBg={theme.cardBg}
            textColor={theme.text}
          />
        </CollapsibleSection>

        {/* ── SECCIÓN 2: Asistente Audiométrico (Solo en Perfil Clínico) ── */}
        {activeSlot === '3' && (
          <CollapsibleSection
            title="Auto-Examen Audiométrico"
            icon="🩺"
            accentColor="#fbbf24"
            defaultExpanded={true}
          >
            <AudiometricTestPanel
              testState={testState}
              onStartTest={handleStartTest}
              onHearTone={handleHearTone}
              onAbortTest={handleAbortTest}
              textColor={theme.text}
              cardBg={theme.cardBg}
            />
          </CollapsibleSection>
        )}

        {/* ── SECCIÓN 3: Ecualizador por Canal Auditivo ── */}
        <CollapsibleSection
          title="Ecualizador"
          icon="🎛️"
          accentColor="#8b5cf6"
          defaultExpanded={true}
        >
          <AudioModeSelector
            mode={audioMode}
            onModeChange={handleAudioModeChange}
            disabled={false}
            textColor={theme.text}
            cardBg={theme.cardBg}
          />
          <EqualizerSliders
            config={currentEarConfig}
            onChangeBandGain={handleChangeBandGain}
            textColor={theme.text}
            cardBg={theme.cardBg}
          />
        </CollapsibleSection>
      </ScrollView>
      </View>

      {/* Modal Desplegable del Monitor de Cuidados y Notificaciones */}
      <CareMonitorPanel
        visible={isCareMonitorVisible}
        onClose={() => setIsCareMonitorVisible(false)}
        alerts={unreadAlerts}
        onMarkAllAsRead={handleMarkAllAsRead}
        cardBg={theme.cardBg}
        textColor={theme.text}
      />

      <DisclaimerModal
        visible={showDisclaimer}
        onAccept={() => setShowDisclaimer(false)}
        cardBg={theme.cardBg}
        textColor={theme.text}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stickyHeaderContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 10,
    elevation: 5,
  },
  contentWrapper: {
    flex: 1,
  },
  contentDisabled: {
    opacity: 0.35,
  },
  scrollContent: {
    padding: 16,
  },
});
