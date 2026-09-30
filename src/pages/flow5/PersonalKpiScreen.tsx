import React, { useState } from 'react';
import { UserCheck, Lock, TrendingUp, MessageSquareText } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/common/Header';
import { KpiBadge } from '../../components/common/Badge';
import { formatDateTime } from '../../types';
import { fmtConverted, fmtScore, monthLabel } from '../../utils/kpi';
import { KpiArticleTable } from './ReporterKpiDetailScreen';
import { CURRENT_MONTH, FinalizedBanner, ForecastPill, KpiRulesNote, MonthSelect, useSectionKpi } from './kpiShared';

/**
 * LUỒNG 05 – KPI cá nhân (use case View Personal KPI & Progress, View Final KPI Result)
 */
export const PersonalKpiScreen: React.FC = () => {
  const { state, getUser } = useApp();
  const me = state.currentUser.role_code === 'PHONG_VIEN' ? state.currentUser : state.users.find(u => u.id === 'u-an')!;
  const [period, setPeriod] = useState(CURRENT_MONTH);
  const { rows, monthClose } = useSectionKpi(me.section_id, period.month, period.year);
  const row = rows.find(r => r.user.id === me.id)!;
  const closedKeys = state.kpiMonthCloses.filter(c => c.section_id === me.section_id).map(c => `${c.year}-${c.month}`);
  const history = state.kpiSnapshots
    .filter(k => k.user_id === me.id)
    .sort((a, b) => b.year * 100 + b.month - (a.year * 100 + a.month));

  const ta = row?.snapshot ? row.snapshot.target_articles : row?.target?.target_articles;
  const tq = row?.snapshot ? row.snapshot.target_quality : row?.target?.target_quality;
  const pct = row?.summary.completionPct ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: 'KPI cá nhân' }]}
        title={`KPI cá nhân – ${me.full_name}`}
        description="Theo dõi chỉ tiêu tháng, số bài quy đổi đã đạt và kết quả chính thức của các tháng đã chốt."
        actions={<MonthSelect value={period} onChange={setPeriod} closedKeys={closedKeys} />}
      />

      {monthClose && <FinalizedBanner at={formatDateTime(monthClose.finalized_at)} by={getUser(monthClose.finalized_by)?.full_name} />}

      {row && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                {monthClose ? <Lock className="w-4 h-4 text-slate-500" /> : <TrendingUp className="w-4 h-4 text-blue-700" />}
                {monthClose ? 'Kết quả chính thức' : 'Tiến độ'} {monthLabel(period.month, period.year)}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {ta !== undefined
                  ? `Chỉ tiêu: ${fmtConverted(ta)} bài quy đổi · điểm chất lượng TB tối thiểu ${tq}`
                  : 'Trưởng ban chưa giao chỉ tiêu cho tháng này.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {ta !== undefined && <KpiBadge result={row.summary.result} />}
              {!monthClose && ta !== undefined && row.summary.result !== 'DAT' && <ForecastPill {...row.forecast} />}
            </div>
          </div>

          {ta !== undefined && (
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div>
                <div className="flex items-baseline justify-between text-xs text-slate-600">
                  <span>Bài quy đổi</span>
                  <span>
                    <b className="text-lg text-slate-900">{fmtConverted(row.summary.converted)}</b> / {fmtConverted(ta)} bài
                  </span>
                </div>
                <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${pct >= 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
                <div className="mt-1 text-right text-xs font-semibold text-slate-600">{pct}%</div>
              </div>
              <div>
                <div className="flex items-baseline justify-between text-xs text-slate-600">
                  <span>Điểm hiệu lực trung bình</span>
                  <span>
                    <b className={`text-lg ${row.summary.qualityOk ? 'text-slate-900' : 'text-rose-700'}`}>{fmtScore(row.summary.avgScore)}</b> / chuẩn {tq}
                  </span>
                </div>
                <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${row.summary.qualityOk ? 'bg-emerald-500' : 'bg-rose-500'}`}
                    style={{ width: `${Math.min(100, row.summary.avgScore ?? 0)}%` }}
                  />
                </div>
                <div className="mt-1 text-right text-xs text-slate-500">Bình quân gia quyền theo tỷ lệ đồng tác giả</div>
              </div>
            </div>
          )}

          {row.snapshot?.comment && (
            <div className="mt-4 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <MessageSquareText className="w-4 h-4 mt-0.5 shrink-0" />
              <span><b>Nhận xét của Trưởng ban:</b> {row.snapshot.comment}</span>
            </div>
          )}
        </div>
      )}

      <div>
        <h2 className="mb-3 text-sm font-bold text-slate-900">Các bài được tính KPI {monthLabel(period.month, period.year)}</h2>
        <KpiArticleTable items={row?.items || []} />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3 text-sm font-bold text-slate-900">
          <UserCheck className="w-4 h-4 text-blue-800" /> Kết quả KPI các tháng đã chốt
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-[11px] uppercase text-slate-500">
            <tr>
              <th className="px-5 py-2.5 text-left font-bold">Tháng</th>
              <th className="px-4 py-2.5 text-right font-bold">Chỉ tiêu</th>
              <th className="px-4 py-2.5 text-right font-bold">Bài quy đổi</th>
              <th className="px-4 py-2.5 text-right font-bold">Điểm TB / chuẩn</th>
              <th className="px-4 py-2.5 text-left font-bold">Kết quả</th>
              <th className="px-4 py-2.5 text-left font-bold">Nhận xét của Trưởng ban</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {history.map(h => (
              <tr key={h.id}>
                <td className="px-5 py-2.5 font-semibold text-slate-900">{monthLabel(h.month, h.year)}</td>
                <td className="px-4 py-2.5 text-right">{fmtConverted(h.target_articles)}</td>
                <td className="px-4 py-2.5 text-right font-bold">{fmtConverted(h.converted_articles)}</td>
                <td className="px-4 py-2.5 text-right">{fmtScore(h.avg_score)} / {h.target_quality}</td>
                <td className="px-4 py-2.5"><KpiBadge result={h.result} size="sm" /></td>
                <td className="px-4 py-2.5 text-xs text-slate-600">{h.comment || '—'}</td>
              </tr>
            ))}
            {history.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-4 text-center text-xs text-slate-500">Chưa có tháng nào được chốt.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <KpiRulesNote />
    </div>
  );
};
