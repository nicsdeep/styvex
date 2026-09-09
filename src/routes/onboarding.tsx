import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
});

function OnboardingPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const categories = ["Bags", "Jewelry", "Women's Clothing", "Shoes", "Accessories"];

  async function completeOnboarding(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    setError("");
    
    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: name.trim(),
          whatsapp_number: whatsapp.trim(),
          interested_products: interests,
          is_onboarded: true,
        })
        .eq("id", user.id);
        
      if (updateError) throw updateError;
      
      // Navigate to home page
      void navigate({ to: "/", replace: true });
    } catch (err) {
      setError("Failed to save your profile. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function toggleInterest(category: string) {
    setInterests(prev => 
      prev.includes(category) 
        ? prev.filter(i => i !== category)
        : [...prev, category]
    );
  }

  const inputClass = "h-12 w-full rounded-lg border border-border bg-white px-4 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500";
  const labelClass = "block text-sm font-medium mb-1";
  
  if (isLoading) return null;
  if (!user) {
    void navigate({ to: "/account", replace: true });
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <SiteHeader />
      <main className="mx-auto w-full max-w-xl flex-1 px-6 pb-16 pt-12">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-100">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-emerald-600 mb-2">Welcome to STYVEX!</h1>
            <p className="text-muted-foreground">Let's set up your profile so we can personalize your experience.</p>
          </div>
          
          <form onSubmit={completeOnboarding} className="space-y-6">
            <div>
              <label className={labelClass} htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                className={inputClass}
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={busy}
              />
            </div>
            
            <div>
              <label className={labelClass} htmlFor="whatsapp">WhatsApp / Mobile Number</label>
              <input
                id="whatsapp"
                type="tel"
                className={inputClass}
                placeholder="+1 234 567 8900"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                required
                disabled={busy}
              />
            </div>
            
            <div>
              <label className={labelClass}>What are you interested in? (Optional)</label>
              <p className="text-sm text-muted-foreground mb-3">We use AI to recommend the best products for you.</p>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleInterest(cat)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      interests.includes(cat) 
                        ? "bg-emerald-600 text-white" 
                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 font-medium">{error}</p>
            )}

            <button 
              type="submit" 
              disabled={busy}
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors mt-8"
            >
              {busy ? "Finish Registration" : "Finish Registration"}
            </button>
          </form>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
