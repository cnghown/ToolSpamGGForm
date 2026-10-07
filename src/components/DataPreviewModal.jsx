import React, { useState, useEffect } from "react";
import { X, RefreshCw, Table } from "lucide-react";

export function DataPreviewModal({ isOpen, onClose, questions, configs }) {
  const [previewCount, setPreviewCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [responses, setResponses] = useState([]);
  const [error, setError] = useState(null);

  const fetchPreview = async (countVal) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questions,
          configs,
          count: countVal
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Lỗi tạo bản xem trước");
      setResponses(data.responses || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && questions && questions.length > 0) {
      fetchPreview(previewCount);
    }
  }, [isOpen, questions, configs]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-6xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Table className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Bảng Xem Trước Dữ Liệu Test</h2>
              <p className="text-xs text-slate-400">
                Kiểm tra cấu hình dữ liệu được mô phỏng trước khi Bắt Đầu Test
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-medium">Số lượng xem trước:</span>
            <div className="flex items-center gap-1.5">
              {[5, 10, 20, 50].map((num) => (
                <button
                  key={num}
                  onClick={() => {
                    setPreviewCount(num);
                    fetchPreview(num);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    previewCount === num
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {num} lượt
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => fetchPreview(previewCount)}
            disabled={loading}
            className="px-3.5 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg flex items-center gap-2 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-400" : ""}`} />
            <span>Tạo lại xem trước</span>
          </button>
        </div>

        {/* Content Table */}
        <div className="p-6 overflow-auto flex-1">
          {error ? (
            <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">
              {error}
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
              <p className="text-sm">Đang tạo bản xem trước dữ liệu...</p>
            </div>
          ) : (
            <div className="border border-slate-800 rounded-xl overflow-hidden shadow-inner">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950 text-slate-300 border-b border-slate-800 font-semibold uppercase tracking-wider">
                    <th className="p-3.5 border-r border-slate-800 w-12 text-center">#</th>
                    {questions.map((q, idx) => (
                      <th key={q.id} className="p-3.5 border-r border-slate-800 max-w-[200px] truncate">
                        Câu {idx + 1}: {q.title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-slate-900/40">
                  {responses.map((resp, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 text-center text-slate-500 font-mono border-r border-slate-800/80 font-bold">
                        {resp.responseNumber}
                      </td>
                      {questions.map((q) => (
                        <td key={q.id} className="p-3 border-r border-slate-800/80 text-slate-200 font-sans max-w-[220px] truncate">
                          {resp.displayValues[q.id] || <span className="text-slate-600 italic">Trống</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-xl transition-all shadow-md"
          >
            Đóng Xem Trước
          </button>
        </div>
      </div>
    </div>
  );
}
