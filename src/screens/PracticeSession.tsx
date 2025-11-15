import React, {useEffect, useState, useMemo, useRef, useCallback} from 'react';
import {ScrollView, View} from 'react-native';
import {DrawerActions, useNavigation, useRoute} from '@react-navigation/native';
import {Ionicons} from '@expo/vector-icons';
import {
  getRecordingPermissionsAsync,
  requestRecordingPermissionsAsync,
} from 'expo-audio';
import {
  Audio,
  InterruptionModeAndroid,
  InterruptionModeIOS,
  type AVPlaybackStatus,
} from 'expo-av';

import {
  Block,
  type AssistantOrbState,
  BrandActionButton,
  BrandBackground,
  Button,
  Image,
  RolePlayAvatar,
  Text,
} from '../components';
import {useData, usePracticeAudio, useTheme} from '../hooks';
import {
  transcribePracticeAudio,
  requestPracticeFeedback,
  requestPracticeVoice,
} from '../services/practice';
import {
  ROLE_PLAY_SCENARIOS,
  type RolePlayScenarioConfig,
  type RolePlayScenarioId,
  type RolePlayLevelId,
} from '../roleplay';

type PracticeVerdict = 'correct' | 'needs_improvement';

type PracticeSessionRouteParams = {
  scenarioId?: RolePlayScenarioId;
  levelId?: RolePlayLevelId;
};

type ChatMessageType = 'tutor' | 'user' | 'feedback' | 'system';

type ChatMessage = {
  id: string;
  type: ChatMessageType;
  text: string;
  timestamp: Date;
  verdict?: PracticeVerdict;
  isPlaying?: boolean;
};

const PracticeSession = () => {
  const {sizes, colors, gradients, assets} = useTheme();
  const {practice, user} = useData();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const {scenarioId: routeScenarioId, levelId: routeLevelId} =
    (route?.params as PracticeSessionRouteParams) ?? {};
  const scenarioId =
    (routeScenarioId as RolePlayScenarioId | undefined) ?? 'jobInterview';
  const [activeLevelId, setActiveLevelId] = useState<RolePlayLevelId>(
    (routeLevelId as RolePlayLevelId | undefined) ?? 'beginner',
  );
  const scenarioConfig = useMemo<RolePlayScenarioConfig>(() => {
    const fallback = ROLE_PLAY_SCENARIOS.jobInterview;
    return ROLE_PLAY_SCENARIOS[scenarioId] ?? fallback;
  }, [scenarioId]);
  const {
    isRecording,
    lastUri,
    error,
    startRecording,
    stopRecording,
    reset,
  } = usePracticeAudio();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [analysisSummary, setAnalysisSummary] = useState<string | null>(null);
  const [analysisVerdict, setAnalysisVerdict] =
    useState<PracticeVerdict | null>(null);
  const [interviewIndex, setInterviewIndex] = useState(0);
  const [shouldPlayGreeting, setShouldPlayGreeting] = useState(true);
  const [dynamicFeedback, setDynamicFeedback] = useState<string | null>(null);
  const [completedTurns, setCompletedTurns] = useState(0);
  const currentLevel = useMemo(() => {
    const fallback = scenarioConfig.levels[0];
    return (
      scenarioConfig.levels.find((level) => level.id === activeLevelId) ??
      fallback
    );
  }, [scenarioConfig, activeLevelId]);
  const conversationPairs = currentLevel?.conversation ?? [];
  const [assistantState, setAssistantState] =
    useState<AssistantOrbState>('idle');
  const [micPermission, setMicPermission] = useState<
    'unknown' | 'granted' | 'denied'
  >('unknown');
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const speakingTimeout = useRef<NodeJS.Timeout | null>(null);
  const voiceSoundRef = useRef<Audio.Sound | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const chatScrollViewRef = useRef<ScrollView>(null);

  const bottomButtonHeight = sizes.l * 1.1;

  const studentFullName = useMemo(() => {
    const rawName =
      (typeof user?.name === 'string' && user.name.trim().length > 0
        ? user.name.trim()
        : undefined) ?? 'Studente';
    return rawName;
  }, [user?.name]);

  const studentFirstName = useMemo(() => {
    const [first] = studentFullName.split(' ');
    return first ?? studentFullName;
  }, [studentFullName]);

  const currentPair = useMemo(() => {
    if (!conversationPairs.length) {
      return undefined;
    }
    const safeIndex =
      ((interviewIndex % conversationPairs.length) + conversationPairs.length) %
      conversationPairs.length;
    return conversationPairs[safeIndex];
  }, [conversationPairs, interviewIndex]);

  const currentTutorPrompt = useMemo(
    () => currentPair?.tutor(studentFirstName) ?? '',
    [currentPair, studentFirstName],
  );

  const expectedUserSample = useMemo(
    () => currentPair?.user(studentFirstName) ?? '',
    [currentPair, studentFirstName],
  );

  // Extraer solo el nombre del tutor (sin "Tutor IA ·")
  const tutorNameOnly = useMemo(() => {
    const fullName = practice.tutorName || '';
    const parts = fullName.split('·');
    return parts.length > 1 ? parts[parts.length - 1].trim() : fullName;
  }, [practice.tutorName]);

  const sessionProgress = useMemo(() => {
    const total = Math.max(conversationPairs.length, 1);
    const completed = Math.min(completedTurns, total);
    const percentage = Math.round((completed / total) * 100);
    return {
      completed,
      total,
      percentage,
    };
  }, [conversationPairs.length, completedTurns]);

  const loadMicPermission = useCallback(async () => {
    try {
      const status = await getRecordingPermissionsAsync();
      setMicPermission(status.granted ? 'granted' : 'denied');
    } catch (permissionError) {
      setMicPermission('denied');
      if (__DEV__) {
        console.warn('Error checking microphone permission', permissionError);
      }
    }
  }, []);

  useEffect(() => {
    loadMicPermission();
  }, [loadMicPermission]);

  useEffect(() => {
    const configurePlayback = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          interruptionModeIOS: InterruptionModeIOS.DuckOthers,
          interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (error) {
        if (__DEV__) {
          console.warn('Playback audio mode setup failed', error);
        }
      }
    };

    configurePlayback();
  }, []);

  useEffect(() => {
    return () => {
      if (speakingTimeout.current) {
        clearTimeout(speakingTimeout.current);
      }
    };
  }, []);

  const stopVoicePlayback = useCallback(async () => {
    if (voiceSoundRef.current) {
      try {
        await voiceSoundRef.current.stopAsync();
      } catch (error) {
        if (__DEV__) {
          console.warn('Stop voice playback error', error);
        }
      }
      try {
        await voiceSoundRef.current.unloadAsync();
      } catch (error) {
        if (__DEV__) {
          console.warn('Unload voice playback error', error);
        }
      }
      voiceSoundRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopVoicePlayback();
    };
  }, [stopVoicePlayback]);

  const handleLevelSelect = useCallback(
    (levelId: RolePlayLevelId) => {
      if (levelId === activeLevelId) return;
      void stopVoicePlayback();
      setIsPlayingVoice(false);
      setActiveLevelId(levelId);
    },
    [activeLevelId, stopVoicePlayback],
  );

  useEffect(() => {
    setInterviewIndex(0);
    setCompletedTurns(0);
    setShouldPlayGreeting(true);
    setAnalysisSummary(null);
    setAnalysisVerdict(null);
    setDynamicFeedback(null);
    setProcessingError(null);
    setVoiceError(null);
    setIsPlayingVoice(false);
    void stopVoicePlayback();
  }, [currentLevel, stopVoicePlayback]);

  const requestMicPermission = useCallback(async () => {
    try {
      const result = await requestRecordingPermissionsAsync();
      const granted = result.granted ?? false;
      setMicPermission(granted ? 'granted' : 'denied');
      return granted;
    } catch (permissionError) {
      setMicPermission('denied');
      setProcessingError(
        'Non è stato possibile richiedere il permesso del microfono. Controlla le impostazioni del dispositivo.',
      );
      return false;
    }
  }, []);

  const handleStartRecording = async () => {
    if (micPermission !== 'granted') {
      const granted = await requestMicPermission();
      if (!granted) return;
    }

    setAssistantState('listening');
    setAnalysisSummary(null);
    setAnalysisVerdict(null);
    setProcessingError(null);
    setVoiceError(null);
    setIsPlayingVoice(false);
    await stopVoicePlayback();
    try {
      await startRecording();
    } catch (recordError) {
      setAssistantState('idle');
      throw recordError;
    }
  };

  const handleResetRecording = () => {
    reset();
    setAnalysisSummary(null);
    setAnalysisVerdict(null);
    setProcessingError(null);
    setVoiceError(null);
    setDynamicFeedback(null);
    stopVoicePlayback();
    setIsPlayingVoice(false);
    setShouldPlayGreeting(true);
    if (speakingTimeout.current) clearTimeout(speakingTimeout.current);
    setAssistantState('idle');
  };

  const playVoiceMessage = useCallback(
    async (text?: string) => {
      if (!text) return;

      try {
        setVoiceError(null);
        await stopVoicePlayback();
        const uri = await requestPracticeVoice(text);
        const SYNC_THRESHOLD = 200;
        const statusHandler = (status: AVPlaybackStatus) => {
          if (!status.isLoaded) {
            if ('error' in status && status.error && __DEV__) {
              console.warn('Voice playback status error', status.error);
            }
            return;
          }
          const shouldAnimate =
            Boolean(status.isPlaying) &&
            typeof status.positionMillis === 'number' &&
            status.positionMillis >= SYNC_THRESHOLD;
          setIsPlayingVoice(shouldAnimate);
          if (status.didJustFinish) {
            setIsPlayingVoice(false);
            voiceSoundRef.current?.setOnPlaybackStatusUpdate(null);
            voiceSoundRef.current?.unloadAsync().catch(() => {});
            voiceSoundRef.current = null;
          }
        };
        const {sound, status} = await Audio.Sound.createAsync(
          {uri},
          {shouldPlay: true},
          statusHandler,
        );
        voiceSoundRef.current = sound;
        const initialShouldAnimate =
          status.isLoaded &&
          status.isPlaying &&
          typeof status.positionMillis === 'number' &&
          status.positionMillis >= SYNC_THRESHOLD;
        setIsPlayingVoice(initialShouldAnimate);
      } catch (voiceErrorInstance) {
        const message =
          voiceErrorInstance instanceof Error
            ? voiceErrorInstance.message
            : 'Impossibile riprodurre il feedback.';
        setVoiceError(message);
        if (__DEV__) {
          console.warn('playVoiceMessage error', voiceErrorInstance);
        }
        setIsPlayingVoice(false);
      }
    },
    [stopVoicePlayback],
  );

  // Agregar mensaje al chat
  const addChatMessage = useCallback(
    (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
      const newMessage: ChatMessage = {
        ...message,
        id: `msg-${Date.now()}-${Math.random()}`,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, newMessage]);

      setTimeout(() => {
        chatScrollViewRef.current?.scrollToEnd({animated: true});
      }, 100);
    },
    [],
  );

  const triggerSpeakingAnimation = useCallback(() => {
    if (speakingTimeout.current) {
      clearTimeout(speakingTimeout.current);
    }
    setAssistantState('speaking');
    speakingTimeout.current = setTimeout(() => {
      setAssistantState('idle');
    }, 2400);
  }, []);

  useEffect(() => {
    if (!shouldPlayGreeting || !currentTutorPrompt) return;

    const timeoutId = setTimeout(() => {
      const greetingMessage = currentTutorPrompt;
      setShouldPlayGreeting(false);

      triggerSpeakingAnimation();
      playVoiceMessage(greetingMessage).catch(() => {
        setShouldPlayGreeting(true);
      });
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [
    shouldPlayGreeting,
    currentTutorPrompt,
    playVoiceMessage,
    triggerSpeakingAnimation,
  ]);

  const analyzeRecording = async (uri: string) => {
    setAssistantState('listening');
    setIsProcessing(true);
    setProcessingError(null);
    setAnalysisSummary(null);
    setAnalysisVerdict(null);
    setVoiceError(null);
    setIsPlayingVoice(false);
    await stopVoicePlayback();

    try {
      const transcription = await transcribePracticeAudio({uri});
      const transcriptText =
        transcription?.text ||
        transcription?.segments?.map((segment) => segment.text).join(' ') ||
        '';

      if (!transcriptText) {
        throw new Error(
          'Impossibile ottenere la trascrizione. Prova a registrare di nuovo.',
        );
      }

      addChatMessage({
        type: 'user',
        text: transcriptText,
      });

      const feedback = await requestPracticeFeedback({
        transcript: transcriptText,
        targetSentence: expectedUserSample,
        learnerProfile: {
          nativeLanguage: 'Italiano',
          proficiencyLevel: 'Intermedio',
          learnerName: studentFullName,
        },
        segments: transcription?.segments,
      });

      setAnalysisSummary(feedback.summary ?? null);
      setAnalysisVerdict(feedback.verdict ?? null);

      const suggestionPool =
        feedback.verdict === 'correct'
          ? ['Good! You used the past tense correctly.']
          : [
              'Try to use a more formal tone.',
              'Next time, add one more detail about your experience.',
            ];
      const randomSuggestion =
        suggestionPool[Math.floor(Math.random() * suggestionPool.length)];
      setDynamicFeedback(randomSuggestion);

      const feedbackText =
        feedback.summary ??
        `Analisi completata, ${studentFirstName}. Ottimo lavoro! Continua a praticare.`;

      addChatMessage({
        type: 'feedback',
        text: feedbackText,
        verdict: feedback.verdict ?? undefined,
      });

      triggerSpeakingAnimation();
      playVoiceMessage(feedbackText);
    } catch (feedbackError) {
      setAssistantState('idle');
      setDynamicFeedback(null);
      const message =
        feedbackError instanceof Error
          ? feedbackError.message
          : 'La valutazione non è riuscita, riprova.';
      setProcessingError(message);

      addChatMessage({
        type: 'system',
        text: message,
      });

      if (__DEV__) {
        console.warn('Practice feedback error', feedbackError);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReanalyzeRecording = async () => {
    if (!lastUri) {
      setProcessingError('Registra una frase per avviare l’analisi.');
      return;
    }
    await analyzeRecording(lastUri);
  };

  const handleStopRecording = async () => {
    const uri = await stopRecording();
    if (!uri) {
      setAssistantState('idle');
      return;
    }

    await analyzeRecording(uri);
  };

  const handleToggleRecordingWrapper = async () => {
    if (micPermission !== 'granted') {
      await requestMicPermission();
      return;
    }

    if (isRecording) {
      await handleStopRecording();
    } else {
      await handleStartRecording();
    }
  };

  const avatarMode = (() => {
    if (isPlayingVoice || assistantState === 'speaking') {
      return 'speaking' as const;
    }
    if (isRecording || assistantState === 'listening') {
      return 'listening' as const;
    }
    return 'idle' as const;
  })();

  const goToNextInterviewSentence = useCallback(async () => {
    await stopVoicePlayback();
    setIsPlayingVoice(false);
    if (conversationPairs.length > 0) {
      setInterviewIndex((prev) => (prev + 1) % conversationPairs.length);
      setCompletedTurns((prev) =>
        Math.min(prev + 1, conversationPairs.length),
      );
    }
    setShouldPlayGreeting(true);
    setAnalysisSummary(null);
    setAnalysisVerdict(null);
    setProcessingError(null);
    setDynamicFeedback(null);
    setVoiceError(null);
    setAssistantState('idle');
    setChatMessages([]);
  }, [conversationPairs.length, stopVoicePlayback]);

  const ChatMessageBubble = ({message}: {message: ChatMessage}) => {
    const isTutor = message.type === 'tutor';
    const isUser = message.type === 'user';
    const isFeedback = message.type === 'feedback';
    const isSystem = message.type === 'system';

    if (isSystem) {
      return (
        <Block align="center" marginVertical={sizes.xs}>
          <Text size={sizes.p - 2} color="rgba(255,255,255,0.5)" center>
            {message.text}
          </Text>
        </Block>
      );
    }

    const alignLeft = isTutor || isFeedback;

    return (
      <Block
        row
        justify={alignLeft ? 'flex-start' : 'flex-end'}
        marginBottom={sizes.sm}
        style={{paddingHorizontal: sizes.xs}}>
        <Block
          style={{
            paddingHorizontal: sizes.padding,
            paddingVertical: sizes.sm,
            backgroundColor: alignLeft
              ? 'rgba(255,255,255,0.15)'
              : 'rgba(96,203,88,0.3)',
            borderTopLeftRadius: alignLeft ? sizes.xs : sizes.md,
            borderTopRightRadius: alignLeft ? sizes.md : sizes.xs,
            borderBottomLeftRadius: sizes.md,
            borderBottomRightRadius: sizes.md,
            shadowColor: '#000',
            shadowOffset: {width: 0, height: 1},
            shadowOpacity: 0.2,
            shadowRadius: 2,
            elevation: 2,
          }}>
          {isFeedback && message.verdict && (
            <Text
              semibold
              marginBottom={sizes.xs}
              size={sizes.p - 2}
              color={
                message.verdict === 'correct'
                  ? 'rgba(111,255,200,0.9)'
                  : colors.danger ?? '#FF6B6B'
              }>
              {message.verdict === 'correct'
                ? '✓ Pronuncia accettabile'
                : '⚠ Pronuncia da migliorare'}
            </Text>
          )}
          <Text
            white
            size={sizes.p - 1}
            style={{
              lineHeight: sizes.p + 4,
            }}>
            {message.text}
          </Text>
        </Block>
      </Block>
    );
  };

  return (
    <BrandBackground>
      <Block flex={1}>
        {/* HEADER */}
        <Block
          row
          justify="flex-start"
          align="center"
          style={{
            paddingHorizontal: sizes.padding,
            paddingTop: sizes.l,
            paddingBottom: sizes.sm,
          }}>
          <Button
            color="rgba(255,255,255,0.12)"
            radius={sizes.sm}
            width={sizes.md}
            height={sizes.md}
            onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}>
            <Image
              radius={0}
              width={18}
              height={18}
              color={colors.white}
              source={assets.menu}
            />
          </Button>
        </Block>

        {/* BOTONES DE NIVEL FLOTANTES */}
        <Block
          style={{
            position: 'absolute',
            left: sizes.xs,
            top: '40%',
            zIndex: 10,
          }}>
          <Block>
            {scenarioConfig.levels.map((level) => {
              const isActive = activeLevelId === level.id;
              const levelIcons: Record<string, string> = {
                beginner: '🟡',
                intermediate: '🟠',
                advanced: '🟢',
              };
              const levelIcon = levelIcons[level.id] || '●';

              return (
                <Button
                  key={level.id}
                  onPress={() => handleLevelSelect(level.id)}
                  radius={sizes.cardRadius}
                  color={
                    isActive
                      ? 'rgba(61, 214, 152, 0.22)'
                      : 'rgba(255,255,255,0.08)'
                  }
                  style={{
                    width: sizes.l * 1.2,
                    height: sizes.l * 1.2,
                    paddingHorizontal: 0,
                    paddingVertical: 0,
                    marginBottom: sizes.xs,
                    borderWidth: isActive ? 1.5 : 0,
                    borderColor: isActive
                      ? 'rgba(96,203,88,0.6)'
                      : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Text
                    style={{
                      fontSize: sizes.l,
                    }}>
                    {levelIcon}
                  </Text>
                </Button>
              );
            })}
          </Block>
        </Block>

        {/* CONTENIDO */}
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: sizes.padding,
            paddingBottom: sizes.xl,
          }}
          keyboardShouldPersistTaps="handled">
          <Block flex={1} justify="space-between">
            {/* AVATAR */}
            <Block align="center" marginTop={sizes.sm}>
              <Block style={{position: 'relative'}}>
                <RolePlayAvatar mode={avatarMode} size={300} />

                <Block
                  style={{
                    position: 'absolute',
                    bottom: sizes.sm,
                    left: 0,
                    right: 0,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Block
                    style={{
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      paddingHorizontal: sizes.sm,
                      paddingVertical: sizes.xs,
                      borderRadius: sizes.sm,
                    }}>
                    <Text white semibold size={sizes.p - 2}>
                      {tutorNameOnly}
                    </Text>
                  </Block>
                </Block>
              </Block>

              <Block
                style={{
                  width: '60%',
                  marginTop: sizes.sm,
                  alignSelf: 'center',
                }}>
                <Block
                  height={2}
                  radius={1}
                  color="rgba(255,255,255,0.12)"
                  style={{overflow: 'hidden'}}>
                  <Block
                    height="100%"
                    width={`${sessionProgress.percentage}%`}
                    gradient={gradients.primary}
                  />
                </Block>
              </Block>

              {error ? (
                <Text
                  marginTop={sizes.xs}
                  size={sizes.p - 2}
                  color={colors.danger ?? '#FF6B6B'}
                  center>
                  {error}
                </Text>
              ) : null}
            </Block>

            {/* CHAT */}
            <Block marginTop={0} style={{flex: 1, minHeight: 200}}>
              <ScrollView
                ref={chatScrollViewRef}
                contentContainerStyle={{
                  paddingHorizontal: sizes.padding,
                  paddingVertical: sizes.sm,
                  paddingBottom: sizes.l,
                }}
                keyboardShouldPersistTaps="handled"
                onContentSizeChange={() => {
                  chatScrollViewRef.current?.scrollToEnd({animated: true});
                }}>
                {currentTutorPrompt && (
                  <Block row justify="flex-start" marginBottom={sizes.sm}>
                    <Block
                      style={{
                        paddingHorizontal: sizes.padding,
                        paddingVertical: sizes.sm,
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        borderTopLeftRadius: sizes.xs,
                        borderTopRightRadius: sizes.md,
                        borderBottomLeftRadius: sizes.md,
                        borderBottomRightRadius: sizes.md,
                        maxWidth: '75%',
                        shadowColor: '#000',
                        shadowOffset: {width: 0, height: 1},
                        shadowOpacity: 0.2,
                        shadowRadius: 2,
                        elevation: 2,
                      }}>
                      <Text
                        white
                        size={sizes.p - 1}
                        style={{lineHeight: sizes.p + 4}}>
                        {currentTutorPrompt}
                      </Text>
                    </Block>
                  </Block>
                )}

                {chatMessages
                  .filter(
                    (m) =>
                      m.type === 'user' ||
                      m.type === 'feedback' ||
                      m.type === 'system',
                  )
                  .map((message) => (
                    <ChatMessageBubble key={message.id} message={message} />
                  ))}

                {isProcessing && (
                  <Block row justify="flex-start" marginBottom={sizes.sm}>
                    <Block
                      style={{
                        paddingHorizontal: sizes.padding,
                        paddingVertical: sizes.sm,
                        backgroundColor: 'rgba(255,255,255,0.12)',
                        borderTopLeftRadius: sizes.xs,
                        borderTopRightRadius: sizes.md,
                        borderBottomLeftRadius: sizes.md,
                        borderBottomRightRadius: sizes.md,
                        maxWidth: '75%',
                      }}>
                      <Text white size={sizes.p - 1}>
                        Analisi in corso...
                      </Text>
                    </Block>
                  </Block>
                )}
              </ScrollView>
            </Block>

            {/* BARRA INFERIOR: Esempio + Micrófono */}
            <Block
              style={{
                paddingHorizontal: sizes.padding,
                paddingVertical: sizes.md,
                borderTopWidth: 1,
                borderTopColor: 'rgba(255,255,255,0.1)',
                backgroundColor: 'rgba(0,0,0,0.3)',
              }}>
              <View
                style={{
                  width: '100%',
                  flexDirection: 'row',
                  alignItems: 'center',
                }}>
                {/* Contenedor SIEMPRE presente para mantener ancho */}
                <View style={{flex: 1, marginRight: sizes.xs}}>
                  {expectedUserSample ? (
                    <Button
                      radius={sizes.md}
                      color="transparent"
                      activeOpacity={1}
                      disabled={isRecording || isProcessing}
                      style={{
                        width: '100%',
                        height: bottomButtonHeight,
                        padding: 0,
                        borderWidth: 0,
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        opacity: isRecording || isProcessing ? 0.6 : 1,
                      }}
                      onPress={() => {
                        if (isRecording || isProcessing) return;
                        addChatMessage({
                          type: 'user',
                          text: expectedUserSample,
                        });
                      }}>
                      <Block
                        width="100%"
                        height="100%"
                        radius={sizes.md}
                        gradient={gradients.secondary}
                        align="center"
                        justify="center"
                        style={{
                          paddingHorizontal: sizes.sm,
                          overflow: 'hidden',
                        }}>
                        <Text
                          white
                          size={(sizes.s - 1) * 2}
                          semibold
                          numberOfLines={1}
                          ellipsizeMode="tail"
                          style={{
                            lineHeight: (sizes.s - 1) * 2 * 1.2,
                            includeFontPadding: false,
                            textAlignVertical: 'center',
                          }}>
                          💡 Esempio
                        </Text>
                      </Block>
                    </Button>
                  ) : null}
                </View>

                {/* Micrófono */}
                <View style={{flex: 1}}>
                  <Button
                    radius={sizes.md}
                    color="transparent"
                    activeOpacity={1}
                    style={{
                      width: '100%',
                      height: bottomButtonHeight,
                      padding: 0,
                      borderWidth: 0,
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                    onPress={handleToggleRecordingWrapper}
                    disabled={isProcessing || isPlayingVoice}>
                    <Block
                      width="100%"
                      height="100%"
                      radius={sizes.md}
                      gradient={
                        isRecording ? gradients.warning : gradients.primary
                      }
                      align="center"
                      justify="center"
                      style={{
                        paddingHorizontal: sizes.sm,
                        overflow: 'hidden',
                      }}>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '100%',
                          overflow: 'hidden',
                        }}>
                        <Ionicons
                          name="mic"
                          size={sizes.sm * 2}
                          color="white"
                          style={{
                            marginRight: sizes.xs,
                          }}
                        />

                        <Text
                          white
                          size={(sizes.s - 1) * 2}
                          semibold
                          numberOfLines={1}
                          ellipsizeMode="tail"
                          style={{
                            flexShrink: 1,
                            lineHeight: (sizes.s - 1) * 2 * 1.2,
                            includeFontPadding: false,
                            textAlignVertical: 'center',
                          }}>
                          {micPermission !== 'granted'
                            ? 'Consenti microfono'
                            : isRecording
                            ? 'Registrando…'
                            : isProcessing
                            ? 'Analisi in corso...'
                            : isPlayingVoice
                            ? 'Riproduzione feedback...'
                            : 'Tocca'}
                        </Text>
                      </View>
                    </Block>
                  </Button>
                </View>
              </View>

              {/* Botones de acción */}
              <Block row justify="center" marginTop={sizes.xs}>
                <BrandActionButton
                  label="PROSSIMO TURNO"
                  onPress={goToNextInterviewSentence}
                  disabled={
                    isRecording ||
                    isProcessing ||
                    isPlayingVoice ||
                    conversationPairs.length === 0
                  }
                  style={{flex: 1, maxWidth: 200, marginRight: sizes.xs}}
                />
                {analysisSummary && (
                  <BrandActionButton
                    label={isPlayingVoice ? 'Riproduzione...' : 'Feedback'}
                    onPress={() => playVoiceMessage(analysisSummary)}
                    disabled={isPlayingVoice}
                    style={{flex: 1, maxWidth: 200}}
                  />
                )}
              </Block>

              {processingError && (
                <Text
                  marginTop={sizes.xs}
                  color={colors.danger ?? '#FF6B6B'}
                  size={sizes.p - 2}
                  center>
                  {processingError}
                </Text>
              )}
            </Block>
          </Block>
        </ScrollView>
      </Block>
    </BrandBackground>
  );
};

export default PracticeSession;
