import React, { useMemo, useState } from 'react';
import { Flame, TrendingDown, Minus, HelpCircle, Info, Table2 } from 'lucide-react';
import { CartesianGrid, Legend, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/common/Header';
import { Iter3Badge } from '../../components/common/Badge';
import { formatDate } from '../../types';
import { buildTrendingReport, TRENDING_RATIO, TrendingRow } from '../../utils/readerReports';
import { CHART_COLORS, EVENT_COLORS } from './kpiShared';

const StatusPill: React.FC<{ status: TrendingRow['status'] }> = ({ status }) => {
  switch (status) {
    case 'DANG_NOI':
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-rose-300 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700">
          <Flame className="w-3.5 h-3.5" /> Đang nổi
        </span>
      );
    case 'DANG_GIAM':
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
          <TrendingDown className="w-3.5 h-3.5" /> Đang giảm
        </span>
      );
    case 'BINH_THUONG':
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
          <Minus className="w-3.5 h-3.5" /> Bình thường
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-500">
          <HelpCircle className="w-3.5 h-3.5" /> Chưa đủ dữ liệu
        </span>
      );
  }
};

const shortDate = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;

/**
 * LUỒNG 05 – Báo cáo sự kiện đang nổi (use case View Trending Events Report)
 * Tỷ số = lượt xem 7 ngày gần nhất / trung bình 7 ngày của 4 tuần trước; > 2 → "Đang nổi".
 */
export const TrendingEventsScreen: React.FC = () => {
  const { state } = useApp();
  const [showTable, setShowTable] = useState(false);
  const report = useMemo(
    () => buildTrendingReport(state.articles, state.events, state.readerDaily),
    [state.articles, state.events, state.readerDaily]
  );

  const chartEvents = report.rows.filter(r => r.articleCount > 0).slice(0, 3);
  const chartData = (chartEvents[0]?.daily || []).map((d, i) => {
    const point: Record<string, any> = { date: d.date, label: shortDate(d.date) };
    chartEvents.forEach(ev => (point[ev.event.id] = ev.daily[i]?.views ?? 0));
    return point;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: 'Sự kiện đang nổi' }]}
        title="Báo cáo sự kiện đang nổi"
        description={`So sánh lượt xem 7 ngày gần nhất (${formatDate(report.windowStart)} – ${formatDate(report.windowEnd)}) với trung bình 7 ngày của 4 tuần trước đó (${formatDate(report.baseStart)} – ${formatDate(report.baseEnd)}). Tỷ số > ${TRENDING_RATIO} → sự kiện đang nổi.`}
        actions={<Iter3Badge />}
      />

      <div className="flex gap-2 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-xs text-slate-700">
        <Info className="w-4 h-4 mt-0.5 shrink-0 text-blue-800" />
        <span>
          Lượt xem của sự kiện = tổng lượt xem các bài đã đăng gắn sự kiện đó (từ số liệu độc giả đã nhập). Báo cáo tự cập nhật sau mỗi lần Admin nhập CSV.
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-[11px] uppercase text-slate-500">
            <tr>
              <th className="px-5 py-3 text-left font-bold">Sự kiện</th>
              <th className="px-4 py-3 text-right font-bold">Số bài</th>
              <th className="px-4 py-3 text-right font-bold">Lượt xem 7 ngày gần nhất</th>
              <th className="px-4 py-3 text-right font-bold">TB 7 ngày của 4 tuần trước</th>
              <th className="px-4 py-3 text-right font-bold">Tỷ số</th>
              <th className="px-4 py-3 text-left font-bold">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {report.rows.map(r => (
              <tr key={r.event.id} className={r.status === 'DANG_NOI' ? 'bg-rose-50/30' : ''}>
                <td className="px-5 py-3">
                  <div className="font-semibold text-slate-900">{r.event.name}</div>
                  <div className="text-xs text-slate-500">Bắt đầu {formatDate(r.event.start_date)}</div>
                </td>
                <td className="px-4 py-3 text-right">{r.articleCount}</td>
                <td className="px-4 py-3 text-right font-bold text-slate-900">{r.last7.toLocaleString('vi-VN')}</td>
                <td className="px-4 py-3 text-right">{r.prevWeeklyAvg.toLocaleString('vi-VN')}</td>
                <td className="px-4 py-3 text-right font-black text-slate-900">
                  {r.ratio !== null ? r.ratio.toFixed(2).replace('.', ',') : '—'}
                </td>
                <td className="px-4 py-3"><StatusPill status={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {chartEvents.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Lượt xem theo ngày (5 tuần gần nhất)</h2>
            <button
              onClick={() => setShowTable(!showTable)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              <Table2 className="w-3.5 h-3.5" /> {showTable ? 'Ẩn bảng số liệu' : 'Xem dạng bảng'}
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-500">Vùng tô nhạt là cửa sổ 7 ngày gần nhất.</p>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: CHART_COLORS.axis }} axisLine={false} tickLine={false} interval={4} />
                <YAxis tick={{ fontSize: 11, fill: CHART_COLORS.axis }} axisLine={false} tickLine={false} />
                <ReferenceArea x1={shortDate(report.windowStart)} x2={shortDate(report.windowEnd)} fill="#fde68a" fillOpacity={0.25} />
                <Tooltip formatter={(v: any, n: any) => [Number(v).toLocaleString('vi-VN') + ' lượt', n]} />
                <Legend wrapperStyle={{ fontSize: 12 }} formatter={(v: any) => <span style={{ color: '#334155' }}>{v}</span>} />
                {chartEvents.map((ev, i) => (
                  <Line isAnimationActive={false}
                    key={ev.event.id}
                    type="monotone"
                    dataKey={ev.event.id}
                    name={ev.event.name}
                    stroke={EVENT_COLORS[i % EVENT_COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          {showTable && (
            <div className="mt-3 max-h-64 overflow-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-white text-slate-500">
                  <tr>
                    <th className="py-1 text-left">Ngày</th>
                    {chartEvents.map(ev => <th key={ev.event.id} className="py-1 text-right">{ev.event.name}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {chartData.map(d => (
                    <tr key={d.date} className="border-t border-slate-100">
                      <td className="py-1">{formatDate(d.date)}</td>
                      {chartEvents.map(ev => <td key={ev.event.id} className="py-1 text-right">{Number(d[ev.event.id]).toLocaleString('vi-VN')}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
