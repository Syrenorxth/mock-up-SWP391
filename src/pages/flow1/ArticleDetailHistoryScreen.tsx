import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/common/Header';
import { StatusBadge, QualityBadge } from '../../components/common/Badge';
import { DiffViewer } from '../../components/common/DiffViewer';
import { Modal } from '../../components/common/Modal';
import { RoyaltyEstimateModal } from './RoyaltyEstimateModal';
import { formatDate, formatDateTime, ArticleVersion, ArticleAuthor } from '../../types';
import {
  FileText,
  Clock,
  GitBranch,
  History,
  Layers,
  ArrowLeft,
  Calendar,
  Eye,
  User as UserIcon,
  Video,
  Lock,
  Unlock,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Coins,
  Edit,
  PenSquare,
  AlertCircle,
  Image as ImageIcon,
  Tag,
  Scale
} from 'lucide-react';
import { ScoringResultBlock } from '../flow2/ScoringResultScreen';

export const ArticleDetailHistoryScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const {
    state,
    dispatch,
    notify,
    getGenre,
    getSection,
    getUser,
    getArticleQualityScore,
    getArticleAttachments,
    getArticleAuthors,
    getArticleVersions,
    getArticleLogs,
    getArticleDuplicationMatch,
    getEvent
  } = useApp();
  const navigate = useNavigate();

  const article = state.articles.find(a => a.id === id);

  const [diffModalOpen, setDiffModalOpen] = useState(false);
  const [selectedVersions, setSelectedVersions] = useState<{
    prev: ArticleVersion;
    curr: ArticleVersion;
  } | null>(null);

  // Modal rút bài
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState('');

  // Modal ước tính nhuận bút
  const [estimateModalOpen, setEstimateModalOpen] = useState(false);

  if (!article) {
    return (
      <div className="py-16 text-center space-y-4 max-w-md mx-auto">
        <AlertCircle className="w-12 h-12 text-slate-400 mx-auto" />
        <h2 className="text-base font-bold text-slate-800">Không tìm thấy bài viết</h2>
        <p className="text-xs text-slate-500">Bài viết không tồn tại hoặc đã bị xóa khỏi hệ thống.</p>
        <button
          onClick={() => navigate('/reporter/articles')}
          className="px-4 py-2 bg-blue-900 text-white rounded-xl text-xs font-semibold cursor-pointer"
        >
          Quay lại danh sách bài viết
        </button>
      </div>
    );
  }

  const genreDeclared = getGenre(article.declared_category_id);
  const genreApplied = getGenre(article.category_id || article.genre_id);
  const section = getSection(article.section_id);
  const author = getUser(article.author_id);
  const editor = article.editor_id ? getUser(article.editor_id) : null;
  const qualityScore = getArticleQualityScore(article.id);
  const attachments = getArticleAttachments(article.id);
  const authors = getArticleAuthors(article.id);
  const versions = getArticleVersions(article.id);
  const logs = getArticleLogs(article.id);
  const duplicationMatch = getArticleDuplicationMatch(article.id);
  const event = getEvent(article.event_id);

  const currentUserId = state.currentUser.id;
  const isMainAuthor = article.author_id === currentUserId;
  const myAuthorRecord = authors.find(au => au.user_id === currentUserId);
  const isCoAuthor = !isMainAuthor && Boolean(myAuthorRecord);

  // Điều kiện rút bài: Chỉ tác giả chính, bài ở SUBMITTED và CHƯA phân công BTV
  const isAssigned = Boolean(article.editor_id) || article.status === 'ASSIGNED';
  const canWithdraw = isMainAuthor && article.status === 'SUBMITTED' && !isAssigned;

  // Kiểm tra xem BTV có đổi thể loại không
  const isCategoryChanged = article.declared_category_id &&
    article.category_id &&
    article.declared_category_id !== article.category_id;

  // Tìm log đổi thể loại nếu có
  const categoryChangeLog = isCategoryChanged
    ? logs.find(l => l.note?.includes('thể loại') || l.action?.includes('thể loại'))
    : null;

  // Tính tỷ lệ trùng
  const duplicationPercent = article.duplication_percent !== undefined
    ? article.duplication_percent
    : (duplicationMatch ? duplicationMatch.overlap_percent : 12);

  // Mở diff so sánh version
  const handleOpenDiff = (curr: ArticleVersion) => {
    const sorted = [...versions].sort((a, b) => a.version_no - b.version_no);
    const currIdx = sorted.findIndex(v => v.id === curr.id);
    if (currIdx > 0) {
      const prev = sorted[currIdx - 1];
      setSelectedVersions({ prev, curr });
      setDiffModalOpen(true);
    }
  };

  // Xác nhận rút bài
  const handleConfirmWithdraw = () => {
    if (!withdrawReason.trim()) {
      notify('Vui lòng nhập lý do rút bài viết!', 'error');
      return;
    }

    dispatch({
      type: 'WITHDRAW_ARTICLE',
      payload: {
        articleId: article.id,
        reason: withdrawReason.trim()
      }
    });

    notify(`Đã rút bài viết "${article.title}" về Bản nháp thành công! (Lần rút: ${(article.withdrawn_count || 0) + 1})`, 'info');
    setWithdrawModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      <PageHeader
        breadcrumbs={[
          { label: 'Tác phẩm của tôi', link: '/reporter/articles' },
          { label: 'Chi tiết tác phẩm' }
        ]}
        title={article.title}
        description={`Mã tác phẩm: ${article.id} • Chuyên mục: ${section?.name || '—'} • Tác giả chính: ${author?.full_name || '—'}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => navigate('/reporter/articles')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại</span>
            </button>

            {/* Nút Ước tính nhuận bút */}
            <button
              type="button"
              onClick={() => setEstimateModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 transition-colors cursor-pointer"
            >
              <Coins className="w-4 h-4 text-amber-700" />
              <span>Ước tính nhuận bút</span>
            </button>

            {/* Nút Rút bài (nếu đủ điều kiện) */}
            {canWithdraw && (
              <button
                type="button"
                onClick={() => {
                  setWithdrawReason('');
                  setWithdrawModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-800 border border-rose-300 hover:bg-rose-100 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-rose-600" />
                <span>Rút bài</span>
              </button>
            )}

            {/* Nút Sửa & Nộp lại cho bài bị trả về (REVISION_REQUESTED) */}
            {isMainAuthor && article.status === 'REVISION_REQUESTED' && (
              <button
                type="button"
                onClick={() => navigate(`/reporter/articles/${article.id}/edit`)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-700 text-white hover:bg-rose-800 shadow-sm transition-colors cursor-pointer"
              >
                <Edit className="w-4 h-4" />
                <span>Sửa và nộp lại</span>
              </button>
            )}

            {/* Nút Sửa cho bài DRAFT */}
            {isMainAuthor && article.status === 'DRAFT' && (
              <button
                type="button"
                onClick={() => navigate(`/reporter/articles/${article.id}/edit`)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-900 text-white hover:bg-blue-800 shadow-sm transition-colors cursor-pointer"
              >
                <PenSquare className="w-4 h-4" />
                <span>Tiếp tục soạn / Nộp</span>
              </button>
            )}

            <StatusBadge status={article.status} />
          </div>
        }
      />

      {/* Banner Cảnh báo cho bài bị TỪ CHỐI (REJECTED) */}
      {article.status === 'REJECTED' && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-rose-900">Bài đã bị từ chối – Kết thúc xử lý</h4>
            <p className="text-xs text-rose-800 leading-relaxed">
              Tác phẩm này đã bị Ban Biên tập từ chối xuất bản và không thể chỉnh sửa hoặc nộp lại. Tác phẩm được lưu trữ chỉ để tra cứu lịch sử nghiệp vụ.
            </p>
          </div>
        </div>
      )}

      {/* Banner Thông báo bài bị Trả về – Cần sửa (REVISION_REQUESTED) */}
      {article.status === 'REVISION_REQUESTED' && (
        <div className="p-4 rounded-2xl bg-pink-50 border border-pink-300 text-pink-900 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-pink-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-pink-900">Bài viết cần chỉnh sửa theo yêu cầu của Biên tập viên</h4>
              <p className="text-xs text-pink-800 leading-relaxed">
                Biên tập viên đã thẩm định và gửi yêu cầu chỉnh sửa. Vui lòng bấm <strong>"Sửa và nộp lại"</strong> để cập nhật nội dung theo góp ý.
              </p>
            </div>
          </div>
          {isMainAuthor && (
            <button
              onClick={() => navigate(`/reporter/articles/${article.id}/edit`)}
              className="px-3.5 py-1.5 bg-pink-700 text-white rounded-xl text-xs font-bold hover:bg-pink-800 shrink-0 cursor-pointer"
            >
              Sửa ngay
            </button>
          )}
        </div>
      )}

      {/* Thông báo nếu đã phân công BTV và không thể rút bài */}
      {isMainAuthor && article.status === 'SUBMITTED' && isAssigned && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
          <Lock className="w-4 h-4 text-amber-700 shrink-0" />
          <span>Không thể rút bài vì bài đã được Trưởng ban phân công Biên tập viên thẩm định.</span>
        </div>
      )}

      {/* Thông báo nếu là đồng tác giả */}
      {isCoAuthor && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-blue-800 shrink-0" />
            <span>
              Bạn đang xem tác phẩm với tư cách <strong>Đồng tác giả ({myAuthorRecord?.share_percent}%)</strong>. Chỉ tác giả chính mới có quyền chỉnh sửa hoặc rút bài.
            </span>
          </div>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
            myAuthorRecord?.confirm_status === 'ACCEPTED'
              ? 'bg-emerald-100 text-emerald-800'
              : myAuthorRecord?.confirm_status === 'REJECTED'
                ? 'bg-rose-100 text-rose-800'
                : 'bg-amber-100 text-amber-800'
          }`}>
            Xác nhận: {myAuthorRecord?.confirm_status === 'ACCEPTED' ? 'Đã đồng ý' : myAuthorRecord?.confirm_status === 'REJECTED' ? 'Đã từ chối' : 'Đang chờ'}
          </span>
        </div>
      )}

      {/* KHỐI 1: THÔNG TIN KHAI BÁO NGHIỆP VỤ ĐÃ KHÓA (Icon ổ khóa) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Khối khai báo tác phẩm & Tác quyền (Đã khóa khi nộp)
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
            Khóa tại thời điểm nộp bài
          </span>
        </div>

        <div className="p-5 space-y-4">
          {/* Hàng 1: Thể loại, Tính chất, Sự kiện & Mức bão hòa */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Thể loại */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-400 block text-[11px] font-semibold">Thể loại tác phẩm:</span>
              <div className="font-bold text-slate-900 text-sm">
                {genreDeclared?.name || genreApplied?.name}
              </div>
              {isCategoryChanged && (
                <div className="text-[11px] text-amber-900 bg-amber-50 p-1.5 rounded-lg border border-amber-200 mt-1">
                  <strong>Điều chỉnh: </strong>
                  {genreDeclared?.name} → <strong>{genreApplied?.name}</strong>
                  {categoryChangeLog && <div className="text-[10px] text-slate-500 mt-0.5">({categoryChangeLog.note})</div>}
                </div>
              )}
            </div>

            {/* Tính chất tác phẩm */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-400 block text-[11px] font-semibold">Tính chất khai báo:</span>
              <div className="font-bold text-slate-900 text-sm">
                {article.declared_nature === 'SANG_TAC' ? 'Sáng tác' :
                 article.declared_nature === 'DICH' ? 'Dịch bài' :
                 article.declared_nature === 'TONG_HOP' ? 'Tổng hợp' :
                 article.declared_nature === 'DANG_LAI' ? 'Đăng lại' : 'Sáng tác'}
              </div>
              <span className="text-[11px] text-slate-400 block">
                Do phóng viên tự khai báo
              </span>
            </div>

            {/* Sự kiện & Mức bão hòa */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-400 block text-[11px] font-semibold">Sự kiện & Bão hòa đề tài:</span>
              <div className="font-bold text-slate-900 text-sm truncate">
                {event ? event.name : 'Không gắn sự kiện'}
              </div>
              {event ? (
                <div className="text-[11px] text-blue-900 font-semibold mt-1">
                  Mức khóa: <strong>{article.saturation_rate ?? 100}%</strong>
                  {article.saturation_rank && ` (Bài thứ ${article.saturation_rank} trong 7 ngày)`}
                </div>
              ) : (
                <span className="text-[11px] text-slate-400 block">Hệ số bão hòa 100%</span>
              )}
            </div>
          </div>

          {/* Hàng 2: Bảng tác giả & Tỷ lệ % + Trạng thái xác nhận từng người */}
          <div className="space-y-2 pt-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5" />
              Cơ cấu tác giả và trạng thái xác nhận:
            </span>
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Họ và tên</th>
                    <th className="py-2.5 px-3 font-semibold">Vai trò</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Tỷ lệ %</th>
                    <th className="py-2.5 px-3 font-semibold">Trạng thái xác nhận</th>
                    <th className="py-2.5 px-3 font-semibold">Thời điểm / Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {authors.map(au => {
                    const u = getUser(au.user_id);
                    const isAccepted = au.confirm_status === 'ACCEPTED';
                    const isRejected = au.confirm_status === 'REJECTED';
                    const isPending = au.confirm_status === 'PENDING';

                    return (
                      <tr key={au.user_id} className="hover:bg-slate-50/60">
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {u?.full_name || 'Phóng viên'}
                        </td>
                        <td className="py-2.5 px-3">
                          {au.is_main ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                              Tác giả chính
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                              Đồng tác giả
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold font-mono text-slate-800">
                          {au.share_percent}%
                        </td>
                        <td className="py-2.5 px-3">
                          {isAccepted && (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Đã đồng ý
                            </span>
                          )}
                          {isRejected && (
                            <span className="inline-flex items-center gap-1 text-rose-700 font-bold text-[11px]">
                              <XCircle className="w-3.5 h-3.5" />
                              Từ chối
                            </span>
                          )}
                          {isPending && (
                            <span className="inline-flex items-center gap-1 text-amber-700 font-semibold text-[11px]">
                              <Clock className="w-3.5 h-3.5" />
                              Đang chờ xác nhận
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-[11px] text-slate-500">
                          {au.confirmed_at && <span>{au.confirmed_at}</span>}
                          {isRejected && au.reject_reason && (
                            <span className="text-rose-600 block italic">Lý do: "{au.reject_reason}"</span>
                          )}
                          {isPending && au.confirm_deadline && (
                            <span className="text-amber-700 block">Hạn: {au.confirm_deadline}</span>
                          )}
                          {!au.confirmed_at && !au.reject_reason && !au.confirm_deadline && '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* KHỐI 2: TÓM TẮT KẾT QUẢ KIỂM TRA TRÙNG LẶP & MEDIA DHASH */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-900" />
            <h3 className="text-sm font-bold text-slate-900">
              Kết quả kiểm tra trùng lặp văn bản & Tác quyền hình ảnh
            </h3>
          </div>
          <Link
            to={`/reporter/articles/${article.id}/duplication-check`}
            className="flex items-center gap-1 text-xs font-bold text-blue-900 hover:text-blue-800 hover:underline"
          >
            <span>Xem chi tiết đối chiếu câu chữ</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] text-slate-400 block font-semibold">Tỷ lệ trùng văn bản:</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className={`text-xl font-extrabold ${
                duplicationPercent > 50 ? 'text-rose-600' : duplicationPercent > 20 ? 'text-amber-600' : 'text-emerald-700'
              }`}>
                {duplicationPercent}%
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                {duplicationPercent <= 20 ? 'Mức an toàn (< 20%)' : duplicationPercent <= 50 ? 'Cần giải trình (20% - 50%)' : 'Ngưỡng chặn nộp (> 50%)'}
              </span>
            </div>
            {article.duplication_explanation && (
              <p className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200 mt-2 italic">
                <strong>Giải trình: </strong>"{article.duplication_explanation}"
              </p>
            )}
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 md:col-span-2 space-y-2">
            <span className="text-[11px] text-slate-400 block font-semibold">Kiểm tra tác quyền Media (dHash 64-bit):</span>
            {attachments.length === 0 ? (
              <div className="text-xs text-slate-400 py-1">Không có tệp hình ảnh/video nào đính kèm.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {attachments.map((att, idx) => (
                  <div key={att.id || idx} className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                    <div className="overflow-hidden pr-2">
                      <div className="font-semibold text-slate-800 truncate text-[11px]">
                        {att.caption || att.original_name}
                      </div>
                      <div className="text-[10px] text-slate-400">{att.media_kind}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                      att.hash_check === 'MOI'
                        ? 'bg-emerald-100 text-emerald-800'
                        : att.hash_check === 'TAI_SU_DUNG'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                    }`}>
                      {att.hash_check === 'MOI' ? 'Mới 100%' : att.hash_check === 'TAI_SU_DUNG' ? `Tái sử dụng (lệch ${att.matched_distance_bits || 3} bit)` : 'Nguồn ngoài'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid 2 Cột: Nội dung chi tiết & Lịch sử/Phiên bản */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột 1 & 2: Nội dung tác phẩm & Kết quả chấm */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-xs">
            {/* Meta bar */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 border-b border-slate-100 pb-3">
              <span className="flex items-center gap-1 font-semibold text-slate-800">
                <UserIcon className="w-3.5 h-3.5 text-blue-700" />
                <span>{author?.full_name}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Nộp lần đầu: {formatDate(article.first_submitted_at || article.created_at)}</span>
              </span>
              {article.last_submitted_at && article.last_submitted_at !== article.first_submitted_at && (
                <>
                  <span>•</span>
                  <span className="text-slate-600">Nộp lại: {formatDate(article.last_submitted_at)}</span>
                </>
              )}
              {article.published_at && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Xuất bản: {formatDateTime(article.published_at)}</span>
                  </span>
                </>
              )}
              {article.withdrawn_count !== undefined && article.withdrawn_count > 0 && (
                <>
                  <span>•</span>
                  <span className="text-rose-600 font-medium">Đã rút {article.withdrawn_count} lần</span>
                </>
              )}
            </div>

            {/* Sapo */}
            {article.sapo && (
              <div className="text-sm font-medium text-slate-800 italic bg-blue-50/50 p-4 rounded-xl border-l-4 border-blue-900 leading-relaxed font-serif">
                {article.sapo}
              </div>
            )}

            {/* Tệp đính kèm Media */}
            {attachments.length > 0 && (
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Tệp đính kèm ({attachments.length})
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {attachments.map(att => (
                    <div
                      key={att.id}
                      className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50 text-xs"
                    >
                      {att.media_type === 'IMAGE' || !att.media_type ? (
                        <img
                          src={att.url}
                          alt={att.caption}
                          className="w-full h-44 object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-44 bg-slate-900 flex flex-col items-center justify-center text-white">
                          <Video className="w-10 h-10 text-indigo-400 mb-2" />
                          <span className="text-xs font-semibold">Tệp Video Clip</span>
                        </div>
                      )}
                      <div className="p-2.5 space-y-1">
                        <div className="font-semibold text-slate-800">{att.caption || att.original_name}</div>
                        <div className="text-[10px] text-slate-400">
                          {att.media_type === 'IMAGE' ? 'Hình ảnh' : 'Video clip'} • {(att.file_size / 1024 / 1024).toFixed(2)} MB • {att.media_kind}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Nội dung chi tiết */}
            <div className="pt-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Nội dung toàn văn
              </div>
              <div className="text-sm text-slate-800 whitespace-pre-line leading-relaxed font-serif">
                {article.content}
              </div>
            </div>
          </div>

          {/* KHỐI KẾT QUẢ CHẤM ĐIỂM (Nếu đã công bố hoặc có kết quả chấm) */}
          {(qualityScore || state.scoringAttempts.some(sa => sa.article_id === article.id)) && (
            <ScoringResultBlock articleId={article.id} isEmbedded={false} />
          )}
        </div>

        {/* Cột 3: Phiên bản bài viết & Lịch sử trạng thái */}
        <div className="space-y-6">
          {/* Phiên bản bài viết */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-xs">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              <Layers className="w-4 h-4 text-blue-900" />
              <span>Các phiên bản nội dung ({versions.length})</span>
            </div>

            <div className="space-y-2.5">
              {versions.map((ver, idx) => {
                const canCompare = ver.version_no > 1;
                return (
                  <div
                    key={ver.id}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">
                        Phiên bản #{ver.version_no} {idx === 0 && <span className="text-[10px] text-emerald-700 font-bold ml-1">(Hiện tại)</span>}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{ver.created_at}</div>
                    </div>

                    {canCompare && (
                      <button
                        onClick={() => handleOpenDiff(ver)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-slate-700 font-medium hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-colors shadow-2xs cursor-pointer"
                        title="So sánh với phiên bản trước"
                      >
                        <GitBranch className="w-3.5 h-3.5" />
                        <span>So sánh</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Lịch sử trạng thái (Timeline) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              <History className="w-4 h-4 text-blue-900" />
              <span>Lịch sử trạng thái ({logs.length})</span>
            </div>

            <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {logs.map((log) => {
                const actor = getUser(log.actor_id);
                return (
                  <div key={log.id} className="relative text-xs">
                    <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-white border-2 border-blue-900" />
                    <div className="font-bold text-slate-900">{log.action}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                      <span>{actor?.full_name || 'Hệ thống'}</span>
                      <span>•</span>
                      <span>{log.created_at}</span>
                    </div>

                    {log.note && (
                      <div className="mt-1.5 p-2 rounded-lg bg-slate-50 border border-slate-100 text-slate-700 text-[11px] leading-relaxed">
                        {log.note}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Modal So sánh thay đổi giữa 2 phiên bản */}
      <Modal
        isOpen={diffModalOpen}
        onClose={() => setDiffModalOpen(false)}
        title="So sánh thay đổi giữa các phiên bản"
        maxWidth="4xl"
        footer={
          <button
            onClick={() => setDiffModalOpen(false)}
            className="px-4 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            Đóng so sánh
          </button>
        }
      >
        {selectedVersions && (
          <DiffViewer
            prevVersion={selectedVersions.prev}
            currentVersion={selectedVersions.curr}
          />
        )}
      </Modal>

      {/* Modal Xác nhận RÚT BÀI */}
      <Modal
        isOpen={withdrawModalOpen}
        onClose={() => setWithdrawModalOpen(false)}
        title="Xác nhận rút bài viết về Bản nháp"
        maxWidth="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <button
              type="button"
              onClick={() => setWithdrawModalOpen(false)}
              className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleConfirmWithdraw}
              className="px-4 py-1.5 rounded-xl bg-rose-700 text-white text-xs font-bold hover:bg-rose-800 transition-colors cursor-pointer"
            >
              Xác nhận rút bài
            </button>
          </div>
        }
      >
        <div className="space-y-3 text-xs text-slate-800">
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Bài viết sẽ được chuyển từ trạng thái <strong>Đã nộp</strong> về <strong>Bản nháp</strong> để bạn có thể tiếp tục chỉnh sửa nội dung hoặc điều chỉnh cơ cấu tác giả. Hành động này sẽ được ghi nhận vào nhật ký kiểm toán.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Lý do rút bài <span className="text-rose-500">*</span>:
            </label>
            <textarea
              value={withdrawReason}
              onChange={e => setWithdrawReason(e.target.value)}
              placeholder="Ví dụ: Cần cập nhật thêm số liệu thực địa vừa thu thập; Điều chỉnh lại tỷ lệ đồng tác giả; ..."
              rows={3}
              className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 text-xs text-slate-900 resize-none"
            />
          </div>
        </div>
      </Modal>

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
