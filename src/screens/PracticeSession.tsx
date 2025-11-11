import React, {useEffect, useState, useMemo, useRef} from 'react';
import {ScrollView} from 'react-native';
import {DrawerActions, useNavigation} from '@react-navigation/native';

import {
  Block,
  AssistantOrb,
  type AssistantOrbState,
  BrandActionButton,
  BrandBackground,
  BrandChip,
  BrandProgressBar,
  BrandSectionHeader,
  BrandSurface,
  Button,
  Image,
  Text,
} from '../components';
import {useData, usePracticeAudio, useTheme} from '../hooks';
import {
  subscribePracticeFeedback,
  emitMockFeedback,
} from '../services/practice';

const PracticeSession = () => {
  const {sizes, icons, colors, gradients, assets} = useTheme();
  const {practice} = useData();
  const navigation = useNavigation<any>();
  const {
    isRecording,
    lastUri,
    error,
    startRecording,
    stopRecording,
    reset,
  } = usePracticeAudio();
  const [liveFeedback, setLiveFeedback] = useState(practice.phonemeHints);
  const [assistantState, setAssistantState] =
    useState<AssistantOrbState>('idle');
  const speakingTimeout = useRef<NodeJS.Timeout | null>(null);

  const triggerSpeakingAnimation = () => {
    if (speakingTimeout.current) {
      clearTimeout(speakingTimeout.current);
    }
    setAssistantState('speaking');
    speakingTimeout.current = setTimeout(() => {
      setAssistantState('idle');
    }, 2400);
  };

  const sessionProgress = useMemo(() => {
    const TOTAL_EXERCISES = 5;
    const completed = Math.min(practice.history.length, TOTAL_EXERCISES);
    const percentage = Math.round((completed / TOTAL_EXERCISES) * 100);
    return {
      completed,
      total: TOTAL_EXERCISES,
      percentage,
    };
  }, [practice.history.length]);

  useEffect(() => {
    const unsubscribe = subscribePracticeFeedback(hint => {
      setLiveFeedback(prev => [hint, ...prev]);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    return () => {
      if (speakingTimeout.current) {
        clearTimeout(speakingTimeout.current);
      }
    };
  }, []);

  const handleStartRecording = async () => {
    setAssistantState('listening');
    try {
      await startRecording();
    } catch (recordError) {
      setAssistantState('idle');
      throw recordError;
    }
  };

  const handleResetRecording = () => {
    reset();
    setLiveFeedback(practice.phonemeHints);
    if (speakingTimeout.current) {
      clearTimeout(speakingTimeout.current);
    }
    setAssistantState('idle');
  };

  const handleMockFeedback = (custom?: {label?: string; hint?: string}) => {
    triggerSpeakingAnimation();
    emitMockFeedback({
      id: `auto-${Date.now()}`,
      label: custom?.label ?? 'Analisi completata',
      hint:
        custom?.hint ?? 'Ottimo lavoro! Continua a mantenere il ritmo naturale.',
    });
  };

  const handleStopRecording = async () => {
    const uri = await stopRecording();
      if (uri) {
      handleMockFeedback();
    } else {
      setAssistantState('idle');
      }
  };

  const handleToggleRecordingWrapper = async () => {
    if (isRecording) {
      await handleStopRecording();
    } else {
      await handleStartRecording();
    }
  };

  return (
    <BrandBackground>
      <ScrollView
        contentContainerStyle={{padding: sizes.md}}
        showsVerticalScrollIndicator={false}>
        <Block row justify="space-between" align="center" marginBottom={sizes.sm}>
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
          <BrandChip
            label="Progressi"
            tone="neutral"
            onPress={() => navigation.navigate('ProgressOverview')}
          />
        </Block>

        <BrandSectionHeader
          title="Sessione di pronuncia"
          subtitle="Focus: consonanti sonore & intonazione"
          action={<BrandChip label="Configurazione" tone="neutral" onPress={() => {}} />}
        />

        <BrandSurface tone="glass" style={{marginBottom: sizes.l}}>
          <Block align="center" marginBottom={sizes.m}>
            <AssistantOrb state={assistantState} size={180} />
            <Text white semibold size={sizes.h5} marginTop={sizes.sm}>
              {practice.tutorName}
            </Text>
            <Text center color="rgba(255,255,255,0.76)" size={sizes.p - 1}>
              {practice.coachMessage}
            </Text>
            <BrandActionButton
              label={
                isRecording
                  ? 'Detén la grabación'
                  : 'Comienza a practicar'
              }
              onPress={handleToggleRecordingWrapper}
              style={{
                marginTop: sizes.sm,
                width: '70%',
              }}
            />
          </Block>

          <BrandSurface tone="neutral" style={{marginBottom: sizes.m}}>
            <Text color={colors.white} marginBottom={sizes.xs}>
              Frase obiettivo
            </Text>
            <Text white semibold size={sizes.p}>
              {practice.targetSentence}
            </Text>
          </BrandSurface>

          <BrandSectionHeader
            title="Suggerimenti AI in tempo reale"
            subtitle="Affronta prima questi punti"
          />
          {liveFeedback.map(item => (
            <BrandSurface tone="neutral" key={item.id} style={{marginBottom: sizes.sm}}>
              <Text bold color={colors.white}>
                {item.label}
              </Text>
              <Text size={sizes.p - 2} color="rgba(255,255,255,0.72)">
                {item.hint}
              </Text>
            </BrandSurface>
          ))}

          <BrandSectionHeader
            title="Progresso della sessione"
            subtitle={`Esercizi completati ${sessionProgress.completed} di ${sessionProgress.total}`}
          />
          <BrandProgressBar value={sessionProgress.percentage} />

          <Block row justify="space-between" marginTop={sizes.l}>
            <Button
              flex={0}
              radius={sizes.cardRadius}
              color="rgba(255,255,255,0.12)"
              style={{
                width: sizes.xl * 2.2,
                height: sizes.xl * 2.2,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={handleToggleRecordingWrapper}>
              <Block
                width={72}
                height={72}
                radius={36}
                gradient={isRecording ? gradients.warning : gradients.primary}
                align="center"
                justify="center">
                <Image
                  source={icons.chat}
                  width={28}
                  height={28}
                  color={colors.white}
                  radius={0}
                />
              </Block>
              <Text
                marginTop={sizes.xs}
                color="rgba(255,255,255,0.82)"
                semibold
                size={sizes.p - 2}>
                {isRecording ? 'Registrando…' : 'Inizia registrazione'}
              </Text>
            </Button>

            <BrandSurface
              tone="neutral"
              style={{
                flex: 1,
                marginLeft: sizes.sm,
                justifyContent: 'center',
              }}>
              <Text color="rgba(255,255,255,0.76)" size={sizes.p - 2}>
                Ultimo punteggio
              </Text>
              <Text h3 white semibold>
                {practice.lastScore}
              </Text>
              <Text size={sizes.p - 2} color="rgba(255,255,255,0.6)">
                Ottimo controllo dell’intonazione!
              </Text>
            </BrandSurface>
          </Block>

          {error ? (
            <BrandSurface tone="warning" style={{marginTop: sizes.sm}}>
              <Text white>{error}</Text>
            </BrandSurface>
          ) : null}

          {lastUri ? (
            <BrandSurface tone="glass" style={{marginTop: sizes.sm}}>
              <Text white semibold>
                Ultima registrazione salvata
              </Text>
              <Text size={sizes.p - 2} color="rgba(255,255,255,0.72)">
                {lastUri}
              </Text>
              <BrandActionButton
                label="Ripeti analisi"
                onPress={() =>
                  handleMockFeedback({
                    label: 'Ripetizione inviata',
                    hint: 'Abbiamo reinviato il sample al coach IA.',
                  })
                }
                style={{marginTop: sizes.sm}}
              />
              <BrandActionButton
                label="Reset"
                onPress={handleResetRecording}
                style={{marginTop: sizes.xs}}
              />
            </BrandSurface>
          ) : null}
        </BrandSurface>

        <BrandSectionHeader
          title="Cronologia recente"
          subtitle="Analizza gli esercizi passati"
          action={<BrandChip label="Vedi tutto" tone="neutral" onPress={() => {}} />}
        />
        {practice.history.map(item => (
          <BrandSurface
            key={item.id}
            tone="neutral"
            style={{marginBottom: sizes.sm}}
            onPress={() => {}}>
            <Block row justify="space-between" align="center">
              <Block flex={1} marginRight={sizes.sm}>
                <Text color={colors.white} semibold>
                  {item.sentence}
                </Text>
                <Text size={sizes.p - 3} color="rgba(255,255,255,0.6)">
                  Feedback già integrato nella tua routine
                </Text>
              </Block>
              <BrandSurface tone="brand" style={{padding: sizes.xs}}>
                <Text white semibold>
                  {item.score}%
                </Text>
              </BrandSurface>
            </Block>
          </BrandSurface>
        ))}

        <BrandActionButton
          label="Termina sessione"
          onPress={() => {}}
          style={{marginTop: sizes.l}}
        />
      </ScrollView>
    </BrandBackground>
  );
};

export default PracticeSession;

