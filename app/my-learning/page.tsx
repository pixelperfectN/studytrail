"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type LearningSession = {
  id: string;
  title: string;
  subject_id: string;
  topic_id: string;
  messages: unknown;
  generated_notes: string | null;
  generated_revision: string | null;
  created_at: string;
  updated_at: string;
};

type Subject = {
  id: string;
  name: string;
};

type Topic = {
  id: string;
  name: string;
};

type SessionCard = LearningSession & {
  subjectName: string;
  topicName: string;
  messageCount: number;
};

export default function MyLearningPage() {
  const supabase = createClient();

  const [sessions, setSessions] = useState<
    SessionCard[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSessions() {
      setLoading(true);
      setError("");

      try {
        const {
          data: sessionData,
          error: sessionError,
        } = await supabase
          .from("learning_sessions")
          .select(
            "id, title, subject_id, topic_id, messages, generated_notes, generated_revision, created_at, updated_at"
          )
          .order("updated_at", {
            ascending: false,
          });

        if (sessionError) {
          console.error(
            "Learning sessions error:",
            sessionError
          );

          throw new Error(
            sessionError.message ||
              "Unable to load your learning sessions."
          );
        }

        if (!sessionData || sessionData.length === 0) {
          setSessions([]);
          return;
        }

        const subjectIds = [
          ...new Set(
            sessionData.map(
              (session) => session.subject_id
            )
          ),
        ];

        const topicIds = [
          ...new Set(
            sessionData.map(
              (session) => session.topic_id
            )
          ),
        ];

        const [
          { data: subjects },
          { data: topics },
        ] = await Promise.all([
          supabase
            .from("subjects")
            .select("id, name")
            .in("id", subjectIds),

          supabase
            .from("topics")
            .select("id, name")
            .in("id", topicIds),
        ]);

        const subjectMap = new Map(
          (subjects as Subject[] | null)?.map(
            (subject) => [
              subject.id,
              subject.name,
            ]
          ) ?? []
        );

        const topicMap = new Map(
          (topics as Topic[] | null)?.map(
            (topic) => [
              topic.id,
              topic.name,
            ]
          ) ?? []
        );

        const cards: SessionCard[] =
          sessionData.map((session) => {
            const messageCount =
              Array.isArray(session.messages)
                ? session.messages.length
                : 0;

            return {
              ...session,
              subjectName:
                subjectMap.get(
                  session.subject_id
                ) || "Subject",
              topicName:
                topicMap.get(
                  session.topic_id
                ) || session.title,
              messageCount,
            };
          });

        setSessions(cards);
      } catch (error) {
        console.error(error);

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load your learning sessions."
        );
      } finally {
        setLoading(false);
      }
    }

    loadSessions();
  }, []);

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();

    const difference =
      now.getTime() - date.getTime();

    const oneDay =
      1000 * 60 * 60 * 24;

    if (difference < oneDay) {
      return "Today";
    }

    if (difference < oneDay * 2) {
      return "Yesterday";
    }

    return date.toLocaleDateString(
      undefined,
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f2ee] px-5 py-10">
        <div className="mx-auto max-w-5xl">
          <div className="h-4 w-32 animate-pulse rounded bg-[#e5dadd]" />

          <div className="mt-8 h-10 w-64 animate-pulse rounded bg-[#e5dadd]" />

          <div className="mt-3 h-5 w-96 max-w-full animate-pulse rounded bg-[#e5dadd]" />

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="h-48 animate-pulse rounded-2xl bg-[#fcfaf8]" />
            <div className="h-48 animate-pulse rounded-2xl bg-[#fcfaf8]" />
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#f7f2ee] px-5 py-10">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-[#9d85b6] transition hover:text-[#250e2c]"
          >
            ← Back to Dashboard
          </Link>

          <div className="mt-10 rounded-2xl border border-red-200 bg-red-50 p-6">
            <h1 className="font-semibold text-red-900">
              Something went wrong
            </h1>

            <p className="mt-2 text-sm leading-6 text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                window.location.reload()
              }
              className="mt-5 rounded-xl bg-[#250e2c] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#3b1645]"
            >
              Try again
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f2ee] text-[#250e2c]">
      <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8 lg:py-10">
        <Link
          href="/dashboard"
          className="text-sm font-medium text-[#9d85b6] transition hover:text-[#250e2c]"
        >
          ← Back to Dashboard
        </Link>

        <header className="mt-8">
          <p className="text-sm font-medium text-[#7c5cff]">
            StudyTrail
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            My Learning
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6f6870] sm:text-base">
            Continue topics you have already
            studied and pick up your learning
            sessions where you left off.
          </p>
        </header>

        {sessions.length === 0 ? (
          <section className="mt-10 rounded-2xl border border-dashed border-[#e5dadd] bg-[#fcfaf8] px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f1e9f2] text-2xl">
              ✦
            </div>

            <h2 className="mt-6 text-xl font-semibold">
              No learning sessions yet
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#6f6870]">
              Start learning a topic and your
              conversations will automatically
              appear here.
            </p>

            <Link
              href="/learn"
              className="mt-7 inline-flex rounded-xl bg-[#250e2c] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#3b1645]"
            >
              Start learning
            </Link>
          </section>
        ) : (
          <>
            <div className="mt-10">
              <h2 className="text-lg font-semibold">
                Recently studied
              </h2>

              <p className="mt-1 text-sm text-[#9d85b6]">
                {sessions.length}{" "}
                {sessions.length === 1
                  ? "learning session"
                  : "learning sessions"}
              </p>
            </div>

            <section className="mt-5 grid gap-4 sm:grid-cols-2">
              {sessions.map((session) => (
                <Link
                  key={session.id}
                  href={`/learn/topic?subjectId=${session.subject_id}&topicId=${session.topic_id}&mode=learn&sessionId=${session.id}`}
                  className="group rounded-2xl border border-[#e5dadd] bg-[#fcfaf8] p-6 transition hover:-translate-y-0.5 hover:border-[#cc8db3] hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f1e9f2] text-lg">
                      ✦
                    </div>

                    <span className="text-xs text-[#9d85b6]">
                      {formatDate(
                        session.updated_at
                      )}
                    </span>
                  </div>

                  <p className="mt-5 text-xs font-medium uppercase tracking-wide text-[#7c5cff]">
                    {session.subjectName}
                  </p>

                  <h3 className="mt-2 text-lg font-semibold text-[#250e2c] transition group-hover:text-[#7c5cff]">
                    {session.topicName}
                  </h3>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-lg bg-[#f1e9f2] px-2.5 py-1 text-xs text-[#6f6870]">
                      {session.messageCount}{" "}
                      {session.messageCount === 1
                        ? "message"
                        : "messages"}
                    </span>

                    {session.generated_notes && (
                      <span className="rounded-lg bg-[#f1e9f2] px-2.5 py-1 text-xs text-[#6f6870]">
                        Notes
                      </span>
                    )}

                    {session.generated_revision && (
                      <span className="rounded-lg bg-[#f1e9f2] px-2.5 py-1 text-xs text-[#6f6870]">
                        Revision
                      </span>
                    )}
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-[#e5dadd] pt-4">
                    <span className="text-sm font-medium text-[#6f6870] transition group-hover:text-[#250e2c]">
                      Continue learning
                    </span>

                    <span className="text-[#9d85b6] transition group-hover:translate-x-1 group-hover:text-[#250e2c]">
                      →
                    </span>
                  </div>
                </Link>
              ))}
            </section>
          </>
        )}
      </div>
    </main>
  );
}