import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/common/Header';
import { Modal } from '../../components/common/Modal';
import { SystemParameter } from '../../types';
import { IntakeParametersScreen } from './IntakeParametersScreen';
import {
  Sliders,
  Edit2,
  Save,
  CheckCircle2,
  AlertCircle,
  Info,
  Layers,
  Filter,
  Search,
  BookOpen,
  FolderTree,
  DollarSign,
  Image as ImageIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Định nghĩa nguồn quy định: [NĐ] theo nghị định hoặc [nhóm] do nhóm tự đặt
const PARAM_LEGAL_SOURCE: Record<string, { type: 'ND' | 'NHOM'; note: string }> = {
  MINIMUM_FACTOR: { type: 'ND', note: 'Nghị định 18/2014/NĐ-CP (Hệ số sàn tối thiểu = 1)' },
  PAYMENT_DEADLINE_DAYS: { type: 'ND', note: 'Nghị định 18/2014/NĐ-CP (Thời hạn chi trả tối đa không quá 60 ngày)' },
  PAYMENT_WARNING_DAYS: { type: 'NHOM', note: 'Quy chế vận hành tòa soạn (Cảnh báo trước 15 ngày)' },
  ROUNDING_UNIT: { type: 'NHOM', note: 'Quy tắc làm tròn xuống 1.000đ, tiền lẻ bù cho tác giả chính' },
  MAX_AUTHORS_PER_ARTICLE: { type: 'NHOM', note: 'Quy định nội bộ về nhóm tác giả' },
  CO_AUTHOR_CONFIRM_DEADLINE_DAYS: { type: 'NHOM', note: 'Thời hạn đồng tác giả xác nhận trước khi hủy tự động' },
  CONTENT_DUPLICATION_WARN_THRESHOLD: { type: 'NHOM', note: 'Ngưỡng cảnh báo trùng lặp nội dung' },
  CONTENT_DUPLICATION_BLOCK_THRESHOLD: { type: 'NHOM', note: 'Ngưỡng chặn nộp bài do đạo văn' },
  MATCHING_NGRAM_SYLLABLES: { type: 'NHOM', note: 'Thuật toán so khớp n-gram âm tiết tiếng Việt' },
  DHASH_DISTANCE_THRESHOLD: { type: 'NHOM', note: 'Khoảng cách Hamming nhận diện ảnh trùng tư liệu' },
  APPEAL_DEADLINE_DAYS: { type: 'NHOM', note: 'Thời hạn khiếu nại điểm kể từ ngày công bố điểm' },
  MAX_APPEALS_PER_ARTICLE: { type: 'NHOM', note: 'Chỉ cho phép khiếu nại tối đa 1 lần/bài' },
  SCORE_DISCREPANCY_THIRD_EDITOR_THRESHOLD: { type: 'NHOM', note: 'Ngưỡng lệch điểm (>5 điểm) để triệu tập BTV thứ ba chấm mù' },
  CRITERIA_MANDATORY_COMMENT_THRESHOLD: { type: 'NHOM', note: 'Tiêu chí dưới 50 điểm bắt buộc phải có nhận xét' },
  SATURATION_WINDOW_DAYS: { type: 'NHOM', note: 'Cửa sổ thời gian 7 ngày tính bão hòa đề tài sự kiện' },
  SATURATION_CAP_K: { type: 'NHOM', note: 'Ngưỡng K bài bắt đầu giảm hệ số nhuận bút' },
  SATURATION_RATES: { type: 'NHOM', note: '3 mức bão hòa đề tài (100% / 80% / 60%)' },
  SATURATION_EXEMPTION_MIN_SCORE: { type: 'NHOM', note: 'Miễn giảm bão hòa nếu bài đạt điểm xuất sắc từ 90 trở lên' }
};

export const ParametersScreen: React.FC = () => {
  const { state, dispatch, notify } = useApp();

  const [activeTab, setActiveTab] = useState<'ALL_PARAMS' | 'INTAKE_CONFIG'>('ALL_PARAMS');
  const [selectedFlow, setSelectedFlow] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal edit param
  const [editingParam, setEditingParam] = useState<SystemParameter | null>(null);
  const [editValue, setEditValue] = useState<string | number>('');
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  // Lọc danh sách tham số
  const filteredParams = useMemo(() => {
    return state.systemParameters.filter(p => {
      const matchFlow = selectedFlow === 'ALL' || String(p.flow) === selectedFlow;
      const matchQuery =
        !searchQuery.trim() ||
        p.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.label.toLowerCase().includes(searchQuery.toLowerCase());
      return matchFlow && matchQuery;
    });
  }, [state.systemParameters, selectedFlow, searchQuery]);

  const handleOpenEdit = (p: SystemParameter) => {
    setEditingParam(p);
    setEditValue(p.value);
    setModalOpen(true);
  };

  const handleSaveParam = () => {
    if (!editingParam) return;

    let finalVal: string | number = editValue;
    if (typeof editingParam.value === 'number') {
      const num = Number(editValue);
      if (isNaN(num)) {
        notify('Giá trị phải là số hợp lệ.', 'error');
        return;
      }
      finalVal = num;
    }

    dispatch({
      type: 'UPDATE_SYSTEM_PARAMETER',
      payload: {
        key: editingParam.key,
        value: finalVal
      }
    });

    notify(`Đã cập nhật tham số "${editingParam.label}" thành: ${finalVal} ${editingParam.unit || ''}!`, 'success');
    setModalOpen(false);
  };

  const getFlowBadge = (flow: string | number) => {
    const f = Number(flow);
    switch (f) {
      case 1:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">Luồng 01 · Tiếp nhận</span>;
      case 2:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">Luồng 02 · Chấm điểm</span>;
      case 3:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">Luồng 03 · Khiếu nại</span>;
      case 4:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Luồng 04 · Nhuận bút</span>;
      case 5:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">Luồng 05 · KPI</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">Hệ thống</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      <PageHeader
        breadcrumbs={[
          { label: 'Quản trị hệ thống', link: '/admin/parameters' },
          { label: 'Tham số toàn hệ thống' }
        ]}
        title="Quản trị Tham số Vận hành & Cấu hình Nghiệp vụ 5 Luồng"
        description="Tổng hợp toàn bộ tham số kỹ thuật, ngưỡng kiểm soát và định mức áp dụng xuyên suốt 5 luồng nghiệp vụ. Ghi rõ căn cứ pháp lý theo Nghị định [NĐ] hoặc quy chế nhóm tự đặt [nhóm]."
      />

      {/* Quick link cards to related configs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Link
          to="/admin/genres"
          className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center shrink-0">
            <FolderTree className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-900">Thể loại & Khung hệ số</div>
            <div className="text-[11px] text-slate-500">9 thể loại, base_factor & max_factor NĐ 18</div>
          </div>
        </Link>

        <Link
          to="/admin/media-factors"
          className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-900 flex items-center justify-center shrink-0">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-900">Hệ số Ảnh / Video</div>
            <div className="text-[11px] text-slate-500">4 dòng định mức media theo NĐ 18/2014</div>
          </div>
        </Link>

        <Link
          to="/admin/unit-prices"
          className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-900 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-900">Đơn giá theo hiệu lực</div>
            <div className="text-[11px] text-slate-500">10% lương cơ sở theo Nghị định Chính phủ</div>
          </div>
        </Link>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setActiveTab('ALL_PARAMS')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'ALL_PARAMS'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Bảng toàn bộ tham số (5 luồng)</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700 font-extrabold">
            {state.systemParameters.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('INTAKE_CONFIG')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'INTAKE_CONFIG'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Biểu mẫu chi tiết Tham số tiếp nhận (Luồng 01 & 03)</span>
        </button>
      </div>

      {/* TAB 1: ALL_PARAMS */}
      {activeTab === 'ALL_PARAMS' && (
        <div className="space-y-4">
          {/* Filters & Search */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                Lọc theo luồng:
              </span>
              {[
                { label: 'Tất cả 5 luồng', value: 'ALL' },
                { label: 'L01 Tiếp nhận', value: '1' },
                { label: 'L02 Chấm điểm', value: '2' },
                { label: 'L03 Khiếu nại', value: '3' },
                { label: 'L04 Nhuận bút', value: '4' },
                { label: 'L05 KPI', value: '5' }
              ].map(f => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setSelectedFlow(f.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                    selectedFlow === f.value
                      ? 'bg-blue-900 text-white font-bold shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tìm mã hoặc tên tham số..."
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4 w-52">Mã tham số (Key)</th>
                    <th className="py-3 px-4">Tên tham số & Ý nghĩa</th>
                    <th className="py-3 px-4 text-center w-36">Luồng nghiệp vụ</th>
                    <th className="py-3 px-4 text-right w-44">Giá trị hiện tại</th>
                    <th className="py-3 px-4 text-center w-32">Nguồn quy định</th>
                    <th className="py-3 px-4 text-right w-24">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredParams.map(param => {
                    const legal = PARAM_LEGAL_SOURCE[param.key] || {
                      type: 'NHOM',
                      note: 'Quy chế tòa soạn nhóm tự đặt'
                    };
                    const isND = legal.type === 'ND';

                    return (
                      <tr key={param.key} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-[11px]">
                          {param.key}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{param.label}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                            {legal.note}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {getFlowBadge(param.flow)}
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <span className="font-black text-sm text-blue-950 px-2 py-0.5 rounded-lg bg-blue-50/60 border border-blue-200/50">
                            {String(param.value)}
                          </span>
                          {param.unit && (
                            <span className="text-[11px] text-slate-500 ml-1.5">{param.unit}</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {isND ? (
                            <span
                              title={legal.note}
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300"
                            >
                              [NĐ] Nghị định
                            </span>
                          ) : (
                            <span
                              title={legal.note}
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300"
                            >
                              [nhóm] Tự đặt
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(param)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition-colors cursor-pointer text-xs"
                          >
                            <Edit2 className="w-3 h-3 text-slate-500" />
                            <span>Sửa</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INTAKE_CONFIG */}
      {activeTab === 'INTAKE_CONFIG' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <IntakeParametersScreen />
        </div>
      )}

      {/* Modal Sửa tham số */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Chỉnh sửa tham số: ${editingParam?.label || ''}`}
        maxWidth="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 border border-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-100 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSaveParam}
              className="px-4 py-2 bg-blue-900 text-white text-xs font-bold rounded-xl hover:bg-blue-800 cursor-pointer shadow-xs"
            >
              Lưu thay đổi
            </button>
          </>
        }
      >
        {editingParam && (
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-slate-800">{editingParam.key}</span>
                {PARAM_LEGAL_SOURCE[editingParam.key]?.type === 'ND' ? (
                  <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                    [NĐ] Căn cứ Nghị định 18/2014
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    [nhóm] Quy chế nhóm tự đặt
                  </span>
                )}
              </div>
              <div className="text-slate-600 font-medium">{editingParam.label}</div>
              <div className="text-[11px] text-slate-500 italic">
                {PARAM_LEGAL_SOURCE[editingParam.key]?.note || 'Tham số vận hành hệ thống'}
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-800 uppercase tracking-wider mb-1">
                Giá trị áp dụng mới {editingParam.unit ? `(${editingParam.unit})` : ''} <span className="text-rose-500">*</span>
              </label>
              <input
                type={typeof editingParam.value === 'number' ? 'number' : 'text'}
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-bold text-slate-900"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Đơn vị tính: <strong>{editingParam.unit || 'Không có đơn vị'}</strong>
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
