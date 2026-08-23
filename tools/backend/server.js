const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { GoogleGenAI } = require("@google/genai");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY is missing from .env");
  process.exit(1);
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    message: "TEXTORA backend is running",
  });
});

// ===============================
// PARAPHRASER
// ===============================
app.post("/api/paraphrase", async (req, res) => {
  try {
    const { text, style = "Standard" } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        error: "Please enter some text.",
      });
    }

    const prompt = `
You are TEXTORA, a professional writing assistant.

Paraphrase the following text while preserving its original meaning.

Writing style: ${style}

Rules:
- Preserve the meaning and important facts.
- Do not invent facts.
- Improve clarity, grammar, and natural flow.
- Return only the paraphrased text.
- Do not explain your changes.

Text:
${text}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    res.json({
      result: response.text,
    });
  } catch (error) {
    console.error("Gemini paraphrase error:", error);

    res.status(500).json({
      error: "TEXTORA could not process your request right now.",
    });
  }
});

// ===============================
// GRAMMAR CHECKER
// ===============================
app.post("/api/grammar", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        error: "Please enter some text.",
      });
    }

    const prompt = `
You are TEXTORA, a professional grammar and writing assistant.

Correct genuine grammar, spelling, punctuation, and clarity problems.

Rules:
- Preserve the original meaning.
- Do not invent facts.
- Return only the corrected text.
- Do not explain your changes.

Text:
${text}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    res.json({
      result: response.text,
    });
  } catch (error) {
    console.error("Gemini grammar error:", error);

    res.status(500).json({
      error: "TEXTORA could not check your grammar right now.",
    });
  }
});

// ===============================
// HUMANIZER
// ===============================
app.post("/api/humanize", async (req, res) => {
  try {
    const { text, style = "Natural" } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        error: "Please enter some text.",
      });
    }

    const prompt = `
You are TEXTORA, a professional writing assistant.

Improve the following text so it sounds natural, clear, readable, and well-written.

Writing style: ${style}

Rules:
- Preserve the original meaning.
- Do not invent facts.
- Improve sentence flow and readability.
- Avoid unnecessary complexity.
- Return only the improved text.
- Do not explain your changes.

Text:
${text}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    res.json({
      result: response.text,
    });
  } catch (error) {
    console.error("Gemini humanizer error:", error);

    res.status(500).json({
      error: "TEXTORA could not process your request right now.",
    });
  }
});

// ===============================
// ESSAY WRITER
// ===============================
app.post("/api/essay", async (req, res) => {
  try {
    const {
      topic,
      instructions = "",
      essayType = "Argumentative",
      level = "School",
    } = req.body;

    if (!topic || !topic.trim()) {
      return res.status(400).json({
        error: "Please enter an essay topic.",
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
- Create a clear introduction.
- Develop logical body paragraphs.
- Include a strong conclusion.
- Use clear language appropriate for the requested level.
- Maintain logical flow.
- Do not invent specific facts, statistics, or citations.
- Do not claim sources were consulted.
- Return only the essay draft.
- Do not explain your process.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    res.json({
      result: response.text,
    });
  } catch (error) {
    console.error("Gemini essay error:", error);

    res.status(500).json({
      error: "TEXTORA could not create the essay right now.",
    });
  }
});

// ===============================
// START SERVER
// ===============================
// ===============================
// AI CONTENT DETECTOR
// ===============================
app.post("/api/detect-ai", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        error: "Please enter some text.",
      });
    }

    const prompt = `
You are TEXTORA, a writing-analysis assistant.

Analyze the following text for writing characteristics that may be associated
with AI-generated writing.

Important:
- AI detection is probabilistic and cannot reliably prove whether a text was
  written by a human or AI.
- Do not claim certainty.
- Do not identify the author.
- Do not make accusations.
- Give an estimated likelihood only.
- Briefly explain the writing signals you noticed.

Return ONLY valid JSON in this exact format:

{
  "assessment": "Likely AI-like / Mixed signals / Likely human-like",
  "confidence": "Low / Medium / High",
  "signals": [
    "signal 1",
    "signal 2",
    "signal 3"
  ],
  "note": "Short explanation that this is only a probabilistic assessment."
}

Text:
${text}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    let resultText = response.text.trim();

    // Remove accidental markdown code fences
    resultText = resultText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const result = JSON.parse(resultText);

    res.json(result);

  } catch (error) {
    console.error("Gemini AI detector error:", error);

    res.status(500).json({
      error: "TEXTORA could not analyze the text right now.",
    });
  }
});
// ===============================
// AI CONTENT DETECTOR
// ===============================
app.post("/api/detect-ai", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        error: "Please enter some text.",
      });
    }

    const prompt = `
You are TEXTORA, a writing-analysis assistant.

Analyze this text for characteristics that may be associated with
AI-generated writing.

Important:
- This is only a probabilistic assessment.
- Do not claim certainty.
- Do not accuse the writer.
- Do not identify the author.

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

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    let resultText = response.text.trim();

    resultText = resultText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const result = JSON.parse(resultText);

    res.json(result);

  } catch (error) {
    console.error("Gemini AI detector error:", error);

    res.status(500).json({
      error: "TEXTORA could not analyze the text right now.",
    });
  }
});
// ===============================
// TEXT SUMMARIZER
// ===============================
app.post("/api/summarize", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        error: "Please enter some text."
      });
    }

    const prompt = `
You are TEXTORA, a professional text summarization assistant.

Summarize the following text clearly and accurately.

Rules:
- Preserve the main ideas and important information.
- Do not invent facts.
- Remove unnecessary repetition.
- Use clear, natural language.
- Make the summary significantly shorter than the original.
- Return only the summary.
- Do not explain your process.

Text:
${text}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt
    });

    res.json({
      result: response.text
    });

  } catch (error) {
    console.error("Gemini summarizer error:", error);

    res.status(500).json({
      error: "TEXTORA could not summarize the text right now."
    });
  }
});
app.listen(PORT, () => {
  console.log(`🚀 TEXTORA backend running at http://localhost:${PORT}`);
});