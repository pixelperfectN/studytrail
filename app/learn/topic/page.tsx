"use client";

import {
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createClient } from "@/lib/supabase/client";

type Mode = "learn" | "notes" | "revision";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type LearningSession = {
  id: string;
  title: string;
  messages: Message[];
  generated_notes: string | null;
  generated_revision: string | null;
};

const modeInfo: Record<
  Mode,
  {
    title: string;
    description: string;
    icon: string;
  }
> = {
  learn: {
    title: "Learn",
    description:
      "Understand the topic and ask follow-up questions.",
    icon: "✦",
  },
  notes: {
    title: "Generate Notes",
    description:
      "Turn your learning session into structured notes.",
    icon: "□",
  },
  revision: {
    title: "Quick Revision",
    description:
      "Create a concise revision sheet from what you learned.",
    icon: "↻",
  },
};

function TopicLearningPage() {
  const searchParams = useSearchParams();
  const supabase = createClient();

  const subjectId = searchParams.get("subjectId");
  const topicId = searchParams.get("topicId");
  const modeParam = searchParams.get("mode") as Mode | null;
  const sessionIdParam = searchParams.get("sessionId");

  const [subjectName, setSubjectName] = useState("");
  const [topicName, setTopicName] = useState("");

  const [mode, setMode] = useState<Mode>(
    modeParam && modeInfo[modeParam]
      ? modeParam
      : "learn"
  );

  // --------------------------------------------------
  // Learning conversation
  // --------------------------------------------------

  const [messages, setMessages] = useState<Message[]>(
    []
  );

  // --------------------------------------------------
  // Generated notes / revision
  // --------------------------------------------------

  const [generatedContent, setGeneratedContent] =
    useState("");

  // --------------------------------------------------
  // Input
  // --------------------------------------------------

  const [question, setQuestion] = useState("");

  // --------------------------------------------------
  // Loading states
  // --------------------------------------------------

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  // --------------------------------------------------
  // Current session
  // --------------------------------------------------

  const [sessionId, setSessionId] = useState<
    string | null
  >(sessionIdParam);

  const sessionIdRef = useRef<string | null>(
    sessionIdParam
  );

  // Prevent duplicate initial generation
  const hasInitialized = useRef(false);

  // Scroll to latest message
  const messagesEndRef =
    useRef<HTMLDivElement | null>(null);

  // --------------------------------------------------
  // Keep session ID in sync
  // --------------------------------------------------

  function updateSessionId(id: string) {
    sessionIdRef.current = id;
    setSessionId(id);
  }

  // --------------------------------------------------
  // Scroll to latest message
  // --------------------------------------------------

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, generating, sending]);

  // --------------------------------------------------
  // Load subject, topic and previous session
  // --------------------------------------------------

  useEffect(() => {
    async function loadTopic() {
      if (!subjectId || !topicId) {
        setError("Missing subject or topic.");
        setLoading(false);
        return;
      }

      const [
        { data: subject, error: subjectError },
        { data: topic, error: topicError },
      ] = await Promise.all([
        supabase
          .from("subjects")
          .select("name")
          .eq("id", subjectId)
          .maybeSingle(),

        supabase
          .from("topics")
          .select("name")
          .eq("id", topicId)
          .maybeSingle(),
      ]);

      if (subjectError || topicError) {
        console.error(
          subjectError || topicError
        );

        setError("Unable to load this topic.");
        setLoading(false);
        return;
      }

      if (!subject || !topic) {
        setError(
          "The selected subject or topic could not be found."
        );
        setLoading(false);
        return;
      }

      setSubjectName(subject.name);
      setTopicName(topic.name);

      // ------------------------------------------------
      // Load requested session or latest session
      // ------------------------------------------------

      let sessionQuery = supabase
        .from("learning_sessions")
        .select(
          "id, title, messages, generated_notes, generated_revision"
        );

      if (sessionIdParam) {
        sessionQuery = sessionQuery.eq(
          "id",
          sessionIdParam
        );
      } else {
        sessionQuery = sessionQuery
          .eq("subject_id", subjectId)
          .eq("topic_id", topicId)
          .order("updated_at", {
            ascending: false,
          })
          .limit(1);
      }

      const {
        data: sessions,
        error: sessionError,
      } = await sessionQuery;

      if (sessionError) {
  console.error(
    "Learning session query error:",
    JSON.stringify(sessionError, null, 2)
  );
}

      const existingSession =
        sessions?.[0] as
          | LearningSession
          | undefined;

      if (existingSession) {
        const storedMessages = Array.isArray(
          existingSession.messages
        )
          ? existingSession.messages
          : [];

        updateSessionId(existingSession.id);

        setMessages(storedMessages);

        if (mode === "notes") {
          setGeneratedContent(
            existingSession.generated_notes || ""
          );
        }

        if (mode === "revision") {
          setGeneratedContent(
            existingSession.generated_revision || ""
          );
        }

        // Existing session means we don't need
        // to generate a new explanation.
        hasInitialized.current = true;
      }

      setLoading(false);
    }

    loadTopic();
  }, [
    subjectId,
    topicId,
    sessionIdParam,
  ]);

  // --------------------------------------------------
  // Save session to Supabase
  // --------------------------------------------------

  async function saveSession(
    updatedMessages: Message[],
    notes?: string | null,
    revision?: string | null
  ) {
    if (!subjectId || !topicId) {
      return null;
    }

    if (
      updatedMessages.length === 0 &&
      !notes &&
      !revision
    ) {
      return null;
    }

    setSaving(true);

    try {
      const title = topicName || "Learning Session";

      // ----------------------------------------------
      // Update existing session
      // ----------------------------------------------

      if (sessionIdRef.current) {
        const updateData: {
          messages: Message[];
          updated_at: string;
          generated_notes?: string | null;
          generated_revision?: string | null;
        } = {
          messages: updatedMessages,
          updated_at: new Date().toISOString(),
        };

        if (notes !== undefined) {
          updateData.generated_notes = notes;
        }

        if (revision !== undefined) {
          updateData.generated_revision =
            revision;
        }

        const { error: updateError } =
          await supabase
            .from("learning_sessions")
            .update(updateData)
            .eq(
              "id",
              sessionIdRef.current
            );

        if (updateError) {
          console.error(
            "Learning session update error:",
            updateError
          );

          throw updateError;
        }

        return sessionIdRef.current;
      }

      // ----------------------------------------------
      // Create new session
      // ----------------------------------------------

      const {
        data: {
          user,
        },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error(
          "You must be logged in to save your learning session."
        );
      }

      const { data: newSession, error: insertError } =
        await supabase
          .from("learning_sessions")
          .insert({
            user_id: user.id,
            subject_id: subjectId,
            topic_id: topicId,
            title,
            messages: updatedMessages,
            generated_notes:
              notes ?? null,
            generated_revision:
              revision ?? null,
            is_saved: true,
          })
          .select(
            "id, title, messages, generated_notes, generated_revision"
          )
          .single();

      if (insertError) {
  console.error(
    "Learning session insert error:",
    JSON.stringify(insertError, null, 2)
  );

  throw insertError;
}

      if (newSession) {
        updateSessionId(newSession.id);

        // Put the session ID into the URL
        const params = new URLSearchParams(
          searchParams.toString()
        );

        params.set(
          "sessionId",
          newSession.id
        );

        window.history.replaceState(
          null,
          "",
          `/learn/topic?${params.toString()}`
        );

        return newSession.id;
      }

      return null;
    } finally {
      setSaving(false);
    }
  }

  // --------------------------------------------------
  // Call AI
  // --------------------------------------------------

  async function callAI(
    selectedMode: Mode,
    conversation: Message[]
  ) {
    if (!subjectId || !topicId) {
      return null;
    }

    const response = await fetch(
      "/api/ai/learn",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subjectId,
          topicId,
          mode: selectedMode,
          messages: conversation,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.error ||
          "Unable to generate content."
      );
    }

    return result.content as string;
  }

  // --------------------------------------------------
  // Generate initial Learn explanation
  // --------------------------------------------------

  async function generateInitialExplanation() {
    if (
      !subjectId ||
      !topicId ||
      !topicName ||
      generating
    ) {
      return;
    }

    setGenerating(true);
    setError("");
    setGeneratedContent("");

    try {
      const result = await callAI(
        "learn",
        []
      );

      if (!result) {
        throw new Error(
          "No explanation was returned."
        );
      }

      const initialMessages: Message[] = [
        {
          role: "assistant",
          content: result,
        },
      ];

      setMessages(initialMessages);

      // Immediately create persistent session
      await saveSession(
        initialMessages
      );
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to generate the explanation."
      );
    } finally {
      setGenerating(false);
    }
  }

  // --------------------------------------------------
  // Generate initial explanation once
  // --------------------------------------------------

  useEffect(() => {
    if (
      !loading &&
      subjectName &&
      topicName &&
      mode === "learn" &&
      messages.length === 0 &&
      !hasInitialized.current
    ) {
      hasInitialized.current = true;

      generateInitialExplanation();
    }
  }, [
    loading,
    subjectName,
    topicName,
    mode,
    messages.length,
  ]);

  // --------------------------------------------------
  // Send follow-up question
  // --------------------------------------------------

  async function sendQuestion() {
    const trimmedQuestion =
      question.trim();

    if (
      !trimmedQuestion ||
      sending ||
      generating ||
      !topicId ||
      !subjectId
    ) {
      return;
    }

    setSending(true);
    setError("");

    const userMessage: Message = {
      role: "user",
      content: trimmedQuestion,
    };

    const updatedMessages = [
      ...messages,
      userMessage,
    ];

    // Immediately show student's message
    setMessages(updatedMessages);
    setQuestion("");

    try {
      const result = await callAI(
        "learn",
        updatedMessages
      );

      if (!result) {
        throw new Error(
          "No response was returned."
        );
      }

      const finalMessages: Message[] = [
        ...updatedMessages,
        {
          role: "assistant",
          content: result,
        },
      ];

      setMessages(finalMessages);

      // Save question + answer
      await saveSession(
        finalMessages
      );
    } catch (error) {
      console.error(error);

      // Remove the question if AI failed
      setMessages(messages);

      setQuestion(trimmedQuestion);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to get an AI response."
      );
    } finally {
      setSending(false);
    }
  }

  // --------------------------------------------------
  // Enter key
  // --------------------------------------------------

  function handleQuestionKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      sendQuestion();
    }
  }

  // --------------------------------------------------
  // Generate notes
  // --------------------------------------------------

  async function generateNotes() {
    if (
      messages.length === 0 ||
      generating
    ) {
      return;
    }

    setGenerating(true);
    setError("");
    setGeneratedContent("");

    try {
      const result = await callAI(
        "notes",
        messages
      );

      if (!result) {
        throw new Error(
          "No notes were generated."
        );
      }

      setGeneratedContent(result);

      // Save notes to same learning session
      await saveSession(
        messages,
        result,
        undefined
      );
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to generate notes."
      );
    } finally {
      setGenerating(false);
    }
  }

  // --------------------------------------------------
  // Generate revision
  // --------------------------------------------------

  async function generateRevision() {
    if (
      messages.length === 0 ||
      generating
    ) {
      return;
    }

    setGenerating(true);
    setError("");
    setGeneratedContent("");

    try {
      const result = await callAI(
        "revision",
        messages
      );

      if (!result) {
        throw new Error(
          "No revision material was generated."
        );
      }

      setGeneratedContent(result);

      // Save revision to same session
      await saveSession(
        messages,
        undefined,
        result
      );
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to generate revision material."
      );
    } finally {
      setGenerating(false);
    }
  }

  // --------------------------------------------------
  // Change mode
  // --------------------------------------------------

  async function changeMode(
    newMode: Mode
  ) {
    setMode(newMode);
    setError("");

    // If switching away from generated content,
    // clear the visible generated result.
    setGeneratedContent("");

    const params = new URLSearchParams({
      subjectId: subjectId ?? "",
      topicId: topicId ?? "",
      mode: newMode,
    });

    if (sessionIdRef.current) {
      params.set(
        "sessionId",
        sessionIdRef.current
      );
    }

    window.history.replaceState(
      null,
      "",
      `/learn/topic?${params.toString()}`
    );

    if (newMode === "notes") {
      if (sessionIdRef.current) {
        const { data: session } =
          await supabase
            .from("learning_sessions")
            .select("generated_notes")
            .eq(
              "id",
              sessionIdRef.current
            )
            .maybeSingle();

        if (session?.generated_notes) {
          setGeneratedContent(
            session.generated_notes
          );
          return;
        }
      }

      if (messages.length > 0) {
        await generateNotes();
      }

      return;
    }

    if (newMode === "revision") {
      if (sessionIdRef.current) {
        const { data: session } =
          await supabase
            .from("learning_sessions")
            .select(
              "generated_revision"
            )
            .eq(
              "id",
              sessionIdRef.current
            )
            .maybeSingle();

        if (session?.generated_revision) {
          setGeneratedContent(
            session.generated_revision
          );
          return;
        }
      }

      if (messages.length > 0) {
        await generateRevision();
      }
    }
  }

  // --------------------------------------------------
  // Start a fresh learning session
  // --------------------------------------------------

  async function regenerateLearn() {
    setMessages([]);
    setGeneratedContent("");
    setQuestion("");
    setError("");

    // Important:
    // We intentionally remove the old session ID.
    // The next AI explanation will create a new
    // learning session.
    updateSessionId("");

    const params = new URLSearchParams({
      subjectId: subjectId ?? "",
      topicId: topicId ?? "",
      mode: "learn",
    });

    window.history.replaceState(
      null,
      "",
      `/learn/topic?${params.toString()}`
    );

    hasInitialized.current = true;

    await generateInitialExplanation();
  }

  // --------------------------------------------------
  // Markdown component
  // --------------------------------------------------

  function MarkdownContent({
    content,
  }: {
    content: string;
  }) {
    return (
      <div
        className="
          text-[15px] leading-7 text-[#6f6870]

          [&>h1]:mb-6
          [&>h1]:text-3xl
          [&>h1]:font-semibold
          [&>h1]:tracking-tight
          [&>h1]:text-[#250e2c]

          [&>h2]:mb-3
          [&>h2]:mt-10
          [&>h2]:text-xl
          [&>h2]:font-semibold
          [&>h2]:text-[#250e2c]

          [&>h3]:mb-2
          [&>h3]:mt-7
          [&>h3]:text-lg
          [&>h3]:font-semibold
          [&>h3]:text-[#250e2c]

          [&>p]:mb-5

          [&>ul]:mb-5
          [&>ul]:ml-6
          [&>ul]:list-disc

          [&>ol]:mb-5
          [&>ol]:ml-6
          [&>ol]:list-decimal

          [&>li]:mb-2

          [&>strong]:font-semibold
          [&>strong]:text-[#250e2c]

          [&>blockquote]:my-6
          [&>blockquote]:border-l-4
          [&>blockquote]:border-[#e5dadd]
          [&>blockquote]:pl-5
          [&>blockquote]:italic
          [&>blockquote]:text-[#6f6870]

          [&>hr]:my-8
          [&>hr]:border-[#e5dadd]

          [&_code]:rounded-md
          [&_code]:bg-[#f1e9f2]
          [&_code]:px-1.5
          [&_code]:py-0.5
          [&_code]:font-mono
          [&_code]:text-[13px]
          [&_code]:text-[#250e2c]

          [&_pre]:my-6
          [&_pre]:overflow-x-auto
          [&_pre]:rounded-xl
          [&_pre]:bg-[#250e2c]
          [&_pre]:p-5
          [&_pre]:text-sm
          [&_pre]:leading-6
          [&_pre]:text-[#e5dadd]

          [&_pre_code]:bg-transparent
          [&_pre_code]:p-0
          [&_pre_code]:text-[#e5dadd]

          [&_table]:my-6
          [&_table]:w-full
          [&_table]:border-collapse
          [&_table]:overflow-hidden
          [&_table]:rounded-xl

          [&_th]:border
          [&_th]:border-[#e5dadd]
          [&_th]:bg-[#f7f2ee]
          [&_th]:px-4
          [&_th]:py-3
          [&_th]:text-left
          [&_th]:text-sm
          [&_th]:font-semibold
          [&_th]:text-[#250e2c]

          [&_td]:border
          [&_td]:border-[#e5dadd]
          [&_td]:px-4
          [&_td]:py-3
          [&_td]:text-sm
        "
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  }

  // --------------------------------------------------
  // Loading
  // --------------------------------------------------

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f2ee] px-5 py-10">
        <div className="mx-auto max-w-4xl">
          <div className="h-4 w-28 animate-pulse rounded bg-[#e5dadd]" />

          <div className="mt-8 h-5 w-48 animate-pulse rounded bg-[#e5dadd]" />

          <div className="mt-3 h-12 w-96 max-w-full animate-pulse rounded bg-[#e5dadd]" />

          <div className="mt-10 h-96 animate-pulse rounded-2xl bg-[#fcfaf8]" />
        </div>
      </main>
    );
  }

  // --------------------------------------------------
  // Fatal error
  // --------------------------------------------------

  if (error && messages.length === 0) {
    return (
      <main className="min-h-screen bg-[#f7f2ee] px-5 py-10">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/learn"
            className="text-sm font-medium text-[#9d85b6] transition hover:text-[#250e2c]"
          >
            ← Back to Learn
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
              onClick={
                generateInitialExplanation
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

  const currentMode =
    modeInfo[mode];

  return (
    <main className="min-h-screen bg-[#f7f2ee] text-[#250e2c]">
      <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8 lg:py-10">
        {/* Back */}

        <Link
          href="/learn"
          className="text-sm font-medium text-[#9d85b6] transition hover:text-[#250e2c]"
        >
          ← Back to Learn
        </Link>

        {/* Topic header */}

        <header className="mt-8">
          <p className="text-sm font-medium text-[#7c5cff]">
            {subjectName}
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            {topicName}
          </h1>

          {sessionId && (
            <p className="mt-2 text-xs text-[#9d85b6]">
              Your learning session is saved
              automatically.
            </p>
          )}
        </header>

        {/* Mode selector */}

        <section className="mt-8">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {(Object.keys(modeInfo) as Mode[]).map(
              (item) => {
                const selected =
                  item === mode;

                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() =>
                      changeMode(item)
                    }
                    disabled={
                      generating ||
                      saving
                    }
                    className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                      selected
                        ? "bg-[#250e2c] text-white"
                        : "border border-[#e5dadd] bg-[#fcfaf8] text-[#6f6870] hover:border-[#cc8db3] hover:text-[#250e2c]"
                    } ${
                      generating ||
                      saving
                        ? "cursor-not-allowed opacity-60"
                        : ""
                    }`}
                  >
                    <span>
                      {modeInfo[item].icon}
                    </span>

                    {modeInfo[item].title}
                  </button>
                );
              }
            )}
          </div>
        </section>

        {/* Main card */}

        <section className="mt-6">
          <div className="overflow-hidden rounded-2xl border border-[#e5dadd] bg-[#fcfaf8]">
            {/* Content header */}

            <div className="border-b border-[#e5dadd] px-6 py-6 sm:px-8">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f1e9f2] text-lg">
                  {currentMode.icon}
                </div>

                <div>
                  <h2 className="font-semibold">
                    {currentMode.title}
                  </h2>

                  <p className="mt-1 text-sm text-[#6f6870]">
                    {
                      currentMode.description
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* ================================================= */}
            {/* LEARN MODE */}
            {/* ================================================= */}

            {mode === "learn" && (
              <>
                <div className="px-6 py-8 sm:px-10 sm:py-10">
                  {/* Initial loading */}

                  {generating &&
                    messages.length === 0 && (
                      <div className="mx-auto max-w-2xl py-16 text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f1e9f2]">
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#e5dadd] border-t-[#250e2c]" />
                        </div>

                        <h2 className="mt-6 text-xl font-semibold">
                          Building your explanation...
                        </h2>

                        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6f6870]">
                          Your AI tutor is preparing a
                          clear explanation for{" "}
                          {topicName}.
                        </p>
                      </div>
                    )}

                  {/* Conversation */}

                  {messages.length > 0 && (
                    <div className="mx-auto max-w-3xl space-y-8">
                      {messages.map(
                        (
                          message,
                          index
                        ) => {
                          const isUser =
                            message.role ===
                            "user";

                          return (
                            <div
                              key={`${message.role}-${index}`}
                              className={
                                isUser
                                  ? "flex justify-end"
                                  : "flex justify-start"
                              }
                            >
                              <div
                                className={
                                  isUser
                                    ? "max-w-[85%]"
                                    : "w-full"
                                }
                              >
                                <div className="mb-2 text-xs font-medium text-[#9d85b6]">
                                  {isUser
                                    ? "You"
                                    : "AI Tutor"}
                                </div>

                                <div
                                  className={
                                    isUser
                                      ? "rounded-2xl rounded-br-md bg-[#250e2c] px-5 py-4 text-[15px] leading-7 text-white"
                                      : "text-[15px] leading-7 text-[#6f6870]"
                                  }
                                >
                                  {isUser ? (
                                    <p className="whitespace-pre-wrap">
                                      {
                                        message.content
                                      }
                                    </p>
                                  ) : (
                                    <MarkdownContent
                                      content={
                                        message.content
                                      }
                                    />
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        }
                      )}

                      {/* AI responding */}

                      {sending && (
                        <div className="flex justify-start">
                          <div className="w-full">
                            <div className="mb-2 text-xs font-medium text-[#9d85b6]">
                              AI Tutor
                            </div>

                            <div className="flex items-center gap-2 py-3">
                              <div className="h-2 w-2 animate-bounce rounded-full bg-[#9d85b6] [animation-delay:-0.3s]" />
                              <div className="h-2 w-2 animate-bounce rounded-full bg-[#9d85b6] [animation-delay:-0.15s]" />
                              <div className="h-2 w-2 animate-bounce rounded-full bg-[#9d85b6]" />
                            </div>
                          </div>
                        </div>
                      )}

                      <div
                        ref={
                          messagesEndRef
                        }
                      />
                    </div>
                  )}
                </div>

                {/* Chat error */}

                {error &&
                  messages.length > 0 && (
                    <div className="mx-6 mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:mx-10">
                      {error}
                    </div>
                  )}

                {/* Question input */}

                <div className="border-t border-[#e5dadd] bg-[#f7f2ee]/70 px-5 py-5 sm:px-8">
                  <div className="mx-auto max-w-3xl">
                    <div className="relative rounded-2xl border border-[#e5dadd] bg-[#fcfaf8] shadow-sm transition focus-within:border-[#cc8db3] focus-within:ring-2 focus-within:ring-[#eadbea]">
                      <textarea
                        value={question}
                        onChange={(
                          event
                        ) =>
                          setQuestion(
                            event.target
                              .value
                          )
                        }
                        onKeyDown={
                          handleQuestionKeyDown
                        }
                        disabled={
                          sending ||
                          generating ||
                          saving
                        }
                        rows={2}
                        placeholder={`Ask anything about ${topicName}...`}
                        className="w-full resize-none bg-transparent px-4 py-4 pr-14 text-sm text-[#250e2c] outline-none placeholder:text-[#9d85b6] disabled:cursor-not-allowed disabled:opacity-60"
                      />

                      <button
                        type="button"
                        onClick={
                          sendQuestion
                        }
                        disabled={
                          !question.trim() ||
                          sending ||
                          generating ||
                          saving
                        }
                        aria-label="Send question"
                        className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#250e2c] text-white transition hover:bg-[#3b1645] disabled:cursor-not-allowed disabled:bg-[#e5dadd] disabled:text-[#9d85b6]"
                      >
                        ↑
                      </button>
                    </div>

                    <p className="mt-2 text-center text-xs text-[#9d85b6]">
                      Press Enter to send ·
                      Shift + Enter for a new
                      line
                    </p>
                  </div>
                </div>

                {/* Learn actions */}

                {messages.length > 0 && (
                  <div className="flex flex-col gap-3 border-t border-[#e5dadd] px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                    <div>
                      <p className="text-sm font-medium text-[#250e2c]">
                        {saving
                          ? "Saving your session..."
                          : "Your session is saved automatically"}
                      </p>

                      <p className="mt-1 text-xs text-[#9d85b6]">
                        Your questions and answers
                        will be used when generating
                        your notes.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={
                        regenerateLearn
                      }
                      disabled={
                        generating ||
                        sending ||
                        saving
                      }
                      className="rounded-xl border border-[#e5dadd] px-4 py-2.5 text-sm font-medium text-[#6f6870] transition hover:bg-[#f7f2ee] disabled:opacity-50"
                    >
                      Start again
                    </button>
                  </div>
                )}
              </>
            )}

            {/* ================================================= */}
            {/* NOTES / REVISION MODE */}
            {/* ================================================= */}

            {(mode === "notes" ||
              mode === "revision") && (
              <>
                <div className="px-6 py-8 sm:px-10 sm:py-10">
                  {generating ? (
                    <div className="mx-auto max-w-2xl py-16 text-center">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f1e9f2]">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#e5dadd] border-t-[#250e2c]" />
                      </div>

                      <h2 className="mt-6 text-xl font-semibold">
                        {mode ===
                        "notes"
                          ? "Creating your notes..."
                          : "Creating your revision sheet..."}
                      </h2>

                      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6f6870]">
                        {mode ===
                        "notes"
                          ? "Turning your learning conversation into structured study notes."
                          : "Turning your learning conversation into concise revision material."}
                      </p>
                    </div>
                  ) : generatedContent ? (
                    <article className="mx-auto max-w-3xl">
                      <MarkdownContent
                        content={
                          generatedContent
                        }
                      />
                    </article>
                  ) : (
                    <div className="py-16 text-center">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f1e9f2] text-2xl">
                        {
                          currentMode.icon
                        }
                      </div>

                      <h2 className="mt-6 text-xl font-semibold">
                        {mode ===
                        "notes"
                          ? "Your notes are ready to generate"
                          : "Your revision sheet is ready to generate"}
                      </h2>

                      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#6f6870]">
                        First learn about the
                        topic and ask any questions
                        you have. Then come back
                        here to turn your learning
                        session into{" "}
                        {mode ===
                        "notes"
                          ? "personalized notes"
                          : "quick revision material"}.
                      </p>

                      <button
                        type="button"
                        onClick={
                          mode ===
                          "notes"
                            ? generateNotes
                            : generateRevision
                        }
                        disabled={
                          messages.length ===
                            0 ||
                          generating
                        }
                        className="mt-7 rounded-xl bg-[#250e2c] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#3b1645] disabled:cursor-not-allowed disabled:bg-[#e5dadd] disabled:text-[#9d85b6]"
                      >
                        {mode ===
                        "notes"
                          ? "Generate notes"
                          : "Generate revision"}
                      </button>
                    </div>
                  )}
                </div>

                {/* Generated content actions */}

                {generatedContent &&
                  !generating && (
                    <div className="flex flex-col gap-3 border-t border-[#e5dadd] px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                      <div>
                        <p className="text-sm font-medium text-[#250e2c]">
                          {mode ===
                          "notes"
                            ? "Personalized notes"
                            : "Quick revision"}
                        </p>

                        <p className="mt-0.5 text-xs text-[#9d85b6]">
                          Based on your learning
                          session
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={
                            mode ===
                            "notes"
                              ? generateNotes
                              : generateRevision
                          }
                          disabled={
                            saving
                          }
                          className="rounded-xl border border-[#e5dadd] px-4 py-2.5 text-sm font-medium text-[#6f6870] transition hover:bg-[#f7f2ee] disabled:opacity-50"
                        >
                          Regenerate
                        </button>

                        <button
                          type="button"
                          className="rounded-xl bg-[#250e2c] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#3b1645]"
                        >
                          Export PDF
                        </button>
                      </div>
                    </div>
                  )}
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

export default function TopicLearningPageWrapper() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f7f2ee] px-5 py-10">
          <div className="mx-auto max-w-4xl">
            <div className="h-4 w-28 animate-pulse rounded bg-[#e5dadd]" />

            <div className="mt-8 h-5 w-48 animate-pulse rounded bg-[#e5dadd]" />

            <div className="mt-3 h-12 w-96 max-w-full animate-pulse rounded bg-[#e5dadd]" />

            <div className="mt-10 h-96 animate-pulse rounded-2xl bg-[#fcfaf8]" />
          </div>
        </main>
      }
    >
      <TopicLearningPage />
    </Suspense>
  );
}