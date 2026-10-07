import React, { useState } from "react";
import { Link2, Loader2, AlertCircle, FileText } from "lucide-react";

export function FormUrlInput({ onLoadForm, loading, error, formMeta }) {
  const [url, setUrl] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (url.trim()) {
      onLoadForm(url.trim());
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm font-semibold text-slate-200">
          Đường Dẫn Google Form (URL)
        </label>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Link2 className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://docs.google.com/forms/d/e/.../viewform"
              className="w-full pl-11 pr-4 py-3 bg-slate-950/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/25 min-w-[140px]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Đang phân tích...</span>
              </>
            ) : (
              <span>LOAD FORM</span>
            )}
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-red-300 text-sm">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Phân tích Form thất bại</p>
            <p className="text-xs text-red-300/80 mt-1">{error}</p>
          </div>
        </div>
      )}

      {formMeta && (
        <div className="mt-6 pt-5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{formMeta.title}</h2>
              {formMeta.description && (
                <p className="text-xs text-slate-400 line-clamp-1">{formMeta.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-medium">
              Tổng số câu hỏi: <strong className="text-indigo-400 font-bold">{formMeta.totalQuestions}</strong>
            </span>
            {formMeta.fillOutWithEmail && (
              <span className="px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-medium">
                Yêu cầu thu thập Email
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
