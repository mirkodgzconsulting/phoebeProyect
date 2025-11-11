import React, {useMemo} from 'react';
import {ScrollView} from 'react-native';
import {DrawerActions, useNavigation} from '@react-navigation/native';

import {
  Block,
  BrandActionButton,
  BrandBackground,
  BrandChip,
  BrandProgressBar,
  BrandSectionHeader,
  BrandSurface,
  Image,
  Text,
  Button,
} from '../components';
import {useData, useTheme} from '../hooks';

const Profile = () => {
  const {user, progress, preferences, practice} = useData();
  const {sizes, colors, assets} = useTheme();
  const navigation = useNavigation<any>();

  const streak = useMemo(() => {
    const streakMilestone = progress.milestones.find(m => m.id === 'streak');
    if (!streakMilestone) {
      return {label: 'Streak attuale', value: 0, target: 7};
    }
    const value = parseInt(streakMilestone.value, 10) || 0;
    return {label: 'Streak attuale', value, target: 7};
  }, [progress.milestones]);

  return (
    <BrandBackground>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{padding: sizes.md}}>
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
            label="Dashboard"
            tone="neutral"
            onPress={() => navigation.navigate('Dashboard')}
          />
        </Block>

        <BrandSectionHeader
          title={user?.name || 'Studente'}
          subtitle={user?.department || 'Percorso personalizzato'}
          action={<BrandChip tone="outline" label="Modifica" onPress={() => {}} />}
        />

        <BrandSurface tone="glass" style={{marginBottom: sizes.l}}>
          <Block align="center" marginBottom={sizes.m}>
            <Image
              source={user?.avatar ? {uri: user.avatar} : assets.avatar1}
              width={96}
              height={96}
              radius={48}
              style={{marginBottom: sizes.sm}}
            />
            <Text center color="rgba(255,255,255,0.76)">
              {user?.about ||
                'Continua a esercitarti qualche minuto al giorno per consolidare la tua pronuncia.'}
            </Text>
          </Block>

          <BrandSectionHeader
            title="La tua streak"
            subtitle="Costruisci l’abitudine quotidiana"
          />
          <BrandProgressBar
            value={streak.value}
            total={streak.target}
            label={streak.label}
          />

          <Block
            row
            justify="space-between"
            marginTop={sizes.md}
            marginBottom={sizes.sm}>
            <BrandSurface tone="neutral" style={{width: '48%'}}>
              <Text color={colors.white} semibold>
                Accento preferito
              </Text>
              <Text size={sizes.p - 2} color="rgba(255,255,255,0.7)">
                {preferences.accent}
              </Text>
            </BrandSurface>

            <BrandSurface tone="neutral" style={{width: '48%'}}>
              <Text color={colors.white} semibold>
                Livello target
              </Text>
              <Text size={sizes.p - 2} color="rgba(255,255,255,0.7)">
                {preferences.targetLevel}
              </Text>
            </BrandSurface>
          </Block>

          <BrandSurface tone="neutral">
            <Text color={colors.white} semibold marginBottom={sizes.xs}>
              Tempo totale di pratica
            </Text>
            <Text size={sizes.p - 2} color="rgba(255,255,255,0.7)">
              {progress.milestones.find(m => m.id === 'hours')?.value || '0h 0m'}
            </Text>
          </BrandSurface>
        </BrandSurface>

        <BrandSectionHeader
          title="Feedback recenti"
          subtitle="Basati sulle ultime sessioni con l’IA"
        />
        <BrandSurface tone="neutral" style={{marginBottom: sizes.sm}}>
          <Text color={colors.white} semibold marginBottom={sizes.xs}>
            Prossimo focus suggerito
          </Text>
          <Text size={sizes.p - 2} color="rgba(255,255,255,0.7)" marginBottom={sizes.sm}>
            Lavora su "{practice.history[0]?.sentence || practice.targetSentence}" per migliorare ancora.
          </Text>
          <BrandActionButton label="Ripeti esercizio" onPress={() => {}} />
        </BrandSurface>

        <BrandSectionHeader
          title="Badge & motivazione"
          subtitle="Tieniti ispirato lungo il percorso"
        />
        {progress.milestones.map(milestone => (
          <BrandSurface key={milestone.id} tone="glass" style={{marginBottom: sizes.sm}}>
            <Text white semibold>
              {milestone.title}
            </Text>
            <Text h5 white marginTop={sizes.xs} marginBottom={sizes.xs / 2}>
              {milestone.value}
            </Text>
            <Text size={sizes.p - 2} color="rgba(255,255,255,0.72)">
              {milestone.description}
            </Text>
          </BrandSurface>
        ))}
      </ScrollView>
    </BrandBackground>
  );
};

export default Profile;
