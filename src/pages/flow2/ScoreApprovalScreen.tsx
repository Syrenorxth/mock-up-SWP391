import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/common/Header';
import { StatusBadge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';
import { Article, ScoringAttempt, formatDate } from '../../types';
import {
  CheckSquare,
  Award,
  RotateCcw,
  CheckCircle2,
  Calendar,
  User,
  AlertTriangle,
  History,
  Clock,
  ChevronRight,
  FileText,
  Eye,
  ShieldCheck,
  MessageSquare
} from 'lucide-react';

export const ScoreApprovalScreen: React.FC = () => {
  const {
    state,
    dispatch,
    notify,
    getGenre,
    getSection,
    getUser,
    getArticleAuthors,
    getArticleQualityScore,
    getScoringAttempts,
    getArticleLogs
  } = useApp();
  const navigate = useNavigate();

  // Danh sách các bài viết PENDING_APPROVAL thuộc ban chuyên môn của Trưởng ban (hoặc tất cả nếu admin/demo)
  const isSectionLead = state.currentRole === 'TRUONG_BAN';
  const pendingArticles = state.articles.filter(a => {
    if (a.status !== 'PENDING_APPROVAL') return false;
    if (isSectionLead && state.currentUser.section_id && a.section_id !== state.currentUser.section_id) {
      return false;
    }
    return true;
  });

  // Modal duyệt điểm & xem chi tiết
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [rescoreReason, setRescoreReason] = useState('');
  const [isRequestingRescore, setIsRequestingRescore] = useState(false);
  const [approvalDate, setApprovalDate] = useState('2026-06-25 15:00');

  const selectedAttempts = selectedArticle ? getScoringAttempts(selectedArticle.id) : [];
  const latestAttempt = selectedAttempts[0];
  const previousAttempts = selectedAttempts.slice(1);
  const qualityScore = selectedArticle ? getArticleQualityScore(selectedArticle.id) : undefined;

  // Tính hạn khiếu nại: ngày duyệt + 7 ngày
  const getComplaintDeadline = (dateStr: string) => {
    try {
      const pubDate = new Date(dateStr.replace(' ', 'T'));
      const deadline = new Date(pubDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      return `${String(deadline.getDate()).padStart(2, '0')}/${String(deadline.getMonth() + 1).padStart(2, '0')}/${deadline.getFullYear()}`;
    } catch {
      return '02/07/2026';
    }
  };

  const handleOpenReview = (art: Article) => {
    setSelectedArticle(art);
    setIsRequestingRescore(false);
    setRescoreReason('');
    // Với bài mẫu art-nuocsach, ngày duyệt là 25/06/2026
    if (art.id === 'art-nuocsach') {
      setApprovalDate('2026-06-25 15:00');
    } else {
      setApprovalDate(new Date().toISOString().replace('T', ' ').slice(0, 16));
    }
  };

  // Trưởng ban duyệt điểm -> SCORE_PUBLISHED
  const handleApproveScore = () => {
    if (!selectedArticle) return;
    const deadline = getComplaintDeadline(approvalDate);

    dispatch({
      type: 'APPROVE_SCORE',
      payload: {
        articleId: selectedArticle.id,
        scorePublishedAt: approvalDate,
        complaintDeadline: deadline,
        note: `Trưởng ban phê duyệt điểm (${latestAttempt?.total_score || qualityScore?.total_score || 78}/100), công bố điểm và mở thời hạn khiếu nại đến ${deadline}`
      }
    });

    notify(
      `Đã duyệt điểm bài viết "${selectedArticle.title}" thành công. Điểm đã công bố, hạn khiếu nại đến ${deadline}!`,
      'success'
    );
    setSelectedArticle(null);
  };

  // Trưởng ban yêu cầu chấm lại -> ASSIGNED với nhãn "Trưởng ban yêu cầu chấm lại"
  const handleRequestRescore = () => {
    if (!selectedArticle) return;
    if (!rescoreReason.trim()) {
      notify('Bắt buộc phải nhập lý do yêu cầu Biên tập viên chấm lại!', 'error');
      return;
    }

    dispatch({
      type: 'REQUEST_RESCORE',
      payload: {
        articleId: selectedArticle.id,
        reason: rescoreReason.trim()
      }
    });

    const editorName = getUser(selectedArticle.editor_id)?.full_name || 'BTV';
    notify(
      `Đã chuyển bài viết về hàng việc của BTV ${editorName} kèm yêu cầu chấm lại!`,
      'warning'
    );
    setSelectedArticle(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <PageHeader
        breadcrumbs={[
          { label: 'Trang chủ', link: '/editor-lead/queue' },
          { label: 'Luồng 02 · Chấm chất lượng' },
          { label: 'Duyệt điểm' }
        ]}
        title="Hàng chờ duyệt điểm chất lượng"
        description="Xem xét chi tiết phiếu chấm điểm từng tiêu chí của BTV, phê duyệt công bố điểm hoặc gửi yêu cầu chấm lại."
      />

      {/* Thông tin kịch bản mẫu */}
      <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
        <div className="text-xs text-indigo-900 space-y-1">
          <p className="font-bold">Quy trình duyệt điểm & thời hạn khiếu nại:</p>
          <p className="text-indigo-800 leading-relaxed">
            Hàng chờ chỉ hiển thị những lần chấm dẫn tới <strong>"Nhận"</strong>. Khi Trưởng ban nhấn <strong>"Duyệt điểm"</strong>, trạng thái bài viết chuyển sang <strong>SCORE_PUBLISHED</strong>, hệ thống tự động thiết lập hạn khiếu nại là <strong>+7 ngày</strong> và gửi thông báo tới phóng viên. Nếu nhấn <strong>"Yêu cầu chấm lại"</strong>, bài viết sẽ quay lại hàng việc của đúng BTV đó với nhãn màu hồng nổi bật.
          </p>
        </div>
      </div>

      {/* Danh sách bài viết chờ duyệt điểm */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800 text-base">Bài viết chờ duyệt điểm</h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
              {pendingArticles.length} bài
            </span>
          </div>
        </div>

        {pendingArticles.length === 0 ? (
          <EmptyState
            title="Không có bài viết nào đang chờ duyệt điểm"
            description="Tất cả các bài viết đã được duyệt hoặc chưa có BTV nào gửi phiếu chấm chất lượng."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Tác phẩm & Thể loại</th>
                  <th className="px-6 py-4">Tác giả</th>
                  <th className="px-6 py-4">BTV thẩm định</th>
                  <th className="px-6 py-4 text-center">Lần chấm</th>
                  <th className="px-6 py-4 text-center">Điểm số</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {pendingArticles.map(art => {
                  const authors = getArticleAuthors(art.id);
                  const mainAuthor = authors.find(a => a.is_main);
                  const coAuthors = authors.filter(a => !a.is_main);
                  const editor = getUser(art.editor_id);
                  const artAttempts = getScoringAttempts(art.id);
                  const latest = artAttempts[0];
                  const qs = getArticleQualityScore(art.id);
                  const displayScore = latest?.total_score || qs?.total_score || 0;
                  const genre = getGenre(art.category_id || art.genre_id);

                  return (
                    <tr key={art.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                              {genre?.name || 'Phóng sự'}
                            </span>
                            <span className="text-xs text-slate-400">· {art.id}</span>
                          </div>
                          <p className="font-bold text-slate-900 text-sm hover:text-indigo-600 transition-colors line-clamp-1">
                            {art.title}
                          </p>
                          <p className="text-xs text-slate-500 line-clamp-1 italic">
                            {art.sapo}
                          </p>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs space-y-0.5">
                          <p className="font-bold text-slate-800">
                            {getUser(mainAuthor?.user_id || art.author_id)?.full_name || 'Phóng viên'}
                            {mainAuthor && <span className="text-slate-400 font-normal"> ({mainAuthor.share_percent}%)</span>}
                          </p>
                          {coAuthors.length > 0 && (
                            <p className="text-[11px] text-slate-500">
                              + {coAuthors.map(ca => getUser(ca.user_id)?.full_name).join(', ')}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs">
                          <span className="font-semibold text-slate-800">{editor?.full_name || 'Đỗ Mạnh Cường'}</span>
                          <span className="text-[11px] text-slate-400 block">{art.updated_at}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                          Lần {latest?.attempt_no || 1}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="text-base font-black text-indigo-700">
                            {displayScore} <span className="text-xs text-slate-400 font-bold">/ 100</span>
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${
                            displayScore >= 90 ? 'bg-emerald-100 text-emerald-800' :
                            displayScore >= 70 ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {displayScore >= 90 ? 'Xuất sắc' : displayScore >= 70 ? 'Khá' : 'Đạt'}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleOpenReview(art)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Chi tiết & Duyệt</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL CHI TIẾT DUYỆT ĐIỂM */}
      <Modal
        isOpen={!!selectedArticle}
        onClose={() => setSelectedArticle(null)}
        title="Thẩm định & Phê duyệt điểm chất lượng"
        maxWidth="4xl"
      >
        {selectedArticle && (
          <div className="space-y-6">
            {/* Header thông tin bài viết */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-blue-600 uppercase tracking-wider">
                  Thể loại: {getGenre(selectedArticle.category_id || selectedArticle.genre_id)?.name}
                </span>
                <span className="text-slate-400">
                  Mã tác phẩm: <strong>{selectedArticle.id}</strong>
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900">{selectedArticle.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed italic bg-white p-2.5 rounded-lg border border-slate-200">
                "{selectedArticle.sapo}"
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-500">
                <span>Tác giả: <strong>{getUser(selectedArticle.author_id)?.full_name}</strong></span>
                <span>BTV chấm điểm: <strong>{getUser(selectedArticle.editor_id)?.full_name}</strong></span>
                <span>Thời điểm chấm: <strong>{latestAttempt?.scored_at || selectedArticle.updated_at}</strong></span>
              </div>
            </div>

            {/* Chi tiết điểm từng tiêu chí của lần chấm hiện tại */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Award className="w-4 h-4 text-indigo-600" />
                  Kết quả chấm điểm lần {latestAttempt?.attempt_no || 1} (Bộ tiêu chí phiên bản {latestAttempt?.criteria_set_version || 2})
                </h4>
                <div className="text-right">
                  <span className="text-sm font-bold text-slate-500">Tổng điểm: </span>
                  <span className="text-xl font-black text-indigo-700">
                    {latestAttempt?.total_score || qualityScore?.total_score || 78} / 100
                  </span>
                </div>
              </div>

              {latestAttempt?.criteria_scores && latestAttempt.criteria_scores.length > 0 ? (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                  {latestAttempt.criteria_scores.map((cs, idx) => (
                    <div key={cs.criterion_id} className="p-3.5 flex items-start justify-between gap-4 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-slate-800">{cs.name}</span>
                          <span className="text-[11px] font-medium text-slate-400">({cs.weight}%)</span>
                        </div>
                        {cs.comment && (
                          <p className="text-slate-600 pl-6 italic">
                            ↳ Nhận xét của BTV: <span className="text-slate-800 font-medium">"{cs.comment}"</span>
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-black text-sm text-slate-900">{cs.score} điểm</span>
                        <span className="block text-[11px] text-slate-400">
                          (Quy đổi: {cs.weighted_score || ((cs.score * cs.weight) / 100)} đ)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-500">
                  Không tìm thấy chi tiết tiêu chí của lần chấm này.
                </div>
              )}

              {latestAttempt?.note && (
                <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs text-indigo-900">
                  <span className="font-bold">Đánh giá chung của BTV: </span>
                  {latestAttempt.note}
                </div>
              )}
            </div>

            {/* Lịch sử các lần chấm trước (nếu có, ví dụ lần 1 trả về sửa) */}
            {previousAttempts.length > 0 && (
              <div className="border border-amber-200 bg-amber-50/40 rounded-xl p-3.5 space-y-2">
                <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-amber-600" />
                  Lịch sử lần chấm trước (Lần {previousAttempts[0].attempt_no}):
                </span>
                {previousAttempts.map(pAtt => (
                  <div key={pAtt.id} className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-amber-100 space-y-1">
                    <div className="flex justify-between font-medium">
                      <span>Lần {pAtt.attempt_no} ({pAtt.scored_at}) · BTV: {getUser(pAtt.scorer_id)?.full_name}</span>
                      <span className="font-bold text-amber-800">{pAtt.total_score}/100 điểm ({pAtt.decision === 'RETURN' ? 'Trả về' : 'Từ chối'})</span>
                    </div>
                    {pAtt.note && (
                      <p className="text-slate-500 italic text-[11px]">"{pAtt.note}"</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Khối quyết định của Trưởng ban */}
            {!isRequestingRescore ? (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800 block">Thời điểm công bố & Hạn khiếu nại:</span>
                    <span className="text-slate-500">
                      Khi duyệt điểm, thời hạn khiếu nại được ấn định là <strong>7 ngày</strong> kể từ ngày công bố điểm.
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Hạn khiếu nại dự kiến:</span>
                    <span className="font-black text-sm text-indigo-700">
                      {getComplaintDeadline(approvalDate)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsRequestingRescore(true)}
                    className="flex items-center gap-1.5 px-4 py-2.5 border border-amber-300 hover:bg-amber-50 text-amber-800 rounded-xl text-xs font-bold transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Yêu cầu chấm lại</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleApproveScore}
                    className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Phê duyệt & Công bố điểm</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Khối nhập lý do yêu cầu chấm lại */
              <div className="p-4 bg-rose-50/60 rounded-2xl border border-rose-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                    <RotateCcw className="w-4 h-4 text-rose-600" />
                    Yêu cầu BTV chấm lại bài viết
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsRequestingRescore(false)}
                    className="text-xs text-slate-500 hover:underline"
                  >
                    Quay lại
                  </button>
                </div>

                <p className="text-xs text-slate-600">
                  Bài viết sẽ chuyển về hàng việc của <strong>BTV {getUser(selectedArticle.editor_id)?.full_name}</strong> với nhãn <strong>"Trưởng ban yêu cầu chấm lại"</strong>.
                </p>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Lý do yêu cầu chấm lại: <span className="text-red-500">* (Bắt buộc)</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Ví dụ: Đề nghị BTV đánh giá lại tiêu chí Ảnh/minh họa do tác giả đã bổ sung bộ ảnh hiện trường độc quyền..."
                    value={rescoreReason}
                    onChange={e => setRescoreReason(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-rose-300 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 bg-white placeholder:text-slate-400"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsRequestingRescore(false)}
                    className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleRequestRescore}
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                  >
                    Xác nhận yêu cầu BTV chấm lại
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
