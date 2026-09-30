import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/common/Header';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';
import { Article, formatDate } from '../../types';
import {
  Globe,
  CheckCircle2,
  Calendar,
  User,
  Info,
  Clock,
  Award,
  Eye,
  FileCheck
} from 'lucide-react';

export const PublishApprovalScreen: React.FC = () => {
  const {
    state,
    dispatch,
    notify,
    getGenre,
    getUser,
    getArticleAuthors,
    getArticleQualityScore,
    getEffectiveScoringAttempt
  } = useApp();
  const navigate = useNavigate();

  // Danh sách các bài SCORE_PUBLISHED chờ duyệt đăng
  const publishedScoreArticles = state.articles.filter(a => a.status === 'SCORE_PUBLISHED');

  // Modal xác nhận duyệt đăng
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [publishDate, setPublishDate] = useState('2026-06-29 08:00');

  const handleOpenPublishModal = (art: Article) => {
    setSelectedArticle(art);
    // Nếu là bài mẫu art-nuocsach, ngày đăng mẫu là 29/06/2026
    if (art.id === 'art-nuocsach') {
      setPublishDate('2026-06-29 08:00');
    } else {
      const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
      setPublishDate(nowStr);
    }
  };

  const handleConfirmPublish = () => {
    if (!selectedArticle) return;

    dispatch({
      type: 'APPROVE_PUBLISH',
      payload: {
        articleId: selectedArticle.id,
        publishDateTime: publishDate,
        note: `Trưởng ban duyệt đăng bài viết lên báo điện tử ngày ${publishDate}`
      }
    });

    notify(
      `Đã duyệt đăng bài viết "${selectedArticle.title}" thành công vào ngày ${publishDate}!`,
      'success'
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
          { label: 'Duyệt đăng' }
        ]}
        title="Duyệt đăng tác phẩm báo chí"
        description="Danh sách các bài viết đã hoàn tất công bố điểm chất lượng, sẵn sàng phát hành chính thức lên báo điện tử."
      />

      {/* Ghi chú nghiệp vụ quan trọng */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
        <div className="text-xs text-blue-900 space-y-1">
          <p className="font-bold text-sm text-blue-950">Quy định xuất bản & tính nhuận bút:</p>
          <p className="text-blue-800 leading-relaxed font-semibold">
            "Ngày đăng quyết định đơn giá và hạn chi nhuận bút ở luồng 04."
          </p>
          <p className="text-blue-700 leading-relaxed">
            Khi Trưởng ban duyệt đăng, tác phẩm chuyển trạng thái thành <strong>PUBLISHED</strong>, hệ thống ghi nhận thời điểm đăng chính thức làm mốc áp dụng mức lương cơ sở và chu kỳ thanh toán nhuận bút cho các tác giả.
          </p>
        </div>
      </div>

      {/* Danh sách bài viết chờ duyệt đăng */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800 text-base">Hàng chờ duyệt đăng</h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
              {publishedScoreArticles.length} bài
            </span>
          </div>
        </div>

        {publishedScoreArticles.length === 0 ? (
          <EmptyState
            title="Không có bài viết nào đang chờ duyệt đăng"
            description="Tất cả các bài viết đã được đăng hoặc chưa có bài viết nào hoàn tất công bố điểm chất lượng."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Tác phẩm & Thể loại</th>
                  <th className="px-6 py-4">Tác giả</th>
                  <th className="px-6 py-4 text-center">Điểm chất lượng</th>
                  <th className="px-6 py-4 text-center">Thời điểm công bố điểm</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {publishedScoreArticles.map(art => {
                  const authors = getArticleAuthors(art.id);
                  const mainAuthor = authors.find(a => a.is_main);
                  const coAuthors = authors.filter(a => !a.is_main);
                  const qs = getArticleQualityScore(art.id);
                  const attempt = getEffectiveScoringAttempt(art.id);
                  const score = attempt?.total_score || qs?.total_score || 78;
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

                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="text-base font-black text-indigo-700">
                            {score} <span className="text-xs text-slate-400 font-bold">/ 100</span>
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 bg-blue-100 text-blue-800">
                            {score >= 90 ? 'Xuất sắc' : score >= 70 ? 'Khá' : 'Đạt'}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-center text-xs">
                        <span className="font-semibold text-slate-700 block">
                          {art.score_published_at || attempt?.score_published_at || '2026-06-25 15:00'}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Hạn KN: {attempt?.complaint_deadline || '02/07/2026'}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleOpenPublishModal(art)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          <span>Duyệt đăng</span>
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

      {/* MODAL DUYỆT ĐĂNG */}
      <Modal
        isOpen={!!selectedArticle}
        onClose={() => setSelectedArticle(null)}
        title="Duyệt xuất bản bài viết lên báo điện tử"
        maxWidth="xl"
      >
        {selectedArticle && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block">
                {getGenre(selectedArticle.category_id || selectedArticle.genre_id)?.name}
              </span>
              <h4 className="font-bold text-slate-900 text-sm leading-snug">{selectedArticle.title}</h4>
              <p className="text-xs text-slate-600 italic">"{selectedArticle.sapo}"</p>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-amber-600 shrink-0" />
                Lưu ý ngày đăng:
              </p>
              <p>
                <strong>"Ngày đăng quyết định đơn giá và hạn chi nhuận bút ở luồng 04."</strong>
              </p>
              <p className="text-amber-800">
                Hãy xác nhận ngày giờ đăng chính xác để hệ thống tính đơn giá nhuận bút theo đúng quy chế tòa soạn.
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Ngày giờ xuất bản chính thức (NGÀY ĐĂNG): <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={publishDate}
                onChange={e => setPublishDate(e.target.value)}
                placeholder="YYYY-MM-DD HH:mm (Ví dụ: 2026-06-29 08:00)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:border-indigo-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Mặc định ngày đăng: {publishDate}
              </span>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedArticle(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmPublish}
                className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Xác nhận Duyệt đăng</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
