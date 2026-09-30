import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/common/Header';
import { EmptyState } from '../../components/common/EmptyState';
import { formatMoney, formatDate, formatDateTime } from '../../types';
import {
  Coins,
  Receipt,
  Search,
  Filter,
  AlertTriangle,
  AlertCircle,
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  ShieldAlert,
  Sparkles
} from 'lucide-react';

export const RoyaltyQueueScreen: React.FC = () => {
  const {
    state,
    getGenre,
    getSection,
    getUser,
    getArticleRoyaltyItem,
    getEffectiveScoreForArticle,
    getDaysSincePublished
  } = useApp();
  const navigate = useNavigate();

  // Filters
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'SCORED'>('PENDING');
  const [sectionFilter, setSectionFilter] = useState<string>('ALL');
  const [genreFilter, setGenreFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // CHỈ LẤY CÁC BÀI ĐÃ XUẤT BẢN (PUBLISHED) - Bài Từ chối (REJECTED) hoặc các trạng thái khác KHÔNG vào đây
  const publishedArticles = useMemo(() => {
    return state.articles.filter(a => a.status === 'PUBLISHED');
  }, [state.articles]);

  // Lọc theo các điều kiện
  const filteredArticles = useMemo(() => {
    return publishedArticles.filter(art => {
      const isScored = state.royaltyItems.some(r => r.article_id === art.id);

      // Lọc theo trạng thái chấm
      if (statusFilter === 'PENDING' && isScored) return false;
      if (statusFilter === 'SCORED' && !isScored) return false;

      // Lọc theo Ban
      if (sectionFilter !== 'ALL' && art.section_id !== sectionFilter) return false;

      // Lọc theo Thể loại
      const artGenreId = art.category_id || art.genre_id;
      if (genreFilter !== 'ALL' && artGenreId !== genreFilter) return false;

      // Tìm kiếm
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const author = getUser(art.author_id);
        const matchTitle = art.title.toLowerCase().includes(q);
        const matchAuthor = author?.full_name?.toLowerCase().includes(q) || false;
        if (!matchTitle && !matchAuthor) return false;
      }

      return true;
    });
  }, [publishedArticles, state.royaltyItems, statusFilter, sectionFilter, genreFilter, searchQuery, getUser]);

  // Thống kê hạn chi
  const summaryCounts = useMemo(() => {
    let pendingCount = 0;
    let scoredCount = 0;
    let warningCount = 0; // 45 - 60 ngày
    let overdueCount = 0; // > 60 ngày

    publishedArticles.forEach(art => {
      const isScored = state.royaltyItems.some(r => r.article_id === art.id);
      if (isScored) {
        scoredCount++;
      } else {
        pendingCount++;
        const days = getDaysSincePublished(art.published_at);
        if (days > 60) {
          overdueCount++;
        } else if (days >= 45) {
          warningCount++;
        }
      }
    });

    return {
      total: publishedArticles.length,
      pending: pendingCount,
      scored: scoredCount,
      warning: warningCount,
      overdue: overdueCount
    };
  }, [publishedArticles, state.royaltyItems, getDaysSincePublished]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <PageHeader
        breadcrumbs={[
          { label: 'Thư ký tòa soạn', link: '/secretary/royalty-queue' },
          { label: 'Hàng chờ chấm nhuận bút' }
        ]}
        title="Hàng chờ Thẩm định & Chấm Nhuận bút Bài viết"
        description="Danh sách các bài viết ĐÃ XUẤT BẢN (PUBLISHED) chờ Thư ký tòa soạn áp dụng công thức tính nhuận bút chuẩn. Theo dõi sát sao số ngày từ khi đăng để cảnh báo hạn chi trả tối đa 60 ngày theo Nghị định 18/2014."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/secretary/events')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-blue-900" />
              <span>Quản lý sự kiện</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/secretary/royalty-periods')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-900 text-white text-xs font-bold hover:bg-blue-800 transition-colors shadow-xs cursor-pointer"
            >
              <Receipt className="w-4 h-4" />
              <span>Bảng chấm & Chốt kỳ</span>
            </button>
          </div>
        }
      />

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase">Chưa chấm nhuận bút</div>
            <div className="text-2xl font-black text-amber-600 mt-0.5">{summaryCounts.pending}</div>
            <div className="text-[10px] text-slate-400">Trên tổng {summaryCounts.total} bài đã đăng</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Coins className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase">Đã chấm trong kỳ</div>
            <div className="text-2xl font-black text-emerald-600 mt-0.5">{summaryCounts.scored}</div>
            <div className="text-[10px] text-slate-400">Sẵn sàng chốt kỳ chi trả</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/30 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-amber-900 uppercase">Sắp đến hạn chi</div>
            <div className="text-2xl font-black text-amber-700 mt-0.5">{summaryCounts.warning}</div>
            <div className="text-[10px] text-amber-800 font-medium">Từ ngày 45 – 60 từ ngày đăng</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-200 bg-rose-50/30 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-rose-900 uppercase">Quá hạn chi (&gt; 60 ngày)</div>
            <div className="text-2xl font-black text-rose-700 mt-0.5">{summaryCounts.overdue}</div>
            <div className="text-[10px] text-rose-800 font-medium">Vượt trần Nghị định 18/2014</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setStatusFilter('PENDING')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'PENDING'
                  ? 'bg-white text-blue-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Chờ chấm nhuận bút ({summaryCounts.pending})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('SCORED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'SCORED'
                  ? 'bg-white text-blue-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Đã chấm ({summaryCounts.scored})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-white text-blue-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả bài đã đăng ({summaryCounts.total})
            </button>
          </div>

          {/* Search */}
          <div className="relative w-full md:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tiêu đề bài hoặc tác giả..."
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              Ban chuyên môn:
            </span>
            <select
              value={sectionFilter}
              onChange={e => setSectionFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-600"
            >
              <option value="ALL">Tất cả các ban</option>
              {state.sections.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600">Thể loại áp dụng:</span>
            <select
              value={genreFilter}
              onChange={e => setGenreFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-600"
            >
              <option value="ALL">Tất cả 9 thể loại</option>
              {state.genres.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Articles Table */}
      {filteredArticles.length === 0 ? (
        <EmptyState
          icon={<Coins className="w-12 h-12 text-slate-400" />}
          title="Không tìm thấy bài viết nào phù hợp bộ lọc"
          description="Hiện không có bài viết đã đăng nào thỏa mãn điều kiện lọc. Hãy thử thay đổi bộ lọc trạng thái hoặc từ khóa tìm kiếm."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Bài viết & Tác giả</th>
                  <th className="py-3 px-3 w-32">Thể loại áp dụng</th>
                  <th className="py-3 px-3 text-center w-28">Điểm hiệu lực</th>
                  <th className="py-3 px-3 w-28">Ngày đăng</th>
                  <th className="py-3 px-3 text-center w-28">Số ngày từ ngày đăng</th>
                  <th className="py-3 px-4 text-center w-40">Cảnh báo hạn chi</th>
                  <th className="py-3 px-3 text-center w-28">Trạng thái chấm</th>
                  <th className="py-3 px-4 text-right w-32">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredArticles.map(art => {
                  const author = getUser(art.author_id);
                  const genre = getGenre(art.category_id || art.genre_id);
                  const royaltyItem = getArticleRoyaltyItem(art.id);
                  const effectiveScore = getEffectiveScoreForArticle(art.id);
                  const daysSincePublished = getDaysSincePublished(art.published_at);
                  const isScored = !!royaltyItem;

                  // Cảnh báo hạn chi theo LỆNH 7:
                  // - Quá 60 ngày: Màu ĐỎ "Quá hạn chi"
                  // - Từ 45 đến 60 ngày: Màu VÀNG "Sắp đến hạn chi"
                  // - Dưới 45 ngày: Màu XANH / Xám bình thường
                  const isOverdue = daysSincePublished > 60;
                  const isWarning = daysSincePublished >= 45 && daysSincePublished <= 60;

                  return (
                    <tr
                      key={art.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        isOverdue ? 'bg-rose-50/20' : isWarning ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 max-w-xs">
                        <Link
                          to={`/articles/${art.id}`}
                          className="font-bold text-slate-900 hover:text-blue-900 transition-colors line-clamp-2"
                        >
                          {art.title}
                        </Link>
                        <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
                          <span>Tác giả:</span>
                          <strong className="text-slate-800">{author?.full_name || 'Phóng viên'}</strong>
                          {art.event_id && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-blue-50 text-blue-700 border border-blue-200">
                              Sự kiện
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-slate-800">{genre?.name || '—'}</div>
                        <div className="text-[10px] text-slate-400">
                          Chuẩn {genre?.base_factor ?? 10} • Tối đa {genre?.max_factor ?? 15}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <div className="inline-flex flex-col items-center">
                          <span className={`font-black text-xs px-2.5 py-0.5 rounded-md ${
                            effectiveScore >= 90
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : effectiveScore >= 70
                              ? 'bg-blue-100 text-blue-900 border border-blue-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {effectiveScore} đ
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5">
                            {effectiveScore >= 90 ? 'Xuất sắc' : effectiveScore >= 70 ? 'Khá' : 'Đạt'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap text-[11px] text-slate-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{art.published_at ? formatDate(art.published_at) : '—'}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <span className="font-black text-sm text-slate-900">
                          {daysSincePublished}
                        </span>
                        <span className="text-[10px] text-slate-400 block">ngày</span>
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {isOverdue ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>Quá hạn chi ({daysSincePublished} ngày)</span>
                          </span>
                        ) : isWarning ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            <Clock className="w-3.5 h-3.5 shrink-0 text-amber-700" />
                            <span>Sắp đến hạn chi ({daysSincePublished}/60)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Trong hạn ({daysSincePublished}/60)</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        {isScored ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              Đã chấm
                            </span>
                            <div className="text-[10px] font-bold text-emerald-700 mt-0.5">
                              {formatMoney(royaltyItem.total_royalty ?? royaltyItem.amount)}
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            Chưa chấm
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => navigate(`/secretary/royalty-form/${art.id}`)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                            isScored
                              ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700 ring-2 ring-emerald-600/20'
                          }`}
                        >
                          <Coins className="w-3.5 h-3.5" />
                          <span>{isScored ? 'Sửa phiếu' : 'Chấm nhuận bút'}</span>
                        </button>
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
  );
};
