import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/common/Header';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';
import { formatDateTime } from '../../types';
import {
  Users,
  Clock,
  AlertCircle,
  Eye,
  CheckCircle,
  AlertTriangle,
  Send,
  UserCheck,
  Filter
} from 'lucide-react';

export const AssignmentQueueScreen: React.FC = () => {
  const { state, dispatch, notify, getGenre, getSection, getUser } = useApp();
  const navigate = useNavigate();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [selectedEditorId, setSelectedEditorId] = useState('');
  const [assignNote, setAssignNote] = useState('');
  const [genreFilter, setGenreFilter] = useState('ALL');

  // Trưởng ban: chỉ xem bài SUBMITTED của ban mình
  const userSectionId = state.currentUser.section_id;

  const pendingArticles = useMemo(() => {
    return state.articles
      .filter(a => {
        // Chỉ bài SUBMITTED
        if (a.status !== 'SUBMITTED') return false;

        // Chỉ bài của ban mình nếu user có ban (Trưởng ban)
        if (state.currentRole === 'TRUONG_BAN' && userSectionId && a.section_id !== userSectionId) {
          return false;
        }

        // Bộ lọc thể loại
        if (genreFilter !== 'ALL' && a.declared_category_id !== genreFilter && a.genre_id !== genreFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.first_submitted_at || a.created_at).getTime();
        const timeB = new Date(b.first_submitted_at || b.created_at).getTime();
        return timeA - timeB; // Cũ nhất xếp trước
      });
  }, [state.articles, state.currentRole, userSectionId, genreFilter]);

  // Tính thời gian chờ (tuổi bài viết theo giờ)
  // Thời gian tham chiếu theo mốc dữ liệu mẫu: 26/09/2026 16:00
  const getArticleAgeHours = (dateStr: string) => {
    try {
      const nowTime = new Date('2026-09-26T16:00:00').getTime();
      const subTime = new Date(dateStr.replace(' ', 'T')).getTime();
      const diffHours = (nowTime - subTime) / (1000 * 60 * 60);
      return Math.max(0, Math.floor(diffHours));
    } catch {
      return 0;
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(pendingArticles.map(a => a.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkAssign = () => {
    if (!selectedEditorId) {
      notify('Vui lòng chọn một Biên tập viên', 'error');
      return;
    }
    dispatch({
      type: 'ASSIGN_EDITOR',
      payload: {
        articleIds: selectedIds,
        editorId: selectedEditorId,
        note: assignNote || 'Trưởng ban phân công biên tập hàng loạt'
      }
    });

    const ed = getUser(selectedEditorId);
    notify(`Đã phân công ${selectedIds.length} bài viết cho BTV ${ed?.full_name}!`, 'success');
    setSelectedIds([]);
    setBulkModalOpen(false);
  };

  // Các BTV trong ban
  const departmentEditors = useMemo(() => {
    return state.users.filter(
      u => u.role_code === 'BIEN_TAP_VIEN' && (!userSectionId || u.section_id === userSectionId)
    );
  }, [state.users, userSectionId]);

  const currentSection = getSection(userSectionId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <PageHeader
        breadcrumbs={[
          { label: 'Trang chủ', link: '/editor-lead/queue' },
          { label: 'Hàng chờ phân công' }
        ]}
        title={`Hàng chờ phân công BTV${currentSection ? ` – ${currentSection.name}` : ''}`}
        description="Danh sách các tác phẩm đã nộp thuộc ban chuyên môn đang chờ Trưởng ban chỉ định Biên tập viên thẩm định. Cảnh báo trễ: Vàng > 24h, Đỏ > 48h."
        actions={
          selectedIds.length > 0 && (
            <button
              type="button"
              onClick={() => setBulkModalOpen(true)}
              className="flex items-center gap-2 bg-blue-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-800 transition-colors shadow-xs cursor-pointer"
            >
              <Users className="w-4 h-4" />
              <span>Phân công ({selectedIds.length} bài đã chọn)</span>
            </button>
          )
        }
      />

      {/* Thống kê cảnh báo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-3.5 shadow-xs">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center font-black text-base border border-blue-100">
            {pendingArticles.length}
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800">Bài chờ phân công</div>
            <div className="text-[11px] text-slate-500">
              {currentSection ? currentSection.name : 'Toàn bộ chuyên mục'}
            </div>
          </div>
        </div>

        <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 flex items-center gap-3.5 shadow-xs">
          <div className="w-11 h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-amber-900">Cảnh báo chậm &gt; 24 giờ (Vàng)</div>
            <div className="text-[11px] text-amber-700">Cần chỉ định BTV trong ca trực</div>
          </div>
        </div>

        <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-200 flex items-center gap-3.5 shadow-xs">
          <div className="w-11 h-11 rounded-xl bg-rose-600 text-white flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-rose-900">Quá hạn khẩn cấp &gt; 48 giờ (Đỏ)</div>
            <div className="text-[11px] text-rose-700">Ưu tiên phân công thẩm định ngay</div>
          </div>
        </div>
      </div>

      {/* Thanh bộ lọc */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-700">Lọc theo thể loại:</span>
          <select
            value={genreFilter}
            onChange={e => setGenreFilter(e.target.value)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
          >
            <option value="ALL">Tất cả thể loại</option>
            {state.genres.map(g => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500">
          Hiển thị: <strong>{pendingArticles.length}</strong> bài viết chờ phân công
        </div>
      </div>

      {/* Bảng danh sách bài viết SUBMITTED */}
      {pendingArticles.length === 0 ? (
        <EmptyState
          icon={<CheckCircle className="w-12 h-12 text-emerald-500 stroke-1" />}
          title="Không có bài viết nào chờ phân công"
          description={`Tất cả bài viết đã nộp thuộc ${currentSection?.name || 'ban'} đều đã được chỉ định BTV xử lý.`}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === pendingArticles.length && pendingArticles.length > 0}
                      onChange={e => handleSelectAll(e.target.checked)}
                      className="rounded border-slate-300 text-blue-900 focus:ring-blue-600 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-4 w-36">Thể loại khai báo</th>
                  <th className="py-3 px-4">Tác phẩm</th>
                  <th className="py-3 px-4">Tác giả (+ Đồng tác giả)</th>
                  <th className="py-3 px-4 w-36">Ngày nộp</th>
                  <th className="py-3 px-4 w-36">Thời gian chờ</th>
                  <th className="py-3 px-4 w-32 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingArticles.map(art => {
                  const mainAuthor = getUser(art.author_id);
                  const declaredGenre = getGenre(art.declared_category_id || art.category_id || art.genre_id);
                  const subDate = art.last_submitted_at || art.first_submitted_at || art.created_at;
                  const ageHours = getArticleAgeHours(subDate);

                  // Lấy danh sách tác giả và đồng tác giả
                  const articleAuthors = state.articleAuthors.filter(au => au.article_id === art.id);
                  const mainAuthorEntry = articleAuthors.find(au => au.is_main);
                  const coAuthors = articleAuthors.filter(au => !au.is_main);

                  // Cảnh báo thời gian chờ: > 24h Vàng, > 48h Đỏ
                  let rowClass = 'hover:bg-slate-50/70 transition-colors';
                  let ageBadge = (
                    <span className="inline-flex items-center gap-1 text-slate-600 font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{ageHours} giờ</span>
                    </span>
                  );

                  if (ageHours >= 48) {
                    rowClass = 'bg-rose-50/50 hover:bg-rose-50 border-l-4 border-l-rose-500 font-medium';
                    ageBadge = (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-bold text-[11px] border border-rose-300">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span>{ageHours}h (Khẩn cấp &gt; 48h)</span>
                      </span>
                    );
                  } else if (ageHours >= 24) {
                    rowClass = 'bg-amber-50/50 hover:bg-amber-50 border-l-4 border-l-amber-500';
                    ageBadge = (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-bold text-[11px] border border-amber-300">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        <span>{ageHours}h (Chậm &gt; 24h)</span>
                      </span>
                    );
                  }

                  const isChecked = selectedIds.includes(art.id);

                  return (
                    <tr key={art.id} className={rowClass}>
                      <td className="py-3.5 px-4">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelect(art.id)}
                          className="rounded border-slate-300 text-blue-900 focus:ring-blue-600 cursor-pointer"
                        />
                      </td>

                      {/* Thể loại khai báo */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-900 border border-blue-200">
                          {declaredGenre?.name || 'Chưa phân loại'}
                        </span>
                      </td>

                      {/* Tiêu đề & sapo */}
                      <td className="py-3.5 px-4 max-w-md">
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
                      </td>

                      {/* Tác giả & Đồng tác giả */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                            <span>{mainAuthor?.full_name || 'Phóng viên'}</span>
                            {mainAuthorEntry && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-bold">
                                Chính: {mainAuthorEntry.share_percent}%
                              </span>
                            )}
                          </div>

                          {coAuthors.length > 0 && (
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 flex-wrap">
                              <span className="text-slate-400 font-medium">Đồng tác giả:</span>
                              {coAuthors.map((ca, idx) => {
                                const caUser = getUser(ca.user_id);
                                return (
                                  <span key={ca.id} className="text-blue-900 font-medium">
                                    {caUser?.full_name} ({ca.share_percent}%)
                                    {idx < coAuthors.length - 1 ? ',' : ''}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Ngày nộp */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-medium text-[11px]">
                        {formatDateTime(subDate)}
                      </td>

                      {/* Thời gian chờ */}
                      <td className="py-3.5 px-4 whitespace-nowrap">{ageBadge}</td>

                      {/* Nút thao tác Phân công */}
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
                            onClick={() => navigate(`/editor-lead/assign/${art.id}`)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-900 text-white text-xs font-bold hover:bg-blue-800 transition-colors shadow-2xs cursor-pointer"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Phân công</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Phân công hàng loạt */}
      <Modal
        isOpen={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        title={`Phân công ${selectedIds.length} bài viết đã chọn`}
        footer={
          <>
            <button
              type="button"
              onClick={() => setBulkModalOpen(false)}
              className="px-4 py-2 border border-slate-300 text-xs font-semibold rounded-xl text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleBulkAssign}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-900 text-white text-xs font-bold rounded-xl hover:bg-blue-800 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Xác nhận phân công</span>
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Chỉ định Biên tập viên chịu trách nhiệm thẩm định và chấm điểm chất lượng cho các bài viết đã chọn:
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
              Chọn Biên tập viên <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedEditorId}
              onChange={e => setSelectedEditorId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium bg-white"
            >
              <option value="">-- Chọn Biên tập viên --</option>
              {departmentEditors.map(ed => {
                const workload = state.articles.filter(
                  a => a.editor_id === ed.id && a.status === 'ASSIGNED'
                ).length;
                return (
                  <option key={ed.id} value={ed.id}>
                    {ed.full_name} ({getSection(ed.section_id)?.name}) — Đang chấm: {workload} bài
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
              Ghi chú chỉ đạo của Trưởng ban
            </label>
            <textarea
              rows={3}
              placeholder="Nhập yêu cầu chỉ đạo đặc biệt nếu có..."
              value={assignNote}
              onChange={e => setAssignNote(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
