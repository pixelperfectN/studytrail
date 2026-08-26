"use client";

import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

import Link from "next/link";

import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);

    setError("");

    const supabase = createClient();

    const { error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      setError(error.message);

      setLoading(false);

      return;
    }

    router.push("/dashboard");

    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[#f7f2ee] px-5 py-8 text-[#250e2c]">
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="w-full max-w-md">

          {/* Logo */}

          <Link
            href="/"
            className="mx-auto flex w-fit items-center text-2xl font-semibold tracking-tight"
          >
            Student
            <span className="text-[#837ab6]">
              AI
            </span>
          </Link>

          {/* Login Card */}

          <div className="mt-8 rounded-2xl border border-[#e5dadd] bg-[#fcfaf8] p-7 shadow-sm sm:p-9">

            <div className="text-center">

              <h1 className="text-2xl font-semibold tracking-tight text-[#250e2c]">
                Welcome back
              </h1>

              <p className="mt-2 text-sm leading-6 text-[#6f6870]">
                Log in to continue learning with
                StudentAI.
              </p>

            </div>

            {/* Error */}

            {error && (
              <div className="mt-6 rounded-xl border border-[#cc8db3]/40 bg-[#f7c2ca]/30 px-4 py-3 text-sm leading-5 text-[#250e2c]">
                {error}
              </div>
            )}

            {/* Form */}

            <form
              onSubmit={handleLogin}
              className="mt-7 space-y-5"
            >

              {/* Email */}

              <div>

                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-[#250e2c]"
                >
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  required
                  autoComplete="email"
                  className="w-full rounded-xl border border-[#e5dadd] bg-white px-4 py-3 text-sm text-[#250e2c] outline-none transition placeholder:text-[#9d85b6] focus:border-[#837ab6] focus:ring-2 focus:ring-[#837ab6]/15"
                />

              </div>

              {/* Password */}

              <div>

                <div className="mb-2 flex items-center justify-between">

                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-[#250e2c]"
                  >
                    Password
                  </label>

                  <Link
                    href="/auth/forgot-password"
                    className="text-xs font-medium text-[#837ab6] transition hover:text-[#9d85b6]"
                  >
                    Forgot password?
                  </Link>

                </div>

                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  required
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-[#e5dadd] bg-white px-4 py-3 text-sm text-[#250e2c] outline-none transition placeholder:text-[#9d85b6] focus:border-[#837ab6] focus:ring-2 focus:ring-[#837ab6]/15"
                />

              </div>

              {/* Login button */}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#250e2c] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#3b1b43] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Logging in..."
                  : "Log in"}
              </button>

            </form>

            {/* Signup */}

            <div className="mt-7 border-t border-[#e5dadd] pt-6 text-center">

              <p className="text-sm text-[#6f6870]">

                Don't have an account?{" "}

                <Link
                  href="/auth/signup"
                  className="font-medium text-[#837ab6] transition hover:text-[#9d85b6]"
                >
                  Create one
                </Link>

              </p>

            </div>

          </div>

          {/* Bottom text */}

          <p className="mt-6 text-center text-xs text-[#9d85b6]">
            Learn smarter. Understand better.
          </p>

        </div>
      </div>
    </main>
  );
}