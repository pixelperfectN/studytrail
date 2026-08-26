"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type NoteSession = {
  id: string;
  title: string;
  subject_id: string;
  topic_id: string;
  generated_notes: string | null;
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

type NoteCard = NoteSession & {
  subjectName: string;
  topicName: string;
};

type Tab = "generated" | "uploaded";

type UploadedDocument = {
  id: string;
  title: string;
  file_name: string;
  file_type: string;
  file_size: number | null;
  created_at: string;
  file_path: string;
};

export default function MyNotesPage() {
  const supabase = createClient();

  const [activeTab, setActiveTab] =
    useState<Tab>("generated");

  const [notes, setNotes] = useState<NoteCard[]>([]);
  const [selectedNote, setSelectedNote] =
    useState<NoteCard | null>(null);

  const [uploadedDocuments, setUploadedDocuments] =
    useState<UploadedDocument[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [uploading, setUploading] =
    useState(false);

  const [uploadError, setUploadError] =
    useState("");

  const [uploadSuccess, setUploadSuccess] =
    useState("");

  const router = useRouter();

  // --------------------------------------------------
  // Load saved generated notes
  // --------------------------------------------------

  useEffect(() => {
    async function loadNotes() {
      setLoading(true);
      setError("");

      try {
        const {
          data: noteSessions,
          error: notesError,
        } = await supabase
          .from("learning_sessions")
          .select(
            "id, title, subject_id, topic_id, generated_notes, updated_at"
          )
          .not("generated_notes", "is", null)
          .order("updated_at", {
            ascending: false,
          });

        if (notesError) {
          console.error(
            "Notes query error:",
            notesError
          );

          throw new Error(
            notesError.message ||
              "Unable to load your notes."
          );
        }

        if (
          !noteSessions ||
          noteSessions.length === 0
        ) {
          setNotes([]);
          return;
        }

        const subjectIds = [
          ...new Set(
            noteSessions.map(
              (note) => note.subject_id
            )
          ),
        ];

        const topicIds = [
          ...new Set(
            noteSessions.map(
              (note) => note.topic_id
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

        const cards: NoteCard[] =
          noteSessions.map((note) => ({
            ...note,
            subjectName:
              subjectMap.get(
                note.subject_id
              ) || "Subject",
            topicName:
              topicMap.get(
                note.topic_id
              ) || note.title,
          }));

        setNotes(cards);
      } catch (error) {
        console.error(error);

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load your notes."
        );
      } finally {
        setLoading(false);
      }
    }

    loadNotes();
  }, []);

  // --------------------------------------------------
  // Load uploaded notes
  // --------------------------------------------------

  async function loadUploadedDocuments() {
    try {
      const {
        data,
        error: documentsError,
      } = await supabase
        .from("documents")
        .select(
          "id, title, file_name, file_type, file_size, created_at, file_path"
        )
        .order("created_at", {
          ascending: false,
        });

      if (documentsError) {
        console.error(
          "Uploaded documents error:",
          documentsError
        );

        throw new Error(
          documentsError.message ||
            "Unable to load uploaded notes."
        );
      }

      setUploadedDocuments(
        (data as UploadedDocument[]) || []
      );
    } catch (error) {
      console.error(error);

      setUploadError(
        error instanceof Error
          ? error.message
          : "Unable to load uploaded notes."
      );
    }
  }

  useEffect(() => {
    loadUploadedDocuments();
  }, []);

  // --------------------------------------------------
  // Upload PDF
  // --------------------------------------------------

  async function handleUpload(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setUploadError("");
    setUploadSuccess("");

    // Only PDFs for now
    if (file.type !== "application/pdf") {
      setUploadError(
        "Please upload a PDF file."
      );

      event.target.value = "";
      return;
    }

    // 20 MB limit
    if (file.size > 20 * 1024 * 1024) {
      setUploadError(
        "File size must be less than 20 MB."
      );

      event.target.value = "";
      return;
    }

    setUploading(true);

    try {
      // ----------------------------------------------
      // Get logged-in user
      // ----------------------------------------------

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error(
          "You must be logged in to upload notes."
        );
      }

      // ----------------------------------------------
      // Create safe unique file path
      // ----------------------------------------------

      const safeFileName = file.name.replace(
        /[^a-zA-Z0-9._-]/g,
        "_"
      );

      const filePath =
        `${user.id}/${crypto.randomUUID()}-${safeFileName}`;

      // ----------------------------------------------
      // Upload file to Supabase Storage
      // ----------------------------------------------

      const {
        error: storageError,
      } = await supabase.storage
        .from("study-materials")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

      if (storageError) {
        console.error(
          "Storage upload error:",
          storageError
        );

        throw new Error(
          storageError.message ||
            "Unable to upload the file."
        );
      }

      // ----------------------------------------------
      // Save document metadata
      // ----------------------------------------------

     const {
      data: insertedDocument,
      error: documentError,
    } = await supabase
      .from("documents")
      .insert({
        user_id: user.id,
        title: file.name.replace(
          /\.[^/.]+$/,
          ""
        ),
        file_name: file.name,
        file_type: "pdf",
        file_path: filePath,
        file_size: file.size,
      })
      .select("id")
      .single();

      if (documentError) {
        console.error(
          "Document insert error:",
          documentError
        );

        // Remove uploaded file if database
        // insertion fails.
        await supabase.storage
          .from("study-materials")
          .remove([filePath]);

        throw new Error(
          documentError.message ||
            "Unable to save document information."
        );
      }

      if (!insertedDocument) {
        throw new Error(
        "Document was uploaded but its database ID could not be retrieved."
        );
      }

      const processResponse = await fetch(
  "/api/documents/process",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      documentId: insertedDocument.id,
    }),
  }
);

const responseText =
  await processResponse.text();

let processResult: {
  error?: string;
  characterCount: number;
  chunkCount: number;
};

try {
  processResult = responseText
    ? JSON.parse(responseText)
    : {};
} catch {
  console.error(
    "Non-JSON response from PDF processor:",
    responseText
  );

  throw new Error(
    `PDF processing failed (HTTP ${processResponse.status}). Check the terminal for the server error.`
  );
}

if (!processResponse.ok) {
  throw new Error(
    processResult.error ||
      "PDF was uploaded but could not be processed."
  );
}

      await loadUploadedDocuments();

      setUploadSuccess(
        `Your notes were uploaded and processed successfully. Extracted ${processResult.characterCount.toLocaleString()} characters into ${processResult.chunkCount} chunks with 1536-dimensional embeddings.`
      );
    } catch (error) {
      console.error(error);

      setUploadError(
        error instanceof Error
          ? error.message
          : "Something went wrong while uploading."
      );
    } finally {
      setUploading(false);

      // Allows the same file to be selected again
      event.target.value = "";
    }
  }

  // --------------------------------------------------
  // Format date
  // --------------------------------------------------

  function formatDate(dateString: string) {
    const date = new Date(dateString);

    return date.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  // --------------------------------------------------
  // Markdown styling
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
          [&_code]:text-[#3b1645]

          [&_pre]:my-6
          [&_pre]:overflow-x-auto
          [&_pre]:rounded-xl
          [&_pre]:bg-[#250e2c]
          [&_pre]:p-5
          [&_pre]:text-sm
          [&_pre]:leading-6
          [&_pre]:text-[#f7f2ee]

          [&_pre_code]:bg-transparent
          [&_pre_code]:p-0
          [&_pre_code]:text-[#f7f2ee]

          [&_table]:my-6
          [&_table]:w-full
          [&_table]:border-collapse
          [&_table]:overflow-hidden

          [&_th]:border
          [&_th]:border-[#e5dadd]
          [&_th]:bg-[#f1e9f2]
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
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
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
        <div className="mx-auto max-w-6xl">
          <div className="h-4 w-32 animate-pulse rounded bg-[#e5dadd]" />

          <div className="mt-8 h-10 w-56 animate-pulse rounded bg-[#e5dadd]" />

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="h-52 animate-pulse rounded-2xl bg-[#fcfaf8]" />
            <div className="h-52 animate-pulse rounded-2xl bg-[#fcfaf8]" />
            <div className="h-52 animate-pulse rounded-2xl bg-[#fcfaf8]" />
          </div>
        </div>
      </main>
    );
  }

  // --------------------------------------------------
  // Error
  // --------------------------------------------------

  if (error) {
    return (
      <main className="min-h-screen bg-[#f7f2ee] px-5 py-10">
        <div className="mx-auto max-w-6xl">
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

  // --------------------------------------------------
  // Main page
  // --------------------------------------------------

  return (
    <main className="min-h-screen bg-[#f7f2ee] text-[#250e2c]">
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:py-10">

        {/* Back */}

        <Link
          href="/dashboard"
          className="text-sm font-medium text-[#9d85b6] transition hover:text-[#250e2c]"
        >
          ← Back to Dashboard
        </Link>

        {/* Header */}

        <header className="mt-8">
          <p className="text-sm font-medium text-[#7c5cff]">
            Student AI
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            My Notes
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6f6870] sm:text-base">
            Keep your generated notes and uploaded
            study material in one place.
          </p>
        </header>

        {/* ------------------------------------------------ */}
        {/* Tabs */}
        {/* ------------------------------------------------ */}

        <div className="mt-8 border-b border-[#e5dadd]">
          <div className="flex gap-8">

            <button
              type="button"
              onClick={() =>
                setActiveTab("generated")
              }
              className={`relative pb-3 text-sm font-medium transition ${
                activeTab === "generated"
                  ? "text-[#250e2c]"
                  : "text-[#9d85b6] hover:text-[#6f6870]"
              }`}
            >
              Generated Notes

              {activeTab === "generated" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#250e2c]" />
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                setActiveTab("uploaded")
              }
              className={`relative pb-3 text-sm font-medium transition ${
                activeTab === "uploaded"
                  ? "text-[#250e2c]"
                  : "text-[#9d85b6] hover:text-[#6f6870]"
              }`}
            >
              Uploaded Notes

              {activeTab === "uploaded" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#250e2c]" />
              )}
            </button>

          </div>
        </div>

        {/* ================================================= */}
        {/* GENERATED NOTES */}
        {/* ================================================= */}

        {activeTab === "generated" && (
          <>
            {notes.length === 0 ? (
              <section className="mt-10 rounded-2xl border border-dashed border-[#e5dadd] bg-[#fcfaf8] px-6 py-16 text-center">

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f1e9f2] text-2xl">
                  □
                </div>

                <h2 className="mt-6 text-xl font-semibold">
                  No saved notes yet
                </h2>

                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#6f6870]">
                  Learn a topic first, ask your
                  questions, and then generate notes
                  from your learning session.
                </p>

                <Link
                  href="/learn"
                  className="mt-7 inline-flex rounded-xl bg-[#250e2c] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#3b1645]"
                >
                  Start learning
                </Link>

              </section>
            ) : (
              <section className="mt-10">

                <div className="mb-5">
                  <h2 className="text-lg font-semibold">
                    Saved notes
                  </h2>

                  <p className="mt-1 text-sm text-[#9d85b6]">
                    {notes.length}{" "}
                    {notes.length === 1
                      ? "topic"
                      : "topics"}{" "}
                    with generated notes
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {notes.map((note) => (
                    <button
                      key={note.id}
                      type="button"
                      onClick={() =>
                        setSelectedNote(note)
                      }
                      className="group rounded-2xl border border-[#e5dadd] bg-[#fcfaf8] p-6 text-left transition hover:-translate-y-0.5 hover:border-[#cc8db3] hover:shadow-sm"
                    >

                      <div className="flex items-start justify-between gap-4">

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f1e9f2] text-lg">
                          □
                        </div>

                        <span className="text-xs text-[#9d85b6]">
                          {formatDate(
                            note.updated_at
                          )}
                        </span>

                      </div>

                      <p className="mt-5 text-xs font-medium uppercase tracking-wide text-[#7c5cff]">
                        {note.subjectName}
                      </p>

                      <h3 className="mt-2 text-lg font-semibold text-[#250e2c] transition group-hover:text-[#7c5cff]">
                        {note.topicName}
                      </h3>

                      <p className="mt-3 text-sm leading-6 text-[#6f6870]">
                        AI-generated notes from your
                        learning session.
                      </p>

                      <div className="mt-6 flex items-center justify-between border-t border-[#e5dadd] pt-4">

                        <span className="text-sm font-medium text-[#6f6870] group-hover:text-[#250e2c]">
                          Open notes
                        </span>

                        <span className="text-[#9d85b6] transition group-hover:translate-x-1 group-hover:text-[#250e2c]">
                          →
                        </span>

                      </div>

                    </button>
                  ))}
                </div>

              </section>
            )}
          </>
        )}

        {/* ================================================= */}
        {/* UPLOADED NOTES */}
        {/* ================================================= */}

        {activeTab === "uploaded" && (
          <section className="mt-10">

            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

              <div>
                <h2 className="text-lg font-semibold">
                  Uploaded Notes
                </h2>

                <p className="mt-1 max-w-xl text-sm leading-6 text-[#9d85b6]">
                  Upload your own study material and
                  ask AI questions based on it.
                </p>
              </div>

              <label
                className={`inline-flex shrink-0 items-center justify-center rounded-xl px-5 py-3 text-sm font-medium text-white transition ${
                  uploading
                    ? "cursor-not-allowed bg-[#9d85b6]"
                    : "cursor-pointer bg-[#250e2c] hover:bg-[#3b1645]"
                }`}
              >
                {uploading
                  ? "Uploading..."
                  : "+ Upload Notes"}

                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={handleUpload}
                  disabled={uploading}
                />
              </label>

            </div>

            {/* Upload messages */}

            {uploadError && (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {uploadError}
              </div>
            )}

            {uploadSuccess && (
              <div className="mt-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {uploadSuccess}
              </div>
            )}

            {/* Uploaded documents */}

            {uploadedDocuments.length === 0 ? (
              <div className="mt-8 rounded-2xl border border-dashed border-[#e5dadd] bg-[#fcfaf8] px-6 py-16 text-center">

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f1e9f2] text-2xl">
                  ↑
                </div>

                <h3 className="mt-6 text-xl font-semibold">
                  No uploaded notes yet
                </h3>

                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#6f6870]">
                  Upload your study material as a
                  PDF. Later, you’ll be able to ask
                  AI questions directly from your
                  material using RAG.
                </p>

                <label className="mt-7 inline-flex cursor-pointer rounded-xl bg-[#250e2c] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#3b1645]">

                  {uploading
                    ? "Uploading..."
                    : "Upload your first notes"}

                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={handleUpload}
                    disabled={uploading}
                  />

                </label>

              </div>
            ) : (
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

                {uploadedDocuments.map(
                  (document) => (
                    <div
                      key={document.id}
                      className="rounded-2xl border border-[#e5dadd] bg-[#fcfaf8] p-6"
                    >

                      <div className="flex items-start justify-between gap-4">

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f1e9f2] text-lg">
                          📄
                        </div>

                        <span className="text-xs text-[#9d85b6]">
                          {formatDate(
                            document.created_at
                          )}
                        </span>

                      </div>

                      <h3 className="mt-5 line-clamp-2 text-lg font-semibold text-[#250e2c]">
                        {document.title}
                      </h3>

                      <p className="mt-2 text-sm text-[#6f6870]">
                        {document.file_name}
                      </p>

                      {document.file_size && (
                        <p className="mt-1 text-xs text-[#9d85b6]">
                          {(
                            document.file_size /
                            1024 /
                            1024
                          ).toFixed(2)}{" "}
                          MB
                        </p>
                      )}

                      <div className="mt-6 border-t border-[#e5dadd] pt-4">
  <button
  type="button"
  onClick={() =>
    router.push(
      `/notes/chat/${document.id}`
    )
  }
  className="w-full rounded-xl bg-[#250e2c] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#3b1645]"
>
  Ask AI from these notes
</button>
</div>

                    </div>
                  )
                )}

              </div>
            )}

          </section>
        )}

        {/* ================================================= */}
        {/* GENERATED NOTE VIEWER */}
        {/* ================================================= */}

        {selectedNote && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#250e2c]/30 p-4 backdrop-blur-sm">

            <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-[#fcfaf8] shadow-xl">

              <div className="flex items-start justify-between gap-4 border-b border-[#e5dadd] px-6 py-5 sm:px-8">

                <div className="min-w-0">

                  <p className="text-xs font-medium uppercase tracking-wide text-[#7c5cff]">
                    {selectedNote.subjectName}
                  </p>

                  <h2 className="mt-1 text-xl font-semibold text-[#250e2c]">
                    {selectedNote.topicName}
                  </h2>

                  <p className="mt-1 text-xs text-[#9d85b6]">
                    Updated{" "}
                    {formatDate(
                      selectedNote.updated_at
                    )}
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedNote(null)
                  }
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#9d85b6] transition hover:bg-[#f1e9f2] hover:text-[#250e2c]"
                  aria-label="Close notes"
                >
                  ×
                </button>

              </div>

              <div className="overflow-y-auto px-6 py-8 sm:px-10 sm:py-10">

                {selectedNote.generated_notes && (
                  <article className="mx-auto max-w-3xl">

                    <MarkdownContent
                      content={
                        selectedNote.generated_notes
                      }
                    />

                  </article>
                )}

              </div>

              <div className="flex flex-col gap-3 border-t border-[#e5dadd] px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">

                <Link
                  href={`/learn/topic?subjectId=${selectedNote.subject_id}&topicId=${selectedNote.topic_id}&mode=learn&sessionId=${selectedNote.id}`}
                  className="text-sm font-medium text-[#6f6870] transition hover:text-[#250e2c]"
                >
                  Continue learning →
                </Link>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedNote(null)
                  }
                  className="rounded-xl bg-[#250e2c] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#3b1645]"
                >
                  Done
                </button>

              </div>

            </div>
          </div>
        )}

      </div>
    </main>
  );
}