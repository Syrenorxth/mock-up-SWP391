import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/common/Header';
import { StatusBadge } from '../../components/common/Badge';
import { CriterionScoreDetail, formatDateTime } from '../../types';
import {
  Scale,
  Shield,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers,
  ArrowLeft,
  FileCheck,
  Send,
  Lock,
  User,
  Image,
  Video,
  FileText,
  AlertCircle
} from 'lucide-react';

export const BlindRescoreScreen: React.FC = () => {
  const { appealId } = useParams<{ appealId: string }>();
  const navigate = useNavigate();
  const {
    state,
    dispatch,
    notify,
    getGenre,
    getSection,
    getUser,
    getArticleAttachments,
    getArticleAuthors
  } = useApp();

  const appeal = useMemo(() => {
    return state.appeals.find(ap => ap.id === appealId);
  }, [state.appeals, appealId]);

  const article = useMemo(() => {
    if (!appeal) return undefined;
    return state.articles.find(a => a.id === appeal.article_id);
  }, [state.articles, appeal]);

  const isThirdReview = appeal?.status === 'IN_THIRD_REVIEW';

  // Lấy bộ tiêu chí theo thể loại và đúng phiên bản lúc chấm
  const criteriaSet = useMemo(() => {
    if (!article || !appeal) return undefined;
    const genreId = article.category_id || article.genre_id;
    // Tìm đúng phiên bản của lần chấm bị khiếu nại
    const versionMatch = state.criteriaSets.find(
      cs => cs.genre_id === genreId && cs.version === appeal.criteria_set_version
    );
    if (versionMatch) return versionMatch;

    // Hoặc lấy bản active
    return (
      state.criteriaSets.find(cs => cs.genre_id === genreId && cs.status === 'ACTIVE') ||
      state.criteriaSets.find(cs => cs.genre_id === genreId)
    );
  }, [article, appeal, state.criteriaSets]);

  // Form state cho từng tiêu chí
  const [criterionInputs, setCriterionInputs] = useState<
    Record<string, { score: number; comment: string }>
  >({});
  const [generalNote, setGeneralNote] = useState<string>('');
  const [validationError, setValidationError] = useState<string>('');
  const [showResultModal, setShowResultModal] = useState<boolean>(false);
  const [modalResultData, setModalResultData] = useState<any>(null);

  // Khởi tạo điểm mặc định khi tải tiêu chí
  useEffect(() => {
    if (criteriaSet?.criteria) {
      const initial: Record<string, { score: number; comment: string }> = {};
      criteriaSet.criteria.forEach(c => {
        initial[c.id] = {
          score: 75,
          comment: ''
        };
      });
      setCriterionInputs(initial);
    }
  }, [criteriaSet]);

  // Tính tổng điểm = Σ (điểm × trọng số), thang 100, làm tròn 1 chữ số thập phân
  const currentTotalScore = useMemo(() => {
    if (!criteriaSet?.criteria) return 0;
    const sum = criteriaSet.criteria.reduce((total, c) => {
      const input = criterionInputs[c.id];
      const score = input ? Number(input.score) || 0 : 0;
      return total + (score * c.weight) / 100;
    }, 0);
    return Math.round(sum * 10) / 10;
  }, [criteriaSet, criterionInputs]);

  // Bậc xếp loại tham khảo
  const scoreTier = useMemo(() => {
    if (currentTotalScore >= 90) return { label: 'Xuất sắc', color: 'text-emerald-700 bg-emerald-50 border-emerald-300' };
    if (currentTotalScore >= 70) return { label: 'Khá', color: 'text-blue-800 bg-blue-50 border-blue-300' };
    return { label: 'Đạt', color: 'text-amber-800 bg-amber-50 border-amber-300' };
  }, [currentTotalScore]);

  if (!appeal || !article) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900">Không tìm thấy yêu cầu khiếu nại</h3>
        <p className="text-xs text-slate-500">Mã khiếu nại #{appealId} không tồn tại hoặc đã được xử lý xong.</p>
        <Link
          to="/editor/queue"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-900 text-white text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại Hàng việc của tôi</span>
        </Link>
      </div>
    );
  }

  const genre = getGenre(article.category_id || article.genre_id);
  const section = getSection(article.section_id);
  const attachments = getArticleAttachments(article.id);
  const authors = getArticleAuthors(article.id);
  const mainAuthor = getUser(article.author_id);

  const handleScoreChange = (criterionId: string, val: number) => {
    const clamped = Math.max(0, Math.min(100, val));
    setCriterionInputs(prev => ({
      ...prev,
      [criterionId]: {
        ...prev[criterionId],
        score: clamped
      }
    }));
  };

  const handleCommentChange = (criterionId: string, text: string) => {
    setCriterionInputs(prev => ({
      ...prev,
      [criterionId]: {
        ...prev[criterionId],
        comment: text
      }
    }));
  };

  const handleSubmitScore = () => {
    setValidationError('');

    if (!criteriaSet?.criteria || criteriaSet.criteria.length === 0) {
      setValidationError('Không có tiêu chí đánh giá hợp lệ.');
      return;
    }

    // Validate: Tiêu chí < 50 điểm thì nhận xét BẮT BUỘC
    for (const c of criteriaSet.criteria) {
      const input = criterionInputs[c.id];
      const score = input?.score ?? 0;
      const comment = input?.comment?.trim() ?? '';
      if (score < 50 && (!comment || comment.length < 5)) {
        setValidationError(`Tiêu chí "${c.name}" cho dưới 50 điểm (${score}đ) bắt buộc phải có nhận xét chi tiết giải thích lý do.`);
        return;
      }
    }

    const criteriaScoresPayload: CriterionScoreDetail[] = criteriaSet.criteria.map(c => {
      const input = criterionInputs[c.id];
      const score = input?.score ?? 0;
      return {
        criterion_id: c.id,
        name: c.name,
        weight: c.weight,
        score,
        weighted_score: Math.round(((score * c.weight) / 100) * 100) / 100,
        comment: input?.comment || undefined
      };
    });

    const isThird = appeal.status === 'IN_THIRD_REVIEW';

    // Dispatch action
    if (isThird) {
      dispatch({
        type: 'SUBMIT_THIRD_REVIEW',
        payload: {
          appealId: appeal.id,
          criteriaScores: criteriaScoresPayload,
          note: generalNote || 'BTV thứ ba hoàn tất thẩm định mù độc lập'
        }
      });

      // Chuẩn bị dữ liệu hiển thị modal kết quả
      const scores = [appeal.original_score, appeal.rescore_score || 0, currentTotalScore].sort((a, b) => a - b);
      const median = scores[1];
      setModalResultData({
        stage: 'THIRD',
        myScore: currentTotalScore,
        originalScore: appeal.original_score,
        secondScore: appeal.rescore_score,
        finalScore: median,
        ruleApplied: 'MEDIAN_OF_THREE',
        ruleText: `Áp dụng quy tắc trung vị của 3 lần chấm [${scores.join(', ')}]. Điểm hiệu lực là ${median} điểm.`
      });
      setShowResultModal(true);
    } else {
      dispatch({
        type: 'SUBMIT_BLIND_RESCORE',
        payload: {
          appealId: appeal.id,
          criteriaScores: criteriaScoresPayload,
          note: generalNote || 'BTV chấm lại theo khiếu nại chất lượng (chấm mù)'
        }
      });

      // Chuẩn bị dữ liệu hiển thị modal kết quả
      let ruleApplied = '';
      let ruleText = '';
      let finalScore = currentTotalScore;

      if (currentTotalScore >= appeal.original_score) {
        ruleApplied = 'NEW_SCORE_APPLIED';
        ruleText = `Điểm chấm lại (${currentTotalScore}) ≥ Điểm gốc (${appeal.original_score}). Áp dụng điểm chấm lại ${currentTotalScore} làm điểm hiệu lực.`;
        finalScore = currentTotalScore;
      } else if (appeal.original_score - currentTotalScore <= 5) {
        ruleApplied = 'ORIGINAL_RETAINED_WITHIN_TOLERANCE';
        ruleText = `Điểm chấm lại (${currentTotalScore}) thấp hơn nhưng độ lệch là ${Math.round((appeal.original_score - currentTotalScore) * 10) / 10}đ (≤ 5đ). Giữ nguyên điểm gốc ${appeal.original_score}.`;
        finalScore = appeal.original_score;
      } else {
        ruleApplied = 'TRIGGER_THIRD_REVIEW';
        ruleText = `Điểm chấm lại (${currentTotalScore}) thấp hơn và lệch ${Math.round((appeal.original_score - currentTotalScore) * 10) / 10}đ (> 5đ) so với điểm gốc (${appeal.original_score}). Hệ thống đã tự động chuyển BTV thứ ba chấm mù độc lập.`;
        finalScore = currentTotalScore;
      }

      setModalResultData({
        stage: 'SECOND',
        myScore: currentTotalScore,
        originalScore: appeal.original_score,
        finalScore,
        ruleApplied,
        ruleText
      });
      setShowResultModal(true);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <PageHeader
        breadcrumbs={[
          { label: 'Trang chủ', link: '/editor/queue' },
          { label: 'Hàng việc của tôi', link: '/editor/queue' },
          { label: isThirdReview ? 'Chấm mù lần 3' : 'Phiếu chấm lại độc lập' }
        ]}
        title={
          isThirdReview
            ? 'Phiếu chấm mù lần 3 (Third Blind Review)'
            : 'Phiếu chấm lại độc lập do khiếu nại (Chấm mù)'
        }
        description="BTV thực hiện chấm điểm độc lập khách quan. Để đảm bảo tính công tâm, toàn bộ điểm số và nhận xét trước đây cũng như nội dung khiếu nại đều được ẩn hoàn toàn."
      />

      {/* Banner Chấm mù độc lập */}
      <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 border border-indigo-800 shadow-md">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 font-black shadow-sm">
            <EyeOff className="w-6 h-6" />
          </div>
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-0.5 rounded-full bg-amber-400 text-slate-950 text-xs font-black tracking-wider uppercase">
                Nguyên tắc chấm mù (Blind Review)
              </span>
              <span className="text-xs text-indigo-200">
                Phiên bản bộ tiêu chí khóa: <strong>Phiên bản {appeal.criteria_set_version}</strong>
              </span>
              {appeal.is_external_editor && (
                <span className="px-2 py-0.5 rounded-md bg-purple-500/30 text-purple-200 text-[11px] font-bold border border-purple-400/40">
                  BTV ngoài ban
                </span>
              )}
            </div>
            <p className="text-xs text-indigo-100/90 leading-relaxed">
              Theo quy chuẩn kiểm soát chất lượng thẩm định: BTV <strong>không thấy điểm cũ</strong>,{' '}
              <strong>không thấy nhận xét của BTV tiền nhiệm</strong> và <strong>không thấy nội dung khiếu nại</strong>. Bạn hãy thẩm định tác phẩm dựa trên phẩm chất nội dung thực tế và chuẩn hóa theo bộ tiêu chí của thể loại.
            </p>
          </div>
        </div>
      </div>

      {/* Bố cục 2 cột: Trái là Bài viết & Media; Phải là Phiếu chấm */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CỘT TRÁI (7 CỘT): NỘI DUNG BÀI VIẾT (CHỈ ĐỌC) + ẢNH/VIDEO */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
            {/* Metadata bài viết */}
            <div className="border-b border-slate-100 pb-4 space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <span className="px-3 py-1 rounded-xl text-xs font-bold bg-blue-50 text-blue-900 border border-blue-200">
                  {genre?.name || 'Thể loại'}
                </span>
                <span className="text-xs text-slate-400">
                  Mã bài: #{article.id} • Chuyên mục: {section?.name}
                </span>
              </div>

              <h2 className="text-xl font-black text-slate-900 leading-snug">
                {article.title}
              </h2>

              <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <User className="w-4 h-4 text-slate-400" />
                  <span>Tác giả: {mainAuthor?.full_name || 'Phóng viên'}</span>
                </div>
                {authors.filter(a => !a.is_main).length > 0 && (
                  <span>
                    • Đồng tác giả: {authors.filter(a => !a.is_main).map(a => getUser(a.user_id)?.full_name).join(', ')}
                  </span>
                )}
                <span>• Ngày nộp: {formatDateTime(article.first_submitted_at || article.created_at)}</span>
              </div>
            </div>

            {/* Sapo */}
            {article.sapo && (
              <div className="p-4 rounded-2xl bg-slate-50 border-l-4 border-blue-900 text-xs font-semibold text-slate-800 italic leading-relaxed">
                {article.sapo}
              </div>
            )}

            {/* Nội dung bài viết */}
            <div className="prose prose-slate max-w-none text-xs leading-relaxed text-slate-700 whitespace-pre-line">
              {article.content}
            </div>

            {/* Media đính kèm (Ảnh / Video) */}
            {attachments.length > 0 && (
              <div className="border-t border-slate-100 pt-5 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Image className="w-4 h-4 text-blue-900" />
                  <span>Media đính kèm ({attachments.length} tệp)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {attachments.map((att, idx) => (
                    <div
                      key={att.id || idx}
                      className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 text-xs"
                    >
                      {att.media_type === 'IMAGE' ? (
                        <div className="aspect-video bg-slate-200 relative overflow-hidden">
                          <img
                            src={att.url}
                            alt={att.caption || 'Ảnh đính kèm'}
                            className="w-full h-full object-cover"
                            onError={e => {
                              // Fallback placeholder
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                      ) : (
                        <div className="aspect-video bg-slate-900 flex items-center justify-center text-white">
                          <Video className="w-8 h-8 opacity-80" />
                        </div>
                      )}
                      <div className="p-2.5 space-y-1">
                        <div className="font-semibold text-slate-800 line-clamp-1">
                          {att.caption || att.original_name || 'Tệp đính kèm'}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center justify-between">
                          <span>
                            {att.media_kind === 'ANH_TU_CHUP' ? 'Ảnh tự chụp' : 'Nguồn tư liệu'}
                          </span>
                          <span>{att.hash_check === 'MOI' ? 'Ảnh mới 100%' : 'Tái sử dụng'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CỘT PHẢI (5 CỘT): PHIẾU CHẤM MÙ ĐỘC LẬP */}
        <div className="lg:col-span-5 space-y-5 sticky top-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
            {/* Header phiếu chấm */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-900">
                    {isThirdReview ? 'Hội đồng BTV thứ ba' : 'Đơn vị thẩm định độc lập'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    Chấm mù
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Bộ tiêu chí: {genre?.name} – Phiên bản {appeal.criteria_set_version}
                </h3>
              </div>

              {/* Khóa thể loại */}
              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span>Thể loại cố định</span>
                </span>
              </div>
            </div>

            {/* Bảng điểm tổng trực tiếp & Bậc xếp loại */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase">
                  Tổng điểm thẩm định (Thang 100)
                </div>
                <div className="text-3xl font-black text-blue-950 mt-0.5">
                  {currentTotalScore}
                  <span className="text-sm font-normal text-slate-400"> / 100</span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[11px] font-bold text-slate-500 mb-1">Xếp loại tham chiếu:</div>
                <span
                  className={`inline-block px-3 py-1 rounded-xl text-xs font-extrabold border ${scoreTier.color}`}
                >
                  {scoreTier.label}
                </span>
                <div className="text-[10px] text-slate-400 mt-1">
                  (≥90 Xuất sắc, 70–89 Khá, &lt;70 Đạt)
                </div>
              </div>
            </div>

            {/* Danh sách từng tiêu chí */}
            <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
              {criteriaSet?.criteria.map((crit, idx) => {
                const currentVal = criterionInputs[crit.id]?.score ?? 75;
                const currentComment = criterionInputs[crit.id]?.comment ?? '';
                const isUnder50 = currentVal < 50;
                const isCommentMissing = isUnder50 && (!currentComment || currentComment.trim().length < 5);

                return (
                  <div
                    key={crit.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isCommentMissing
                        ? 'border-rose-400 bg-rose-50/30'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    {/* Tên & Trọng số */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="font-bold text-xs text-slate-900">
                          {idx + 1}. {crit.name}
                        </div>
                        {crit.description && (
                          <div className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                            {crit.description}
                          </div>
                        )}
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-900 font-extrabold text-[11px] shrink-0 border border-blue-100">
                        {crit.weight}%
                      </span>
                    </div>

                    {/* Điểm số: Slider + Input number */}
                    <div className="flex items-center gap-3 mt-3">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={currentVal}
                        onChange={e => handleScoreChange(crit.id, Number(e.target.value))}
                        className="flex-1 accent-blue-900 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                      />
                      <div className="w-16">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={currentVal}
                          onChange={e => handleScoreChange(crit.id, Number(e.target.value))}
                          className={`w-full text-center font-black text-xs py-1.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-900 ${
                            isUnder50
                              ? 'border-rose-400 bg-rose-50 text-rose-700'
                              : 'border-slate-200 text-slate-900'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Ô nhận xét */}
                    <div className="mt-3">
                      <input
                        type="text"
                        value={currentComment}
                        onChange={e => handleCommentChange(crit.id, e.target.value)}
                        placeholder={
                          isUnder50
                            ? 'BẮT BUỘC: Nhập lý do chấm dưới 50 điểm...'
                            : 'Nhận xét chi tiết cho tiêu chí này (tùy chọn)...'
                        }
                        className={`w-full text-[11px] p-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-900 ${
                          isCommentMissing
                            ? 'border-rose-400 bg-white placeholder-rose-400 ring-1 ring-rose-300'
                            : 'border-slate-200 placeholder-slate-400'
                        }`}
                      />
                      {isCommentMissing && (
                        <div className="text-[10px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>Điểm &lt; 50 bắt buộc phải ghi nhận xét cụ thể.</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Nhận xét chung của BTV */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800">
                Nhận xét tổng quát của BTV chấm độc lập:
              </label>
              <textarea
                rows={3}
                value={generalNote}
                onChange={e => setGeneralNote(e.target.value)}
                placeholder="Đánh giá tổng quan về giá trị thông tin, tính dấn thân, bố cục tác phẩm..."
                className="w-full text-xs rounded-xl border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>

            {/* Lỗi xác thực nếu có */}
            {validationError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Nút gửi điểm */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSubmitScore}
                className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>
                  {isThirdReview ? 'Xác nhận gửi điểm BTV thứ ba' : 'Xác nhận gửi điểm chấm mù'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL KẾT QUẢ XỬ LÝ QUY TẮC CHẤM LẠI */}
      {showResultModal && modalResultData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-5">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-slate-900">
                Đã hoàn tất thẩm định chấm mù!
              </h3>
              <p className="text-xs text-slate-500">
                Hệ thống tự động đối soát và áp dụng quy chế phân giải điểm chất lượng.
              </p>
            </div>

            {/* So sánh điểm số vừa chấm */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-3">
              <div className="grid grid-cols-2 gap-3 pb-2 border-b border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[11px]">Điểm bạn vừa chấm:</span>
                  <span className="text-xl font-black text-blue-900">
                    {modalResultData.myScore} đ
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Điểm lần đầu (gốc):</span>
                  <span className="text-xl font-black text-slate-700">
                    {modalResultData.originalScore} đ
                  </span>
                </div>
              </div>

              {modalResultData.stage === 'THIRD' && (
                <div className="text-[11px] text-slate-600">
                  Điểm BTV lần hai: <strong>{modalResultData.secondScore} đ</strong>
                </div>
              )}

              {/* Điểm chốt hiệu lực */}
              <div className="pt-1 flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs">
                  Điểm hiệu lực của tác phẩm:
                </span>
                <span className="text-2xl font-black text-emerald-700">
                  {modalResultData.finalScore} / 100 đ
                </span>
              </div>
            </div>

            {/* Quy tắc đã áp dụng */}
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-950 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Info className="w-4 h-4 text-blue-700" />
                <span>Quy tắc hệ thống kích hoạt:</span>
              </div>
              <p className="leading-relaxed font-medium">
                {modalResultData.ruleText}
              </p>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/editor/queue')}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs transition-colors cursor-pointer text-center"
              >
                Về hàng việc của tôi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
