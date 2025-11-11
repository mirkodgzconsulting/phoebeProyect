import {useCallback, useRef, useState} from 'react';

import {createRecordingHandle} from '../services/audio';

interface PracticeAudioState {
  isRecording: boolean;
  isPlaying: boolean;
  lastUri: string | null;
  error: string | null;
}

const initialState: PracticeAudioState = {
  isRecording: false,
  isPlaying: false,
  lastUri: null,
  error: null,
};

export const usePracticeAudio = () => {
  const [state, setState] = useState<PracticeAudioState>(initialState);
  const recordingHandleRef = useRef(createRecordingHandle());

  const startRecording = useCallback(async () => {
    try {
      setState(prev => ({...prev, isRecording: true, error: null}));
      await recordingHandleRef.current.start();
    } catch (error) {
      setState(prev => ({
        ...prev,
        isRecording: false,
        error: error instanceof Error ? error.message : 'Recording failed',
      }));
    }
  }, []);

  const stopRecording = useCallback(async () => {
    try {
      const uri = await recordingHandleRef.current.stop();
      setState(prev => ({
        ...prev,
        isRecording: false,
        lastUri: uri,
      }));
      return uri;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isRecording: false,
        error: error instanceof Error ? error.message : 'Stop failed',
      }));
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    recordingHandleRef.current.reset();
    setState(initialState);
  }, []);

  return {
    ...state,
    startRecording,
    stopRecording,
    reset,
  };
};

export default usePracticeAudio;

