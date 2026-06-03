import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type StudioSettingKey =
  | "studio_info"
  | "booking_rules"
  | "email_config"
  | "master_data";

export function useStudioSettings<T = any>(key: StudioSettingKey) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["studio_settings", key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("studio_settings" as any)
        .select("value")
        .eq("key", key)
        .maybeSingle();
      if (error) throw error;
      return (data?.value ?? null) as T | null;
    },
  });

  const update = useMutation({
    mutationFn: async (value: T) => {
      const { error } = await supabase
        .from("studio_settings" as any)
        .upsert({ key, value: value as any, updated_at: new Date().toISOString() }, { onConflict: "key" });
      if (error) throw error;
      return value;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["studio_settings", key] });
    },
  });

  return { ...query, update };
}
