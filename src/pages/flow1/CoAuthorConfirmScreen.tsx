import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/common/Header';
import { StatusBadge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Article, ArticleAuthor } from '../../types';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  AlertCircle,
  Users,
  Image as ImageIcon,
  FileText,
  Calendar,
  Layers,
  ArrowRight,
  UserCheck,
  Send,
  Timer,
  AlertTriangle
} from 'lucide-react';

export const CoAuthorConfirmScreen: React.FC = () => {
  const { state, dispatch, notify, getUser, getGenre, getArticleAttachments, getArticleAuthors } = useApp();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'PENDING' | 'HISTORY'>('PENDING');

  // Modal xem bài viết chi tiết (chỉ đọc)
  const [previewArticle, setPreviewArticle] = useState<Article | null>(null);

  // Modal từ chối
  const [rejectArticle, setRejectArticle] = useState<{ article: Article; myAuthorRecord: ArticleAuthor } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Danh sách các bài mà người đăng nhập hiện tại là ĐỒNG TÁC GIẢ
  const myCoAuthorEntries = useMemo(() => {
    const currentUserId = state.currentUser.id;
    return state.articleAuthors
      .filter(au => au.user_id === currentUserId && !au.is_main)
      .map(au => {
        const article = state.articles.find(a => a.id === au.article_id);
        const mainAuthor = state.articleAuthors.find(a => a.article_id === au.article_id && a.is_main);
        const allAuthors = state.articleAuthors.filter(a => a.article_id === au.article_id);
        const attachments = state.articleAttachments.filter(att => att.article_id === au.article_id);
        const myAttachments = attachments.filter(att => att.media_author_id === currentUserId);

        return {
          authorRecord: au,
          article,
          mainAuthorUser: mainAuthor ? getUser(mainAuthor.user_id) : null,
          allAuthors,
          attachments,
          myAttachments
        };
      })
      .filter(item => item.article !== undefined) as {
        authorRecord: ArticleAuthor;
        article: Article;
        mainAuthorUser: any;
        allAuthors: ArticleAuthor[];
        attachments: any[];
        myAttachments: any[];
      }[];
  }, [state.articleAuthors, state.articles, state.currentUser.id, state.articleAttachments, getUser]);

  // Lọc theo tab
  const pendingList = useMemo(() => {
    return myCoAuthorEntries.filter(item => item.authorRecord.confirm_status === 'PENDING');
  }, [myCoAuthorEntries]);

  const historyList = useMemo(() => {
    return myCoAuthorEntries.filter(item => item.authorRecord.confirm_status !== 'PENDING');
  }, [myCoAuthorEntries]);

  // Helper tính thời hạn còn lại
  const getTimeRemaining = (deadlineStr?: string, submittedAt?: string) => {
    if (!deadlineStr && !submittedAt) return '3 ngày';
    const deadline = deadlineStr
      ? new Date(deadlineStr).getTime()
      : new Date(submittedAt!).getTime() + 3 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const diff = deadline - now;

    if (diff <= 0) return 'Đã hết hạn';
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    if (days > 0) {
      return `Còn ${days} ngày ${hours} giờ`;
    }
    return `Còn ${hours} giờ`;
  };

  // Xử lý Đồng ý xác nhận
  const handleAccept = (articleId: string) => {
    dispatch({
      type: 'CONFIRM_CO_AUTHOR',
      payload: {
        articleId,
        userId: state.currentUser.id,
        accept: true
      }
    });
    notify('Bạn đã đồng ý xác nhận tư cách đồng tác giả thành công!', 'success');
  };

  // Mở modal từ chối
  const handleOpenReject = (article: Article, myAuthorRecord: ArticleAuthor) => {
    setRejectArticle({ article, myAuthorRecord });
    setRejectReason('');
  };

  // Xác nhận từ chối
  const handleConfirmReject = () => {
    if (!rejectArticle) return;
    if (!rejectReason.trim()) {
      notify('Bắt buộc phải nhập lý do từ chối đồng tác giả!', 'error');
      return;
    }

    dispatch({
      type: 'CONFIRM_CO_AUTHOR',
      payload: {
        articleId: rejectArticle.article.id,
        userId: state.currentUser.id,
        accept: false,
        reason: rejectReason.trim()
      }
    });

    notify(`Bạn đã từ chối đồng tác giả bài viết "${rejectArticle.article.title}". Bài viết đã được đưa về bản nháp.`, 'info');
    setRejectArticle(null);
  };

  // Giả lập quá hạn 3 ngày (Mock demo action)
  const handleSimulateTimeout = (articleId?: string) => {
    dispatch({
      type: 'SIMULATE_COAUTHOR_TIMEOUT',
      payload: { articleId }
    });
    notify('⏱ Đã chạy tiến trình nền giả lập quá hạn 3 ngày: Các bài chưa được đồng tác giả xác nhận đã được tự động chuyển về Bản nháp!', 'warning');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <PageHeader
        breadcrumbs={[
          { label: 'Tác phẩm của tôi', link: '/reporter/articles' },
          { label: 'Xác nhận đồng tác giả' }
        ]}
        title="Xác nhận đồng tác giả bài viết"
        description="Xác nhận tư cách tham gia và tỷ lệ hưởng nhuận bút khi được phóng viên khác mời làm đồng tác giả (Hạn 3 ngày)."
        actions={
          <div className="flex items-center gap-2">
            {/* Nút demo giả lập quá hạn */}
            <button
              type="button"
              onClick={() => handleSimulateTimeout()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-200 text-slate-700 hover:bg-slate-300 border border-slate-300 transition-colors cursor-pointer"
              title="Chạy job nền kiểm tra quá hạn xác nhận 3 ngày"
            >
              <Timer className="w-3.5 h-3.5 text-slate-600" />
              <span>⏱ Giả lập quá hạn 3 ngày</span>
            </button>
            <button
              onClick={() => navigate('/reporter/articles')}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Quay lại bài viết
            </button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('PENDING')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'PENDING'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Chờ tôi xác nhận</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
            activeTab === 'PENDING' ? 'bg-amber-400 text-slate-900' : 'bg-slate-200 text-slate-700'
          }`}>
            {pendingList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'HISTORY'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Lịch sử đã phản hồi</span>
          <span className="px-2 py-0.5 rounded-full text-[11px] bg-slate-100 text-slate-600 font-semibold">
            {historyList.length}
          </span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'PENDING' ? (
        <div className="space-y-4">
          {pendingList.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto opacity-80" />
              <h3 className="text-sm font-bold text-slate-900">Không có yêu cầu chờ xác nhận</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Hiện tại bạn không có bài viết nào đang chờ xác nhận đồng tác giả. Khi có phóng viên khác mời bạn tham gia tác phẩm, thông báo sẽ xuất hiện tại đây.
              </p>
            </div>
          ) : (
            pendingList.map(item => {
              const genre = getGenre(item.article.declared_category_id || item.article.genre_id);
              const remainingTime = getTimeRemaining(item.authorRecord.confirm_deadline, item.article.first_submitted_at || item.article.created_at);

              return (
                <div
                  key={item.article.id}
                  className="bg-white rounded-2xl border border-amber-300/80 shadow-2xs p-5 space-y-4 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-amber-500" />

                  {/* Header bài viết */}
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          Chờ bạn xác nhận
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          {genre?.name}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs text-slate-400">
                          Gửi lúc: {item.article.first_submitted_at || item.article.created_at}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 hover:text-blue-900 transition-colors">
                        {item.article.title}
                      </h3>
                      {item.article.sapo && (
                        <p className="text-xs text-slate-600 line-clamp-2 italic">
                          "{item.article.sapo}"
                        </p>
                      )}
                    </div>

                    {/* Badge thời hạn còn lại */}
                    <div className="shrink-0 flex md:flex-col items-center md:items-end justify-between gap-1">
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{remainingTime}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Hạn tối đa 3 ngày</span>
                    </div>
                  </div>

                  {/* Thông tin tác giả & Tỷ lệ của TÔI */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Tác giả chính:</span>
                      <span className="font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                        <UserCheck className="w-3.5 h-3.5 text-blue-900" />
                        {item.mainAuthorUser?.full_name || 'Phóng viên'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Tỷ lệ nhuận bút của BẠN:</span>
                      <span className="font-extrabold text-blue-900 text-sm mt-0.5 block">
                        {item.authorRecord.share_percent}%
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Ảnh / Media do bạn chụp:</span>
                      <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                        <ImageIcon className="w-3.5 h-3.5 text-slate-600" />
                        {item.myAttachments.length > 0
                          ? `${item.myAttachments.length} tệp hình ảnh`
                          : 'Không đính kèm tệp riêng'}
                      </span>
                    </div>
                  </div>

                  {/* Danh sách toàn bộ tác giả và tỷ lệ phân chia */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      Cơ cấu phân chia toàn bộ bài viết:
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {item.allAuthors.map(au => {
                        const u = getUser(au.user_id);
                        const isMe = au.user_id === state.currentUser.id;
                        return (
                          <div
                            key={au.user_id}
                            className={`px-3 py-1 rounded-xl text-xs border flex items-center gap-2 ${
                              isMe
                                ? 'bg-blue-100 text-blue-900 border-blue-300 font-bold'
                                : 'bg-slate-50 text-slate-700 border-slate-200'
                            }`}
                          >
                            <span>
                              {u?.full_name} {au.is_main ? '(Chính)' : ''} {isMe ? '(Bạn)' : ''}
                            </span>
                            <span className="font-mono font-extrabold text-[11px]">
                              {au.share_percent}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Nút hành động */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewArticle(item.article)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-600" />
                      <span>Xem nội dung bài viết</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenReject(item.article, item.authorRecord)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white text-rose-700 border border-rose-300 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <XCircle className="w-4 h-4 text-rose-600" />
                        <span>Từ chối</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAccept(item.article.id)}
                        className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-800 shadow-xs transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Đồng ý xác nhận ({item.authorRecord.share_percent}%)</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Tab Lịch sử đã phản hồi */
        <div className="space-y-3">
          {historyList.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
              Bạn chưa có lịch sử xác nhận đồng tác giả nào.
            </div>
          ) : (
            historyList.map(item => {
              const isAccepted = item.authorRecord.confirm_status === 'ACCEPTED';
              return (
                <div
                  key={item.article.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isAccepted ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {isAccepted ? 'Đã đồng ý' : 'Đã từ chối'}
                      </span>
                      <span className="text-xs text-slate-400">
                        Phản hồi lúc: {item.authorRecord.confirmed_at || '—'}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">{item.article.title}</h4>
                    <div className="text-xs text-slate-500 flex items-center gap-2">
                      <span>Tác giả chính: <strong>{item.mainAuthorUser?.full_name}</strong></span>
                      <span>•</span>
                      <span>Tỷ lệ của bạn: <strong>{item.authorRecord.share_percent}%</strong></span>
                    </div>
                    {!isAccepted && item.authorRecord.reject_reason && (
                      <p className="text-xs text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-200 mt-1">
                        Lý do từ chối: "{item.authorRecord.reject_reason}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setPreviewArticle(item.article)}
                      className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem lại</span>
                    </button>
                    <StatusBadge status={item.article.status} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Modal Xem nội dung bài viết chi tiết (Chỉ đọc) */}
      {previewArticle && (
        <Modal
          isOpen={Boolean(previewArticle)}
          onClose={() => setPreviewArticle(null)}
          title={`Xem bài viết: ${previewArticle.title}`}
          maxWidth="4xl"
          footer={
            <button
              onClick={() => setPreviewArticle(null)}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 cursor-pointer"
            >
              Đóng xem bài
            </button>
          }
        >
          <div className="space-y-4 text-xs text-slate-800">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center gap-4 text-slate-600">
              <div>
                <span className="text-slate-400 block text-[11px]">Thể loại:</span>
                <span className="font-semibold text-slate-900">
                  {getGenre(previewArticle.declared_category_id || previewArticle.genre_id)?.name}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Tính chất:</span>
                <span className="font-semibold text-slate-900">
                  {previewArticle.declared_nature === 'SANG_TAC' ? 'Sáng tác' : previewArticle.declared_nature}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Tác giả chính:</span>
                <span className="font-semibold text-slate-900">
                  {getUser(previewArticle.author_id)?.full_name}
                </span>
              </div>
            </div>

            {previewArticle.sapo && (
              <div className="p-3.5 bg-blue-50/60 rounded-xl border-l-4 border-blue-900 italic text-slate-700 leading-relaxed font-serif">
                {previewArticle.sapo}
              </div>
            )}

            <div className="space-y-2">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                Nội dung toàn văn:
              </span>
              <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-200 text-slate-800 leading-relaxed font-serif whitespace-pre-line max-h-96 overflow-y-auto">
                {previewArticle.content}
              </div>
            </div>

            {/* Media đính kèm */}
            {getArticleAttachments(previewArticle.id).length > 0 && (
              <div className="space-y-2">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  Tệp đính kèm ({getArticleAttachments(previewArticle.id).length}):
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {getArticleAttachments(previewArticle.id).map(att => (
                    <div key={att.id} className="p-2 border rounded-xl bg-slate-50 flex items-center gap-2">
                      <img src={att.url} alt="" className="w-12 h-12 object-cover rounded-lg" />
                      <div className="overflow-hidden">
                        <div className="font-semibold truncate text-[11px]">{att.caption || att.original_name}</div>
                        <div className="text-[10px] text-slate-400">{att.media_kind}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Modal Bắt buộc nhập lý do từ chối */}
      {rejectArticle && (
        <Modal
          isOpen={Boolean(rejectArticle)}
          onClose={() => setRejectArticle(null)}
          title="Từ chối xác nhận đồng tác giả"
          maxWidth="lg"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <button
                type="button"
                onClick={() => setRejectArticle(null)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-1.5 rounded-xl bg-rose-700 text-white text-xs font-bold hover:bg-rose-800 transition-colors cursor-pointer"
              >
                Xác nhận từ chối
              </button>
            </div>
          }
        >
          <div className="space-y-3 text-xs text-slate-800">
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Khi bạn từ chối, bài viết sẽ được tự động chuyển về <strong>Bản nháp (DRAFT)</strong> và tác giả chính sẽ nhận thông báo kèm lý do bạn cung cấp dưới đây để điều chỉnh lại cơ cấu tác giả.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Lý do từ chối <span className="text-rose-500">*</span>:
              </label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Ví dụ: Tỷ lệ phân chia 20% chưa tương xứng với khối lượng tác nghiệp hiện trường; Tôi không tham gia chụp bộ ảnh này; ..."
                rows={4}
                className="w-full p-3 rounded-xl border border-slate-300 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 text-xs text-slate-900 resize-none"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
