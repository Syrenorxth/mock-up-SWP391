import React, { useMemo } from 'react';
import { Lock, CalendarDays } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { KpiArticleItem, KpiSnapshot, KpiTarget, User } from '../../types';
import {
  forecastKpi,
  kpiItemsFor,
  KpiDataSource,
  KpiSummary,
  MONTH_OPTIONS,
  summarizeKpi
} from '../../utils/kpi';

/** Bảng màu biểu đồ đã kiểm tra (độ tương phản, mù màu) – dùng chung cho luồng 05 */
export const CHART_COLORS = {
  actual: '#2563eb',
  target: '#d97706',
  third: '#0d9488',
  grid: '#e2e8f0',
  axis: '#64748b'
};

export const EVENT_COLORS = ['#2563eb', '#d97706', '#0d9488'];

export const CURRENT_MONTH = { month: 9, year: 2026 };

export interface ReporterKpiRow {
  user: User;
  target?: KpiTarget;
  finalized: boolean;
  snapshot?: KpiSnapshot;
  items: KpiArticleItem[];
  summary: KpiSummary;
  forecast: { label: string; tone: 'slate' | 'emerald' | 'blue' | 'amber' | 'rose' };
}

export const useKpiDataSource = (): KpiDataSource => {
  const { state } = useApp();
  return useMemo(
    () => ({
      articles: state.articles,
      articleAuthors: state.articleAuthors,
      appeals: state.appeals,
      scoringAttempts: state.scoringAttempts,
      qualityScores: state.qualityScores
    }),
    [state.articles, state.articleAuthors, state.appeals, state.scoringAttempts, state.qualityScores]
  );
};

/** Dữ liệu KPI của cả ban trong 1 tháng: tháng đã chốt đọc snapshot, tháng đang chạy tính trực tiếp */
export const useSectionKpi = (sectionId: string, month: number, year: number) => {
  const { state } = useApp();
  const ds = useKpiDataSource();
  const monthClose = state.kpiMonthCloses.find(c => c.section_id === sectionId && c.month === month && c.year === year);
  const reporters = state.users.filter(u => u.role_code === 'PHONG_VIEN' && u.section_id === sectionId);

  const rows: ReporterKpiRow[] = useMemo(
    () =>
      reporters.map(user => {
        const target = state.kpiTargets.find(t => t.user_id === user.id && t.month === month && t.year === year);
        const snapshot = monthClose
          ? state.kpiSnapshots.find(k => k.user_id === user.id && k.month === month && k.year === year)
          : undefined;
        const items = snapshot ? snapshot.items : kpiItemsFor(ds, user.id, month, year);
        const t = snapshot
          ? { target_articles: snapshot.target_articles, target_quality: snapshot.target_quality }
          : target;
        const summary = summarizeKpi(items, t);
        if (snapshot) summary.result = snapshot.result;
        return {
          user,
          target,
          finalized: !!monthClose,
          snapshot,
          items,
          summary,
          forecast: forecastKpi(summary, target, month, year)
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [reporters.map(r => r.id).join(','), state.kpiTargets, state.kpiSnapshots, monthClose, ds, month, year]
  );

  return { rows, monthClose, reporters };
};

export const MonthSelect: React.FC<{
  value: { month: number; year: number };
  onChange: (v: { month: number; year: number }) => void;
  includeFuture?: boolean;
  closedKeys?: string[];
}> = ({ value, onChange, includeFuture = false, closedKeys = [] }) => {
  const options = MONTH_OPTIONS.filter(o => includeFuture || o.month <= CURRENT_MONTH.month);
  return (
    <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-xs">
      <CalendarDays className="w-4 h-4 text-slate-400" />
      <span>Kỳ KPI:</span>
      <select
        value={`${value.year}-${value.month}`}
        onChange={e => {
          const [y, m] = e.target.value.split('-').map(Number);
          onChange({ month: m, year: y });
        }}
        className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
      >
        {options.map(o => (
          <option key={o.label} value={`${o.year}-${o.month}`}>
            {o.label}
            {closedKeys.includes(`${o.year}-${o.month}`) ? ' · đã chốt' : o.month === CURRENT_MONTH.month ? ' · đang chạy' : o.month > CURRENT_MONTH.month ? ' · sắp tới' : ''}
          </option>
        ))}
      </select>
    </label>
  );
};

export const StatCard: React.FC<{
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: 'blue' | 'emerald' | 'amber' | 'rose' | 'slate';
}> = ({ label, value, hint, icon, tone = 'slate' }) => {
  const toneCls: Record<string, string> = {
    blue: 'text-blue-800',
    emerald: 'text-emerald-700',
    amber: 'text-amber-700',
    rose: 'text-rose-700',
    slate: 'text-slate-900'
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">{label}</span>
        {icon && <span className="text-slate-400">{icon}</span>}
      </div>
      <div className={`mt-2 text-2xl font-black ${toneCls[tone]}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
    </div>
  );
};

export const ForecastPill: React.FC<{ label: string; tone: ReporterKpiRow['forecast']['tone'] }> = ({ label, tone }) => {
  const cls: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-600 border-slate-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    amber: 'bg-amber-50 text-amber-800 border-amber-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200'
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${cls[tone]}`}>
      {label}
    </span>
  );
};

export const FinalizedBanner: React.FC<{ at: string; by?: string }> = ({ at, by }) => (
  <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-100 px-4 py-2.5 text-xs text-slate-700">
    <Lock className="w-4 h-4 text-slate-500 shrink-0" />
    <span>
      Tháng này <b>đã chốt KPI</b> lúc {at}{by ? ` bởi ${by}` : ''}. Số liệu hiển thị là <b>snapshot</b> tại thời điểm chốt – điểm có
      thay đổi về sau (ví dụ do khiếu nại) cũng không làm đổi kết quả.
    </span>
  </div>
);

export const KpiRulesNote: React.FC = () => (
  <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-xs text-slate-700 leading-relaxed">
    <b className="text-blue-900">Quy tắc tính KPI:</b> KPI chỉ có 2 kết quả <b>Đạt / Chưa đạt</b> · Bài đồng tác giả tính theo tỷ lệ
    (60/40 → 0,6 và 0,4 <i>bài quy đổi</i>) · Bài tính vào tháng theo <b>ngày đăng</b> · Dùng <b>điểm hiệu lực</b> (sau khiếu nại nếu có),
    điểm trung bình là bình quân gia quyền theo tỷ lệ · Số liệu độc giả <b>không</b> tính vào KPI.
  </div>
);
