import React from 'react';
import { ArticleStatusCode, STATUS_CONFIG } from '../../types';

export const StatusBadge: React.FC<{ status: ArticleStatusCode; className?: string }> = ({ status, className = '' }) => {
  const cfg = STATUS_CONFIG[status] || {
    label: status,
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400'
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      <span className="whitespace-nowrap">{cfg.label}</span>
    </span>
  );
};

export const QualityBadge: React.FC<{ tier: string; factor?: number; className?: string }> = ({
  tier,
  factor,
  className = ''
}) => {
  let style = 'bg-slate-100 text-slate-800 border-slate-200';
  if (tier === 'Xuất sắc') {
    style = 'bg-emerald-50 text-emerald-800 border-emerald-300';
  } else if (tier === 'Tốt') {
    style = 'bg-blue-50 text-blue-800 border-blue-300';
  } else if (tier === 'Đạt') {
    style = 'bg-teal-50 text-teal-800 border-teal-300';
  } else if (tier === 'Trung bình') {
    style = 'bg-amber-50 text-amber-800 border-amber-300';
  } else if (tier === 'Yếu') {
    style = 'bg-rose-50 text-rose-800 border-rose-300';
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style} ${className}`}>
      <span>{tier}</span>
      {factor !== undefined && factor > 0 && <span className="opacity-80">({factor.toFixed(2)})</span>}
    </span>
  );
};

/** KPI chỉ có 2 kết quả: Đạt / Chưa đạt (không xếp loại) */
export const KpiBadge: React.FC<{
  result: 'DAT' | 'CHUA_DAT';
  size?: 'sm' | 'md';
  className?: string;
}> = ({ result, size = 'md', className = '' }) => {
  const pad = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';
  if (result === 'DAT') {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 whitespace-nowrap ${pad} ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Đạt
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-bold bg-rose-50 text-rose-700 border border-rose-300 whitespace-nowrap ${pad} ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
      Chưa đạt
    </span>
  );
};

/** Badge nhỏ màu xám "Iter 3" cạnh tiêu đề màn hình thuộc Iteration 3 */
export const Iter3Badge: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-300 shadow-2xs ${className}`}>
      Iter 3
    </span>
  );
};
