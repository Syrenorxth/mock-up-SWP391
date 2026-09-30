import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/common/Header';
import { QualityBadge, StatusBadge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';
import { Article, formatDate, formatDateTime } from '../../types';
import {
  Globe,
  Search,
  Eye,
  Calendar,
  ExternalLink,
  Share2,
  Bookmark,
  TrendingUp,
  Clock,
  Layers,
  LayoutGrid,
  Table as TableIcon,
  Newspaper,
  CheckCircle,
  FileCheck2,
  Award
} from 'lucide-react';

export const PublishedArticlesScreen: React.FC = () => {
  const {
    state,
    getGenre,
    getSection,
    getUser,
    getArticleQualityScore,
    getArticleAttachments
  } = useApp();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [previewArticle, setPreviewArticle] = useState<Article | null>(null);

  // Lọc danh sách bài PUBLISHED
  const publishedArticles = useMemo(() => {
    return state.articles
      .filter(a => a.status === 'PUBLISHED')
      .sort((a, b) => {
        const timeA = new Date(a.published_at || a.created_at).getTime();
        const timeB = new Date(b.published_at || b.created_at).getTime();
        return timeB - timeA; // Mới nhất lên đầu
      });
  }, [state.articles]);

  const filteredArticles = useMemo(() => {
    return publishedArticles.filter(art => {
      if (selectedSection && art.section_id !== selectedSection) return false;
      if (selectedGenre && art.genre_id !== selectedGenre) return false;
      if (searchTerm) {
        const matchTitle = art.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchSapo = art.sapo.toLowerCase().includes(searchTerm.toLowerCase());
        if (!matchTitle && !matchSapo) return false;
      }
      return true;
    });
  }, [publishedArticles, selectedSection, selectedGenre, searchTerm]);

  // Bài tiêu điểm (bài đầu tiên trong danh sách lọc)
  const heroArticle = filteredArticles.length > 0 ? filteredArticles[0] : null;
  const regularArticles = filteredArticles.length > 1 ? filteredArticles.slice(1) : [];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Trang chủ', link: '/published-articles' },
          { label: 'Bài đã xuất bản' }
        ]}
        title="Kho xuất bản & Trang nhất Tòa soạn điện tử"
        description="Toàn bộ tác phẩm báo chí chính thức đã phát hành trên cổng thông tin điện tử, thống kê lượt bạn đọc tiếp cận và điểm chất lượng nghiệp vụ."
        actions={
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-blue-950 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Trang nhất báo</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-blue-950 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Bảng dữ liệu</span>
            </button>
          </div>
        }
      />

      {/* Filter toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tiêu đề bài báo, tóm tắt..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div>
          <select
            value={selectedSection}
            onChange={e => setSelectedSection(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
          >
            <option value="">Tất cả chuyên mục</option>
            {state.sections.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedGenre}
            onChange={e => setSelectedGenre(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
          >
            <option value="">Tất cả thể loại</option>
            {state.genres.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Empty State */}
      {filteredArticles.length === 0 ? (
        <EmptyState
          title="Không tìm thấy bài viết xuất bản nào"
          description="Thử thay đổi bộ lọc tìm kiếm hoặc quay lại sau khi đã duyệt xuất bản các bài mới."
        />
      ) : viewMode === 'grid' ? (
        /* MAGAZINE / FRONT PAGE EDITORIAL LAYOUT */
        <div className="space-y-6">
          {/* Top Featured Headline Article */}
          {heroArticle && (
            <div
              onClick={() => setPreviewArticle(heroArticle)}
              className="group cursor-pointer rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-0"
            >
              <div className="lg:col-span-7 relative min-h-[260px] sm:min-h-[320px] overflow-hidden bg-slate-900">
                <img
                  src={heroArticle.cover_image || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80'}
                  alt={heroArticle.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.dataset.fallback) {
                      target.dataset.fallback = 'true';
                      target.src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80';
                    }
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent lg:hidden"></div>
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-red-700 text-white text-[11px] font-extrabold uppercase shadow-md">
                    TIÊU ĐIỂM XUẤT BẢN
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-amber-300 text-[11px] font-semibold">
                    {getSection(heroArticle.section_id)?.name}
                  </span>
                </div>
              </div>

              <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-semibold text-blue-900">{getGenre(heroArticle.genre_id)?.name}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {formatDateTime(heroArticle.published_at || heroArticle.created_at)}
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 group-hover:text-blue-900 transition-colors font-editorial leading-tight">
                    {heroArticle.title}
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3">
                    {heroArticle.sapo}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {getUser(heroArticle.author_id)?.avatar_url ? (
                      <img
                        src={getUser(heroArticle.author_id)?.avatar_url}
                        alt="author"
                        className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-900 text-white font-bold flex items-center justify-center text-xs">
                        {getUser(heroArticle.author_id)?.full_name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {getUser(heroArticle.author_id)?.full_name}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {getUser(heroArticle.author_id)?.job_title || 'Phóng viên'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
                      <Eye className="w-3.5 h-3.5 text-blue-700" />
                      {(heroArticle.view_count || 0).toLocaleString('vi-VN')}
                    </span>
                    <span className="text-xs font-bold text-blue-900 group-hover:translate-x-1 transition-transform">
                      Đọc bài →
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sub-grid of other published articles */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {regularArticles.map(art => {
              const author = getUser(art.author_id);
              const section = getSection(art.section_id);
              const genre = getGenre(art.genre_id);
              const quality = getArticleQualityScore(art.id);

              return (
                <div
                  key={art.id}
                  onClick={() => setPreviewArticle(art)}
                  className="group cursor-pointer rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between hover:-translate-y-1"
                >
                  <div>
                    {/* Thumbnail Image */}
                    <div className="relative h-44 overflow-hidden bg-slate-100">
                      <img
                        src={art.cover_image || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80'}
                        alt={art.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (!target.dataset.fallback) {
                            target.dataset.fallback = 'true';
                            target.src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80';
                          }
                        }}
                      />
                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold">
                          {section?.name}
                        </span>
                      </div>
                      {quality && (
                        <div className="absolute bottom-3 right-3">
                          <span className="px-2 py-0.5 rounded-full bg-white/95 text-blue-950 text-[10px] font-extrabold shadow-sm flex items-center gap-1">
                            <Award className="w-3 h-3 text-amber-500" />
                            {quality.quality_tier} ({quality.total_score}đ)
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-2.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span className="font-semibold text-blue-900">{genre?.name}</span>
                        <span>{formatDate(art.published_at || art.created_at)}</span>
                      </div>

                      <h3 className="text-sm font-black text-slate-900 group-hover:text-blue-900 transition-colors font-editorial line-clamp-2 leading-snug">
                        {art.title}
                      </h3>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {art.sapo}
                      </p>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="p-4 pt-0 border-t border-slate-100 mt-2 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {author?.avatar_url ? (
                        <img
                          src={author.avatar_url}
                          alt={author.full_name}
                          className="w-6 h-6 rounded-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                          {author?.full_name?.charAt(0)}
                        </div>
                      )}
                      <span className="font-medium text-slate-700 text-[11px]">{author?.full_name}</span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600">
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                      {(art.view_count || 0).toLocaleString('vi-VN')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* TABLE VIEW WITH THUMBNAILS */
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Bài viết</th>
                  <th className="py-3 px-4">Chuyên mục</th>
                  <th className="py-3 px-4">Thể loại</th>
                  <th className="py-3 px-4">Tác giả</th>
                  <th className="py-3 px-4">Điểm thẩm định</th>
                  <th className="py-3 px-4 text-right">Lượt xem</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredArticles.map(art => {
                  const author = getUser(art.author_id);
                  const editor = art.editor_id ? getUser(art.editor_id) : null;
                  const section = getSection(art.section_id);
                  const genre = getGenre(art.genre_id);
                  const quality = getArticleQualityScore(art.id);

                  return (
                    <tr key={art.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 max-w-md">
                        <div className="flex items-center gap-3">
                          <img
                            src={art.cover_image || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80'}
                            alt={art.title}
                            className="w-14 h-11 rounded-lg object-cover shrink-0 ring-1 ring-slate-200"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (!target.dataset.fallback) {
                                target.dataset.fallback = 'true';
                                target.src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80';
                              }
                            }}
                          />
                          <div className="min-w-0">
                            <div
                              onClick={() => setPreviewArticle(art)}
                              className="font-black text-slate-900 hover:text-blue-900 cursor-pointer line-clamp-1 font-editorial text-sm"
                            >
                              {art.title}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">
                              Xuất bản: {formatDateTime(art.published_at || art.created_at)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-800 font-semibold">
                        {section?.name || '—'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                        {genre?.name || '—'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-800">
                        <div className="flex items-center gap-1.5">
                          {author?.avatar_url && (
                            <img
                              src={author.avatar_url}
                              alt=""
                              className="w-5 h-5 rounded-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          )}
                          <span>{author?.full_name || '—'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {quality ? (
                          <div className="flex items-center gap-1.5">
                            <QualityBadge tier={quality.quality_tier} factor={quality.quality_factor} />
                            <span className="text-[11px] font-bold text-slate-700">({quality.total_score}đ)</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Chưa chấm</span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-right font-black text-slate-900">
                        {(art.view_count || 0).toLocaleString('vi-VN')}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => setPreviewArticle(art)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-900 font-bold hover:bg-blue-100 transition-colors cursor-pointer shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Xem bài</span>
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

      {/* Reader Article Preview Modal */}
      {previewArticle && (
        <Modal
          isOpen={Boolean(previewArticle)}
          onClose={() => setPreviewArticle(null)}
          title="Trang Báo điện tử chính thức • Giao diện độc giả"
          maxWidth="4xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-slate-500 flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-emerald-600" />
                Bài báo đã thẩm định 5 tiêu chí & duyệt xuất bản chính thức
              </span>
              <button
                onClick={() => setPreviewArticle(null)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 cursor-pointer"
              >
                Đóng
              </button>
            </div>
          }
        >
          <div className="space-y-6">
            {/* Masthead Header on Reader Modal */}
            <div className="border-b-2 border-red-700 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-red-700 text-white font-black text-xl px-3 py-1 tracking-tighter uppercase rounded-xs font-editorial">
                    BÁO ĐIỆN TỬ
                  </div>
                  <div className="text-[11px] text-slate-500 hidden sm:block">
                    Cơ quan ngôn luận uy tín • Xuất bản đa nền tảng 24/7
                  </div>
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  {formatDateTime(previewArticle.published_at || new Date().toISOString())}
                </div>
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs font-bold text-slate-800 uppercase overflow-x-auto pt-1">
                <span className="text-red-700 border-b-2 border-red-700 pb-0.5">Thời sự</span>
                <span className="hover:text-red-700 cursor-pointer">Kinh tế</span>
                <span className="hover:text-red-700 cursor-pointer">Xã hội</span>
                <span className="hover:text-red-700 cursor-pointer">Văn hóa</span>
                <span className="hover:text-red-700 cursor-pointer">Công nghệ</span>
              </div>
            </div>

            {/* Breadcrumb on article */}
            <div className="flex items-center gap-2 text-xs text-red-700 font-bold uppercase">
              <span>{getSection(previewArticle.section_id)?.name}</span>
              <span>&gt;</span>
              <span>{getGenre(previewArticle.genre_id)?.name}</span>
            </div>

            {/* Headline */}
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight font-editorial">
              {previewArticle.title}
            </h1>

            {/* Author info & Actions bar */}
            <div className="flex items-center justify-between text-xs text-slate-500 border-y border-slate-100 py-3">
              <div className="flex items-center gap-3">
                {getUser(previewArticle.author_id)?.avatar_url ? (
                  <img
                    src={getUser(previewArticle.author_id)?.avatar_url}
                    alt="author"
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-900/20"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-900 text-white font-bold flex items-center justify-center text-xs">
                    {getUser(previewArticle.author_id)?.full_name.charAt(0)}
                  </div>
                )}
                <div>
                  <div className="font-bold text-slate-900 text-sm">
                    {getUser(previewArticle.author_id)?.full_name}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Phát hành: {formatDateTime(previewArticle.published_at || previewArticle.created_at)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-slate-700 font-bold bg-slate-100 px-3 py-1 rounded-full">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-700" />
                  <span>{(previewArticle.view_count || 1).toLocaleString('vi-VN')} lượt xem</span>
                </span>
                <button className="p-1.5 hover:text-slate-900 cursor-pointer" title="Chia sẻ bài viết">
                  <Share2 className="w-4 h-4" />
                </button>
                <button className="p-1.5 hover:text-slate-900 cursor-pointer" title="Lưu bài viết">
                  <Bookmark className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Sapo */}
            {previewArticle.sapo && (
              <div className="text-base font-semibold text-slate-900 italic leading-relaxed border-l-4 border-red-700 pl-4 py-1 bg-slate-50/60 rounded-r-lg">
                {previewArticle.sapo}
              </div>
            )}

            {/* Cover Image Feature */}
            {previewArticle.cover_image && (
              <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-sm">
                <img
                  src={previewArticle.cover_image}
                  alt={previewArticle.title}
                  className="w-full max-h-[440px] object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.dataset.fallback) {
                      target.dataset.fallback = 'true';
                      target.src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80';
                    }
                  }}
                />
                <div className="p-2.5 text-xs text-slate-600 bg-slate-100 text-center italic">
                  Ảnh phóng viên tác nghiệp hiện trường cung cấp độc quyền cho Tòa soạn.
                </div>
              </div>
            )}

            {/* Additional Attachments */}
            {getArticleAttachments(previewArticle.id).length > 0 && (
              <div className="space-y-4">
                {getArticleAttachments(previewArticle.id).map(att => (
                  <div key={att.id} className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                    {att.media_type === 'IMAGE' ? (
                      <img src={att.url} alt={att.caption} className="w-full max-h-96 object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="h-60 bg-slate-900 flex items-center justify-center text-white font-bold">
                        Video phóng sự hiện trường
                      </div>
                    )}
                    {att.caption && (
                      <div className="p-2.5 text-xs text-slate-600 bg-slate-100 text-center italic">
                        {att.caption}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Article Body Content */}
            <div className="text-base text-slate-800 font-editorial leading-relaxed whitespace-pre-line space-y-4 pt-2">
              {previewArticle.content}
            </div>

            {/* Editorial Certificate Box */}
            <div className="mt-8 p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Bản quyền thuộc Tòa soạn Báo điện tử
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Thẩm định & phê duyệt bởi Ban Biên tập • Lưu chiểu điện tử quốc gia
                  </div>
                </div>
              </div>
              <div className="text-right text-xs italic text-slate-700 font-bold">
                {getUser(previewArticle.author_id)?.full_name} / Báo điện tử
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
