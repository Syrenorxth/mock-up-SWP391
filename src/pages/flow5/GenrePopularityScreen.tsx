import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight, Info, Trophy } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/common/Header';
import { Iter3Badge } from '../../components/common/Badge';
import { formatDate, formatMoney } from '../../types';
import { fmtScore } from '../../utils/kpi';
import { BAYES_PRIOR_WEIGHT, buildGenreReport, latestReaderDate, MIN_ARTICLES_K } from '../../utils/readerReports';
import { CHART_COLORS, useKpiDataSource } from './kpiShared';

const RANGES = [
  { key: 'Q', label: 'Tháng 06 – 09/2026', from: '2026-06', to: '2026-09' },
  { key: '06', label: 'Tháng 06/2026', from: '2026-06', to: '2026-06' },
  { key: '07', label: 'Tháng 07/2026', from: '2026-07', to: '2026-07' },
  { key: '08', label: 'Tháng 08/2026', from: '2026-08', to: '2026-08' },
  { key: '09', label: 'Tháng 09/2026', from: '2026-09', to: '2026-09' }
];

const fmtCost = (n: number | null) => (n === null ? '—' : formatMoney(Math.round(n / 100) * 100));

/**
 * LUỒNG 05 – Báo cáo ưa chuộng theo thể loại (use case View Genre Popularity Report)
 */
export const GenrePopularityScreen: React.FC = () => {
  const { state } = useApp();
  const ds = useKpiDataSource();
  const [rangeKey, setRangeKey] = useState('Q');
  const [open, setOpen] = useState<string | null>('cat-phongsu');
  const range = RANGES.find(r => r.key === rangeKey)!;

  const { rows, globalMean } = useMemo(
    () => buildGenreReport(ds, state.genres, state.readerDaily, state.royaltyLines, range.from, range.to),
    [ds, state.genres, state.readerDaily, state.royaltyLines, range.from, range.to]
  );
  const chartData = rows.filter(r => r.enough).map(r => ({ name: r.genre.name, views: r.avgViews }));

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: 'Báo cáo ưa chuộng theo thể loại' }]}
        title="Báo cáo ưa chuộng theo thể loại"
        description={`"Loại báo" = thể loại bài. Xếp hạng theo lượt xem trung bình/bài, kèm trung vị, rating trung bình Bayes, chi nhuận bút trên 1.000 lượt xem và điểm chất lượng TB. Số liệu độc giả đến hết ${formatDate(latestReaderDate(state.readerDaily))}.`}
        actions={
          <>
            <Iter3Badge />
            <select
              value={rangeKey}
              onChange={e => setRangeKey(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900"
            >
              {RANGES.map(r => (
                <option key={r.key} value={r.key}>Bài đăng {r.label}</option>
              ))}
            </select>
          </>
        }
      />

      <div className="flex gap-2 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-xs text-slate-700 leading-relaxed">
        <Info className="w-4 h-4 mt-0.5 shrink-0 text-blue-800" />
        <div>
          <b>Cách tính:</b> Rating Bayes = (C × m + tổng điểm rating) / (C + số lượt rating), với m = {globalMean.toFixed(2).replace('.', ',')} là rating TB toàn hệ thống,
          C = {BAYES_PRIOR_WEIGHT}. Chi / 1.000 lượt xem = tổng nhuận bút đã chấm (kể cả dòng điều chỉnh, tiền ảnh) ÷ (lượt xem / 1.000), chỉ tính bài đã chấm nhuận bút.
          Thể loại có ít hơn k = {MIN_ARTICLES_K} bài ghi <b>"Không đủ dữ liệu"</b> và không xếp hạng.
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900">Lượt xem trung bình / bài (thể loại đủ dữ liệu)</h2>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 24, left: 24, bottom: 0 }}>
                <CartesianGrid horizontal={false} stroke={CHART_COLORS.grid} />
                <XAxis type="number" tick={{ fontSize: 12, fill: CHART_COLORS.axis }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12, fill: '#0f172a' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} formatter={(v: any) => [Number(v).toLocaleString('vi-VN') + ' lượt', 'Lượt xem TB/bài']} />
                <Bar isAnimationActive={false} dataKey="views" fill={CHART_COLORS.actual} radius={[0, 4, 4, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-[11px] uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left font-bold">Hạng</th>
              <th className="px-4 py-3 text-left font-bold">Thể loại</th>
              <th className="px-4 py-3 text-right font-bold">Số bài</th>
              <th className="px-4 py-3 text-right font-bold">Lượt xem TB/bài</th>
              <th className="px-4 py-3 text-right font-bold">Trung vị</th>
              <th className="px-4 py-3 text-right font-bold">Rating Bayes</th>
              <th className="px-4 py-3 text-right font-bold">Chi / 1.000 lượt xem</th>
              <th className="px-4 py-3 text-right font-bold">Điểm CL TB</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(r => {
              const isOpen = open === r.genre.id;
              return (
                <React.Fragment key={r.genre.id}>
                  <tr className="cursor-pointer hover:bg-slate-50" onClick={() => setOpen(isOpen ? null : r.genre.id)}>
                    <td className="px-4 py-3">
                      {r.rank ? (
                        <span className={`inline-flex items-center gap-1 font-black ${r.rank === 1 ? 'text-amber-700' : 'text-slate-700'}`}>
                          {r.rank === 1 && <Trophy className="w-4 h-4" />}#{r.rank}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                        {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                        {r.genre.name}
                      </div>
                      {!r.enough && <div className="ml-5 text-[11px] font-semibold text-slate-500">Không đủ dữ liệu (&lt; {MIN_ARTICLES_K} bài)</div>}
                    </td>
                    <td className="px-4 py-3 text-right">{r.articleCount}</td>
                    <td className={`px-4 py-3 text-right font-bold ${r.enough ? 'text-slate-900' : 'text-slate-400'}`}>{r.avgViews.toLocaleString('vi-VN')}</td>
                    <td className={`px-4 py-3 text-right ${r.enough ? '' : 'text-slate-400'}`}>{r.medianViews.toLocaleString('vi-VN')}</td>
                    <td className={`px-4 py-3 text-right ${r.enough ? '' : 'text-slate-400'}`}>
                      {r.bayesRating !== null ? r.bayesRating.toFixed(2).replace('.', ',') : '—'}
                      <div className="text-[11px] text-slate-400">{r.ratingCount.toLocaleString('vi-VN')} lượt</div>
                    </td>
                    <td className={`px-4 py-3 text-right ${r.enough ? '' : 'text-slate-400'}`}>
                      {fmtCost(r.costPer1000)}
                      <div className="text-[11px] text-slate-400">{r.costArticles}/{r.articleCount} bài đã chấm NB</div>
                    </td>
                    <td className={`px-4 py-3 text-right ${r.enough ? '' : 'text-slate-400'}`}>{fmtScore(r.avgQuality)}</td>
                  </tr>
                  {isOpen && (
                    <tr className="bg-slate-50/60">
                      <td colSpan={8} className="px-6 py-3">
                        <table className="w-full text-xs">
                          <thead className="text-slate-500">
                            <tr>
                              <th className="py-1 text-left">Bài</th>
                              <th className="py-1 text-left">Ngày đăng</th>
                              <th className="py-1 text-right">Lượt xem</th>
                              <th className="py-1 text-right">Rating</th>
                              <th className="py-1 text-right">Nhuận bút đã chi</th>
                              <th className="py-1 text-right">Chi / 1.000 lượt xem</th>
                              <th className="py-1 text-right">Điểm hiệu lực</th>
                            </tr>
                          </thead>
                          <tbody>
                            {r.articles.map(a => (
                              <tr key={a.article.id} className={`border-t border-slate-200/70 ${a.article.id === 'art-nuocsach' ? 'bg-amber-50' : ''}`}>
                                <td className="py-1.5 pr-3">
                                  <Link to={`/articles/${a.article.id}`} className="font-semibold text-blue-900 hover:underline">{a.article.title}</Link>
                                </td>
                                <td className="py-1.5">{formatDate(a.article.published_at)}</td>
                                <td className="py-1.5 text-right">{a.views.toLocaleString('vi-VN')}</td>
                                <td className="py-1.5 text-right">{a.rating !== null ? a.rating.toFixed(2).replace('.', ',') : '—'}</td>
                                <td className="py-1.5 text-right">{a.royalty !== null ? formatMoney(a.royalty) : 'Chưa chấm'}</td>
                                <td className="py-1.5 text-right font-semibold">{a.costPer1000 !== null ? `≈ ${fmtCost(a.costPer1000)}` : '—'}</td>
                                <td className="py-1.5 text-right">{fmtScore(a.score)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
