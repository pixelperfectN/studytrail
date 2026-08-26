import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import pdf from "pdf-parse";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;

const EMBEDDING_MODEL =
  "gemini-embedding-001";

const EMBEDDING_DIMENSION = 1536;

function createChunks(text: string) {
  const chunks: string[] = [];

  let start = 0;

  while (start < text.length) {
    let end = start + CHUNK_SIZE;

    if (end < text.length) {
      const nextBreak = text.lastIndexOf(
        "\n",
        end
      );

      if (nextBreak > start + 500) {
        end = nextBreak;
      }
    }

    const chunk = text
      .slice(start, end)
      .trim();

    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    if (end >= text.length) {
      break;
    }

    start = end - CHUNK_OVERLAP;
  }

  return chunks;
}

export async function POST(request: Request) {
  try {
    // ---------------------------------------------
    // Check Gemini API key
    // ---------------------------------------------

    if (!process.env.GEMINI_API_KEY) {
      throw new Error(
        "GEMINI_API_KEY is missing from .env.local"
      );
    }

    const supabase = await createClient();

    // ---------------------------------------------
    // Get logged-in user
    // ---------------------------------------------

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          error: "You must be logged in.",
        },
        { status: 401 }
      );
    }

    // ---------------------------------------------
    // Get document ID
    // ---------------------------------------------

    const body = await request.json();

    const documentId = body.documentId;

    if (!documentId) {
      return NextResponse.json(
        {
          error: "Document ID is required.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------
    // Get document
    // ---------------------------------------------

    const {
      data: document,
      error: documentError,
    } = await supabase
      .from("documents")
      .select(
        "id, user_id, file_name, file_path, file_type"
      )
      .eq("id", documentId)
      .eq("user_id", user.id)
      .single();

    if (documentError || !document) {
      return NextResponse.json(
        {
          error: "Document not found.",
        },
        { status: 404 }
      );
    }

    // ---------------------------------------------
    // Download PDF from Storage
    // ---------------------------------------------

    const {
      data: file,
      error: downloadError,
    } = await supabase.storage
      .from("study-materials")
      .download(document.file_path);

    if (downloadError || !file) {
      console.error(
        "Storage download error:",
        downloadError
      );

      return NextResponse.json(
        {
          error:
            downloadError?.message ||
            "Unable to download the document.",
        },
        { status: 500 }
      );
    }

    // ---------------------------------------------
    // Convert PDF to Buffer
    // ---------------------------------------------

    const arrayBuffer =
      await file.arrayBuffer();

    const buffer =
      Buffer.from(arrayBuffer);

    // ---------------------------------------------
    // Extract PDF text
    // ---------------------------------------------

    const result = await pdf(buffer);

    const extractedText =
      result.text?.trim() || "";

    if (!extractedText) {
      return NextResponse.json(
        {
          error:
            "No readable text was found in this PDF.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------
    // Create text chunks
    // ---------------------------------------------

    const chunks =
      createChunks(extractedText);

    if (chunks.length === 0) {
      return NextResponse.json(
        {
          error:
            "No usable text chunks could be created.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------
    // Remove old chunks
    // ---------------------------------------------

    const {
      error: deleteError,
    } = await supabase
      .from("document_chunks")
      .delete()
      .eq("document_id", document.id)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error(
        "Existing chunks delete error:",
        deleteError
      );

      return NextResponse.json(
        {
          error:
            deleteError.message ||
            "Unable to prepare document chunks.",
        },
        { status: 500 }
      );
    }

    // ---------------------------------------------
    // Generate Gemini embeddings
    // ---------------------------------------------

    console.log(
      `Generating embeddings for ${chunks.length} chunks...`
    );

    const embeddingResponse =
      await ai.models.embedContent({
        model: EMBEDDING_MODEL,
        contents: chunks,
        config: {
          taskType: "RETRIEVAL_DOCUMENT",
          title: document.file_name,
          outputDimensionality:
            EMBEDDING_DIMENSION,
        },
      });

    const embeddings =
      embeddingResponse.embeddings;

    if (
      !embeddings ||
      embeddings.length !== chunks.length
    ) {
      throw new Error(
        `Expected ${chunks.length} embeddings but received ${
          embeddings?.length ?? 0
        }.`
      );
    }

    // ---------------------------------------------
    // Prepare rows
    // ---------------------------------------------

    const chunkRows = chunks.map(
      (content, index) => {
        const values =
          embeddings[index]?.values;

        if (!values) {
          throw new Error(
            `Missing embedding for chunk ${index}.`
          );
        }

        if (
          values.length !==
          EMBEDDING_DIMENSION
        ) {
          throw new Error(
            `Chunk ${index} has an embedding with ${values.length} dimensions instead of ${EMBEDDING_DIMENSION}.`
          );
        }

        return {
          document_id: document.id,
          user_id: user.id,
          content,
          chunk_index: index,
          embedding: values,
        };
      }
    );

    // ---------------------------------------------
    // Insert chunks + embeddings
    // ---------------------------------------------

    const BATCH_SIZE = 50;

    for (
      let i = 0;
      i < chunkRows.length;
      i += BATCH_SIZE
    ) {
      const batch = chunkRows.slice(
        i,
        i + BATCH_SIZE
      );

      const {
        error: insertError,
      } = await supabase
        .from("document_chunks")
        .insert(batch);

      if (insertError) {
        console.error(
          "Chunk insert error:",
          insertError
        );

        return NextResponse.json(
          {
            error:
              insertError.message ||
              "Unable to save document chunks and embeddings.",
          },
          { status: 500 }
        );
      }
    }

    // ---------------------------------------------
    // Return result
    // ---------------------------------------------

    return NextResponse.json({
      success: true,
      documentId: document.id,
      fileName: document.file_name,
      pageCount: result.numpages,
      characterCount:
        extractedText.length,
      chunkCount: chunks.length,
      embeddingDimension:
        EMBEDDING_DIMENSION,
    });
  } catch (error) {
    console.error(
      "========== PDF PROCESSING ERROR =========="
    );

    console.error(error);

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

    console.error(
      "=========================================="
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}