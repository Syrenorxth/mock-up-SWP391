import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/common/Header';
import { Modal } from '../../components/common/Modal';
import { CriterionItem, CriteriaSet, CriteriaSetStatus } from '../../types';
import {
  CheckSquare,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Lock,
  Layers,
  Sparkles,
  Info,
  Power
} from 'lucide-react';

interface FormCriterion {
  id: string;
  name: string;
  weight: number;
  description: string;
}

export const CriteriaSetsScreen: React.FC = () => {
  const { state, dispatch, notify, getGenre } = useApp();

  // Thể loại được chọn mặc định là Phóng sự hoặc thể loại đầu tiên
  const [selectedGenreId, setSelectedGenreId] = useState<string>(() => {
    const ps = state.genres.find(g => g.code === 'PHONG_SU');
    return ps ? ps.id : (state.genres[0]?.id || 'cat-phongsu');
  });

  // State cho Modal Tạo / Chỉnh sửa
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSet, setEditingSet] = useState<CriteriaSet | null>(null);
  const [versionNote, setVersionNote] = useState('');
  const [autoActivate, setAutoActivate] = useState(false);
  const [formCriteria, setFormCriteria] = useState<FormCriterion[]>([
    { id: 'crit-temp-1', name: '', weight: 25, description: '' },
    { id: 'crit-temp-2', name: '', weight: 25, description: '' },
    { id: 'crit-temp-3', name: '', weight: 25, description: '' },
    { id: 'crit-temp-4', name: '', weight: 25, description: '' }
  ]);

  const selectedGenre = getGenre(selectedGenreId);

  // Lấy các phiên bản của thể loại đang chọn
  const genreCriteriaSets = useMemo(() => {
    return state.criteriaSets
      .filter(cs => cs.genre_id === selectedGenreId)
      .sort((a, b) => b.version - a.version);
  }, [state.criteriaSets, selectedGenreId]);

  // Phiên bản ACTIVE hiện tại
  const activeVersion = useMemo(() => {
    return genreCriteriaSets.find(cs => cs.status === 'ACTIVE');
  }, [genreCriteriaSets]);

  // Validation tổng trọng số
  const { totalWeight, isValid, validationErrors } = useMemo(() => {
    const sum = formCriteria.reduce((acc, c) => acc + (Number(c.weight) || 0), 0);
    const errors: string[] = [];

    if (formCriteria.length < 2) {
      errors.push('Bộ tiêu chí cần có ít nhất 2 tiêu chí.');
    }

    formCriteria.forEach((c, idx) => {
      if (!c.name.trim()) {
        errors.push(`Tiêu chí #${idx + 1} chưa có tên tiêu chí.`);
      }
      if (Number(c.weight) <= 0) {
        errors.push(`Tiêu chí "${c.name || `#${idx + 1}`}" phải có trọng số > 0%.`);
      }
    });

    if (sum !== 100) {
      if (sum < 100) {
        errors.push(`Tổng trọng số hiện tại là ${sum}%, còn thiếu ${100 - sum}%.`);
      } else {
        errors.push(`Tổng trọng số hiện tại là ${sum}%, vượt quá ${sum - 100}%.`);
      }
    }

    return {
      totalWeight: sum,
      isValid: errors.length === 0,
      validationErrors: errors
    };
  }, [formCriteria]);

  // Mở modal tạo mới
  const handleOpenCreateModal = (baseSet?: CriteriaSet) => {
    setEditingSet(null);
    setVersionNote('');
    setAutoActivate(true);

    if (baseSet && baseSet.criteria && baseSet.criteria.length > 0) {
      // Nhân bản từ bộ tiêu chí mẫu
      setFormCriteria(
        baseSet.criteria.map((c, i) => ({
          id: `crit-clone-${Date.now()}-${i}`,
          name: c.name,
          weight: c.weight,
          description: c.description || ''
        }))
      );
      setVersionNote(`Phát triển từ Phiên bản ${baseSet.version}`);
    } else {
      // Mẫu chuẩn 4 tiêu chí
      setFormCriteria([
        { id: `crit-${Date.now()}-1`, name: 'Tính thời sự, giá trị thông tin', weight: 25, description: '' },
        { id: `crit-${Date.now()}-2`, name: 'Độ chính xác, có nguồn đối chứng', weight: 25, description: '' },
        { id: `crit-${Date.now()}-3`, name: 'Chiều sâu, góc nhìn riêng', weight: 25, description: '' },
        { id: `crit-${Date.now()}-4`, name: 'Bố cục, ngôn ngữ & ảnh minh họa', weight: 25, description: '' }
      ]);
    }

    setModalOpen(true);
  };

  // Mở modal chỉnh sửa (chỉ cho bản DRAFT chưa dùng)
  const handleOpenEditModal = (set: CriteriaSet) => {
    if (set.used_count > 0) {
      notify('Phiên bản này đã dùng để chấm bài viết. Quy tắc nghiệp vụ không cho sửa, vui lòng tạo phiên bản mới.', 'warning');
      return;
    }
    setEditingSet(set);
    setVersionNote(set.note || '');
    setAutoActivate(set.status === 'ACTIVE');
    setFormCriteria(
      set.criteria.map(c => ({
        id: c.id,
        name: c.name,
        weight: c.weight,
        description: c.description || ''
      }))
    );
    setModalOpen(true);
  };

  const handleAddCriterion = () => {
    setFormCriteria(prev => [
      ...prev,
      {
        id: `crit-${Date.now()}-${prev.length + 1}`,
        name: '',
        weight: 10,
        description: ''
      }
    ]);
  };

  const handleRemoveCriterion = (id: string) => {
    if (formCriteria.length <= 2) {
      notify('Bộ tiêu chí cần có ít nhất 2 tiêu chí.', 'warning');
      return;
    }
    setFormCriteria(prev => prev.filter(c => c.id !== id));
  };

  const handleCriterionChange = (id: string, field: keyof FormCriterion, value: any) => {
    setFormCriteria(prev =>
      prev.map(c => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleSaveCriteriaSet = () => {
    if (!isValid) {
      notify('Vui lòng kiểm tra lại trọng số và thông tin tiêu chí (tổng phải bằng đúng 100%)', 'error');
      return;
    }

    const cleanedCriteria: CriterionItem[] = formCriteria.map(c => ({
      id: c.id,
      name: c.name.trim(),
      weight: Number(c.weight),
      description: c.description?.trim() || undefined
    }));

    if (editingSet) {
      // Cập nhật phiên bản DRAFT đang sửa
      dispatch({
        type: 'UPDATE_CRITERIA_SET',
        payload: {
          id: editingSet.id,
          criteria: cleanedCriteria,
          note: versionNote.trim()
        }
      });
      if (autoActivate && editingSet.status !== 'ACTIVE') {
        dispatch({
          type: 'ACTIVATE_CRITERIA_SET_VERSION',
          payload: { criteriaSetId: editingSet.id }
        });
      }
      notify(`Đã cập nhật Phiên bản ${editingSet.version} thành công!`, 'success');
    } else {
      // Tạo phiên bản mới
      dispatch({
        type: 'CREATE_CRITERIA_SET_VERSION',
        payload: {
          genreId: selectedGenreId,
          criteria: cleanedCriteria,
          note: versionNote.trim() || undefined,
          autoActivate
        }
      });
      notify(`Đã tạo mới phiên bản bộ tiêu chí cho thể loại ${selectedGenre?.name}!`, 'success');
    }

    setModalOpen(false);
  };

  const handleActivateVersion = (set: CriteriaSet) => {
    dispatch({
      type: 'ACTIVATE_CRITERIA_SET_VERSION',
      payload: { criteriaSetId: set.id }
    });
    notify(`Đã kích hoạt Phiên bản ${set.version} làm bộ tiêu chí hiện hành!`, 'success');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <PageHeader
        breadcrumbs={[
          { label: 'Quản trị hệ thống', link: '/admin/parameters/intake' },
          { label: 'Bộ tiêu chí theo thể loại' }
        ]}
        title="Bộ tiêu chí chấm chất lượng theo thể loại"
        description="Mỗi thể loại báo chí có 1 bộ tiêu chí dùng chung toàn tòa soạn (thang 100 điểm, tổng trọng số các tiêu chí = 100%). Quản lý theo phiên bản có lịch sử."
        actions={
          <button
            type="button"
            onClick={() => handleOpenCreateModal(activeVersion)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-900 text-white hover:bg-blue-800 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo phiên bản mới cho {selectedGenre?.name}</span>
          </button>
        }
      />

      {/* Tabs danh sách thể loại */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-xs">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-thin">
          {state.genres.map(g => {
            const isSelected = g.id === selectedGenreId;
            const sets = state.criteriaSets.filter(cs => cs.genre_id === g.id);
            const activeCs = sets.find(cs => cs.status === 'ACTIVE');

            return (
              <button
                key={g.id}
                type="button"
                onClick={() => setSelectedGenreId(g.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>{g.name}</span>
                {activeCs && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      isSelected
                        ? 'bg-blue-800 text-blue-100'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    v{activeCs.version}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Thông tin thể loại đang chọn */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h3 className="text-base font-bold text-slate-900">{selectedGenre?.name}</h3>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
              Nhóm NĐ 18: Nhóm {selectedGenre?.nd_group}
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-800">
              Khung hệ số: {selectedGenre?.base_factor} - {selectedGenre?.max_factor}
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            {selectedGenre?.description || 'Bộ tiêu chí đánh giá chất lượng tác phẩm phục vụ thẩm định và phân loại nhuận bút (Luồng 02 & 04).'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <div className="text-[11px] text-slate-400 font-medium">Phiên bản đang áp dụng</div>
            <div className="text-xs font-bold text-emerald-800 flex items-center justify-end gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-700 inline-block animate-pulse" />
              <span>{activeVersion ? `Phiên bản #${activeVersion.version}` : 'Chưa có bản ACTIVE'}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleOpenCreateModal(activeVersion)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-blue-50 text-blue-900 hover:bg-blue-100 transition-colors border border-blue-200 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tạo bản mới</span>
          </button>
        </div>
      </div>

      {/* Danh sách các phiên bản của thể loại này */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-900" />
            <span>Lịch sử các phiên bản bộ tiêu chí ({genreCriteriaSets.length})</span>
          </h4>
          <span className="text-xs text-slate-400">
            * Mỗi tiêu chí chấm điểm từ 0 đến 100 điểm. Trọng số quy định tỷ lệ đóng góp vào tổng điểm.
          </span>
        </div>

        {genreCriteriaSets.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
            <h5 className="text-sm font-bold text-slate-800">Chưa có bộ tiêu chí nào cho thể loại này</h5>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Hãy bấm nút bên dưới để tạo phiên bản đầu tiên với tổng trọng số các tiêu chí bằng đúng 100%.
            </p>
            <button
              type="button"
              onClick={() => handleOpenCreateModal()}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-900 text-white hover:bg-blue-800 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo phiên bản 1</span>
            </button>
          </div>
        ) : (
          genreCriteriaSets.map(cs => {
            const isActive = cs.status === 'ACTIVE';
            const isDraft = cs.status === 'DRAFT';
            const isRetired = cs.status === 'RETIRED';
            const isUsed = (cs.used_count || 0) > 0;

            let statusBadge = (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                Đã ngừng áp dụng (RETIRED)
              </span>
            );
            if (isActive) {
              statusBadge = (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-700" />
                  Đang áp dụng (ACTIVE)
                </span>
              );
            } else if (isDraft) {
              statusBadge = (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  Bản nháp (DRAFT)
                </span>
              );
            }

            return (
              <div
                key={cs.id}
                className={`bg-white rounded-2xl border transition-all ${
                  isActive
                    ? 'border-emerald-300 ring-2 ring-emerald-500/10 shadow-xs'
                    : 'border-slate-200 shadow-2xs'
                }`}
              >
                {/* Header của thẻ phiên bản */}
                <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/40 rounded-t-2xl">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">
                        Phiên bản #{cs.version}
                      </span>
                      {statusBadge}
                    </div>

                    <div className="text-xs text-slate-500 flex items-center gap-2">
                      <span>•</span>
                      <span>Ngày tạo: {cs.created_at}</span>
                      <span>•</span>
                      <span className="font-semibold text-slate-700">
                        Đã dùng chấm: <strong className="text-blue-900">{cs.used_count || 0}</strong> bài
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Nút Kích hoạt */}
                    {!isActive && (
                      <button
                        type="button"
                        onClick={() => handleActivateVersion(cs)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 transition-colors cursor-pointer"
                        title="Kích hoạt phiên bản này làm bộ tiêu chí ACTIVE của thể loại"
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>Kích hoạt</span>
                      </button>
                    )}

                    {/* Nút Sửa: Chỉ cho phép sửa khi DRAFT và chưa dùng */}
                    {isUsed ? (
                      <div
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-semibold bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                        title="Phiên bản này đã dùng để chấm điểm thực tế. Không thể chỉnh sửa, chỉ có thể tạo phiên bản mới."
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Đã dùng – chỉ tạo phiên bản mới</span>
                      </div>
                    ) : isDraft ? (
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(cs)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-700 hover:bg-slate-100 border border-slate-300 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Chỉnh sửa</span>
                      </button>
                    ) : null}

                    {/* Nút Nhân bản tạo bản mới từ bản này */}
                    <button
                      type="button"
                      onClick={() => handleOpenCreateModal(cs)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white text-blue-900 hover:bg-blue-50 border border-blue-200 transition-colors cursor-pointer"
                      title="Tạo phiên bản mới sao chép các tiêu chí từ bản này"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Nhân bản</span>
                    </button>
                  </div>
                </div>

                {/* Ghi chú phiên bản nếu có */}
                {cs.note && (
                  <div className="px-5 pt-3 text-xs text-slate-500 italic">
                    Ghi chú: {cs.note}
                  </div>
                )}

                {/* Bảng các tiêu chí */}
                <div className="p-5 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 text-[11px] uppercase tracking-wider">
                        <th className="py-2.5 px-3 w-12 text-center">STT</th>
                        <th className="py-2.5 px-3">Tên tiêu chí đánh giá</th>
                        <th className="py-2.5 px-3">Mô tả / Chuẩn mực thẩm định</th>
                        <th className="py-2.5 px-3 w-28 text-center">Trọng số %</th>
                        <th className="py-2.5 px-3 w-28 text-center">Thang điểm</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {cs.criteria.map((cr, idx) => (
                        <tr key={cr.id || idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-3 text-center font-bold text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-900">
                            {cr.name}
                          </td>
                          <td className="py-3 px-3 text-slate-600 text-[11px] leading-relaxed">
                            {cr.description || '—'}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-extrabold bg-blue-50 text-blue-900 border border-blue-200">
                              {cr.weight}%
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center text-slate-500 font-medium">
                            0 – 100 điểm
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-200 bg-slate-50/60 font-bold text-slate-900">
                        <td colSpan={3} className="py-3 px-3 text-right uppercase text-[11px] tracking-wider text-slate-600">
                          Tổng cộng trọng số ({cs.criteria.length} tiêu chí):
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-block px-3 py-1 rounded-lg text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                            {cs.criteria.reduce((sum, c) => sum + (c.weight || 0), 0)}%
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center text-slate-500 text-[11px]">
                          Thang 100
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Tạo / Chỉnh sửa phiên bản bộ tiêu chí */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          editingSet
            ? `Chỉnh sửa Bộ tiêu chí ${selectedGenre?.name} (Phiên bản #${editingSet.version})`
            : `Tạo phiên bản mới Bộ tiêu chí: ${selectedGenre?.name}`
        }
        maxWidth="3xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="text-xs">
              {isValid ? (
                <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Trọng số hợp lệ (Tổng: 100%)
                </span>
              ) : (
                <span className="text-rose-600 font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  Chưa hợp lệ ({totalWeight}% / 100%)
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 border border-slate-300 text-xs font-semibold rounded-xl text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSaveCriteriaSet}
                disabled={!isValid}
                className="flex items-center gap-1.5 px-5 py-2 bg-blue-900 text-white text-xs font-bold rounded-xl hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all cursor-pointer"
              >
                <CheckSquare className="w-4 h-4" />
                <span>{editingSet ? 'Cập nhật phiên bản' : 'Lưu & Khởi tạo phiên bản'}</span>
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-5">
          {/* Thông tin đầu vào */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Thể loại áp dụng</label>
              <div className="text-xs font-bold text-slate-900 px-3 py-2 rounded-lg bg-white border border-slate-200">
                {selectedGenre?.name}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ghi chú phiên bản</label>
              <input
                type="text"
                value={versionNote}
                onChange={e => setVersionNote(e.target.value)}
                placeholder="Ví dụ: Cập nhật tiêu chí chấm ảnh báo chí và nguồn tin..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Danh sách tiêu chí động */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span>Danh sách tiêu chí đánh giá ({formCriteria.length})</span>
                <span className="text-rose-500">*</span>
              </label>

              <button
                type="button"
                onClick={handleAddCriterion}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-900 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm tiêu chí</span>
              </button>
            </div>

            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {formCriteria.map((criterion, idx) => (
                <div
                  key={criterion.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all space-y-2 shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>

                    <input
                      type="text"
                      placeholder="Nhập tên tiêu chí (ví dụ: Độ chính xác, có nguồn đối chứng...)"
                      value={criterion.name}
                      onChange={e => handleCriterionChange(criterion.id, 'name', e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />

                    <div className="flex items-center gap-1.5 shrink-0">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        placeholder="%"
                        value={criterion.weight || ''}
                        onChange={e =>
                          handleCriterionChange(criterion.id, 'weight', Math.max(0, Number(e.target.value)))
                        }
                        className="w-18 px-2.5 py-1.5 text-xs text-center font-bold rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                      <span className="text-xs font-bold text-slate-500">%</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveCriterion(criterion.id)}
                      disabled={formCriteria.length <= 2}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      title="Xóa tiêu chí này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="Mô tả tiêu chuẩn chấm điểm (tùy chọn)..."
                    value={criterion.description}
                    onChange={e => handleCriterionChange(criterion.id, 'description', e.target.value)}
                    className="w-full px-3 py-1.5 text-[11px] text-slate-600 rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Thanh cảnh báo kiểm tra tổng trọng số */}
          <div
            className={`p-4 rounded-xl border text-xs leading-relaxed space-y-1 ${
              isValid
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-rose-50 border-rose-300 text-rose-900'
            }`}
          >
            <div className="flex items-center justify-between font-bold">
              <span className="flex items-center gap-1.5">
                {isValid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                )}
                Tổng trọng số các tiêu chí: {totalWeight}% / 100%
              </span>
              <span className="text-[11px] font-semibold">
                {isValid ? 'Đủ điều kiện lưu' : 'Chưa thể lưu'}
              </span>
            </div>

            {validationErrors.length > 0 && (
              <ul className="list-disc pl-5 space-y-0.5 text-[11px] pt-1">
                {validationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            )}
          </div>

          {/* Tùy chọn kích hoạt */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="chk-auto-activate"
              checked={autoActivate}
              onChange={e => setAutoActivate(e.target.checked)}
              className="rounded border-slate-300 text-blue-900 focus:ring-blue-600 cursor-pointer"
            />
            <label htmlFor="chk-auto-activate" className="text-xs font-semibold text-slate-700 cursor-pointer">
              Kích hoạt áp dụng ngay phiên bản này (phiên bản đang ACTIVE trước đó sẽ chuyển thành RETIRED)
            </label>
          </div>
        </div>
      </Modal>
    </div>
  );
};
