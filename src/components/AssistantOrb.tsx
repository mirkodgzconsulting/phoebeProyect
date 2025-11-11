import React, {useEffect, useMemo} from 'react';
import {StyleSheet} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import {LinearGradient} from 'expo-linear-gradient';

import {useTheme} from '../hooks';

export type AssistantOrbState = 'idle' | 'listening' | 'speaking';

type AssistantOrbProps = {
  state?: AssistantOrbState;
  size?: number;
};

const AssistantOrb = ({state = 'idle', size = 140}: AssistantOrbProps) => {
  const {gradients, colors} = useTheme();

  const haloScale = useSharedValue(1);
  const haloOpacity = useSharedValue(0.35);
  const coreScale = useSharedValue(1);

  useEffect(() => {
    if (state === 'listening') {
      haloScale.value = withRepeat(withTiming(1.35, {duration: 1400}), -1, true);
      haloOpacity.value = withRepeat(
        withSequence(
          withTiming(0.55, {duration: 700}),
          withTiming(0.25, {duration: 700}),
        ),
        -1,
        false,
      );
      coreScale.value = withTiming(1.05, {duration: 400});
    } else if (state === 'speaking') {
      haloScale.value = withRepeat(withTiming(1.22, {duration: 900}), -1, true);
      haloOpacity.value = withTiming(0.45, {duration: 280});
      coreScale.value = withRepeat(withTiming(1.09, {duration: 320}), -1, true);
    } else {
      haloScale.value = withTiming(1, {duration: 450});
      haloOpacity.value = withTiming(0.28, {duration: 450});
      coreScale.value = withTiming(1, {duration: 450});
    }
  }, [state, haloOpacity, haloScale, coreScale]);

  const haloAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: haloScale.value}],
    opacity: haloOpacity.value,
  }));

  const coreAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: coreScale.value}],
  }));

  const bars = useMemo(() => Array.from({length: 4}), []);

  const gradient =
    gradients?.primary ?? (['#0B3D4D', '#60CB58'] as const);

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          width: size,
          height: size,
        },
      ]}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.halo,
          {
            backgroundColor: colors.primary ?? '#0B3D4D',
          },
          haloAnimatedStyle,
        ]}
      />

      <Animated.View style={[styles.core, coreAnimatedStyle]}>
        <LinearGradient
          colors={gradient}
          start={{x: 0.1, y: 0.1}}
          end={{x: 0.9, y: 0.9}}
          style={styles.gradient}
        />
        <Animated.View style={styles.innerGlow} />

        {state === 'speaking' && (
          <Animated.View style={styles.barsContainer}>
            {bars.map((_, idx) => (
              <SpeakingBar key={idx} index={idx} />
            ))}
          </Animated.View>
        )}
      </Animated.View>
    </Animated.View>
  );
};

const SpeakingBar = ({index}: {index: number}) => {
  const height = useSharedValue(16);

  useEffect(() => {
    height.value = withDelay(
      index * 90,
      withRepeat(
        withSequence(
          withTiming(44, {duration: 220}),
          withTiming(20, {duration: 180}),
        ),
        -1,
        true,
      ),
    );
  }, [height, index]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return <Animated.View style={[styles.bar, animatedStyle]} />;
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    width: '92%',
    height: '92%',
    borderRadius: 999,
    opacity: 0.32,
  },
  core: {
    width: '68%',
    height: '68%',
    borderRadius: 999,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(0,0,0,0.45)',
    shadowOpacity: 0.35,
    shadowOffset: {width: 0, height: 8},
    shadowRadius: 18,
    elevation: 6,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  innerGlow: {
    position: 'absolute',
    width: '78%',
    height: '78%',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8,
  },
  bar: {
    width: 6,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
});

export default AssistantOrb;

