import {
  DASHBOARD_DATA,
  LESSON_RECOMMENDATIONS,
  QUICK_ACTIONS,
  DAILY_GOALS,
} from '../constants/mocks';
import {
  IDashboardData,
  IDailyGoal,
  ILessonRecommendation,
  IQuickAction,
} from '../constants/types';

export const fetchDashboard = async (): Promise<IDashboardData> => {
  return Promise.resolve(DASHBOARD_DATA);
};

export const fetchDailyGoals = async (): Promise<IDailyGoal[]> => {
  return Promise.resolve(DAILY_GOALS);
};

export const fetchLessonRecommendations = async (): Promise<
  ILessonRecommendation[]
> => Promise.resolve(LESSON_RECOMMENDATIONS);

export const fetchQuickActions = async (): Promise<IQuickAction[]> =>
  Promise.resolve(QUICK_ACTIONS);

