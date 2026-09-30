import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/common/Header';
import { EmptyState } from '../../components/common/EmptyState';
import { Appeal, formatDateTime, formatDate, ScoringAttempt } from '../../types';
import {
  Scale,
  Eye,
  Columns,
  History,
  CheckCircle2,
  RotateCcw,
  AlertCircle,
  FileText,
  User,
  ExternalLink,
  ShieldCheck,
  X,
  ArrowRight,
  Filter
} from 'lucide-react';

export const LeadAppealsScreen: React.FC = () => {
  const { state, getUser, getGenre, getScoringAttempts } = useApp();
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_RESCORE' | 'IN_THIRD_REVIEW' | 'RESOLVED'>('ALL');
  const [selectedHistoryArticleId, setSelectedHistoryArticleId] = useState<string | null>(null);

  // Lọc danh sách khiếu nại
  const filteredAppeals = useMemo(() => {
    return state.appeals.filter(ap => {
      if (statusFilter === 'ALL') return true;
      return ap.status === statusFilter;
    });
  }, [state.appeals, statusFilter]);

  // Thống kê nhanh
  const countInRescore = state.appeals.filter(ap => ap.status === 'IN_RESCORE').length;
  const countInThird = state.appeals.filter(ap => ap.status === 'IN_THIRD_REVIEW').length;
  const countResolved = state.appeals.filter(ap => ap.status === 'RESOLVED').length;

  // Lịch sử các lần chấm của bài đang chọn xem
  const historyAttempts: ScoringAttempt[] = useMemo(() => {
    if (!selectedHistoryArticleId) return [];
    return state.scoringAttempts
      .filter(sa => sa.article_id === selectedHistoryArticleId)
      .sort((a, b) => a.attempt_no - b.attempt_no);
  }, [selectedHistoryArticleId, state.scoringAttempts]);

  const historyArticle = useMemo(() => {
    if (!selectedHistoryArticleId) return null;
    return state.articles.find(a => a.id === selectedHistoryArticleId);
  }, [selectedHistoryArticleId, state.articles]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <PageHeader
        breadcrumbs={[
          { label: 'Trang chủ', link: '/editor-lead/queue' },
          { label: 'Luồng 03 · Kiểm soát chất lượng' },
          { label: 'Danh sách khiếu nại' }
        ]}
        title="Giám sát & Theo dõi khiếu nại chất lượng"
        description="Màn hình dành cho Trưởng ban theo dõi quy trình giải quyết khiếu nại tự động. Hệ thống vận hành độc lập (không qua phê duyệt) nhằm bảo đảm tính khách quan tuyệt đối giữa người thẩm định và người khiếu nại."
      />

      {/* Banner ghi chú vai trò Trưởng ban */}
      <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex items-start gap-3.5 text-xs text-amber-950">
        <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-bold">Nguyên tắc giám sát của Trưởng ban:</strong> Mọi thủ tục giao BTV chấm lại, BTV thứ ba và quy tắc lấy điểm (điểm mới ≥ điểm cũ, giữ điểm cũ trong sai số 5 điểm, lấy trung vị 3 lần) được thực thi tự động. Trưởng ban <strong>chỉ theo dõi, đối soát và phân tích độ lệch</strong> mà không can thiệp sửa đổi kết quả chấm mù.
        </div>
      </div>

      {/* Thống kê 3 nhóm trạng thái */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => setStatusFilter('IN_RESCORE')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'IN_RESCORE'
              ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-300'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Đang chấm lại (Lần 2)</span>
            <RotateCcw className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-900 mt-1">{countInRescore}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">BTV độc lập đang thẩm định</div>
        </div>

        <div
          onClick={() => setStatusFilter('IN_THIRD_REVIEW')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'IN_THIRD_REVIEW'
              ? 'bg-purple-50 border-purple-400 ring-2 ring-purple-300'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Chờ BTV thứ ba</span>
            <Scale className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-900 mt-1">{countInThird}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Lệch &gt; 5đ kích hoạt lần 3</div>
        </div>

        <div
          onClick={() => setStatusFilter('RESOLVED')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'RESOLVED'
              ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-300'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Đã chốt điểm hiệu lực</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-900 mt-1">{countResolved}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Đã giải quyết hoàn tất</div>
        </div>
      </div>

      {/* Tabs lọc */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-xs flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Tất cả ({state.appeals.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('IN_RESCORE')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'IN_RESCORE'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Đang chấm lại ({countInRescore})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('IN_THIRD_REVIEW')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'IN_THIRD_REVIEW'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Chờ BTV thứ ba ({countInThird})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('RESOLVED')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'RESOLVED'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Đã có kết quả ({countResolved})
          </button>
        </div>

        <div className="text-xs text-slate-500 pr-2">
          Hiển thị: <strong>{filteredAppeals.length}</strong> đơn khiếu nại
        </div>
      </div>

      {/* Bảng danh sách khiếu nại */}
      {filteredAppeals.length === 0 ? (
        <EmptyState
          icon={<Scale className="w-12 h-12 text-slate-400 stroke-1" />}
          title="Không có đơn khiếu nại nào theo điều kiện lọc"
          description="Hiện tại không có tác phẩm nào đang trong trạng thái được chọn."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-32">Mã & Ngày nộp</th>
                  <th className="py-3 px-4">Tác phẩm & Tác giả</th>
                  <th className="py-3 px-4 w-40">Tiêu chí khiếu nại</th>
                  <th className="py-3 px-4 w-36">Người chấm gốc</th>
                  <th className="py-3 px-4 w-44">BTV chấm lại (mù)</th>
                  <th className="py-3 px-4 w-36 text-center">Điểm hiệu lực</th>
                  <th className="py-3 px-4 w-36">Trạng thái</th>
                  <th className="py-3 px-4 w-44 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAppeals.map(appeal => {
                  const art = state.articles.find(a => a.id === appeal.article_id);
                  const genre = getGenre(art?.category_id || art?.genre_id);
                  const author = getUser(appeal.author_id);
                  const originalScorer = getUser(appeal.original_scorer_id);
                  const rescoreEditor = getUser(appeal.rescore_editor_id);
                  const thirdEditor = getUser(appeal.third_editor_id);

                  return (
                    <tr key={appeal.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Mã & Ngày nộp */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-900">
                          #{appeal.id}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {formatDate(appeal.created_at)}
                        </div>
                      </td>

                      {/* Tác phẩm & Tác giả */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div
                          onClick={() => navigate(`/articles/${appeal.article_id}`)}
                          className="font-bold text-slate-900 hover:text-blue-700 cursor-pointer line-clamp-2 leading-snug"
                        >
                          {art?.title || 'Tác phẩm'}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-900 text-[10px] font-bold">
                            {genre?.name}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            TG: <strong>{author?.full_name}</strong>
                          </span>
                        </div>
                      </td>

                      {/* Tiêu chí khiếu nại */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {appeal.appealed_criteria_ids.map(cId => (
                            <span
                              key={cId}
                              className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold"
                            >
                              {cId}
                            </span>
                          ))}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 line-clamp-1 italic">
                          "{appeal.reason}"
                        </div>
                      </td>

                      {/* Người chấm gốc */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">
                          {originalScorer?.full_name || 'BTV gốc'}
                        </div>
                        <div className="text-[11px] font-black text-slate-900 mt-0.5">
                          {appeal.original_score} đ
                        </div>
                      </td>

                      {/* BTV chấm lại */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-800">
                            {rescoreEditor?.full_name || 'Đang phân bổ'}
                          </span>
                          {appeal.is_external_editor && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-900 font-bold border border-purple-200">
                              Ngoài ban
                            </span>
                          )}
                        </div>
                        {appeal.rescore_score !== undefined ? (
                          <div className="text-[11px] text-slate-600 mt-0.5">
                            Điểm lần 2: <strong className="text-slate-900">{appeal.rescore_score} đ</strong>
                          </div>
                        ) : (
                          <div className="text-[10px] text-amber-600 font-medium mt-0.5">
                            Chưa chấm xong
                          </div>
                        )}
                        {appeal.third_editor_id && (
                          <div className="mt-1 text-[10px] text-purple-700 font-semibold border-t border-slate-100 pt-1">
                            BTV 3: {thirdEditor?.full_name || 'BTV 3'}{' '}
                            {appeal.third_score !== undefined && `(${appeal.third_score}đ)`}
                          </div>
                        )}
                      </td>

                      {/* Điểm hiệu lực */}
                      <td className="py-3.5 px-4 text-center">
                        {appeal.final_effective_score !== undefined ? (
                          <span className="text-base font-black text-emerald-700">
                            {appeal.final_effective_score}
                            <span className="text-[10px] font-normal text-slate-400">/100</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Đang xử lý</span>
                        )}
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {appeal.status === 'IN_RESCORE' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            <RotateCcw className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                            <span>Đang chấm lại</span>
                          </span>
                        ) : appeal.status === 'IN_THIRD_REVIEW' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-100 text-purple-900 border border-purple-300">
                            <Scale className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
                            <span>Chờ BTV thứ ba</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Đã có kết quả</span>
                          </span>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Nút Xem lịch sử các lần chấm */}
                          <button
                            type="button"
                            onClick={() => setSelectedHistoryArticleId(appeal.article_id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Xem lịch sử các lần chấm của bài"
                          >
                            <History className="w-4 h-4" />
                          </button>

                          {/* Nút Đối chiếu các lần chấm */}
                          <Link
                            to={`/editor-lead/appeals/${appeal.id}/compare`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold transition-all shadow-2xs"
                          >
                            <Columns className="w-3.5 h-3.5" />
                            <span>Đối chiếu</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL LỊCH SỬ CÁC LẦN CHẤM CỦA BÀI VIẾT (CHỈ ĐỌC, KHÔNG SỬA ĐƯỢC) */}
      {selectedHistoryArticleId && historyArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                  Nhật ký thẩm định chất lượng
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Lịch sử các lần chấm: {historyArticle.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedHistoryArticleId(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {historyAttempts.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl">
                  Chưa ghi nhận lần chấm nào cho bài viết này.
                </div>
              ) : (
                historyAttempts.map((attempt, index) => {
                  const scorer = getUser(attempt.scorer_id);
                  return (
                    <div
                      key={attempt.id}
                      className={`p-4 rounded-2xl border text-xs space-y-3 ${
                        attempt.is_effective
                          ? 'bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-200'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-blue-900 text-white">
                            Lần {attempt.attempt_no}
                          </span>
                          <span className="font-bold text-slate-900 text-xs">
                            BTV: {scorer?.full_name || 'BTV'}
                          </span>
                          <span className="text-slate-400 text-[11px]">
                            ({attempt.scorer_type === 'PRIMARY' ? 'Chấm lần đầu' : attempt.scorer_type === 'APPEAL' ? 'Chấm lại do khiếu nại' : attempt.scorer_type === 'THIRD_EDITOR' ? 'BTV thứ ba' : 'Chấm chéo'})
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-sm font-black text-blue-950">
                            {attempt.total_score} / 100 đ
                          </span>
                          {attempt.is_effective && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300">
                              ĐIỂM HIỆU LỰC
                            </span>
                          )}
                          <span className="text-slate-400 text-[11px]">
                            {formatDateTime(attempt.scored_at)}
                          </span>
                        </div>
                      </div>

                      {/* Chi tiết từng tiêu chí */}
                      {attempt.criteria_scores && attempt.criteria_scores.length > 0 && (
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 overflow-x-auto">
                          <table className="w-full text-left text-[11px]">
                            <thead>
                              <tr className="text-slate-500 font-bold border-b border-slate-200 pb-1">
                                <th className="py-1">Tiêu chí</th>
                                <th className="py-1 w-16 text-center">Trọng số</th>
                                <th className="py-1 w-16 text-center">Điểm</th>
                                <th className="py-1">Nhận xét</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                              {attempt.criteria_scores.map(cs => (
                                <tr key={cs.criterion_id}>
                                  <td className="py-1.5 font-medium">{cs.name}</td>
                                  <td className="py-1.5 text-center text-slate-500">{cs.weight}%</td>
                                  <td className="py-1.5 text-center font-bold text-slate-900">{cs.score}</td>
                                  <td className="py-1.5 text-slate-500 italic">{cs.comment || '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Ghi chú tổng quát của lần chấm */}
                      {attempt.note && (
                        <div className="text-[11px] text-slate-600 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                          <span className="font-bold text-slate-700">Nhận xét chung: </span>
                          <span>{attempt.note}</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedHistoryArticleId(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
              >
                Đóng lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
