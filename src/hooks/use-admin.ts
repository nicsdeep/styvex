import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/integrations/supabase/client";

export function useAdmin() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["admin-role", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .eq("role", "admin");
      if (error) throw error;
      return !!data?.length;
    },
  });
}
