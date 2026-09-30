import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Users, CheckCircle2, Gauge, ChevronRight, Table2 } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/common/Header';
import { KpiBadge } from '../../components/common/Badge';
import { fmtConverted, fmtScore, monthLabel } from '../../utils/kpi';
import { formatDateTime } from '../../types';
import {
  CHART_COLORS,
  CURRENT_MONTH,
  FinalizedBanner,
  ForecastPill,
  KpiRulesNote,
  MonthSelect,
  StatCard,
  useSectionKpi
} from './kpiShared';

/**
 * LUỒNG 05 – Bảng KPI của ban (use case View Department KPI Board)
 */
export const SectionKpiScreen: React.FC = () => {
  const { state, getUser } = useApp();
  const navigate = useNavigate();
  const sectionId = state.currentUser.role_code === 'TRUONG_BAN' ? state.currentUser.section_id : 'sec-xahoi';
  const section = state.sections.find(s => s.id === sectionId);
  const [period, setPeriod] = useState(CURRENT_MONTH);
  const [showTable, setShowTable] = useState(false);
  const { rows, monthClose } = useSectionKpi(sectionId, period.month, period.year);
  const closedKeys = state.kpiMonthCloses.filter(c => c.section_id === sectionId).map(c => `${c.year}-${c.month}`);

  const withTarget = rows.filter(r => r.target || r.snapshot);
  const passCount = rows.filter(r => (r.target || r.snapshot) && r.summary.result === 'DAT').length;
  const totalConverted = rows.reduce((s, r) => s + r.summary.converted, 0);
  const allItems = rows.flatMap(r => r.items.filter(i => i.effective_score !== undefined));
  const w = allItems.reduce((s, i) => s + i.converted, 0);
  const sectionAvg = w > 0 ? allItems.reduce((s, i) => s + (i.effective_score as number) * i.converted, 0) / w : null;

  const chartData = rows.map(r => ({
    name: r.user.full_name.split(' ').slice(-1)[0],
    fullName: r.user.full_name,
    actual: r.summary.converted,
    target: r.snapshot ? r.snapshot.target_articles : r.target?.target_articles ?? 0
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: 'Bảng KPI của ban' }]}
        title={`Bảng KPI – ${section?.name || ''}`}
        description="Theo dõi tiến độ chỉ tiêu của từng phóng viên trong tháng. Tháng đang chạy tính trực tiếp từ bài đã đăng; tháng đã chốt đọc snapshot."
        actions={<MonthSelect value={period} onChange={setPeriod} closedKeys={closedKeys} />}
      />

      {monthClose && <FinalizedBanner at={formatDateTime(monthClose.finalized_at)} by={getUser(monthClose.finalized_by)?.full_name} />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Phóng viên có chỉ tiêu" value={`${withTarget.length}/${rows.length}`} icon={<Users className="w-4 h-4" />} hint={monthLabel(period.month, period.year)} />
        <StatCard
          label={monthClose ? 'Đạt KPI (chính thức)' : 'Đạt KPI đến hiện tại'}
          value={`${passCount}/${withTarget.length || rows.length}`}
          tone="emerald"
          icon={<CheckCircle2 className="w-4 h-4" />}
          hint={withTarget.length ? `Tỷ lệ đạt ${Math.round((passCount / withTarget.length) * 100)}%` : '—'}
        />
        <StatCard label="Tổng bài quy đổi của ban" value={fmtConverted(totalConverted)} tone="blue" icon={<BarChart3 className="w-4 h-4" />} hint="Bài đồng tác giả chia theo tỷ lệ" />
        <StatCard label="Điểm hiệu lực TB của ban" value={fmtScore(sectionAvg)} icon={<Gauge className="w-4 h-4" />} hint="Bình quân gia quyền theo tỷ lệ" />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Chỉ tiêu và bài quy đổi thực tế theo phóng viên</h2>
          <button
            onClick={() => setShowTable(!showTable)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            <Table2 className="w-3.5 h-3.5" /> {showTable ? 'Ẩn bảng số liệu' : 'Xem dạng bảng'}
          </button>
        </div>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barGap={2} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: CHART_COLORS.axis }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: CHART_COLORS.axis }} axisLine={false} tickLine={false} allowDecimals />
              <Tooltip
                cursor={{ fill: '#f1f5f9' }}
                formatter={(v: any, n: any) => [fmtConverted(Number(v)) + ' bài', n]}
                labelFormatter={(_l: any, p: any) => p?.[0]?.payload?.fullName || ''}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} formatter={(v: any) => <span style={{ color: '#334155' }}>{v}</span>} />
              <Bar isAnimationActive={false} dataKey="target" name="Chỉ tiêu" fill={CHART_COLORS.target} radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar isAnimationActive={false} dataKey="actual" name="Bài quy đổi thực tế" fill={CHART_COLORS.actual} radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {showTable && (
          <table className="mt-3 w-full text-xs">
            <thead className="text-slate-500">
              <tr><th className="py-1 text-left">Phóng viên</th><th className="text-right">Chỉ tiêu</th><th className="text-right">Thực tế</th></tr>
            </thead>
            <tbody>
              {chartData.map(d => (
                <tr key={d.fullName} className="border-t border-slate-100">
                  <td className="py-1">{d.fullName}</td>
                  <td className="text-right">{fmtConverted(d.target)}</td>
                  <td className="text-right">{fmtConverted(d.actual)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-[11px] uppercase text-slate-500">
            <tr>
              <th className="px-5 py-3 text-left font-bold">Phóng viên</th>
              <th className="px-4 py-3 text-right font-bold">Chỉ tiêu</th>
              <th className="px-4 py-3 text-right font-bold">Bài quy đổi</th>
              <th className="px-4 py-3 text-left font-bold">Hoàn thành</th>
              <th className="px-4 py-3 text-right font-bold">Điểm TB / chuẩn</th>
              <th className="px-4 py-3 text-left font-bold">{monthClose ? 'Kết quả chính thức' : 'Kết quả hiện tại · dự báo'}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(r => {
              const ta = r.snapshot ? r.snapshot.target_articles : r.target?.target_articles;
              const tq = r.snapshot ? r.snapshot.target_quality : r.target?.target_quality;
              const pct = r.summary.completionPct;
              return (
                <tr
                  key={r.user.id}
                  className="cursor-pointer hover:bg-slate-50"
                  onClick={() => navigate(`/kpi/reporters/${r.user.id}?month=${period.month}&year=${period.year}`)}
                >
                  <td className="px-5 py-3">
                    <div className="font-semibold text-blue-900 hover:underline">{r.user.full_name}</div>
                    <div className="text-xs text-slate-500">{r.items.length} bài được tính</div>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700">{ta !== undefined ? `${fmtConverted(ta)} bài` : '—'}</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900">{fmtConverted(r.summary.converted)}</td>
                  <td className="px-4 py-3">
                    {ta !== undefined ? (
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${pct >= 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-slate-700">{pct}%</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">Chưa giao chỉ tiêu</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-xs">
                    <span className={`font-bold ${r.summary.qualityOk ? 'text-slate-900' : 'text-rose-700'}`}>{fmtScore(r.summary.avgScore)}</span>
                    <span className="text-slate-400"> / {tq ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    {ta === undefined ? (
                      <span className="text-xs text-slate-400">—</span>
                    ) : monthClose ? (
                      <KpiBadge result={r.summary.result} />
                    ) : (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <KpiBadge result={r.summary.result} size="sm" />
                        {r.summary.result !== 'DAT' && <ForecastPill {...r.forecast} />}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-400"><ChevronRight className="w-4 h-4" /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <KpiRulesNote />
    </div>
  );
};
