const { getViewUrl, fetchRawFormData } = require("../server/form-parser");
const { getSubmitUrl, submitSingleResponse } = require("../server/response-runner");

console.log("Test View URL:", getViewUrl("https://docs.google.com/forms/d/e/1FAIpQLSc_EXAMPLE/viewform?usp=sf_link"));
console.log("Test Submit URL:", getSubmitUrl("https://docs.google.com/forms/d/e/1FAIpQLSc_EXAMPLE/viewform?usp=sf_link"));
console.log("Test Short URL:", getSubmitUrl("https://forms.gle/abc123xyz"));
