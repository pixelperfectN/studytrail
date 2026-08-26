"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

const BRANCHES = [
  "Computer Science & Engineering",
  "Information Technology",
  "Electronics & Communication Engineering",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Other",
];

const YEARS = [
  { value: 1, label: "1st Year" },
  { value: 2, label: "2nd Year" },
  { value: 3, label: "3rd Year" },
  { value: 4, label: "4th Year" },
];

export default function OnboardingPage() {
  const router = useRouter();

  const supabase = createClient();

  const [fullName, setFullName] = useState("");

  const [university, setUniversity] =
    useState("");

  const [branch, setBranch] = useState("");

  const [year, setYear] = useState("");

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/auth/login");
        return;
      }

      const { data: profile } =
        await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

      if (profile) {
        setFullName(profile.full_name ?? "");

        setUniversity(
          profile.university ?? ""
        );

        setBranch(profile.branch ?? "");

        setYear(
          profile.year
            ? String(profile.year)
            : ""
        );
      }

      setLoading(false);
    }

    loadProfile();
  }, [router, supabase]);

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setSaving(true);

    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/auth/login");
      return;
    }

    const { error } =
      await supabase.from("profiles").upsert({
        id: user.id,
        full_name: fullName.trim(),
        university: university.trim(),
        branch,
        year: Number(year),
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error(error);

      setError(error.message);

      setSaving(false);

      return;
    }

    router.push("/dashboard");

    router.refresh();
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f2ee]">
        <p className="text-[#6f6870]">
          Loading...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f2ee] px-6 py-12 text-[#250e2c]">

      <div className="mx-auto max-w-2xl">

        {/* Header */}

        <div className="mb-8">

          <p className="mb-2 text-sm font-medium text-[#837ab6]">
            StudentAI
          </p>

          <h1 className="text-3xl font-semibold tracking-tight text-[#250e2c]">
            Let&apos;s personalize your
            learning
          </h1>

          <p className="mt-2 text-[#6f6870]">
            Tell us a little about yourself
            so we can tailor your learning
            experience.
          </p>

        </div>

        {/* Form */}

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-[#e5dadd] bg-[#fcfaf8] p-6 shadow-sm sm:p-8"
        >

          <div className="space-y-6">

            {/* Full name */}

            <div>

              <label
                htmlFor="fullName"
                className="mb-2 block text-sm font-medium text-[#250e2c]"
              >
                Full name
              </label>

              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) =>
                  setFullName(
                    e.target.value
                  )
                }
                placeholder="Enter your full name"
                required
                className="w-full rounded-xl border border-[#e5dadd] bg-white px-4 py-3 text-[#250e2c] outline-none transition placeholder:text-[#9d85b6] focus:border-[#837ab6] focus:ring-2 focus:ring-[#837ab6]/15"
              />

            </div>

            {/* University */}

            <div>

              <label
                htmlFor="university"
                className="mb-2 block text-sm font-medium text-[#250e2c]"
              >
                University / College
              </label>

              <input
                id="university"
                type="text"
                value={university}
                onChange={(e) =>
                  setUniversity(
                    e.target.value
                  )
                }
                placeholder="Enter your university or college"
                required
                className="w-full rounded-xl border border-[#e5dadd] bg-white px-4 py-3 text-[#250e2c] outline-none transition placeholder:text-[#9d85b6] focus:border-[#837ab6] focus:ring-2 focus:ring-[#837ab6]/15"
              />

            </div>

            {/* Branch */}

            <div>

              <label
                htmlFor="branch"
                className="mb-2 block text-sm font-medium text-[#250e2c]"
              >
                Branch
              </label>

              <select
                id="branch"
                value={branch}
                onChange={(e) =>
                  setBranch(
                    e.target.value
                  )
                }
                required
                className="w-full rounded-xl border border-[#e5dadd] bg-white px-4 py-3 text-[#250e2c] outline-none transition focus:border-[#837ab6] focus:ring-2 focus:ring-[#837ab6]/15"
              >
                <option
                  value=""
                  className="text-[#9d85b6]"
                >
                  Select your branch
                </option>

                {BRANCHES.map((item) => (
                  <option
                    key={item}
                    value={item}
                    className="text-[#250e2c]"
                  >
                    {item}
                  </option>
                ))}
              </select>

            </div>

            {/* Academic year */}

            <div>

              <label
                htmlFor="year"
                className="mb-2 block text-sm font-medium text-[#250e2c]"
              >
                Academic year
              </label>

              <select
                id="year"
                value={year}
                onChange={(e) =>
                  setYear(
                    e.target.value
                  )
                }
                required
                className="w-full rounded-xl border border-[#e5dadd] bg-white px-4 py-3 text-[#250e2c] outline-none transition focus:border-[#837ab6] focus:ring-2 focus:ring-[#837ab6]/15"
              >
                <option
                  value=""
                  className="text-[#9d85b6]"
                >
                  Select your year
                </option>

                {YEARS.map((item) => (
                  <option
                    key={item.value}
                    value={item.value}
                    className="text-[#250e2c]"
                  >
                    {item.label}
                  </option>
                ))}
              </select>

            </div>

          </div>

          {/* Error */}

          {error && (
            <div className="mt-6 rounded-xl border border-[#cc8db3]/40 bg-[#f7c2ca]/30 px-4 py-3 text-sm text-[#250e2c]">
              {error}
            </div>
          )}

          {/* Submit */}

          <button
            type="submit"
            disabled={saving}
            className="mt-8 w-full rounded-xl bg-[#250e2c] px-5 py-3.5 font-medium text-white transition hover:bg-[#3b1b43] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving
              ? "Saving..."
              : "Continue to Student AI"}
          </button>

        </form>

      </div>

    </main>
  );
}