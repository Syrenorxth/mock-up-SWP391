import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/common/Header';
import { StatusBadge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { formatDateTime, formatDate, Appeal } from '../../types';
import {
  Scale,
  Clock,
  AlertCircle,
  CheckCircle2,
  Send,
  FileCheck,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  HelpCircle,
  RotateCcw,
  Sparkles,
  Info,
  Calendar,
  Layers,
  X
} from 'lucide-react';

export const ReporterAppealsScreen: React.FC = () => {
  const { state, dispatch, notify, getUser, getGenre, getActiveRoyaltyRate } = useApp();
  const navigate = useNavigate();

  const currentUserId = state.currentUser.id;

  // Modal gửi khiếu nại state
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [selectedCriteriaIds, setSelectedCriteriaIds] = useState<string[]>([]);
  const [appealReason, setAppealReason] = useState<string>('');
  const [submitError, setSubmitError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'ELIGIBLE_ARTICLES' | 'MY_APPEALS'>('ELIGIBLE_ARTICLES');

  // Lấy các bài viết của user mà đã công bố điểm hoặc đã xuất bản
  const eligibleArticles = useMemo(() => {
    return state.articles.filter(art => {
      // User là tác giả chính hoặc đồng tác giả
      const isMainAuthor = art.author_id === currentUserId;
      const isCoAuthor = state.articleAuthors.some(
        au => au.article_id === art.id && au.user_id === currentUserId
      );
      if (!isMainAuthor && !isCoAuthor) return false;

      // Đã công bố điểm hoặc đã đăng
      return art.status === 'SCORE_PUBLISHED' || art.status === 'PUBLISHED';
    });
  }, [state.articles, state.articleAuthors, currentUserId]);

  // Thông tin mở rộng về hạn khiếu nại và trạng thái khiếu nại của từng bài
  const enrichedArticles = useMemo(() => {
    const now = new Date();

    return eligibleArticles.map(art => {
      const isMainAuthor = art.author_id === currentUserId;
      const coAuthors = state.articleAuthors.filter(
        au => au.article_id === art.id && !au.is_main
      );

      // Điểm và lần chấm gần nhất
      const attempts = state.scoringAttempts
        .filter(sa => sa.article_id === art.id)
        .sort((a, b) => b.attempt_no - a.attempt_no);
      const effectiveAttempt = attempts.find(sa => sa.is_effective) || attempts[0];
      const publishedScore = effectiveAttempt?.total_score || 0;

      // Hạn khiếu nại: mặc định lấy từ complaint_deadline của scoringAttempt hoặc công bố + 7 ngày
      let deadlineDate: Date | null = null;
      let deadlineStr = effectiveAttempt?.complaint_deadline;
      if (deadlineStr) {
        deadlineDate = new Date(deadlineStr);
      } else if (effectiveAttempt?.score_published_at) {
        const pubDate = new Date(effectiveAttempt.score_published_at);
        deadlineDate = new Date(pubDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      } else if (art.score_published_at) {
        const pubDate = new Date(art.score_published_at);
        deadlineDate = new Date(pubDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      }

      const isExpired = deadlineDate ? now.getTime() > deadlineDate.getTime() : false;
      const daysLeft = deadlineDate
        ? Math.max(0, Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
        : 0;

      // Khiếu nại đã gửi cho bài này (nếu có)
      const existingAppeal = state.appeals.find(ap => ap.article_id === art.id);
      const hasAppealed = !!existingAppeal;

      // Kiểm tra lý do khóa nút gửi khiếu nại
      let lockReason = '';
      let canSubmit = true;

      if (!isMainAuthor) {
        canSubmit = false;
        lockReason = 'Chỉ tác giả chính mới có quyền nộp đơn khiếu nại điểm';
      } else if (hasAppealed) {
        canSubmit = false;
        lockReason = 'Bài viết đã được khiếu nại (chỉ được khiếu nại 1 lần duy nhất)';
      } else if (isExpired) {
        canSubmit = false;
        lockReason = 'Đã quá thời hạn 7 ngày khiếu nại kể từ ngày công bố điểm';
      }

      return {
        article: art,
        isMainAuthor,
        coAuthors,
        publishedScore,
        effectiveAttempt,
        deadlineDate,
        isExpired,
        daysLeft,
        hasAppealed,
        existingAppeal,
        canSubmit,
        lockReason
      };
    });
  }, [eligibleArticles, state.scoringAttempts, state.appeals, state.articleAuthors, currentUserId]);

  // Danh sách các khiếu nại của phóng viên hiện tại
  const myAppeals = useMemo(() => {
    return state.appeals.filter(ap => {
      const art = state.articles.find(a => a.id === ap.article_id);
      if (!art) return false;
      const isMain = art.author_id === currentUserId;
      const isCo = state.articleAuthors.some(
        au => au.article_id === art.id && au.user_id === currentUserId
      );
      return isMain || isCo;
    });
  }, [state.appeals, state.articles, state.articleAuthors, currentUserId]);

  // Bài đang chọn để gửi khiếu nại
  const targetArticleData = useMemo(() => {
    if (!selectedArticleId) return null;
    return enrichedArticles.find(item => item.article.id === selectedArticleId);
  }, [selectedArticleId, enrichedArticles]);

  const handleOpenAppealModal = (articleId: string) => {
    setSelectedArticleId(articleId);
    setSelectedCriteriaIds([]);
    setAppealReason('');
    setSubmitError('');
  };

  const handleCloseModal = () => {
    setSelectedArticleId(null);
    setSelectedCriteriaIds([]);
    setAppealReason('');
    setSubmitError('');
  };

  const handleToggleCriterion = (criterionId: string) => {
    setSelectedCriteriaIds(prev =>
      prev.includes(criterionId)
        ? prev.filter(id => id !== criterionId)
        : [...prev, criterionId]
    );
  };

  const handleSubmitAppeal = () => {
    if (!targetArticleData) return;

    if (selectedCriteriaIds.length === 0) {
      setSubmitError('Vui lòng chọn ít nhất một tiêu chí bạn muốn khiếu nại.');
      return;
    }

    if (!appealReason.trim() || appealReason.trim().length < 15) {
      setSubmitError('Vui lòng nhập lý do khiếu nại chi tiết (tối thiểu 15 ký tự).');
      return;
    }

    dispatch({
      type: 'SUBMIT_APPEAL',
      payload: {
        articleId: targetArticleData.article.id,
        appealedCriteriaIds: selectedCriteriaIds,
        reason: appealReason.trim()
      }
    });

    notify('Đã gửi khiếu nại chất lượng thành công! Hệ thống đã tự động giao BTV chấm lại mù.', 'success');
    handleCloseModal();
    setActiveTab('MY_APPEALS');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <PageHeader
        breadcrumbs={[
          { label: 'Trang chủ', link: '/reporter/articles' },
          { label: 'Luồng 03 · Kiểm soát chất lượng' },
          { label: 'Khiếu nại chất lượng' }
        ]}
        title="Gửi và theo dõi khiếu nại chất lượng"
        description="Quy trình khiếu nại bảo vệ quyền lợi phóng viên: Cho phép tác giả chính khiếu nại điểm đã công bố trong 7 ngày. Hệ thống tự động phân công BTV khác chấm lại hoàn toàn độc lập (chấm mù)."
      />

      {/* Banner tóm tắt chính sách & quy chế */}
      <div className="bg-linear-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-5 shadow-sm border border-blue-800">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
            <Scale className="w-6 h-6 text-amber-300" />
          </div>
          <div className="space-y-2">
            <h3 className="font-bold text-base flex items-center gap-2">
              <span>Quy chế khiếu nại & Thẩm định độc lập 3 cấp</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 font-black">
                Quy trình tự động hóa
              </span>
            </h3>
            <div className="text-xs text-blue-100 leading-relaxed grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                <div className="font-bold text-amber-300 flex items-center gap-1.5 mb-1">
                  <Clock className="w-4 h-4" />
                  <span>Điều kiện nộp</span>
                </div>
                <p className="text-[11px]">
                  Chỉ <strong>tác giả chính</strong> được quyền gửi đơn trong vòng <strong>7 ngày</strong> kể từ khi công bố điểm. Tối đa <strong>1 lần duy nhất</strong> cho mỗi bài viết.
                </p>
              </div>

              <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                <div className="font-bold text-blue-300 flex items-center gap-1.5 mb-1">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Chấm lại mù</span>
                </div>
                <p className="text-[11px]">
                  BTV chấm lại <strong>không thấy điểm cũ</strong>, không biết lý do khiếu nại và không thấy tên người chấm ban đầu để đảm bảo tính khách quan tuyệt đối.
                </p>
              </div>

              <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                <div className="font-bold text-emerald-300 flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Quy tắc chốt điểm</span>
                </div>
                <p className="text-[11px]">
                  Điểm mới ≥ Điểm cũ: <strong>Áp dụng điểm mới</strong>. Thấp hơn nhưng lệch ≤ 5đ: <strong>Giữ điểm cũ</strong>. Thấp hơn lệch &gt; 5đ: Chuyển <strong>BTV thứ ba</strong> lấy trung vị.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('ELIGIBLE_ARTICLES')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'ELIGIBLE_ARTICLES'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Bài viết đã công bố điểm</span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-black">
            {enrichedArticles.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('MY_APPEALS')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'MY_APPEALS'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Tiến độ khiếu nại của tôi</span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 font-black">
            {myAppeals.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Danh sách bài viết đủ điều kiện hoặc đã qua công bố */}
      {activeTab === 'ELIGIBLE_ARTICLES' && (
        <div className="space-y-4">
          {enrichedArticles.length === 0 ? (
            <EmptyState
              icon={<Scale className="w-12 h-12 text-slate-400 stroke-1" />}
              title="Chưa có bài viết nào công bố điểm"
              description="Các bài viết sau khi được Trưởng ban phê duyệt và công bố điểm sẽ xuất hiện ở đây để bạn theo dõi và khiếu nại nếu cần."
            />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4 w-32">Thể loại</th>
                      <th className="py-3 px-4">Tác phẩm & Vai trò</th>
                      <th className="py-3 px-4 w-32 text-center">Điểm công bố</th>
                      <th className="py-3 px-4 w-44">Hạn khiếu nại</th>
                      <th className="py-3 px-4 w-40">Trạng thái khiếu nại</th>
                      <th className="py-3 px-4 w-44 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {enrichedArticles.map(item => {
                      const {
                        article: art,
                        isMainAuthor,
                        coAuthors,
                        publishedScore,
                        isExpired,
                        daysLeft,
                        deadlineDate,
                        hasAppealed,
                        existingAppeal,
                        canSubmit,
                        lockReason
                      } = item;
                      const genre = getGenre(art.category_id || art.genre_id);

                      return (
                        <tr key={art.id} className="hover:bg-slate-50/70 transition-colors">
                          {/* Thể loại */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-900 border border-blue-200">
                              {genre?.name || 'Chưa rõ'}
                            </span>
                          </td>

                          {/* Tác phẩm */}
                          <td className="py-3.5 px-4 max-w-sm">
                            <div
                              onClick={() => navigate(`/articles/${art.id}`)}
                              className="font-bold text-slate-900 hover:text-blue-700 cursor-pointer line-clamp-2 leading-snug"
                            >
                              {art.title}
                            </div>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              {isMainAuthor ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                                  Tác giả chính (Có quyền khiếu nại)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                                  Đồng tác giả (Chỉ xem)
                                </span>
                              )}
                              <StatusBadge status={art.status} />
                            </div>
                          </td>

                          {/* Điểm công bố */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="inline-flex flex-col items-center">
                              <span className="text-base font-black text-blue-950">
                                {publishedScore}
                                <span className="text-[10px] font-normal text-slate-400">/100</span>
                              </span>
                              <Link
                                to={`/reporter/articles/${art.id}/score`}
                                className="text-[10px] text-blue-700 hover:underline font-semibold mt-0.5"
                              >
                                Xem chi tiết điểm
                              </Link>
                            </div>
                          </td>

                          {/* Hạn khiếu nại */}
                          <td className="py-3.5 px-4">
                            {hasAppealed ? (
                              <div className="text-slate-500 text-[11px]">
                                Đã gửi khiếu nại
                              </div>
                            ) : deadlineDate ? (
                              <div>
                                {isExpired ? (
                                  <div className="flex items-center gap-1.5 text-rose-600 font-bold text-[11px]">
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    <span>Đã hết hạn</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-[11px]">
                                    <Clock className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                                    <span>Còn {daysLeft} ngày nữa</span>
                                  </div>
                                )}
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  Hạn chót: {formatDate(deadlineDate.toISOString())}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs">—</span>
                            )}
                          </td>

                          {/* Trạng thái khiếu nại */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {!hasAppealed ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                Chưa khiếu nại
                              </span>
                            ) : existingAppeal?.status === 'IN_RESCORE' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                <RotateCcw className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                                <span>Đang chấm lại</span>
                              </span>
                            ) : existingAppeal?.status === 'IN_THIRD_REVIEW' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-100 text-purple-900 border border-purple-300">
                                <Scale className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
                                <span>Chờ BTV thứ ba</span>
                              </span>
                            ) : existingAppeal?.status === 'RESOLVED' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Đã có kết quả ({existingAppeal.final_effective_score} đ)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-900">
                                Đã gửi đơn
                              </span>
                            )}
                          </td>

                          {/* Thao tác */}
                          <td className="py-3.5 px-4 text-right">
                            {hasAppealed ? (
                              <button
                                type="button"
                                onClick={() => setActiveTab('MY_APPEALS')}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
                              >
                                <span>Xem tiến độ</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <div className="relative inline-block group">
                                <button
                                  type="button"
                                  disabled={!canSubmit}
                                  onClick={() => handleOpenAppealModal(art.id)}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                    canSubmit
                                      ? 'bg-blue-900 hover:bg-blue-800 text-white shadow-2xs cursor-pointer'
                                      : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                                  }`}
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  <span>Gửi khiếu nại</span>
                                </button>

                                {!canSubmit && lockReason && (
                                  <div className="absolute right-0 bottom-full mb-1 hidden group-hover:block z-20 w-64 p-2 bg-slate-900 text-white text-[11px] rounded-lg shadow-lg">
                                    <div className="flex items-start gap-1.5">
                                      <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                                      <span>{lockReason}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Theo dõi tiến độ khiếu nại của phóng viên */}
      {activeTab === 'MY_APPEALS' && (
        <div className="space-y-4">
          {myAppeals.length === 0 ? (
            <EmptyState
              icon={<RotateCcw className="w-12 h-12 text-slate-400 stroke-1" />}
              title="Chưa có đơn khiếu nại nào"
              description="Khi bạn gửi khiếu nại điểm chất lượng, toàn bộ quy trình chấm lại độc lập và phân giải sẽ được hiển thị chi tiết tại đây."
            />
          ) : (
            <div className="space-y-4">
              {myAppeals.map(appeal => {
                const art = state.articles.find(a => a.id === appeal.article_id);
                const genre = getGenre(art?.category_id || art?.genre_id);
                const originalEditor = getUser(appeal.original_scorer_id);
                const rescoreEditor = getUser(appeal.rescore_editor_id);
                const thirdEditor = getUser(appeal.third_editor_id);

                return (
                  <div
                    key={appeal.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4"
                  >
                    {/* Header thông tin khiếu nại */}
                    <div className="flex items-start justify-between gap-4 flex-wrap pb-3 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-900 border border-blue-200">
                            {genre?.name || 'Thể loại'}
                          </span>
                          <span className="text-xs font-mono text-slate-400">
                            Mã: #{appeal.id}
                          </span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs text-slate-500">
                            Ngày nộp: {formatDateTime(appeal.created_at)}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-slate-900 mt-1">
                          {art?.title || 'Tác phẩm'}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2">
                        {appeal.status === 'RESOLVED' ? (
                          <div className="text-right">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>ĐÃ CÓ KẾT QUẢ</span>
                            </span>
                            <div className="text-xs font-bold text-slate-900 mt-1">
                              Điểm hiệu lực: <span className="text-emerald-700 text-sm">{appeal.final_effective_score}</span>/100
                            </div>
                          </div>
                        ) : appeal.status === 'IN_THIRD_REVIEW' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-purple-100 text-purple-900 border border-purple-300">
                            <Scale className="w-4 h-4 text-purple-600 animate-pulse" />
                            <span>ĐANG CHỜ BTV THỨ BA CHẤM MÙ</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                            <RotateCcw className="w-4 h-4 text-amber-600 animate-spin" />
                            <span>ĐANG CHẤM LẠI MÙ (LẦN 2)</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Lý do và tiêu chí khiếu nại */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <div className="font-bold text-slate-700 mb-1">
                          Tiêu chí khiếu nại ({appeal.appealed_criteria_ids.length} tiêu chí):
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {appeal.appealed_criteria_ids.map(cId => (
                            <span
                              key={cId}
                              className="px-2.5 py-1 rounded-md bg-blue-100 text-blue-900 font-semibold"
                            >
                              {cId}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="font-bold text-slate-700 mb-1">Lý do khiếu nại của phóng viên:</div>
                        <p className="text-slate-600 italic">"{appeal.reason}"</p>
                      </div>
                    </div>

                    {/* Tiến trình 4 bước (Timeline trực quan) */}
                    <div className="pt-2">
                      <div className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-blue-900" />
                        <span>Quy trình xử lý thẩm định độc lập:</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {/* Bước 1 */}
                        <div className="p-3 rounded-xl border bg-emerald-50/70 border-emerald-200">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span className="font-bold text-xs text-emerald-950">1. Đã tiếp nhận đơn</span>
                          </div>
                          <div className="text-[11px] text-slate-600">
                            Gửi ngày {formatDate(appeal.created_at)}. Điểm công bố ban đầu: <strong>{appeal.original_score} đ</strong>
                          </div>
                        </div>

                        {/* Bước 2 */}
                        <div
                          className={`p-3 rounded-xl border transition-all ${
                            appeal.rescore_score !== undefined
                              ? 'bg-emerald-50/70 border-emerald-200'
                              : 'bg-amber-50/70 border-amber-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {appeal.rescore_score !== undefined ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <RotateCcw className="w-4 h-4 text-amber-600 animate-spin" />
                            )}
                            <span className="font-bold text-xs text-slate-900">2. BTV chấm lại mù</span>
                          </div>
                          <div className="text-[11px] text-slate-600">
                            {appeal.rescore_score !== undefined ? (
                              <>
                                Đã chấm xong: <strong>{appeal.rescore_score} đ</strong> ({formatDate(appeal.rescore_date)})
                              </>
                            ) : (
                              'Hệ thống đã giao BTV thẩm định độc lập, không thấy điểm cũ.'
                            )}
                          </div>
                        </div>

                        {/* Bước 3 */}
                        <div
                          className={`p-3 rounded-xl border ${
                            appeal.third_score !== undefined
                              ? 'bg-emerald-50/70 border-emerald-200'
                              : appeal.status === 'IN_THIRD_REVIEW'
                              ? 'bg-purple-50/70 border-purple-300 animate-pulse'
                              : 'bg-slate-50 border-slate-200 opacity-60'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {appeal.third_score !== undefined ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : appeal.status === 'IN_THIRD_REVIEW' ? (
                              <Scale className="w-4 h-4 text-purple-600" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center text-[10px] text-slate-400">3</div>
                            )}
                            <span className="font-bold text-xs text-slate-900">3. BTV thứ ba (nếu lệch &gt; 5đ)</span>
                          </div>
                          <div className="text-[11px] text-slate-600">
                            {appeal.third_score !== undefined ? (
                              <>
                                Điểm lần 3: <strong>{appeal.third_score} đ</strong>
                              </>
                            ) : appeal.status === 'IN_THIRD_REVIEW' ? (
                              'Độ lệch vượt quá 5đ, hệ thống đã giao BTV thứ 3 chấm mù độc lập.'
                            ) : (
                              'Không cần kích hoạt (độ lệch lần 2 nằm trong ngưỡng cho phép).'
                            )}
                          </div>
                        </div>

                        {/* Bước 4 */}
                        <div
                          className={`p-3 rounded-xl border ${
                            appeal.status === 'RESOLVED'
                              ? 'bg-blue-50/70 border-blue-300'
                              : 'bg-slate-50 border-slate-200 opacity-60'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {appeal.status === 'RESOLVED' ? (
                              <CheckCircle2 className="w-4 h-4 text-blue-700" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center text-[10px] text-slate-400">4</div>
                            )}
                            <span className="font-bold text-xs text-blue-950">4. Chốt điểm hiệu lực</span>
                          </div>
                          <div className="text-[11px] text-slate-600">
                            {appeal.status === 'RESOLVED' ? (
                              <span className="text-blue-900 font-bold">
                                Điểm chốt: {appeal.final_effective_score} đ
                              </span>
                            ) : (
                              'Chờ kết quả cuối cùng từ hệ thống.'
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Khối hiển thị quy tắc xử lý khi đã giải quyết */}
                    {appeal.status === 'RESOLVED' && (
                      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-1.5">
                        <div className="font-bold text-sm flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                          <span>Kết quả xử lý & Căn cứ phê chuẩn:</span>
                        </div>
                        <p className="leading-relaxed font-medium">
                          {appeal.resolution_note || 'Điểm hiệu lực đã được cập nhật chính thức vào hệ thống.'}
                        </p>
                        <div className="text-[11px] text-emerald-800 pt-1">
                          * Lưu ý: Điểm cuối này trở thành điểm hiệu lực của tác phẩm. Luồng 03 không can thiệp tính tiền; nếu bậc điểm làm đổi hệ số, Luồng 04 (Nhuận bút) sẽ tự động sinh dòng điều chỉnh theo quy chế.
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL GỬI KHIẾU NẠI CHẤT LƯỢNG */}
      {selectedArticleId && targetArticleData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                  Biểu mẫu khiếu nại trực tuyến
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  Khiếu nại điểm chất lượng tác phẩm
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Thông tin bài viết */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
              <div className="font-bold text-slate-900 text-sm">
                {targetArticleData.article.title}
              </div>
              <div className="grid grid-cols-2 gap-3 text-slate-600 pt-1">
                <div>
                  <span className="text-slate-400">Điểm đã công bố: </span>
                  <span className="font-black text-blue-950 text-sm">
                    {targetArticleData.publishedScore}/100 đ
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Thời hạn còn lại: </span>
                  <span className="font-bold text-emerald-700">
                    {targetArticleData.daysLeft} ngày
                  </span>
                </div>
              </div>
            </div>

            {/* Danh sách tiêu chí để phóng viên chọn khiếu nại */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>Chọn các tiêu chí bạn cho rằng chưa được đánh giá thỏa đáng:</span>
                <span className="text-[11px] text-blue-800 font-semibold">
                  (Đã chọn: {selectedCriteriaIds.length})
                </span>
              </label>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {targetArticleData.effectiveAttempt?.criteria_scores &&
                targetArticleData.effectiveAttempt.criteria_scores.length > 0 ? (
                  targetArticleData.effectiveAttempt.criteria_scores.map(crit => {
                    const isChecked = selectedCriteriaIds.includes(crit.criterion_id);
                    return (
                      <div
                        key={crit.criterion_id}
                        onClick={() => handleToggleCriterion(crit.criterion_id)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-blue-50/80 border-blue-500 shadow-2xs'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="mt-0.5 rounded text-blue-900 focus:ring-blue-800 cursor-pointer"
                            />
                            <div>
                              <div className="font-bold text-slate-900">{crit.name}</div>
                              {crit.comment && (
                                <div className="text-[11px] text-slate-500 italic mt-0.5">
                                  BTV ghi: "{crit.comment}"
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-black text-slate-900 text-xs">
                              {crit.score}/100 đ
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Trọng số: {crit.weight}%
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-xl">
                    Chưa tải được bảng chi tiết tiêu chí của lần chấm này. Bạn vẫn có thể chọn gửi khiếu nại tổng quát.
                  </div>
                )}
              </div>
            </div>

            {/* Lý do khiếu nại */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800">
                Lý do khiếu nại chi tiết <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={appealReason}
                onChange={e => setAppealReason(e.target.value)}
                placeholder="Nêu rõ căn cứ, tài liệu bổ sung, góc nhìn độc quyền hoặc các yếu tố đề tài bạn cho rằng BTV chưa ghi nhận đúng mức..."
                className="w-full text-xs rounded-xl border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>

            {/* Thông báo lỗi nếu có */}
            {submitError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Cảnh báo nguyên tắc */}
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-[11px] text-amber-950 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong>Cam kết trách nhiệm:</strong> Khiếu nại chỉ được gửi 01 lần duy nhất cho mỗi bài viết. Hệ thống sẽ tự động giao BTV chấm lại hoàn toàn độc lập (chấm mù). Điểm chấm lại nếu thấp hơn mà sai số ≤ 5 điểm sẽ được bảo lưu điểm cũ.
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                onClick={handleSubmitAppeal}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Xác nhận gửi khiếu nại</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
