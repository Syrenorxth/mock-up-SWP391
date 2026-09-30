import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/common/Header';
import { StatusBadge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Article, ScoringAttempt, formatDate } from '../../types';
import {
  Award,
  Calendar,
  Clock,
  User,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  MessageSquare,
  ShieldCheck,
  Send,
  CheckCircle2,
  FileText,
  HelpCircle
} from 'lucide-react';

interface ScoringResultBlockProps {
  articleId: string;
  isEmbedded?: boolean;
}

export const ScoringResultBlock: React.FC<ScoringResultBlockProps> = ({ articleId, isEmbedded = false }) => {
  const {
    state,
    notify,
    getGenre,
    getUser,
    getArticleAuthors,
    getArticleQualityScore,
    getEffectiveScoringAttempt,
    getScoringAttempts
  } = useApp();
  const navigate = useNavigate();

  const article = state.articles.find(a => a.id === articleId);
  const authors = article ? getArticleAuthors(article.id) : [];
  const mainAuthor = authors.find(a => a.is_main);
  const effectiveAttempt = article ? getEffectiveScoringAttempt(article.id) : undefined;
  const qualityScore = article ? getArticleQualityScore(article.id) : undefined;

  const [showAppealModal, setShowAppealModal] = useState(false);
  const [appealReason, setAppealReason] = useState('');

  if (!article) return null;

  // Lấy điểm và các tiêu chí
  const totalScore = effectiveAttempt?.total_score ?? qualityScore?.total_score ?? 78;
  const criteriaScores = effectiveAttempt?.criteria_scores || qualityScore?.criteria_scores || [];
  const scorePublishedAt = article.score_published_at || effectiveAttempt?.score_published_at || '2026-06-25 15:00';
  const complaintDeadline = effectiveAttempt?.complaint_deadline || '02/07/2026';

  // Kiểm tra quyền của người dùng hiện tại
  const isAuthor = article.author_id === state.currentUser.id || authors.some(a => a.user_id === state.currentUser.id);
  const isMain = article.author_id === state.currentUser.id || mainAuthor?.user_id === state.currentUser.id;

  // Kiểm tra hạn khiếu nại (so với ngày hiện tại của hệ thống / demo)
  // Trong mock data, demo ngày 25/06 -> hạn 02/07/2026
  const isDeadlineValid = true; // Cho phép tương tác demo

  const handleSendAppeal = () => {
    if (!appealReason.trim()) {
      notify('Vui lòng nhập nội dung và căn cứ khiếu nại điểm chất lượng', 'error');
      return;
    }

    notify(
      `Đã gửi đơn khiếu nại điểm bài viết "${article.title}" lên Hội đồng thẩm định (Luồng 03)!`,
      'success'
    );
    setShowAppealModal(false);
    setAppealReason('');
  };

  return (
    <div className={`space-y-6 ${isEmbedded ? '' : 'bg-white rounded-2xl border border-slate-200 p-6 shadow-xs'}`}>
      {/* Tiêu đề & Thông báo công bố điểm */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-xs shrink-0">
            <Award className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider block">
              Kết quả đánh giá chất lượng tác phẩm
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-2xl font-black text-slate-900">{totalScore}</span>
              <span className="text-xs font-bold text-slate-500">/ 100 điểm</span>
              <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${
                totalScore >= 90 ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                totalScore >= 70 ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-amber-100 text-amber-800 border-amber-300'
              }`}>
                {totalScore >= 90 ? 'Xuất sắc' : totalScore >= 70 ? 'Khá' : 'Đạt'}
              </span>
            </div>
          </div>
        </div>

        {/* Hạn khiếu nại */}
        <div className="text-left sm:text-right text-xs bg-white sm:bg-transparent p-3 sm:p-0 rounded-lg border sm:border-0 border-indigo-100">
          <span className="text-slate-500 block">Thời điểm công bố điểm:</span>
          <span className="font-bold text-slate-800 block">{scorePublishedAt}</span>
          <div className="mt-1 flex items-center sm:justify-end gap-1.5 text-amber-800 font-bold">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Hạn khiếu nại đến: {complaintDeadline}</span>
          </div>
        </div>
      </div>

      {/* Chi tiết từng tiêu chí */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            Bảng điểm theo từng tiêu chí đánh giá
          </h4>
          <span className="text-xs text-slate-400">
            {getGenre(article.category_id || article.genre_id)?.name} – Phiên bản {effectiveAttempt?.criteria_set_version || qualityScore?.criteria_set_version || 2}
          </span>
        </div>

        <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
          {criteriaScores.map((item, idx) => (
            <div key={item.criterion_id || idx} className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[11px]">
                    {idx + 1}
                  </span>
                  <span className="font-bold text-slate-900 text-sm">{item.name}</span>
                  <span className="text-slate-400 font-semibold">({item.weight}%)</span>
                </div>
                {item.comment ? (
                  <p className="text-slate-600 pl-7 italic bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1">
                    ↳ Nhận xét BTV: <span className="text-slate-800 font-medium">"{item.comment}"</span>
                  </p>
                ) : (
                  <p className="text-slate-400 pl-7 text-[11px] italic">Không có nhận xét bổ sung</p>
                )}
              </div>

              <div className="text-left sm:text-right shrink-0 pl-7 sm:pl-0">
                <div className="text-base font-black text-slate-900">
                  {item.score} <span className="text-xs text-slate-400 font-normal">/ 100</span>
                </div>
                <span className="text-[11px] text-indigo-600 font-semibold block">
                  Đóng góp: {item.weighted_score || ((item.score * item.weight) / 100)} đ
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Nhận xét chung của BTV */}
      {(effectiveAttempt?.note || qualityScore?.note) && (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
          <span className="font-bold text-slate-900 block">Đánh giá chung của Biên tập viên:</span>
          <p className="leading-relaxed italic text-slate-600">
            "{effectiveAttempt?.note || qualityScore?.note}"
          </p>
        </div>
      )}

      {/* Khối khiếu nại (Chỉ tác giả chính và còn thời hạn) */}
      <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-slate-500">
          <span className="font-semibold text-slate-700 block">Quyền khiếu nại điểm số:</span>
          {isMain ? (
            <span>Tác giả chính có quyền gửi đơn khiếu nại điểm nếu phát hiện đánh giá chưa thỏa đáng trước ngày <strong>{complaintDeadline}</strong>.</span>
          ) : (
            <span className="text-slate-400">Bạn là đồng tác giả. Chỉ tác giả chính mới có quyền gửi đơn khiếu nại.</span>
          )}
        </div>

        {isMain && isDeadlineValid && (
          <button
            onClick={() => setShowAppealModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs transition-colors shrink-0"
          >
            <AlertCircle className="w-4 h-4" />
            <span>Gửi khiếu nại điểm</span>
          </button>
        )}
      </div>

      {/* Modal khiếu nại điểm */}
      <Modal
        isOpen={showAppealModal}
        onClose={() => setShowAppealModal(false)}
        title="Gửi khiếu nại kết quả chấm chất lượng"
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              Lưu ý quy định khiếu nại (Luồng 03):
            </p>
            <p>
              Đơn khiếu nại sẽ được chuyển đến Hội đồng thẩm định độc lập. Bạn cần nêu rõ tiêu chí nào chưa thỏa đáng kèm bằng chứng đối chứng cụ thể.
            </p>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Bài viết:
            </label>
            <div className="p-2.5 bg-slate-100 rounded-lg text-xs font-bold text-slate-800">
              {article.title} (Điểm hiện tại: {totalScore}/100)
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Nội dung & Căn cứ khiếu nại: <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              placeholder="Nêu rõ tiêu chí bạn không đồng tình, lý do và tài liệu/chứng cứ chứng minh..."
              value={appealReason}
              onChange={e => setAppealReason(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-indigo-500 placeholder:text-slate-400"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAppealModal(false)}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSendAppeal}
              className="flex items-center gap-1.5 px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Gửi đơn khiếu nại</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export const ScoringResultScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state } = useApp();

  const article = state.articles.find(a => a.id === id);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <PageHeader
        breadcrumbs={[
          { label: 'Bài viết của tôi', link: '/reporter/articles' },
          { label: 'Tác phẩm', link: `/articles/${id}` },
          { label: 'Kết quả chấm chất lượng' }
        ]}
        title="Kết quả chấm chất lượng theo tiêu chí"
        description="Bảng điểm chi tiết do Biên tập viên thẩm định và Trưởng ban đã phê duyệt công bố."
        actions={
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại tác phẩm
          </button>
        }
      />

      {id ? (
        <ScoringResultBlock articleId={id} isEmbedded={false} />
      ) : (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
          Không tìm thấy bài viết.
        </div>
      )}
    </div>
  );
};
