import React, {useCallback, useEffect, useRef} from 'react';
import {Animated, StyleSheet, View} from 'react-native';
import {AVPlaybackStatus, ResizeMode, Video} from 'expo-av';

type RolePlayAvatarMode = 'speaking' | 'listening' | 'idle';

type RolePlayAvatarProps = {
  mode: RolePlayAvatarMode;
  size?: number;
};

const AVATAR_SPEAKING = require('../../assets/habla.mp4');
const IDLE_FRAME_MS = 220;

const RolePlayAvatar = ({mode, size = 260}: RolePlayAvatarProps) => {
  const bounce = useRef(new Animated.Value(0)).current;
  const speakingRef = useRef<Video | null>(null);
  const hasLoadedVideoRef = useRef(false);

  const syncVideoWithMode = useCallback(
    async (targetMode: RolePlayAvatarMode) => {
      const video = speakingRef.current;
      if (!video) {
        return;
      }

      try {
        const status = await video.getStatusAsync();
        if (!status.isLoaded) {
          return;
        }

        if (targetMode === 'speaking') {
          await video.setPositionAsync(0);
          await video.playAsync();
        } else {
          if (status.isPlaying) {
            await video.pauseAsync();
          }
          if (IDLE_FRAME_MS >= 0) {
            await video.setPositionAsync(IDLE_FRAME_MS);
          }
        }
      } catch (error) {
        if (__DEV__) {
          console.warn('Avatar video sync error', error);
        }
      }
    },
    [],
  );

  useEffect(() => {
    if (hasLoadedVideoRef.current) {
      syncVideoWithMode(mode);
    }
  }, [mode, syncVideoWithMode]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, {
          toValue: 1,
          duration: 2400,
          useNativeDriver: true,
        }),
        Animated.timing(bounce, {
          toValue: 0,
          duration: 2400,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [bounce]);

  const animatedContainerStyle = {
    transform: [
      {
        translateY: bounce.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -6],
        }),
      },
      {
        scale: bounce.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.02],
        }),
      },
    ],
  };

  const borderRadius = size * 0.16;
  const videoStyle = styles.video;

  const handlePlaybackStatusUpdate = useCallback(
    (status: AVPlaybackStatus) => {
      if (!status.isLoaded) {
        if (status.error && __DEV__) {
          console.warn('RolePlay avatar playback error', status.error);
        }
        return;
      }

      if (!hasLoadedVideoRef.current) {
        hasLoadedVideoRef.current = true;
        syncVideoWithMode(mode);
      }
    },
    [mode, syncVideoWithMode],
  );

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius,
        },
        animatedContainerStyle,
      ]}>
      <Video
        ref={(ref) => {
          speakingRef.current = ref;
        }}
        source={AVATAR_SPEAKING}
        style={styles.video}
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay={false}
        isLooping
        isMuted
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
      />
      <View
        style={[
          styles.ring,
          {
            borderRadius,
          },
        ]}
        pointerEvents="none"
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    shadowColor: 'rgba(0,0,0,0.55)',
    shadowOpacity: 0.35,
    shadowRadius: 22,
    shadowOffset: {width: 0, height: 18},
    elevation: 8,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  ring: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 0,
    borderColor: 'transparent',
  },
});

export default RolePlayAvatar;


