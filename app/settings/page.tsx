"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

const LEARNING_MODES = [
  { value: "learn", label: "Learn" },
  { value: "notes", label: "Generate Notes" },
  { value: "revision", label: "Quick Revision" },
  { value: "ask", label: "Ask AI" },
];

const EXPLANATION_STYLES = [
  { value: "simple", label: "Simple" },
  { value: "balanced", label: "Balanced" },
  { value: "detailed", label: "Detailed" },
  { value: "exam", label: "Exam-focused" },
];

const ANSWER_LENGTHS = [
  { value: "concise", label: "Concise" },
  { value: "balanced", label: "Balanced" },
  { value: "detailed", label: "Detailed" },
];

export default function SettingsPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");

  const [fullName, setFullName] = useState("");
  const [university, setUniversity] = useState("");
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");

  const [learningMode, setLearningMode] = useState("learn");
  const [explanationStyle, setExplanationStyle] =
    useState("balanced");
  const [answerLength, setAnswerLength] =
    useState("balanced");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] =
    useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // --------------------------------------------------
  // Load profile
  // --------------------------------------------------

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/auth/login";
        return;
      }

      setEmail(user.email ?? "");

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("full_name, university, branch, year")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error(error);
        setError("Unable to load your profile.");
        setLoading(false);
        return;
      }

      if (profile) {
        setFullName(profile.full_name ?? "");
        setUniversity(profile.university ?? "");
        setBranch(profile.branch ?? "");
        setYear(
          profile.year ? String(profile.year) : ""
        );
      }

      // Load local learning preferences
      const savedLearningMode =
        localStorage.getItem("studytrail-learning-mode");

      const savedExplanationStyle =
        localStorage.getItem(
          "studytrail-explanation-style"
        );

      const savedAnswerLength =
        localStorage.getItem(
          "studytrail-answer-length"
        );

      if (savedLearningMode) {
        setLearningMode(savedLearningMode);
      }

      if (savedExplanationStyle) {
        setExplanationStyle(savedExplanationStyle);
      }

      if (savedAnswerLength) {
        setAnswerLength(savedAnswerLength);
      }

      setLoading(false);
    }

    loadSettings();
  }, []);

  // --------------------------------------------------
  // Save profile
  // --------------------------------------------------

  async function handleSaveProfile(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/auth/login";
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .upsert({
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

    setMessage(
      "Your profile has been updated successfully."
    );

    setSaving(false);
  }

  // --------------------------------------------------
  // Save learning preferences
  // --------------------------------------------------

  function handleSavePreferences() {
    localStorage.setItem(
      "studytrail-learning-mode",
      learningMode
    );

    localStorage.setItem(
      "studytrail-explanation-style",
      explanationStyle
    );

    localStorage.setItem(
      "studytrail-answer-length",
      answerLength
    );

    setMessage(
      "Your learning preferences have been saved."
    );

    setError("");
  }

  // --------------------------------------------------
  // Change password
  // --------------------------------------------------

  async function handleChangePassword(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setMessage("");
    setError("");

    if (newPassword.length < 6) {
      setError(
        "Password must be at least 6 characters long."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setChangingPassword(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      console.error(error);
      setError(error.message);
      setChangingPassword(false);
      return;
    }

    setNewPassword("");
    setConfirmPassword("");

    setMessage(
      "Your password has been changed successfully."
    );

    setChangingPassword(false);
  }

  // --------------------------------------------------
  // Log out
  // --------------------------------------------------

  async function handleLogOut() {
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  }

  // --------------------------------------------------
  // Loading
  // --------------------------------------------------

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f2ee] px-5 py-10">
        <div className="mx-auto max-w-4xl">
          <div className="h-5 w-24 animate-pulse rounded bg-[#e5dadd]" />

          <div className="mt-4 h-10 w-48 animate-pulse rounded bg-[#e5dadd]" />

          <div className="mt-8 h-72 animate-pulse rounded-2xl bg-[#fcfaf8]" />

          <div className="mt-6 h-64 animate-pulse rounded-2xl bg-[#fcfaf8]" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f2ee] text-[#250e2c]">
      <div className="mx-auto max-w-4xl px-5 py-8 sm:px-8 lg:py-12">

        {/* Header */}

        <div>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-[#9d85b6] transition hover:text-[#250e2c]"
          >
            ← Back to dashboard
          </Link>

          <p className="mt-8 text-sm font-medium text-[#837ab6]">
            Settings
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Manage your StudyTrail
          </h1>

          <p className="mt-3 max-w-2xl text-[#6f6870]">
            Update your profile, learning preferences,
            and account settings.
          </p>
        </div>

        {/* Messages */}

        {message && (
          <div className="mt-6 rounded-xl border border-[#837ab6]/30 bg-[#f1e9f2] px-4 py-3 text-sm text-[#250e2c]">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-xl border border-[#cc8db3]/40 bg-[#f7c2ca]/30 px-4 py-3 text-sm text-[#250e2c]">
            {error}
          </div>
        )}

        {/* ------------------------------------------------ */}
        {/* PROFILE */}
        {/* ------------------------------------------------ */}

        <section className="mt-10 rounded-2xl border border-[#e5dadd] bg-[#fcfaf8] p-6 sm:p-8">

          <div className="mb-7">
            <p className="text-xs font-medium uppercase tracking-wider text-[#9d85b6]">
              Profile
            </p>

            <h2 className="mt-1 text-xl font-semibold">
              Your information
            </h2>

            <p className="mt-1 text-sm text-[#6f6870]">
              This information is used to personalize
              your learning experience.
            </p>
          </div>

          <form
            onSubmit={handleSaveProfile}
            className="space-y-5"
          >

            {/* Email */}

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium"
              >
                Email address
              </label>

              <input
                id="email"
                type="email"
                value={email}
                disabled
                className="w-full rounded-xl border border-[#e5dadd] bg-[#f7f2ee] px-4 py-3 text-[#6f6870] outline-none"
              />

              <p className="mt-2 text-xs text-[#9d85b6]">
                Your email address cannot be changed
                here.
              </p>
            </div>

            {/* Full name */}

            <div>
              <label
                htmlFor="fullName"
                className="mb-2 block text-sm font-medium"
              >
                Full name
              </label>

              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) =>
                  setFullName(e.target.value)
                }
                required
                className="w-full rounded-xl border border-[#e5dadd] bg-white px-4 py-3 outline-none transition focus:border-[#837ab6] focus:ring-2 focus:ring-[#837ab6]/15"
              />
            </div>

            {/* University */}

            <div>
              <label
                htmlFor="university"
                className="mb-2 block text-sm font-medium"
              >
                University / College
              </label>

              <input
                id="university"
                type="text"
                value={university}
                onChange={(e) =>
                  setUniversity(e.target.value)
                }
                required
                className="w-full rounded-xl border border-[#e5dadd] bg-white px-4 py-3 outline-none transition focus:border-[#837ab6] focus:ring-2 focus:ring-[#837ab6]/15"
              />
            </div>

            {/* Branch */}

            <div>
              <label
                htmlFor="branch"
                className="mb-2 block text-sm font-medium"
              >
                Branch
              </label>

              <select
                id="branch"
                value={branch}
                onChange={(e) =>
                  setBranch(e.target.value)
                }
                required
                className="w-full rounded-xl border border-[#e5dadd] bg-white px-4 py-3 outline-none transition focus:border-[#837ab6] focus:ring-2 focus:ring-[#837ab6]/15"
              >
                <option value="">
                  Select your branch
                </option>

                {BRANCHES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            {/* Academic year */}

            <div>
              <label
                htmlFor="year"
                className="mb-2 block text-sm font-medium"
              >
                Academic year
              </label>

              <select
                id="year"
                value={year}
                onChange={(e) =>
                  setYear(e.target.value)
                }
                required
                className="w-full rounded-xl border border-[#e5dadd] bg-white px-4 py-3 outline-none transition focus:border-[#837ab6] focus:ring-2 focus:ring-[#837ab6]/15"
              >
                <option value="">
                  Select your year
                </option>

                {YEARS.map((item) => (
                  <option
                    key={item.value}
                    value={item.value}
                  >
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-[#250e2c] px-5 py-3 font-medium text-white transition hover:bg-[#3b1b43] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : "Save profile"}
              </button>
            </div>

          </form>
        </section>

        {/* ------------------------------------------------ */}
        {/* ACCOUNT & SECURITY */}
        {/* ------------------------------------------------ */}

        <section className="mt-6 rounded-2xl border border-[#e5dadd] bg-[#fcfaf8] p-6 sm:p-8">

          <div className="mb-7">
            <p className="text-xs font-medium uppercase tracking-wider text-[#9d85b6]">
              Account & security
            </p>

            <h2 className="mt-1 text-xl font-semibold">
              Manage your account
            </h2>
          </div>

          {/* Change password */}

          <form
            onSubmit={handleChangePassword}
            className="space-y-4"
          >

            <div>
              <label
                htmlFor="newPassword"
                className="mb-2 block text-sm font-medium"
              >
                New password
              </label>

              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) =>
                  setNewPassword(e.target.value)
                }
                placeholder="Enter a new password"
                className="w-full rounded-xl border border-[#e5dadd] bg-white px-4 py-3 outline-none transition focus:border-[#837ab6] focus:ring-2 focus:ring-[#837ab6]/15"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-medium"
              >
                Confirm new password
              </label>

              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                placeholder="Confirm your new password"
                className="w-full rounded-xl border border-[#e5dadd] bg-white px-4 py-3 outline-none transition focus:border-[#837ab6] focus:ring-2 focus:ring-[#837ab6]/15"
              />
            </div>

            <button
              type="submit"
              disabled={changingPassword}
              className="rounded-xl border border-[#e5dadd] bg-white px-5 py-3 font-medium transition hover:border-[#837ab6] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {changingPassword
                ? "Changing..."
                : "Change password"}
            </button>

          </form>

          {/* Log out */}

          <div className="mt-8 border-t border-[#e5dadd] pt-6">

            <h3 className="font-medium">
              Log out
            </h3>

            <p className="mt-1 text-sm text-[#6f6870]">
              Log out of your current StudyTrail account.
            </p>

            <button
              type="button"
              onClick={handleLogOut}
              className="mt-4 rounded-xl border border-[#e5dadd] px-5 py-3 font-medium transition hover:border-[#cc8db3] hover:bg-[#f7f2ee]"
            >
              Log out
            </button>

          </div>

        </section>

        {/* ------------------------------------------------ */}
        {/* DANGER ZONE */}
        {/* ------------------------------------------------ */}

        <section className="mt-6 rounded-2xl border border-[#cc8db3]/40 bg-[#fcfaf8] p-6 sm:p-8">

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[#cc8db3]">
              Danger zone
            </p>

            <h2 className="mt-1 text-xl font-semibold">
              Delete account
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#6f6870]">
              Permanently deleting your account will
              remove your StudyTrail data. This action
              cannot be undone.
            </p>

            <button
              type="button"
              disabled
              className="mt-5 rounded-xl border border-[#cc8db3]/50 px-5 py-3 font-medium text-[#cc8db3] opacity-60"
            >
              Delete account
            </button>

            <p className="mt-2 text-xs text-[#9d85b6]">
              Account deletion will be added after the
              required server-side safeguards are in place.
            </p>
          </div>

        </section>

        {/* Footer */}

        <div className="py-10 text-center text-sm text-[#9d85b6]">
          StudyTrail · Version 1.0
        </div>

      </div>
    </main>
  );
}