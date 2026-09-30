import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/common/Header';
import { Modal } from '../../components/common/Modal';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Image as ImageIcon,
  Users,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowLeft,
  Send,
  ExternalLink,
  Layers,
  Sparkles,
  Info,
  Coins
} from 'lucide-react';
import { DuplicationMatch } from '../../types';
import { RoyaltyEstimateModal } from './RoyaltyEstimateModal';

export const DuplicationResultScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    state,
    dispatch,
    notify,
    getGenre,
    getSection,
    getUser,
    getArticleAttachments,
    getArticleAuthors,
    getArticleDuplicationMatch,
    getEvent,
    getSystemParameter
  } = useApp();

  const [estimateModalOpen, setEstimateModalOpen] = useState(false);

  const article = state.articles.find(a => a.id === id);

  if (!article) {
    return (
      <div className="py-16 text-center space-y-4">
        <h2 className="text-base font-bold text-slate-800">Không tìm thấy bài viết</h2>
        <p className="text-xs text-slate-500">Bài viết không tồn tại hoặc đã bị xóa khỏi hệ thống.</p>
        <button
          onClick={() => navigate('/reporter/articles')}
          className="px-4 py-2 bg-blue-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const authors = getArticleAuthors(article.id);
  const attachments = getArticleAttachments(article.id);
  const match = getArticleDuplicationMatch(article.id);
  const event = getEvent(article.event_id);
  const genre = getGenre(article.declared_category_id || article.genre_id);

  // Tỷ lệ trùng lặp: lấy từ bài hoặc từ đối sánh
  const duplicationPercent = article.duplication_percent !== undefined
    ? article.duplication_percent
    : (match ? match.overlap_percent : 12);

  // Tính bão hòa đề tài
  let saturationRank = article.saturation_rank;
  let saturationRate = article.saturation_rate;
  if (event && saturationRank === undefined) {
    const existingInEvent = state.articles.filter(a => a.event_id === event.id && a.id !== article.id).length;
    saturationRank = existingInEvent + 1;
    saturationRate = saturationRank <= 10 ? 100 : saturationRank <= 15 ? 80 : 60;
  }

  const warnThreshold = Number(getSystemParameter('CONTENT_DUPLICATION_WARN_THRESHOLD', 20));
  const blockThreshold = Number(getSystemParameter('CONTENT_DUPLICATION_BLOCK_THRESHOLD', 50));

  const isSangTac = article.declared_nature === 'SANG_TAC' || !article.declared_nature;
  const isBlocked = isSangTac && duplicationPercent > blockThreshold;
  const needsExplanation = duplicationPercent > warnThreshold && !isBlocked;

  const [explanation, setExplanation] = useState(article.duplication_explanation || '');
  const [diffModalOpen, setDiffModalOpen] = useState(false);
  const [activeDiffMatch, setActiveDiffMatch] = useState<DuplicationMatch | null>(null);

  const coAuthors = authors.filter(au => !au.is_main);
  const hasCoAuthors = coAuthors.length > 0;

  const handleOpenDiff = () => {
    if (match) {
      setActiveDiffMatch(match);
      setDiffModalOpen(true);
    } else {
      // Dữ liệu mẫu đối sánh nếu chưa có
      setActiveDiffMatch({
        article_id: article.id,
        matched_article_id: 'ref-default',
        matched_article_title: 'Nguồn tư liệu lưu trữ báo chí',
        matched_author_name: 'Phòng Tư liệu Tòa soạn',
        overlap_percent: duplicationPercent,
        passages: [
          {
            mine: article.sapo || article.content.substring(0, 150),
            theirs: 'Đoạn văn bản trích dẫn tư liệu lưu trữ có độ tương đồng cấu trúc câu và từ ngữ chuyên ngành.'
          }
        ]
      });
      setDiffModalOpen(true);
    }
  };

  const handleConfirmSubmit = () => {
    if (isBlocked) {
      notify(`Bài viết bị chặn nộp do trùng lặp vượt ngưỡng ${blockThreshold}% ở thể loại Sáng tác!`, 'error');
      return;
    }

    if (needsExplanation && !explanation.trim()) {
      notify('Vui lòng nhập bản giải trình nguồn tin và lý do trùng lặp trước khi nộp!', 'warning');
      return;
    }

    // Nếu bài viết đang ở REVISION_REQUESTED
    if (article.status === 'REVISION_REQUESTED') {
      const pendingCoAuthors = coAuthors.filter(au => au.confirm_status === 'PENDING');
      if (pendingCoAuthors.length === 0) {
        // Chỉ sửa nội dung: nộp thẳng, bài quay về đúng BTV cũ chấm lại (trạng thái ASSIGNED)
        dispatch({
          type: 'RESUBMIT_REVISION',
          payload: {
            articleId: article.id,
            title: article.title,
            sapo: article.sapo,
            content: article.content,
            duplication_percent: duplicationPercent,
            duplication_explanation: explanation.trim(),
            note: `Phóng viên nộp lại bài sau khi sửa theo yêu cầu (Độ trùng lặp: ${duplicationPercent}%)`
          }
        });

        notify(`Đã nộp lại bài "${article.title}" thành công tới Biên tập viên thẩm định!`, 'success');
        navigate('/reporter/articles');
        return;
      }
    }

    dispatch({
      type: 'SUBMIT_ARTICLE_WITH_DUPLICATION',
      payload: {
        articleId: article.id,
        duplication_percent: duplicationPercent,
        duplication_explanation: explanation.trim(),
        saturation_rank: saturationRank,
        saturation_rate: saturationRate,
        note: `Kiểm tra trùng: ${duplicationPercent}%. ${explanation ? 'Giải trình: ' + explanation.trim() : ''}`
      }
    });

    if (hasCoAuthors) {
      notify(`Đã nộp bài "${article.title}"! Đang chờ ${coAuthors.length} đồng tác giả xác nhận (hạn 3 ngày).`, 'info');
    } else {
      notify(`Đã nộp bài "${article.title}" thành công tới Trưởng ban chuyên môn!`, 'success');
    }

    navigate('/reporter/articles');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <PageHeader
        breadcrumbs={[
          { label: 'Tác phẩm của tôi', link: '/reporter/articles' },
          { label: 'Soạn / Sửa bài', link: `/reporter/articles/${article.id}/edit` },
          { label: 'Kiểm tra trùng lặp & Bản quyền' }
        ]}
        title="Kết quả Kiểm tra Trùng lặp & Tác quyền Media"
        description={`Báo cáo phân tích đối soát văn bản và mã băm bản quyền hình ảnh trước khi chính thức nộp bài duyệt xuất bản.`}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/reporter/articles/${article.id}/edit`)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại sửa nội dung</span>
            </button>
            <button
              type="button"
              onClick={() => setEstimateModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 transition-colors cursor-pointer"
            >
              <Coins className="w-4 h-4 text-amber-700" />
              <span>Ước tính nhuận bút</span>
            </button>
          </div>
        }
      />

      {/* Thông tin vắn tắt tác phẩm */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tác phẩm kiểm tra</div>
          <h2 className="text-base font-black text-slate-900 font-editorial truncate max-w-xl">
            {article.title}
          </h2>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 font-bold border border-blue-100">
            Thể loại: {genre?.name || 'Chưa chọn'}
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold border border-slate-200">
            Tính chất: {
              article.declared_nature === 'SANG_TAC' ? 'Sáng tác (100%)' :
              article.declared_nature === 'DICH' ? 'Dịch (50-70%)' :
              article.declared_nature === 'TONG_HOP' ? 'Tổng hợp (40-60%)' : 'Đăng lại (0%)'
            }
          </div>
          {event && (
            <div className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-900 font-bold border border-purple-100">
              Sự kiện: {event.name}
            </div>
          )}
        </div>
      </div>

      {/* KHỐI 1: THƯỚC ĐO TỶ LỆ TRÙNG LẶP NỘI DUNG */}
      <div className={`p-6 rounded-2xl border transition-all ${
        isBlocked
          ? 'bg-rose-50/60 border-rose-300'
          : duplicationPercent > 20
            ? 'bg-amber-50/60 border-amber-300'
            : 'bg-emerald-50/60 border-emerald-300'
      }`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className={`p-3.5 rounded-2xl shrink-0 ${
              isBlocked
                ? 'bg-rose-500 text-white shadow-md'
                : duplicationPercent > 20
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'bg-emerald-600 text-white shadow-md'
            }`}>
              {isBlocked ? (
                <XCircle className="w-8 h-8" />
              ) : duplicationPercent > 20 ? (
                <AlertTriangle className="w-8 h-8" />
              ) : (
                <ShieldCheck className="w-8 h-8" />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                  isBlocked
                    ? 'bg-rose-200 text-rose-900'
                    : duplicationPercent > 20
                      ? 'bg-amber-200 text-amber-900'
                      : 'bg-emerald-200 text-emerald-900'
                }`}>
                  {isBlocked
                    ? 'Bị chặn nộp bài – Vi phạm bản quyền'
                    : duplicationPercent > 20
                      ? 'Cần giải trình nguồn trùng lặp'
                      : 'Hợp lệ – Đạt chuẩn xuất bản'}
                </span>
                <span className="text-xs text-slate-500">
                  (Ngưỡng cảnh báo: 20% · Ngưỡng chặn Sáng tác: 50%)
                </span>
              </div>

              <h3 className="text-xl font-black text-slate-900">
                Độ tương đồng nội dung: <span className={
                  isBlocked ? 'text-rose-700' : duplicationPercent > 20 ? 'text-amber-700' : 'text-emerald-700'
                }>{duplicationPercent}%</span>
              </h3>

              <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                {isBlocked
                  ? `Nội dung bài viết trùng lặp ${duplicationPercent}% vượt quá ngưỡng cho phép (50%) đối với thể loại Sáng tác. Hệ thống khóa chức năng nộp bài nhằm bảo vệ uy tín tòa soạn. Vui lòng quay lại chỉnh sửa, diễn đạt lại bằng ngôn từ độc lập.`
                  : duplicationPercent > 20
                    ? `Phát hiện ${duplicationPercent}% nội dung tương đồng với các tài liệu đã công bố. Do vượt ngưỡng cảnh báo 20%, bạn bắt buộc phải nhập bản giải trình nguồn trích dẫn trước khi nộp bài.`
                    : `Tỷ lệ trùng lặp ${duplicationPercent}% nằm trong ngưỡng trích dẫn thông thường cho phép (< 20%). Tác phẩm đủ điều kiện nộp trực tiếp.`}
              </p>
            </div>
          </div>

          {/* Thanh đo đồ họa */}
          <div className="w-full md:w-64 space-y-2 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs shrink-0">
            <div className="flex justify-between text-xs font-semibold text-slate-600">
              <span>Mức trùng lặp</span>
              <span className="font-mono font-bold">{duplicationPercent}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex">
              <div
                className={`h-full transition-all duration-700 rounded-full ${
                  isBlocked ? 'bg-rose-500' : duplicationPercent > 20 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(duplicationPercent, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>0%</span>
              <span className="text-amber-600 font-bold">20% (Cảnh báo)</span>
              <span className="text-rose-600 font-bold">50% (Chặn)</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* DANH SÁCH BÀI VIẾT ĐỐI CHIẾU TRÙNG LẶP */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-900" />
            <h4 className="text-sm font-bold text-slate-900">Chi tiết các nguồn phát hiện trùng khớp</h4>
          </div>
          {match && (
            <button
              onClick={handleOpenDiff}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-900 hover:bg-blue-100 text-xs font-bold transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>So sánh đối chiếu chi tiết</span>
            </button>
          )}
        </div>

        {match ? (
          <div className="p-4 space-y-3">
            <div className="flex items-start justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="space-y-1">
                <div className="text-xs font-bold text-slate-900">
                  {match.matched_article_title || 'Tác phẩm đối chiếu'}
                </div>
                <div className="text-[11px] text-slate-500">
                  Tác giả/Nguồn: <span className="font-semibold text-slate-700">{match.matched_author_name || 'Hệ thống lưu trữ'}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Trùng {match.overlap_percent}%
                </div>
                <button
                  onClick={handleOpenDiff}
                  className="mt-1.5 text-[11px] text-blue-700 hover:underline font-semibold block cursor-pointer"
                >
                  Xem đoạn văn trùng →
                </button>
              </div>
            </div>

            {/* Trích đoạn mẫu */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Đoạn trùng mẫu phát hiện:</div>
              {match.passages.map((p, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg">
                    <div className="text-[10px] font-bold text-amber-900 uppercase mb-1">Bản thảo của bạn:</div>
                    <p className="text-slate-800 italic leading-relaxed">"{p.mine}"</p>
                  </div>
                  <div className="p-3 bg-slate-100 border border-slate-200 rounded-lg">
                    <div className="text-[10px] font-bold text-slate-700 uppercase mb-1">Nguồn đối chiếu:</div>
                    <p className="text-slate-700 italic leading-relaxed">"{p.theirs}"</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-slate-500">
            Không phát hiện đoạn trùng khớp đáng kể với kho dữ liệu bài viết đã xuất bản.
          </div>
        )}
      </div>

      {/* KHỐI 2: BẢN QUYỀN MEDIA & MÃ BĂM dHash */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-emerald-800" />
            <h4 className="text-sm font-bold text-slate-900">
              Kiểm tra Tác quyền Media & Mã băm dHash ({attachments.length} tệp)
            </h4>
          </div>
          <span className="text-[11px] text-slate-400">
            Thuật toán dHash 64-bit · Ngưỡng trùng: ≤ 5 bit
          </span>
        </div>

        {attachments.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            Bài viết chưa đính kèm hình ảnh hoặc video nào.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Ảnh / Video</th>
                  <th className="py-2.5 px-4">Chú thích & Tên tệp</th>
                  <th className="py-2.5 px-4">Khai báo tác quyền</th>
                  <th className="py-2.5 px-4">Mã dHash</th>
                  <th className="py-2.5 px-4">Kết quả kiểm tra</th>
                  <th className="py-2.5 px-4">Định mức tác quyền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attachments.map(att => {
                  const mediaAuthor = att.media_author_id ? getUser(att.media_author_id) : null;
                  const isReuse = att.hash_check === 'TAI_SU_DUNG';
                  const isExternal = att.media_kind === 'NGUON_NGOAI' || att.hash_check === 'NGUON_NGOAI';

                  return (
                    <tr key={att.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4">
                        <img
                          src={att.url}
                          alt={att.caption || 'Media'}
                          className="w-14 h-11 object-cover rounded-lg ring-1 ring-slate-200"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (!target.dataset.fallback) {
                              target.dataset.fallback = 'true';
                              target.src = 'https://images.unsplash.com/photo-1541888946425-d0fbb186f5f8?w=800&auto=format&fit=crop&q=80';
                            }
                          }}
                        />
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-slate-900 line-clamp-1">
                          {att.caption || 'Chưa có chú thích'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono truncate">
                          {att.original_name}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isExternal ? (
                          <span className="text-slate-600">Nguồn ngoài: <strong>{att.external_source || 'Sưu tầm'}</strong></span>
                        ) : (
                          <span className="text-slate-800">
                            Tự chụp: <strong>{mediaAuthor?.full_name || 'Phóng viên'}</strong>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-500">
                        {att.dhash || 'hash-' + att.id.substring(0, 8)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isReuse ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                            Tái sử dụng (Trùng ảnh cũ)
                          </span>
                        ) : isExternal ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            Nguồn ngoài
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                            Mới hoàn toàn
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isReuse ? (
                          <span className="text-amber-700 font-bold text-[11px]">Hệ số = 0 (Ảnh cũ)</span>
                        ) : isExternal ? (
                          <span className="text-slate-500 text-[11px]">Không tính nhuận bút</span>
                        ) : (
                          <span className="text-emerald-700 font-bold text-[11px]">Tính 100% định mức NĐ 18</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* KHỐI 3: BẢN GIẢI TRÌNH NGUỒN TRÙNG LẶP (BẮT BUỘC NẾU > 20% VÀ KHÔNG BỊ CHẶN) */}
      {needsExplanation && (
        <div className="bg-amber-50/70 p-5 rounded-2xl border border-amber-300 space-y-3">
          <div className="flex items-center gap-2 text-amber-900">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <h4 className="text-sm font-bold">Bản giải trình nguồn tin & lý do trùng lặp (Bắt buộc)</h4>
          </div>
          <p className="text-xs text-amber-800 leading-relaxed">
            Do tỷ lệ trùng lặp đạt <strong>{duplicationPercent}%</strong> (vượt ngưỡng cảnh báo 20%), bạn cần giải trình rõ ràng các trích dẫn (ví dụ: thông cáo báo chí, số liệu cơ quan nhà nước, văn bản quy phạm...) để Trưởng ban xem xét khi thẩm định bài.
          </p>

          <textarea
            rows={3}
            value={explanation}
            onChange={e => setExplanation(e.target.value)}
            placeholder="Nhập giải trình: Ví dụ: Trích dẫn số liệu thống kê từ Đài KTTV Trung ương hoặc Thông cáo báo chí số 12/TCBC của UBND Tỉnh..."
            className="w-full p-3 rounded-xl border border-amber-300 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] font-semibold text-amber-900">Mẫu gợi ý nhanh:</span>
            <button
              type="button"
              onClick={() => setExplanation('Trích dẫn số liệu công bố công khai từ Trung tâm Dự báo Khí tượng Thủy văn Quốc gia và Cục Quản lý Đê điều.')}
              className="text-[10px] px-2 py-1 rounded bg-amber-200/80 hover:bg-amber-200 text-amber-950 cursor-pointer font-medium"
            >
              + Số liệu khí tượng / thống kê
            </button>
            <button
              type="button"
              onClick={() => setExplanation('Trích dẫn nguyên văn thông cáo báo chí và phát biểu của đại diện Bộ Ban ngành tại họp báo chính phủ.')}
              className="text-[10px] px-2 py-1 rounded bg-amber-200/80 hover:bg-amber-200 text-amber-950 cursor-pointer font-medium"
            >
              + Thông cáo báo chí họp báo
            </button>
            <button
              type="button"
              onClick={() => setExplanation('Tổng hợp từ các bài báo khoa học và khảo sát thực tế độc lập của nhóm tác giả.')}
              className="text-[10px] px-2 py-1 rounded bg-amber-200/80 hover:bg-amber-200 text-amber-950 cursor-pointer font-medium"
            >
              + Tài liệu nghiên cứu khoa học
            </button>
          </div>
        </div>
      )}

      {/* THÔNG BÁO QUY TRÌNH TIẾP THEO (WORKFLOW PREVIEW) */}
      <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-2">
        <div className="flex items-center gap-2 text-blue-950 font-bold text-xs">
          <Info className="w-4 h-4 text-blue-900 shrink-0" />
          <span>Quy trình chuyển tiếp sau khi nộp bài:</span>
        </div>
        {hasCoAuthors ? (
          <p className="text-xs text-blue-900 leading-relaxed pl-6">
            Bài viết có <strong>{coAuthors.length} đồng tác giả</strong>. Sau khi bạn xác nhận nộp, bài viết sẽ chuyển sang trạng thái <strong className="text-amber-800">CHỜ XÁC NHẬN ĐỒNG TÁC GIẢ</strong>. Hệ thống tự động gửi thông báo tới tài khoản các đồng tác giả với thời hạn xác nhận là <strong>3 ngày</strong>. Khi tất cả đồng tác giả đồng ý, bài sẽ tự động chuyển tới Trưởng ban để phân công BTV.
          </p>
        ) : (
          <p className="text-xs text-blue-900 leading-relaxed pl-6">
            Bài viết đơn tác giả (1 người). Sau khi xác nhận nộp, bài viết sẽ chuyển thẳng sang trạng thái <strong className="text-blue-900">ĐÃ NỘP</strong> và xuất hiện ngay trong hàng đợi phân công của Trưởng ban chuyên môn.
          </p>
        )}

        {event && (
          <div className="pl-6 pt-1 text-[11px] text-purple-900 font-medium">
            🎯 Sự kiện <strong>{event.name}</strong>: Bài này xếp thứ <strong>{saturationRank}</strong> → Hệ số bão hòa K = <strong>{saturationRate}%</strong> (được miễn trừ về 100% nếu bài chấm đạt ≥ 90 điểm).
          </div>
        )}
      </div>

      {/* HÀNG NÚT THAO TÁC */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <button
          onClick={() => navigate(`/reporter/articles/${article.id}/edit`)}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại sửa nội dung</span>
        </button>

        <div className="flex items-center gap-3">
          {isBlocked ? (
            <div className="flex items-center gap-2 text-xs font-bold text-rose-700 bg-rose-100 px-4 py-2.5 rounded-xl border border-rose-300">
              <XCircle className="w-4 h-4" />
              <span>Nút nộp bị khóa do vi phạm trùng lặp</span>
            </div>
          ) : (
            <button
              onClick={handleConfirmSubmit}
              disabled={needsExplanation && !explanation.trim()}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
                needsExplanation && !explanation.trim()
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-blue-900 text-white hover:bg-blue-800'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Xác nhận nộp bài duyệt</span>
            </button>
          )}
        </div>
      </div>

      {/* MODAL SO SÁNH ĐỐI CHIẾU CHI TIẾT */}
      {diffModalOpen && activeDiffMatch && (
        <Modal
          isOpen={diffModalOpen}
          onClose={() => setDiffModalOpen(false)}
          title={`Đối chiếu trùng lặp: ${activeDiffMatch.matched_article_title || 'Nguồn đối chiếu'}`}
          size="xl"
        >
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
              <div>
                Nguồn: <strong>{activeDiffMatch.matched_author_name}</strong>
              </div>
              <div className="font-bold font-mono">
                Tương đồng: {activeDiffMatch.overlap_percent}%
              </div>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto p-1">
              {activeDiffMatch.passages.map((p, i) => (
                <div key={i} className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <div className="bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-700 border-b border-slate-200">
                    Đoạn phát hiện tương đồng #{i + 1}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 text-xs">
                    <div className="p-3 bg-amber-50/50">
                      <div className="text-[10px] font-bold text-blue-950 uppercase mb-1">
                        Bản thảo của bạn ({article.title}):
                      </div>
                      <p className="text-slate-900 leading-relaxed">{p.mine}</p>
                    </div>
                    <div className="p-3 bg-slate-50/50">
                      <div className="text-[10px] font-bold text-slate-600 uppercase mb-1">
                        Nguồn đối chiếu ({activeDiffMatch.matched_article_title}):
                      </div>
                      <p className="text-slate-700 leading-relaxed">{p.theirs}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200">
              <button
                onClick={() => setDiffModalOpen(false)}
                className="px-4 py-2 bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold hover:bg-slate-300 cursor-pointer"
              >
                Đóng đối chiếu
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Ước tính nhuận bút */}
      <RoyaltyEstimateModal
        isOpen={estimateModalOpen}
        onClose={() => setEstimateModalOpen(false)}
        article={article}
        authors={authors}
        attachments={attachments}
      />
    </div>
  );
};
