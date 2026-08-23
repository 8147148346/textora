const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { GoogleGenAI } = require("@google/genai");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// ==========================================
// GEMINI API
// ==========================================

if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY is missing.");
  process.exit(1);
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

// Use one model consistently
const MODEL = "gemini-3.7-flash";

// ==========================================
// GEMINI HELPER WITH RETRY
// ==========================================

async function generateText(prompt) {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: MODEL,
        contents: prompt
      });

      return response.text || "";
    } catch (error) {
      console.error(
        `Gemini attempt ${attempt}/${maxAttempts} failed:`,
        error.message || error
      );

      const status = error?.status || error?.code;

      // Retry temporary errors
      if (
        (status === 429 || status === 500 || status === 502 || status === 503) &&
        attempt < maxAttempts
      ) {
        await new Promise(resolve =>
          setTimeout(resolve, attempt * 2000)
        );

        continue;
      }

      throw error;
    }
  }

  throw new Error("Gemini request failed.");
}

// ==========================================
// HEALTH CHECK
// ==========================================

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    message: "TEXTORA backend is running",
    model: MODEL
  });
});

// ==========================================
// PARAPHRASER
// ==========================================

app.post("/api/paraphrase", async (req, res) => {
  try {
    const { text, style = "Standard" } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        error: "Please enter some text."
      });
    }

    const prompt = `
You are TEXTORA, a professional writing assistant.

Paraphrase the following text while preserving its original meaning.

Writing style: ${style}

Rules:
- Preserve the meaning and important facts.
- Do not add facts.
- Improve clarity and natural flow.
- Keep the text readable.
- Return only the paraphrased text.
- Do not explain your changes.

Text:
${text}
`;

    const result = await generateText(prompt);

    res.json({
      result: result || "No result was returned."
    });

  } catch (error) {
    console.error("Paraphraser error:", error);

    res.status(500).json({
      error: "TEXTORA could not paraphrase the text right now."
    });
  }
});

// ==========================================
// AI HUMANIZER
// ==========================================

app.post("/api/humanize", async (req, res) => {
  try {
    const { text, style = "Natural" } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        error: "Please enter some text."
      });
    }

    const prompt = `
You are TEXTORA, a professional writing assistant.

Improve the following text so it sounds natural, clear and readable.

Writing style: ${style}

Rules:
- Preserve the original meaning.
- Do not invent facts.
- Improve sentence flow.
- Improve readability.
- Keep the writing natural.
- Return only the improved text.
- Do not explain your changes.

Text:
${text}
`;

    const result = await generateText(prompt);

    res.json({
      result: result || "No result was returned."
    });

  } catch (error) {
    console.error("Humanizer error:", error);

    res.status(500).json({
      error: "TEXTORA could not improve the text right now."
    });
  }
});

// ==========================================
// GRAMMAR CHECKER
// ==========================================

app.post("/api/grammar", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        error: "Please enter some text."
      });
    }

    const prompt = `
You are TEXTORA, a professional grammar assistant.

Correct the following text.

Check:
- Grammar
- Spelling
- Punctuation
- Sentence clarity
- Awkward wording

Rules:
- Preserve the original meaning.
- Do not invent facts.
- Correct genuine mistakes only.
- Return only the corrected text.
- Do not explain your changes.

Text:
${text}
`;

    const result = await generateText(prompt);

    res.json({
      result: result || "No result was returned."
    });

  } catch (error) {
    console.error("Grammar error:", error);

    res.status(500).json({
      error: "TEXTORA could not check the grammar right now."
    });
  }
});

// ==========================================
// ESSAY WRITER
// ==========================================

app.post("/api/essay", async (req, res) => {
  try {
    const {
      topic,
      instructions = "",
      essayType = "Argumentative",
      level = "School"
    } = req.body;

    if (!topic || !topic.trim()) {
      return res.status(400).json({
        error: "Please enter an essay topic."
      });
    }

    const prompt = `
You are TEXTORA, a professional writing assistant.

Create a well-structured essay draft.

Topic:
${topic}

Essay type:
${essayType}

Academic level:
${level}

Additional instructions:
${instructions || "None"}

Rules:
- Stay focused on the topic.
- Write a clear introduction.
- Develop logical body paragraphs.
- Include a conclusion.
- Use language appropriate for the requested level.
- Do not invent citations or facts.
- Return only the essay.
`;

    const result = await generateText(prompt);

    res.json({
      result: result || "No essay was returned."
    });

  } catch (error) {
    console.error("Essay error:", error);

    res.status(500).json({
      error: "TEXTORA could not create the essay right now."
    });
  }
});

// ==========================================
// AI CONTENT DETECTOR
// ==========================================

app.post("/api/detect-ai", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        error: "Please enter some text."
      });
    }

    const prompt = `
You are TEXTORA, a writing-analysis assistant.

Analyze the text for characteristics that may be associated with AI-generated writing.

This is only a probabilistic assessment.
Do not claim certainty.

Return ONLY valid JSON:

{
  "assessment": "Likely AI-like / Mixed signals / Likely human-like",
  "confidence": "Low / Medium / High",
  "signals": [
    "signal 1",
    "signal 2",
    "signal 3"
  ],
  "note": "This is only a probabilistic assessment and is not proof of authorship."
}

Text:
${text}
`;

    const resultText = await generateText(prompt);

    const cleaned = resultText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const result = JSON.parse(cleaned);

    res.json(result);

  } catch (error) {
    console.error("AI detector error:", error);

    res.status(500).json({
      error: "TEXTORA could not analyze the text right now."
    });
  }
});

// ==========================================
// TEXT SUMMARIZER
// ==========================================

app.post("/api/summarize", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        error: "Please enter some text."
      });
    }

    const prompt = `
You are TEXTORA, a professional summarization assistant.

Summarize the following text clearly and accurately.

Rules:
- Preserve the main ideas.
- Preserve important information.
- Do not invent facts.
- Remove unnecessary repetition.
- Make the result significantly shorter.
- Return only the summary.

Text:
${text}
`;

    const result = await generateText(prompt);

    res.json({
      result: result || "No summary was returned."
    });

  } catch (error) {
    console.error("Summarizer error:", error);

    res.status(500).json({
      error: "TEXTORA could not summarize the text right now."
    });
  }
});

// ==========================================
// EMAIL WRITER
// ==========================================

app.post("/api/email", async (req, res) => {
  try {
    const {
      topic,
      details = "",
      emailType = "Professional",
      length = "Medium"
    } = req.body;

    if (!topic || !topic.trim()) {
      return res.status(400).json({
        error: "Please enter what the email is about."
      });
    }

    const prompt = `
You are TEXTORA, a professional email writing assistant.

Write a clear and professional email.

Email purpose:
${topic}

Email style:
${emailType}

Length:
${length}

Additional details:
${details || "None"}

Rules:
- Create an appropriate subject line.
- Write a natural greeting.
- Clearly communicate the purpose.
- Use professional language.
- Include a suitable closing.
- Do not invent information.
- Return only the finished email.

Format:

Subject: [subject]

[Email body]
`;

    const result = await generateText(prompt);

    res.json({
      result: result || "No email was returned."
    });

  } catch (error) {
    console.error("Email writer error:", error);

    res.status(500).json({
      error: "TEXTORA could not write the email right now."
    });
  }
});

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {
  console.log(
    `🚀 TEXTORA backend running on port ${PORT}`
  );
});