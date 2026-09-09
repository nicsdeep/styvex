import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/account/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  // If unauthenticated, redirect to account
  if (!isLoading && !user) {
    navigate({ to: "/account", replace: true });
    return null;
  }

  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    const fullName = formData.get("fullName") as string;
    const whatsapp = formData.get("whatsapp") as string;
    
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          whatsapp_number: whatsapp,
        })
        .eq("id", user.id);
        
      if (error) throw error;
      
      await queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      toast.success("Profile updated successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 pb-16">
        <h1 className="text-3xl font-semibold mt-10">My Profile</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your personal information and contact details.
        </p>

        {isProfileLoading || isLoading ? (
          <div className="mt-12 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-10 space-y-8">
            <div className="space-y-6 rounded-2xl border border-border p-6 shadow-sm">
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ""}
                  className="w-full rounded-xl border border-border bg-neutral-50 px-4 py-3 text-sm text-muted-foreground cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">Your email cannot be changed here.</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="fullName" className="text-sm font-semibold text-foreground">Full Name</label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  defaultValue={profile?.full_name || ""}
                  placeholder="Enter your full name"
                  className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm transition focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="whatsapp" className="text-sm font-semibold text-foreground">WhatsApp Number</label>
                <input
                  id="whatsapp"
                  name="whatsapp"
                  type="tel"
                  defaultValue={profile?.whatsapp_number || ""}
                  placeholder="+1 (555) 000-0000"
                  className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm transition focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>

            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center justify-center rounded-xl bg-ink px-8 py-3.5 text-sm font-bold text-white transition hover:bg-ink/90 active:scale-[0.98] disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </form>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
