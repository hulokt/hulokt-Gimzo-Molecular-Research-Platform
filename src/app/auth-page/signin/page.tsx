"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { LoaderCircle, LockIcon, MailIcon } from "lucide-react";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

const SignIn: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    // Disable body scrolling when component mounts
    document.body.style.overflow = "hidden";
    // Re-enable scrolling when component unmounts
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Basic form validation
    if (!email || !password) {
      setError("Please fill in all fields.");
      setIsLoading(false);
      return;
    }

    try {
      // Use NextAuth's signIn function
      const result = await signIn("credentials", {
        redirect: false, // Prevent auto-redirect
        email,
        password,
      });

      if (result?.error) {
        setError(result.error); // Handle login error
      } else {
        // Navigate to the dashboard or another page on successful login
        router.push("/");
      }
    } catch (err: any) {
      // Handle unexpected error
      setError("Something went wrong. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DefaultLayout>
      <div className="relative flex h-[calc(100vh-40px)] w-full items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gradient-to-br from-primary/30 via-indigo-500/30 to-transparent blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-gradient-to-tr from-cyan-400/30 via-sky-500/30 to-transparent blur-3xl" />
        </div>

        <div className="relative w-full max-w-md rounded-3xl border border-white/40 bg-white/70 p-6 shadow-[0_40px_120px_-60px_rgba(30,64,175,0.6)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/70">
          <div className="mb-4 text-center">
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-slate-400">
              Welcome back
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
              Sign in to Gimzo
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
              Continue your research journey with a modern workspace.
            </p>
          </div>

          {error && (
            <div className="mb-3 rounded-xl border border-red/30 bg-red/10 p-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-900 dark:text-white">
                  Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full rounded-xl border border-slate-200 bg-white/90 py-2.5 pl-4 pr-10 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-slate-900/80 dark:text-white"
                    required
                    disabled={isLoading}
                  />
                  <span className="absolute right-3 top-2.5 text-slate-400">
                    <MailIcon size={18} />
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-900 dark:text-white">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-slate-200 bg-white/90 py-2.5 pl-4 pr-10 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-slate-900/80 dark:text-white"
                    required
                    disabled={isLoading}
                  />
                  <span className="absolute right-3 top-2.5 text-slate-400">
                    <LockIcon size={18} />
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full cursor-pointer rounded-xl bg-gradient-to-r from-primary to-indigo-500 py-2.5 text-sm font-semibold text-white transition hover:from-primary/90 hover:to-indigo-500/90"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Signing In...
                    </span>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </div>

              <div className="space-y-1 pt-2 text-center text-xs text-slate-500">
                <p>
                  Don't have an account?{" "}
                  <Link href="/auth-page/signup" className="text-primary hover:underline">
                    Sign Up
                  </Link>
                </p>
                <p>
                  <Link href="/forget-password" className="text-primary hover:underline">
                    Forgot Password?
                  </Link>
                </p>
              </div>
            </form>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default SignIn;
