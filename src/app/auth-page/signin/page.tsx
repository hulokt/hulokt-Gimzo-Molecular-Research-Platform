"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { LoaderCircle, LockIcon, MailIcon } from "lucide-react";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import ComponentHeader from "@/components/ComponentHeader/ComponentHeader";
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
      <ComponentHeader pageName="Sign In" />

      <div className="flex h-[calc(100vh-120px)] items-center justify-center overflow-hidden">
        <div className="w-full max-w-md rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="w-full p-6">
            <span className="mb-1 block text-sm font-medium">Start for free</span>
            <h2 className="mb-4 text-xl font-bold text-black dark:text-white">
              Sign In to Gimzo
            </h2>

            {error && <div className="mb-3 text-sm text-red-500">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-black dark:text-white">
                  Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full rounded-lg border border-stroke bg-transparent py-2.5 pl-4 pr-10 text-sm text-black outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                    required
                    disabled={isLoading}
                  />
                  <span className="absolute right-3 top-2.5">
                    <MailIcon size={18} />
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-black dark:text-white">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-lg border border-stroke bg-transparent py-2.5 pl-4 pr-10 text-sm text-black outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                    required
                    disabled={isLoading}
                  />
                  <span className="absolute right-3 top-2.5">
                    <LockIcon size={18} />
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full cursor-pointer rounded-lg border border-primary bg-primary py-2.5 text-sm text-white transition hover:bg-opacity-90"
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

              <div className="space-y-1 pt-2 text-center text-xs">
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
      </div>
    </DefaultLayout>
  );
};

export default SignIn;
