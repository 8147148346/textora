const input = document.getElementById("input");
const count = document.getElementById("count");
const result = document.getElementById("result");
const run = document.getElementById("run");
const copy = document.getElementById("copy");
const download = document.getElementById("download");
const style = document.getElementById("style");
const topic = document.getElementById("topic");

const toolType = document.body.dataset.tool;

// ==========================================
// CHARACTER COUNTER
// ==========================================

if (input && count) {
  input.addEventListener("input", () => {
    count.textContent =
      `${input.value.length.toLocaleString()} characters`;
  });
}

// ==========================================
// MAIN TOOL BUTTON
// ==========================================

if (run) {
  run.addEventListener("click", async () => {

    const text = input ? input.value.trim() : "";
    const topicText = topic ? topic.value.trim() : "";

    // ========================================
    // VALIDATION
    // ========================================

    if (toolType === "essay") {

      if (!topicText) {
        result.textContent = "Please enter an essay topic.";
        return;
      }

    } else if (toolType === "email") {

      if (!topicText) {
        result.textContent =
          "Please enter what the email is about.";
        return;
      }

    } else {

      if (!text) {
        result.textContent =
          "Please enter some text first.";
        return;
      }

    }

    const originalButtonText = run.textContent;

    run.disabled = true;

    // ========================================
    // BUTTON LOADING TEXT
    // ========================================

    if (toolType === "humanizer") {
      run.textContent = "Improving...";
    } else if (toolType === "grammar") {
      run.textContent = "Checking...";
    } else if (toolType === "essay") {
      run.textContent = "Creating...";
    } else if (toolType === "summarizer") {
      run.textContent = "Summarizing...";
    } else if (toolType === "detector") {
      run.textContent = "Analyzing...";
    } else if (toolType === "email") {
      run.textContent = "Writing...";
    } else {
      run.textContent = "Paraphrasing...";
    }

    result.textContent =
      "TEXTORA is processing your request...";

    try {

      // ========================================
      // PARAPHRASER
      // ========================================

      if (toolType === "paraphraser") {

        const response = await fetch(
          "http://localhost:3000/api/paraphrase",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              text: text,
              style: style ? style.value : "Standard"
            })
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Paraphraser request failed."
          );
        }

        result.textContent =
          data.result || "No result was returned.";

        return;
      }

      // ========================================
      // AI HUMANIZER
      // ========================================

      if (toolType === "humanizer") {

        const response = await fetch(
          "http://localhost:3000/api/humanize",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              text: text,
              style: style ? style.value : "Natural"
            })
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Humanizer request failed."
          );
        }

        result.textContent =
          data.result || "No result was returned.";

        return;
      }

      // ========================================
      // GRAMMAR CHECKER
      // ========================================

      if (toolType === "grammar") {

        const response = await fetch(
          "http://localhost:3000/api/grammar",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              text: text
            })
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Grammar request failed."
          );
        }

        result.textContent =
          data.result || "No result was returned.";

        return;
      }

      // ========================================
      // AI CONTENT DETECTOR
      // ========================================

      if (toolType === "detector") {

        const response = await fetch(
          "http://localhost:3000/api/detect-ai",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              text: text
            })
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "AI detector request failed."
          );
        }

        const signals = Array.isArray(data.signals)
          ? data.signals
          : [];

        result.textContent =
          `Assessment: ${data.assessment || "Unknown"}\n\n` +
          `Confidence: ${data.confidence || "Unknown"}\n\n` +
          `Signals:\n` +
          `${signals.length
            ? signals.map(signal => `- ${signal}`).join("\n")
            : "- No signals returned."
          }\n\n` +
          `${data.note || ""}`;

        return;
      }

      // ========================================
      // TEXT SUMMARIZER
      // ========================================

      if (toolType === "summarizer") {

        const response = await fetch(
          "http://localhost:3000/api/summarize",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              text: text
            })
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Summarizer request failed."
          );
        }

        result.textContent =
          data.result || "No summary was returned.";

        return;
      }

      // ========================================
      // AI EMAIL WRITER
      // ========================================

      if (toolType === "email") {

        const emailTopic =
          document.getElementById("topic")?.value.trim();

        const emailType =
          document.getElementById("emailType")?.value ||
          "Professional";

        const emailLength =
          document.getElementById("level")?.value ||
          "Medium";

        if (!emailTopic) {
          result.textContent =
            "Please enter what the email is about.";
          return;
        }

        const response = await fetch(
          "http://localhost:3000/api/email",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              topic: emailTopic,
              details: text,
              emailType: emailType,
              length: emailLength
            })
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Email Writer request failed."
          );
        }

        result.textContent =
          data.result || "No email was returned.";

        return;
      }

      // ========================================
      // ESSAY WRITER
      // ========================================

      if (toolType === "essay") {

        const selects =
          document.querySelectorAll("select");

        const essayType =
          selects[0]
            ? selects[0].value
            : "Argumentative";

        const level =
          selects[1]
            ? selects[1].value
            : "School";

        const response = await fetch(
          "http://localhost:3000/api/essay",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              topic: topicText,
              instructions: text,
              essayType: essayType,
              level: level
            })
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Essay request failed."
          );
        }

        result.textContent =
          data.result || "No essay was returned.";

        return;
      }

      // ========================================
      // UNKNOWN TOOL
      // ========================================

      result.textContent =
        "This TEXTORA tool is not connected yet.";

    } catch (error) {

      console.error("TEXTORA error:", error);

      result.textContent =
        "TEXTORA could not process your request. " +
        "Make sure the backend is running.";

    } finally {

      run.disabled = false;
      run.textContent = originalButtonText;

    }

  });
}

// ==========================================
// COPY RESULT
// ==========================================

if (copy) {

  copy.addEventListener("click", async () => {

    try {

      await navigator.clipboard.writeText(
        result.innerText
      );

      copy.textContent = "Copied!";

      setTimeout(() => {
        copy.textContent = "Copy";
      }, 1200);

    } catch (error) {

      alert(
        "Copy is not available in this browser."
      );

    }

  });

}

// ==========================================
// DOWNLOAD RESULT
// ==========================================

if (download) {

  download.addEventListener("click", () => {

    const blob = new Blob(
      [result.innerText],
      {
        type: "text/plain"
      }
    );

    const a = document.createElement("a");

    a.href = URL.createObjectURL(blob);

    a.download = "textora-result.txt";

    a.click();

    URL.revokeObjectURL(a.href);

  });

}