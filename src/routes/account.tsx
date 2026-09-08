import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Outlet, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BrandLogo } from "@/components/brand-logo";

export const Route = createFileRoute("/account")({ component: AccountPage });

function AccountPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [useOtp, setUseOtp] = useState(true);
  const [otpSent, setOtpSent] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user && !isLoading) {
      if (location.pathname === "/account") {
        void navigate({ to: "/account/orders", replace: true });
      }
    }
  }, [user, isLoading, navigate, location.pathname]);

  if (user) {
    return <Outlet />;
  }

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (isResetPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
          redirectTo: `${window.location.origin}/account`,
        });
        if (error) throw error;
        toast.success("Password reset instructions sent to your email!");
        setIsResetPassword(false);
      } else if (useOtp) {
        if (!otpSent) {
          // Send OTP
          const { error } = await supabase.auth.signInWithOtp({ email: email.trim().toLowerCase() });
          if (error) throw error;
          setOtpSent(true);
          toast.success("6-digit verification code sent to your email!");
        } else {
          // Verify OTP
          const { error } = await supabase.auth.verifyOtp({ 
            email: email.trim().toLowerCase(), 
            token: code, 
            type: 'email' 
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

  const inputClass = "h-12 w-full rounded-full border border-neutral-200 bg-neutral-50 px-5 text-sm focus:border-neutral-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 transition-all";
  const buttonClass = "h-12 w-full rounded-full bg-neutral-900 px-4 font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-50 hover:bg-neutral-800 shadow-lg shadow-neutral-900/20";

  if (isLoading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50/50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-900 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F4F6F8]">
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center p-4">
        
        {/* Mobile App Style Card */}
        <div className="w-full max-w-[400px] bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.08)] overflow-hidden relative border border-neutral-100">
          
          {/* Wavy Header */}
          <div className="relative h-[120px] bg-gradient-to-br from-neutral-900 to-neutral-800 overflow-hidden">
            {/* Simple wave SVG generated to curve downwards */}
            <div className="absolute bottom-0 w-full translate-y-[2px]">
              <svg viewBox="0 0 1440 250" className="w-full h-[60px]" preserveAspectRatio="none">
                <path fill="#ffffff" fillOpacity="1" d="M0,96L80,112C160,128,320,160,480,160C640,160,800,128,960,112C1120,96,1280,96,1360,96L1440,96L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"></path>
              </svg>
            </div>
          </div>
          
          {/* Centered Logo overlapping the wave */}
          <div className="flex justify-center -mt-10 relative z-10">
            <div className="h-[72px] bg-white rounded-full px-6 py-2 shadow-[0_8px_16px_rgba(0,0,0,0.06)] flex items-center justify-center border border-neutral-50">
              <BrandLogo mobile />
            </div>
          </div>

          <div className="px-8 pb-10 pt-6">
            
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
                {isResetPassword ? "Reset Password" : (isSignUp ? "Sign Up!" : "Welcome Back, Log In!")}
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                {isResetPassword ? "Enter your email to reset" : (isSignUp ? "It's easier to sign up now" : "Access your Styvex account")}
              </p>
            </div>

            {!isResetPassword && (
              <div className="flex justify-center mb-6">
                <div className="bg-neutral-100 p-1 rounded-full flex text-xs">
                  <button
                    type="button"
                    onClick={() => { setUseOtp(false); setIsSignUp(false); }}
                    className={`px-4 py-1.5 rounded-full font-medium transition-all ${!useOtp ? 'bg-white shadow text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'}`}
                  >
                    Password
                  </button>
                  <button
                    type="button"
                    onClick={() => { setUseOtp(true); setOtpSent(false); setIsSignUp(false); }}
                    className={`px-4 py-1.5 rounded-full font-medium transition-all ${useOtp ? 'bg-white shadow text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'}`}
                  >
                    Email Code
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
              
              {/* Email Field (Always visible unless verifying OTP) */}
              {(!useOtp || !otpSent) && (
                <div>
                  <label className="block text-[10px] font-bold tracking-wider text-neutral-500 uppercase mb-1 ml-4">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    className={inputClass}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={busy}
                  />
                </div>
              )}

              {/* Full Name for Sign Up */}
              {!useOtp && isSignUp && !isResetPassword && (
                <div>
                  <label className="block text-[10px] font-bold tracking-wider text-neutral-500 uppercase mb-1 ml-4">
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

              {/* Password Field */}
              {!useOtp && !isResetPassword && (
                <div>
                  <div className="flex justify-between items-center mb-1 mx-4">
                    <label className="block text-[10px] font-bold tracking-wider text-neutral-500 uppercase">
                      Password
                    </label>
                    {!isSignUp && (
                      <button 
                        type="button" 
                        onClick={() => setIsResetPassword(true)}
                        className="text-[10px] font-medium text-neutral-900 hover:underline"
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

              {/* OTP Input Field */}
              {useOtp && otpSent && !isResetPassword && (
                <div className="flex flex-col items-center py-2">
                  <label className="block text-[10px] font-bold tracking-wider text-neutral-500 uppercase mb-3 self-start ml-4">
                    Enter 6-Digit Code
                  </label>
                  <InputOTP maxLength={6} value={code} onChange={setCode} disabled={busy}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} className="w-10 h-12 text-base rounded-l-full border-neutral-200" />
                      <InputOTPSlot index={1} className="w-10 h-12 text-base border-neutral-200" />
                      <InputOTPSlot index={2} className="w-10 h-12 text-base border-neutral-200" />
                    </InputOTPGroup>
                    <InputOTPSeparator />
                    <InputOTPGroup>
                      <InputOTPSlot index={3} className="w-10 h-12 text-base border-neutral-200" />
                      <InputOTPSlot index={4} className="w-10 h-12 text-base border-neutral-200" />
                      <InputOTPSlot index={5} className="w-10 h-12 text-base rounded-r-full border-neutral-200" />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              )}

              <div className="pt-2">
                <button type="submit" disabled={busy || (useOtp && otpSent && code.length !== 6)} className={buttonClass}>
                  {busy ? "Please wait..." : (isResetPassword ? "Send Reset Link" : (useOtp ? (otpSent ? "Verify Code" : "Send Code") : (isSignUp ? "Sign Up" : "Log in")))}
                </button>
              </div>

            </form>

            {/* Social Icons Placeholder */}
            {!isResetPassword && (
               <div className="mt-8">
                 <div className="flex items-center justify-center space-x-4">
                   <div className="h-px bg-neutral-100 flex-1"></div>
                   <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Or</span>
                   <div className="h-px bg-neutral-100 flex-1"></div>
                 </div>
                 <div className="flex justify-center gap-3 mt-4">
                   {/* Simplified placeholders for visual parity with design */}
                   <button className="h-8 w-8 rounded-full bg-[#1877F2] text-white flex items-center justify-center text-xs font-bold shadow-sm transition hover:scale-105">f</button>
                   <button className="h-8 w-8 rounded-full bg-[#EA4335] text-white flex items-center justify-center text-xs font-bold shadow-sm transition hover:scale-105">G</button>
                   <button className="h-8 w-8 rounded-full bg-[#0A66C2] text-white flex items-center justify-center text-xs font-bold shadow-sm transition hover:scale-105">in</button>
                 </div>
               </div>
            )}

            {/* Bottom Links */}
            <div className="mt-8 text-center">
              {isResetPassword ? (
                <button 
                  type="button"
                  onClick={() => setIsResetPassword(false)}
                  className="text-xs font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
                >
                  Back to Log in
                </button>
              ) : (
                <p className="text-xs text-neutral-500">
                  {isSignUp ? "Already have account?" : "Don't have account?"}
                  <button 
                    type="button"
                    onClick={() => { setIsSignUp(!isSignUp); setUseOtp(false); }}
                    className="ml-1 font-bold text-neutral-900 hover:underline transition-colors"
                  >
                    {isSignUp ? "Log in" : "Sign up"}
                  </button>
                </p>
              )}
            </div>
            
            {useOtp && otpSent && !isResetPassword && (
              <div className="mt-3 text-center">
                <button 
                  type="button"
                  onClick={() => { setOtpSent(false); setCode(""); }}
                  className="text-xs font-bold text-neutral-900 hover:underline transition-colors"
                >
                  Try sending again
                </button>
              </div>
            )}

          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
