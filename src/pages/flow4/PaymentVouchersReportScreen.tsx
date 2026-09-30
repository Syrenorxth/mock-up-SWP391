import React, { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/common/Header';
import { Modal } from '../../components/common/Modal';
import { PaymentVoucher, formatMoney, formatDate } from '../../types';
import {
  CreditCard,
  Printer,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building,
  User,
  Calendar,
  FileSpreadsheet,
  Download,
  AlertCircle,
  Eye,
  Check
} from 'lucide-react';

export const PaymentVouchersReportScreen: React.FC = () => {
  const [searchParams] = useSearchParams();
  const queryPeriodId = searchParams.get('period');
  const { state, dispatch, notify, getUser } = useApp();
  const navigate = useNavigate();

  // Chọn kỳ: ưu tiên param URL hoặc kỳ LOCKED / PAID / CLOSED gần nhất
  const eligiblePeriods = state.royaltyPeriods.filter(
    p => p.status === 'LOCKED' || p.status === 'PAID' || p.status === 'CLOSED' || p.status === 'DA_CHI'
  );
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(
    queryPeriodId || eligiblePeriods[0]?.id || state.royaltyPeriods[0]?.id || ''
  );

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [targetVoucher, setTargetVoucher] = useState<PaymentVoucher | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CHUYEN_KHOAN' | 'TIEN_MAT'>('CHUYEN_KHOAN');
  const [printVoucher, setPrintVoucher] = useState<PaymentVoucher | null>(null);

  const currentPeriod = state.royaltyPeriods.find(p => p.id === selectedPeriodId);

  // Lấy các phiếu chi của kỳ này
  const vouchers = useMemo(() => {
    return state.paymentVouchers.filter(v => v.period_id === selectedPeriodId);
  }, [state.paymentVouchers, selectedPeriodId]);

  const totalVoucherAmount = vouchers.reduce((sum, v) => sum + (v.amount ?? 0), 0);
  const totalArticleAmount = vouchers.reduce((sum, v) => sum + (v.article_amount ?? 0), 0);
  const totalMediaAmount = vouchers.reduce((sum, v) => sum + (v.media_amount ?? 0), 0);
  const totalAdjustmentAmount = vouchers.reduce((sum, v) => sum + (v.adjustment_amount ?? 0), 0);
  const paidCount = vouchers.filter(v => v.status === 'DA_CHI' || v.is_paid).length;
  const unpaidCount = vouchers.length - paidCount;

  // Xác nhận chi một phiếu
  const handleOpenPayment = (v: PaymentVoucher) => {
    setTargetVoucher(v);
    setPaymentModalOpen(true);
  };

  const handleConfirmPayment = () => {
    if (!targetVoucher) return;
    dispatch({
      type: 'PAY_VOUCHER',
      payload: {
        voucherId: targetVoucher.id,
        paymentMethod
      }
    });

    notify(`Đã xác nhận chi trả cho phiếu ${targetVoucher.voucher_no || targetVoucher.id} thành công!`, 'success');
    setPaymentModalOpen(false);
    setTargetVoucher(null);
  };

  // Chi trả toàn bộ kỳ
  const handlePayAll = () => {
    if (!currentPeriod || unpaidCount === 0) return;
    dispatch({
      type: 'PAY_ALL_PERIOD_VOUCHERS',
      payload: { periodId: currentPeriod.id }
    });
    notify(`Đã xác nhận chi trả toàn bộ ${unpaidCount} phiếu chi của kỳ tháng ${currentPeriod.month}/${currentPeriod.year}. Kỳ đã hoàn tất thanh toán (PAID)!`, 'success');
  };

  const getWarningBadge = (voucher: PaymentVoucher) => {
    const days = voucher.days_since_published ?? 12;
    if (voucher.is_paid || voucher.status === 'DA_CHI') {
      return (
        <span className="text-[11px] text-slate-500 font-mono">
          Đăng {days} ngày trước
        </span>
      );
    }
    if (days > 60 || voucher.deadline_warning === 'OVERDUE_60') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
          <AlertCircle className="w-3 h-3 text-rose-600" />
          Quá hạn chi ({days} ngày)
        </span>
      );
    }
    if (days >= 45 || voucher.deadline_warning === 'WARNING_45') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
          <AlertTriangle className="w-3 h-3 text-amber-600" />
          Sắp đến hạn chi ({days}/60 ngày)
        </span>
      );
    }
    return (
      <span className="text-[11px] text-slate-500 font-mono">
        Hạn chi 60 ngày ({days}/60)
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="Phiếu chi & Ghi nhận đã chi"
          subtitle="Quản lý phiếu chi thù lao cá nhân, đối soát ngân hàng và xác nhận giải ngân (Kế toán)"
          icon={CreditCard}
        />

        <div className="flex items-center gap-3">
          {/* Bộ chọn kỳ */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-300 shadow-sm text-sm">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-500 font-medium">Chọn kỳ:</span>
            <select
              value={selectedPeriodId}
              onChange={e => setSelectedPeriodId(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 text-sm focus:outline-none"
            >
              {state.royaltyPeriods.map(p => (
                <option key={p.id} value={p.id}>
                  Tháng {String(p.month).padStart(2, '0')}/{p.year} ({p.status})
                </option>
              ))}
            </select>
          </div>

          {/* Nút Chi tất cả */}
          {unpaidCount > 0 && (
            <button
              onClick={handlePayAll}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-sm shadow-sm transition"
            >
              <Check className="w-4 h-4" />
              Chi trả toàn bộ ({unpaidCount} phiếu)
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng kinh phí chi</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{formatMoney(totalVoucherAmount)}</div>
          <div className="text-xs text-slate-400 mt-1">{vouchers.length} phiếu chi cá nhân</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-sky-600 uppercase tracking-wider">Nhuận bút bài viết</div>
          <div className="text-xl font-bold text-sky-900 mt-1">{formatMoney(totalArticleAmount)}</div>
          <div className="text-xs text-slate-400 mt-1">Đã phân bổ theo tỷ lệ</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Thù lao Media</div>
          <div className="text-xl font-bold text-purple-900 mt-1">{formatMoney(totalMediaAmount)}</div>
          <div className="text-xs text-slate-400 mt-1">Ảnh, video tự sản xuất</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Tiến độ chi trả</div>
          <div className="text-xl font-bold text-emerald-800 mt-1">
            {paidCount} / {vouchers.length} phiếu
          </div>
          <div className="text-xs text-emerald-600 mt-1">
            {paidCount === vouchers.length && vouchers.length > 0 ? '✓ Đã hoàn tất 100%' : `Còn ${unpaidCount} phiếu chưa chi`}
          </div>
        </div>
      </div>

      {/* Banner ghi chú quy tắc tài chính */}
      <div className="bg-gradient-to-r from-slate-50 to-indigo-50/50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Building className="w-4 h-4 text-indigo-600 flex-shrink-0" />
          <span>
            <strong>Quy tắc chi trả [NĐ & Tài chính]:</strong> Phiếu chi không bao giờ âm. Hạn chi tối đa 60 ngày kể từ ngày bài xuất bản. Điều chỉnh âm lớn hơn số tiền trong kỳ thì phiếu chi = 0 đ, phần thiếu chuyển sang kỳ sau.
          </span>
        </div>
        {currentPeriod?.status === 'PAID' && (
          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg border border-emerald-300 flex-shrink-0">
            ✓ Kỳ đã chi trả hoàn tất (PAID)
          </span>
        )}
      </div>

      {/* Bảng danh sách phiếu chi */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">Số phiếu chi</th>
                <th className="px-4 py-3.5">Người thụ hưởng</th>
                <th className="px-4 py-3.5">Tài khoản ngân hàng</th>
                <th className="px-4 py-3.5 text-right">Tiền bài</th>
                <th className="px-4 py-3.5 text-right">Tiền Media</th>
                <th className="px-4 py-3.5 text-right">Điều chỉnh (+/-)</th>
                <th className="px-4 py-3.5 text-right">Số tiền thực chi</th>
                <th className="px-4 py-3.5 text-center">Hạn chi [NĐ]</th>
                <th className="px-4 py-3.5 text-center">Trạng thái</th>
                <th className="px-4 py-3.5 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {vouchers.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-slate-400">
                    Kỳ này chưa có phiếu chi nào. Kỳ cần được Kế toán <strong>Khóa kỳ (LOCKED)</strong> để hệ thống tự động lập phiếu chi!
                  </td>
                </tr>
              ) : (
                vouchers.map(v => {
                  const user = getUser(v.recipient_id || v.user_id);
                  const isPaid = v.status === 'DA_CHI' || v.is_paid;
                  const bank = v.bank_account_info || { account_number: '—', bank_name: '—', account_name: '—' };
                  const hasCarriedForward = (v.carried_forward ?? 0) > 0;

                  return (
                    <tr key={v.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3.5">
                        <div className="font-mono font-bold text-slate-900 text-xs">
                          {v.voucher_no || v.id}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {v.payment_method === 'TIEN_MAT' ? 'Tiền mặt' : 'Chuyển khoản'}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900">{user?.full_name || 'Phóng viên'}</div>
                        <div className="text-xs text-slate-500">{user?.email}</div>
                      </td>

                      <td className="px-4 py-3.5 text-xs">
                        <div className="font-mono font-semibold text-slate-800">{bank.account_number}</div>
                        <div className="text-[11px] text-slate-500">{bank.bank_name}</div>
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono text-xs text-slate-700">
                        {formatMoney(v.article_amount ?? 0)}
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono text-xs text-slate-700">
                        {formatMoney(v.media_amount ?? 0)}
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono text-xs">
                        {(v.adjustment_amount ?? 0) !== 0 ? (
                          <span
                            className={
                              (v.adjustment_amount ?? 0) > 0
                                ? 'text-amber-700 font-bold'
                                : 'text-rose-600 font-bold'
                            }
                          >
                            {(v.adjustment_amount ?? 0) > 0 ? `+${formatMoney(v.adjustment_amount ?? 0)}` : formatMoney(v.adjustment_amount ?? 0)}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="font-black text-indigo-700 text-base">
                          {formatMoney(v.amount)}
                        </div>
                        {hasCarriedForward && (
                          <div className="text-[10px] font-bold text-rose-600">
                            Chuyển kỳ sau: −{formatMoney(v.carried_forward ?? 0)}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        {getWarningBadge(v)}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Đã chi
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            Chưa chi
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {!isPaid ? (
                            <button
                              onClick={() => handleOpenPayment(v)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-semibold text-xs transition shadow-sm"
                            >
                              Xác nhận chi
                            </button>
                          ) : (
                            <span className="text-xs text-emerald-700 font-medium">
                              {v.paid_at ? v.paid_at.split(' ')[0] : 'Đã thanh toán'}
                            </span>
                          )}

                          <button
                            onClick={() => setPrintVoucher(v)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                            title="In phiếu chi (Mẫu 02-TT)"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Xác nhận chi */}
      <Modal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title="Xác nhận chi trả nhuận bút"
      >
        {targetVoucher && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Số phiếu chi:</span>
                <span className="font-mono font-bold text-slate-800">{targetVoucher.voucher_no || targetVoucher.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Người thụ hưởng:</span>
                <span className="font-bold text-slate-900">{getUser(targetVoucher.recipient_id || targetVoucher.user_id)?.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Số tài khoản:</span>
                <span className="font-mono">{targetVoucher.bank_account_info?.account_number || '0011002345678'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ngân hàng:</span>
                <span>{targetVoucher.bank_account_info?.bank_name || 'Vietcombank'}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 text-base">
                <span className="font-bold text-slate-800">Số tiền giải ngân:</span>
                <span className="font-black text-indigo-700">{formatMoney(targetVoucher.amount)} VNĐ</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phương thức thanh toán</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CHUYEN_KHOAN')}
                  className={`p-3 rounded-xl border text-sm font-semibold text-center transition ${
                    paymentMethod === 'CHUYEN_KHOAN'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500'
                      : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Chuyển khoản Ngân hàng
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('TIEN_MAT')}
                  className={`p-3 rounded-xl border text-sm font-semibold text-center transition ${
                    paymentMethod === 'TIEN_MAT'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500'
                      : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Tiền mặt tại Thủ quỹ
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                onClick={() => setPaymentModalOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmPayment}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm"
              >
                Xác nhận đã giải ngân
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Mẫu in phiếu chi (Mẫu 02-TT - BỎ dòng khấu trừ thuế TNCN 10%) */}
      <Modal
        isOpen={!!printVoucher}
        onClose={() => setPrintVoucher(null)}
        title="Phiếu chi thù lao / nhuận bút (Mẫu 02-TT)"
      >
        {printVoucher && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-slate-300 text-slate-900 font-serif shadow-inner">
              <div className="flex justify-between items-start border-b border-slate-200 pb-4 text-xs">
                <div>
                  <div className="font-bold uppercase tracking-wider">TÒA SOẠN BÁO ĐIỆN TỬ</div>
                  <div>Phòng Kế toán – Tài vụ</div>
                </div>
                <div className="text-right">
                  <div className="font-bold">Mẫu số 02 - TT</div>
                  <div className="text-slate-500">(Ban hành theo Thông tư 200/2014/TT-BTC)</div>
                  <div className="font-mono mt-1 font-semibold">Quyển số: 01 · Số: {printVoucher.voucher_no || printVoucher.id}</div>
                </div>
              </div>

              <div className="text-center my-6">
                <h2 className="text-xl font-black uppercase tracking-wide">PHIẾU CHI NHUẬN BÚT</h2>
                <div className="text-xs italic text-slate-600 mt-1">
                  Kỳ thanh toán: Tháng {currentPeriod?.month}/{currentPeriod?.year}
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex">
                  <span className="w-44 text-slate-600">Họ và tên người nhận:</span>
                  <span className="font-bold">{getUser(printVoucher.recipient_id || printVoucher.user_id)?.full_name}</span>
                </div>
                <div className="flex">
                  <span className="w-44 text-slate-600">Đơn vị / Ban:</span>
                  <span>{getUser(printVoucher.recipient_id || printVoucher.user_id)?.department || 'Ban Xã hội'}</span>
                </div>
                <div className="flex">
                  <span className="w-44 text-slate-600">Lý do chi:</span>
                  <span>{printVoucher.note}</span>
                </div>
                <div className="flex">
                  <span className="w-44 text-slate-600">Tiền bài viết:</span>
                  <span className="font-mono">{formatMoney(printVoucher.article_amount ?? printVoucher.amount)} đ</span>
                </div>
                <div className="flex">
                  <span className="w-44 text-slate-600">Thù lao Media:</span>
                  <span className="font-mono">{formatMoney(printVoucher.media_amount ?? 0)} đ</span>
                </div>
                {(printVoucher.adjustment_amount ?? 0) !== 0 && (
                  <div className="flex">
                    <span className="w-44 text-slate-600">Điều chỉnh sau khiếu nại:</span>
                    <span className="font-mono font-bold text-amber-800">
                      {(printVoucher.adjustment_amount ?? 0) > 0 ? `+${formatMoney(printVoucher.adjustment_amount ?? 0)}` : formatMoney(printVoucher.adjustment_amount ?? 0)} đ
                    </span>
                  </div>
                )}
                <div className="flex pt-2 border-t border-slate-200">
                  <span className="w-44 font-bold text-slate-800">Tổng số tiền thực nhận:</span>
                  <span className="font-black text-lg text-indigo-900 font-mono">
                    {formatMoney(printVoucher.amount)} VNĐ
                  </span>
                </div>
                <div className="text-xs italic text-slate-600 pt-1">
                  (Thanh toán qua tài khoản ngân hàng của người nhận)
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 text-center mt-8 pt-4 text-xs font-semibold">
                <div>
                  <div>Thủ trưởng đơn vị</div>
                  <div className="text-slate-400 font-normal italic mt-12">(Ký, họ tên)</div>
                </div>
                <div>
                  <div>Kế toán trưởng</div>
                  <div className="text-slate-400 font-normal italic mt-12">(Ký, họ tên)</div>
                </div>
                <div>
                  <div>Thủ quỹ</div>
                  <div className="text-slate-400 font-normal italic mt-12">(Ký, họ tên)</div>
                </div>
                <div>
                  <div>Người nhận tiền</div>
                  <div className="text-slate-400 font-normal italic mt-12">(Ký, họ tên)</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setPrintVoucher(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm hover:bg-slate-50"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  window.print();
                  notify('Đang gửi lệnh in phiếu chi...', 'info');
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700"
              >
                <Printer className="w-4 h-4" />
                In phiếu
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
