import {USER_PREFERENCES} from '../constants/mocks';
import {IUserPreferences} from '../constants/types';

let preferencesState: IUserPreferences = USER_PREFERENCES;

export const fetchPreferences = async (): Promise<IUserPreferences> => {
  return Promise.resolve(preferencesState);
};

export const updatePreferencesService = async (
  partial: Partial<IUserPreferences>,
): Promise<IUserPreferences> => {
  preferencesState = {...preferencesState, ...partial};
  return Promise.resolve(preferencesState);
};

