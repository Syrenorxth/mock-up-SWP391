import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/common/Header';
import { Modal } from '../../components/common/Modal';
import { Genre } from '../../types';
import {
  FolderTree,
  Plus,
  Edit2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  PowerOff,
  Power
} from 'lucide-react';

export const GenresConfigScreen: React.FC = () => {
  const { state, dispatch, notify } = useApp();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingGenre, setEditingGenre] = useState<Genre | null>(null);

  const [ndGroup, setNdGroup] = useState<number>(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [baseFactor, setBaseFactor] = useState<number>(5);
  const [maxFactor, setMaxFactor] = useState<number>(10);
  const [isActive, setIsActive] = useState(true);
  const [validationError, setValidationError] = useState('');

  const handleOpenAdd = () => {
    setEditingGenre(null);
    setNdGroup(1);
    setName('');
    setDescription('');
    setBaseFactor(5);
    setMaxFactor(10);
    setIsActive(true);
    setValidationError('');
    setModalOpen(true);
  };

  const handleOpenEdit = (genre: Genre) => {
    setEditingGenre(genre);
    setNdGroup(genre.nd_group || 1);
    setName(genre.name);
    setDescription(genre.description || '');
    setBaseFactor(genre.base_factor ?? genre.min_factor ?? 5);
    setMaxFactor(genre.max_factor ?? 10);
    setIsActive(genre.is_active);
    setValidationError('');
    setModalOpen(true);
  };

  const handleToggleStatus = (genre: Genre) => {
    const updated: Genre = {
      ...genre,
      is_active: !genre.is_active,
      updated_at: new Date().toISOString().split('T')[0]
    };
    dispatch({
      type: 'UPDATE_GENRE',
      payload: updated
    });
    notify(
      `Đã ${updated.is_active ? 'kích hoạt sử dụng' : 'ngưng dùng'} thể loại "${genre.name}"!`,
      updated.is_active ? 'success' : 'info'
    );
  };

  const handleSaveGenre = () => {
    setValidationError('');
    if (!name.trim()) {
      setValidationError('Vui lòng nhập tên thể loại.');
      return;
    }

    if (baseFactor <= 0 || maxFactor <= 0) {
      setValidationError('Hệ số chuẩn và hệ số tối đa phải lớn hơn 0.');
      return;
    }

    // Bắt buộc kiểm tra base_factor <= max_factor
    if (baseFactor > maxFactor) {
      setValidationError(
        `Lỗi ràng buộc: Hệ số chuẩn (${baseFactor}) phải nhỏ hơn hoặc bằng Hệ số tối đa (${maxFactor}) theo NĐ 18/2014!`
      );
      return;
    }

    const payload: Genre = {
      id: editingGenre?.id || `cat-${Date.now()}`,
      code: editingGenre?.code || 'THE_LOAI_' + Date.now(),
      nd_group: Number(ndGroup) || 1,
      name: name.trim(),
      description: description.trim(),
      base_factor: Number(baseFactor),
      min_factor: Number(baseFactor),
      max_factor: Number(maxFactor),
      is_active: isActive,
      created_at: editingGenre?.created_at || new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString().split('T')[0]
    };

    dispatch({
      type: 'UPDATE_GENRE',
      payload
    });

    notify(
      editingGenre
        ? `Đã cập nhật thể loại "${name}" thành công!`
        : `Đã thêm thể loại "${name}" mới vào danh mục!`,
      'success'
    );
    setModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      <PageHeader
        breadcrumbs={[
          { label: 'Quản trị', link: '/admin/parameters' },
          { label: 'Thể loại & Khung hệ số' }
        ]}
        title="Quản lý Thể loại bài viết & Khung hệ số nhuận bút"
        description="Bảng danh mục 9 thể loại theo Nghị định 18/2014/NĐ-CP: Hệ số chuẩn (base_factor do tòa soạn tự đặt) và Hệ số tối đa (max_factor theo khung quy định)."
        actions={
          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-900 text-white text-xs font-bold hover:bg-blue-800 transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm thể loại mới</span>
          </button>
        }
      />

      {/* Banner ghi chú */}
      <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 text-xs text-blue-950 flex items-start gap-3">
        <Info className="w-4 h-4 text-blue-800 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Nguyên tắc định mức hệ số:</strong> Hệ số chuẩn (base_factor) là mức hệ số khởi điểm áp dụng cho thể loại khi chất lượng đạt tối đa (100% chất lượng), nhân với bậc điểm hiệu lực. Thư ký tòa soạn có quyền nâng hệ số khi chấm nhuận bút nhưng không bao giờ được vượt quá Hệ số tối đa (max_factor) theo Nghị định 18/2014.
        </div>
      </div>

      {/* Genres Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4 w-28 text-center">Nhóm NĐ</th>
                <th className="py-3 px-4">Tên thể loại</th>
                <th className="py-3 px-4">Mô tả đặc trưng</th>
                <th className="py-3 px-4 text-center w-40">
                  <div>Hệ số chuẩn (base)</div>
                  <div className="text-[9px] font-normal text-slate-400 normal-case">[nhóm tự đặt]</div>
                </th>
                <th className="py-3 px-4 text-center w-40">
                  <div>Hệ số tối đa (max)</div>
                  <div className="text-[9px] font-normal text-slate-400 normal-case">[theo NĐ 18/2014]</div>
                </th>
                <th className="py-3 px-4 text-center w-36">Trạng thái</th>
                <th className="py-3 px-4 text-right w-36">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state.genres.map(genre => (
                <tr
                  key={genre.id}
                  className={`hover:bg-slate-50 transition-colors ${
                    !genre.is_active ? 'opacity-60 bg-slate-50/50' : ''
                  }`}
                >
                  {/* Nhóm NĐ */}
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-block px-2.5 py-0.5 rounded-full font-black text-xs bg-slate-100 text-slate-800 border border-slate-200">
                      Nhóm {genre.nd_group || 1}
                    </span>
                  </td>

                  {/* Tên thể loại */}
                  <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                    <div className="text-xs">{genre.name}</div>
                    <div className="text-[10px] font-mono text-slate-400 font-normal">
                      {genre.code}
                    </div>
                  </td>

                  {/* Mô tả */}
                  <td className="py-3.5 px-4 max-w-xs text-slate-600">
                    {genre.description || '—'}
                  </td>

                  {/* base_factor */}
                  <td className="py-3.5 px-4 text-center">
                    <span className="text-sm font-black text-slate-900 px-2 py-0.5 rounded-lg bg-blue-50 text-blue-900 border border-blue-200">
                      {genre.base_factor ?? genre.min_factor ?? 0}
                    </span>
                  </td>

                  {/* max_factor */}
                  <td className="py-3.5 px-4 text-center">
                    <span className="text-sm font-black text-purple-900 px-2 py-0.5 rounded-lg bg-purple-50 text-purple-900 border border-purple-200">
                      {genre.max_factor ?? 0}
                    </span>
                  </td>

                  {/* Trạng thái */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    {genre.is_active ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Đang áp dụng
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                        <XCircle className="w-3 h-3 text-slate-400" />
                        Ngưng dùng
                      </span>
                    )}
                  </td>

                  {/* Thao tác */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(genre)}
                        className={`p-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                          genre.is_active
                            ? 'border-slate-200 text-slate-600 hover:text-amber-700 hover:bg-amber-50'
                            : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                        }`}
                        title={genre.is_active ? 'Ngưng dùng thể loại' : 'Bật lại thể loại'}
                      >
                        {genre.is_active ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEdit(genre)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-900 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Chỉnh sửa thể loại & khung hệ số"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Thêm / Chỉnh sửa thể loại */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingGenre ? `Chỉnh sửa: ${editingGenre.name}` : 'Thêm thể loại mới'}
        maxWidth="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 border border-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-100 cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleSaveGenre}
              className="px-4 py-2 bg-blue-900 text-white text-xs font-bold rounded-xl hover:bg-blue-800 transition-colors cursor-pointer"
            >
              Lưu thay đổi
            </button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          {validationError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-800">Nhóm NĐ 18/2014</label>
              <input
                type="number"
                min="1"
                max="8"
                value={ndGroup}
                onChange={e => setNdGroup(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-900 font-bold"
              />
            </div>

            <div className="col-span-2 space-y-1">
              <label className="font-bold text-slate-800">
                Tên thể loại <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="VD: Phóng sự, Bình luận..."
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-900"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-800">Mô tả đặc trưng</label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Mô tả phạm vi và yêu cầu thể loại..."
              className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="space-y-1">
              <label className="font-bold text-slate-800">
                Hệ số chuẩn (base_factor)
                <span className="block text-[10px] text-slate-400 font-normal">[nhóm tự đặt]</span>
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={baseFactor}
                onChange={e => setBaseFactor(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-black text-blue-900 focus:ring-2 focus:ring-blue-900 bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-800">
                Hệ số tối đa (max_factor)
                <span className="block text-[10px] text-slate-400 font-normal">[theo NĐ 18/2014]</span>
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                value={maxFactor}
                onChange={e => setMaxFactor(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-black text-purple-900 focus:ring-2 focus:ring-blue-900 bg-white"
              />
            </div>

            <div className="col-span-2 text-[11px] text-slate-500 italic">
              Ràng buộc bắt buộc: base_factor ≤ max_factor.
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="genre_is_active"
              checked={isActive}
              onChange={e => setIsActive(e.target.checked)}
              className="rounded text-blue-900 focus:ring-blue-800 cursor-pointer"
            />
            <label htmlFor="genre_is_active" className="font-semibold text-slate-800 cursor-pointer">
              Áp dụng thể loại này trong hệ thống
            </label>
          </div>
        </div>
      </Modal>
    </div>
  );
};
