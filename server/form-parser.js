const fetch = require("node-fetch");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

/**
 * Normalizes Google Form URL for loading form page (/viewform)
 */
function getViewUrl(rawUrl) {
  if (!rawUrl) return "";
  let url = rawUrl.trim();
  const base = url.split("?")[0].split("#")[0].replace(/\/+$/, "");

  if (base.endsWith("/viewform") || base.endsWith("/formResponse")) {
    return base.replace(/\/(viewform|formResponse)$/, "/viewform");
  }
  return `${base}/viewform`;
}

/**
 * Extracts raw FB_PUBLIC_LOAD_DATA and fbzx token from Google Form URL
 * @param {string} formUrl 
 */
async function fetchRawFormData(formUrl) {
  try {
    let inputUrl = formUrl.trim();

    const response = await fetch(inputUrl, {
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}: Unable to fetch Google Form page.`);
    }

    // Use actual resolved URL after redirects (e.g. from forms.gle short links)
    const resolvedUrl = response.url || inputUrl;
    const cleanUrl = getViewUrl(resolvedUrl);

    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    const scripts = Array.from(document.querySelectorAll("script"));
    let fbPublicLoadData = null;
    let fbzx = null;

    for (let script of scripts) {
      const content = script.textContent || "";
      if (content.includes("FB_PUBLIC_LOAD_DATA_")) {
        const match = content.match(/FB_PUBLIC_LOAD_DATA_\s*=\s*(\[.*?\]);/s);
        if (match && match[1]) {
          fbPublicLoadData = JSON.parse(match[1]);
          break;
        }
      }
    }

    const formElement = document.querySelector("form[data-shuffle-seed]");
    if (formElement) {
      fbzx = formElement.getAttribute("data-shuffle-seed");
    }

    if (!fbzx) {
      const fbzxMatch = html.match(/name="fbzx"\s+value="(-?\d+)"/);
      if (fbzxMatch) fbzx = fbzxMatch[1];
    }

    if (!fbPublicLoadData) {
      throw new Error("Could not extract FB_PUBLIC_LOAD_DATA from Google Form. Please ensure the form is public and the link is correct.");
    }

    return {
      cleanUrl,
      fbzx: fbzx || "",
      fbPublicLoadData
    };
  } catch (err) {
    throw new Error(`Failed to parse Google Form: ${err.message}`);
  }
}

module.exports = {
  fetchRawFormData,
  getViewUrl
};
