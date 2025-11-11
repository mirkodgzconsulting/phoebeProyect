import {
  PROGRESS_OVERVIEW_DATA,
  WEEKLY_SCORES,
  FOCUS_AREAS,
  MILESTONES,
} from '../constants/mocks';
import {
  IProgressOverviewData,
  IWeeklyScore,
  IFocusArea,
  IMilestone,
} from '../constants/types';

export const fetchProgressOverview =
  async (): Promise<IProgressOverviewData> => {
    return Promise.resolve(PROGRESS_OVERVIEW_DATA);
  };

export const fetchWeeklyScores = async (): Promise<IWeeklyScore[]> =>
  Promise.resolve(WEEKLY_SCORES);

export const fetchFocusAreas = async (): Promise<IFocusArea[]> =>
  Promise.resolve(FOCUS_AREAS);

export const fetchMilestones = async (): Promise<IMilestone[]> =>
  Promise.resolve(MILESTONES);

