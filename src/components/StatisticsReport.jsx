import React from "react";
import { BarChart3, ListOrdered, Award } from "lucide-react";

export function StatisticsReport({ statistics, questions }) {
  if (!statistics) return null;

  const { total, success, failed, distributions = {}, usedSequential = {} } = statistics;
  const successRate = total > 0 ? Math.round((success / total) * 100) : 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Kết Quả Thống Kê Kiểm Thử (Completed)</h2>
            <p className="text-xs text-slate-400">Tỷ lệ phân phối đáp án & danh sách dữ liệu tuần tự đã sử dụng</p>
          </div>
        </div>

        <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold text-xs">
          Tỷ lệ thành công: {successRate}%
        </span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
          <span className="block text-xs font-semibold text-slate-400 uppercase">Tổng lượt chạy</span>
          <span className="text-2xl font-bold font-mono text-white mt-1">{total}</span>
        </div>

        <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20 text-center">
          <span className="block text-xs font-semibold text-emerald-400 uppercase">Thành công</span>
          <span className="text-2xl font-bold font-mono text-emerald-300 mt-1">{success}</span>
        </div>

        <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/20 text-center">
          <span className="block text-xs font-semibold text-red-400 uppercase">Thất bại</span>
          <span className="text-2xl font-bold font-mono text-red-300 mt-1">{failed}</span>
        </div>
      </div>

      {/* Per Question Distribution Charts & Lists */}
      <div className="space-y-5">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-indigo-400" />
          <span>Biểu Đồ Phân Phối Chi Tiết Từng Câu Hỏi</span>
        </h3>

        <div className="grid gap-4 md:grid-cols-2">
          {questions.map((q, idx) => {
            const distMap = distributions[q.id] || {};
            const seqList = usedSequential[q.id] || [];
            const hasDist = Object.keys(distMap).length > 0;
            const hasSeq = seqList.length > 0;

            if (!hasDist && !hasSeq) return null;

            return (
              <div key={q.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-xs font-semibold text-indigo-400">Câu {idx + 1}</span>
                  <span className="text-xs font-medium text-slate-300 truncate max-w-[200px]">{q.title}</span>
                </div>

                {/* Distribution Bars */}
                {hasDist && (
                  <div className="space-y-2">
                    {Object.entries(distMap).map(([opt, cnt]) => {
                      const pct = success > 0 ? Math.round((cnt / success) * 100) : 0;
                      return (
                        <div key={opt} className="space-y-1 text-xs">
                          <div className="flex justify-between text-slate-300">
                            <span className="truncate pr-2">{opt}</span>
                            <span className="font-mono text-slate-400 shrink-0">{cnt} ({pct}%)</span>
                          </div>
                          <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                            <div
                              className="h-full bg-indigo-500 rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Sequential used values */}
                {hasSeq && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase flex items-center gap-1">
                      <ListOrdered className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Danh Sách Dữ Liệu Đã Sử Dụng ({seqList.length}):</span>
                    </span>
                    <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 max-h-32 overflow-y-auto font-mono text-[11px] text-slate-300 space-y-1">
                      {seqList.map((val, vIdx) => (
                        <div key={vIdx} className="flex justify-between border-b border-slate-800/50 pb-0.5">
                          <span className="text-slate-500">#{vIdx + 1}</span>
                          <span>{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
