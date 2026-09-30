import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/common/Header';
import { Modal } from '../../components/common/Modal';
import { MediaFactor, MediaKind } from '../../types';
import {
  Image,
  Video,
  FileSpreadsheet,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldCheck,
  Save,
  RotateCcw
} from 'lucide-react';

interface MediaFactorMeta {
  kind: MediaKind;
  name: string;
  ndGroup: string;
  ndLimit: number;
  description: string;
  isEditable: boolean;
}

const MEDIA_METAS: Record<MediaKind, MediaFactorMeta> = {
  ANH_TU_CHUP: {
    kind: 'ANH_TU_CHUP',
    name: 'Ảnh tự chụp',
    ndGroup: 'Nhóm 3 (NĐ 18/2014)',
    ndLimit: 10,
    description: 'Ảnh hiện trường, ảnh thời sự, ảnh phóng sự do phóng viên tự chụp tác nghiệp (kiểm tra dHash đạt MỚI 100%).',
    isEditable: true
  },
  TRANH_TU_VE: {
    kind: 'TRANH_TU_VE',
    name: 'Tranh, minh họa tự vẽ',
    ndGroup: 'Nhóm 2 (NĐ 18/2014)',
    ndLimit: 10,
    description: 'Tranh biếm họa, đồ họa minh họa tác phẩm hoặc bản vẽ do phóng viên/họa sĩ tự sáng tác.',
    isEditable: true
  },
  VIDEO_TU_QUAY: {
    kind: 'VIDEO_TU_QUAY',
    name: 'Video tự quay',
    ndGroup: 'Nhóm 8 (NĐ 18/2014)',
    ndLimit: 50,
    description: 'Video clip phóng sự, phóng sự điều tra, phỏng vấn độc quyền tự quay dựng tại hiện trường.',
    isEditable: true
  },
  NGUON_NGOAI: {
    kind: 'NGUON_NGOAI',
    name: 'Ảnh nguồn ngoài / Tái sử dụng',
    ndGroup: 'Không thuộc NĐ 18/2014',
    ndLimit: 0,
    description: 'Ảnh lưu trữ tư liệu, ảnh tái sử dụng hoặc ảnh trích dẫn nguồn báo ngoài (Cố định 0 hệ số).',
    isEditable: false
  }
};

export const MediaFactorsScreen: React.FC = () => {
  const { state, dispatch, notify } = useApp();

  const [editingItem, setEditingItem] = useState<MediaFactor | null>(null);
  const [editFactor, setEditFactor] = useState<number>(3);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  const handleOpenEdit = (item: MediaFactor) => {
    const meta = MEDIA_METAS[item.kind];
    if (!meta.isEditable) {
      notify('Hạng mục Nguồn ngoài / Tái sử dụng cố định 0 hệ số theo quy định.', 'info');
      return;
    }
    setEditingItem(item);
    setEditFactor(item.factor_per_item);
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleSaveFactor = () => {
    if (!editingItem) return;
    const meta = MEDIA_METAS[editingItem.kind];

    if (editFactor < 0) {
      setErrorMsg('Hệ số không được âm.');
      return;
    }

    if (editFactor > meta.ndLimit) {
      setErrorMsg(
        `Lỗi ràng buộc NĐ 18/2014: Hệ số ${meta.name} không được vượt quá giới hạn tối đa ${meta.ndLimit}!`
      );
      return;
    }

    const updatedList: MediaFactor[] = state.mediaFactors.map(f => {
      if (f.kind === editingItem.kind) {
        return {
          ...f,
          factor_per_item: Number(editFactor)
        };
      }
      return f;
    });

    dispatch({
      type: 'UPDATE_MEDIA_FACTORS',
      payload: { mediaFactors: updatedList }
    });

    notify(`Đã cập nhật hệ số cho "${meta.name}" thành công: ${editFactor} hệ số!`, 'success');
    setModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      <PageHeader
        breadcrumbs={[
          { label: 'Quản trị', link: '/admin/parameters' },
          { label: 'Hệ số ảnh/video' }
        ]}
        title="Quản lý Hệ số Nhuận bút Media (Ảnh & Video)"
        description="Bảng định mức 4 loại media theo Nghị định 18/2014/NĐ-CP: Hệ số được áp dụng trực tiếp cho từng tệp media hợp lệ và không vượt quá giới hạn tối đa của Nghị định."
      />

      {/* Banner ghi chú */}
      <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 text-xs text-blue-950 flex items-start gap-3">
        <Info className="w-4 h-4 text-blue-800 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Nguyên tắc chi trả nhuận bút Media:</strong>
          <ul className="list-disc list-inside mt-1 space-y-0.5">
            <li>Nhuận bút ảnh/video = Hệ số cố định theo loại × Đơn giá hiệu lực tại ngày đăng.</li>
            <li>Tiền ảnh/video trả đích danh cho người thực hiện media (tác giả ảnh/video).</li>
            <li>Không nhân bậc điểm chất lượng, không chịu giảm trừ bão hòa và không phân chia theo tỷ lệ đồng tác giả bài viết.</li>
            <li>Ảnh/video tái sử dụng từ kho dữ liệu hoặc trích dẫn nguồn ngoài tính 0 đồng.</li>
          </ul>
        </div>
      </div>

      {/* Media Factors Table (4 Rows) */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">STT</th>
                <th className="py-3.5 px-4 w-52">Loại Media</th>
                <th className="py-3.5 px-4 w-44">Căn cứ NĐ 18/2014</th>
                <th className="py-3.5 px-4 text-center w-36">
                  <div>Hệ số áp dụng</div>
                  <div className="text-[9px] font-normal text-slate-400 normal-case">[Tòa soạn ban hành]</div>
                </th>
                <th className="py-3.5 px-4 text-center w-36">
                  <div>Giới hạn NĐ</div>
                  <div className="text-[9px] font-normal text-slate-400 normal-case">[Khung tối đa]</div>
                </th>
                <th className="py-3.5 px-4">Quy định thẩm định</th>
                <th className="py-3.5 px-4 text-right w-28">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state.mediaFactors.map((item, idx) => {
                const meta = MEDIA_METAS[item.kind] || {
                  name: item.label,
                  ndGroup: 'NĐ 18/2014',
                  ndLimit: 10,
                  description: item.nd_limit_note,
                  isEditable: item.kind !== 'NGUON_NGOAI'
                };

                return (
                  <tr key={item.kind} className="hover:bg-slate-50 transition-colors">
                    {/* STT */}
                    <td className="py-4 px-4 text-center font-bold text-slate-400">
                      {idx + 1}
                    </td>

                    {/* Loại media */}
                    <td className="py-4 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        {item.kind === 'VIDEO_TU_QUAY' ? (
                          <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-900 flex items-center justify-center shrink-0">
                            <Video className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-900 flex items-center justify-center shrink-0">
                            <Image className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <div className="text-xs">{meta.name}</div>
                          <div className="text-[10px] font-mono text-slate-400 font-normal">
                            {item.kind}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Căn cứ NĐ */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="inline-block px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-slate-100 text-slate-700 border border-slate-200">
                        {meta.ndGroup}
                      </span>
                    </td>

                    {/* Hệ số áp dụng */}
                    <td className="py-4 px-4 text-center">
                      <span
                        className={`text-base font-black px-3 py-1 rounded-xl border ${
                          item.factor_per_item > 0
                            ? 'bg-blue-50 text-blue-900 border-blue-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        {item.factor_per_item}
                      </span>
                    </td>

                    {/* Giới hạn NĐ */}
                    <td className="py-4 px-4 text-center">
                      <span className="text-xs font-extrabold text-slate-600 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200">
                        {meta.ndLimit > 0 ? `Tối đa ${meta.ndLimit}` : 'Cố định 0'}
                      </span>
                    </td>

                    {/* Mô tả */}
                    <td className="py-4 px-4 text-slate-600 text-[11px] leading-relaxed">
                      {meta.description}
                    </td>

                    {/* Thao tác */}
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      {meta.isEditable ? (
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:text-blue-900 hover:bg-slate-100 transition-colors cursor-pointer font-bold text-xs shadow-2xs"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Sửa</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 italic text-[11px] px-2 py-1">
                          Cố định
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Chỉnh sửa Hệ số */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Chỉnh sửa hệ số: ${editingItem ? MEDIA_METAS[editingItem.kind]?.name : ''}`}
        maxWidth="sm"
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
              onClick={handleSaveFactor}
              className="px-4 py-2 bg-blue-900 text-white text-xs font-bold rounded-xl hover:bg-blue-800 transition-colors cursor-pointer"
            >
              Lưu thay đổi
            </button>
          </>
        }
      >
        {editingItem && (
          <div className="space-y-4 text-xs">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="text-[11px] text-slate-500">Quy định giới hạn:</div>
              <div className="font-bold text-slate-900">
                {MEDIA_METAS[editingItem.kind]?.ndGroup} - Tối đa:{' '}
                <span className="text-purple-900 font-black">
                  {MEDIA_METAS[editingItem.kind]?.ndLimit} hệ số
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-800">
                Hệ số áp dụng cho 1 tệp media <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                max={MEDIA_METAS[editingItem.kind]?.ndLimit}
                step="0.5"
                value={editFactor}
                onChange={e => setEditFactor(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-black text-blue-900 text-sm focus:ring-2 focus:ring-blue-900"
              />
              <p className="text-[11px] text-slate-500">
                Lưu ý: Hệ số không được vượt quá {MEDIA_METAS[editingItem.kind]?.ndLimit} theo Nghị định 18/2014.
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
