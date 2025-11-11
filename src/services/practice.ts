import {EventEmitter} from 'events';

import {
  PRACTICE_SESSION_DATA,
  PRACTICE_HISTORY,
} from '../constants/mocks';
import {
  IPracticeHistoryItem,
  IPracticeSessionData,
  IPhonemeHint,
} from '../constants/types';

const practiceEmitter = new EventEmitter();

export const fetchPracticeSession = async (): Promise<IPracticeSessionData> => {
  return Promise.resolve(PRACTICE_SESSION_DATA);
};

export const fetchPracticeHistory = async (): Promise<
  IPracticeHistoryItem[]
> => Promise.resolve(PRACTICE_HISTORY);

export const subscribePracticeFeedback = (
  listener: (hint: IPhonemeHint) => void,
) => {
  practiceEmitter.on('feedback', listener);
  return () => practiceEmitter.removeListener('feedback', listener);
};

export const emitMockFeedback = (hint: IPhonemeHint) => {
  practiceEmitter.emit('feedback', hint);
};

