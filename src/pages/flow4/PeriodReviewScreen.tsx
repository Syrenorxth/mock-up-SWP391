import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/common/Header';
import { Modal } from '../../components/common/Modal';
import { formatMoney, formatDate, RoyaltyPeriod } from '../../types';
import {
  FileCheck,
  Lock,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Users,
  FileSpreadsheet,
  Calendar,
  CreditCard,
  Building,
  ArrowRight
} from 'lucide-react';

export const PeriodReviewScreen: React.FC = () => {
  const { id: paramPeriodId } = useParams<{ id: string }>();
  const { state, dispatch, notify, getUser } = useApp();
  const navigate = useNavigate();

  // Chọn kỳ: ưu tiên paramPeriodId hoặc kỳ CLOSED
  const defaultPeriodId = paramPeriodId || state.royaltyPeriods.find(p => p.status === 'CLOSED')?.id || state.royaltyPeriods[0]?.id || '';
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(defaultPeriodId);

  const [activeTab, setActiveTab] = useState<'BY_RECIPIENT' | 'BY_ARTICLE'>('BY_RECIPIENT');
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [lockModalOpen, setLockModalOpen] = useState(false);

  const currentPeriod = state.royaltyPeriods.find(p => p.id === selectedPeriodId);

  // Lấy các dòng nhuận bút trong kỳ
  const linesInPeriod = useMemo(() => {
    return state.royaltyLines.filter(l => l.period_id === selectedPeriodId);
  }, [state.royaltyLines, selectedPeriodId]);

  // Nhóm theo người thụ hưởng
  const recipientSummary = useMemo(() => {
    const map: Record<string, {
      userId: string;
      articleAmount: number;
      mediaAmount: number;
      adjustmentAmount: number;
      total: number;
      articleCount: number;
    }> = {};

    linesInPeriod.forEach(l => {
      if (!map[l.recipient_id]) {
        map[l.recipient_id] = {
          userId: l.recipient_id,
          articleAmount: 0,
          mediaAmount: 0,
          adjustmentAmount: 0,
          total: 0,
          articleCount: 0
        };
      }
      const rec = map[l.recipient_id];
      if (l.line_type === 'ARTICLE') {
        rec.articleAmount += l.amount;
        rec.articleCount += 1;
      } else if (l.line_type === 'MEDIA') {
        rec.mediaAmount += l.amount;
      } else if (l.line_type === 'ADJUSTMENT') {
        rec.adjustmentAmount += l.amount;
      }
      rec.total += l.amount;
    });

    return Object.values(map);
  }, [linesInPeriod]);

  // Tổng kinh phí
  const totalAmount = linesInPeriod.reduce((sum, l) => sum + l.amount, 0);
  const totalArticle = linesInPeriod.filter(l => l.line_type === 'ARTICLE').reduce((sum, l) => sum + l.amount, 0);
  const totalMedia = linesInPeriod.filter(l => l.line_type === 'MEDIA').reduce((sum, l) => sum + l.amount, 0);
  const totalAdjustment = linesInPeriod.filter(l => l.line_type === 'ADJUSTMENT').reduce((sum, l) => sum + l.amount, 0);

  const isClosed = currentPeriod?.status === 'CLOSED';
  const isLocked = currentPeriod?.status === 'LOCKED';
  const isPaid = currentPeriod?.status === 'PAID' || currentPeriod?.status === 'DA_CHI';
  const isOpen = currentPeriod?.status === 'OPEN' || currentPeriod?.status === 'DANG_CHAM';

  // Thao tác Trả về Thư ký
  const handleReturnPeriod = () => {
    if (!returnReason.trim()) {
      notify('Bắt buộc phải nhập lý do trả về!', 'error');
      return;
    }
    if (!currentPeriod) return;

    dispatch({
      type: 'RETURN_PERIOD',
      payload: { periodId: currentPeriod.id, reason: returnReason.trim() }
    });

    notify(`Đã trả lại kỳ tháng ${currentPeriod.month}/${currentPeriod.year} về Thư ký để rà soát!`, 'info');
    setReturnModalOpen(false);
    setReturnReason('');
  };

  // Thao tác Khóa kỳ & Lập phiếu chi
  const handleLockPeriod = () => {
    if (!currentPeriod) return;

    dispatch({
      type: 'LOCK_PERIOD',
      payload: { periodId: currentPeriod.id }
    });

    notify(`Đã khóa kỳ nhuận bút tháng ${currentPeriod.month}/${currentPeriod.year} và sinh các phiếu chi thành công!`, 'success');
    setLockModalOpen(false);
    navigate(`/accounting/vouchers?period=${currentPeriod.id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/royalty/periods')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Quay lại danh sách kỳ
          </button>
          <PageHeader
            title={`Kiểm tra báo cáo kỳ: Tháng ${String(currentPeriod?.month || 0).padStart(2, '0')}/${currentPeriod?.year || 2026}`}
            subtitle="Kế toán thẩm định dự toán thù lao, đối soát trước khi khóa kỳ và phát hành phiếu chi"
            icon={FileCheck}
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Bộ chọn kỳ */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-300 shadow-sm text-sm">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-500 font-medium">Chọn kỳ:</span>
            <select
              value={selectedPeriodId}
              onChange={e => {
                setSelectedPeriodId(e.target.value);
                navigate(`/accounting/periods/${e.target.value}`);
              }}
              className="bg-transparent font-semibold text-slate-800 text-sm focus:outline-none"
            >
              {state.royaltyPeriods.map(p => (
                <option key={p.id} value={p.id}>
                  Tháng {String(p.month).padStart(2, '0')}/{p.year} ({p.status})
                </option>
              ))}
            </select>
          </div>

          {/* Các nút hành động của Kế toán */}
          {isClosed && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setReturnModalOpen(true)}
                className="px-3.5 py-2 rounded-lg border border-rose-300 text-rose-700 bg-rose-50 hover:bg-rose-100 font-semibold text-sm transition flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                Trả về Thư ký
              </button>

              <button
                onClick={() => setLockModalOpen(true)}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition flex items-center gap-1.5 shadow-sm"
              >
                <Lock className="w-4 h-4" />
                Khóa kỳ nhuận bút
              </button>
            </div>
          )}

          {isLocked && (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-lg font-semibold text-xs bg-indigo-100 text-indigo-900 border border-indigo-300 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-indigo-600" />
                Kỳ đã khóa
              </span>
              <button
                onClick={() => navigate(`/accounting/vouchers?period=${currentPeriod?.id}`)}
                className="px-3.5 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm"
              >
                <CreditCard className="w-4 h-4" /> Xem phiếu chi
              </button>
            </div>
          )}

          {isPaid && (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-lg font-semibold text-xs bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Kỳ đã chi trả xong
              </span>
              <button
                onClick={() => navigate(`/accounting/vouchers?period=${currentPeriod?.id}`)}
                className="px-3.5 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1"
              >
                <CreditCard className="w-4 h-4" /> Lịch sử phiếu chi
              </button>
            </div>
          )}

          {isOpen && (
            <span className="px-3 py-1.5 rounded-lg font-semibold text-xs bg-sky-100 text-sky-900 border border-sky-300">
              Kỳ đang mở (Thư ký đang chấm)
            </span>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng dự kiến chi</div>
          <div className="text-2xl font-black text-indigo-700 mt-1">{formatMoney(totalAmount)}</div>
          <div className="text-xs text-slate-400 mt-1">{recipientSummary.length} người thụ hưởng</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-sky-600 uppercase tracking-wider">Nhuận bút bài viết</div>
          <div className="text-xl font-bold text-sky-900 mt-1">{formatMoney(totalArticle)}</div>
          <div className="text-xs text-slate-400 mt-1">Tính theo đơn giá lương cơ sở</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Thù lao ảnh / video</div>
          <div className="text-xl font-bold text-purple-900 mt-1">{formatMoney(totalMedia)}</div>
          <div className="text-xs text-slate-400 mt-1">Ảnh/video tự quay chụp mới</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Chênh lệch điều chỉnh</div>
          <div className="text-xl font-bold text-amber-900 mt-1">{formatMoney(totalAdjustment)}</div>
          <div className="text-xs text-slate-400 mt-1">Điều chỉnh tự động sau khiếu nại</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => setActiveTab('BY_RECIPIENT')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'BY_RECIPIENT'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users className="w-4 h-4" />
          1. Tổng hợp theo Người thụ hưởng ({recipientSummary.length})
        </button>

        <button
          onClick={() => setActiveTab('BY_ARTICLE')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'BY_ARTICLE'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          2. Chi tiết từng Dòng nhuận bút ({linesInPeriod.length})
        </button>
      </div>

      {/* Tab 1: Tổng hợp theo người thụ hưởng */}
      {activeTab === 'BY_RECIPIENT' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-4 w-12 text-center">STT</th>
                  <th className="px-5 py-4">Người thụ hưởng</th>
                  <th className="px-5 py-4">Ban / Đơn vị</th>
                  <th className="px-5 py-4 text-right">Tiền bài viết</th>
                  <th className="px-5 py-4 text-right">Tiền Media</th>
                  <th className="px-5 py-4 text-right">Điều chỉnh (+/-)</th>
                  <th className="px-5 py-4 text-right">Tổng thực nhận dự kiến</th>
                  <th className="px-5 py-4 text-center">Tài khoản ngân hàng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {recipientSummary.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-8 text-center text-slate-400">
                      Chưa có dữ liệu thù lao trong kỳ này.
                    </td>
                  </tr>
                ) : (
                  recipientSummary.map((rec, idx) => {
                    const user = getUser(rec.userId);
                    return (
                      <tr key={rec.userId} className="hover:bg-slate-50/80 transition">
                        <td className="px-5 py-4 text-center text-slate-400 text-xs font-mono">
                          {idx + 1}
                        </td>

                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-900">{user?.full_name || 'Phóng viên'}</div>
                          <div className="text-xs text-slate-500">{user?.email}</div>
                        </td>

                        <td className="px-5 py-4 text-slate-600 text-xs">
                          {user?.department || 'Tòa soạn'}
                        </td>

                        <td className="px-5 py-4 text-right font-mono text-slate-700">
                          {formatMoney(rec.articleAmount)}
                        </td>

                        <td className="px-5 py-4 text-right font-mono text-slate-700">
                          {formatMoney(rec.mediaAmount)}
                        </td>

                        <td className="px-5 py-4 text-right font-mono">
                          <span
                            className={
                              rec.adjustmentAmount > 0
                                ? 'text-amber-700 font-bold'
                                : rec.adjustmentAmount < 0
                                ? 'text-rose-600 font-bold'
                                : 'text-slate-400'
                            }
                          >
                            {rec.adjustmentAmount > 0 ? `+${formatMoney(rec.adjustmentAmount)}` : formatMoney(rec.adjustmentAmount)}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <div className="font-black text-indigo-700 text-base">
                            {formatMoney(rec.total)}
                          </div>
                          <div className="text-[10px] text-slate-400">VNĐ</div>
                        </td>

                        <td className="px-5 py-4 text-center text-xs font-mono text-slate-600">
                          <div>001100{rec.userId.replace(/[^0-9]/g, '1234')}</div>
                          <div className="text-[10px] text-slate-400">Vietcombank</div>
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

      {/* Tab 2: Chi tiết theo từng bài viết & dòng nhuận bút */}
      {activeTab === 'BY_ARTICLE' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3.5 text-center w-12">STT</th>
                  <th className="px-4 py-3.5">Bài viết</th>
                  <th className="px-4 py-3.5">Người nhận</th>
                  <th className="px-4 py-3.5 text-center">Loại thù lao</th>
                  <th className="px-4 py-3.5 text-center">Hệ số</th>
                  <th className="px-4 py-3.5 text-right">Đơn giá</th>
                  <th className="px-4 py-3.5 text-right">Thành tiền (VNĐ)</th>
                  <th className="px-4 py-3.5">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {linesInPeriod.map((line, idx) => {
                  const art = state.articles.find(a => a.id === line.article_id);
                  const user = getUser(line.recipient_id);
                  const isAdjustment = line.is_adjustment || line.line_type === 'ADJUSTMENT';

                  return (
                    <tr
                      key={line.id}
                      className={
                        isAdjustment
                          ? 'bg-amber-50/70 border-l-4 border-l-amber-500'
                          : 'hover:bg-slate-50/80 transition'
                      }
                    >
                      <td className="px-4 py-3.5 text-center text-slate-400 text-xs font-mono">
                        {idx + 1}
                      </td>

                      <td className="px-4 py-3.5 max-w-xs">
                        <div className="font-semibold text-slate-900 line-clamp-1">{art?.title || 'Bài viết'}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Mã: <span className="font-mono">{line.article_id}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-medium text-slate-800">
                        {user?.full_name || 'Phóng viên'}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        {isAdjustment ? (
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-200 text-amber-900">
                            Điều chỉnh
                          </span>
                        ) : line.line_type === 'ARTICLE' ? (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-sky-100 text-sky-800">
                            Bài viết
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            Media
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-center font-bold text-slate-700">
                        {line.factor}
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono text-xs text-slate-600">
                        {formatMoney(line.unit_price)}
                      </td>

                      <td className="px-4 py-3.5 text-right font-black text-slate-900">
                        {formatMoney(line.amount)}
                      </td>

                      <td className="px-4 py-3.5 text-xs text-slate-600">
                        {line.note || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Trả về Thư ký */}
      <Modal
        isOpen={returnModalOpen}
        onClose={() => setReturnModalOpen(false)}
        title="Trả lại kỳ nhuận bút về Thư ký"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Kế toán trả kỳ <strong>Tháng {currentPeriod?.month}/{currentPeriod?.year}</strong> về trạng thái <strong>OPEN</strong> để Thư ký điều chỉnh lại các bài viết hoặc hệ số.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Lý do trả về (bắt buộc) <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={returnReason}
              onChange={e => setReturnReason(e.target.value)}
              placeholder="VD: Cần kiểm tra lại tỷ lệ phân chia đồng tác giả bài viết X, thiếu thù lao ảnh bài Y..."
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              onClick={() => setReturnModalOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              onClick={handleReturnPeriod}
              disabled={!returnReason.trim()}
              className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                returnReason.trim()
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              Xác nhận trả về
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Khóa kỳ nhuận bút */}
      <Modal
        isOpen={lockModalOpen}
        onClose={() => setLockModalOpen(false)}
        title="Khóa kỳ nhuận bút & Lập phiếu chi"
      >
        <div className="space-y-4">
          <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200 text-sm text-indigo-950 space-y-2">
            <div className="font-bold flex items-center gap-2">
              <Lock className="w-5 h-5 text-indigo-600" />
              Khóa kỳ tháng {currentPeriod?.month}/{currentPeriod?.year}
            </div>
            <p className="text-xs text-indigo-800">
              Tổng số tiền chi trả: <strong>{formatMoney(totalAmount)} VNĐ</strong> cho {recipientSummary.length} người thụ hưởng.
            </p>
            <p className="text-xs text-indigo-700">
              Hệ thống sẽ tự động tổng hợp tiền bài, tiền ảnh/video, điều chỉnh chênh lệch và lập <strong>{recipientSummary.length} phiếu chi</strong> tương ứng. Kỳ sẽ chuyển sang trạng thái <strong>LOCKED (Đã khóa)</strong> và không thể chỉnh sửa.
            </p>
          </div>

          <div className="text-xs text-slate-500">
            Quy tắc tài chính: Phiếu chi không bao giờ âm. Nếu có cá nhân điều chỉnh âm lớn hơn số tiền được hưởng trong kỳ, số tiền âm sẽ được kết chuyển sang kỳ kế tiếp.
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              onClick={() => setLockModalOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              onClick={handleLockPeriod}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm"
            >
              Xác nhận khóa kỳ & Lập phiếu chi
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
