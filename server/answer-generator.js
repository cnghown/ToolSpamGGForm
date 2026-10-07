const { shuffleArray, pickWeightedRandom, generateExactCountDistribution } = require("./distribution-engine");

const SAMPLE_NAMES = [
  "Nguyễn Văn A", "Bùi Công B", "Trần Thị C", "Lê Hoàng D", "Phạm Quốc E",
  "Đặng Thu F", "Vũ Minh G", "Hoàng Anh H", "Đỗ Bảo I", "Ngô Phương K",
  "Lý Gia L", "Dương Tấn M", "Mai Ngọc N", "Huỳnh Đức P", "Phan Thanh Q"
];

const SAMPLE_PARAGRAPHS = [
  "Sản phẩm hoạt động tốt, giao diện trực quan và dễ sử dụng.",
  "Dịch vụ hỗ trợ rất nhiệt tình, phản hồi nhanh chóng.",
  "Cần cải thiện tốc độ xử lý khi lượng dữ liệu lớn.",
  "Tôi rất hài lòng với trải nghiệm hiện tại.",
  "Hệ thống ổn định, đáng tin cậy."
];

/**
 * Generate values for all N responses for all questions
 * @param {Array} questions - Normalized question objects
 * @param {Object} configs - Configuration object mapped by question ID
 * @param {number} totalResponses - Total test responses count
 * @returns {Array<Object>} List of N response objects
 */
function generateResponses(questions, configs = {}, totalResponses = 10) {
  // Pre-generate full distribution arrays for questions with exact_count
  const questionDistributions = {};

  questions.forEach(q => {
    const cfg = configs[q.id] || {};

    if (["multiple_choice", "dropdown", "linear_scale", "rating"].includes(q.type)) {
      if (cfg.mode === "exact_count") {
        questionDistributions[q.id] = generateExactCountDistribution(q.options, cfg.weights || {}, totalResponses);
      }
    }
  });

  const responses = [];

  for (let rIndex = 0; rIndex < totalResponses; rIndex++) {
    const responseData = {
      responseNumber: rIndex + 1,
      entries: {},        // entryId -> value
      displayValues: {}   // question.id -> readable string
    };

    questions.forEach(q => {
      const cfg = configs[q.id] || {};
      let val = null;
      let displayVal = "";

      switch (q.type) {
        case "short_answer":
        case "paragraph":
          val = generateTextValue(q, cfg, rIndex, totalResponses);
          displayVal = val;
          break;

        case "multiple_choice":
        case "dropdown":
        case "linear_scale":
        case "rating":
          val = generateChoiceValue(q, cfg, rIndex, questionDistributions[q.id]);
          displayVal = val;
          break;

        case "checkbox":
          const selectedOpts = generateCheckboxValues(q, cfg);
          val = selectedOpts;
          displayVal = selectedOpts.join(", ");
          break;

        case "date":
          val = generateDateValue(q, cfg);
          displayVal = typeof val === "object" ? `${val.year}-${val.month}-${val.day}` + (val.hour !== undefined ? ` ${val.hour}:${val.minute}` : "") : String(val);
          break;

        case "time":
          val = generateTimeValue(q, cfg);
          displayVal = typeof val === "object" ? `${val.hour}:${val.minute}` : String(val);
          break;

        case "file_upload":
          val = null;
          displayVal = "[File Upload Skipped]";
          break;

        default:
          if (q.options && q.options.length > 0) {
            val = q.options[Math.floor(Math.random() * q.options.length)];
          } else {
            val = `Answer #${rIndex + 1}`;
          }
          displayVal = String(val);
          break;
      }

      responseData.entries[q.id] = {
        entryId: q.entryId,
        type: q.type,
        value: val,
        hasTime: q.hasTime
      };
      responseData.displayValues[q.id] = displayVal;
    });

    responses.push(responseData);
  }

  return responses;
}

function generateTextValue(q, cfg, rIndex, totalResponses) {
  const source = cfg.source || "generated";

  if (source === "manual") {
    return cfg.manualValue !== undefined ? cfg.manualValue : `Test ${q.title}`;
  }

  if (source === "file") {
    let fileValues = [];
    if (cfg.selectedColumn && cfg.columnData && cfg.columnData[cfg.selectedColumn]) {
      fileValues = cfg.columnData[cfg.selectedColumn];
    } else {
      fileValues = cfg.fileValues || [];
    }

    if (fileValues.length === 0) return `Sample ${rIndex + 1}`;

    const selection = cfg.selection || "sequential";
    if (selection === "random") {
      return fileValues[Math.floor(Math.random() * fileValues.length)];
    } else {
      // Sequential
      const overflow = cfg.overflow || "loop";
      if (rIndex < fileValues.length) {
        return fileValues[rIndex];
      } else {
        if (overflow === "stop") {
          return fileValues[fileValues.length - 1];
        } else {
          return fileValues[rIndex % fileValues.length];
        }
      }
    }
  }

  // Default: generated
  if (q.type === "paragraph") {
    return SAMPLE_PARAGRAPHS[rIndex % SAMPLE_PARAGRAPHS.length];
  }
  return `${SAMPLE_NAMES[rIndex % SAMPLE_NAMES.length]} ${rIndex + 1}`;
}

function generateChoiceValue(q, cfg, rIndex, precomputedArray) {
  const options = q.options && q.options.length > 0 ? q.options : ["Option 1"];
  const mode = cfg.mode || "random";

  if (mode === "fixed") {
    return cfg.fixedValue && options.includes(cfg.fixedValue) ? cfg.fixedValue : options[0];
  }

  if (mode === "exact_count" && precomputedArray && precomputedArray[rIndex] !== undefined) {
    return precomputedArray[rIndex];
  }

  if (mode === "weighted") {
    return pickWeightedRandom(options, cfg.weights || {});
  }

  return options[Math.floor(Math.random() * options.length)];
}

function generateCheckboxValues(q, cfg) {
  const options = q.options && q.options.length > 0 ? q.options : ["Option 1"];
  const mode = cfg.mode || "random";

  if (mode === "fixed") {
    return cfg.fixedOptions && cfg.fixedOptions.length > 0 ? cfg.fixedOptions : [options[0]];
  }

  if (mode === "weighted") {
    const selected = [];
    options.forEach(opt => {
      const weight = parseFloat(cfg.weights && cfg.weights[opt] !== undefined ? cfg.weights[opt] : 50);
      if (Math.random() * 100 < weight) {
        selected.push(opt);
      }
    });
    if (selected.length === 0) selected.push(options[Math.floor(Math.random() * options.length)]);
    return selected;
  }

  const minSel = Math.max(1, parseInt(cfg.minSelected || 1));
  const maxSel = Math.min(options.length, Math.max(minSel, parseInt(cfg.maxSelected || options.length)));
  const countToPick = Math.floor(Math.random() * (maxSel - minSel + 1)) + minSel;

  const shuffled = shuffleArray(options);
  return shuffled.slice(0, countToPick);
}

function generateDateValue(q, cfg) {
  if (cfg.source === "manual" && cfg.manualDate) {
    const parts = cfg.manualDate.split("-");
    const res = {
      year: parts[0] || "2026",
      month: parts[1] || "10",
      day: parts[2] || "07"
    };
    if (q.hasTime) {
      res.hour = cfg.manualTime ? cfg.manualTime.split(":")[0] : "12";
      res.minute = cfg.manualTime ? cfg.manualTime.split(":")[1] : "00";
    }
    return res;
  }

  const now = new Date();
  const res = {
    year: String(now.getFullYear()),
    month: String(now.getMonth() + 1).padStart(2, '0'),
    day: String(now.getDate()).padStart(2, '0')
  };
  if (q.hasTime) {
    res.hour = String(Math.floor(Math.random() * 24)).padStart(2, '0');
    res.minute = String(Math.floor(Math.random() * 60)).padStart(2, '0');
  }
  return res;
}

function generateTimeValue(q, cfg) {
  if (cfg.source === "manual" && cfg.manualTime) {
    const parts = cfg.manualTime.split(":");
    return {
      hour: parts[0] || "12",
      minute: parts[1] || "00"
    };
  }

  return {
    hour: String(Math.floor(Math.random() * 24)).padStart(2, '0'),
    minute: String(Math.floor(Math.random() * 60)).padStart(2, '0')
  };
}

module.exports = {
  generateResponses
};
