// ==========================================
// TEXTORA - TOOL.JS
// Syntax-safe production version
// ==========================================

const API_URL = "https://textora-backend-th7s.onrender.com";

// Wake up the backend as soon as the page loads (Render free tier sleeps
// after inactivity). This runs in the background so by the time the user
// clicks Run, the server has a head start on waking up.
fetch(API_URL, { method: "GET" }).catch(function () {});

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
  input.addEventListener("input", function () {
    count.textContent =
      input.value.length.toLocaleString() + " characters";
  });
}

// ==========================================
// API HELPER
// ==========================================

async function callAPI(endpoint, body) {
  const response = await fetch(
    API_URL + endpoint,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    }
  );

  let data;

  try {
    data = await response.json();
  } catch (error) {
    throw new Error(
      "Server returned an invalid response (" +
      response.status +
      ")."
    );
  }

  if (!response.ok) {
    throw new Error(
      data.error ||
      "Request failed (" +
      response.status +
      ")."
    );
  }

  return data;
}

// ==========================================
// SMART LOADING SYSTEM
// ==========================================

function startSmartLoading() {

  const messages = [
    {
      delay: 0,
      text: "Connecting to TEXTORA..."
    },
    {
      delay: 5000,
      text: "TEXTORA is thinking..."
    },
    {
      delay: 15000,
      text: "Almost ready..."
    },
    {
      delay: 25000,
      text: "Finishing your result..."
    },
    {
      delay: 40000,
      text: "TEXTORA is still working..."
    }
  ];

  const timers = messages.map(function (message) {

    return setTimeout(function () {

      if (run && run.disabled && result) {
        result.textContent = message.text;
      }

    }, message.delay);

  });

  return timers;
}

function stopSmartLoading(timers) {

  timers.forEach(function (timer) {
    clearTimeout(timer);
  });

}

// ==========================================
// MAIN TOOL BUTTON
// ==========================================

if (run) {

  run.addEventListener("click", async function () {

    const text =
      input ? input.value.trim() : "";

    const topicText =
      topic ? topic.value.trim() : "";

    // ========================================
    // VALIDATION
    // ========================================

    if (toolType === "essay") {

      if (!topicText) {
        result.textContent =
          "Please enter an essay topic.";
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

    const originalButtonText =
      run.textContent;

    run.disabled = true;

    if (result) {
      result.classList.add("loading");
    }

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

    // ========================================
    // START SMART LOADING
    // ========================================

    const loadingTimers =
      startSmartLoading();

    try {

      // ======================================
      // PARAPHRASER
      // ======================================

      if (toolType === "paraphraser") {

        const data = await callAPI(
          "/api/paraphrase",
          {
            text: text,
            style: style
              ? style.value
              : "Standard"
          }
        );

        result.textContent =
          data.result ||
          "No result was returned.";

        return;
      }

      // ======================================
      // AI HUMANIZER
      // ======================================

      if (toolType === "humanizer") {

        const data = await callAPI(
          "/api/humanize",
          {
            text: text,
            style: style
              ? style.value
              : "Natural"
          }
        );

        result.textContent =
          data.result ||
          "No result was returned.";

        return;
      }

      // ======================================
      // GRAMMAR CHECKER
      // ======================================

      if (toolType === "grammar") {

        const data = await callAPI(
          "/api/grammar",
          {
            text: text
          }
        );

        result.textContent =
          data.result ||
          "No result was returned.";

        return;
      }

      // ======================================
      // AI CONTENT DETECTOR
      // ======================================

      if (toolType === "detector") {

        const data = await callAPI(
          "/api/detect-ai",
          {
            text: text
          }
        );

        const signals =
          Array.isArray(data.signals)
            ? data.signals
            : [];

        let detectorResult =
          "Assessment: " +
          (data.assessment || "Unknown") +
          "\n\n";

        detectorResult +=
          "Confidence: " +
          (data.confidence || "Unknown") +
          "\n\n";

        detectorResult +=
          "Signals:\n";

        if (signals.length) {

          signals.forEach(function (signal) {

            detectorResult +=
              "- " +
              signal +
              "\n";

          });

        } else {

          detectorResult +=
            "- No signals returned.\n";
        }

        detectorResult +=
          "\n" +
          (data.note || "");

        result.textContent =
          detectorResult;

        return;
      }

      // ======================================
      // TEXT SUMMARIZER
      // ======================================

      if (toolType === "summarizer") {

        const data = await callAPI(
          "/api/summarize",
          {
            text: text
          }
        );

        result.textContent =
          data.result ||
          "No summary was returned.";

        return;
      }

      // ======================================
      // AI EMAIL WRITER
      // ======================================

      if (toolType === "email") {

        const emailTopicElement =
          document.getElementById("topic");

        const emailTypeElement =
          document.getElementById("emailType");

        const emailLengthElement =
          document.getElementById("level");

        const emailTopic =
          emailTopicElement
            ? emailTopicElement.value.trim()
            : "";

        const emailType =
          emailTypeElement
            ? emailTypeElement.value
            : "Professional";

        const emailLength =
          emailLengthElement
            ? emailLengthElement.value
            : "Medium";

        if (!emailTopic) {

          result.textContent =
            "Please enter what the email is about.";

          return;
        }

        const data = await callAPI(
          "/api/email",
          {
            topic: emailTopic,
            details: text,
            emailType: emailType,
            length: emailLength
          }
        );

        result.textContent =
          data.result ||
          "No email was returned.";

        return;
      }

      // ======================================
      // ESSAY WRITER
      // ======================================

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

        const data = await callAPI(
          "/api/essay",
          {
            topic: topicText,
            instructions: text,
            essayType: essayType,
            level: level
          }
        );

        result.textContent =
          data.result ||
          "No essay was returned.";

        return;
      }

      // ======================================
      // UNKNOWN TOOL
      // ======================================

      result.textContent =
        "This TEXTORA tool is not connected yet.";

    } catch (error) {

      console.error(
        "TEXTORA error:",
        error
      );

      result.textContent =
        "TEXTORA could not process your request.\n\n" +
        error.message;

    } finally {

      stopSmartLoading(
        loadingTimers
      );

      if (result) {
        result.classList.remove("loading");
      }

      run.disabled = false;

      run.textContent =
        originalButtonText;
    }

  });
}

// ==========================================
// COPY RESULT
// ==========================================

if (copy) {

  copy.addEventListener(
    "click",
    async function () {

      try {

        await navigator.clipboard.writeText(
          result.innerText
        );

        copy.textContent =
          "Copied!";

        setTimeout(function () {

          copy.textContent =
            "Copy";

        }, 1200);

      } catch (error) {

        alert(
          "Copy is not available in this browser."
        );
      }

    }
  );
}

// ==========================================
// DOWNLOAD RESULT
// ==========================================

if (download) {

  download.addEventListener(
    "click",
    function () {

      const text =
        result.innerText.trim();

      if (!text) {

        alert(
          "There is no result to download."
        );

        return;
      }

      const blob =
        new Blob(
          [text],
          {
            type:
              "text/plain;charset=utf-8"
          }
        );

      const url =
        URL.createObjectURL(blob);

      const a =
        document.createElement("a");

      a.href = url;

      a.download =
        "textora-result.txt";

      document.body.appendChild(a);

      a.click();

      a.remove();

      URL.revokeObjectURL(url);
    }
  );
}