import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function BrandLogo({
  footer = false,
  mobile = false,
}: {
  footer?: boolean;
  mobile?: boolean;
}) {
  const { data, isError } = useQuery({
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
  const height = footer ? (data?.footer_height ?? 40) : 24;
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center"
      style={{ width: footer ? 149 : 110, height: footer ? height : 32 }}
    >
      <img
        src={
          footer
            ? (data?.footer_logo ?? "/styvex-footer-white.svg")
            : (data?.header_logo ?? "/styvex_logo2.svg")
        }
        alt="STYVEX"
        width={149}
        height={40}
        style={{
          height: mobile ? Math.min(height, 36) : height,
          width: "100%",
          objectFit: "contain",
          visibility: data || isError ? "visible" : "hidden",
        }}
      />
    </span>
  );
}
