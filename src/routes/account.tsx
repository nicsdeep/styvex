import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Outlet, useRouterState } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";

export const Route = createFileRoute("/account")({ component: AccountRoute });

function AccountRoute() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  return pathname.replace(/\/$/, "") === "/account" ? <AccountPage /> : <Outlet />;
}

function AccountPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");

  const [isSignUp, setIsSignUp] = useState(false);
  const [useOtp, setUseOtp] = useState(true);
  const [otpSent, setOtpSent] = useState(false);

  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function checkProfile() {
      if (user) {
        const { data } = await supabase
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

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (useOtp) {
        if (!otpSent) {
          // Send OTP
          const { error } = await supabase.auth.signInWithOtp({
            email: email.trim().toLowerCase(),
          });
          if (error) throw error;
          setOtpSent(true);
          toast.success("6-digit verification code sent to your email!");
        } else {
          // Verify OTP
          const { error } = await supabase.auth.verifyOtp({
            email: email.trim().toLowerCase(),
            token: code,
            type: "email",
          });
          if (error) throw error;
          toast.success("Successfully authenticated!");
        }
      } else {
        // Password Flow
        if (isSignUp) {
          const { data, error } = await supabase.auth.signUp({
            email: email.trim().toLowerCase(),
            password,
          });
          if (error) throw error;

          if (data.user) {
            await supabase
              .from("profiles")
              .update({ full_name: name.trim() })
              .eq("id", data.user.id);
          }
          toast.success("Account created successfully!");
        } else {
          const { error } = await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password,
          });
          if (error) throw error;
          toast.success("Welcome back!");
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Authentication failed.";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "h-12 w-full rounded-xl border border-neutral-200 bg-white/50 px-4 text-sm focus:border-brand focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand transition-all shadow-sm backdrop-blur-sm";
  const buttonClass =
    "h-12 w-full rounded-xl bg-brand px-4 font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-50 hover:bg-brand/90 shadow-md";

  if (isLoading || user) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <SiteHeader />
        <main
          className="flex flex-1 items-center justify-center py-24"
          aria-label="Loading account"
        >
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent"></div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center bg-gradient-to-br from-purple-50 via-white to-slate-50 px-4 py-10 sm:px-8 sm:py-16">
        <div className="w-full max-w-[480px] rounded-3xl border border-purple-100 bg-white/95 shadow-[0_20px_60px_-25px_rgba(89,64,170,0.25)]">
          {/* Shared account form */}
          <div className="flex flex-col p-5 sm:p-10">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-700">
              <ShieldCheck className="h-7 w-7" aria-hidden="true" />
            </div>

            <div className="flex justify-center mb-8">
              <div className="inline-flex items-center rounded-full bg-neutral-100 p-1">
                <button
                  onClick={() => {
                    setUseOtp(true);
                    setOtpSent(false);
                  }}
                  className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all ${useOtp ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700"}`}
                >
                  Email code
                </button>
                <button
                  onClick={() => {
                    setUseOtp(false);
                    setOtpSent(false);
                    setCode("");
                  }}
                  className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all ${!useOtp ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700"}`}
                >
                  Password
                </button>
              </div>
            </div>

            <div className="max-w-[400px] w-full mx-auto flex-1 flex flex-col justify-center">
              <div className="mb-8 text-center">
                <h1 className="text-2xl font-semibold text-neutral-900 mb-2">
                  {useOtp
                    ? otpSent
                      ? "Check your email"
                      : "Sign in with Email"
                    : isSignUp
                      ? "Create an account"
                      : "Sign in to Styvex"}
                </h1>
                <p className="text-neutral-500 text-sm">
                  {useOtp
                    ? otpSent
                      ? `We sent a 6-digit code to ${email}`
                      : "Enter your email to receive a secure 6-digit code."
                    : isSignUp
                      ? "Enter your details below to create your account"
                      : "Welcome back! Please enter your details."}
                </p>
              </div>

              <form onSubmit={handleAuth} className="space-y-5">
                {!otpSent && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="Enter your email"
                      className={inputClass}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={busy}
                    />
                  </div>
                )}

                {useOtp && otpSent && (
                  <div className="flex flex-col items-center py-4">
                    <label className="block text-sm font-medium text-neutral-700 mb-4 self-start">
                      Secure Code
                    </label>
                    <InputOTP
                      aria-label="6-digit verification code"
                      maxLength={6}
                      value={code}
                      onChange={(value) => setCode(value.replace(/\D/g, ""))}
                      disabled={busy}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot
                          index={0}
                          className="w-9 sm:w-12 h-12 text-lg border-neutral-200"
                        />
                        <InputOTPSlot
                          index={1}
                          className="w-9 sm:w-12 h-12 text-lg border-neutral-200"
                        />
                        <InputOTPSlot
                          index={2}
                          className="w-9 sm:w-12 h-12 text-lg border-neutral-200"
                        />
                      </InputOTPGroup>
                      <InputOTPSeparator />
                      <InputOTPGroup>
                        <InputOTPSlot
                          index={3}
                          className="w-9 sm:w-12 h-12 text-lg border-neutral-200"
                        />
                        <InputOTPSlot
                          index={4}
                          className="w-9 sm:w-12 h-12 text-lg border-neutral-200"
                        />
                        <InputOTPSlot
                          index={5}
                          className="w-9 sm:w-12 h-12 text-lg border-neutral-200"
                        />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                )}

                {!useOtp && isSignUp && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="Jane Doe"
                      className={inputClass}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      disabled={busy}
                    />
                  </div>
                )}

                {!useOtp && (
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-sm font-medium text-neutral-700">Password</label>
                      {!isSignUp && (
                        <button
                          type="button"
                          className="text-xs font-semibold text-brand hover:text-brand/80 transition-colors"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className={inputClass}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={busy}
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={busy || (useOtp && otpSent && code.length !== 6)}
                  className={buttonClass + " mt-2"}
                >
                  {busy
                    ? "Please wait..."
                    : useOtp
                      ? otpSent
                        ? "Verify Code"
                        : "Send Code"
                      : isSignUp
                        ? "Create account"
                        : "Sign in"}
                </button>
              </form>

              {!useOtp && (
                <div className="mt-8 text-center">
                  <p className="text-sm text-neutral-500">
                    {isSignUp ? "Already have an account?" : "Don't have an account?"}
                    <button
                      type="button"
                      onClick={() => setIsSignUp(!isSignUp)}
                      className="ml-2 font-semibold text-neutral-900 hover:text-brand transition-colors"
                    >
                      {isSignUp ? "Sign in" : "Sign up"}
                    </button>
                  </p>
                </div>
              )}

              {useOtp && otpSent && (
                <div className="mt-8 text-center">
                  <p className="text-sm text-neutral-500">
                    Didn't receive a code?
                    <button
                      type="button"
                      onClick={() => {
                        setOtpSent(false);
                        setCode("");
                      }}
                      className="ml-2 font-semibold text-neutral-900 hover:text-brand transition-colors"
                    >
                      Try again
                    </button>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
