import React, { useState } from "react";
import { Header } from "./components/Header";
import { FormUrlInput } from "./components/FormUrlInput";
import { QuestionCard } from "./components/QuestionCard";
import { DataPreviewModal } from "./components/DataPreviewModal";
import { TestRunner } from "./components/TestRunner";
import { StatisticsReport } from "./components/StatisticsReport";
import { ProfileManagerModal } from "./components/ProfileManagerModal";
import { Sparkles } from "lucide-react";

export function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formUrl, setFormUrl] = useState("");
  const [fbzx, setFbzx] = useState("");
  const [formMeta, setFormMeta] = useState(null);

  const [configs, setConfigs] = useState({});

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [statistics, setStatistics] = useState(null);

  const handleLoadForm = async (urlInput) => {
    setLoading(true);
    setError(null);
    setStatistics(null);

    try {
      const res = await fetch("/api/load-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlInput })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Không thể nạp thông tin Google Form.");
      }

      setFormUrl(data.formUrl);
      setFbzx(data.fbzx);
      setFormMeta(data.form);

      const initialConfigs = {};
      data.form.questions.forEach(q => {
        if (["short_answer", "paragraph"].includes(q.type)) {
          initialConfigs[q.id] = { source: "generated", selection: "sequential", overflow: "loop" };
        } else if (["multiple_choice", "dropdown", "linear_scale", "rating"].includes(q.type)) {
          const defaultWeights = {};
          q.options.forEach(opt => { defaultWeights[opt] = Math.round(100 / q.options.length); });
          initialConfigs[q.id] = { mode: "random", fixedValue: q.options[0] || "", weights: defaultWeights };
        } else if (q.type === "checkbox") {
          const defaultWeights = {};
          q.options.forEach(opt => { defaultWeights[opt] = 50; });
          initialConfigs[q.id] = { mode: "random", minSelected: 1, maxSelected: q.options.length, weights: defaultWeights };
        } else if (["date", "time"].includes(q.type)) {
          initialConfigs[q.id] = { source: "generated" };
        }
      });
      setConfigs(initialConfigs);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionConfigChange = (qId, newCfg) => {
    setConfigs(prev => ({
      ...prev,
      [qId]: newCfg
    }));
  };

  const handleApplyProfileConfigs = (importedConfigs) => {
    setConfigs(prev => ({
      ...prev,
      ...importedConfigs
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header
        hasForm={!!formMeta}
        onOpenPreview={() => setIsPreviewOpen(true)}
        onOpenProfileModal={() => setIsProfileOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* URL Input Section */}
        <FormUrlInput
          onLoadForm={handleLoadForm}
          loading={loading}
          error={error}
          formMeta={formMeta}
        />

        {/* Form Loaded Content */}
        {formMeta && formMeta.questions && formMeta.questions.length > 0 && (
          <div className="space-y-8">
            {/* Questions Configuration List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                    <span>Cấu Hình Đáp Án Cho Từng Câu Hỏi</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Tùy chỉnh quy tắc sinh dữ liệu độc lập dành cho từng câu hỏi trong Form
                  </p>
                </div>

                <button
                  onClick={() => setIsPreviewOpen(true)}
                  className="px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 font-medium rounded-xl text-xs flex items-center gap-2 transition-all shadow-sm"
                >
                  <span>Bảng Xem Trước Dữ Liệu</span>
                </button>
              </div>

              <div className="grid gap-6">
                {formMeta.questions.map((q, idx) => (
                  <QuestionCard
                    key={q.id}
                    question={q}
                    index={idx}
                    config={configs[q.id] || {}}
                    onChangeConfig={handleQuestionConfigChange}
                  />
                ))}
              </div>
            </div>

            {/* Test Runner Section */}
            <TestRunner
              formMeta={formMeta}
              formUrl={formUrl}
              fbzx={fbzx}
              questions={formMeta.questions}
              configs={configs}
              onCompleteTest={(stats) => setStatistics(stats)}
            />

            {/* Statistics Result Section */}
            {statistics && (
              <StatisticsReport
                statistics={statistics}
                questions={formMeta.questions}
              />
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      {formMeta && (
        <DataPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          questions={formMeta.questions}
          configs={configs}
        />
      )}

      <ProfileManagerModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        configs={configs}
        onApplyConfigs={handleApplyProfileConfigs}
      />
    </div>
  );
}

export default App;
