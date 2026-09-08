import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/account")({ component: AccountPage });

function AccountPage() {
  const { user, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [passwordMode, setPasswordMode] = useState(true); // Default to password login as requested
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    async function checkProfile() {
      if (user) {
        const { data, error } = await supabase
          .from("profiles")
          .select("is_onboarded")
          .eq("id", user.id)
          .single();
          
        if (data && !data.is_onboarded) {
          void navigate({ to: "/onboarding", replace: true });
        } else if (data && data.is_onboarded) {
          void navigate({ to: "/", replace: true });
        }
      }
    }
    if (user && !isLoading) {
      checkProfile();
    }
  }, [user, isLoading, navigate]);

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) throw error;
      
      // Attempt to immediately update the profile with the name if the user was created
      if (data.user) {
        await supabase
          .from("profiles")
          .update({ full_name: name.trim() })
          .eq("id", data.user.id);
      }
      
      // If email confirmation is required, user won't be logged in yet.
      // Assuming auto-confirm for now or they will be prompted to check email.
    } catch (error) {
      setError(error instanceof Error ? error.message : "Sign up failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) throw error;
    } catch (error) {
      setError(error instanceof Error ? error.message : "Sign in failed.");
    } finally {
      setBusy(false);
    }
  }

  const inputClass = "h-12 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-4 pl-10 text-sm focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all";
  const buttonClass = "h-12 w-full rounded-full bg-emerald-500 px-4 font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-50 hover:bg-emerald-600 shadow-md shadow-emerald-500/20";
  
  if (isLoading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white md:bg-neutral-50 items-center justify-center p-4">
      <div className="w-full max-w-[1000px] bg-white md:rounded-[2rem] md:shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        
        {/* Left Side: Branding / Welcome Back */}
        <div className="hidden md:flex flex-1 bg-gradient-to-br from-emerald-400 to-emerald-600 p-12 text-white flex-col justify-center items-center relative overflow-hidden">
          {/* Decorative shapes */}
          <div className="absolute top-10 left-10 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-10 right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
          
          <div className="z-10 text-center">
            <h2 className="text-4xl font-bold mb-4">{isSignUp ? "Welcome Back!" : "New Here?"}</h2>
            <p className="text-emerald-50 mb-8 max-w-sm mx-auto leading-relaxed">
              {isSignUp 
                ? "To keep connected with us please login with your personal info." 
                : "Sign up and discover a great amount of new opportunities!"}
            </p>
            <button 
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
              }}
              className="px-8 py-3 rounded-full border-2 border-white text-white font-semibold hover:bg-white/10 transition-colors"
            >
              {isSignUp ? "SIGN IN" : "SIGN UP"}
            </button>
          </div>
        </div>

        {/* Right Side: Forms */}
        <div className="flex-1 p-8 md:p-12 lg:p-16 flex flex-col justify-center relative">
          
          {/* Mobile Toggle */}
          <div className="md:hidden flex justify-center mb-8 gap-4">
            <button 
              onClick={() => setIsSignUp(false)}
              className={`pb-2 text-lg font-semibold ${!isSignUp ? 'border-b-2 border-emerald-500 text-neutral-900' : 'text-neutral-400'}`}
            >
              Log In
            </button>
            <button 
              onClick={() => setIsSignUp(true)}
              className={`pb-2 text-lg font-semibold ${isSignUp ? 'border-b-2 border-emerald-500 text-neutral-900' : 'text-neutral-400'}`}
            >
              Sign Up
            </button>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-neutral-900">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </h1>
            <p className="text-neutral-500 mt-2 text-sm">
              {isSignUp ? "or use your email for registration:" : "Sign in to continue"}
            </p>
          </div>

          <form 
            className="space-y-4 max-w-sm mx-auto w-full"
            onSubmit={isSignUp ? handleSignUp : handleSignIn}
          >
            {isSignUp && (
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <input
                  type="text"
                  placeholder="Name"
                  className={inputClass}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={isSignUp}
                  disabled={busy}
                />
              </div>
            )}

            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <input
                type="email"
                placeholder="Email"
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={busy}
              />
            </div>

            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <input
                type="password"
                placeholder="Password"
                className={inputClass}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={busy}
              />
            </div>

            {!isSignUp && (
              <div className="flex justify-end">
                <button type="button" className="text-xs font-semibold text-emerald-600 hover:text-emerald-500">
                  Forgot password?
                </button>
              </div>
            )}

            {error && (
              <p className="text-sm text-red-500 text-center font-medium bg-red-50 p-2 rounded-lg">{error}</p>
            )}

            <button type="submit" disabled={busy} className={buttonClass + " mt-4"}>
              {busy ? "Please wait..." : (isSignUp ? "SIGN UP" : "LOG IN")}
            </button>
          </form>
          
          <div className="mt-8 text-center md:hidden">
            <p className="text-sm text-neutral-500">
              {isSignUp ? "Already have an account?" : "Not registered yet?"}
              <button 
                onClick={() => setIsSignUp(!isSignUp)}
                className="ml-1 font-semibold text-emerald-600"
              >
                {isSignUp ? "Log In" : "Sign Up"}
              </button>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
