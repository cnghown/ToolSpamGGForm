const fetch = require("node-fetch");

/**
 * Normalizes Google Form URL for submission (/formResponse)
 */
function getSubmitUrl(rawUrl) {
  if (!rawUrl) return "";
  let url = rawUrl.trim();
  const base = url.split("?")[0].split("#")[0].replace(/\/+$/, "");
  
  if (base.endsWith("/viewform") || base.endsWith("/formResponse")) {
    return base.replace(/\/(viewform|formResponse)$/, "/formResponse");
  }
  return `${base}/formResponse`;
}

/**
 * Submits a single response to Google Forms endpoint
 */
async function submitSingleResponse(formUrl, fbzx, responseItem, fillOutWithEmail = false) {
  const submitUrl = getSubmitUrl(formUrl);
  const formBody = [];

  Object.values(responseItem.entries).forEach(entry => {
    if (!entry.entryId) return;

    const entryId = entry.entryId;
    const val = entry.value;

    if (val === null || val === undefined) return;

    if (Array.isArray(val)) {
      // Checkbox multiple choices
      val.forEach(opt => {
        formBody.push(`entry.${entryId}=${encodeURIComponent(opt)}`);
      });
    } else if (typeof val === "object") {
      // Date or Time object
      if (val.year !== undefined) formBody.push(`entry.${entryId}_year=${encodeURIComponent(val.year)}`);
      if (val.month !== undefined) formBody.push(`entry.${entryId}_month=${encodeURIComponent(val.month)}`);
      if (val.day !== undefined) formBody.push(`entry.${entryId}_day=${encodeURIComponent(val.day)}`);
      if (val.hour !== undefined) formBody.push(`entry.${entryId}_hour=${encodeURIComponent(val.hour)}`);
      if (val.minute !== undefined) formBody.push(`entry.${entryId}_minute=${encodeURIComponent(val.minute)}`);
    } else {
      // String / Number value
      formBody.push(`entry.${entryId}=${encodeURIComponent(String(val))}`);
    }
  });

  if (fillOutWithEmail) {
    formBody.push(`emailAddress=${encodeURIComponent("test_qa_user@example.com")}`);
  }

  formBody.push(`fvv=1`);
  if (fbzx) {
    formBody.push(`partialResponse=%5Bnull%2Cnull%2C%22${encodeURIComponent(fbzx)}%22%5D`);
    formBody.push(`fbzx=${encodeURIComponent(fbzx)}`);
  } else {
    formBody.push(`partialResponse=%5Bnull%2Cnull%2Cnull%5D`);
  }
  formBody.push(`pageHistory=0`);
  formBody.push(`submissionTimestamp=${Date.now()}`);

  const bodyStr = formBody.join("&");

  const response = await fetch(submitUrl, {
    method: "POST",
    redirect: "manual",
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Referer": submitUrl.replace("/formResponse", "/viewform")
    },
    body: bodyStr
  });

  if (response.status === 429) {
    throw new Error("HTTP 429: Rate limited by Google Forms.");
  }

  // 200 (OK), 302 (Found redirect), 303 (See Other) are all valid successful form submissions
  if (response.status !== 200 && response.status !== 302 && response.status !== 303) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return { success: true, status: response.status };
}

module.exports = {
  submitSingleResponse,
  getSubmitUrl
};
