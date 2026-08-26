"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import ReactMarkdown from "react-markdown";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type Document = {
  id: string;
  title: string;
  file_name: string;
};

export default function RagChatPage() {
  const params = useParams();
  const router = useRouter();

  const documentId = params.documentId as string;

  const [document, setDocument] =
    useState<Document | null>(null);

  const [messages, setMessages] =
    useState<Message[]>([]);

  const [conversationId, setConversationId] =
    useState<string | null>(null);

  const [question, setQuestion] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [asking, setAsking] =
    useState(false);

  const [error, setError] =
    useState("");
  
  const messagesEndRef =
    useRef<HTMLDivElement | null>(null);

  useEffect(() => {
  messagesEndRef.current?.scrollIntoView({
    behavior: "smooth",
  });
}, [messages, asking]);

  // --------------------------------------------------
  // Load document
  // --------------------------------------------------

  useEffect(() => {
    async function loadDocument() {
      try {
        const supabase =
          createClient();

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        const {
          data,
          error: documentError,
        } = await supabase
          .from("documents")
          .select(
            "id, title, file_name"
          )
          .eq("id", documentId)
          .eq("user_id", user.id)
          .single();

        if (documentError) {
          throw documentError;
        }

        setDocument(data);
      } catch (error) {
        console.error(
          "Document loading error:",
          error
        );

        setError(
          "Unable to load this document."
        );
      } finally {
        setLoading(false);
      }
    }

    if (documentId) {
      loadDocument();
    }
  }, [documentId, router]);

  useEffect(() => {
  async function loadConversation() {
    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // ---------------------------------------------
      // Find conversation for this document
      // ---------------------------------------------

      const {
        data: conversation,
        error: conversationError,
      } = await supabase
        .from("rag_conversations")
        .select("id")
        .eq("document_id", documentId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (conversationError) {
        throw conversationError;
      }

      // No conversation yet
      if (!conversation) {
        return;
      }

      setConversationId(
        conversation.id
      );

      // ---------------------------------------------
      // Load saved messages
      // ---------------------------------------------

      const {
        data: savedMessages,
        error: messagesError,
      } = await supabase
        .from("rag_messages")
        .select(
          "id, role, content"
        )
        .eq(
          "conversation_id",
          conversation.id
        )
        .order("created_at", {
          ascending: true,
        });

      if (messagesError) {
        throw messagesError;
      }

      if (savedMessages) {
        setMessages(
          savedMessages as Message[]
        );
      }
    } catch (error) {
  console.error(
    "Conversation loading error:",
    error
  );

  if (error && typeof error === "object") {
    console.error(
      "Error details:",
      JSON.stringify(
        error,
        null,
        2
      )
    );
  }

  if (error instanceof Error) {
    console.error(
      "Message:",
      error.message
    );

    console.error(
      "Stack:",
      error.stack
    );
  }

  setError(
    error instanceof Error
      ? error.message
      : "Unable to load conversation."
  );
}
  }

  if (documentId) {
    loadConversation();
  }
}, [documentId, router]);

  // --------------------------------------------------
  // Ask RAG
  // --------------------------------------------------

  async function handleAsk() {
  const cleanQuestion = question.trim();

  if (!cleanQuestion || asking) {
    return;
  }

  setAsking(true);
  setError("");

  try {
    const supabase = createClient();

    // ---------------------------------------------
    // Make sure student is logged in
    // ---------------------------------------------

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    // ---------------------------------------------
    // Find existing conversation
    // ---------------------------------------------

    let currentConversationId =
      conversationId;

    if (!currentConversationId) {
      const {
        data: existingConversation,
        error: conversationError,
      } = await supabase
        .from("rag_conversations")
        .select("id")
        .eq("document_id", documentId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (conversationError) {
        throw conversationError;
      }

      if (existingConversation) {
        currentConversationId =
          existingConversation.id;
      } else {
        // -----------------------------------------
        // Create conversation
        // -----------------------------------------

        const {
          data: newConversation,
          error: createError,
        } = await supabase
          .from("rag_conversations")
          .insert({
            user_id: user.id,
            document_id: documentId,
          })
          .select("id")
          .single();

        if (createError) {
          throw createError;
        }

        currentConversationId =
          newConversation.id;
      }

      setConversationId(
        currentConversationId
      );
    }

    // ---------------------------------------------
    // Add question to UI immediately
    // ---------------------------------------------

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: cleanQuestion,
    };

    setMessages((previous) => [
      ...previous,
      userMessage,
    ]);

    setQuestion("");

    // ---------------------------------------------
    // Save question
    // ---------------------------------------------

    const {
      error: userMessageError,
    } = await supabase
      .from("rag_messages")
      .insert({
        conversation_id:
          currentConversationId,
        role: "user",
        content: cleanQuestion,
      });

    if (userMessageError) {
      throw userMessageError;
    }

    // ---------------------------------------------
    // Ask RAG API
    // ---------------------------------------------

    const response = await fetch(
      "/api/ai/rag",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          question: cleanQuestion,
          documentId,
        }),
      }
    );

    const result =
      await response.json();

    if (!response.ok) {
      throw new Error(
        result.error ||
          "Unable to answer your question."
      );
    }

    // ---------------------------------------------
    // Add AI answer to UI
    // ---------------------------------------------

    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: result.answer,
    };

    setMessages((previous) => [
  ...previous,
  assistantMessage,
]);

// Answer has arrived, so stop showing
// the thinking indicator immediately.
setAsking(false);

// ---------------------------------------------
// Save AI answer
// ---------------------------------------------

const {
  error: assistantMessageError,
} = await supabase
  .from("rag_messages")
  .insert({
    conversation_id:
      currentConversationId,
    role: "assistant",
    content: result.answer,
  });

    if (assistantMessageError) {
      throw assistantMessageError;
    }

    // ---------------------------------------------
    // Update conversation timestamp
    // ---------------------------------------------

    await supabase
      .from("rag_conversations")
      .update({
        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        currentConversationId
      );
  } catch (error) {
  console.error(
    "RAG chat error:",
    error
  );

  if (error && typeof error === "object") {
    console.error(
      "Error details:",
      JSON.stringify(
        error,
        null,
        2
      )
    );
  }

  if (error instanceof Error) {
    console.error(
      "Message:",
      error.message
    );

    console.error(
      "Stack:",
      error.stack
    );
  }

  setError(
    error instanceof Error
      ? error.message
      : "Something went wrong."
  );
}
}

  // --------------------------------------------------
  // Enter key
  // --------------------------------------------------

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      handleAsk();
    }
  }

  // --------------------------------------------------
  // Loading
  // --------------------------------------------------

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f2ee]">
        <p className="text-sm text-[#6f6870]">
          Loading your notes...
        </p>
      </main>
    );
  }

  // --------------------------------------------------
  // Error
  // --------------------------------------------------

  if (!document) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f2ee] px-6">
        <div className="text-center">
          <p className="text-sm text-red-500">
            {error ||
              "Document not found."}
          </p>

          <Link
            href="/my-notes"
            className="mt-4 inline-block text-sm font-medium text-[#250e2c] underline"
          >
            Back to My Notes
          </Link>
        </div>
      </main>
    );
  }

  // --------------------------------------------------
  // Main UI
  // --------------------------------------------------

  return (
    <main className="flex h-screen flex-col bg-[#f7f2ee]">
      {/* Header */}

      <header className="flex shrink-0 items-center justify-between border-b border-[#e5dadd] bg-[#fcfaf8] px-6 py-4">
  <div className="flex min-w-0 items-center">
    <Link
      href="/my-notes"
      className="mr-4 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg text-[#6f6870] transition hover:bg-[#f1e9f2]"
      aria-label="Back to My Notes"
    >
      ←
    </Link>

    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-wide text-[#9d85b6]">
        AI Study Chat
      </p>

      <h1 className="truncate text-lg font-semibold text-[#250e2c]">
        {document.title ||
          document.file_name}
      </h1>
    </div>
  </div>

  <div className="ml-4 hidden shrink-0 text-right sm:block">
    <p className="text-xs text-[#9d85b6]">
      {messages.length}{" "}
      {messages.length === 1
        ? "message"
        : "messages"}
    </p>

    <p className="text-xs text-[#9d85b6]">
      Based on your notes
    </p>
  </div>
</header>

      {/* Chat area */}

      <div className="flex-1 overflow-y-auto bg-[#f7f2ee]">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-5 py-8">
          {/* Empty state */}

          {messages.length === 0 && (
            <div className="flex min-h-[60vh] items-center justify-center">
              <div className="max-w-xl text-center">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#250e2c] text-xl text-white">
                  ✦
                </div>

                <h2 className="text-2xl font-semibold text-[#250e2c]">
                  Ask anything about your notes
                </h2>

                <p className="mt-3 text-sm leading-6 text-[#6f6870]">
                  Ask questions about{" "}
                  <span className="font-medium text-[#3b1645]">
                    {document.file_name}
                  </span>
                  . I&apos;ll answer using the
                  information from your uploaded
                  notes.
                </p>
              </div>
            </div>
          )}

          {/* Messages */}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user"
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-5 py-4 ${
                  message.role === "user"
                    ? "rounded-br-md bg-[#250e2c] text-white"
                    : "rounded-bl-md border border-[#e5dadd] bg-[#fcfaf8] text-[#250e2c] shadow-sm"
                }`}
              >
                <p className="mb-1 text-xs font-semibold opacity-60">
                  {message.role === "user"
                    ? "You"
                    : "AI Tutor"}
                </p>

                <div className="text-sm leading-7">
  {message.role === "assistant" ? (
    <ReactMarkdown
      components={{
  h1: ({ children }) => (
    <h1 className="mb-4 mt-6 text-xl font-bold text-[#250e2c] first:mt-0">
      {children}
    </h1>
  ),

  h2: ({ children }) => (
    <h2 className="mb-3 mt-5 text-lg font-bold text-[#250e2c] first:mt-0">
      {children}
    </h2>
  ),

  h3: ({ children }) => (
    <h3 className="mb-2 mt-4 text-base font-semibold text-[#250e2c] first:mt-0">
      {children}
    </h3>
  ),

  p: ({ children }) => (
    <p className="mb-4 leading-7 text-[#6f6870] last:mb-0">
      {children}
    </p>
  ),

  ul: ({ children }) => (
    <ul className="mb-4 ml-6 list-disc space-y-2 text-[#6f6870]">
      {children}
    </ul>
  ),

  ol: ({ children }) => (
    <ol className="mb-4 ml-6 list-decimal space-y-2 text-[#6f6870]">
      {children}
    </ol>
  ),

  li: ({ children }) => (
    <li className="pl-1 leading-7">
      {children}
    </li>
  ),

  strong: ({ children }) => (
    <strong className="font-semibold text-[#250e2c]">
      {children}
    </strong>
  ),

  em: ({ children }) => (
    <em className="italic text-[#6f6870]">
      {children}
    </em>
  ),

  code: ({ children }) => (
    <code className="rounded-md bg-[#f1e9f2] px-1.5 py-0.5 font-mono text-[13px] text-[#3b1645]">
      {children}
    </code>
  ),

  blockquote: ({ children }) => (
    <blockquote className="my-4 border-l-4 border-[#cc8db3] pl-4 text-[#6f6870]">
      {children}
    </blockquote>
  ),
}}
    >
      {message.content}
    </ReactMarkdown>
  ) : (
    <div className="whitespace-pre-wrap">
      {message.content}
    </div>
  )}
</div>
              </div>
            </div>
          ))}

          <div ref={messagesEndRef} />

          {/* Thinking */}

          {asking && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md border border-[#e5dadd] bg-[#fcfaf8] px-5 py-4 shadow-sm">
                <p className="text-sm text-[#6f6870]">
                  AI Tutor is thinking...
                </p>
              </div>
            </div>
          )}

          {/* Error */}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Input */}

      <div className="shrink-0 border-t border-[#e5dadd] bg-[#fcfaf8] px-5 py-4">
        <div className="mx-auto flex w-full max-w-4xl items-end gap-3">
          <textarea
            value={question}
            onChange={(event) =>
              setQuestion(
                event.target.value
              )
            }
            onKeyDown={handleKeyDown}
            placeholder="Ask something about your notes..."
            rows={1}
            disabled={asking}
            className="max-h-32 min-h-[48px] flex-1 resize-none rounded-2xl border border-[#e5dadd] bg-[#fcfaf8] px-4 py-3 text-sm text-[#250e2c] placeholder:text-[#9d85b6] outline-none transition focus:border-[#cc8db3] focus:bg-[#fcfaf8] disabled:opacity-60"
          />

          <button
            type="button"
            onClick={handleAsk}
            disabled={
              asking ||
              !question.trim()
            }
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#250e2c] text-lg text-white transition hover:bg-[#3b1645] disabled:cursor-not-allowed disabled:opacity-40"
          >
            ↑
          </button>
        </div>

        <p className="mx-auto mt-2 max-w-4xl text-xs text-[#9d85b6]">
          Press Enter to send · Shift + Enter
          for a new line
        </p>
      </div>
    </main>
  );
}