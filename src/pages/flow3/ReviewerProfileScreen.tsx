import React, { useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/common/Header';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import {
  User,
  Scale,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Calendar,
  Layers,
  FileCheck,
  Columns,
  ShieldCheck,
  Award
} from 'lucide-react';
import { formatDateTime, formatDate } from '../../types';

export const ReviewerProfileScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, getUser, getGenre } = useApp();

  const reviewer = useMemo(() => {
    return state.users.find(u => u.id === id);
  }, [state.users, id]);

  const reviewerStat = useMemo(() => {
    return state.reviewerStats.find(r => r.editor_id === id);
  }, [state.reviewerStats, id]);

  // Các lần chấm thực hiện bởi BTV này
  const myGradingAttempts = useMemo(() => {
    return state.scoringAttempts
      .filter(sa => sa.scorer_id === id)
      .sort((a, b) => new Date(b.scored_at).getTime() - new Date(a.scored_at).getTime());
  }, [state.scoringAttempts, id]);

  // Các khiếu nại phát sinh từ lần chấm gốc của BTV này
  const appealsAgainstMe = useMemo(() => {
    return state.appeals.filter(ap => ap.original_scorer_id === id);
  }, [state.appeals, id]);

  // Dữ liệu mô phỏng biến thiên độ lệch theo 6 tháng gần nhất
  const monthlyDeviationData = useMemo(() => {
    const baseDev = reviewerStat?.avg_deviation ?? 0;
    return [
      { month: 'T05/2026', deviation: Number((baseDev - 0.8).toFixed(1)), gradedCount: 4 },
      { month: 'T06/2026', deviation: Number((baseDev - 0.2).toFixed(1)), gradedCount: 5 },
      { month: 'T07/2026', deviation: Number((baseDev + 1.1).toFixed(1)), gradedCount: 6 },
      { month: 'T08/2026', deviation: Number((baseDev + 0.4).toFixed(1)), gradedCount: 7 },
      { month: 'T09/2026', deviation: Number((baseDev).toFixed(1)), gradedCount: 6 },
      { month: 'T10/2026', deviation: Number((baseDev - 0.3).toFixed(1)), gradedCount: 2 }
    ];
  }, [reviewerStat]);

  if (!reviewer) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center space-y-4">
        <User className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900">Không tìm thấy Biên tập viên</h3>
        <p className="text-xs text-slate-500">Mã BTV #{id} không tồn tại trong hệ thống.</p>
        <Link
          to="/editor-lead/reviewer-deviation"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-900 text-white text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về báo cáo độ lệch</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <PageHeader
        breadcrumbs={[
          { label: 'Trang chủ', link: '/editor-lead/queue' },
          { label: 'Báo cáo độ lệch', link: '/editor-lead/reviewer-deviation' },
          { label: `Hồ sơ BTV: ${reviewer.full_name}` }
        ]}
        title={`Hồ sơ thẩm định & Lịch sử chấm: ${reviewer.full_name}`}
        description="Theo dõi chi tiết các chỉ số chuyên môn, độ lệch so với chuẩn và lịch sử các lần chấm của Biên tập viên."
        actions={
          <Link
            to="/editor-lead/reviewer-deviation"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại báo cáo</span>
          </Link>
        }
      />

      {/* Thông tin cá nhân & Thống kê nhanh */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Avatar & thông tin */}
        <div className="lg:col-span-4 flex items-center gap-4 border-b lg:border-b-0 lg:border-r border-slate-100 pb-4 lg:pb-0 lg:pr-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-900 flex items-center justify-center font-black text-xl shrink-0 overflow-hidden">
            {reviewer.avatar_url ? (
              <img
                src={reviewer.avatar_url}
                alt={reviewer.full_name}
                className="w-full h-full object-cover"
              />
            ) : (
              reviewer.full_name.charAt(0)
            )}
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 leading-tight">
              {reviewer.full_name}
            </h2>
            <div className="text-xs text-slate-500">
              {reviewer.department || 'Ban Xã hội'} • {reviewer.job_title || 'Biên tập viên'}
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              Thẻ nhà báo: {reviewer.press_id || 'HNB-2026-BTV'}
            </div>
          </div>
        </div>

        {/* 4 Chỉ số KPI chấm điểm */}
        <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="text-[11px] font-bold text-slate-500 uppercase">Số bài đã chấm</div>
            <div className="text-xl font-black text-slate-900">
              {reviewerStat?.total_graded || myGradingAttempts.length}
            </div>
            <div className="text-[10px] text-slate-400">Tác phẩm thẩm định</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="text-[11px] font-bold text-slate-500 uppercase">Điểm trung bình</div>
            <div className="text-xl font-black text-blue-900">
              {reviewerStat?.avg_score || 80.0} đ
            </div>
            <div className="text-[10px] text-slate-400">Thang điểm 100</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="text-[11px] font-bold text-slate-500 uppercase">Độ lệch chuẩn (Δ)</div>
            <div
              className={`text-xl font-black ${
                (reviewerStat?.avg_deviation ?? 0) > 5
                  ? 'text-amber-600'
                  : (reviewerStat?.avg_deviation ?? 0) < -5
                  ? 'text-rose-600'
                  : 'text-emerald-700'
              }`}
            >
              {(reviewerStat?.avg_deviation ?? 0) > 0 ? '+' : ''}
              {reviewerStat?.avg_deviation ?? 0} đ
            </div>
            <div className="text-[10px] text-slate-400">
              {(reviewerStat?.avg_deviation ?? 0) > 0
                ? 'Chấm rộng tay'
                : (reviewerStat?.avg_deviation ?? 0) < -5
                ? 'Chấm chặt tay'
                : 'Trong chuẩn ±5đ'}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="text-[11px] font-bold text-slate-500 uppercase">Tỷ lệ khiếu nại</div>
            <div className="text-xl font-black text-slate-900">
              {reviewerStat?.appeal_rate ?? 0}%
            </div>
            <div className="text-[10px] text-slate-400">
              {reviewerStat?.appeal_count ?? appealsAgainstMe.length} vụ khiếu nại
            </div>
          </div>
        </div>
      </div>

      {/* BIỂU ĐỒ BIẾN THIÊN ĐỘ LỆCH THEO THÁNG */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-900" />
              <span>Biến thiên độ lệch chấm điểm theo tháng (6 tháng gần nhất)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Đo lường tính ổn định trong phong cách chấm điểm qua các kỳ thẩm định chất lượng.
            </p>
          </div>
        </div>

        <div className="h-64 w-full pt-3">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyDeviationData} margin={{ top: 20, right: 30, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#475569' }} />
              <YAxis domain={[-10, 10]} ticks={[-10, -5, 0, 5, 10]} tick={{ fontSize: 11, fill: '#475569' }} unit="đ" />
              <Tooltip
                formatter={(val: any) => [`${val > 0 ? `+${val}` : val} điểm`, 'Độ lệch tháng']}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  fontSize: '12px'
                }}
              />
              <ReferenceLine y={0} stroke="#94a3b8" />
              <ReferenceLine y={5} stroke="#f59e0b" strokeDasharray="4 4" />
              <ReferenceLine y={-5} stroke="#e11d48" strokeDasharray="4 4" />
              <Line
                type="monotone"
                dataKey="deviation"
                stroke="#1e3a8a"
                strokeWidth={3}
                dot={{ r: 5, fill: '#1e3a8a' }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* BẢNG LỊCH SỬ CHẤM ĐIỂM CHI TIẾT CỦA BTV */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs space-y-0">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">
            Lịch sử thẩm định các tác phẩm của {reviewer.full_name}
          </h3>
          <span className="text-xs text-slate-400">
            Tổng cộng: <strong>{myGradingAttempts.length}</strong> lần chấm
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Tác phẩm</th>
                <th className="py-3 px-4 w-36">Ngày chấm</th>
                <th className="py-3 px-4 w-32">Vai trò thẩm định</th>
                <th className="py-3 px-4 w-32 text-center">Điểm đã chấm</th>
                <th className="py-3 px-4 w-44">Tình trạng kiểm chuẩn</th>
                <th className="py-3 px-4 w-44">Kết quả khiếu nại / chốt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {myGradingAttempts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                    Chưa có dữ liệu bài chấm nào.
                  </td>
                </tr>
              ) : (
                myGradingAttempts.map(att => {
                  const art = state.articles.find(a => a.id === att.article_id);
                  const genre = getGenre(art?.category_id || art?.genre_id);
                  const relatedAppeal = state.appeals.find(ap => ap.article_id === att.article_id);

                  return (
                    <tr key={att.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Tác phẩm */}
                      <td className="py-3.5 px-4 max-w-sm">
                        <div
                          onClick={() => navigate(`/articles/${att.article_id}`)}
                          className="font-bold text-slate-900 hover:text-blue-700 cursor-pointer line-clamp-2 leading-snug"
                        >
                          {art?.title || 'Tác phẩm'}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Thể loại: <strong className="text-slate-600">{genre?.name}</strong>
                        </div>
                      </td>

                      {/* Ngày chấm */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-500">
                        {formatDateTime(att.scored_at)}
                      </td>

                      {/* Vai trò thẩm định */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                          {att.scorer_type === 'PRIMARY'
                            ? 'Chấm lần đầu'
                            : att.scorer_type === 'APPEAL'
                            ? 'Chấm lại do khiếu nại'
                            : att.scorer_type === 'THIRD_EDITOR'
                            ? 'BTV thứ ba'
                            : 'Chấm chéo'}
                        </span>
                      </td>

                      {/* Điểm đã cho */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="text-base font-black text-slate-900">
                          {att.total_score}
                        </span>
                        <span className="text-[10px] font-normal text-slate-400">/100</span>
                      </td>

                      {/* Tình trạng kiểm chuẩn */}
                      <td className="py-3.5 px-4">
                        {relatedAppeal ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                              <RotateCcw className="w-3 h-3 text-amber-600" />
                              <span>Bị khiếu nại (#{relatedAppeal.id})</span>
                            </span>
                            <div className="text-[10px] text-slate-400">
                              Lệch: {relatedAppeal.rescore_score ? `${relatedAppeal.rescore_score - att.total_score}đ` : 'Đang xử lý'}
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                            Không khiếu nại
                          </span>
                        )}
                      </td>

                      {/* Kết quả khiếu nại / chốt */}
                      <td className="py-3.5 px-4">
                        {relatedAppeal?.status === 'RESOLVED' ? (
                          <div className="text-[11px] text-slate-800">
                            Chốt điểm: <strong className="text-emerald-700">{relatedAppeal.final_effective_score}đ</strong>
                            <div className="text-[10px] text-slate-400 line-clamp-1">
                              {relatedAppeal.resolution_rule === 'NEW_SCORE_APPLIED'
                                ? 'Áp dụng điểm chấm lại'
                                : relatedAppeal.resolution_rule === 'ORIGINAL_RETAINED_WITHIN_TOLERANCE'
                                ? 'Bảo lưu điểm gốc (≤5đ)'
                                : 'Lấy trung vị 3 lần'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
