import { useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export const Route = createFileRoute("/account")({
  component: AccountPage,
});

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type AuthFormValues = z.infer<typeof authSchema>;

function AccountPage() {
  const { user, isLoading, signOut } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
  });

  const onSubmit = async (data: AuthFormValues) => {
    setIsSubmitting(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });
        if (error) throw error;
        toast.success("Logged in successfully!");
      } else {
        const { error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
        });
        if (error) throw error;
        toast.success("Registration successful! Check your email to verify.");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred during authentication.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <SiteHeader />
        <main className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-foreground"></div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      
      <main className="flex-1 px-6 py-12 md:px-12 lg:px-24">
        <div className="mx-auto max-w-[1400px]">
          
          {user ? (
            // Authenticated Dashboard
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-4">
              <div className="lg:col-span-1 border-r border-border/50 pr-8">
                <h1 className="mb-6 text-2xl font-light uppercase tracking-widest text-foreground">My Account</h1>
                <nav className="flex flex-col gap-4 text-sm font-medium text-muted-foreground">
                  <button className="text-left text-foreground hover:text-foreground transition-colors">Dashboard</button>
                  <button className="text-left hover:text-foreground transition-colors">Order History</button>
                  <button className="text-left hover:text-foreground transition-colors">Addresses</button>
                  <button onClick={signOut} className="text-left mt-8 hover:text-destructive transition-colors">Sign Out</button>
                </nav>
              </div>
              <div className="lg:col-span-3">
                <h2 className="mb-6 text-xl font-light uppercase tracking-widest text-foreground">Welcome back</h2>
                <p className="text-sm text-muted-foreground">Logged in as {user.email}</p>

                <div className="mt-12 bg-muted p-8 text-center">
                  <h3 className="mb-2 text-lg font-medium text-foreground">No recent orders</h3>
                  <p className="text-sm text-muted-foreground">You haven't placed any orders yet.</p>
                </div>
              </div>
            </div>
          ) : (
            // Unauthenticated Flow
            <div className="mx-auto max-w-md mt-12">
              <h1 className="mb-8 text-center text-2xl font-light uppercase tracking-widest text-foreground">
                {isLogin ? "Sign In" : "Create Account"}
              </h1>
              
              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-foreground">Email</label>
                  <input
                    {...register("email")}
                    type="email"
                    className="h-12 border border-border bg-transparent px-4 text-sm focus:border-foreground focus:outline-none transition-colors"
                  />
                  {errors.email && <span className="text-xs text-destructive">{errors.email.message}</span>}
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-foreground">Password</label>
                  <input
                    {...register("password")}
                    type="password"
                    className="h-12 border border-border bg-transparent px-4 text-sm focus:border-foreground focus:outline-none transition-colors"
                  />
                  {errors.password && <span className="text-xs text-destructive">{errors.password.message}</span>}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-4 bg-foreground h-12 text-xs font-semibold uppercase tracking-widest text-background transition-colors hover:bg-foreground/90 disabled:opacity-50"
                >
                  {isSubmitting ? "Processing..." : isLogin ? "Sign In" : "Register"}
                </button>
              </form>

              <div className="mt-8 text-center">
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {isLogin ? "Don't have an account? Create one." : "Already have an account? Sign in."}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
