"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import {
  loadPerformanceBodyData,
  type PerformanceBioimpedanceLog,
  type PerformanceProfile,
  type PerformanceWeightLog,
} from "@/lib/performance/loadPerformanceBodyData";

type UsePerformanceDataResult = {
  userId: string | null;
  profile: PerformanceProfile | null;
  weightLogs: PerformanceWeightLog[];
  bioimpedanceLogs: PerformanceBioimpedanceLog[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export default function usePerformanceData(): UsePerformanceDataResult {
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] =
    useState<PerformanceProfile | null>(null);

  const [weightLogs, setWeightLogs] = useState<
    PerformanceWeightLog[]
  >([]);

  const [bioimpedanceLogs, setBioimpedanceLogs] = useState<
    PerformanceBioimpedanceLog[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } =
        await supabaseBrowser.auth.getUser();

      if (authError) {
        throw new Error(authError.message);
      }

      const user = data.user;

      if (!user) {
        setUserId(null);
        setProfile(null);
        setWeightLogs([]);
        setBioimpedanceLogs([]);
        return;
      }

      setUserId(user.id);

      const bodyData = await loadPerformanceBodyData(
        supabaseBrowser,
        user.id
      );

      setProfile(bodyData.profile);
      setWeightLogs(bodyData.weightLogs);
      setBioimpedanceLogs(bodyData.bioimpedanceLogs);
    } catch (loadError: unknown) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "Não foi possível carregar os dados corporais.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    userId,
    profile,
    weightLogs,
    bioimpedanceLogs,
    loading,
    error,
    refresh,
  };
}
