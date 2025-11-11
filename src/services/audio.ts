import {Audio} from 'expo-audio';

export interface RecordingHandle {
  recording?: Audio.Recording;
  start: () => Promise<void>;
  stop: () => Promise<string | null>;
  reset: () => void;
}

export const createRecordingHandle = (): RecordingHandle => {
  let recording: Audio.Recording | undefined;

  const start = async () => {
    const permission = await Audio.requestPermissionsAsync();
    if (!permission.granted) {
      throw new Error('Recording permission not granted');
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      playThroughEarpieceAndroid: false,
    });

    const newRecording = new Audio.Recording();
    await newRecording.prepareToRecordAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY,
    );
    await newRecording.startAsync();
    recording = newRecording;
  };

  const stop = async () => {
    if (!recording) {
      return null;
    }

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      recording = undefined;
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
      return uri;
    } catch (error) {
      recording = undefined;
      throw error;
    }
  };

  const reset = () => {
    recording = undefined;
  };

  return {recording, start, stop, reset};
};

