const API_URL = "https://textora-backend-th7s.onrender.com";

const tests = [
  {
    name: "Paraphraser",
    endpoint: "/api/paraphrase",
    body: {
      text: "Artificial intelligence is changing the way students learn.",
      style: "Standard"
    }
  },
  {
    name: "Humanizer",
    endpoint: "/api/humanize",
    body: {
      text: "Artificial intelligence is transforming education.",
      style: "Natural"
    }
  },
  {
    name: "Grammar Checker",
    endpoint: "/api/grammar",
    body: {
      text: "Artificial intelligence are changing education."
    }
  },
  {
    name: "AI Detector",
    endpoint: "/api/detect-ai",
    body: {
      text: "Artificial intelligence is transforming education and changing how students learn."
    }
  },
  {
    name: "Summarizer",
    endpoint: "/api/summarize",
    body: {
      text: "Artificial intelligence is transforming education. It helps students learn faster, organize information, understand difficult concepts, and improve their productivity."
    }
  },
  {
    name: "Email Writer",
    endpoint: "/api/email",
    body: {
      topic: "Request for a meeting",
      details: "I would like to discuss the project.",
      emailType: "Professional",
      length: "Medium"
    }
  },
  {
    name: "Essay Writer",
    endpoint: "/api/essay",
    body: {
      topic: "The importance of technology in education",
      instructions: "Write a simple essay.",
      essayType: "Argumentative",
      level: "School"
    }
  }
];

async function testTool(test) {
  console.log(`\nTesting ${test.name}...`);

  try {
    const response = await fetch(
      API_URL + test.endpoint,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(test.body)
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.log(`❌ ${test.name}: FAILED`);
      console.log("Status:", response.status);
      console.log("Error:", data.error || data);
      return;
    }

    console.log(`✅ ${test.name}: WORKING`);

    if (test.name === "AI Detector") {
      console.log("Assessment:", data.assessment);
      console.log("Confidence:", data.confidence);
    } else {
      console.log(
        "Result:",
        data.result
          ? data.result.substring(0, 250)
          : "No result returned."
      );
    }

  } catch (error) {
    console.log(`❌ ${test.name}: FAILED`);
    console.log("Error:", error.message);
  }
}

async function runTests() {
  console.log("================================");
  console.log("TEXTORA LIVE BACKEND TEST");
  console.log("================================");
  console.log("Backend:", API_URL);

  for (const test of tests) {
    await testTool(test);
  }

  console.log("\n================================");
  console.log("TEXTORA TOOL TEST COMPLETE");
  console.log("================================");
}

runTests();