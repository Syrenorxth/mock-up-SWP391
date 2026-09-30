import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/common/Header';
import { Modal } from '../../components/common/Modal';
import { RoyaltyPeriod, formatMoney, formatDate } from '../../types';
import {
  Calendar,
  CheckCircle2,
  Lock,
  Clock,
  Plus,
  ArrowRight,
  TrendingUp,
  FileCheck,
  ShieldAlert,
  CreditCard,
  FileSpreadsheet,
  AlertTriangle
} from 'lucide-react';

export const RoyaltyPeriodListScreen: React.FC = () => {
  const { state, dispatch, notify, currentRole } = useApp();
  const navigate = useNavigate();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newMonth, setNewMonth] = useState<number>(new Date().getMonth() + 1);
  const [newYear, setNewYear] = useState<number>(new Date().getFullYear());

  const isAccountant = currentRole === 'KE_TOAN';
  const isSecretary = currentRole === 'THU_KY';

  // Thống kê
  const totalPeriods = state.royaltyPeriods.length;
  const paidPeriods = state.royaltyPeriods.filter(p => p.status === 'PAID' || p.status === 'DA_CHI');
  const totalPaidAmount = paidPeriods.reduce((sum, p) => sum + p.total_amount, 0);
  const closedPendingReview = state.royaltyPeriods.filter(p => p.status === 'CLOSED');
  const openPeriods = state.royaltyPeriods.filter(p => p.status === 'OPEN' || p.status === 'DANG_CHAM');

  // Tính số bài đã chấm / chưa chấm cho mỗi kỳ
  const getArticleCountsForPeriod = (period: RoyaltyPeriod) => {
    // Bài xuất bản trong tháng của kỳ
    const publishedInMonth = state.articles.filter(a => {
      if (a.status !== 'PUBLISHED' || !a.published_at) return false;
      const pubDate = new Date(a.published_at.replace(' ', 'T'));
      return pubDate.getMonth() + 1 === period.month && pubDate.getFullYear() === period.year;
    });

    // Các bài đã chấm
    const gradedArticles = state.royaltyLines.filter(l => l.period_id === period.id);
    const uniqueGradedArticleIds = new Set(gradedArticles.map(l => l.article_id));

    // Tổng bài đã chấm trong kỳ
    const gradedCount = uniqueGradedArticleIds.size;
    const totalCount = Math.max(publishedInMonth.length, gradedCount);
    const unGradedCount = Math.max(0, totalCount - gradedCount);

    return { totalCount, gradedCount, unGradedCount };
  };

  const getStatusBadge = (status: RoyaltyPeriod['status']) => {
    switch (status) {
      case 'OPEN':
      case 'DANG_CHAM':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-300">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
            OPEN · Đang mở
          </span>
        );
      case 'CLOSED':
      case 'DA_CHOT':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            CLOSED · Chờ Kế toán
          </span>
        );
      case 'LOCKED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-900 border border-indigo-300">
            <Lock className="w-3.5 h-3.5 text-indigo-600" />
            LOCKED · Đã khóa
          </span>
        );
      case 'PAID':
      case 'DA_CHI':
      case 'DA_CHI_TRA':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            PAID · Đã chi
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  const handleCreatePeriod = () => {
    dispatch({
      type: 'CREATE_ROYALTY_PERIOD',
      payload: { month: Number(newMonth), year: Number(newYear) }
    });
    notify(`Đã mở kỳ nhuận bút tháng ${newMonth}/${newYear} thành công!`, 'success');
    setCreateModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Danh sách kỳ nhuận bút"
        subtitle="Quản lý chu kỳ tính, khóa và chi trả nhuận bút theo tháng (Thư ký & Kế toán)"
        icon={Calendar}
        actions={
          <div className="flex items-center gap-3">
            {isSecretary && (
              <button
                onClick={() => setCreateModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium text-sm shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Mở kỳ nhuận bút mới
              </button>
            )}
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tổng số kỳ</div>
            <div className="text-2xl font-bold text-slate-800">{totalPeriods}</div>
            <div className="text-xs text-slate-500 mt-0.5">Lịch sử từ 06/2026</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-amber-600">Kỳ chờ duyệt</div>
            <div className="text-2xl font-bold text-amber-900">{closedPendingReview.length}</div>
            <div className="text-xs text-amber-700 mt-0.5">Thư ký đã chốt gửi Kế toán</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-sky-600">Kỳ đang mở</div>
            <div className="text-2xl font-bold text-sky-900">{openPeriods.length}</div>
            <div className="text-xs text-sky-700 mt-0.5">Đang tiếp nhận & chấm bài</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Đã chi trả lũy kế</div>
            <div className="text-xl font-bold text-emerald-800">{formatMoney(totalPaidAmount)}</div>
            <div className="text-xs text-emerald-700 mt-0.5">{paidPeriods.length} kỳ hoàn tất</div>
          </div>
        </div>
      </div>

      {/* Thông tin quy trình trạng thái kỳ */}
      <div className="bg-gradient-to-r from-slate-50 to-indigo-50/40 p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-600">
        <div className="flex items-center gap-2 font-semibold text-slate-700">
          <span>Quy trình chu kỳ nhuận bút:</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-1 rounded bg-sky-100 text-sky-800 font-semibold border border-sky-200">
            1. OPEN (Đang mở - Thư ký chấm)
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="px-2.5 py-1 rounded bg-amber-100 text-amber-900 font-semibold border border-amber-200">
            2. CLOSED (Thư ký chốt - Chờ Kế toán)
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="px-2.5 py-1 rounded bg-indigo-100 text-indigo-900 font-semibold border border-indigo-200">
            3. LOCKED (Kế toán khóa - Lập phiếu chi)
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
            4. PAID (Kế toán chi trả xong)
          </span>
        </div>
      </div>

      {/* Bảng danh sách kỳ */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="px-5 py-4">Kỳ nhuận bút</th>
                <th className="px-4 py-4 text-center">Trạng thái</th>
                <th className="px-4 py-4 text-center">Tiến độ chấm</th>
                <th className="px-4 py-4 text-right">Tổng kinh phí</th>
                <th className="px-4 py-4 text-center">Ngày chốt (Thư ký)</th>
                <th className="px-4 py-4 text-center">Ngày khóa (Kế toán)</th>
                <th className="px-4 py-4 text-center">Ngày chi trả</th>
                <th className="px-5 py-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {state.royaltyPeriods.map(period => {
                const { totalCount, gradedCount, unGradedCount } = getArticleCountsForPeriod(period);
                const isClosed = period.status === 'CLOSED';
                const isLocked = period.status === 'LOCKED';
                const isPaid = period.status === 'PAID' || period.status === 'DA_CHI';
                const isOpen = period.status === 'OPEN' || period.status === 'DANG_CHAM';

                return (
                  <tr key={period.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900 text-base">
                        Tháng {String(period.month).padStart(2, '0')}/{period.year}
                      </div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        Mã: {period.code || period.period_code}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-center">
                      {getStatusBadge(period.status)}
                      {period.return_reason && isOpen && (
                        <div className="mt-1 text-[11px] text-amber-700 bg-amber-50 p-1 rounded border border-amber-200 max-w-xs mx-auto">
                          ⚠️ Trả về: {period.return_reason}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-4 text-center">
                      <div className="font-semibold text-slate-800">
                        {gradedCount} / {totalCount} bài
                      </div>
                      {unGradedCount > 0 ? (
                        <span className="text-[11px] text-amber-600 font-medium">
                          Còn {unGradedCount} bài chưa chấm
                        </span>
                      ) : (
                        <span className="text-[11px] text-emerald-600 font-medium flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Đã chấm 100%
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-4 text-right">
                      <div className="font-bold text-indigo-700 text-base">
                        {formatMoney(period.total_amount)}
                      </div>
                      <div className="text-xs text-slate-400">VNĐ</div>
                    </td>

                    <td className="px-4 py-4 text-center text-xs text-slate-600">
                      {period.closed_at ? (
                        <div>
                          <div className="font-medium text-slate-800">{formatDate(period.closed_at)}</div>
                          <div className="text-[10px] text-slate-400">Thư ký tòa soạn</div>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="px-4 py-4 text-center text-xs text-slate-600">
                      {period.locked_at ? (
                        <div>
                          <div className="font-medium text-slate-800">{formatDate(period.locked_at)}</div>
                          <div className="text-[10px] text-slate-400">Kế toán khóa</div>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="px-4 py-4 text-center text-xs text-slate-600">
                      {period.paid_at ? (
                        <div>
                          <div className="font-medium text-emerald-700">{formatDate(period.paid_at)}</div>
                          <div className="text-[10px] text-emerald-600">Đã giải ngân</div>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Nút cho Thư ký */}
                        {(isSecretary || !isAccountant) && (
                          <button
                            onClick={() => navigate(`/secretary/royalty-periods/${period.id}`)}
                            className="px-3 py-1.5 rounded-lg border border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-medium text-xs transition flex items-center gap-1 shadow-sm"
                            title="Thư ký: Xem bảng chấm & chốt kỳ"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                            Bảng chấm kỳ
                          </button>
                        )}

                        {/* Nút cho Kế toán */}
                        {(isAccountant || isClosed || isLocked || isPaid) && (
                          <button
                            onClick={() => navigate(`/accounting/periods/${period.id}`)}
                            className={`px-3 py-1.5 rounded-lg font-medium text-xs transition flex items-center gap-1 shadow-sm ${
                              isClosed
                                ? 'bg-amber-600 text-white hover:bg-amber-700'
                                : 'border border-slate-300 text-slate-700 hover:bg-slate-100'
                            }`}
                            title="Kế toán: Kiểm tra & Khóa kỳ"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Kiểm tra kỳ
                          </button>
                        )}

                        {(isLocked || isPaid) && (
                          <button
                            onClick={() => navigate(`/accounting/vouchers?period=${period.id}`)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 font-medium text-xs transition flex items-center gap-1 shadow-sm"
                            title="Xem các phiếu chi của kỳ"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            Phiếu chi
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Mở kỳ mới */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Mở kỳ tính nhuận bút mới"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Khởi tạo chu kỳ tính nhuận bút tháng cho tòa soạn. Trạng thái ban đầu là <strong>OPEN (Đang mở)</strong> để Thư ký tòa soạn chấm và tổng hợp các bài xuất bản.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tháng tính nhuận bút</label>
              <select
                value={newMonth}
                onChange={e => setNewMonth(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>Tháng {m < 10 ? `0${m}` : m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Năm</label>
              <select
                value={newYear}
                onChange={e => setNewYear(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
              </select>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-600">
            Mã kỳ dự kiến: <strong>NB-{newYear}-{String(newMonth).padStart(2, '0')}</strong>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              onClick={handleCreatePeriod}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
            >
              Xác nhận mở kỳ
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
