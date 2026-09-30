import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/common/Header';
import { StatusBadge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { CriterionScoreDetail, formatDate } from '../../types';
import {
  Award,
  CheckCircle2,
  RotateCcw,
  XCircle,
  AlertTriangle,
  FileText,
  User,
  Calendar,
  Layers,
  Sparkles,
  ArrowLeft,
  Info,
  Sliders,
  History,
  Image as ImageIcon,
  Film,
  ExternalLink,
  ShieldAlert,
  Hash,
  RefreshCw,
  Lock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export const QualityScoringScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    state,
    dispatch,
    notify,
    getGenre,
    getSection,
    getUser,
    getActiveCriteriaSet,
    getArticleAttachments,
    getArticleAuthors,
    getScoringAttempts,
    getArticleLogs
  } = useApp();

  const article = state.articles.find(a => a.id === id);
  const authors = article ? getArticleAuthors(article.id) : [];
  const attachments = article ? getArticleAttachments(article.id) : [];
  const attempts = article ? getScoringAttempts(article.id) : [];
  const logs = article ? getArticleLogs(article.id) : [];

  // Thể loại áp dụng hiện tại
  const currentGenreId = article?.category_id || article?.genre_id || 'cat-phongsu';
  const currentGenre = getGenre(currentGenreId);

  // Nạp bộ tiêu chí ACTIVE của thể loại
  const activeCriteriaSet = useMemo(() => {
    return getActiveCriteriaSet(currentGenreId);
  }, [currentGenreId, getActiveCriteriaSet, state.criteriaSets]);

  // Modal đổi thể loại
  const [showChangeGenreModal, setShowChangeGenreModal] = useState(false);
  const [selectedNewGenreId, setSelectedNewGenreId] = useState('');
  const [changeGenreReason, setChangeGenreReason] = useState('');

  // Điểm cho từng tiêu chí
  const [criteriaScores, setCriteriaScores] = useState<Record<string, { score: number; comment: string }>>({});
  const [generalNote, setGeneralNote] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [expandedAttemptId, setExpandedAttemptId] = useState<string | null>(null);

  // Khởi tạo điểm khi tiêu chí thay đổi hoặc tải bài viết
  useEffect(() => {
    if (activeCriteriaSet && activeCriteriaSet.criteria.length > 0) {
      // Nếu bài viết này có attempt trước đó hoặc qualityScores hiện có, có thể nạp làm gợi ý nếu chưa có
      const initial: Record<string, { score: number; comment: string }> = {};
      // Chỉ nạp gợi ý từ lần chấm CHÍNH của chính BTV đang đăng nhập (không lộ điểm chấm lại / khiếu nại)
      const latestAttempt = attempts.find(
        a => a.scorer_id === state.currentUser.id && a.scorer_type === 'PRIMARY'
      );

      activeCriteriaSet.criteria.forEach(crit => {
        const pastScore = latestAttempt?.criteria_scores?.find(cs => cs.criterion_id === crit.id);
        initial[crit.id] = {
          score: pastScore ? pastScore.score : 80,
          comment: pastScore?.comment || ''
        };
      });
      setCriteriaScores(initial);
    }
  }, [activeCriteriaSet, state.currentUser.id]);

  if (!article) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-xs max-w-lg mx-auto my-12">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-800">Không tìm thấy bài viết</h2>
        <p className="text-sm text-slate-500 mt-2 mb-6">Mã bài viết "{id}" không tồn tại hoặc đã bị xóa khỏi hệ thống.</p>
        <button
          onClick={() => navigate('/editor/queue')}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          Quay lại Hàng việc của tôi
        </button>
      </div>
    );
  }

  // Thể loại bị khóa nếu bài viết không ở trạng thái phân công / đang chấm
  const isCategoryLocked = article.status !== 'ASSIGNED';
  // Chỉ BTV được giao và bài đang ở trạng thái ASSIGNED mới được chấm; các trường hợp khác chỉ xem
  const canScore = article.status === 'ASSIGNED' && article.editor_id === state.currentUser.id;

  // Tính tổng điểm = Σ (điểm × trọng số), thang 100, làm tròn 1 chữ số thập phân
  const { totalScore, detailsList } = useMemo(() => {
    if (!activeCriteriaSet) return { totalScore: 0, detailsList: [] };

    let weightedSum = 0;
    const details: CriterionScoreDetail[] = [];

    activeCriteriaSet.criteria.forEach(crit => {
      const entry = criteriaScores[crit.id] || { score: 0, comment: '' };
      const rawScore = Number(entry.score) || 0;
      const validScore = Math.max(0, Math.min(100, rawScore));
      const wScore = (validScore * crit.weight) / 100;
      weightedSum += wScore;

      details.push({
        criterion_id: crit.id,
        name: crit.name,
        weight: crit.weight,
        score: validScore,
        weighted_score: Math.round(wScore * 100) / 100,
        comment: entry.comment || ''
      });
    });

    const roundedTotal = Math.round(weightedSum * 10) / 10;
    return { totalScore: roundedTotal, detailsList: details };
  }, [activeCriteriaSet, criteriaScores]);

  // Bậc tham khảo: ≥ 90 Xuất sắc, 70–89 Khá, < 70 Đạt
  const scoreTier = useMemo(() => {
    if (totalScore >= 90) return { label: 'Xuất sắc', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    if (totalScore >= 70) return { label: 'Khá', color: 'bg-blue-100 text-blue-800 border-blue-300' };
    return { label: 'Đạt', color: 'bg-amber-100 text-amber-800 border-amber-300' };
  }, [totalScore]);

  // Kiểm tra tính hợp lệ của nhận xét với điểm < 50
  const invalidLowScoreCriteria = useMemo(() => {
    if (!activeCriteriaSet) return [];
    return activeCriteriaSet.criteria.filter(crit => {
      const entry = criteriaScores[crit.id];
      if (!entry) return false;
      return entry.score < 50 && (!entry.comment || entry.comment.trim() === '');
    });
  }, [activeCriteriaSet, criteriaScores]);

  const handleScoreChange = (critId: string, val: number) => {
    const clamped = Math.max(0, Math.min(100, val));
    setCriteriaScores(prev => ({
      ...prev,
      [critId]: {
        ...prev[critId],
        score: clamped
      }
    }));
  };

  const handleCommentChange = (critId: string, comment: string) => {
    setCriteriaScores(prev => ({
      ...prev,
      [critId]: {
        ...prev[critId],
        comment
      }
    }));
  };

  // Đổi thể loại
  const handleChangeGenreSubmit = () => {
    if (!selectedNewGenreId) {
      notify('Vui lòng chọn thể loại mới', 'error');
      return;
    }
    if (!changeGenreReason.trim()) {
      notify('Bắt buộc phải ghi rõ lý do đổi thể loại tác phẩm', 'error');
      return;
    }

    dispatch({
      type: 'CHANGE_ARTICLE_CATEGORY',
      payload: {
        articleId: article.id,
        newCategoryId: selectedNewGenreId,
        reason: changeGenreReason.trim()
      }
    });

    notify(`Đã đổi thể loại thành "${getGenre(selectedNewGenreId)?.name}". Hệ thống đã nạp lại bộ tiêu chí mới.`, 'success');
    setShowChangeGenreModal(false);
    setSelectedNewGenreId('');
    setChangeGenreReason('');
  };

  // Nút 1: Nhận & gửi duyệt điểm -> PENDING_APPROVAL
  const handleAcceptAndSubmit = () => {
    if (invalidLowScoreCriteria.length > 0) {
      notify(`Các tiêu chí điểm dưới 50 bắt buộc phải ghi rõ nhận xét: ${invalidLowScoreCriteria.map(c => c.name).join(', ')}`, 'error');
      return;
    }

    dispatch({
      type: 'SCORE_ARTICLE',
      payload: {
        articleId: article.id,
        criteriaScores: detailsList,
        criteriaSetVersion: activeCriteriaSet?.version || 1,
        note: generalNote.trim() || 'BTV đánh giá đạt yêu cầu chất lượng, đề xuất Trưởng ban duyệt điểm.',
        action: 'NHAN',
        newCategoryId: article.category_id
      }
    });

    notify(`Đã gửi kết quả chấm (${totalScore}/100 điểm) lên Trưởng ban duyệt!`, 'success');
    navigate('/editor/queue');
  };

  // Nút 2: Trả về -> REVISION_REQUESTED (bắt buộc nhận xét chung)
  const handleReturnForRevision = () => {
    if (!generalNote.trim()) {
      notify('Bắt buộc phải ghi nhận xét chung/yêu cầu sửa bài khi Trả về cho phóng viên', 'error');
      return;
    }
    if (invalidLowScoreCriteria.length > 0) {
      notify(`Tiêu chí điểm dưới 50 bắt buộc phải có nhận xét chi tiết: ${invalidLowScoreCriteria.map(c => c.name).join(', ')}`, 'error');
      return;
    }

    dispatch({
      type: 'SCORE_ARTICLE',
      payload: {
        articleId: article.id,
        criteriaScores: detailsList,
        criteriaSetVersion: activeCriteriaSet?.version || 1,
        note: generalNote.trim(),
        action: 'TRA_VE',
        newCategoryId: article.category_id
      }
    });

    notify('Đã trả về bài viết cho Phóng viên hoàn thiện lại nội dung!', 'warning');
    navigate('/editor/queue');
  };

  // Nút 3: Từ chối -> REJECTED (bắt buộc lý do)
  const handleRejectArticle = () => {
    if (!generalNote.trim()) {
      notify('Bắt buộc phải ghi rõ lý do từ chối tác phẩm', 'error');
      return;
    }

    dispatch({
      type: 'SCORE_ARTICLE',
      payload: {
        articleId: article.id,
        criteriaScores: detailsList,
        criteriaSetVersion: activeCriteriaSet?.version || 1,
        note: generalNote.trim(),
        action: 'TU_CHOI',
        newCategoryId: article.category_id
      }
    });

    notify('Đã từ chối bài viết!', 'info');
    navigate('/editor/queue');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <PageHeader
        breadcrumbs={[
          { label: 'Hàng việc của tôi', link: '/editor/queue' },
          { label: `Phiếu chấm: ${article.title}` }
        ]}
        title="Phiếu chấm điểm chất lượng tác phẩm"
        description="Thẩm định nội dung bài viết, đánh giá theo thang điểm 100 từng tiêu chí của thể loại và ra quyết định xử lý."
        actions={
          <button
            onClick={() => navigate('/editor/queue')}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại hàng việc
          </button>
        }
      />

      {/* Lịch sử các lần chấm trước (nếu có) */}
      {attempts.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowHistory(!showHistory)}>
            <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
              <History className="w-4 h-4 text-indigo-600" />
              <span>Lịch sử các lần chấm bài viết này ({attempts.length} lần chấm)</span>
            </div>
            <button className="text-xs text-indigo-600 font-medium hover:underline flex items-center gap-1">
              {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showHistory ? 'Thu gọn lịch sử' : 'Xem chi tiết các lần trước'}
            </button>
          </div>

          {showHistory && (
            <div className="mt-4 space-y-3 pt-3 border-t border-slate-200">
              {attempts.map(att => (
                <div key={att.id} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">Lần {att.attempt_no}</span>
                      <span className="text-xs text-slate-400">· {att.scored_at}</span>
                      <span className="text-xs text-slate-500 font-medium">BTV: {getUser(att.scorer_id)?.full_name || att.scorer_id}</span>
                      {att.decision === 'ACCEPT' && (
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-emerald-100 text-emerald-800">
                          Nhận bài (Đề xuất duyệt)
                        </span>
                      )}
                      {att.decision === 'RETURN' && (
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-amber-100 text-amber-800">
                          Trả về sửa
                        </span>
                      )}
                      {att.decision === 'REJECT' && (
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-rose-100 text-rose-800">
                          Từ chối
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-bold text-slate-900">
                      Tổng điểm: <span className="text-indigo-600">{att.total_score}</span> / 100
                    </div>
                  </div>

                  {att.note && (
                    <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <span className="font-semibold text-slate-700">Nhận xét chung: </span>
                      {att.note}
                    </div>
                  )}

                  {att.criteria_scores && att.criteria_scores.length > 0 && (
                    <div className="text-xs">
                      <button
                        onClick={() => setExpandedAttemptId(expandedAttemptId === att.id ? null : att.id)}
                        className="text-xs text-indigo-600 font-medium hover:underline mb-2 block"
                      >
                        {expandedAttemptId === att.id ? 'Ẩn chi tiết điểm tiêu chí' : 'Xem chi tiết điểm từng tiêu chí'}
                      </button>
                      {expandedAttemptId === att.id && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100">
                          {att.criteria_scores.map(cs => (
                            <div key={cs.criterion_id} className="p-2 rounded bg-slate-50 border border-slate-100 text-slate-700">
                              <div className="flex justify-between font-medium">
                                <span>{cs.name} ({cs.weight}%)</span>
                                <span className="font-bold text-slate-900">{cs.score} điểm</span>
                              </div>
                              {cs.comment && (
                                <p className="text-[11px] text-amber-700 mt-1 italic">↳ {cs.comment}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CỘT TRÁI: Nội dung bài (chỉ đọc) + ảnh/video + khai báo của PV */}
        <div className="lg:col-span-6 space-y-6">
          {/* Card 1: Khai báo của Phóng viên */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Khai báo & Thông tin tác phẩm
            </h3>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-500 block">Ban chuyên môn:</span>
                <span className="font-semibold text-slate-800">{getSection(article.section_id)?.name || 'Ban Xã hội'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-500 block">Thể loại PV khai báo:</span>
                <span className="font-semibold text-slate-800">{getGenre(article.declared_category_id)?.name || 'Chưa rõ'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-500 block">Tính chất bài viết:</span>
                <span className="font-semibold text-slate-800">
                  {article.declared_nature === 'SANG_TAC' ? 'Sáng tác mới' :
                   article.declared_nature === 'DICH' ? 'Dịch thuật' :
                   article.declared_nature === 'TONG_HOP' ? 'Tổng hợp thông tin' : 'Đăng lại / Tư liệu'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-500 block">Trạng thái hiện tại:</span>
                <StatusBadge status={article.status} />
              </div>
            </div>

            {/* Tác giả & đồng tác giả */}
            <div className="pt-3 border-t border-slate-100">
              <span className="text-xs font-semibold text-slate-500 block mb-2">Tác giả & Phân chia nhuận bút:</span>
              <div className="flex flex-wrap gap-2">
                {authors.map(au => {
                  const u = getUser(au.user_id);
                  return (
                    <div
                      key={au.user_id}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${
                        au.is_main
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>{u?.full_name || au.user_id}</span>
                      <span className="font-bold">({au.share_percent}%)</span>
                      {au.is_main && <span className="text-[10px] bg-blue-200 text-blue-900 px-1 rounded">Chính</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sự kiện / bão hòa / trùng lặp */}
            {(article.event_id || (article.duplication_percent !== undefined && article.duplication_percent > 0)) && (
              <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                {article.event_id && (
                  <div className="flex items-center gap-2 text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span>Bài viết gắn sự kiện: <strong>Đợt hạn mặn lịch sử 2026</strong> (Hệ số bão hòa: {article.saturation_rate || 80}%)</span>
                  </div>
                )}
                {article.duplication_percent !== undefined && (
                  <div className="flex items-start gap-2 text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <ShieldAlert className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Kiểm tra trùng lặp: {article.duplication_percent}%</span>
                      {article.duplication_explanation && (
                        <p className="text-slate-500 text-[11px] mt-0.5 italic">{article.duplication_explanation}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Card 2: Nội dung bài viết (Chỉ đọc) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider block mb-1">
                {currentGenre?.name || 'Phóng sự'}
              </span>
              <h2 className="text-xl font-bold text-slate-900 leading-snug">{article.title}</h2>
              <p className="text-sm font-medium text-slate-600 mt-2 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed italic">
                {article.sapo}
              </p>
            </div>

            <div className="prose prose-slate max-w-none text-sm leading-relaxed text-slate-800 whitespace-pre-line">
              {article.content}
            </div>
          </div>

          {/* Card 3: Ảnh & Video đính kèm */}
          {attachments.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
              <h3 className="font-bold text-slate-900 text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-indigo-600" />
                  Media đính kèm ({attachments.length} tác phẩm)
                </span>
                <span className="text-xs font-normal text-slate-500">Ảnh / Video đã kiểm tra bản quyền dHash</span>
              </h3>

              <div className="space-y-4">
                {attachments.map((att, idx) => (
                  <div key={att.id || idx} className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                    {att.media_type === 'IMAGE' ? (
                      <div className="relative">
                        <img
                          src={att.url}
                          alt={att.caption || att.original_name}
                          className="w-full h-56 object-cover bg-slate-200"
                        />
                        <div className="absolute top-2 right-2">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            att.hash_check === 'MOI'
                              ? 'bg-emerald-600 text-white'
                              : att.hash_check === 'TAI_SU_DUNG'
                                ? 'bg-amber-600 text-white'
                                : 'bg-slate-700 text-white'
                          }`}>
                            {att.hash_check === 'MOI' ? 'Ảnh mới 100%' :
                             att.hash_check === 'TAI_SU_DUNG' ? 'Tái sử dụng (Trùng dHash)' : 'Nguồn ngoài'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Film className="w-8 h-8 text-rose-400" />
                          <div>
                            <p className="font-semibold text-sm">{att.original_name}</p>
                            <p className="text-xs text-slate-400">Video tự quay · MP4</p>
                          </div>
                        </div>
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-xs text-white flex items-center gap-1 font-medium transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Xem clip
                        </a>
                      </div>
                    )}
                    <div className="p-3 text-xs text-slate-700">
                      <p className="font-medium text-slate-900">{att.caption || 'Chưa có chú thích'}</p>
                      <div className="flex items-center gap-4 mt-1 text-[11px] text-slate-500">
                        <span>Tác giả media: {getUser(att.media_author_id || article.author_id)?.full_name}</span>
                        <span>Loại: {att.media_kind === 'ANH_TU_CHUP' ? 'Ảnh tự chụp' : att.media_kind === 'VIDEO_TU_QUAY' ? 'Video tự quay' : 'Tư liệu'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CỘT PHẢI: Phiếu chấm theo tiêu chí */}
        <div className="lg:col-span-6 space-y-6">
          {/* Card Phiếu chấm */}
          <div className="bg-white rounded-2xl border-2 border-indigo-200 p-6 space-y-6 shadow-sm">
            {/* Header bộ tiêu chí */}
            <div className="border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
                  <Award className="w-4 h-4" />
                  Phiếu thẩm định chất lượng
                </span>
                {isCategoryLocked || !canScore ? (
                  <span className="text-xs text-slate-400 flex items-center gap-1 font-medium bg-slate-100 px-2.5 py-1 rounded-md">
                    <Lock className="w-3.5 h-3.5" />
                    Thể loại đã khóa
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedNewGenreId(article.category_id || article.genre_id || 'cat-phongsu');
                      setShowChangeGenreModal(true);
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 hover:underline"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Đổi thể loại
                  </button>
                )}
              </div>

              <div className="flex items-baseline justify-between">
                <h3 className="text-lg font-black text-slate-900">
                  Bộ tiêu chí {currentGenre?.name || 'Phóng sự'} – phiên bản {activeCriteriaSet?.version || 1}
                </h3>
                <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-semibold">
                  Đang Active
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {activeCriteriaSet?.note || 'Hệ thống tự động áp dụng phiên bản tiêu chí chuẩn của thể loại'}
              </p>
            </div>

            {!canScore && (
              <div className="flex items-start gap-2 rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 text-xs text-slate-700">
                <Lock className="w-4 h-4 mt-0.5 shrink-0 text-slate-500" />
                <span>
                  <b>Chế độ chỉ xem.</b>{' '}
                  {article.status === 'ASSIGNED'
                    ? 'Bài này được giao cho BTV khác chấm.'
                    : 'Bài không ở trạng thái chờ chấm – phiếu hiển thị lần chấm gần nhất của bạn. Xem đủ các lần chấm ở mục "Lịch sử các lần chấm" phía trên.'}
                </span>
              </div>
            )}
            <fieldset disabled={!canScore} className="space-y-6 disabled:opacity-80">
            {/* Danh sách tiêu chí */}
            {activeCriteriaSet && activeCriteriaSet.criteria.length > 0 ? (
              <div className="space-y-5">
                {activeCriteriaSet.criteria.map((crit, idx) => {
                  const entry = criteriaScores[crit.id] || { score: 80, comment: '' };
                  const isLowScore = entry.score < 50;
                  const isCommentMissing = isLowScore && (!entry.comment || entry.comment.trim() === '');
                  const weightedPoint = Math.round(((entry.score * crit.weight) / 100) * 10) / 10;

                  return (
                    <div
                      key={crit.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isCommentMissing
                          ? 'border-red-400 bg-red-50/20 shadow-xs'
                          : isLowScore
                            ? 'border-amber-300 bg-amber-50/20'
                            : 'border-slate-200 bg-slate-50/40 hover:border-indigo-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 font-bold text-xs flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <h4 className="text-sm font-bold text-slate-900">{crit.name}</h4>
                          </div>
                          {crit.description && (
                            <p className="text-xs text-slate-500 mt-1 pl-7 leading-relaxed">{crit.description}</p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                            Trọng số {crit.weight}%
                          </span>
                          <span className="block text-[11px] text-slate-500 mt-1 font-medium">
                            + {weightedPoint} đ
                          </span>
                        </div>
                      </div>

                      {/* Slider & Điểm số */}
                      <div className="mt-3 pl-7 space-y-2">
                        <div className="flex items-center gap-4">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="1"
                            value={entry.score}
                            onChange={e => handleScoreChange(crit.id, parseInt(e.target.value) || 0)}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                          />
                          <div className="flex items-center gap-1 shrink-0">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={entry.score}
                              onChange={e => handleScoreChange(crit.id, parseInt(e.target.value) || 0)}
                              className={`w-16 px-2 py-1 text-center font-black rounded-lg border text-sm focus:outline-none ${
                                isLowScore
                                  ? 'border-red-400 bg-red-50 text-red-700'
                                  : 'border-slate-300 text-slate-900 focus:border-indigo-500'
                              }`}
                            />
                            <span className="text-xs text-slate-400">/ 100</span>
                          </div>
                        </div>

                        {/* Ô nhận xét từng tiêu chí */}
                        <div className="mt-2">
                          <input
                            type="text"
                            placeholder={isLowScore ? 'Bắt buộc ghi rõ lý do trừ điểm (< 50)...' : 'Nhận xét chi tiết tiêu chí này (tùy chọn)...'}
                            value={entry.comment}
                            onChange={e => handleCommentChange(crit.id, e.target.value)}
                            className={`w-full px-3 py-1.5 rounded-lg text-xs border focus:outline-none transition-colors ${
                              isCommentMissing
                                ? 'border-red-500 bg-red-50 text-red-900 placeholder:text-red-400 focus:ring-1 focus:ring-red-500'
                                : 'border-slate-300 bg-white placeholder:text-slate-400 focus:border-indigo-500'
                            }`}
                          />
                          {isCommentMissing && (
                            <p className="text-[11px] text-red-600 font-semibold mt-1 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Điểm dưới 50 bắt buộc phải ghi nhận xét lý do!
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
                <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">Chưa có bộ tiêu chí đang kích hoạt cho thể loại này.</p>
                <p className="text-xs text-slate-500 mt-1">Vui lòng liên hệ Admin kích hoạt bộ tiêu chí tại /admin/criteria-sets.</p>
              </div>
            )}

            {/* BẢNG TỔNG ĐIỂM LIVE & BẬC THAM KHẢO */}
            <div className="bg-gradient-to-br from-indigo-50 via-slate-50 to-blue-50 rounded-2xl border-2 border-indigo-200 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Tổng điểm chất lượng (Thang 100)
                  </span>
                  <p className="text-xs text-slate-400">Tự động cập nhật trực tiếp theo trọng số tiêu chí</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-indigo-700">
                    {totalScore}
                    <span className="text-sm font-bold text-slate-500 ml-1">/ 100</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-indigo-100/60">
                <span className="text-xs font-semibold text-slate-600">Bậc tham khảo:</span>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-black border ${scoreTier.color}`}>
                    {scoreTier.label}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    (≥ 90: Xuất sắc · 70–89: Khá · &lt; 70: Đạt)
                  </span>
                </div>
              </div>
            </div>

            {/* Ô nhận xét chung / lý do */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Nhận xét chung của Biên tập viên:</span>
                <span className="text-[11px] font-normal text-slate-400">
                  (Bắt buộc khi Trả về hoặc Từ chối)
                </span>
              </label>
              <textarea
                rows={3}
                placeholder="Nhập đánh giá tổng thể bài viết, các điểm cần chỉnh sửa hoặc lý do trả về / từ chối..."
                value={generalNote}
                onChange={e => setGeneralNote(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-indigo-500 placeholder:text-slate-400"
              />
            </div>

            </fieldset>

            {/* 3 NÚT HÀNH ĐỘNG CHUẨN ĐẶC TẢ */}
            {canScore && (
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Nút 1: Nhận & gửi duyệt điểm */}
                <button
                  onClick={handleAcceptAndSubmit}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-xs transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Nhận & gửi duyệt điểm</span>
                </button>

                {/* Nút 2: Trả về */}
                <button
                  onClick={handleReturnForRevision}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold shadow-xs transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Trả về (Y/c sửa)</span>
                </button>

                {/* Nút 3: Từ chối */}
                <button
                  onClick={handleRejectArticle}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold shadow-xs transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Từ chối</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-400 text-center italic">
                * Lưu ý: Mỗi lần gửi phiếu sẽ tạo 1 bản ghi chấm mới (không ghi đè lịch sử).
              </p>
            </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL ĐỔI THỂ LOẠI TÁC PHẨM */}
      <Modal
        isOpen={showChangeGenreModal}
        onClose={() => setShowChangeGenreModal(false)}
        title="Đổi thể loại tác phẩm"
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              Lưu ý quy định chuyển thể loại:
            </p>
            <p>
              Hệ thống sẽ nạp lại bộ tiêu chí của thể loại mới và ghi nhận nhật ký đổi thể loại. Sau khi gửi phiếu chấm, thể loại sẽ bị khóa vĩnh viễn.
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Thể loại hiện tại:
            </label>
            <div className="p-2.5 bg-slate-100 rounded-lg text-sm font-bold text-slate-700">
              {currentGenre?.name || 'Chưa xác định'}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Chọn thể loại mới: <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedNewGenreId}
              onChange={e => setSelectedNewGenreId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:outline-none focus:border-indigo-500"
            >
              {state.genres.map(g => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Lý do đổi thể loại: <span className="text-red-500">* (Bắt buộc)</span>
            </label>
            <textarea
              rows={3}
              placeholder="Ghi rõ căn cứ đổi thể loại (ví dụ: Tác phẩm có tính chất điều tra hiện trường sâu, phù hợp thể loại Phóng sự hơn Tin)..."
              value={changeGenreReason}
              onChange={e => setChangeGenreReason(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-indigo-500 placeholder:text-slate-400"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowChangeGenreModal(false)}
              className="px-4 py-2 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleChangeGenreSubmit}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-xs transition-colors"
            >
              Xác nhận đổi thể loại
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
