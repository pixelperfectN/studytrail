"use client";

import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

import Link from "next/link";

export default function SignupPage() {
  const [email, setEmail] = useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  async function handleSignup(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setLoading(true);

    setError("");

    setMessage("");

    const supabase = createClient();

    const { error } =
      await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
      });

    if (error) {
      setError(error.message);
    } else {
      setMessage(
        "Account created! Check your email to confirm your account."
      );
    }

    setLoading(false);
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
            Study
            <span className="text-[#837ab6]">
              Trail
            </span>
          </Link>

          {/* Signup Card */}

          <div className="mt-8 rounded-2xl border border-[#e5dadd] bg-[#fcfaf8] p-7 shadow-sm sm:p-9">

            <div className="text-center">

              <h1 className="text-2xl font-semibold tracking-tight text-[#250e2c]">
                Create your account
              </h1>

              <p className="mt-2 text-sm leading-6 text-[#6f6870]">
                Start learning smarter with
                StudyTrail.
              </p>

            </div>

            {/* Success message */}

            {message && (
              <div className="mt-6 rounded-xl border border-[#9d85b6]/40 bg-[#f1e9f2] px-4 py-3 text-sm leading-5 text-[#250e2c]">
                {message}
              </div>
            )}

            {/* Error message */}

            {error && (
              <div className="mt-6 rounded-xl border border-[#cc8db3]/40 bg-[#f7c2ca]/30 px-4 py-3 text-sm leading-5 text-[#250e2c]">
                {error}
              </div>
            )}

            {/* Form */}

            <form
              onSubmit={handleSignup}
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
                    setEmail(
                      e.target.value
                    )
                  }
                  required
                  autoComplete="email"
                  className="w-full rounded-xl border border-[#e5dadd] bg-white px-4 py-3 text-sm text-[#250e2c] outline-none transition placeholder:text-[#9d85b6] focus:border-[#837ab6] focus:ring-2 focus:ring-[#837ab6]/15"
                />

              </div>

              {/* Password */}

              <div>

                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-[#250e2c]"
                >
                  Password
                </label>

                <input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) =>
                    setPassword(
                      e.target.value
                    )
                  }
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-[#e5dadd] bg-white px-4 py-3 text-sm text-[#250e2c] outline-none transition placeholder:text-[#9d85b6] focus:border-[#837ab6] focus:ring-2 focus:ring-[#837ab6]/15"
                />

                <p className="mt-2 text-xs text-[#9d85b6]">
                  Password must be at least 6
                  characters.
                </p>

              </div>

              {/* Signup button */}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#250e2c] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#3b1b43] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Creating account..."
                  : "Create account"}
              </button>

            </form>

            {/* Login */}

            <div className="mt-7 border-t border-[#e5dadd] pt-6 text-center">

              <p className="text-sm text-[#6f6870]">

                Already have an account?{" "}

                <Link
                  href="/auth/login"
                  className="font-medium text-[#837ab6] transition hover:text-[#9d85b6]"
                >
                  Log in
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