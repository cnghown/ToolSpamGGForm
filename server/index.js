const express = require("express");
const cors = require("cors");
const path = require("path");
const { fetchRawFormData } = require("./form-parser");
const { normalizeFormData } = require("./question-normalizer");
const { generateResponses } = require("./answer-generator");
const { submitSingleResponse } = require("./response-runner");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "50mb" }));

// Active test cancellation tokens map
const activeTests = new Map();

/**
 * Endpoint: Parse & Load Google Form
 */
app.post("/api/load-form", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, error: "Please provide a valid Google Form URL." });
    }

    const { cleanUrl, fbzx, fbPublicLoadData } = await fetchRawFormData(url);
    const formData = normalizeFormData(fbPublicLoadData);

    return res.json({
      success: true,
      formUrl: cleanUrl,
      fbzx,
      form: formData
    });
  } catch (err) {
    console.error("Load Form Error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Endpoint: Generate Data Preview
 */
app.post("/api/generate-preview", (req, res) => {
  try {
    const { questions, configs, count = 10 } = req.body;
    if (!questions || !Array.isArray(questions)) {
      return res.status(400).json({ success: false, error: "Invalid questions list." });
    }

    const previewData = generateResponses(questions, configs || {}, Math.min(100, Math.max(1, count)));
    return res.json({ success: true, responses: previewData });
  } catch (err) {
    console.error("Preview Error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Endpoint: SSE Stream for Running Test
 */
app.get("/api/stream-test", async (req, res) => {
  const testId = req.query.testId;
  if (!testId || !activeTests.has(testId)) {
    return res.status(400).send("Invalid or missing testId");
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const testParams = activeTests.get(testId);
  const { formUrl, fbzx, questions, configs, totalResponses, delaySeconds, fillOutWithEmail } = testParams;

  let isCancelled = false;
  testParams.cancel = () => { isCancelled = true; };

  const sendEvent = (eventData) => {
    res.write(`data: ${JSON.stringify(eventData)}\n\n`);
  };

  try {
    // 1. Generate all responses upfront
    sendEvent({ type: "init", message: "Generating test dataset...", total: totalResponses });
    const generatedResponses = generateResponses(questions, configs, totalResponses);

    let successCount = 0;
    let failedCount = 0;
    const statistics = {
      total: totalResponses,
      success: 0,
      failed: 0,
      distributions: {}, // question.id -> { optionStr: count }
      usedSequential: {} // question.id -> array of values
    };

    // Initialize statistics trackers
    questions.forEach(q => {
      statistics.distributions[q.id] = {};
      statistics.usedSequential[q.id] = [];
    });

    sendEvent({ type: "start", message: "Starting form test execution...", total: totalResponses });

    for (let i = 0; i < totalResponses; i++) {
      if (isCancelled) {
        sendEvent({ type: "log", level: "warning", message: `Test stopped by user at response #${i + 1}.` });
        break;
      }

      const respItem = generatedResponses[i];
      const nowTime = new Date().toLocaleTimeString("vi-VN", { hour12: false });
      sendEvent({
        type: "progress",
        current: i + 1,
        total: totalResponses,
        success: successCount,
        failed: failedCount,
        log: `[${nowTime}] Processing Response #${i + 1}...`
      });

      try {
        await submitSingleResponse(formUrl, fbzx, respItem, fillOutWithEmail);
        successCount++;

        // Track stats
        questions.forEach(q => {
          const dispVal = respItem.displayValues[q.id];
          if (dispVal) {
            if (["multiple_choice", "dropdown", "linear_scale", "rating"].includes(q.type)) {
              statistics.distributions[q.id][dispVal] = (statistics.distributions[q.id][dispVal] || 0) + 1;
            } else if (q.type === "checkbox") {
              const opts = dispVal.split(", ");
              opts.forEach(opt => {
                statistics.distributions[q.id][opt] = (statistics.distributions[q.id][opt] || 0) + 1;
              });
            } else if (["short_answer", "paragraph"].includes(q.type)) {
              statistics.usedSequential[q.id].push(dispVal);
            }
          }
        });

        sendEvent({
          type: "log",
          level: "success",
          message: `[${nowTime}] Response #${i + 1} → Success`
        });
      } catch (err) {
        failedCount++;
        const isRateLimit = err.message.includes("429");
        sendEvent({
          type: "log",
          level: "error",
          message: `[${nowTime}] [ERROR] Response #${i + 1} failed: ${err.message}`
        });

        if (isRateLimit) {
          sendEvent({
            type: "log",
            level: "error",
            message: `[${nowTime}] Rate-limit detected (HTTP 429). Pausing test to prevent account restrictions.`
          });
          break; // Backoff and stop on rate limit per requirement
        }
      }

      sendEvent({
        type: "progress",
        current: i + 1,
        total: totalResponses,
        success: successCount,
        failed: failedCount
      });

      // Delay between requests
      if (i < totalResponses - 1 && delaySeconds > 0 && !isCancelled) {
        await new Promise(r => setTimeout(r, delaySeconds * 1000));
      }
    }

    statistics.success = successCount;
    statistics.failed = failedCount;

    sendEvent({
      type: "complete",
      message: "Test Execution Completed",
      statistics,
      responses: generatedResponses
    });
  } catch (globalErr) {
    sendEvent({ type: "log", level: "error", message: `Execution error: ${globalErr.message}` });
  } finally {
    activeTests.delete(testId);
    res.end();
  }
});

/**
 * Endpoint: Register a Test Run ID
 */
app.post("/api/prepare-test", (req, res) => {
  const testId = "test_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);
  activeTests.set(testId, req.body);
  return res.json({ success: true, testId });
});

/**
 * Endpoint: Stop Active Test Run
 */
app.post("/api/stop-test", (req, res) => {
  const { testId } = req.body;
  if (testId && activeTests.has(testId)) {
    const test = activeTests.get(testId);
    if (test.cancel) test.cancel();
    return res.json({ success: true, message: "Stop signal sent." });
  }
  return res.json({ success: false, message: "Test not found or already completed." });
});

// Serve static frontend assets if production build exists
const buildPath = path.join(__dirname, "../dist");
app.use(express.static(buildPath));
app.get("*", (req, res) => {
  if (req.path.startsWith("/api")) return res.status(404).json({ error: "API endpoint not found" });
  res.sendFile(path.join(buildPath, "index.html"), (err) => {
    if (err) res.status(200).send("Backend server is running on port " + PORT + ". Start Vite dev server for Web UI.");
  });
});

app.listen(PORT, () => {
  console.log(`[Google Form QA Tool] Server running on http://localhost:${PORT}`);
});
