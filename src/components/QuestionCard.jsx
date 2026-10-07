import React, { useState } from "react";
import { parseDataFile } from "../services/fileParser";
import { Upload, FileCheck, AlertCircle, Sparkles } from "lucide-react";

const QUESTION_TYPE_LABELS = {
  short_answer: "Trả lời ngắn",
  paragraph: "Đoạn văn",
  multiple_choice: "Trắc nghiệm",
  checkbox: "Hộp kiểm",
  dropdown: "Menu thả xuống",
  linear_scale: "Thang đo tuyến tính",
  rating: "Đánh giá sao",
  date: "Ngày",
  time: "Giờ",
  file_upload: "Tải file lên",
  unknown: "Khác"
};

export function QuestionCard({ question, index, config = {}, onChangeConfig }) {
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState(null);

  const updateCfg = (newPartial) => {
    onChangeConfig(question.id, { ...config, ...newPartial });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setFileLoading(true);
    setFileError(null);

    try {
      const parsed = await parseDataFile(file);
      if (!parsed.columns || parsed.columns.length === 0) {
        throw new Error("File không chứa dữ liệu hợp lệ.");
      }

      // Auto-match column with question title
      let matchedCol = parsed.columns[0];
      const qTitleLower = question.title.toLowerCase();

      for (const col of parsed.columns) {
        const colLower = col.toLowerCase();
        if (
          qTitleLower.includes(colLower) ||
          colLower.includes(qTitleLower) ||
          (qTitleLower.includes("email") && colLower.includes("email")) ||
          (qTitleLower.includes("họ") && colLower.includes("tên")) ||
          (qTitleLower.includes("sĐT") || qTitleLower.includes("điện thoại") || colLower.includes("sđt") || colLower.includes("phone"))
        ) {
          matchedCol = col;
          break;
        }
      }

      updateCfg({
        source: "file",
        fileName: parsed.fileName,
        fileColumns: parsed.columns,
        columnData: parsed.columnData,
        selectedColumn: matchedCol,
        fileValues: parsed.columnData[matchedCol] || parsed.allValues
      });
    } catch (err) {
      setFileError(err.message);
    } finally {
      setFileLoading(false);
    }
  };

  const getWeightsTotal = () => {
    const weights = config.weights || {};
    return question.options.reduce((sum, opt) => {
      const v = parseFloat(weights[opt] !== undefined ? weights[opt] : 0);
      return sum + (isNaN(v) ? 0 : v);
    }, 0);
  };

  const isTextType = ["short_answer", "paragraph"].includes(question.type);
  const isChoiceType = ["multiple_choice", "dropdown", "linear_scale", "rating"].includes(question.type);
  const isCheckboxType = question.type === "checkbox";
  const isDateTimeType = ["date", "time"].includes(question.type);

  const currentColumnValues = config.selectedColumn && config.columnData && config.columnData[config.selectedColumn]
    ? config.columnData[config.selectedColumn]
    : config.fileValues || [];

  return (
    <div className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-6 transition-all shadow-md">
      {/* Question Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Câu {index + 1}
            </span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700 uppercase">
              {QUESTION_TYPE_LABELS[question.type] || question.type}
            </span>
            {question.required && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                Bắt buộc
              </span>
            )}
          </div>
          <h3 className="text-base font-semibold text-white mt-1">{question.title}</h3>
          {question.description && (
            <p className="text-xs text-slate-400 mt-0.5">{question.description}</p>
          )}
        </div>
      </div>

      {/* Configuration Section */}
      <div className="mt-5 space-y-4 text-sm">
        {/* ==================== 1. SHORT ANSWER / PARAGRAPH ==================== */}
        {isTextType && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Nguồn dữ liệu (Data Source)
              </label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                  <input
                    type="radio"
                    name={`source_${question.id}`}
                    checked={(config.source || "generated") === "manual"}
                    onChange={() => updateCfg({ source: "manual" })}
                    className="accent-indigo-500"
                  />
                  <span>Nhập thủ công (Manual)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                  <input
                    type="radio"
                    name={`source_${question.id}`}
                    checked={(config.source || "generated") === "file"}
                    onChange={() => updateCfg({ source: "file" })}
                    className="accent-indigo-500"
                  />
                  <span>Import File</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                  <input
                    type="radio"
                    name={`source_${question.id}`}
                    checked={(config.source || "generated") === "generated"}
                    onChange={() => updateCfg({ source: "generated" })}
                    className="accent-indigo-500"
                  />
                  <span>Sinh tự động (Generated)</span>
                </label>
              </div>
            </div>

            {/* Manual input */}
            {config.source === "manual" && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Giá trị:
                </label>
                <input
                  type="text"
                  value={config.manualValue || ""}
                  onChange={(e) => updateCfg({ manualValue: e.target.value })}
                  placeholder="Nhập giá trị cố định..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            {/* File upload */}
            {config.source === "file" && (
              <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="cursor-pointer px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-lg flex items-center gap-2 transition-all">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Chọn File (.txt, .csv, .json, .xlsx)</span>
                    <input
                      type="file"
                      accept=".txt,.csv,.json,.xlsx,.xls"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  {config.fileName && (
                    <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>{config.fileName}</span>
                      <strong className="text-white ml-1">(Tổng: {currentColumnValues.length} dữ liệu)</strong>
                    </div>
                  )}
                </div>

                {/* Column Selection for Multi-Column File */}
                {config.fileColumns && config.fileColumns.length > 1 && (
                  <div className="pt-2 border-t border-slate-800/80">
                    <label className="block text-xs font-semibold text-indigo-300 mb-1.5 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Chọn cột dữ liệu từ File:</span>
                    </label>
                    <select
                      value={config.selectedColumn || config.fileColumns[0]}
                      onChange={(e) => {
                        const sel = e.target.value;
                        const vals = config.columnData ? config.columnData[sel] : [];
                        updateCfg({
                          selectedColumn: sel,
                          fileValues: vals
                        });
                      }}
                      className="w-full px-3 py-2 bg-slate-950 border border-indigo-500/40 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    >
                      {config.fileColumns.map((col, idx) => (
                        <option key={idx} value={col}>
                          Cột: {col} ({(config.columnData && config.columnData[col] ? config.columnData[col].length : 0)} dòng dữ liệu)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {fileError && (
                  <p className="text-xs text-red-400 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{fileError}</span>
                  </p>
                )}

                {/* Selection method */}
                <div className="pt-2 border-t border-slate-800/80 grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Phương Thức Chọn
                    </label>
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-2 cursor-pointer text-slate-300 text-xs">
                        <input
                          type="radio"
                          name={`selection_${question.id}`}
                          checked={(config.selection || "sequential") === "random"}
                          onChange={() => updateCfg({ selection: "random" })}
                          className="accent-indigo-500"
                        />
                        <span>Ngẫu nhiên (Random)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-slate-300 text-xs">
                        <input
                          type="radio"
                          name={`selection_${question.id}`}
                          checked={(config.selection || "sequential") === "sequential"}
                          onChange={() => updateCfg({ selection: "sequential" })}
                          className="accent-indigo-500"
                        />
                        <span>Nối tiếp (Sequential)</span>
                      </label>
                    </div>
                  </div>

                  {/* Overflow option if sequential */}
                  {config.selection !== "random" && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Xử Lý Khi Lượng Test &gt; Dữ Liệu File
                      </label>
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-2 cursor-pointer text-slate-300 text-xs">
                          <input
                            type="radio"
                            name={`overflow_${question.id}`}
                            checked={(config.overflow || "loop") === "loop"}
                            onChange={() => updateCfg({ overflow: "loop" })}
                            className="accent-indigo-500"
                          />
                          <span>Lặp lại từ đầu (Loop from beginning)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-slate-300 text-xs">
                          <input
                            type="radio"
                            name={`overflow_${question.id}`}
                            checked={(config.overflow || "loop") === "stop"}
                            onChange={() => updateCfg({ overflow: "stop" })}
                            className="accent-indigo-500"
                          />
                          <span>Dừng lại khi hết dữ liệu (Stop when data runs out)</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== 2. MULTIPLE CHOICE / DROPDOWN / SCALE / RATING ==================== */}
        {isChoiceType && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Chế độ chọn đáp án (Selection Mode)
              </label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                  <input
                    type="radio"
                    name={`mode_${question.id}`}
                    checked={(config.mode || "random") === "fixed"}
                    onChange={() => updateCfg({ mode: "fixed" })}
                    className="accent-indigo-500"
                  />
                  <span>Cố định (Fixed)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                  <input
                    type="radio"
                    name={`mode_${question.id}`}
                    checked={(config.mode || "random") === "random"}
                    onChange={() => updateCfg({ mode: "random" })}
                    className="accent-indigo-500"
                  />
                  <span>Ngẫu nhiên (Random)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                  <input
                    type="radio"
                    name={`mode_${question.id}`}
                    checked={(config.mode || "random") === "weighted"}
                    onChange={() => updateCfg({ mode: "weighted" })}
                    className="accent-indigo-500"
                  />
                  <span>Tỷ lệ phần trăm (Weighted Random %)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                  <input
                    type="radio"
                    name={`mode_${question.id}`}
                    checked={(config.mode || "random") === "exact_count"}
                    onChange={() => updateCfg({ mode: "exact_count" })}
                    className="accent-indigo-500"
                  />
                  <span>Số lượng chính xác (Exact Count)</span>
                </label>
              </div>
            </div>

            {/* Fixed option picker */}
            {config.mode === "fixed" && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Chọn đáp án cố định:
                </label>
                <select
                  value={config.fixedValue || (question.options[0] || "")}
                  onChange={(e) => updateCfg({ fixedValue: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {question.options.map((opt, i) => (
                    <option key={i} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Weighted Random or Exact Count */}
            {(config.mode === "weighted" || config.mode === "exact_count") && (
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">
                    {config.mode === "exact_count" ? "Đặt số lượng mục tiêu cho từng đáp án:" : "Đặt tỷ lệ phần trăm (%):"}
                  </span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    getWeightsTotal() === 100 || config.mode === "exact_count"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  }`}>
                    Tổng: {getWeightsTotal()}%
                  </span>
                </div>

                <div className="space-y-2">
                  {question.options.map((opt, i) => (
                    <div key={i} className="flex items-center justify-between gap-4 bg-slate-900/60 px-3 py-2 rounded-lg border border-slate-800">
                      <span className="text-xs text-slate-300 truncate">{opt}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <input
                          type="number"
                          min="0"
                          max="1000"
                          value={config.weights && config.weights[opt] !== undefined ? config.weights[opt] : ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateCfg({
                              weights: {
                                ...(config.weights || {}),
                                [opt]: val
                              }
                            });
                          }}
                          placeholder="0"
                          className="w-20 px-2.5 py-1 text-right bg-slate-950 border border-slate-700 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <span className="text-xs text-slate-500">{config.mode === "exact_count" ? "lượt" : "%"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== 3. CHECKBOX ==================== */}
        {isCheckboxType && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Chế độ chọn đáp án (Selection Mode)
              </label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                  <input
                    type="radio"
                    name={`cb_mode_${question.id}`}
                    checked={(config.mode || "random") === "fixed"}
                    onChange={() => updateCfg({ mode: "fixed" })}
                    className="accent-indigo-500"
                  />
                  <span>Cố định (Fixed)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                  <input
                    type="radio"
                    name={`cb_mode_${question.id}`}
                    checked={(config.mode || "random") === "random"}
                    onChange={() => updateCfg({ mode: "random" })}
                    className="accent-indigo-500"
                  />
                  <span>Ngẫu nhiên (Random)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                  <input
                    type="radio"
                    name={`cb_mode_${question.id}`}
                    checked={(config.mode || "random") === "weighted"}
                    onChange={() => updateCfg({ mode: "weighted" })}
                    className="accent-indigo-500"
                  />
                  <span>Tỷ lệ phần trăm (Weighted)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                  <input
                    type="radio"
                    name={`cb_mode_${question.id}`}
                    checked={(config.mode || "random") === "custom_combination"}
                    onChange={() => updateCfg({ mode: "custom_combination" })}
                    className="accent-indigo-500"
                  />
                  <span>Tổ hợp ngẫu nhiên (Custom Combination)</span>
                </label>
              </div>
            </div>

            {/* Checkbox Fixed mode */}
            {config.mode === "fixed" && (
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-slate-400">Chọn các đáp án cố định:</span>
                {question.options.map((opt, i) => {
                  const fixedOpts = config.fixedOptions || [];
                  const isChecked = fixedOpts.includes(opt);
                  return (
                    <label key={i} className="flex items-center gap-2 cursor-pointer text-xs text-slate-200">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          let next = [...fixedOpts];
                          if (e.target.checked) next.push(opt);
                          else next = next.filter(o => o !== opt);
                          updateCfg({ fixedOptions: next });
                        }}
                        className="rounded bg-slate-900 border-slate-700 accent-indigo-500"
                      />
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {/* Checkbox Custom combination mode */}
            {(config.mode === "custom_combination" || config.mode === "random") && (
              <div className="flex flex-wrap items-center gap-4 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-300">Số lựa chọn tối thiểu:</span>
                  <input
                    type="number"
                    min="1"
                    max={question.options.length}
                    value={config.minSelected || 1}
                    onChange={(e) => updateCfg({ minSelected: parseInt(e.target.value) || 1 })}
                    className="w-16 px-2.5 py-1 bg-slate-950 border border-slate-700 rounded text-xs text-white"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-300">Số lựa chọn tối đa:</span>
                  <input
                    type="number"
                    min="1"
                    max={question.options.length}
                    value={config.maxSelected || question.options.length}
                    onChange={(e) => updateCfg({ maxSelected: parseInt(e.target.value) || question.options.length })}
                    className="w-16 px-2.5 py-1 bg-slate-950 border border-slate-700 rounded text-xs text-white"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== 4. DATE / TIME ==================== */}
        {isDateTimeType && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Nguồn Dữ Liệu
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                  <input
                    type="radio"
                    name={`dt_src_${question.id}`}
                    checked={(config.source || "generated") === "manual"}
                    onChange={() => updateCfg({ source: "manual" })}
                    className="accent-indigo-500"
                  />
                  <span>Nhập thủ công (Manual)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                  <input
                    type="radio"
                    name={`dt_src_${question.id}`}
                    checked={(config.source || "generated") === "generated"}
                    onChange={() => updateCfg({ source: "generated" })}
                    className="accent-indigo-500"
                  />
                  <span>Sinh tự động (Generated)</span>
                </label>
              </div>
            </div>

            {config.source === "manual" && (
              <div className="flex flex-wrap gap-4">
                {question.type === "date" && (
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Ngày:</label>
                    <input
                      type="date"
                      value={config.manualDate || "2026-10-07"}
                      onChange={(e) => updateCfg({ manualDate: e.target.value })}
                      className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded text-xs text-white"
                    />
                  </div>
                )}
                {(question.type === "time" || question.hasTime) && (
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Giờ:</label>
                    <input
                      type="time"
                      value={config.manualTime || "12:00"}
                      onChange={(e) => updateCfg({ manualTime: e.target.value })}
                      className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded text-xs text-white"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
