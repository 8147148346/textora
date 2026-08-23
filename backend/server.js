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

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    message: "TEXTORA backend is running",
  });
});

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
- Do not add facts that are not present.
- Improve clarity, grammar, and natural flow.
- Return only the paraphrased text.
- Do not explain what you changed.

Text:
${text}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
    });

    const result = response.text;

    res.json({
      result,
    });
  } catch (error) {
    console.error("Gemini error:", error);

    res.status(500).json({
      error: "TEXTORA could not process your request right now.",
    });
  }
});

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
- Keep the writing natural.
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

Check the following text for:
- Grammar mistakes
- Spelling mistakes
- Punctuation mistakes
- Sentence clarity
- Awkward wording

Rules:
- Preserve the original meaning.
- Do not invent facts.
- Correct only genuine problems.
- Make the writing clear and natural.
- Return only the corrected text.
- Do not explain your changes.
- Do not add unnecessary information.

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
- Create a clear introduction.
- Develop logical body paragraphs.
- Include a strong conclusion.
- Use clear language appropriate for the requested level.
- Do not invent facts or citations.
- Return only the essay draft.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt
    });

    res.json({
      result: response.text
    });

  } catch (error) {
    console.error("Gemini essay error:", error);

    res.status(500).json({
      error: "TEXTORA could not create the essay right now."
    });
  }
});
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

Analyze the following text for characteristics that may be associated
with AI-generated writing.

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
      contents: prompt
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
      error: "TEXTORA could not analyze the text right now."
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
// ===============================
// AI EMAIL WRITER
// ===============================
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

Write a clear and professional email based on the information below.

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
- Clearly communicate the purpose of the email.
- Use professional and appropriate language.
- Include a suitable closing.
- Do not invent names, dates, companies, facts, or other details.
- Do not claim information that was not provided.
- Return only the finished email.
- Do not explain your process.

Format:

Subject: [subject]

[Email body]
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt
    });

    res.json({
      result: response.text
    });

  } catch (error) {
    console.error("Gemini email writer error:", error);

    res.status(500).json({
      error: "TEXTORA could not write the email right now."
    });
  }
});
app.listen(PORT, () => {
  console.log(`🚀 TEXTORA backend running at http://localhost:${PORT}`);
});