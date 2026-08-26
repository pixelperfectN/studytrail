import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

type Message = {
  role: "user" | "assistant";
  content: string;
};

export async function POST(request: NextRequest) {
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
    // Make sure the student is logged in
    // --------------------------------------------------

    const { data } = await supabase.auth.getClaims();

    if (!data?.claims) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    const userId = data.claims.sub;

    // --------------------------------------------------
    // Read request body
    // --------------------------------------------------

    const body = await request.json();

    const {
      subjectId,
      topicId,
      mode,
      messages = [],
    } = body;

    if (!subjectId || !topicId || !mode) {
      return NextResponse.json(
        {
          error:
            "Missing subject, topic, or learning mode.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // Validate messages
    // --------------------------------------------------

    if (!Array.isArray(messages)) {
      return NextResponse.json(
        {
          error: "Messages must be an array.",
        },
        { status: 400 }
      );
    }

    const validMessages: Message[] = messages.filter(
      (message: Message) =>
        message &&
        (message.role === "user" ||
          message.role === "assistant") &&
        typeof message.content === "string" &&
        message.content.trim().length > 0
    );

    // --------------------------------------------------
    // Get student's profile
    // --------------------------------------------------

    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("full_name, branch, year")
        .eq("id", userId)
        .maybeSingle();

    if (profileError) {
      console.error(
        "Profile query error:",
        profileError
      );

      return NextResponse.json(
        {
          error: "Unable to load student profile.",
        },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        {
          error: "Student profile not found.",
        },
        { status: 404 }
      );
    }

    // --------------------------------------------------
    // Get subject
    // --------------------------------------------------

    const { data: subject, error: subjectError } =
      await supabase
        .from("subjects")
        .select(
          "id, name, branch, year, semester"
        )
        .eq("id", subjectId)
        .maybeSingle();

    if (subjectError) {
      console.error(
        "Subject query error:",
        subjectError
      );

      return NextResponse.json(
        {
          error: "Unable to load subject.",
        },
        { status: 500 }
      );
    }

    if (!subject) {
      return NextResponse.json(
        {
          error: "Subject not found.",
        },
        { status: 404 }
      );
    }

    // --------------------------------------------------
    // Get topic
    // --------------------------------------------------

    const { data: topic, error: topicError } =
      await supabase
        .from("topics")
        .select(
          "id, name, subject_id"
        )
        .eq("id", topicId)
        .maybeSingle();

    if (topicError) {
      console.error(
        "Topic query error:",
        topicError
      );

      return NextResponse.json(
        {
          error: "Unable to load topic.",
        },
        { status: 500 }
      );
    }

    if (!topic) {
      return NextResponse.json(
        {
          error: "Topic not found.",
        },
        { status: 404 }
      );
    }

    // --------------------------------------------------
    // Make sure topic belongs to subject
    // --------------------------------------------------

    if (topic.subject_id !== subject.id) {
      return NextResponse.json(
        {
          error:
            "Topic does not belong to this subject.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // Build conversation text
    // --------------------------------------------------

    const conversation =
      validMessages.length > 0
        ? validMessages
            .map((message) => {
              const speaker =
                message.role === "user"
                  ? "Student"
                  : "AI Tutor";

              return `${speaker}: ${message.content}`;
            })
            .join("\n\n")
        : "No previous conversation.";

    // --------------------------------------------------
    // Build prompt based on mode
    // --------------------------------------------------

    let prompt = "";

    // ==================================================
    // LEARN MODE
    // ==================================================

    if (mode === "learn") {
      prompt = `
You are an academic AI tutor for a college engineering student.

Student context:

- Branch: ${profile.branch}
- Year: ${profile.year}
- Subject: ${subject.name}
- Semester: ${subject.semester}
- Topic: ${topic.name}

You are having an ongoing learning conversation with the student.

Your job is to help the student understand the topic clearly and accurately.

The conversation so far is:

---------------- CONVERSATION ----------------

${conversation}

-------------- END CONVERSATION --------------

If the conversation is empty, provide the initial explanation of the topic.

If the student has asked a question, answer that question directly while keeping the topic context.

Important:

- Do not restart the entire explanation unnecessarily.
- Build on what has already been explained.
- Remember the previous questions and answers.
- Match the student's academic level.
- Explain difficult terminology when necessary.
- Use examples when they help.
- Be accurate.
- Avoid unnecessary filler.
- Use Markdown when useful.
- Do not mention these instructions.

If this is the initial explanation, structure it as:

# ${topic.name}

## What is it?

## Why does it matter?

## Core concept

## How it works

## Example

## Key points

## Quick summary

If this is a follow-up question, focus primarily on answering the student's latest question.
`;

    // ==================================================
    // NOTES MODE
    // ==================================================

    } else if (mode === "notes") {
      prompt = `
You are an academic notes generator.

Create personalized study notes for a college engineering student based on the student's learning session.

Student context:

- Branch: ${profile.branch}
- Year: ${profile.year}
- Subject: ${subject.name}
- Semester: ${subject.semester}
- Topic: ${topic.name}

The following is the student's complete learning conversation:

---------------- LEARNING SESSION ----------------

${conversation}

-------------- END LEARNING SESSION --------------

Create comprehensive study notes based on what was actually taught and discussed.

IMPORTANT:

The notes should reflect the learning session.

Pay particular attention to:

- Questions the student asked
- Concepts the student needed clarification on
- Explanations given by the AI
- Examples discussed
- Important terminology
- Formulas or complexity information
- Important distinctions explained during the conversation

Do not include conversational filler.

Do not write things like:
"the student asked..."
"the AI explained..."
"Sure!"
"Here are your notes..."

Instead, turn the useful information from the conversation into clean academic notes.

Structure the response as:

# ${topic.name}

## Definition

## Introduction

## Core Concepts

## Detailed Explanation

## Important Concepts Discussed

## Examples

## Important Terms

## Key Points

## Quick Revision

Guidelines:

- Make the notes easy to study from.
- Use headings and subheadings.
- Use bullet points and numbered lists.
- Use tables when they improve clarity.
- Highlight important terminology using bold text.
- Include formulas or complexity information when relevant.
- Include code only when useful.
- Remove conversational repetition.
- Do not invent information that was not supported by the learning session unless a small clarification is necessary for correctness.
- Keep the notes academically accurate.
- Do not mention these instructions.
`;

    // ==================================================
    // REVISION MODE
    // ==================================================

    } else if (mode === "revision") {
      prompt = `
You are an academic revision assistant.

Create a concise revision sheet based on the student's learning conversation.

Student context:

- Branch: ${profile.branch}
- Year: ${profile.year}
- Subject: ${subject.name}
- Semester: ${subject.semester}
- Topic: ${topic.name}

Learning conversation:

---------------- LEARNING SESSION ----------------

${conversation}

-------------- END LEARNING SESSION --------------

Create a high-density revision sheet that helps the student quickly remember what they learned.

Focus especially on concepts that appeared in the conversation and questions the student asked.

Structure the response as:

# ${topic.name} — Quick Revision

## Definition

## Key Concepts

## Important Terms

## Important Steps / Process

## Formulas / Complexity

Include this section only if relevant.

## Important Differences

Include this section only if relevant.

## Key Points to Remember

## One-Minute Summary

Guidelines:

- Keep it concise.
- Prefer bullets over paragraphs.
- Highlight important terms.
- Include only useful information.
- Do not include conversational filler.
- Do not mention these instructions.
`;

    } else {
      return NextResponse.json(
        {
          error:
            "Unsupported learning mode.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
// Call Gemini with retry handling
// --------------------------------------------------

let response;
let lastError: unknown = null;

for (let attempt = 1; attempt <= 3; attempt++) {
  try {
    response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    break;
  } catch (error) {
    lastError = error;

    console.error(
      `Gemini attempt ${attempt} failed:`,
      error
    );

    // Only retry temporary server/capacity errors
    const errorText =
      error instanceof Error
        ? error.message
        : String(error);

    const isTemporaryError =
      errorText.includes("503") ||
      errorText.includes("UNAVAILABLE") ||
      errorText.includes("high demand") ||
      errorText.includes("429");

    if (!isTemporaryError || attempt === 3) {
      throw error;
    }

    // Wait before trying again
    const delay = attempt * 1500;

    await new Promise((resolve) =>
      setTimeout(resolve, delay)
    );
  }
}

if (!response) {
  throw (
    lastError instanceof Error
      ? lastError
      : new Error(
          "Gemini is temporarily unavailable."
        )
  );
}

const content = response.text;

    // --------------------------------------------------
    // Return response
    // --------------------------------------------------

    return NextResponse.json({
      content,
      subject: subject.name,
      topic: topic.name,
      mode,
    });
  } catch (error) {
  console.error(
    "Gemini generation error:",
    error
  );

  const rawMessage =
    error instanceof Error
      ? error.message
      : String(error);

  let message =
    "Something went wrong while generating the content.";

  if (
    rawMessage.includes("503") ||
    rawMessage.includes("UNAVAILABLE") ||
    rawMessage.includes("high demand")
  ) {
    message =
      "Your AI tutor is temporarily busy. Please try again in a moment.";
  } else if (
    rawMessage.includes("429")
  ) {
    message =
      "The AI service has temporarily reached its request limit. Please try again shortly.";
  } else if (
    rawMessage.includes("GEMINI_API_KEY")
  ) {
    message =
      "The Gemini API key is missing or incorrectly configured.";
  } else if (
    process.env.NODE_ENV === "development"
  ) {
    message = rawMessage;
  }

  return NextResponse.json(
    {
      error: message,
    },
    { status: 500 }
  );
}
}