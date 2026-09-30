import React from 'react';
import { ArticleVersion } from '../../types';

interface DiffViewerProps {
  prevVersion: ArticleVersion;
  currentVersion: ArticleVersion;
}

// Hàm phân tách và làm nổi bật sự khác nhau giữa 2 chuỗi
function computeSimpleDiff(oldText: string, newText: string) {
  const oldWords = oldText.split(/\s+/).filter(Boolean);
  const newWords = newText.split(/\s+/).filter(Boolean);

  const oldWordSet = new Set(oldWords);
  const newWordSet = new Set(newWords);

  const oldRendered = oldWords.map((word, idx) => {
    const isRemoved = !newWordSet.has(word);
    return isRemoved ? (
      <span key={idx} className="bg-red-100 text-red-800 line-through px-0.5 rounded mx-0.5">
        {word}{' '}
      </span>
    ) : (
      <span key={idx}>{word} </span>
    );
  });

  const newRendered = newWords.map((word, idx) => {
    const isAdded = !oldWordSet.has(word);
    return isAdded ? (
      <span key={idx} className="bg-emerald-100 text-emerald-800 font-medium px-0.5 rounded mx-0.5">
        {word}{' '}
      </span>
    ) : (
      <span key={idx}>{word} </span>
    );
  });

  return { oldRendered, newRendered };
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ prevVersion, currentVersion }) => {
  const titleDiff = computeSimpleDiff(prevVersion.title, currentVersion.title);
  const sapoDiff = computeSimpleDiff(prevVersion.sapo, currentVersion.sapo);
  const contentDiff = computeSimpleDiff(prevVersion.content, currentVersion.content);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
        <div>
          Bản cũ: <strong className="text-slate-800">Phiên bản #{prevVersion.version_no}</strong> ({prevVersion.created_at})
        </div>
        <div>
          Bản mới: <strong className="text-emerald-700">Phiên bản #{currentVersion.version_no}</strong> ({currentVersion.created_at})
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Column 1: Bản n-1 */}
        <div className="rounded-xl border border-rose-200 bg-rose-50/20 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-rose-100 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-800">
              Bản cũ (Phiên bản #{prevVersion.version_no})
            </span>
            <span className="text-[11px] text-rose-600">Từ bị gạch bỏ hiển thị đỏ</span>
          </div>

          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Tiêu đề:</div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">{titleDiff.oldRendered}</div>
          </div>

          {prevVersion.sapo && (
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase">Sapo:</div>
              <div className="text-xs italic text-slate-700 mt-0.5 leading-relaxed">{sapoDiff.oldRendered}</div>
            </div>
          )}

          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Nội dung:</div>
            <div className="text-xs text-slate-800 mt-0.5 whitespace-pre-line leading-relaxed">{contentDiff.oldRendered}</div>
          </div>
        </div>

        {/* Column 2: Bản n */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/20 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Bản mới (Phiên bản #{currentVersion.version_no})
            </span>
            <span className="text-[11px] text-emerald-600">Từ mới thêm vào hiển thị xanh</span>
          </div>

          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Tiêu đề:</div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">{titleDiff.newRendered}</div>
          </div>

          {currentVersion.sapo && (
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase">Sapo:</div>
              <div className="text-xs italic text-slate-700 mt-0.5 leading-relaxed">{sapoDiff.newRendered}</div>
            </div>
          )}

          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Nội dung:</div>
            <div className="text-xs text-slate-800 mt-0.5 whitespace-pre-line leading-relaxed">{contentDiff.newRendered}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
