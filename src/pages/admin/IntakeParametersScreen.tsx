import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/common/Header';
import { SystemParameter } from '../../types';
import {
  Sliders,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Clock,
  Layers,
  Sparkles,
  Info,
  Scale
} from 'lucide-react';

export const IntakeParametersScreen: React.FC = () => {
  const { state, dispatch, notify } = useApp();

  // Lọc các tham số thuộc Luồng 01 và Luồng 03
  const relevantParams = state.systemParameters.filter(p => Number(p.flow) === 1 || Number(p.flow) === 3);

  // Local state để chỉnh sửa form
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const initial: Record<string, any> = {};
    relevantParams.forEach(p => {
      initial[p.key] = p.value;
    });
    setFormValues(initial);
  }, [state.systemParameters]);

  const handleChange = (key: string, value: any) => {
    setFormValues(prev => ({ ...prev, [key]: value }));
    // Xóa lỗi nếu có
    if (errors[key]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  // Kiểm tra tính hợp lệ nghiệp vụ
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    const maxAuthors = Number(formValues.MAX_AUTHORS_PER_ARTICLE);
    if (isNaN(maxAuthors) || maxAuthors < 1 || maxAuthors > 20) {
      newErrors.MAX_AUTHORS_PER_ARTICLE = 'Số tác giả tối đa phải từ 1 đến 20 người.';
    }

    const deadlineDays = Number(formValues.CO_AUTHOR_CONFIRM_DEADLINE_DAYS);
    if (isNaN(deadlineDays) || deadlineDays < 1 || deadlineDays > 15) {
      newErrors.CO_AUTHOR_CONFIRM_DEADLINE_DAYS = 'Thời hạn xác nhận phải từ 1 đến 15 ngày.';
    }

    const warnThreshold = Number(formValues.CONTENT_DUPLICATION_WARN_THRESHOLD);
    const blockThreshold = Number(formValues.CONTENT_DUPLICATION_BLOCK_THRESHOLD);

    if (isNaN(warnThreshold) || warnThreshold < 0 || warnThreshold > 100) {
      newErrors.CONTENT_DUPLICATION_WARN_THRESHOLD = 'Ngưỡng cảnh báo trùng lặp phải từ 0% đến 100%.';
    }

    if (isNaN(blockThreshold) || blockThreshold < 0 || blockThreshold > 100) {
      newErrors.CONTENT_DUPLICATION_BLOCK_THRESHOLD = 'Ngưỡng chặn nộp phải từ 0% đến 100%.';
    }

    if (!isNaN(warnThreshold) && !isNaN(blockThreshold) && warnThreshold >= blockThreshold) {
      newErrors.CONTENT_DUPLICATION_WARN_THRESHOLD = 'Ngưỡng cảnh báo phải nhỏ hơn ngưỡng chặn nộp!';
      newErrors.CONTENT_DUPLICATION_BLOCK_THRESHOLD = 'Ngưỡng chặn nộp phải lớn hơn ngưỡng cảnh báo!';
    }

    const dhashBits = Number(formValues.DHASH_DISTANCE_THRESHOLD);
    if (isNaN(dhashBits) || dhashBits < 1 || dhashBits > 64) {
      newErrors.DHASH_DISTANCE_THRESHOLD = 'Ngưỡng khoảng cách Hamming dHash phải từ 1 đến 64 bit.';
    }

    const saturationDays = Number(formValues.SATURATION_WINDOW_DAYS);
    if (isNaN(saturationDays) || saturationDays < 1 || saturationDays > 30) {
      newErrors.SATURATION_WINDOW_DAYS = 'Cửa sổ ngày bão hòa sự kiện phải từ 1 đến 30 ngày.';
    }

    const saturationCapK = Number(formValues.SATURATION_CAP_K);
    if (isNaN(saturationCapK) || saturationCapK < 1) {
      newErrors.SATURATION_CAP_K = 'Số bài ngưỡng bắt đầu giảm bão hòa phải lớn hơn 0.';
    }

    const minExemptScore = Number(formValues.SATURATION_EXEMPTION_MIN_SCORE);
    if (isNaN(minExemptScore) || minExemptScore < 50 || minExemptScore > 100) {
      newErrors.SATURATION_EXEMPTION_MIN_SCORE = 'Điểm miễn giảm bão hòa phải từ 50 đến 100 điểm.';
    }

    // Validation Luồng 03
    const appealDays = Number(formValues.APPEAL_DEADLINE_DAYS);
    if (isNaN(appealDays) || appealDays < 1 || appealDays > 30) {
      newErrors.APPEAL_DEADLINE_DAYS = 'Thời hạn khiếu nại phải từ 1 đến 30 ngày.';
    }

    const maxAppeals = Number(formValues.MAX_APPEALS_PER_ARTICLE);
    if (isNaN(maxAppeals) || maxAppeals < 1 || maxAppeals > 5) {
      newErrors.MAX_APPEALS_PER_ARTICLE = 'Số lần khiếu nại tối đa phải từ 1 đến 5 lần.';
    }

    const thirdThreshold = Number(formValues.SCORE_DISCREPANCY_THIRD_EDITOR_THRESHOLD);
    if (isNaN(thirdThreshold) || thirdThreshold < 1 || thirdThreshold > 20) {
      newErrors.SCORE_DISCREPANCY_THIRD_EDITOR_THRESHOLD = 'Ngưỡng lệch điểm gọi BTV thứ ba phải từ 1 đến 20 điểm.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Lưu cấu hình tham số
  const handleSave = () => {
    if (!validate()) {
      notify('Vui lòng kiểm tra và sửa các lỗi nhập liệu tham số!', 'error');
      return;
    }

    // Dispatch update
    const updatedList: SystemParameter[] = state.systemParameters.map(p => {
      if (formValues[p.key] !== undefined) {
        return {
          ...p,
          value: isNaN(Number(formValues[p.key])) ? formValues[p.key] : Number(formValues[p.key])
        };
      }
      return p;
    });

    dispatch({
      type: 'UPDATE_SYSTEM_PARAMETERS',
      payload: { parameters: updatedList }
    });

    notify('Đã cập nhật cấu hình tham số hệ thống thành công!', 'success');
  };

  // Khôi phục giá trị mặc định chuẩn quy chế
  const handleResetDefaults = () => {
    const defaults: Record<string, any> = {
      MAX_AUTHORS_PER_ARTICLE: 5,
      CO_AUTHOR_CONFIRM_DEADLINE_DAYS: 3,
      CONTENT_DUPLICATION_WARN_THRESHOLD: 20,
      CONTENT_DUPLICATION_BLOCK_THRESHOLD: 50,
      MATCHING_NGRAM_SYLLABLES: 5,
      DHASH_DISTANCE_THRESHOLD: 5,
      SATURATION_WINDOW_DAYS: 7,
      SATURATION_CAP_K: 10,
      SATURATION_RATES: '100% / 80% / 60%',
      SATURATION_EXEMPTION_MIN_SCORE: 90,
      APPEAL_DEADLINE_DAYS: 7,
      MAX_APPEALS_PER_ARTICLE: 1,
      SCORE_DISCREPANCY_THIRD_EDITOR_THRESHOLD: 5
    };
    setFormValues(prev => ({ ...prev, ...defaults }));
    setErrors({});
    notify('Đã khôi phục các giá trị mặc định chuẩn của tòa soạn. Bấm "Lưu cấu hình" để áp dụng.', 'info');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      <PageHeader
        breadcrumbs={[
          { label: 'Quản trị hệ thống' },
          { label: 'Tham số tiếp nhận & kiểm chứng (L01)' }
        ]}
        title="Cấu hình tham số nghiệp vụ Luồng 01"
        description="Quy định ngưỡng kiểm tra trùng lặp văn bản, thuật toán dHash hình ảnh, thời hạn đồng tác giả và công thức bão hòa đề tài."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Khôi phục mặc định</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-blue-900 text-white hover:bg-blue-800 shadow-sm transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Lưu cấu hình tham số</span>
            </button>
          </div>
        }
      />

      {/* Nhóm 1: Đồng tác giả & Thời hạn xác nhận */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-900" />
            <h3 className="text-sm font-bold text-slate-900">1. Quy định Đồng tác giả & Thời hạn xác nhận</h3>
          </div>
          <span className="text-[11px] text-slate-400">Tham số luồng nộp bài</span>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* MAX_AUTHORS_PER_ARTICLE */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">
                Số tác giả tối đa trên 1 bài viết:
              </label>
              <span className="text-[11px] font-mono text-slate-400">MAX_AUTHORS_PER_ARTICLE</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={20}
                value={formValues.MAX_AUTHORS_PER_ARTICLE ?? 5}
                onChange={e => handleChange('MAX_AUTHORS_PER_ARTICLE', e.target.value)}
                className={`w-32 p-2.5 rounded-xl border text-xs font-bold ${
                  errors.MAX_AUTHORS_PER_ARTICLE ? 'border-rose-500 bg-rose-50' : 'border-slate-300'
                }`}
              />
              <span className="text-xs text-slate-500 font-medium">người / bài viết</span>
            </div>
            {errors.MAX_AUTHORS_PER_ARTICLE && (
              <p className="text-[11px] text-rose-600 font-medium">{errors.MAX_AUTHORS_PER_ARTICLE}</p>
            )}
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Giới hạn số lượng phóng viên cùng đứng tên trên một tác phẩm báo chí để đảm bảo tính tập trung chất lượng.
            </p>
          </div>

          {/* CO_AUTHOR_CONFIRM_DEADLINE_DAYS */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">
                Thời hạn đồng tác giả xác nhận:
              </label>
              <span className="text-[11px] font-mono text-slate-400">CO_AUTHOR_CONFIRM_DEADLINE_DAYS</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={15}
                value={formValues.CO_AUTHOR_CONFIRM_DEADLINE_DAYS ?? 3}
                onChange={e => handleChange('CO_AUTHOR_CONFIRM_DEADLINE_DAYS', e.target.value)}
                className={`w-32 p-2.5 rounded-xl border text-xs font-bold ${
                  errors.CO_AUTHOR_CONFIRM_DEADLINE_DAYS ? 'border-rose-500 bg-rose-50' : 'border-slate-300'
                }`}
              />
              <span className="text-xs text-slate-500 font-medium">ngày kể từ khi nộp</span>
            </div>
            {errors.CO_AUTHOR_CONFIRM_DEADLINE_DAYS && (
              <p className="text-[11px] text-rose-600 font-medium">{errors.CO_AUTHOR_CONFIRM_DEADLINE_DAYS}</p>
            )}
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Nếu quá thời hạn này mà đồng tác giả chưa xác nhận, hệ thống sẽ tự động chuyển bài về Bản nháp để tránh tồn đọng.
            </p>
          </div>
        </div>
      </div>

      {/* Nhóm 2: Ngưỡng kiểm tra trùng lặp & Bản quyền dHash */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-900" />
            <h3 className="text-sm font-bold text-slate-900">2. Ngưỡng kiểm tra trùng lặp văn bản & Bản quyền dHash</h3>
          </div>
          <span className="text-[11px] text-slate-400">Thuật toán đối soát nội dung</span>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CONTENT_DUPLICATION_WARN_THRESHOLD */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">
                Ngưỡng trùng lặp cảnh báo (bắt buộc giải trình):
              </label>
              <span className="text-[11px] font-mono text-slate-400">CONTENT_DUPLICATION_WARN_THRESHOLD</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={100}
                value={formValues.CONTENT_DUPLICATION_WARN_THRESHOLD ?? 20}
                onChange={e => handleChange('CONTENT_DUPLICATION_WARN_THRESHOLD', e.target.value)}
                className={`w-32 p-2.5 rounded-xl border text-xs font-bold ${
                  errors.CONTENT_DUPLICATION_WARN_THRESHOLD ? 'border-rose-500 bg-rose-50' : 'border-slate-300'
                }`}
              />
              <span className="text-xs text-slate-500 font-medium">% nội dung văn bản</span>
            </div>
            {errors.CONTENT_DUPLICATION_WARN_THRESHOLD && (
              <p className="text-[11px] text-rose-600 font-medium">{errors.CONTENT_DUPLICATION_WARN_THRESHOLD}</p>
            )}
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Nếu tỷ lệ trùng vượt mức này, phóng viên bắt buộc phải nhập bản giải trình nguồn tin và trích dẫn trước khi nộp.
            </p>
          </div>

          {/* CONTENT_DUPLICATION_BLOCK_THRESHOLD */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">
                Ngưỡng trùng lặp chặn nộp (Thể loại Sáng tác):
              </label>
              <span className="text-[11px] font-mono text-slate-400">CONTENT_DUPLICATION_BLOCK_THRESHOLD</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={100}
                value={formValues.CONTENT_DUPLICATION_BLOCK_THRESHOLD ?? 50}
                onChange={e => handleChange('CONTENT_DUPLICATION_BLOCK_THRESHOLD', e.target.value)}
                className={`w-32 p-2.5 rounded-xl border text-xs font-bold ${
                  errors.CONTENT_DUPLICATION_BLOCK_THRESHOLD ? 'border-rose-500 bg-rose-50' : 'border-slate-300'
                }`}
              />
              <span className="text-xs text-slate-500 font-medium">% nội dung văn bản</span>
            </div>
            {errors.CONTENT_DUPLICATION_BLOCK_THRESHOLD && (
              <p className="text-[11px] text-rose-600 font-medium">{errors.CONTENT_DUPLICATION_BLOCK_THRESHOLD}</p>
            )}
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Bài viết khai báo Sáng tác có tỷ lệ trùng vượt ngưỡng này sẽ bị hệ thống khóa nút nộp bài hoàn toàn.
            </p>
          </div>

          {/* DHASH_DISTANCE_THRESHOLD */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">
                Ngưỡng khoảng cách Hamming dHash hình ảnh:
              </label>
              <span className="text-[11px] font-mono text-slate-400">DHASH_DISTANCE_THRESHOLD</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={64}
                value={formValues.DHASH_DISTANCE_THRESHOLD ?? 5}
                onChange={e => handleChange('DHASH_DISTANCE_THRESHOLD', e.target.value)}
                className={`w-32 p-2.5 rounded-xl border text-xs font-bold ${
                  errors.DHASH_DISTANCE_THRESHOLD ? 'border-rose-500 bg-rose-50' : 'border-slate-300'
                }`}
              />
              <span className="text-xs text-slate-500 font-medium">bit (trên mã băm 64-bit)</span>
            </div>
            {errors.DHASH_DISTANCE_THRESHOLD && (
              <p className="text-[11px] text-rose-600 font-medium">{errors.DHASH_DISTANCE_THRESHOLD}</p>
            )}
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Nếu khoảng cách chênh lệch giữa 2 ảnh ≤ ngưỡng này, hệ thống sẽ xác định ảnh là tái sử dụng từ kho dữ liệu cũ.
            </p>
          </div>

          {/* MATCHING_NGRAM_SYLLABLES */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">
                Độ dài cụm âm tiết so khớp n-gram:
              </label>
              <span className="text-[11px] font-mono text-slate-400">MATCHING_NGRAM_SYLLABLES</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={3}
                max={20}
                value={formValues.MATCHING_NGRAM_SYLLABLES ?? 5}
                onChange={e => handleChange('MATCHING_NGRAM_SYLLABLES', e.target.value)}
                className="w-32 p-2.5 rounded-xl border border-slate-300 text-xs font-bold"
              />
              <span className="text-xs text-slate-500 font-medium">âm tiết liên tiếp</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Độ dài chuỗi từ liên tục tối thiểu được dùng để phát hiện trùng lặp câu chữ giữa bản thảo và kho lưu trữ báo chí.
            </p>
          </div>
        </div>
      </div>

      {/* Nhóm 3: Quy định Bão hòa đề tài sự kiện & Miễn giảm */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-blue-900" />
            <h3 className="text-sm font-bold text-slate-900">3. Quy định Bão hòa đề tài sự kiện & Miễn giảm chất lượng cao</h3>
          </div>
          <span className="text-[11px] text-slate-400">Chính sách hạn chế trùng lắp chủ đề</span>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* SATURATION_WINDOW_DAYS */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">
                Cửa sổ xét bão hòa đề tài sự kiện:
              </label>
              <span className="text-[11px] font-mono text-slate-400">SATURATION_WINDOW_DAYS</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={30}
                value={formValues.SATURATION_WINDOW_DAYS ?? 7}
                onChange={e => handleChange('SATURATION_WINDOW_DAYS', e.target.value)}
                className={`w-32 p-2.5 rounded-xl border text-xs font-bold ${
                  errors.SATURATION_WINDOW_DAYS ? 'border-rose-500 bg-rose-50' : 'border-slate-300'
                }`}
              />
              <span className="text-xs text-slate-500 font-medium">ngày</span>
            </div>
            {errors.SATURATION_WINDOW_DAYS && (
              <p className="text-[11px] text-rose-600 font-medium">{errors.SATURATION_WINDOW_DAYS}</p>
            )}
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Khoảng thời gian thống kê số lượng bài viết đã nộp/đăng cùng một sự kiện để xác định mức xếp hạng bão hòa.
            </p>
          </div>

          {/* SATURATION_CAP_K */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">
                Ngưỡng K bài bắt đầu giảm trừ hệ số:
              </label>
              <span className="text-[11px] font-mono text-slate-400">SATURATION_CAP_K</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={100}
                value={formValues.SATURATION_CAP_K ?? 10}
                onChange={e => handleChange('SATURATION_CAP_K', e.target.value)}
                className={`w-32 p-2.5 rounded-xl border text-xs font-bold ${
                  errors.SATURATION_CAP_K ? 'border-rose-500 bg-rose-50' : 'border-slate-300'
                }`}
              />
              <span className="text-xs text-slate-500 font-medium">bài (ngưỡng 1)</span>
            </div>
            {errors.SATURATION_CAP_K && (
              <p className="text-[11px] text-rose-600 font-medium">{errors.SATURATION_CAP_K}</p>
            )}
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Từ bài thứ 1 đến K: 100% nhuận bút; từ bài K+1 đến K+5: 80% nhuận bút; từ bài K+6 trở đi: 60% nhuận bút.
            </p>
          </div>

          {/* SATURATION_EXEMPTION_MIN_SCORE */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">
                Điểm tối thiểu miễn giảm trừ bão hòa:
              </label>
              <span className="text-[11px] font-mono text-slate-400">SATURATION_EXEMPTION_MIN_SCORE</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={50}
                max={100}
                value={formValues.SATURATION_EXEMPTION_MIN_SCORE ?? 90}
                onChange={e => handleChange('SATURATION_EXEMPTION_MIN_SCORE', e.target.value)}
                className={`w-32 p-2.5 rounded-xl border text-xs font-bold ${
                  errors.SATURATION_EXEMPTION_MIN_SCORE ? 'border-rose-500 bg-rose-50' : 'border-slate-300'
                }`}
              />
              <span className="text-xs text-slate-500 font-medium">điểm / 100</span>
            </div>
            {errors.SATURATION_EXEMPTION_MIN_SCORE && (
              <p className="text-[11px] text-rose-600 font-medium">{errors.SATURATION_EXEMPTION_MIN_SCORE}</p>
            )}
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Các bài viết có chất lượng đặc biệt xuất sắc (đạt từ mức điểm này trở lên) sẽ được miễn áp dụng giảm trừ bão hòa (giữ nguyên 100%).
            </p>
          </div>

          {/* SATURATION_RATES */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">
                Các mức tỷ lệ bão hòa quy định:
              </label>
              <span className="text-[11px] font-mono text-slate-400">SATURATION_RATES</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={formValues.SATURATION_RATES ?? '100% / 80% / 60%'}
                onChange={e => handleChange('SATURATION_RATES', e.target.value)}
                className="w-48 p-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-slate-50"
              />
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Các mốc tỷ lệ nhuận bút được khóa vào bài viết tại thời điểm phóng viên nộp duyệt.
            </p>
          </div>
        </div>
      </div>

      {/* Nhóm 4: Tham số Luồng 03 · Kiểm soát chất lượng & Khiếu nại */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-blue-900" />
            <h3 className="text-sm font-bold text-slate-900">4. Tham số Luồng 03 · Kiểm soát chất lượng & Khiếu nại</h3>
          </div>
          <span className="text-[11px] text-slate-400">Quy chế thẩm định & Khiếu nại</span>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* APPEAL_DEADLINE_DAYS */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">
                Thời hạn khiếu nại (từ ngày công bố điểm):
              </label>
              <span className="text-[11px] font-mono text-slate-400">APPEAL_DEADLINE_DAYS</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={30}
                value={formValues.APPEAL_DEADLINE_DAYS ?? 7}
                onChange={e => handleChange('APPEAL_DEADLINE_DAYS', e.target.value)}
                className={`w-32 p-2.5 rounded-xl border text-xs font-bold ${
                  errors.APPEAL_DEADLINE_DAYS ? 'border-rose-500 bg-rose-50' : 'border-slate-300'
                }`}
              />
              <span className="text-xs text-slate-500 font-medium">ngày</span>
            </div>
            {errors.APPEAL_DEADLINE_DAYS && (
              <p className="text-[11px] text-rose-600 font-medium">{errors.APPEAL_DEADLINE_DAYS}</p>
            )}
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Số ngày tối đa tác giả chính được quyền nộp đơn khiếu nại chất lượng sau khi Trưởng ban công bố điểm.
            </p>
          </div>

          {/* MAX_APPEALS_PER_ARTICLE */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">
                Số lần khiếu nại tối đa / bài viết:
              </label>
              <span className="text-[11px] font-mono text-slate-400">MAX_APPEALS_PER_ARTICLE</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={5}
                value={formValues.MAX_APPEALS_PER_ARTICLE ?? 1}
                onChange={e => handleChange('MAX_APPEALS_PER_ARTICLE', e.target.value)}
                className={`w-32 p-2.5 rounded-xl border text-xs font-bold ${
                  errors.MAX_APPEALS_PER_ARTICLE ? 'border-rose-500 bg-rose-50' : 'border-slate-300'
                }`}
              />
              <span className="text-xs text-slate-500 font-medium">lần</span>
            </div>
            {errors.MAX_APPEALS_PER_ARTICLE && (
              <p className="text-[11px] text-rose-600 font-medium">{errors.MAX_APPEALS_PER_ARTICLE}</p>
            )}
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Quy định mỗi bài viết chỉ được gửi khiếu nại một lần duy nhất để bảo đảm tính dứt điểm của quy trình.
            </p>
          </div>

          {/* SCORE_DISCREPANCY_THIRD_EDITOR_THRESHOLD */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">
                Ngưỡng lệch điểm gọi BTV thứ ba:
              </label>
              <span className="text-[11px] font-mono text-slate-400">SCORE_DISCREPANCY_THIRD_EDITOR_THRESHOLD</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={20}
                value={formValues.SCORE_DISCREPANCY_THIRD_EDITOR_THRESHOLD ?? 5}
                onChange={e => handleChange('SCORE_DISCREPANCY_THIRD_EDITOR_THRESHOLD', e.target.value)}
                className={`w-32 p-2.5 rounded-xl border text-xs font-bold ${
                  errors.SCORE_DISCREPANCY_THIRD_EDITOR_THRESHOLD ? 'border-rose-500 bg-rose-50' : 'border-slate-300'
                }`}
              />
              <span className="text-xs text-slate-500 font-medium">điểm</span>
            </div>
            {errors.SCORE_DISCREPANCY_THIRD_EDITOR_THRESHOLD && (
              <p className="text-[11px] text-rose-600 font-medium">{errors.SCORE_DISCREPANCY_THIRD_EDITOR_THRESHOLD}</p>
            )}
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Nếu điểm chấm lại thấp hơn và lệch vượt ngưỡng này (&gt; 5đ), hệ thống sẽ tự động giao BTV thứ ba chấm mù và lấy trung vị.
            </p>
          </div>
        </div>
      </div>

      {/* Card tóm tắt cơ chế áp dụng */}
      <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 space-y-2">
        <div className="flex items-center gap-2 font-bold text-sm">
          <Info className="w-4 h-4 text-blue-800 shrink-0" />
          <span>Tác động thời gian thực (Realtime Validation)</span>
        </div>
        <p className="leading-relaxed text-blue-800">
          Các tham số trên được đồng bộ trực tiếp vào bộ điều hướng tiếp nhận của Luồng 01. Khi bạn thay đổi ngưỡng kiểm trùng từ 20% thành 30%, màn hình kiểm tra trùng của phóng viên sẽ ngay lập tức yêu cầu giải trình theo ngưỡng 30% mới.
        </p>
      </div>
    </div>
  );
};
