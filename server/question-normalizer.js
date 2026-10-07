/**
 * Converts raw FB_PUBLIC_LOAD_DATA into a clean, normalized Form Metadata structure.
 * @param {Array} fbPublicLoadData 
 * @returns {Object} normalizedForm
 */
function normalizeFormData(fbPublicLoadData) {
  if (!fbPublicLoadData || !fbPublicLoadData[1]) {
    throw new Error("Invalid FB_PUBLIC_LOAD_DATA format.");
  }

  const formMeta = fbPublicLoadData[1];
  const title = formMeta[8] || "Google Form";
  
  // Extract real form description string (avoiding internal numeric IDs like 73)
  let description = "";
  if (typeof formMeta[0] === "string" && isNaN(formMeta[0])) {
    description = formMeta[0];
  } else if (typeof formMeta[9] === "string" && isNaN(formMeta[9])) {
    description = formMeta[9];
  }

  // Check if form collects email address
  const fillOutWithEmail = formMeta[10] && formMeta[10][6] === 3;
  
  const rawQuestions = formMeta[1] || [];
  const questions = [];

  for (let idx = 0; idx < rawQuestions.length; idx++) {
    const q = rawQuestions[idx];
    const qId = q[0];
    const qTitle = q[1] || `Question ${idx + 1}`;
    const qDesc = q[2] || "";
    const qTypeNum = q[3];

    // Section Headers (type 8) or Media (type 11) don't have entry IDs
    if ([6, 8, 11].includes(qTypeNum)) {
      continue;
    }

    const payload = q[4] && q[4][0];
    if (!payload && qTypeNum !== 8) {
      continue;
    }

    const entryId = payload ? payload[0] : null;
    const isRequired = payload && payload[2] === 1;

    let typeStr = "unknown";
    let options = [];
    let scaleInfo = null;
    let hasTime = false;

    switch (qTypeNum) {
      case 0:
        typeStr = "short_answer";
        break;
      case 1:
        typeStr = "paragraph";
        break;
      case 2:
        typeStr = "multiple_choice";
        if (payload && payload[1]) {
          options = payload[1].map(opt => opt[0]).filter(Boolean);
        }
        break;
      case 3:
        typeStr = "dropdown";
        if (payload && payload[1]) {
          options = payload[1].map(opt => opt[0]).filter(Boolean);
        }
        break;
      case 4:
        typeStr = "checkbox";
        if (payload && payload[1]) {
          options = payload[1].map(opt => opt[0]).filter(Boolean);
        }
        break;
      case 5:
        typeStr = "linear_scale";
        // Linear scale choices or min/max bounds
        if (payload) {
          if (payload[1]) {
            options = payload[1].map(opt => opt[0]).filter(Boolean);
          }
          if (payload[3]) {
            scaleInfo = {
              min: payload[3][0] !== undefined ? payload[3][0] : 1,
              max: payload[3][1] !== undefined ? payload[3][1] : 5,
              minLabel: payload[3][2] || "",
              maxLabel: payload[3][3] || ""
            };
          }
        }
        if (options.length === 0 && scaleInfo) {
          for (let i = scaleInfo.min; i <= scaleInfo.max; i++) {
            options.push(String(i));
          }
        }
        break;
      case 9:
        typeStr = "date";
        if (payload && payload[7] && payload[7][0] === 1) {
          hasTime = true;
        }
        break;
      case 10:
        typeStr = "time";
        break;
      case 13:
        typeStr = "file_upload";
        break;
      case 18:
        typeStr = "rating";
        if (payload && payload[1]) {
          options = payload[1].map(opt => opt[0]).filter(Boolean);
        } else {
          options = ["1", "2", "3", "4", "5"];
        }
        break;
      default:
        typeStr = "unknown";
        if (payload && payload[1]) {
          options = payload[1].map(opt => opt[0]).filter(Boolean);
        }
        break;
    }

    questions.push({
      id: `q_${qId}_${idx}`,
      rawId: qId,
      entryId: entryId ? String(entryId) : null,
      title: qTitle,
      description: qDesc,
      typeNum: qTypeNum,
      type: typeStr,
      required: isRequired,
      options,
      scaleInfo,
      hasTime
    });
  }

  return {
    title,
    description,
    fillOutWithEmail,
    totalQuestions: questions.length,
    questions
  };
}

module.exports = {
  normalizeFormData
};
