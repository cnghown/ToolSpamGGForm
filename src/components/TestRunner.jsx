import React, { useState, useEffect, useRef } from "react";
import { Play, Square, Activity } from "lucide-react";

export function TestRunner({ formMeta, formUrl, fbzx, questions, configs, onCompleteTest }) {
  const [totalResponses, setTotalResponses] = useState(100);
  const [delaySeconds, setDelaySeconds] = useState(2);
  const [isRunning, setIsRunning] = useState(false);
  const [testId, setTestId] = useState(null);

  const [currentResponse, setCurrentResponse] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [logs, setLogs] = useState([]);
  const logEndRef = useRef(null);
  const eventSourceRef = useRef(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const handleStartTest = async () => {
    if (!formUrl || !questions || questions.length === 0) return;

    setIsRunning(true);
    setCurrentResponse(0);
    setSuccessCount(0);
    setFailedCount(0);
    setLogs([{ time: new Date().toLocaleTimeString("vi-VN"), message: "Khởi tạo môi trường kiểm thử...", level: "info" }]);

    try {
      const prepRes = await fetch("/api/prepare-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formUrl,
          fbzx,
          questions,
          configs,
          totalResponses: parseInt(totalResponses) || 10,
          delaySeconds: parseFloat(delaySeconds) || 0,
          fillOutWithEmail: formMeta?.fillOutWithEmail
        })
      });

      const prepData = await prepRes.json();
      if (!prepData.success) throw new Error(prepData.error || "Không thể khởi tạo tiến trình test.");

      const newTestId = prepData.testId;
      setTestId(newTestId);

      const sse = new EventSource(`/api/stream-test?testId=${newTestId}`);
      eventSourceRef.current = sse;

      sse.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "progress") {
            if (data.current !== undefined) setCurrentResponse(data.current);
            if (data.success !== undefined) setSuccessCount(data.success);
            if (data.failed !== undefined) setFailedCount(data.failed);
          } else if (data.type === "log") {
            setLogs((prev) => [
              ...prev,
              { time: new Date().toLocaleTimeString("vi-VN"), message: data.message, level: data.level || "info" }
            ]);
          } else if (data.type === "complete") {
            setIsRunning(false);
            sse.close();
            if (onCompleteTest) {
              onCompleteTest(data.statistics, data.responses);
            }
          }
        } catch (err) {
          console.error("SSE Parse Error:", err);
        }
      };

      sse.onerror = () => {
        setIsRunning(false);
        sse.close();
      };
    } catch (err) {
      setIsRunning(false);
      setLogs((prev) => [
        ...prev,
        { time: new Date().toLocaleTimeString("vi-VN"), message: `[LỖI] ${err.message}`, level: "error" }
      ]);
    }
  };

  const handleStopTest = async () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    if (testId) {
      await fetch("/api/stop-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testId })
      });
    }
    setIsRunning(false);
    setLogs((prev) => [
      ...prev,
      { time: new Date().toLocaleTimeString("vi-VN"), message: "Tiến trình test đã bị người dùng dừng lại.", level: "warning" }
    ]);
  };

  const progressPercent = totalResponses > 0 ? Math.min(100, Math.round((currentResponse / totalResponses) * 100)) : 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Trình Chạy Kiểm Thử (Test Runner)</h2>
            <p className="text-xs text-slate-400">Cấu hình số lượng response & theo dõi tiến trình chạy trực tiếp</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isRunning ? (
            <button
              onClick={handleStartTest}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/20"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>BẮT ĐẦU TEST</span>
            </button>
          ) : (
            <button
              onClick={handleStopTest}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl text-sm flex items-center gap-2 transition-all shadow-lg shadow-red-600/20"
            >
              <Square className="w-4 h-4 fill-white" />
              <span>DỪNG TEST</span>
            </button>
          )}
        </div>
      </div>

      {/* Runner Controls */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Số lượng response (Lượt gửi):
          </label>
          <input
            type="number"
            min="1"
            max="10000"
            disabled={isRunning}
            value={totalResponses}
            onChange={(e) => setTotalResponses(parseInt(e.target.value) || 1)}
            className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Thời gian chờ giữa mỗi lượt (Giây):
          </label>
          <input
            type="number"
            step="0.5"
            min="0"
            max="60"
            disabled={isRunning}
            value={delaySeconds}
            onChange={(e) => setDelaySeconds(parseFloat(e.target.value) || 0)}
            className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          />
        </div>

        <div className="sm:col-span-2 lg:col-span-1 flex flex-col justify-center">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Trạng thái:</span>
          <span className={`inline-flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg border ${
            isRunning
              ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30 animate-pulse"
              : currentResponse > 0
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
              : "bg-slate-800 text-slate-400 border-slate-700"
          }`}>
            <span className={`w-2 h-2 rounded-full ${isRunning ? "bg-indigo-400" : "bg-slate-500"}`} />
            {isRunning ? `Đang gửi Response #${currentResponse}...` : currentResponse > 0 ? "Đã hoàn thành" : "Sẵn sàng"}
          </span>
        </div>
      </div>

      {/* Progress Bar & Counters */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-300">Tiến trình:</span>
          <span className="text-indigo-400 font-mono text-sm">{progressPercent}%</span>
        </div>

        <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full transition-all duration-300 shadow-lg shadow-indigo-500/50"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-center">
            <span className="block text-[10px] text-slate-500 uppercase font-semibold">Đã hoàn thành</span>
            <span className="text-base font-bold font-mono text-white mt-0.5">
              {currentResponse} / {totalResponses}
            </span>
          </div>

          <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 text-center">
            <span className="block text-[10px] text-emerald-400 uppercase font-semibold">Thành công</span>
            <span className="text-base font-bold font-mono text-emerald-300 mt-0.5">
              {successCount}
            </span>
          </div>

          <div className="bg-red-500/10 p-3 rounded-xl border border-red-500/20 text-center">
            <span className="block text-[10px] text-red-400 uppercase font-semibold">Thất bại</span>
            <span className="text-base font-bold font-mono text-red-300 mt-0.5">
              {failedCount}
            </span>
          </div>
        </div>
      </div>

      {/* Real-time Logs Box */}
      <div className="space-y-2">
        <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Log tiến trình chi tiết (Real-time):
        </span>
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 h-48 overflow-y-auto font-mono text-xs space-y-1.5 shadow-inner">
          {logs.length === 0 ? (
            <span className="text-slate-600 italic">Chưa có log. Bấm [ BẮT ĐẦU TEST ] để khởi chạy.</span>
          ) : (
            logs.map((log, idx) => (
              <div key={idx} className={`flex items-start gap-2 ${
                log.level === "error"
                  ? "text-red-400"
                  : log.level === "warning"
                  ? "text-amber-400"
                  : log.level === "success"
                  ? "text-emerald-400"
                  : "text-slate-300"
              }`}>
                <span className="text-slate-600 shrink-0">[{log.time}]</span>
                <span>{log.message}</span>
              </div>
            ))
          )}
          <div ref={logEndRef} />
        </div>
      </div>
    </div>
  );
}
