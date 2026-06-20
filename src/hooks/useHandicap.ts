"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";

export interface UseHandicapReturn {
  handicap: number | null;
  previousHandicap: number | null;
  lastUpdated: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useHandicap(): UseHandicapReturn {
  const [handicap, setHandicap] = React.useState<number | null>(null);
  const [previousHandicap, setPreviousHandicap] = React.useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const supabase = React.useMemo(() => createClient(), []);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setHandicap(null);
        setPreviousHandicap(null);
        setLastUpdated(null);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("handicap_index")
        .eq("id", user.id)
        .single();

      const current = (profile?.handicap_index as number | null) ?? null;
      setHandicap(current);

      const { data: hist } = await supabase
        .from("handicap_history")
        .select("handicap_index, calculated_at")
        .eq("user_id", user.id)
        .order("calculated_at", { ascending: false })
        .limit(2);

      if (hist && hist.length > 0) {
        const latest = hist[0];
        setLastUpdated(latest.calculated_at);
        if (hist.length > 1) {
          setPreviousHandicap(hist[1].handicap_index as number);
        } else {
          setPreviousHandicap(null);
        }
      } else {
        setPreviousHandicap(null);
        setLastUpdated(null);
      }
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  React.useEffect(() => {
    load();
  }, [load]);

  return { handicap, previousHandicap, lastUpdated, loading, refresh: load };
}
