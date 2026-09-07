import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function BrandLogo({
  footer = false,
  mobile = false,
}: {
  footer?: boolean;
  mobile?: boolean;
}) {
  const { data } = useQuery({
    queryKey: ["brand-settings"],
    staleTime: 60000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_settings")
        .select("*")
        .eq("id", 1)
        .single();
      if (error) throw error;
      return data;
    },
  });
  const height = footer ? (data?.footer_height ?? 40) : (data?.header_height ?? 40);
  return (
    <img
      src={
        footer
          ? (data?.footer_logo ?? "/styvex-footer-white.svg")
          : (data?.header_logo ?? "/styvex_logo2.svg")
      }
      alt="STYVEX"
      width={149}
      height={40}
      style={{ height: mobile ? Math.min(height, 36) : height, width: "auto", maxWidth: "100%" }}
    />
  );
}
