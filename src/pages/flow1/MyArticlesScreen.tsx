import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/common/Header';
import { StatusBadge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';
import { formatDate } from '../../types';
import {
  PenSquare,
  Search,
  Eye,
  Send,
  Edit3,
  Calendar,
  LayoutGrid,
  Table as TableIcon,
  Clock,
  UserCheck,
  Undo2,
  AlertTriangle,
  Users,
  CheckCircle2,
  XCircle,
  FileText,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { Article, ArticleStatusCode, ArticleAuthor } from '../../types';

export const MyArticlesScreen: React.FC = () => {
  const { state, dispatch, notify, getGenre, getSection, getUser, getArticleAuthors } = useApp();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<string>('TAT_CA');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  // Modal rút bài viết
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [selectedArticleForWithdraw, setSelectedArticleForWithdraw] = useState<Article | null>(null);
  const [withdrawReason, setWithdrawReason] = useState('');

  // Modal xác nhận đồng tác giả
  const [coAuthorModalOpen, setCoAuthorModalOpen] = useState(false);
  const [selectedArticleForConfirm, setSelectedArticleForConfirm] = useState<Article | null>(null);
  const [selectedAuthorRecord, setSelectedAuthorRecord] = useState<ArticleAuthor | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Lấy toàn bộ bài viết mà người dùng là TÁC GIẢ CHÍNH HOẶC ĐỒNG TÁC GIẢ
  const myArticles = useMemo(() => {
    const currentUserId = state.currentUser.id;
    // Tìm các article_id mà user này có trong articleAuthors
    const authorRecords = state.articleAuthors.filter(au => au.user_id === currentUserId);
    const involvedArticleIds = new Set([
      ...state.articles.filter(a => a.author_id === currentUserId).map(a => a.id),
      ...authorRecords.map(au => au.article_id)
    ]);

    return state.articles.filter(a => involvedArticleIds.has(a.id));
  }, [state.articles, state.articleAuthors, state.currentUser.id]);

  // Danh sách các bài "Chờ tôi xác nhận" (đồng tác giả chưa phản hồi)
  const pendingMeArticles = useMemo(() => {
    const currentUserId = state.currentUser.id;
    return myArticles.filter(art => {
      const myRecord = state.articleAuthors.find(
        au => au.article_id === art.id && au.user_id === currentUserId
      );
      return myRecord && !myRecord.is_main && myRecord.confirm_status === 'PENDING';
    });
  }, [myArticles, state.articleAuthors, state.currentUser.id]);

  // Bộ đếm tab
  const counts = useMemo(() => {
    const map: Record<string, number> = {
      TAT_CA: myArticles.length,
      DRAFT: 0,
      PENDING_CONFIRMATION: 0,
      SUBMITTED_AND_SCORING: 0,
      REVISION_REQUESTED: 0,
      PUBLISHED_GROUP: 0,
      REJECTED: 0,
      PENDING_ME: pendingMeArticles.length
    };

    myArticles.forEach(a => {
      if (a.status === 'DRAFT') map.DRAFT++;
      else if (a.status === 'PENDING_CONFIRMATION') map.PENDING_CONFIRMATION++;
      else if (a.status === 'SUBMITTED' || a.status === 'ASSIGNED' || a.status === 'PENDING_APPROVAL') {
        map.SUBMITTED_AND_SCORING++;
      } else if (a.status === 'REVISION_REQUESTED') map.REVISION_REQUESTED++;
      else if (a.status === 'SCORE_PUBLISHED' || a.status === 'PUBLISHED') map.PUBLISHED_GROUP++;
      else if (a.status === 'REJECTED') map.REJECTED++;
    });

    return map;
  }, [myArticles, pendingMeArticles]);

  // Lọc bài viết theo Tab và Tìm kiếm
  const filteredArticles = useMemo(() => {
    return myArticles.filter(a => {
      // Lọc tab
      if (activeTab === 'DRAFT' && a.status !== 'DRAFT') return false;
      if (activeTab === 'PENDING_CONFIRMATION' && a.status !== 'PENDING_CONFIRMATION') return false;
      if (activeTab === 'SUBMITTED_AND_SCORING') {
        if (!['SUBMITTED', 'ASSIGNED', 'PENDING_APPROVAL'].includes(a.status)) return false;
      }
      if (activeTab === 'REVISION_REQUESTED' && a.status !== 'REVISION_REQUESTED') return false;
      if (activeTab === 'PUBLISHED_GROUP') {
        if (!['SCORE_PUBLISHED', 'PUBLISHED'].includes(a.status)) return false;
      }
      if (activeTab === 'REJECTED' && a.status !== 'REJECTED') return false;
      if (activeTab === 'PENDING_ME') {
        const myRecord = state.articleAuthors.find(
          au => au.article_id === a.id && au.user_id === state.currentUser.id
        );
        if (!myRecord || myRecord.is_main || myRecord.confirm_status !== 'PENDING') return false;
      }

      // Lọc thể loại
      if (selectedGenre) {
        const catId = a.declared_category_id || a.category_id || a.genre_id;
        if (catId !== selectedGenre) return false;
      }

      // Tìm kiếm tiêu đề & sapo
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchTitle = a.title.toLowerCase().includes(term);
        const matchSapo = (a.sapo || '').toLowerCase().includes(term);
        if (!matchTitle && !matchSapo) return false;
      }

      // Lọc ngày
      if (dateFrom) {
        const subDate = (a.first_submitted_at || a.created_at).split(' ')[0];
        if (subDate < dateFrom) return false;
      }
      if (dateTo) {
        const subDate = (a.first_submitted_at || a.created_at).split(' ')[0];
        if (subDate > dateTo) return false;
      }

      return true;
    });
  }, [myArticles, activeTab, selectedGenre, searchTerm, dateFrom, dateTo, state.articleAuthors, state.currentUser.id]);

  // Xử lý mở Modal rút bài
  const handleOpenWithdrawModal = (article: Article) => {
    setSelectedArticleForWithdraw(article);
    setWithdrawReason('');
    setWithdrawModalOpen(true);
  };

  // Xác nhận rút bài
  const handleConfirmWithdraw = () => {
    if (!selectedArticleForWithdraw) return;
    if (!withdrawReason.trim()) {
      notify('Vui lòng nhập lý do rút bài viết!', 'warning');
      return;
    }

    dispatch({
      type: 'WITHDRAW_ARTICLE',
      payload: {
        articleId: selectedArticleForWithdraw.id,
        reason: withdrawReason.trim()
      }
    });

    notify(`Đã rút bài "${selectedArticleForWithdraw.title}" về Bản nháp thành công!`, 'success');
    setWithdrawModalOpen(false);
    setSelectedArticleForWithdraw(null);
  };

  // Mở modal xác nhận đồng tác giả
  const handleOpenCoAuthorModal = (article: Article) => {
    const record = state.articleAuthors.find(
      au => au.article_id === article.id && au.user_id === state.currentUser.id
    );
    setSelectedArticleForConfirm(article);
    setSelectedAuthorRecord(record || null);
    setRejectReason('');
    setCoAuthorModalOpen(true);
  };

  // Phản hồi đồng tác giả (đồng ý hoặc từ chối)
  const handleRespondCoAuthor = (accept: boolean) => {
    if (!selectedArticleForConfirm) return;
    if (!accept && !rejectReason.trim()) {
      notify('Vui lòng nhập lý do từ chối tham gia đồng tác giả!', 'warning');
      return;
    }

    dispatch({
      type: 'CONFIRM_CO_AUTHOR',
      payload: {
        articleId: selectedArticleForConfirm.id,
        userId: state.currentUser.id,
        accept,
        reason: accept ? undefined : rejectReason.trim()
      }
    });

    if (accept) {
      notify(`Đã đồng ý tham gia đồng tác giả bài viết "${selectedArticleForConfirm.title}"!`, 'success');
    } else {
      notify(`Đã từ chối tham gia bài viết "${selectedArticleForConfirm.title}".`, 'info');
    }

    setCoAuthorModalOpen(false);
    setSelectedArticleForConfirm(null);
    setSelectedAuthorRecord(null);
  };

  const tabs = [
    { key: 'TAT_CA', label: 'Tất cả' },
    { key: 'DRAFT', label: 'Bản nháp' },
    { key: 'PENDING_CONFIRMATION', label: 'Chờ xác nhận' },
    { key: 'SUBMITTED_AND_SCORING', label: 'Đã nộp / đang chấm' },
    { key: 'REVISION_REQUESTED', label: 'Trả về – sửa' },
    { key: 'PUBLISHED_GROUP', label: 'Đã đăng' },
    { key: 'REJECTED', label: 'Từ chối' },
    {
      key: 'PENDING_ME',
      label: 'Chờ tôi xác nhận',
      badge: counts.PENDING_ME > 0 ? counts.PENDING_ME : undefined
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Trang chủ', link: '/reporter/articles' },
          { label: 'Tác phẩm của tôi' }
        ]}
        title="Quản lý Tác phẩm & Hồ sơ Tác quyền"
        description={`Hồ sơ tác phẩm của ${state.currentUser.full_name}. Theo dõi tiến độ duyệt bài, xác nhận tỷ lệ đồng tác giả và xuất bản.`}
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-blue-950 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Bảng danh sách</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white text-blue-950 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Thẻ bài viết</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => navigate('/reporter/articles/new')}
              className="flex items-center gap-2 bg-blue-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-800 transition-colors shadow-xs cursor-pointer"
            >
              <PenSquare className="w-4 h-4" />
              <span>Soạn bài mới</span>
            </button>
          </div>
        }
      />

      {/* Tabs thanh lọc */}
      <div className="border-b border-slate-200 flex items-center gap-2 overflow-x-auto pb-1">
        {tabs.map(tab => {
          const count = counts[tab.key] || 0;
          const isActive = activeTab === tab.key;
          const isPendingMe = tab.key === 'PENDING_ME';

          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3.5 py-2 border-b-2 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                isActive
                  ? 'border-blue-900 text-blue-900 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isPendingMe && count > 0
                    ? 'bg-rose-500 text-white animate-pulse'
                    : isActive
                      ? 'bg-blue-100 text-blue-900'
                      : 'bg-slate-100 text-slate-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bộ lọc Thể loại & Tìm kiếm tiêu đề */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tiêu đề tác phẩm..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div>
          <select
            value={selectedGenre}
            onChange={e => setSelectedGenre(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
          >
            <option value="">-- Tất cả thể loại --</option>
            {state.genres.map(g => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="w-1/2 px-2 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
            title="Từ ngày"
          />
          <span className="text-slate-400 text-xs">-</span>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="w-1/2 px-2 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
            title="Đến ngày"
          />
        </div>
      </div>

      {/* DANH SÁCH BÀI VIẾT */}
      {filteredArticles.length === 0 ? (
        <EmptyState
          title="Không có bài viết nào phù hợp"
          description="Thử thay đổi bộ lọc trạng thái, thể loại hoặc từ khóa tìm kiếm."
          action={
            <button
              onClick={() => {
                setActiveTab('TAT_CA');
                setSearchTerm('');
                setSelectedGenre('');
                setDateFrom('');
                setDateTo('');
              }}
              className="text-xs text-blue-900 font-bold hover:underline cursor-pointer"
            >
              Xóa tất cả bộ lọc
            </button>
          }
        />
      ) : viewMode === 'table' ? (
        /* BẢNG DANH SÁCH */
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Tác phẩm</th>
                  <th className="py-3 px-3">Thể loại</th>
                  <th className="py-3 px-3">Tính chất</th>
                  <th className="py-3 px-3">Vai trò trong bài</th>
                  <th className="py-3 px-3">Tác giả & Tỷ lệ (%)</th>
                  <th className="py-3 px-3">Trạng thái</th>
                  <th className="py-3 px-3">Ngày nộp</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredArticles.map(art => {
                  const genre = getGenre(art.declared_category_id || art.category_id || art.genre_id);
                  const authors = getArticleAuthors(art.id);
                  const myRecord = authors.find(au => au.user_id === state.currentUser.id);
                  const isMain = art.author_id === state.currentUser.id || myRecord?.is_main;
                  const isPendingMyConfirm = !isMain && myRecord?.confirm_status === 'PENDING';

                  const canEdit = isMain && (art.status === 'DRAFT' || art.status === 'REVISION_REQUESTED');
                  const canSubmit = isMain && art.status === 'DRAFT';
                  const canWithdraw = isMain && art.status === 'SUBMITTED';

                  return (
                    <tr key={art.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Tiêu đề & sapo */}
                      <td className="py-3 px-4 max-w-sm">
                        <div
                          onClick={() => navigate(`/articles/${art.id}`)}
                          className="font-bold text-slate-900 hover:text-blue-900 cursor-pointer font-editorial text-sm line-clamp-1"
                        >
                          {art.title}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                          {art.sapo || 'Chưa có tóm tắt...'}
                        </div>
                        {art.withdrawn_count && art.withdrawn_count > 0 ? (
                          <div className="text-[10px] text-amber-700 font-semibold mt-0.5">
                            Đã rút bài {art.withdrawn_count} lần
                          </div>
                        ) : null}
                      </td>

                      {/* Thể loại */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-semibold text-slate-800">{genre?.name || '—'}</span>
                      </td>

                      {/* Tính chất */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {art.declared_nature === 'SANG_TAC' ? 'Sáng tác' :
                           art.declared_nature === 'DICH' ? 'Dịch' :
                           art.declared_nature === 'TONG_HOP' ? 'Tổng hợp' : 'Đăng lại'}
                        </span>
                      </td>

                      {/* Vai trò trong bài */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {isMain ? (
                          <span className="font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 text-[11px]">
                            Tác giả chính
                          </span>
                        ) : (
                          <span className="font-semibold text-purple-900 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100 text-[11px]">
                            Đồng tác giả ({myRecord?.share_percent || 0}%)
                          </span>
                        )}
                      </td>

                      {/* Danh sách tác giả & tỷ lệ */}
                      <td className="py-3 px-3 max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {authors.length === 0 ? (
                            <span className="text-slate-400 italic text-[11px]">Chưa khai báo</span>
                          ) : (
                            authors.map(au => {
                              const u = getUser(au.user_id);
                              return (
                                <span
                                  key={au.user_id}
                                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] ${
                                    au.is_main
                                      ? 'bg-blue-50 text-blue-900 font-bold border border-blue-200'
                                      : au.confirm_status === 'ACCEPTED'
                                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                        : au.confirm_status === 'REJECTED'
                                          ? 'bg-rose-50 text-rose-800 border border-rose-200 line-through'
                                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                                  }`}
                                  title={`${u?.full_name}: ${au.share_percent}% (${au.confirm_status})`}
                                >
                                  {u?.full_name?.split(' ').pop() || au.user_id} ({au.share_percent}%)
                                </span>
                              );
                            })
                          )}
                        </div>
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <StatusBadge status={art.status} />
                      </td>

                      {/* Ngày nộp */}
                      <td className="py-3 px-3 whitespace-nowrap text-slate-500 text-[11px]">
                        {formatDate(art.first_submitted_at || art.created_at)}
                      </td>

                      {/* Thao tác */}
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Nút xem chi tiết (luôn có) */}
                          <button
                            type="button"
                            onClick={() => navigate(`/articles/${art.id}`)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-900 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Xem chi tiết & lịch sử"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Xác nhận đồng tác giả nếu đang chờ tôi */}
                          {isPendingMyConfirm && (
                            <button
                              type="button"
                              onClick={() => handleOpenCoAuthorModal(art)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 text-white font-bold text-[11px] hover:bg-amber-600 transition-colors cursor-pointer shadow-2xs"
                              title="Xác nhận tham gia đồng tác giả"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Xác nhận</span>
                            </button>
                          )}

                          {/* Tác giả chính + Bản nháp -> Sửa & Nộp */}
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => navigate(`/reporter/articles/${art.id}/edit`)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-blue-900 hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Chỉnh sửa tác phẩm"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}

                          {canSubmit && (
                            <button
                              type="button"
                              onClick={() => navigate(`/reporter/articles/${art.id}/duplication-check`)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-900 text-white font-bold text-[11px] hover:bg-blue-800 transition-colors cursor-pointer shadow-2xs"
                              title="Kiểm tra trùng lặp & Nộp bài"
                            >
                              <Send className="w-3 h-3" />
                              <span>Nộp bài</span>
                            </button>
                          )}

                          {/* Tác giả chính + Đã nộp (chưa phân công) -> Rút bài */}
                          {canWithdraw && (
                            <button
                              type="button"
                              onClick={() => handleOpenWithdrawModal(art)}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 text-rose-700 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 font-semibold text-[11px] transition-colors cursor-pointer"
                              title="Rút bài về Bản nháp để chỉnh sửa"
                            >
                              <Undo2 className="w-3 h-3" />
                              <span>Rút bài</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* THẺ BÀI VIẾT (GRID) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredArticles.map(art => {
            const genre = getGenre(art.declared_category_id || art.category_id || art.genre_id);
            const section = getSection(art.section_id);
            const authors = getArticleAuthors(art.id);
            const myRecord = authors.find(au => au.user_id === state.currentUser.id);
            const isMain = art.author_id === state.currentUser.id || myRecord?.is_main;
            const isPendingMyConfirm = !isMain && myRecord?.confirm_status === 'PENDING';

            const canEdit = isMain && (art.status === 'DRAFT' || art.status === 'REVISION_REQUESTED');
            const canSubmit = isMain && art.status === 'DRAFT';
            const canWithdraw = isMain && art.status === 'SUBMITTED';

            return (
              <div
                key={art.id}
                className="group rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-900 border border-blue-100">
                        {genre?.name}
                      </span>
                      <StatusBadge status={art.status} />
                    </div>

                    <h3
                      onClick={() => navigate(`/articles/${art.id}`)}
                      className="text-sm font-black text-slate-900 group-hover:text-blue-900 transition-colors font-editorial line-clamp-2 leading-snug cursor-pointer"
                    >
                      {art.title}
                    </h3>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {art.sapo || 'Chưa có tóm tắt...'}
                    </p>

                    <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                      <div className="flex items-center justify-between">
                        <span>Vai trò của bạn:</span>
                        <strong className={isMain ? 'text-blue-900' : 'text-purple-900'}>
                          {isMain ? 'Tác giả chính' : `Đồng tác giả (${myRecord?.share_percent || 0}%)`}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Ngày nộp:</span>
                        <span>{formatDate(art.first_submitted_at || art.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => navigate(`/articles/${art.id}`)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-blue-900 hover:bg-slate-200 cursor-pointer"
                    title="Xem chi tiết"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-1.5">
                    {isPendingMyConfirm && (
                      <button
                        type="button"
                        onClick={() => handleOpenCoAuthorModal(art)}
                        className="px-2.5 py-1 rounded-lg bg-amber-500 text-white font-bold text-[11px] hover:bg-amber-600 cursor-pointer"
                      >
                        Xác nhận
                      </button>
                    )}

                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => navigate(`/reporter/articles/${art.id}/edit`)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-blue-900 hover:bg-slate-200 cursor-pointer"
                        title="Sửa bài"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}

                    {canSubmit && (
                      <button
                        type="button"
                        onClick={() => navigate(`/reporter/articles/${art.id}/duplication-check`)}
                        className="flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-900 text-white text-[11px] font-bold hover:bg-blue-800 cursor-pointer shadow-2xs"
                      >
                        <Send className="w-3 h-3" />
                        <span>Nộp bài</span>
                      </button>
                    )}

                    {canWithdraw && (
                      <button
                        type="button"
                        onClick={() => handleOpenWithdrawModal(art)}
                        className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-rose-700 hover:bg-rose-50 font-semibold text-[11px] cursor-pointer"
                      >
                        Rút bài
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL RÚT BÀI VIẾT */}
      {withdrawModalOpen && selectedArticleForWithdraw && (
        <Modal
          isOpen={withdrawModalOpen}
          onClose={() => setWithdrawModalOpen(false)}
          title="Rút bài viết về Bản nháp"
          size="md"
        >
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                <span>Quy định rút bài viết</span>
              </div>
              <p className="leading-relaxed">
                Bài viết sẽ chuyển từ trạng thái <strong>ĐÃ NỘP</strong> về <strong>BẢN NHÁP</strong>. Bạn có thể sửa đổi nội dung và kiểm tra trùng để nộp lại sau.
              </p>
              <div className="font-mono pt-1 text-[11px]">
                Số lần rút bài trước đây: <strong>{selectedArticleForWithdraw.withdrawn_count || 0} / 3 lần tối đa</strong>.
              </div>
            </div>

            {(selectedArticleForWithdraw.withdrawn_count || 0) >= 3 && (
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-300 text-xs text-rose-900 font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Cảnh báo: Bạn đã rút bài này ≥ 3 lần. Việc rút nhiều lần sẽ được ghi nhật ký và có thể ảnh hưởng đến KPI tác nghiệp!</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Lý do rút bài viết <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={withdrawReason}
                onChange={e => setWithdrawReason(e.target.value)}
                placeholder="Nhập lý do rút bài: Ví dụ: Cần bổ sung thêm ảnh hiện trường chất lượng cao và cập nhật số liệu mới nhất..."
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setWithdrawModalOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmWithdraw}
                className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 cursor-pointer"
              >
                Xác nhận rút bài
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL XÁC NHẬN ĐỒNG TÁC GIẢ */}
      {coAuthorModalOpen && selectedArticleForConfirm && selectedAuthorRecord && (
        <Modal
          isOpen={coAuthorModalOpen}
          onClose={() => setCoAuthorModalOpen(false)}
          title="Xác nhận tham gia đồng tác giả"
          size="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-200 space-y-2">
              <div className="font-bold text-slate-900 text-sm">
                {selectedArticleForConfirm.title}
              </div>
              <div className="text-slate-600">
                Tác giả chính: <strong>{getUser(selectedArticleForConfirm.author_id)?.full_name}</strong>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-blue-100">
                <span>Tỷ lệ phân chia đề xuất cho bạn:</span>
                <span className="font-bold text-blue-900 font-mono text-sm">
                  {selectedAuthorRecord.share_percent}%
                </span>
              </div>
              {selectedAuthorRecord.confirm_deadline && (
                <div className="text-[11px] text-slate-500">
                  Thời hạn phản hồi: {formatDate(selectedAuthorRecord.confirm_deadline)}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lý do nếu bạn từ chối tham gia:
              </label>
              <textarea
                rows={2}
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Nhập lý do nếu bạn từ chối: Ví dụ: Tỷ lệ phân chia chưa thỏa đáng hoặc tôi không tham gia phần viết này..."
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => handleRespondCoAuthor(false)}
                className="px-4 py-2 bg-white border border-rose-300 text-rose-700 rounded-xl text-xs font-bold hover:bg-rose-50 cursor-pointer"
              >
                Từ chối tham gia
              </button>
              <button
                type="button"
                onClick={() => handleRespondCoAuthor(true)}
                className="px-5 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 cursor-pointer shadow-xs"
              >
                Đồng ý tham gia ({selectedAuthorRecord.share_percent}%)
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
