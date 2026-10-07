import React from "react";
import { PlayCircle, BookmarkPlus, SlidersHorizontal } from "lucide-react";

export function Header({ onOpenProfileModal, onOpenPreview, hasForm }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Brand logo & title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <SlidersHorizontal className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-white via-slate-200 to-indigo-200 bg-clip-text text-transparent">
              Công Cụ Kiểm Thử Google Forms
            </h1>
            <p className="text-xs text-slate-400">
              Mô phỏng dữ liệu & kiểm thử tự động Google Forms cho QA / Developer
            </p>
          </div>
        </div>

        {/* Actions header buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {hasForm && (
            <button
              onClick={onOpenPreview}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-2 transition-all shadow-sm"
            >
              <PlayCircle className="w-4 h-4 text-indigo-400" />
              <span>Xem trước dữ liệu</span>
            </button>
          )}

          <button
            onClick={onOpenProfileModal}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 transition-all shadow-md shadow-indigo-600/20"
          >
            <BookmarkPlus className="w-4 h-4" />
            <span>Profile / File JSON</span>
          </button>
        </div>
      </div>
    </header>
  );
}
