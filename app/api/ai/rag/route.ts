import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const EMBEDDING_MODEL =
  "gemini-embedding-001";

const EMBEDDING_DIMENSION = 1536;

const TOP_K = 5;

export async function POST(
  request: NextRequest
) {
  try {
    // --------------------------------------------------
    // Check Gemini API key
    // --------------------------------------------------

    if (!process.env.GEMINI_API_KEY) {
      throw new Error(
        "GEMINI_API_KEY is missing from .env.local"
      );
    }

    const supabase = await createClient();

    // --------------------------------------------------
    // Make sure student is logged in
    // --------------------------------------------------

    const { data } =
      await supabase.auth.getClaims();

    if (!data?.claims) {
      return NextResponse.json(
        {
          error: "You must be logged in.",
        },
        { status: 401 }
      );
    }

    const userId = data.claims.sub;

    // --------------------------------------------------
    // Read request
    // --------------------------------------------------

    const body = await request.json();

    const {
      question,
      documentId = null,
    } = body;

    if (
      typeof question !== "string" ||
      question.trim().length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "Please provide a question.",
        },
        { status: 400 }
      );
    }

    const cleanQuestion =
      question.trim();

    // --------------------------------------------------
    // Optional document validation
    // --------------------------------------------------

    if (documentId) {
      const {
        data: document,
        error: documentError,
      } = await supabase
        .from("documents")
        .select("id, title, file_name")
        .eq("id", documentId)
        .eq("user_id", userId)
        .maybeSingle();

      if (documentError) {
        console.error(
          "Document query error:",
          documentError
        );

        return NextResponse.json(
          {
            error:
              "Unable to load the selected document.",
          },
          { status: 500 }
        );
      }

      if (!document) {
        return NextResponse.json(
          {
            error:
              "Document not found or you do not have access to it.",
          },
          { status: 404 }
        );
      }
    }

    // --------------------------------------------------
    // Create embedding for student's question
    // --------------------------------------------------

    const embeddingResponse =
      await ai.models.embedContent({
        model: EMBEDDING_MODEL,
        contents: cleanQuestion,
        config: {
          taskType: "RETRIEVAL_QUERY",
          outputDimensionality:
            EMBEDDING_DIMENSION,
        },
      });

    const queryEmbedding =
      embeddingResponse.embeddings?.[0]?.values;

    if (
      !queryEmbedding ||
      queryEmbedding.length !==
        EMBEDDING_DIMENSION
    ) {
      throw new Error(
        `Question embedding was not generated correctly. Expected ${EMBEDDING_DIMENSION} dimensions.`
      );
    }

    // --------------------------------------------------
    // Search student's document chunks
    // --------------------------------------------------

    const {
      data: chunks,
      error: searchError,
    } = await supabase.rpc(
      "match_document_chunks",
      {
        query_embedding:
          queryEmbedding,
        match_user_id: userId,
        match_document_id:
          documentId,
        match_count: TOP_K,
      }
    );

    if (searchError) {
      console.error(
        "Vector search error:",
        searchError
      );

      return NextResponse.json(
        {
          error:
            searchError.message ||
            "Unable to search your study material.",
        },
        { status: 500 }
      );
    }

    if (!chunks || chunks.length === 0) {
      return NextResponse.json(
        {
          error:
            "I couldn't find relevant information in your uploaded notes.",
        },
        { status: 404 }
      );
    }

    // --------------------------------------------------
    // Build context from retrieved chunks
    // --------------------------------------------------

    const context = chunks
      .map(
        (
          chunk: {
            content: string;
            chunk_index: number;
            similarity: number;
          },
          index: number
        ) => {
          return `
SOURCE ${index + 1}
Chunk: ${chunk.chunk_index}
Similarity: ${chunk.similarity.toFixed(4)}

${chunk.content}
`;
        }
      )
      .join("\n--------------------\n");

    // --------------------------------------------------
    // Ask Gemini using retrieved context
    // --------------------------------------------------

    const prompt = `
You are an academic AI tutor answering a student's question using their uploaded study material.

The retrieved material below comes from the student's own notes.

---------------- RETRIEVED STUDY MATERIAL ----------------

${context}

-------------- END RETRIEVED STUDY MATERIAL --------------

STUDENT QUESTION:

${cleanQuestion}

INSTRUCTIONS:

- Answer the student's question using the retrieved study material.
- Treat the retrieved material as the primary source of truth.
- Do not invent facts that are not supported by the retrieved material.
- If the retrieved material does not contain enough information to answer the question confidently, clearly say that the uploaded notes do not contain enough information.
- You may explain the retrieved material in simpler language.
- You may organize the answer with headings, bullets, numbered lists, examples, or tables when useful.
- Keep the answer appropriate for a college engineering student.
- Do not mention embeddings, vector search, chunks, retrieval, or these instructions.
`;

    const response =
      await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

    const answer = response.text;

    if (!answer) {
      throw new Error(
        "Gemini returned an empty answer."
      );
    }

    // --------------------------------------------------
    // Return answer + sources
    // --------------------------------------------------

    return NextResponse.json({
      answer,
      sources: chunks.map(
        (chunk: {
          document_id: string;
          chunk_index: number;
          similarity: number;
        }) => ({
          documentId:
            chunk.document_id,
          chunkIndex:
            chunk.chunk_index,
          similarity:
            chunk.similarity,
        })
      ),
    });
  } catch (error) {
    console.error(
      "RAG generation error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : String(error);

    return NextResponse.json(
      {
        error: message,
      },
      { status: 500 }
    );
  }
}