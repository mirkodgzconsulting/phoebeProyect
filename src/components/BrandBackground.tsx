import React from 'react';
import {StyleSheet, View} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';

import Block from './Block';

interface BrandBackgroundProps {
  children: React.ReactNode;
}

// Contenedor de fondo global que centraliza el degradado de marca y los brillos decorativos
const BrandBackground = ({children}: BrandBackgroundProps) => {
  return (
    <LinearGradient colors={['#021F2A', '#0B3D4D']} style={styles.container}>
      <Block safe flex={1} color="transparent">
        <View style={styles.glowTopRight} />
        <View style={styles.glowBottomLeft} />
        {children}
      </Block>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  glowTopRight: {
    position: 'absolute',
    top: -80,
    right: -100,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(96,203,88,0.3)',
  },
  glowBottomLeft: {
    position: 'absolute',
    bottom: -60,
    left: -90,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(11,61,77,0.35)',
  },
});

export default BrandBackground;

