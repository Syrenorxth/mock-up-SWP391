import React, { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, FileText, Gauge, Target, MessageSquareText } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/common/Header';
import { KpiBadge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { KpiArticleItem, formatDate, formatDateTime } from '../../types';
import { fmtConverted, fmtScore, monthLabel } from '../../utils/kpi';
import { FinalizedBanner, ForecastPill, KpiRulesNote, MonthSelect, StatCard, useSectionKpi } from './kpiShared';

/** Bảng các bài được tính KPI – dùng chung cho màn chi tiết của Trưởng ban và KPI cá nhân */
export const KpiArticleTable: React.FC<{ items: KpiArticleItem[] }> = ({ items }) => {
  const { getGenre } = useApp();
  if (items.length === 0) {
    return (
      <EmptyState
        title="Chưa có bài nào được tính trong tháng"
        description="Chỉ bài ĐÃ ĐĂNG trong tháng (theo ngày đăng) mới được tính vào KPI."
      />
    );
  }
  const total = items.reduce((s, i) => s + i.converted, 0);
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-[11px] uppercase text-slate-500">
          <tr>
            <th className="px-5 py-3 text-left font-bold">Bài viết</th>
            <th className="px-4 py-3 text-left font-bold">Ngày đăng</th>
            <th className="px-4 py-3 text-left font-bold">Vai trò trong bài</th>
            <th className="px-4 py-3 text-right font-bold">Tỷ lệ</th>
            <th className="px-4 py-3 text-right font-bold">Bài quy đổi</th>
            <th className="px-4 py-3 text-right font-bold">Điểm hiệu lực</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map(i => (
            <tr key={i.article_id}>
              <td className="px-5 py-3">
                <Link to={`/articles/${i.article_id}`} className="font-semibold text-blue-900 hover:underline">
                  {i.title}
                </Link>
                <div className="text-xs text-slate-500">{getGenre(i.category_id)?.name}</div>
              </td>
              <td className="px-4 py-3 text-xs text-slate-600">{formatDate(i.published_at)}</td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    i.is_main ? 'bg-blue-50 text-blue-800' : 'bg-violet-50 text-violet-800'
                  }`}
                >
                  {i.is_main ? 'Tác giả chính' : 'Đồng tác giả'}
                </span>
              </td>
              <td className="px-4 py-3 text-right text-slate-700">{i.share_percent}%</td>
              <td className="px-4 py-3 text-right font-bold text-slate-900">{fmtConverted(i.converted)}</td>
              <td className="px-4 py-3 text-right">
                <span className="font-bold text-slate-900">{fmtScore(i.effective_score)}</span>
                {i.score_changed_by_appeal && i.original_score !== undefined && (
                  <div className="text-[11px] text-amber-700">
                    {fmtScore(i.original_score)} → {fmtScore(i.effective_score)} sau khiếu nại
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-slate-50/70 text-xs">
          <tr>
            <td className="px-5 py-2.5 font-bold text-slate-700" colSpan={4}>Tổng số bài quy đổi</td>
            <td className="px-4 py-2.5 text-right text-sm font-black text-blue-900">{fmtConverted(total)}</td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

/**
 * LUỒNG 05 – Chi tiết KPI của 1 phóng viên (use case View Reporter KPI Details)
 */
export const ReporterKpiDetailScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { state, getUser } = useApp();
  const reporter = getUser(id);
  const [period, setPeriod] = useState({
    month: Number(params.get('month')) || 9,
    year: Number(params.get('year')) || 2026
  });
  const sectionId = reporter?.section_id || 'sec-xahoi';
  const { rows, monthClose } = useSectionKpi(sectionId, period.month, period.year);
  const row = rows.find(r => r.user.id === id);
  const closedKeys = state.kpiMonthCloses.filter(c => c.section_id === sectionId).map(c => `${c.year}-${c.month}`);

  if (!reporter || !row) {
    return <EmptyState title="Không tìm thấy phóng viên" description="Phóng viên không tồn tại hoặc không thuộc ban." />;
  }

  const ta = row.snapshot ? row.snapshot.target_articles : row.target?.target_articles;
  const tq = row.snapshot ? row.snapshot.target_quality : row.target?.target_quality;

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: 'Bảng KPI của ban', link: '/kpi/section' }, { label: reporter.full_name }]}
        title={`KPI chi tiết – ${reporter.full_name}`}
        description={`${reporter.job_title || 'Phóng viên'} · ${monthLabel(period.month, period.year)}. Danh sách bài được tính, tỷ lệ đồng tác giả và điểm hiệu lực.`}
        actions={
          <>
            <button
              onClick={() => navigate('/kpi/section')}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="w-4 h-4" /> Bảng KPI của ban
            </button>
            <MonthSelect value={period} onChange={setPeriod} closedKeys={closedKeys} />
          </>
        }
      />

      {monthClose && <FinalizedBanner at={formatDateTime(monthClose.finalized_at)} by={getUser(monthClose.finalized_by)?.full_name} />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Chỉ tiêu" value={ta !== undefined ? `${fmtConverted(ta)} bài` : '—'} hint={tq !== undefined ? `Điểm TB tối thiểu ${tq}` : 'Chưa giao'} icon={<Target className="w-4 h-4" />} />
        <StatCard label="Bài quy đổi" value={fmtConverted(row.summary.converted)} tone="blue" hint={ta ? `Hoàn thành ${row.summary.completionPct}%` : undefined} icon={<FileText className="w-4 h-4" />} />
        <StatCard label="Điểm hiệu lực TB" value={fmtScore(row.summary.avgScore)} tone={row.summary.qualityOk ? 'slate' : 'rose'} hint="Bình quân gia quyền theo tỷ lệ" icon={<Gauge className="w-4 h-4" />} />
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
            {monthClose ? 'Kết quả chính thức' : 'Kết quả hiện tại'}
          </span>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {ta !== undefined ? <KpiBadge result={row.summary.result} /> : <span className="text-sm text-slate-400">—</span>}
            {!monthClose && ta !== undefined && row.summary.result !== 'DAT' && <ForecastPill {...row.forecast} />}
          </div>
        </div>
      </div>

      {row.snapshot?.comment && (
        <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <MessageSquareText className="w-4 h-4 mt-0.5 shrink-0" />
          <span><b>Nhận xét của Trưởng ban:</b> {row.snapshot.comment}</span>
        </div>
      )}

      <KpiArticleTable items={row.items} />
      <KpiRulesNote />
    </div>
  );
};
