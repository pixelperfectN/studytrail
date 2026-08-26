"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Subject = {
  id: string;
  name: string;
  semester: number;
  description: string | null;
};

type Topic = {
  id: string;
  name: string;
};

type Mode = "learn" | "notes" | "revision" | "ask";

const modes: {
  id: Mode;
  title: string;
  description: string;
  icon: string;
}[] = [
  {
    id: "learn",
    title: "Learn",
    description: "Understand the topic with a clear, structured explanation.",
    icon: "✦",
  },
  {
    id: "notes",
    title: "Generate Notes",
    description: "Create detailed, organized notes you can save and export.",
    icon: "□",
  },
  {
    id: "revision",
    title: "Quick Revision",
    description: "Review the most important concepts in a concise format.",
    icon: "↻",
  },
  {
    id: "ask",
    title: "Ask AI",
    description: "Ask follow-up questions while keeping the topic context.",
    icon: "○",
  },
];

export default function LearnPage() {
  const supabase = createClient();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);

  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [selectedMode, setSelectedMode] = useState<Mode | null>(null);

  const [branch, setBranch] = useState("");
  const [year, setYear] = useState<number | null>(null);

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingTopics, setLoadingTopics] = useState(false);

  const [error, setError] = useState("");

  // ------------------------------------------
  // Load student's academic profile
  // ------------------------------------------

  useEffect(() => {
    async function loadProfile() {
      setLoadingProfile(true);
      setError("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/auth/login";
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("branch, year")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error(error);
        setError("Unable to load your academic profile.");
        setLoadingProfile(false);
        return;
      }

      if (!profile) {
        window.location.href = "/onboarding";
        return;
      }

      setBranch(profile.branch);
      setYear(profile.year);
      setLoadingProfile(false);
    }

    loadProfile();
  }, []);

  // ------------------------------------------
  // Load subjects
  // ------------------------------------------

  useEffect(() => {
    async function loadSubjects() {
      if (!branch || !year) return;

      setLoadingSubjects(true);

      const { data, error } = await supabase
        .from("subjects")
        .select("id, name, semester, description")
        .eq("branch", branch)
        .eq("year", year)
        .order("semester", { ascending: true })
        .order("name", { ascending: true });

      if (error) {
        console.error(error);
        setError("Unable to load your subjects.");
        setLoadingSubjects(false);
        return;
      }

      setSubjects(data ?? []);
      setLoadingSubjects(false);
    }

    loadSubjects();
  }, [branch, year]);

  // ------------------------------------------
  // Load topics when subject changes
  // ------------------------------------------

  const semesterStart = year ? year * 2 - 1 : 1;
  const semesterEnd = year ? year * 2 : 2;

  const semesters = Array.from(
    { length: semesterEnd - semesterStart + 1 },
    (_, index) => semesterStart + index
  );

  const selectedSubjectData = subjects.find(
    (subject) => subject.id === selectedSubject
  );

  async function handleSubjectSelect(subjectId: string) {
    setSelectedSubject(subjectId);
    setSelectedTopic("");
    setSelectedMode(null);
    setError("");
    setLoadingTopics(true);

    const { data, error } = await supabase
      .from("topics")
      .select("id, name")
      .eq("subject_id", subjectId)
      .order("name", { ascending: true });

    if (error) {
      console.error("Error loading topics:", error);
      setError("Unable to load topics.");
      setTopics([]);
    } else {
      setTopics(data ?? []);
    }

    setLoadingTopics(false);
  }

  const selectedTopicData = topics.find(
    (topic) => topic.id === selectedTopic
  );

  function handleModeSelect(mode: Mode) {
    if (!selectedSubject || !selectedTopic) return;

    setSelectedMode(mode);

    const params = new URLSearchParams({
      subjectId: selectedSubject,
      topicId: selectedTopic,
      mode,
    });

    window.location.href = `/learn/topic?${params.toString()}`;
  }

  if (loadingProfile || loadingSubjects) {
    return (
      <main className="min-h-screen bg-[#f7f2ee] px-5 py-10">
        <div className="mx-auto max-w-5xl">
          <div className="h-5 w-24 animate-pulse rounded bg-[#e5dadd]" />
          <div className="mt-4 h-10 w-80 animate-pulse rounded bg-[#e5dadd]" />
          <div className="mt-8 h-64 animate-pulse rounded-2xl bg-[#fcfaf8]" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f2ee] text-[#250e2c]">
      <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8 lg:py-12">

        {/* Header */}

        <div>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-[#9d85b6] transition hover:text-[#250e2c]"
          >
            ← Back to dashboard
          </Link>

          <p className="mt-8 text-sm font-medium text-[#837ab6]">
            {branch} · {year}
            {year === 1 ? "st" : year === 2 ? "nd" : year === 3 ? "rd" : "th"}{" "}
            Year
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            What do you want to learn?
          </h1>

          <p className="mt-3 max-w-2xl text-[#6f6870]">
            Choose a subject and topic, then decide how you want to study it.
          </p>
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-[#cc8db3]/40 bg-[#f7c2ca]/30 px-4 py-3 text-sm text-[#250e2c]">
            {error}
          </div>
        )}

        {/* Subject selection */}

        <section className="mt-10">

          <div className="mb-4">

            <p className="text-xs font-medium uppercase tracking-wider text-[#9d85b6]">
              Step 1
            </p>

            <h2 className="mt-1 text-lg font-semibold">
              Choose a subject
            </h2>

          </div>

          <div className="space-y-8">

            {semesters.map((semester) => (
              <SubjectGroup
                key={semester}
                title={`Semester ${semester}`}
                subjects={subjects.filter(
                  (subject) => subject.semester === semester
                )}
                selectedSubject={selectedSubject}
                onSelect={handleSubjectSelect}
              />
            ))}

          </div>

        </section>

        {/* Topic selection */}

        {selectedSubject && (
          <section className="mt-12">

            <div className="mb-4">

              <p className="text-xs font-medium uppercase tracking-wider text-[#9d85b6]">
                Step 2
              </p>

              <h2 className="mt-1 text-lg font-semibold">
                Choose a topic
              </h2>

              {selectedSubjectData && (
                <p className="mt-1 text-sm text-[#6f6870]">
                  {selectedSubjectData.name}
                </p>
              )}

            </div>

            {loadingTopics ? (
              <div className="h-16 animate-pulse rounded-xl bg-[#e5dadd]" />
            ) : (
              <div className="relative">

                <select
                  value={selectedTopic}
                  onChange={(e) => {
                    setSelectedTopic(e.target.value);
                    setSelectedMode(null);
                  }}
                  className="w-full appearance-none rounded-xl border border-[#e5dadd] bg-[#fcfaf8] px-4 py-4 pr-12 text-sm text-[#250e2c] outline-none transition focus:border-[#837ab6] focus:ring-2 focus:ring-[#837ab6]/15"
                >
                  <option value="">Select a topic</option>

                  {topics.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.name}
                    </option>
                  ))}

                </select>

                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#9d85b6]">
                  ↓
                </span>

              </div>
            )}

          </section>
        )}

        {/* Learning modes */}

        {selectedTopic && (
          <section className="mt-12 pb-10">

            <div className="mb-5">

              <p className="text-xs font-medium uppercase tracking-wider text-[#9d85b6]">
                Step 3
              </p>

              <h2 className="mt-1 text-lg font-semibold">
                How would you like to study?
              </h2>

              {selectedTopicData && (
                <p className="mt-1 text-sm text-[#6f6870]">
                  {selectedTopicData.name}
                </p>
              )}

            </div>

            <div className="grid gap-4 sm:grid-cols-2">

              {modes.map((mode) => {
                const active = selectedMode === mode.id;

                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => handleModeSelect(mode.id)}
                    className={`group rounded-2xl border bg-[#fcfaf8] p-6 text-left transition ${
                      active
                        ? "border-[#250e2c] shadow-sm"
                        : "border-[#e5dadd] hover:-translate-y-0.5 hover:border-[#cc8db3]/50 hover:shadow-md"
                    }`}
                  >

                    <div className="flex items-start justify-between">

                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f1e9f2] text-lg text-[#837ab6]">
                        {mode.icon}
                      </div>

                      <span className="text-[#9d85b6] transition group-hover:translate-x-1 group-hover:text-[#837ab6]">
                        →
                      </span>

                    </div>

                    <h3 className="mt-5 font-semibold">
                      {mode.title}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-[#6f6870]">
                      {mode.description}
                    </p>

                  </button>
                );
              })}

            </div>

          </section>
        )}

      </div>
    </main>
  );
}

function SubjectGroup({
  title,
  subjects,
  selectedSubject,
  onSelect,
}: {
  title: string;
  subjects: Subject[];
  selectedSubject: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div>

      <h3 className="mb-3 text-sm font-medium text-[#6f6870]">
        {title}
      </h3>

      {subjects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#e5dadd] bg-[#fcfaf8] px-5 py-8 text-center text-sm text-[#9d85b6]">
          No subjects available.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">

          {subjects.map((subject) => {
            const selected = selectedSubject === subject.id;

            return (
              <button
                key={subject.id}
                type="button"
                onClick={() => onSelect(subject.id)}
                className={`rounded-2xl border p-5 text-left transition ${
                  selected
                    ? "border-[#250e2c] bg-[#250e2c] text-white shadow-sm"
                    : "border-[#e5dadd] bg-[#fcfaf8] hover:-translate-y-0.5 hover:border-[#cc8db3]/50 hover:shadow-sm"
                }`}
              >

                <div className="flex items-center justify-between gap-4">

                  <h4 className="font-medium">
                    {subject.name}
                  </h4>

                  <span
                    className={`text-sm ${
                      selected
                        ? "text-[#f7c2ca]"
                        : "text-[#9d85b6]"
                    }`}
                  >
                    →
                  </span>

                </div>

                {subject.description && (
                  <p
                    className={`mt-2 line-clamp-2 text-sm leading-5 ${
                      selected
                        ? "text-[#f7c2ca]"
                        : "text-[#6f6870]"
                    }`}
                  >
                    {subject.description}
                  </p>
                )}

              </button>
            );
          })}

        </div>
      )}

    </div>
  );
}