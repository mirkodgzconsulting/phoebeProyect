import React, {useCallback, useMemo, useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';

import {useData, useTheme, useTranslation} from '../hooks/';
import {
  AssistantOrb,
  Block,
  Image,
  Text,
  BrandBackground,
  BrandActionButton,
} from '../components/';

const TOTAL_STEPS = 4;
const CURRENT_STEP = 4;

const BRAND_GRADIENT = ['#0B3D4D', '#60CB58'] as const;

type TutorOption = {
  id: string;
  name: string;
  country: string;
  traits: string[];
  avatar: any;
};

const TUTORS: TutorOption[] = [
  {
    id: 'marco',
    name: 'Marco',
    country: '🇮🇹',
    traits: ['Empatico', 'Motivante', 'Chiacchierone'],
    avatar: require('../assets/images/avatar1.png'),
  },
  {
    id: 'giulia',
    name: 'Giulia',
    country: '🇮🇹',
    traits: ['Solare', 'Coinvolgente', 'Creativa'],
    avatar: require('../assets/images/avatar2.png'),
  },
];
const PROGRESS_GRADIENT = BRAND_GRADIENT;
const CARD_INACTIVE_BG = 'rgba(11,61,77,0.12)';
const CARD_BORDER_INACTIVE = 'rgba(255,255,255,0.18)';
const CARD_BORDER_ACTIVE = 'rgba(255,255,255,0.38)';

const OnboardingStepFour = () => {
  const {completeOnboarding} = useData();
  const {colors, sizes, icons} = useTheme();
  const {t} = useTranslation();

  const [selected, setSelected] = useState<string | null>(null);

  const progress = useMemo(
    () => Math.min((CURRENT_STEP / TOTAL_STEPS) * 100, 100),
    [],
  );

  const handleSelect = useCallback((id: string) => {
    setSelected(id);
  }, []);

  const handleContinue = useCallback(() => {
    if (!selected) {
      return;
    }
    completeOnboarding();
  }, [completeOnboarding, selected]);

  const continueDisabled = useMemo(() => selected === null, [selected]);

  return (
    <BrandBackground>
      <View style={styles.header}>
        <View style={styles.progressTrack}>
          <LinearGradient
            colors={PROGRESS_GRADIENT}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}
            style={[styles.progressFill, {width: `${progress}%`}]}>
            <View />
          </LinearGradient>
        </View>
      </View>

      <Block
        scroll
        color="transparent"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        <Block align="center" marginBottom={sizes.m}>
          <AssistantOrb size={132} state="idle" />
        </Block>

        <Block align="center" marginHorizontal={sizes.sm} marginBottom={sizes.m}>
          <Text h4 center white marginBottom={sizes.xs}>
            Scegli il tuo Tutor IA
          </Text>
          <Text center size={sizes.s} color="rgba(255,255,255,0.76)">
            Seleziona il tutor che vuoi nell’app. Potrai cambiarlo in qualsiasi
            momento.
          </Text>
        </Block>

        <View style={styles.tutorList}>
          {TUTORS.map(tutor => {
            const isActive = selected === tutor.id;

            return (
              <Pressable
                key={tutor.id}
                onPress={() => handleSelect(tutor.id)}
                style={styles.tutorRow}
                android_ripple={{color: 'rgba(255,255,255,0.08)'}}
                accessibilityRole="button">
                <LinearGradient
                  colors={
                    isActive
                      ? PROGRESS_GRADIENT
                      : [CARD_INACTIVE_BG, CARD_INACTIVE_BG]
                  }
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={[
                    styles.tutorCard,
                    {
                      borderColor: isActive
                        ? CARD_BORDER_ACTIVE
                        : CARD_BORDER_INACTIVE,
                    },
                  ]}>
                  <View style={styles.tutorInfo}>
                    <Image
                      source={tutor.avatar}
                      width={52}
                      height={52}
                      radius={18}
                    />
                    <View style={styles.tutorText}>
                      <View style={styles.tutorTitle}>
                        <Text white semibold size={sizes.p - 1}>
                          {tutor.name}
                        </Text>
                        <Text white size={sizes.s} marginLeft={sizes.xs}>
                          {tutor.country}
                        </Text>
                      </View>
                      <Text size={sizes.s} color="rgba(255,255,255,0.75)" marginTop={4}>
                        {tutor.traits.join(' • ')}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.playBadge}>
                    <LinearGradient
                      colors={['rgba(11,61,77,0.25)', 'rgba(96,203,88,0.35)']}
                      start={{x: 0, y: 0}}
                      end={{x: 1, y: 1}}
                      style={styles.playButton}>
                      <Image
                        source={icons.notification}
                        width={18}
                        height={18}
                        radius={0}
                        color={colors.white}
                      />
                    </LinearGradient>
                  </View>
                </LinearGradient>
              </Pressable>
            );
          })}
        </View>

        <Block marginTop={sizes.l} marginBottom={sizes.m}>
          <BrandActionButton
            label={t('common.continue') || 'Conferma tutor'}
            onPress={handleContinue}
            disabled={continueDisabled}
          />
        </Block>
      </Block>
    </BrandBackground>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 4,
  },
  progressTrack: {
    height: 3,
    width: '100%',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.14)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  tutorList: {
    width: '100%',
    gap: 12,
  },
  tutorRow: {
    width: '100%',
  },
  tutorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    shadowColor: 'rgba(0,0,0,0.45)',
    shadowOpacity: 0.3,
    shadowOffset: {width: 0, height: 6},
    shadowRadius: 10,
    elevation: 4,
  },
  tutorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  tutorText: {
    flex: 1,
  },
  tutorTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playBadge: {
    marginLeft: 16,
  },
  playButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default OnboardingStepFour;

