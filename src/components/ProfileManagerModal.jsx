import React, { useState, useEffect } from "react";
import { X, Save, Upload, Download, Trash2, BookmarkCheck } from "lucide-react";

const STORAGE_KEY = "gform_qa_profiles";

export function ProfileManagerModal({ isOpen, onClose, configs, onApplyConfigs }) {
  const [profiles, setProfiles] = useState({});
  const [profileName, setProfileName] = useState("");
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setProfiles(JSON.parse(saved));
    } catch (e) {
      console.error("Failed to load profiles from localStorage", e);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const saveToLocalStorage = (newProfiles) => {
    setProfiles(newProfiles);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newProfiles));
  };

  const handleSaveProfile = () => {
    if (!profileName.trim()) return;
    const nextProfiles = {
      ...profiles,
      [profileName.trim()]: {
        name: profileName.trim(),
        savedAt: new Date().toISOString(),
        configs
      }
    };
    saveToLocalStorage(nextProfiles);
    setProfileName("");
    setMsg({ type: "success", text: `Profile "${profileName.trim()}" đã được lưu thành công!` });
  };

  const handleLoadProfile = (name) => {
    if (profiles[name] && profiles[name].configs) {
      onApplyConfigs(profiles[name].configs);
      setMsg({ type: "success", text: `Đã nạp Profile "${name}" thành công!` });
    }
  };

  const handleDeleteProfile = (name) => {
    const nextProfiles = { ...profiles };
    delete nextProfiles[name];
    saveToLocalStorage(nextProfiles);
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      version: "1.0",
      exportDate: new Date().toISOString(),
      configs
    }, null, 2));

    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `gform_profile_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        if (json.configs) {
          onApplyConfigs(json.configs);
          setMsg({ type: "success", text: "Import File JSON Profile thành công!" });
        } else if (typeof json === "object") {
          onApplyConfigs(json);
          setMsg({ type: "success", text: "Import File JSON Profile thành công!" });
        }
      } catch (err) {
        setMsg({ type: "error", text: "File JSON không hợp lệ." });
      }
    };
    reader.readAsText(file, "UTF-8");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <BookmarkCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Quản Lý Profile & Dữ Liệu JSON</h2>
              <p className="text-xs text-slate-400">Lưu trữ & Khôi phục tập cấu hình câu hỏi</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {msg && (
            <div className={`p-3.5 rounded-xl text-xs font-semibold ${
              msg.type === "error" ? "bg-red-500/10 text-red-400 border border-red-500/30" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
            }`}>
              {msg.text}
            </div>
          )}

          {/* Export / Import Section */}
          <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <button
              onClick={handleExportJSON}
              className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <Download className="w-4 h-4 text-indigo-400" />
              <span>XUẤT FILE JSON</span>
            </button>

            <label className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm">
              <Upload className="w-4 h-4 text-indigo-400" />
              <span>NHẬP FILE JSON</span>
              <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
            </label>
          </div>

          {/* Save Profile */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Lưu cấu hình hiện tại thành Profile:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Ví dụ: Khảo sát mức độ hài lòng tháng 10"
                className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleSaveProfile}
                disabled={!profileName.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>LƯU</span>
              </button>
            </div>
          </div>

          {/* Saved Profiles List */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Danh sách Profile đã lưu ({Object.keys(profiles).length}):
            </label>
            <div className="bg-slate-950 border border-slate-800 rounded-xl max-h-48 overflow-y-auto divide-y divide-slate-800/60 p-2">
              {Object.keys(profiles).length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 italic">Chưa có profile nào được lưu.</div>
              ) : (
                Object.entries(profiles).map(([name, prof]) => (
                  <div key={name} className="flex items-center justify-between p-2.5 hover:bg-slate-900 rounded-lg">
                    <div>
                      <span className="text-xs font-bold text-white block">{name}</span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(prof.savedAt).toLocaleDateString("vi-VN")}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleLoadProfile(name)}
                        className="px-3 py-1 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-semibold rounded-lg transition-all"
                      >
                        NẠP
                      </button>
                      <button
                        onClick={() => handleDeleteProfile(name)}
                        className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
