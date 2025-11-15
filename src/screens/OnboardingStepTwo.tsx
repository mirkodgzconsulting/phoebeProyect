import React, {useCallback, useMemo, useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {useNavigation} from '@react-navigation/native';

import {useTheme, useTranslation} from '../hooks/';
import {
  AssistantOrb,
  Block,
  BrandActionButton,
  BrandBackground,
  Text,
} from '../components/';

const TOTAL_STEPS = 8;
const CURRENT_STEP = 2;

const BRAND_GRADIENT = ['#0B3D4D', '#60CB58'] as const;

const INTERESTS = [
  {
    id: 'shopping',
    label: 'Shopping',
    emoji: '🛍️',
    activeGradient: ['#F78CA0', '#F9748F'] as const,
  },
  {
    id: 'travel',
    label: 'Viaggiare',
    emoji: '✈️',
    activeGradient: ['#43E97B', '#38F9D7'] as const,
  },
  {
    id: 'videogames',
    label: 'Videogiochi',
    emoji: '🎮',
    activeGradient: ['#30CFFB', '#6591F2'] as const,
  },
  {
    id: 'art',
    label: 'Arte',
    emoji: '🎨',
    activeGradient: ['#FEC163', '#DE4313'] as const,
  },
  {
    id: 'movies',
    label: 'Cinema e intrattenimento',
    emoji: '🎬',
    activeGradient: ['#7F7CFF', '#00F5FF'] as const,
  },
  {
    id: 'cooking',
    label: 'Cucinare',
    emoji: '🍳',
    activeGradient: ['#F6D365', '#FDA085'] as const,
  },
  {
    id: 'photography',
    label: 'Fotografia',
    emoji: '📸',
    activeGradient: ['#A18CD1', '#FBC2EB'] as const,
  },
  {
    id: 'sports',
    label: 'Sport',
    emoji: '⚽️',
    activeGradient: ['#8EC5FC', '#E0C3FC'] as const,
  },
  {
    id: 'technology',
    label: 'Tecnologia',
    emoji: '💻',
    activeGradient: ['#4FACFE', '#00F2FE'] as const,
  },
  {
    id: 'current-events',
    label: 'Attualità e cultura pop',
    emoji: '🗞️',
    activeGradient: ['#FBD786', '#f7797d'] as const,
  },
  {
    id: 'personal-growth',
    label: 'Crescita personale e benessere',
    emoji: '🧘',
    activeGradient: ['#7F7CFF', '#00F5FF'] as const,
    fullWidth: true,
  },
];

const PROGRESS_GRADIENT = BRAND_GRADIENT;
const CARD_INACTIVE_BG = 'rgba(255,255,255,0.07)';
const CARD_BORDER_INACTIVE = 'rgba(255,255,255,0.18)';
const CARD_BORDER_ACTIVE = 'rgba(255,255,255,0.38)';

const OnboardingStepTwo = () => {
  const {sizes} = useTheme();
  const {t} = useTranslation();
  const navigation = useNavigation<any>();

  const [selected, setSelected] = useState<string[]>([]);

  const progress = useMemo(
    () => Math.min((CURRENT_STEP / TOTAL_STEPS) * 100, 100),
    [],
  );

  const handleToggle = useCallback((id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id],
    );
  }, []);

  const handleContinue = useCallback(() => {
    if (selected.length >= 2) {
      navigation.navigate('OnboardingStepThree');
    }
  }, [navigation, selected.length]);

  const continueDisabled = selected.length < 2;

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
          <Block align="center" marginBottom={0}>
            <AssistantOrb size={160} state="idle" />
          </Block>

          <Block
            align="center"
            marginHorizontal={sizes.sm}
            marginBottom={0}>
            <Text h5 center white marginBottom={0}>
              Quali sono i tuoi interessi?
            </Text>
            <Text center size={sizes.text} color="rgba(255,255,255,0.76)" marginTop={0}>
              Aiutaci a personalizzare gli argomenti delle lezioni. Scegli 2-3
              opzioni.
            </Text>
          </Block>

          <View style={styles.grid}>
            {INTERESTS.map(option => {
              const isActive = selected.includes(option.id);

              return (
                <Pressable
                  key={option.id}
                  onPress={() => handleToggle(option.id)}
                  style={[styles.cardWrapper, option.id === 'technology' && styles.cardWrapperFull]}
                  android_ripple={{color: 'rgba(255,255,255,0.08)'}}
                  accessibilityRole="button">
                  <LinearGradient
                    colors={
                      isActive
                        ? option.activeGradient
                        : [CARD_INACTIVE_BG, CARD_INACTIVE_BG]
                    }
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 1}}
                    style={[
                      styles.card,
                      {
                        borderColor: isActive
                          ? CARD_BORDER_ACTIVE
                          : CARD_BORDER_INACTIVE,
                      },
                    ]}>
                    <View style={styles.iconBadge}>
                      <Text style={styles.iconEmoji} white>
                        {option.emoji}
                      </Text>
                    </View>
                    <Text
                      center
                      white
                      semibold
                      size={sizes.p - 1}
                      numberOfLines={2}>
                      {option.label}
                    </Text>
                  </LinearGradient>
                </Pressable>
              );
            })}
          </View>

          <Block marginTop={sizes.l} marginBottom={sizes.m}>
            <BrandActionButton
              label={t('common.continue') || 'Continua'}
              onPress={handleContinue}
              disabled={continueDisabled}
              style={styles.continueButton}
              disabledStyle={styles.continueDisabled}
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
  grid: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardWrapper: {
    width: '48%',
    marginBottom: 14,
  },
  cardWrapperFull: {
    width: '100%',
  },
  card: {
    minHeight: 90,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: 'rgba(0,0,0,0.45)',
    shadowOpacity: 0.3,
    shadowOffset: {width: 0, height: 6},
    shadowRadius: 10,
    elevation: 4,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  iconEmoji: {
    fontSize: 24,
    lineHeight: 26,
  },
  continueButton: {
    borderRadius: 20,
    paddingVertical: 10,
  },
  continueDisabled: {
    opacity: 0.6,
  },
});

export default OnboardingStepTwo;

