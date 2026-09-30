import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/common/Header';
import { StatusBadge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { formatDateTime } from '../../types';
import {
  ListTodo,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  AlertCircle,
  FileCheck,
  Eye,
  Filter,
  User,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';

export const EditorWorkQueueScreen: React.FC = () => {
  const { state, getGenre, getSection, getUser } = useApp();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'PENDING' | 'SUBMITTED_APPROVAL' | 'REVISED_REJECTED' | 'ALL'>('PENDING');

  const currentEditorId = state.currentUser.id;

  // Lọc các yêu cầu chấm mù do khiếu nại được hệ thống tự động giao cho BTV này
  const myAssignedAppeals = useMemo(() => {
    return state.appeals.filter(ap =>
      (ap.rescore_editor_id === currentEditorId && ap.status === 'IN_RESCORE') ||
      (ap.third_editor_id === currentEditorId && ap.status === 'IN_THIRD_REVIEW')
    );
  }, [state.appeals, currentEditorId]);

  // Lọc tất cả bài viết được giao cho BTV này
  const myAssignedArticles = useMemo(() => {
    return state.articles.filter(a => a.editor_id === currentEditorId);
  }, [state.articles, currentEditorId]);

  // Phân tích trạng thái đặc biệt cho từng bài viết:
  // - "Chấm lại lần 2" (nộp lại sau khi bị trả về)
  // - "Trưởng ban yêu cầu chấm lại" (kèm lý do)
  // - "Chấm lần đầu"
  const enrichedArticles = useMemo(() => {
    return myAssignedArticles.map(art => {
      const logs = state.articleStatusLogs.filter(l => l.article_id === art.id);

      // Kiểm tra Trưởng ban yêu cầu chấm lại
      const leadRescoreLog = logs.find(
        l =>
          l.action.toLowerCase().includes('trưởng ban yêu cầu chấm lại') ||
          (l.from_status === 'PENDING_APPROVAL' && l.to_status === 'ASSIGNED')
      );

      // Kiểm tra Nộp lại sau khi yêu cầu sửa (Chấm lại lần 2)
      const resubmitLog = logs.find(
        l =>
          l.action.toLowerCase().includes('nộp lại') ||
          l.action.toLowerCase().includes('chấm lại lần 2') ||
          (l.from_status === 'REVISION_REQUESTED' && l.to_status === 'ASSIGNED')
      );

      // Lấy log phân công gần nhất để biết ngày phân công
      const assignLog = logs.find(
        l => l.to_status === 'ASSIGNED' || l.action.toLowerCase().includes('phân công')
      );

      return {
        article: art,
        isLeadRescore: !!leadRescoreLog,
        leadRescoreReason: leadRescoreLog?.note || '',
        leadRescoreActor: getUser(leadRescoreLog?.actor_id)?.full_name || 'Trưởng ban',
        isResubmitted: !!resubmitLog && !leadRescoreLog,
        resubmitNote: resubmitLog?.note || '',
        assignedDate: assignLog?.created_at || art.updated_at || art.first_submitted_at || art.created_at
      };
    });
  }, [myAssignedArticles, state.articleStatusLogs, getUser]);

  // Lọc theo tab
  const filteredList = useMemo(() => {
    return enrichedArticles.filter(({ article: a }) => {
      if (activeTab === 'PENDING') {
        return a.status === 'ASSIGNED';
      }
      if (activeTab === 'SUBMITTED_APPROVAL') {
        return a.status === 'PENDING_APPROVAL';
      }
      if (activeTab === 'REVISED_REJECTED') {
        return a.status === 'REVISION_REQUESTED' || a.status === 'REJECTED';
      }
      return true;
    });
  }, [enrichedArticles, activeTab]);

  // Thống kê nhanh
  const countPending = enrichedArticles.filter(item => item.article.status === 'ASSIGNED').length;
  const countResubmitted = enrichedArticles.filter(
    item => item.article.status === 'ASSIGNED' && item.isResubmitted
  ).length;
  const countLeadRescore = enrichedArticles.filter(
    item => item.article.status === 'ASSIGNED' && item.isLeadRescore
  ).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <PageHeader
        breadcrumbs={[
          { label: 'Trang chủ', link: '/editor/queue' },
          { label: 'Hàng việc của tôi' }
        ]}
        title="Hàng việc thẩm định của tôi"
        description={`Danh sách các tác phẩm được Trưởng ban phân công cho BTV ${state.currentUser.full_name} thẩm định chất lượng, bao gồm bài chấm lần đầu, bài nộp lại lần 2 và bài Trưởng ban yêu cầu chấm lại.`}
      />

      {/* Thống kê nhiệm vụ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-3.5 shadow-xs">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center font-black text-base border border-blue-100">
            {countPending}
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800">Cần thẩm định ngay</div>
            <div className="text-[11px] text-slate-500">Các bài viết trạng thái Đã phân công</div>
          </div>
        </div>

        <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 flex items-center gap-3.5 shadow-xs">
          <div className="w-11 h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-amber-900">Chấm lại lần 2 ({countResubmitted})</div>
            <div className="text-[11px] text-amber-700">Phóng viên nộp lại sau khi sửa</div>
          </div>
        </div>

        <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-200 flex items-center gap-3.5 shadow-xs">
          <div className="w-11 h-11 rounded-xl bg-rose-600 text-white flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-rose-900">Trưởng ban yêu cầu chấm lại ({countLeadRescore})</div>
            <div className="text-[11px] text-rose-700">Đánh giá lại theo chỉ đạo chuyên môn</div>
          </div>
        </div>
      </div>

      {/* NHIỆM VỤ CHẤM MÙ DO KHIẾU NẠI (LUỒNG 03) */}
      {myAssignedAppeals.length > 0 && (
        <div className="bg-linear-to-r from-indigo-900 to-slate-900 rounded-3xl p-5 text-white shadow-md space-y-4 border border-indigo-700">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <span>Nhiệm vụ chấm mù do khiếu nại (Luồng 03)</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black">
                    {myAssignedAppeals.length} nhiệm vụ
                  </span>
                </h3>
                <p className="text-[11px] text-indigo-200">
                  Hệ thống tự động phân công độc lập. Thông tin điểm số cũ và lý do khiếu nại được bảo mật.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {myAssignedAppeals.map(appeal => {
              const art = state.articles.find(a => a.id === appeal.article_id);
              const genre = getGenre(art?.category_id || art?.genre_id);
              const isThird = appeal.status === 'IN_THIRD_REVIEW';

              return (
                <div
                  key={appeal.id}
                  className="bg-white/10 backdrop-blur-xs rounded-2xl p-4 border border-white/15 hover:border-white/30 transition-all flex items-start justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-white/20 text-white text-[10px] font-bold">
                        {genre?.name || 'Thể loại'}
                      </span>
                      {isThird ? (
                        <span className="px-2 py-0.5 rounded-full bg-purple-400 text-purple-950 text-[10px] font-black uppercase">
                          Chấm lần 3 (Chấm mù)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 text-[10px] font-black uppercase">
                          Chấm lại do khiếu nại
                        </span>
                      )}
                      {appeal.is_external_editor && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-500/40 text-indigo-100 font-semibold">
                          BTV ngoài ban
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-xs text-white line-clamp-2 leading-snug">
                      {art?.title || 'Tác phẩm'}
                    </h4>

                    <div className="text-[10px] text-indigo-200">
                      Giao ngày: {formatDateTime(appeal.created_at)} • Bộ tiêu chí v{appeal.criteria_set_version}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate(`/editor/rescore/${appeal.id}`)}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition-all shadow-xs cursor-pointer"
                  >
                    <span>Mở phiếu chấm mù</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabs chuyển đổi */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-xs flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('PENDING')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'PENDING'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>Cần chấm ngay</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                activeTab === 'PENDING' ? 'bg-blue-800 text-blue-100' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {countPending}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('SUBMITTED_APPROVAL')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'SUBMITTED_APPROVAL'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>Đã trình duyệt</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold">
              {enrichedArticles.filter(item => item.article.status === 'PENDING_APPROVAL').length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('REVISED_REJECTED')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'REVISED_REJECTED'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>Đã trả về / Từ chối</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold">
              {
                enrichedArticles.filter(
                  item =>
                    item.article.status === 'REVISION_REQUESTED' || item.article.status === 'REJECTED'
                ).length
              }
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'ALL'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>Tất cả bài</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold">
              {enrichedArticles.length}
            </span>
          </button>
        </div>

        <div className="text-xs text-slate-500 pr-2">
          Hiển thị: <strong>{filteredList.length}</strong> bài viết
        </div>
      </div>

      {/* Bảng công việc BTV */}
      {filteredList.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="w-12 h-12 text-emerald-500 stroke-1" />}
          title="Không có bài viết nào trong danh mục này"
          description="Hiện tại bạn không có bài viết nào cần xử lý trong mục đã chọn."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-32">Thể loại</th>
                  <th className="py-3 px-4">Tác phẩm</th>
                  <th className="py-3 px-4 w-44">Tác giả</th>
                  <th className="py-3 px-4 w-52">Tính chất thẩm định</th>
                  <th className="py-3 px-4 w-32">Trạng thái</th>
                  <th className="py-3 px-4 w-36">Ngày phân công</th>
                  <th className="py-3 px-4 w-36 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.map(
                  ({
                    article: art,
                    isLeadRescore,
                    leadRescoreReason,
                    leadRescoreActor,
                    isResubmitted,
                    resubmitNote,
                    assignedDate
                  }) => {
                    const genre = getGenre(art.category_id || art.genre_id);
                    const author = getUser(art.author_id);
                    const coAuthors = state.articleAuthors.filter(
                      au => au.article_id === art.id && !au.is_main
                    );

                    let rowBorder = 'hover:bg-slate-50/70 transition-colors';
                    if (isLeadRescore) {
                      rowBorder = 'bg-rose-50/40 hover:bg-rose-50 border-l-4 border-l-rose-500';
                    } else if (isResubmitted) {
                      rowBorder = 'bg-amber-50/40 hover:bg-amber-50 border-l-4 border-l-amber-500';
                    }

                    return (
                      <tr key={art.id} className={rowBorder}>
                        {/* Thể loại */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-900 border border-blue-200">
                            {genre?.name || 'Chưa rõ'}
                          </span>
                        </td>

                        {/* Tiêu đề tác phẩm */}
                        <td className="py-3.5 px-4 max-w-sm">
                          <div
                            onClick={() => navigate(`/articles/${art.id}`)}
                            className="font-bold text-slate-900 hover:text-blue-700 cursor-pointer line-clamp-2 text-xs leading-snug"
                          >
                            {art.title}
                          </div>

                          {art.sapo && (
                            <div className="text-[11px] text-slate-500 mt-1 line-clamp-1 italic">
                              {art.sapo}
                            </div>
                          )}

                          {/* Hộp hiển thị lý do nếu Trưởng ban yêu cầu chấm lại */}
                          {isLeadRescore && leadRescoreReason && (
                            <div className="mt-2 p-2.5 rounded-xl bg-rose-100/70 border border-rose-300 text-rose-900 text-[11px] leading-relaxed">
                              <span className="font-bold">Chỉ đạo của {leadRescoreActor}: </span>
                              <span>{leadRescoreReason}</span>
                            </div>
                          )}

                          {/* Hộp ghi chú nếu phóng viên nộp lại */}
                          {isResubmitted && resubmitNote && (
                            <div className="mt-2 p-2.5 rounded-xl bg-amber-100/70 border border-amber-300 text-amber-900 text-[11px] leading-relaxed">
                              <span className="font-bold">Ghi chú nộp lại: </span>
                              <span>{resubmitNote}</span>
                            </div>
                          )}
                        </td>

                        {/* Tác giả */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">
                            {author?.full_name || 'Phóng viên'}
                          </div>
                          {coAuthors.length > 0 && (
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              +{coAuthors.length} đồng tác giả
                            </div>
                          )}
                        </td>

                        {/* Tính chất thẩm định / Nhãn phân công */}
                        <td className="py-3.5 px-4">
                          {isLeadRescore ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-rose-100 text-rose-900 border border-rose-300">
                              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                              <span>Trưởng ban yêu cầu chấm lại</span>
                            </span>
                          ) : isResubmitted ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                              <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                              <span>Chấm lại lần 2</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              <FileCheck className="w-3.5 h-3.5 text-slate-500" />
                              <span>Chấm lần đầu</span>
                            </span>
                          )}
                        </td>

                        {/* Trạng thái */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <StatusBadge status={art.status} />
                        </td>

                        {/* Ngày phân công */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-[11px] text-slate-500">
                          {formatDateTime(assignedDate)}
                        </td>

                        {/* Thao tác Mở phiếu chấm */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => navigate(`/articles/${art.id}`)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                              title="Xem chi tiết bài viết"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => navigate(`/editor/score/${art.id}`)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-900 text-white text-xs font-bold hover:bg-blue-800 transition-colors shadow-2xs cursor-pointer"
                            >
                              <FileCheck className="w-3.5 h-3.5" />
                              <span>Mở phiếu chấm</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
