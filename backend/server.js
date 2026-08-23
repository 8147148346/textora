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

// Try models in order
const MODELS = [
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash"
];

// ==========================================
// GEMINI HELPER
// ==========================================

async function generateText(prompt) {
  let lastError;

  for (const model of MODELS) {

    for (let attempt = 1; attempt <= 3; attempt++) {

      try {

        console.log(
          `🤖 Trying ${model} - attempt ${attempt}/3`
        );

        const response = await ai.models.generateContent({
          model: model,
          contents: prompt
        });

        const text = response?.text || "";

        if (text.trim()) {
          console.log(`✅ Gemini response from ${model}`);
          return text;
        }

        throw new Error("Gemini returned an empty response.");

      } catch (error) {

        lastError = error;

        const status = Number(
          error?.status ||
          error?.code ||
          0
        );

        console.error(
          `❌ ${model} attempt ${attempt}:`,
          error?.message || error
        );

        const temporaryError =
          status === 429 ||
          status === 500 ||
          status === 502 ||
          status === 503 ||
          status === 504;

        // For permanent errors, immediately try next model
        if (!temporaryError) {
          break;
        }

        // Retry temporary errors
        if (attempt < 3) {

          const waitTime = attempt * 3000;

          console.log(
            `⏳ Waiting ${waitTime / 1000}s before retry...`
          );

          await new Promise(resolve =>
            setTimeout(resolve, waitTime)
          );
        }
      }
    }

    console.log(
      `➡️ Moving to next Gemini model...`
    );
  }

  throw lastError || new Error(
    "All Gemini models failed."
  );
}

// ==========================================
// HEALTH CHECK
// ==========================================

app.get("/api/health", (req, res) => {

  res.json({
    ok: true,
    message: "TEXTORA backend is running",
    models: MODELS
  });

});

// ==========================================
// PARAPHRASER
// ==========================================

app.post("/api/paraphrase", async (req, res) => {

  try {

    const {
      text,
      style = "Standard"
    } = req.body;

    if (!text || !text.trim()) {

      return res.status(400).json({
        error: "Please enter some text."
      });

    }

    const prompt = `
You are TEXTORA, a professional writing assistant.

Paraphrase the following text while preserving its original meaning.

Writing style:
${style}

Rules:
- Preserve the original meaning.
- Preserve important facts.
- Do not invent facts.
- Improve clarity and natural flow.
- Keep the writing readable.
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

    console.error(
      "❌ Paraphraser error:",
      error
    );

    res.status(500).json({
      error:
        "TEXTORA could not paraphrase the text right now."
    });

  }

});

// ==========================================
// AI HUMANIZER
// ==========================================

app.post("/api/humanize", async (req, res) => {

  try {

    const {
      text,
      style = "Natural"
    } = req.body;

    if (!text || !text.trim()) {

      return res.status(400).json({
        error: "Please enter some text."
      });

    }

    const prompt = `
You are TEXTORA, a professional writing assistant.

Improve the following text so it sounds natural, clear and readable.

Writing style:
${style}

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

    console.error(
      "❌ Humanizer error:",
      error
    );

    res.status(500).json({
      error:
        "TEXTORA could not improve the text right now."
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

    console.error(
      "❌ Grammar error:",
      error
    );

    res.status(500).json({
      error:
        "TEXTORA could not check the grammar right now."
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

    console.error(
      "❌ Essay error:",
      error
    );

    res.status(500).json({
      error:
        "TEXTORA could not create the essay right now."
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

Important:
- This is only a probabilistic assessment.
- Do not claim certainty.
- Do not accuse the writer.
- Do not identify the author.

Return ONLY valid JSON.

Use exactly this structure:

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

    const resultText =
      await generateText(prompt);

    const cleaned =
      resultText
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

    const result =
      JSON.parse(cleaned);

    res.json(result);

  } catch (error) {

    console.error(
      "❌ AI detector error:",
      error
    );

    res.status(500).json({
      error:
        "TEXTORA could not analyze the text right now."
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
- Use clear and natural language.
- Return only the summary.
- Do not explain the process.

Text:
${text}
`;

    const result =
      await generateText(prompt);

    res.json({
      result:
        result || "No summary was returned."
    });

  } catch (error) {

    console.error(
      "❌ Summarizer error:",
      error
    );

    res.status(500).json({
      error:
        "TEXTORA could not summarize the text right now."
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
        error:
          "Please enter what the email is about."
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

    const result =
      await generateText(prompt);

    res.json({
      result:
        result || "No email was returned."
    });

  } catch (error) {

    console.error(
      "❌ Email writer error:",
      error
    );

    res.status(500).json({
      error:
        "TEXTORA could not write the email right now."
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