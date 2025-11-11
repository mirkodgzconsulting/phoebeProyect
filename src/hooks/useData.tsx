import React, {useCallback, useContext, useEffect, useState} from 'react';
import Storage from '@react-native-async-storage/async-storage';

import {
  IUser,
  IUseData,
  ITheme,
  IDashboardData,
  IPracticeSessionData,
  IProgressOverviewData,
  IUserPreferences,
} from '../constants/types';

import {
  USERS,
  DASHBOARD_DATA,
  PRACTICE_SESSION_DATA,
  PROGRESS_OVERVIEW_DATA,
  USER_PREFERENCES,
} from '../constants/mocks';
import {
  fetchDashboard,
  fetchPracticeSession,
  fetchProgressOverview,
  fetchPreferences,
  updatePreferencesService,
} from '../services';
import {light} from '../constants';
import {
  ensureProfile,
  getCurrentAuthUser,
  signInWithEmail,
  signOutFromSupabase,
  signUpWithEmail,
  startTrialForUser,
} from '../services/supabaseAuth';
import {supabase} from '../lib/supabaseClient';

export const DataContext = React.createContext({});

const DEFAULT_USER: IUser = {
  ...USERS[0],
};

export const DataProvider = ({children}: {children: React.ReactNode}) => {
  const [isDark, setIsDark] = useState(false);
  const [theme, setTheme] = useState<ITheme>(light);
  const [user, setUserState] = useState<IUser>(DEFAULT_USER);
  const [dashboard, setDashboard] = useState<IDashboardData>(DASHBOARD_DATA);
  const [practice, setPractice] = useState<IPracticeSessionData>(
    PRACTICE_SESSION_DATA,
  );
  const [progress, setProgress] = useState<IProgressOverviewData>(
    PROGRESS_OVERVIEW_DATA,
  );
  const [preferences, setPreferences] = useState<IUserPreferences>(
    USER_PREFERENCES,
  );
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [hasActiveTrial, setHasActiveTrial] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const completeOnboarding = useCallback(() => setHasOnboarded(true), []);

  const setUser = useCallback(
    (payload: Partial<IUser>) => {
      setUserState(prev => ({...prev, ...payload}));
    },
    [],
  );

  const updatePreferences = useCallback(
    async (payload: Partial<IUserPreferences>) => {
      const updated = await updatePreferencesService(payload);
      setPreferences(updated);
    },
    [],
  );

  // get isDark mode from storage
  const getIsDark = useCallback(async () => {
    const isDarkJSON = await Storage.getItem('isDark');

    if (isDarkJSON !== null) {
      setIsDark(JSON.parse(isDarkJSON));
    }
  }, [setIsDark]);

  const handleIsDark = useCallback(
    (payload: boolean) => {
      setIsDark(payload);
      Storage.setItem('isDark', JSON.stringify(payload));
    },
    [setIsDark],
  );

  useEffect(() => {
    getIsDark();
  }, [getIsDark]);

  useEffect(() => {
    setTheme(light);
  }, [isDark]);

  useEffect(() => {
    const loadData = async () => {
      const [dashboardData, practiceData, progressData, preferenceData] =
        await Promise.all([
          fetchDashboard(),
          fetchPracticeSession(),
          fetchProgressOverview(),
          fetchPreferences(),
        ]);
      setDashboard(dashboardData);
      setPractice(practiceData);
      setProgress(progressData);
      setPreferences(preferenceData);
    };

    loadData();
  }, []);

  const syncProfile = useCallback(
    async (authUser: {id: string; email?: string | null; user_metadata?: Record<string, unknown>}) => {
      if (!supabase) {
        return;
      }

      setIsProfileLoading(true);
      try {
        const profile = await ensureProfile(authUser.id, {
          id: authUser.id,
          full_name:
            (authUser.user_metadata?.full_name as string | undefined) ??
            authUser.email ??
            DEFAULT_USER.name ??
            'Alumno',
        });

        setUserState(prev => ({
          ...prev,
          id: authUser.id,
          name:
            profile?.full_name ??
            authUser.email ??
            prev.name ??
            DEFAULT_USER.name ??
            'Alumno Feliz Viaje',
          department: profile?.level ?? prev.department,
        }));

        setHasActiveTrial(Boolean(profile?.has_premium));
      } finally {
        setIsProfileLoading(false);
      }
    },
    [],
  );

  const refreshProfile = useCallback(async () => {
    const authUser = await getCurrentAuthUser();
    if (authUser) {
      await syncProfile(authUser);
      setIsAuthenticated(true);
    }
  }, [syncProfile]);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(async ({data}) => {
      if (!mounted) {
        return;
      }

      const authUser = data.session?.user;
      if (authUser) {
        setIsAuthenticated(true);
        await syncProfile(authUser);
      } else {
        setIsAuthenticated(false);
        setHasActiveTrial(false);
        setUserState(DEFAULT_USER);
      }
    });

    const {data: subscription} = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) {
          return;
        }

        if (session?.user) {
          setIsAuthenticated(true);
          await syncProfile(session.user);
        } else {
          setIsAuthenticated(false);
          setHasActiveTrial(false);
          setUserState(DEFAULT_USER);
        }
      },
    );

    return () => {
      mounted = false;
      subscription?.subscription.unsubscribe();
    };
  }, [syncProfile]);

  const signIn = useCallback(
    async ({email, password}: {email: string; password: string}) => {
      const authUser = await signInWithEmail({email, password});
      setIsAuthenticated(true);
      await syncProfile(authUser);
    },
    [syncProfile],
  );

  const signUp = useCallback(
    async ({
      email,
      password,
      fullName,
    }: {
      email: string;
      password: string;
      fullName: string;
    }) => {
      const {
        user: authUser,
        requiresEmailConfirmation,
      } = await signUpWithEmail({email, password, fullName});

      if (requiresEmailConfirmation) {
        setIsAuthenticated(false);
        setHasActiveTrial(false);
        setUserState(DEFAULT_USER);
        return 'confirmation_required';
      }

      setIsAuthenticated(true);
      await syncProfile(authUser);
      return 'signed_in';
    },
    [syncProfile],
  );

  const signOut = useCallback(async () => {
    await signOutFromSupabase();
    setIsAuthenticated(false);
    setHasActiveTrial(false);
    setUserState(DEFAULT_USER);
  }, []);

  const activateTrial = useCallback(async () => {
    const authUser = await getCurrentAuthUser();
    if (!authUser) {
      throw new Error('Debes iniciar sesión para activar la prueba gratuita.');
    }
    await startTrialForUser(authUser.id);
    setHasActiveTrial(true);
    await syncProfile(authUser);
  }, [syncProfile]);

  const contextValue: IUseData = {
    isDark,
    handleIsDark,
    theme,
    setTheme,
    isAuthenticated,
    hasOnboarded,
    hasActiveTrial,
    isProfileLoading,
    signIn,
    signUp,
    signOut,
    activateTrial,
    refreshProfile,
    completeOnboarding,
    user,
    setUser,
    dashboard,
    setDashboard,
    practice,
    setPractice,
    progress,
    setProgress,
    preferences,
    updatePreferences,
  };

  return (
    <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext) as IUseData;
