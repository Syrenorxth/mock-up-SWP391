import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/common/Header';
import { CrossReviewBatch, CrossReviewAssignment, formatDate, formatDateTime } from '../../types';
import {
  Shuffle,
  Calendar,
  Layers,
  Users,
  CheckCircle2,
  AlertCircle,
  Plus,
  Info,
  TrendingUp,
  TrendingDown,
  Minus,
  FileCheck,
  ChevronRight,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

export const CrossReviewBatchScreen: React.FC = () => {
  const { state, dispatch, notify, getUser, getGenre } = useApp();
  const navigate = useNavigate();

  // Form tạo đợt chấm chéo mới
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [batchName, setBatchName] = useState<string>('Đợt chấm chéo kiểm soát chất lượng Tháng 10/2026');
  const [startDate, setStartDate] = useState<string>('2026-10-01');
  const [endDate, setEndDate] = useState<string>('2026-10-31');
  const [selectedGenreId, setSelectedGenreId] = useState<string>('ALL');
  const [sampleSize, setSampleSize] = useState<number>(10);
  const [selectedEditorIds, setSelectedEditorIds] = useState<string[]>([
    'u-cuong-btv',
    'u-dung',
    'u-ha',
    'u-quocanh'
  ]);
  const [batchNote, setBatchNote] = useState<string>(
    'Lấy mẫu ngẫu nhiên các bài đã xuất bản để đối chuẩn độ lệch giữa các BTV.'
  );

  // Đợt đang chọn xem chi tiết assignments
  const [selectedBatchId, setSelectedBatchId] = useState<string>(
    state.crossReviewBatches[0]?.id || ''
  );

  // Danh sách các BTV trong hệ thống
  const allEditors = useMemo(() => {
    return state.users.filter(u => u.role_code === 'BIEN_TAP_VIEN');
  }, [state.users]);

  // Đợt được chọn
  const activeBatch = useMemo(() => {
    return state.crossReviewBatches.find(b => b.id === selectedBatchId) || state.crossReviewBatches[0];
  }, [state.crossReviewBatches, selectedBatchId]);

  // Danh sách bài phân công của đợt đang chọn
  const activeAssignments = useMemo(() => {
    if (!activeBatch) return [];
    return state.crossReviewAssignments.filter(a => a.batch_id === activeBatch.id);
  }, [state.crossReviewAssignments, activeBatch]);

  const handleToggleEditor = (editorId: string) => {
    setSelectedEditorIds(prev =>
      prev.includes(editorId)
        ? prev.filter(id => id !== editorId)
        : [...prev, editorId]
    );
  };

  const handleCreateBatch = () => {
    if (!batchName.trim()) {
      notify('Vui lòng nhập tên đợt chấm chéo.', 'error');
      return;
    }
    if (selectedEditorIds.length < 2) {
      notify('Đợt chấm chéo cần ít nhất 2 BTV tham gia.', 'error');
      return;
    }
    if (sampleSize < 1) {
      notify('Số lượng bài lấy mẫu phải từ 1 bài trở lên.', 'error');
      return;
    }

    dispatch({
      type: 'CREATE_CROSS_REVIEW_BATCH',
      payload: {
        name: batchName.trim(),
        startDate,
        endDate,
        genreId: selectedGenreId === 'ALL' ? undefined : selectedGenreId,
        sampleSize,
        editorIds: selectedEditorIds,
        note: batchNote
      }
    });

    notify('Đã khởi tạo đợt chấm chéo và tự động phân bổ bài cho các BTV thành công!', 'success');
    setShowCreateModal(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <PageHeader
        breadcrumbs={[
          { label: 'Trang chủ', link: '/editor-lead/queue' },
          { label: 'Luồng 03 · Kiểm soát chất lượng' },
          { label: 'Thiết lập đợt chấm chéo' }
        ]}
        title="Thiết lập đợt chấm chéo kiểm chuẩn BTV"
        description="Lấy mẫu ngẫu nhiên bài viết đã xuất bản và giao cho BTV khác chấm lại mù độc lập nhằm đo lường độ lệch chuẩn và thiên lệch nhận thức của từng biên tập viên."
        actions={
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo đợt chấm chéo mới</span>
          </button>
        }
      />

      {/* Ghi chú bắt buộc nghiệp vụ */}
      <div className="bg-amber-50/90 border border-amber-200 rounded-3xl p-5 shadow-xs flex items-start gap-4">
        <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 font-black">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div className="space-y-1 text-xs text-amber-950">
          <h4 className="font-bold text-sm">
            Nguyên tắc bảo toàn điểm xuất bản & Nhuận bút:
          </h4>
          <p className="leading-relaxed">
            Chấm chéo là công cụ nghiệp vụ thống kê chuyên môn dành cho Trưởng ban để đo lường độ lệch người chấm (chấm chặt tay hay rộng tay).{' '}
            <strong className="font-extrabold underline text-amber-900">
              Chấm chéo tuyệt đối KHÔNG làm thay đổi điểm bài viết đã đăng và KHÔNG làm thay đổi nhuận bút đã duyệt.
            </strong>
          </p>
        </div>
      </div>

      {/* Danh sách các đợt chấm chéo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {state.crossReviewBatches.map(batch => {
          const isSelected = activeBatch?.id === batch.id;
          const assignments = state.crossReviewAssignments.filter(a => a.batch_id === batch.id);
          const completedCount = assignments.filter(a => a.status === 'COMPLETED').length;

          return (
            <div
              key={batch.id}
              onClick={() => setSelectedBatchId(batch.id)}
              className={`p-5 rounded-3xl border transition-all cursor-pointer space-y-3 ${
                isSelected
                  ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-200 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-100 text-blue-900">
                  {batch.status === 'IN_PROGRESS' ? 'Đang thực hiện' : 'Đã hoàn thành'}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">#{batch.id}</span>
              </div>

              <h4 className="font-bold text-slate-900 text-xs line-clamp-2 leading-snug">
                {batch.name}
              </h4>

              <div className="text-[11px] text-slate-500 space-y-1">
                <div>
                  Kỳ khảo sát: {formatDate(batch.start_date)} - {formatDate(batch.end_date)}
                </div>
                <div>
                  Mẫu: <strong>{batch.sample_size} bài</strong> • BTV tham gia:{' '}
                  <strong>{batch.participating_editor_ids.length} người</strong>
                </div>
              </div>

              {/* Thanh tiến độ */}
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                  <span>Tiến độ chấm:</span>
                  <span>
                    {completedCount} / {assignments.length || batch.sample_size} bài
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-blue-900 h-1.5 rounded-full transition-all"
                    style={{
                      width: `${
                        assignments.length > 0 ? (completedCount / assignments.length) * 100 : 0
                      }%`
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CHI TIẾT DANH SÁCH BÀI PHÂN CÔNG CHẤM CHÉO TRONG ĐỢT */}
      {activeBatch && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs space-y-0">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Shuffle className="w-4 h-4 text-blue-900" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Danh sách bài phân công chấm chéo: {activeBatch.name}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Mỗi bài viết được thuật toán giao ngẫu nhiên cho một BTV khác người chấm ban đầu.
              </p>
            </div>

            <Link
              to="/editor-lead/reviewer-deviation"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
            >
              <span>Xem báo cáo độ lệch BTV</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Tác phẩm khảo sát</th>
                  <th className="py-3 px-4 w-44">Người chấm gốc & Điểm</th>
                  <th className="py-3 px-4 w-44">BTV chấm chéo</th>
                  <th className="py-3 px-4 w-32 text-center">Điểm chấm chéo</th>
                  <th className="py-3 px-4 w-36 text-center">Độ lệch (Δ)</th>
                  <th className="py-3 px-4 w-36">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeAssignments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                      Chưa có phân công bài viết nào cho đợt chấm chéo này.
                    </td>
                  </tr>
                ) : (
                  activeAssignments.map(assign => {
                    const art = state.articles.find(a => a.id === assign.article_id);
                    const genre = getGenre(art?.category_id || art?.genre_id);
                    const originalScorer = getUser(assign.original_scorer_id);
                    const reviewer = getUser(assign.reviewer_id);

                    return (
                      <tr key={assign.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Tác phẩm */}
                        <td className="py-3.5 px-4 max-w-sm">
                          <div
                            onClick={() => navigate(`/articles/${assign.article_id}`)}
                            className="font-bold text-slate-900 hover:text-blue-700 cursor-pointer line-clamp-2 leading-snug"
                          >
                            {art?.title || 'Tác phẩm'}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1">
                            Thể loại: <strong className="text-slate-600">{genre?.name}</strong>
                          </div>
                        </td>

                        {/* Người chấm gốc */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800">
                            {originalScorer?.full_name || 'BTV gốc'}
                          </div>
                          <div className="text-[11px] font-black text-slate-900 mt-0.5">
                            Điểm gốc: {assign.original_score} đ
                          </div>
                        </td>

                        {/* BTV chấm chéo */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-blue-900">
                            {reviewer?.full_name || 'BTV chấm chéo'}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Chấm chéo độc lập
                          </div>
                        </td>

                        {/* Điểm chấm chéo */}
                        <td className="py-3.5 px-4 text-center">
                          {assign.reviewed_score !== undefined ? (
                            <span className="text-sm font-black text-slate-900">
                              {assign.reviewed_score} đ
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-xs">Đang chấm...</span>
                          )}
                        </td>

                        {/* Độ lệch */}
                        <td className="py-3.5 px-4 text-center">
                          {assign.deviation !== undefined ? (
                            <div
                              className={`inline-flex items-center gap-1 font-black text-xs px-2.5 py-1 rounded-full ${
                                assign.deviation > 5
                                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                  : assign.deviation < -5
                                  ? 'bg-rose-100 text-rose-900 border border-rose-300'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {assign.deviation > 0 ? (
                                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                              ) : assign.deviation < 0 ? (
                                <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                              ) : (
                                <Minus className="w-3.5 h-3.5 text-slate-400" />
                              )}
                              <span>
                                {assign.deviation > 0 ? `+${assign.deviation}` : assign.deviation} đ
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {/* Trạng thái */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {assign.status === 'COMPLETED' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Hoàn tất</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                              <span>Đang chấm</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL THIẾT LẬP ĐỢT CHẤM CHÉO MỚI */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                  Khởi tạo đợt kiểm chuẩn chất lượng
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Thiết lập đợt chấm chéo mới
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Tên đợt */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800">
                Tên đợt chấm chéo <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={batchName}
                onChange={e => setBatchName(e.target.value)}
                placeholder="VD: Đợt chấm chéo kiểm chuẩn Quý 4/2026..."
                className="w-full text-xs rounded-xl border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>

            {/* Khoảng thời gian */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">Từ ngày</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">Đến ngày</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>
            </div>

            {/* Thể loại & Số lượng mẫu */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">Chọn Thể loại</label>
                <select
                  value={selectedGenreId}
                  onChange={e => setSelectedGenreId(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-900"
                >
                  <option value="ALL">Tất cả thể loại</option>
                  {state.genres.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">Số bài lấy mẫu ngẫu nhiên</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={sampleSize}
                  onChange={e => setSampleSize(Number(e.target.value))}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>
            </div>

            {/* Danh sách BTV tham gia */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>Chọn các BTV tham gia chấm chéo:</span>
                <span className="text-[11px] text-blue-900 font-semibold">
                  (Đã chọn: {selectedEditorIds.length} BTV)
                </span>
              </label>

              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                {allEditors.map(editor => {
                  const isChecked = selectedEditorIds.includes(editor.id);
                  return (
                    <div
                      key={editor.id}
                      onClick={() => handleToggleEditor(editor.id)}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center gap-2 transition-all ${
                        isChecked
                          ? 'bg-blue-50/80 border-blue-500 shadow-2xs'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="rounded text-blue-900 focus:ring-blue-800 cursor-pointer"
                      />
                      <span className="font-semibold text-slate-900 truncate">
                        {editor.full_name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ghi chú */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800">Mục đích & Ghi chú đợt</label>
              <textarea
                rows={2}
                value={batchNote}
                onChange={e => setBatchNote(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>

            {/* Cam kết nghiệp vụ */}
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-[11px] text-amber-950 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>
                <strong>Nhắc nhở quan trọng:</strong> Hệ thống sẽ tự động gán ngẫu nhiên mỗi bài đã chọn cho một BTV khác người chấm ban đầu. Kết quả chấm chéo chỉ dùng để đo lường độ lệch, không làm thay đổi điểm đã xuất bản.
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                onClick={handleCreateBatch}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Shuffle className="w-4 h-4" />
                <span>Khởi tạo & Phân bổ ngẫu nhiên</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
