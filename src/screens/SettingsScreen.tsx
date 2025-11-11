import React from 'react';
import {ScrollView} from 'react-native';
import {DrawerActions, useNavigation} from '@react-navigation/native';

import {
  Block,
  BrandBackground,
  BrandChip,
  BrandSectionHeader,
  BrandSurface,
  Switch,
  Text,
  Button,
  Image,
} from '../components';
import {useData, useTheme, useTranslation} from '../hooks';

const SettingsScreen = () => {
  const {sizes, colors, assets} = useTheme();
  const {t} = useTranslation();
  const {isDark, handleIsDark, preferences, updatePreferences} = useData();
  const navigation = useNavigation<any>();

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
            label="Profilo"
            tone="neutral"
            onPress={() => navigation.navigate('Profile')}
          />
        </Block>

        <BrandSectionHeader
          title="Impostazioni"
          subtitle="Personalizza l’esperienza di apprendimento"
        />

        <BrandSurface tone="neutral" style={{marginBottom: sizes.l}}>
          <Text color={colors.white} semibold marginBottom={sizes.sm}>
            Preferenze generali
          </Text>
          <Block row justify="space-between" align="center" marginBottom={sizes.s}>
            <Block>
              <Text color={colors.white} semibold>
                Tema scuro
              </Text>
              <Text size={sizes.p - 2} color="rgba(255,255,255,0.7)">
                {t('darkMode')}
              </Text>
            </Block>
            <Switch checked={isDark} onPress={handleIsDark} />
          </Block>

          <Block row justify="space-between" align="center">
            <Block>
              <Text color={colors.white} semibold>
                Promemoria quotidiani
              </Text>
              <Text size={sizes.p - 2} color="rgba(255,255,255,0.7)">
                Ricevi notifiche sulle sessioni pianificate
              </Text>
            </Block>
            <Switch
              checked={preferences.remindersEnabled}
              onPress={(checked) => updatePreferences({remindersEnabled: checked})}
            />
          </Block>
        </BrandSurface>

        <BrandSectionHeader
          title="Lingua e accenti"
          subtitle="Scegli obiettivi vocali specifici"
        />

        <BrandSurface tone="neutral" style={{marginBottom: sizes.sm}}>
          <Block row justify="space-between" align="center">
            <Text color={colors.white}>Accento preferito</Text>
            <BrandChip label={preferences.accent} tone="brand" />
          </Block>
        </BrandSurface>

        <BrandSurface tone="neutral">
          <Block row justify="space-between" align="center" marginBottom={sizes.sm}>
            <Text color={colors.white}>Livello target</Text>
            <BrandChip label={preferences.targetLevel} tone="outline" />
          </Block>
          <Block row justify="space-between" align="center">
            <Text color={colors.white}>Difficoltà lezioni</Text>
            <BrandChip label="Adattiva" tone="brand" />
          </Block>
        </BrandSurface>
      </ScrollView>
    </BrandBackground>
  );
};

export default SettingsScreen;

