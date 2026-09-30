import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/common/Header';
import { Modal } from '../../components/common/Modal';
import { RoyaltyRate, formatMoney, formatDate } from '../../types';
import {
  DollarSign,
  Plus,
  CheckCircle2,
  Calendar,
  Clock,
  Coins,
  ShieldCheck,
  Info,
  Scale,
  FileText
} from 'lucide-react';

export const UnitPricesConfigScreen: React.FC = () => {
  const { state, dispatch, notify } = useApp();

  const [modalOpen, setModalOpen] = useState(false);
  const [baseSalary, setBaseSalary] = useState<number>(2530000);
  const [effectiveFrom, setEffectiveFrom] = useState<string>('2026-10-01');
  const [legalBasis, setLegalBasis] = useState<string>('Nghị định 161/2026/NĐ-CP của Chính phủ');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Tự động tính 10% lương cơ sở
  const unitRate = useMemo(() => {
    if (!baseSalary || baseSalary <= 0) return 0;
    return Math.round(baseSalary * 0.1);
  }, [baseSalary]);

  // Ngày đóng mức cũ dự kiến (ngày trước ngày hiệu lực mới)
  const prevClosingDate = useMemo(() => {
    if (!effectiveFrom) return '';
    try {
      const d = new Date(effectiveFrom);
      d.setDate(d.getDate() - 1);
      return d.toISOString().split('T')[0];
    } catch {
      return '';
    }
  }, [effectiveFrom]);

  // Danh sách sắp xếp theo thời gian mới nhất lên đầu
  const sortedRates = useMemo(() => {
    return [...state.royaltyRates].sort((a, b) => {
      return new Date(b.effective_from).getTime() - new Date(a.effective_from).getTime();
    });
  }, [state.royaltyRates]);

  // Mức đang áp dụng hiện tại
  const activeRate = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const match = state.royaltyRates.find(r => {
      const okFrom = !r.effective_from || r.effective_from <= today;
      const okTo = !r.effective_to || r.effective_to >= today;
      return okFrom && okTo;
    });
    return match || sortedRates[0];
  }, [state.royaltyRates, sortedRates]);

  const handleOpenAdd = () => {
    setBaseSalary(2700000);
    setEffectiveFrom('2026-10-01');
    setLegalBasis('Nghị định điều chỉnh mức lương cơ sở mới của Chính phủ');
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleCreateRate = () => {
    if (!baseSalary || baseSalary <= 0) {
      setErrorMsg('Vui lòng nhập mức lương cơ sở hợp lệ lớn hơn 0.');
      return;
    }
    if (!effectiveFrom) {
      setErrorMsg('Vui lòng chọn ngày bắt đầu có hiệu lực thi hành.');
      return;
    }

    dispatch({
      type: 'ADD_ROYALTY_RATE',
      payload: {
        base_salary: Number(baseSalary),
        effective_from: effectiveFrom,
        legal_basis: legalBasis.trim() || `Nghị định lương cơ sở mới (${formatMoney(baseSalary)})`
      }
    });

    notify(
      `Đã ban hành mức đơn giá mới: ${formatMoney(unitRate)}/hệ số (hiệu lực từ ${formatDate(effectiveFrom)})!`,
      'success'
    );
    setModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      <PageHeader
        breadcrumbs={[
          { label: 'Quản trị', link: '/admin/parameters' },
          { label: 'Đơn giá theo hiệu lực' }
        ]}
        title="Quản lý Đơn giá Nhuận bút theo Thời gian Hiệu lực"
        description="Quy chuẩn quản lý đơn giá dùng chung: Một đơn giá duy nhất cho mọi thể loại bằng đúng 10% mức lương cơ sở theo Nghị định của Chính phủ tại từng thời kỳ."
        actions={
          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-900 text-white text-xs font-bold hover:bg-blue-800 transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Ban hành mức đơn giá mới</span>
          </button>
        }
      />

      {/* Banner mức hiện hành */}
      {activeRate && (
        <div className="bg-linear-to-r from-blue-900 via-indigo-900 to-blue-950 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-6 -translate-y-6 opacity-10 pointer-events-none">
            <Coins className="w-64 h-64 text-white" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>MỨC ĐƠN GIÁ ĐANG ÁP DỤNG TOÀN TÒA SOẠN</span>
              </div>
              <h2 className="text-2xl font-black tracking-tight text-white flex items-baseline gap-2">
                <span>{formatMoney(activeRate.unit_rate)}</span>
                <span className="text-xs font-normal text-blue-200">/ 1 hệ số nhuận bút</span>
              </h2>
              <div className="text-xs text-blue-100 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-blue-300" />
                  Lương cơ sở: <strong>{formatMoney(activeRate.base_salary)}</strong> (10% = {formatMoney(activeRate.unit_rate)})
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-300" />
                  Hiệu lực: Từ <strong>{formatDate(activeRate.effective_from)}</strong> {activeRate.effective_to ? `đến ${formatDate(activeRate.effective_to)}` : '(Hiện hành)'}
                </span>
              </div>
              <div className="text-[11px] text-blue-200/80 pt-1">
                <strong>Căn cứ pháp lý:</strong> {activeRate.legal_basis}
              </div>
            </div>

            <div className="shrink-0 bg-white/10 backdrop-blur-xs p-4 rounded-xl border border-white/10 text-right">
              <div className="text-[11px] text-blue-200 font-medium">Nguyên tắc áp dụng tính tiền</div>
              <div className="text-sm font-bold text-white mt-1">Đơn giá tại NGÀY ĐĂNG BÀI</div>
              <div className="text-[10px] text-blue-200/80 mt-1 max-w-[220px]">
                Bài đăng ngày nào sẽ tự động tra cứu đơn giá có hiệu lực tại ngày đó để nhân với Hệ số cuối.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ghi chú nguyên tắc nghiệp vụ */}
      <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 flex items-start gap-3">
        <Info className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Nguyên tắc quản trị đơn giá (LỆNH 7):</strong> Toàn bộ tòa soạn áp dụng <strong>MỘT đơn giá chung cho mọi thể loại</strong> = đúng 10% mức lương cơ sở theo văn bản pháp luật hiện hành. Khi Chính phủ điều chỉnh lương cơ sở, Kế toán hoặc Quản trị viên nhập mức lương mới và ngày bắt đầu áp dụng; hệ thống sẽ tự tính 10% và tự động chốt ngày kết thúc của mức cũ vào ngày liền trước.
        </div>
      </div>

      {/* Bảng lịch sử các mức đơn giá */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-900" />
            <span>Lịch sử các thời kỳ hiệu lực đơn giá lương cơ sở</span>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Tổng cộng: {sortedRates.length} thời kỳ
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4 w-48">Thời gian hiệu lực</th>
                <th className="py-3 px-4 text-right w-36">Mức lương cơ sở</th>
                <th className="py-3 px-4 text-right w-44">
                  <div>Đơn giá 1 hệ số</div>
                  <div className="text-[9px] font-normal text-slate-400 normal-case">(10% lương cơ sở)</div>
                </th>
                <th className="py-3 px-4">Căn cứ pháp lý & Nghị định ban hành</th>
                <th className="py-3 px-4 text-center w-36">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedRates.map(rate => {
                const isCurrentlyActive = !rate.effective_to;

                return (
                  <tr
                    key={rate.id || rate.effective_from}
                    className={`hover:bg-slate-50 transition-colors ${
                      isCurrentlyActive ? 'bg-blue-50/20 font-medium' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-900" />
                        <span>Từ {formatDate(rate.effective_from)}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 pl-5">
                        {rate.effective_to ? `đến ${formatDate(rate.effective_to)}` : 'Đang áp dụng (Chưa đóng)'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-right font-bold text-slate-800">
                      {formatMoney(rate.base_salary)}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-right">
                      <div className="font-black text-sm text-blue-950">
                        {formatMoney(rate.unit_rate)}
                      </div>
                      <div className="text-[10px] text-slate-400">đồng / 1 hệ số</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 flex items-start gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span>{rate.legal_basis}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {isCurrentlyActive ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Đang áp dụng
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                          Đã đóng hiệu lực
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

      {/* Modal Ban hành mức đơn giá mới */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Ban hành Mức Đơn giá Lương Cơ sở Mới"
        maxWidth="lg"
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
              onClick={handleCreateRate}
              className="px-4 py-2 bg-blue-900 text-white text-xs font-bold rounded-xl hover:bg-blue-800 cursor-pointer shadow-xs"
            >
              Ban hành chính sách
            </button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-medium">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-800 uppercase tracking-wider mb-1">
                Mức lương cơ sở mới (VNĐ) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="10000"
                  value={baseSalary || ''}
                  onChange={e => setBaseSalary(Number(e.target.value))}
                  placeholder="Ví dụ: 2530000"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-bold text-slate-900 pr-12"
                />
                <span className="absolute right-3 top-2.5 text-slate-400 font-bold text-[11px]">VNĐ</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Ví dụ: 2.340.000 đ (NĐ 73/2024), 2.530.000 đ (NĐ 161/2026), 2.700.000 đ...
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-800 uppercase tracking-wider mb-1">
                Đơn giá tự tính (10% lương cơ sở)
              </label>
              <div className="px-3 py-2 text-xs rounded-xl bg-emerald-50 border border-emerald-200 font-black text-emerald-800 text-sm flex items-center justify-between">
                <span>{formatMoney(unitRate)}</span>
                <span className="text-[10px] font-bold text-emerald-600 uppercase">Tự tính 10%</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Hệ thống tự động lấy đúng 10% lương cơ sở làm đơn giá 1 hệ số.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-800 uppercase tracking-wider mb-1">
                Ngày bắt đầu có hiệu lực thi hành <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={effectiveFrom}
                onChange={e => setEffectiveFrom(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-bold"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Các bài viết xuất bản từ ngày này sẽ áp dụng mức đơn giá mới.
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-800 uppercase tracking-wider mb-1">
                Tự động đóng hiệu lực mức cũ
              </label>
              <div className="px-3 py-2 text-xs rounded-xl bg-slate-100 border border-slate-200 font-medium text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>
                  {prevClosingDate ? `Đóng vào ngày: ${formatDate(prevClosingDate)}` : 'Chưa chọn ngày hiệu lực'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Tự động gán ngày kết thúc của mức giá trước đó vào ngày liền kề.
              </p>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-800 uppercase tracking-wider mb-1">
              Căn cứ pháp lý & Văn bản quyết định <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={legalBasis}
              onChange={e => setLegalBasis(e.target.value)}
              placeholder="Ví dụ: Nghị định 161/2026/NĐ-CP của Chính phủ quy định mức lương cơ sở..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
