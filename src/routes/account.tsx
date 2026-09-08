import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useAuth } from "@/context/auth-context";
import { useAdmin } from "@/hooks/use-admin";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/account")({ component: AccountPage });
function AccountPage() {
  const { user, isLoading, signOut } = useAuth();
  const role = useAdmin();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [passwordMode, setPasswordMode] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [resendAt, setResendAt] = useState(0);
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (!resendAt) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [resendAt]);
  useEffect(() => {
    if (user && role.data) void navigate({ to: "/admin", replace: true });
  }, [user, role.data, navigate]);
  async function sendCode() {
    setBusy(true);
    setError("");
    const normalized = email.trim().toLowerCase();
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: normalized,
        options: { shouldCreateUser: true, emailRedirectTo: window.location.origin + "/account" },
      });
      if (error) throw error;
      setSentTo(normalized);
      setCode("");
      setResendAt(Date.now() + 60000);
      setNow(Date.now());
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not send the email. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  const input =
    "h-12 w-full rounded-lg border border-border bg-white px-4 text-base focus:outline-none focus:ring-2 focus:ring-purple-500";
  const button =
    "h-12 w-full rounded-lg bg-neutral-900 px-4 font-semibold text-white disabled:opacity-50";
  const resolving = isLoading || (!!user && role.isPending) || !!role.data;
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteHeader />
      <main className="mx-auto w-full max-w-lg flex-1 px-6 pb-16 pt-36">
        {resolving ? (
          <p role="status">Opening your account…</p>
        ) : user ? (
          <section>
            <h1 className="text-3xl font-semibold">My account</h1>
            <p className="mt-4 text-muted-foreground">{user.email}</p>
            {role.isError && (
              <p role="alert" className="mt-4">
                We could not load your account access.{" "}
                <button className="underline" onClick={() => role.refetch()}>
                  Retry
                </button>
              </p>
            )}
            <a className="mt-8 block underline" href="/shop">
              Continue shopping
            </a>
            <a className="mt-4 block underline" href="/wishlist">
              My wishlist
            </a>
            <a className="mt-4 block underline" href="/account/orders">
              Order history
            </a>
            <button
              className={button + " mt-8"}
              onClick={async () => {
                setError("");
                try {
                  await signOut();
                  setSentTo("");
                  setCode("");
                  setPassword("");
                } catch {
                  setError("Sign out failed. Please try again.");
                }
              }}
            >
              Sign out
            </button>
          </section>
        ) : (
          <section>
            <h1 className="text-3xl font-semibold">
              {sentTo ? "Check your email" : "Login / Sign up"}
            </h1>
            <p className="mb-8 mt-3 text-sm leading-relaxed text-muted-foreground">
              {sentTo
                ? "We sent a sign-in email to " +
                  sentTo +
                  ". Enter the code below, or use the sign-in link if one is provided."
                : "Welcome to STYVEX. Continue with your email to securely access your account or create one."}
            </p>
            {!sentTo ? (
              <form
                className="space-y-5"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!passwordMode) {
                    await sendCode();
                    return;
                  }
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
                }}
              >
                <label className="block text-sm font-medium" htmlFor="account-email">
                  Email address
                </label>
                <input
                  id="account-email"
                  className={input}
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={busy}
                />
                {passwordMode && (
                  <>
                    <label className="block text-sm font-medium" htmlFor="account-password">
                      Password
                    </label>
                    <input
                      id="account-password"
                      className={input}
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={busy}
                    />
                  </>
                )}
                <button disabled={busy} className={button}>
                  {busy ? "Please wait…" : passwordMode ? "Sign in" : "Continue with email"}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setPasswordMode(!passwordMode);
                    setError("");
                  }}
                  className="text-sm underline"
                >
                  {passwordMode ? "Use an email code instead" : "Already have a password? Sign in"}
                </button>
              </form>
            ) : (
              <form
                className="space-y-5"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setBusy(true);
                  setError("");
                  try {
                    const { error } = await supabase.auth.verifyOtp({
                      email: sentTo,
                      token: code.trim(),
                      type: "email",
                    });
                    if (error) throw error;
                  } catch {
                    setError(
                      "That code is invalid or has expired. Check the latest email or request a new code.",
                    );
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <label htmlFor="account-code" className="block text-sm font-medium">
                  One-time code
                </label>
                <input
                  id="account-code"
                  className={input + " tracking-widest"}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6,10}"
                  maxLength={10}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  required
                  disabled={busy}
                />
                <button className={button} disabled={busy}>
                  {busy ? "Verifying…" : "Verify and continue"}
                </button>
                <div className="flex justify-between gap-4 text-sm">
                  <button
                    type="button"
                    disabled={busy || now < resendAt}
                    onClick={sendCode}
                    className="underline disabled:opacity-50"
                  >
                    {now < resendAt
                      ? "Resend in " + Math.ceil((resendAt - now) / 1000) + "s"
                      : "Resend email"}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    className="underline"
                    onClick={() => {
                      setSentTo("");
                      setCode("");
                      setError("");
                    }}
                  >
                    Change email
                  </button>
                </div>
              </form>
            )}
          </section>
        )}
        {error && (
          <p role="alert" className="mt-5 text-sm text-red-700">
            {error}
          </p>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
