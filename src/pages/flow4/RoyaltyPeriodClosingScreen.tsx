import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/common/Header';
import { Modal } from '../../components/common/Modal';
import { formatMoney, formatDate, RoyaltyPeriod } from '../../types';
import {
  FileSpreadsheet,
  Lock,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  ExternalLink,
  Info,
  Calendar,
  Layers,
  ArrowLeft,
  Coins
} from 'lucide-react';

export const RoyaltyPeriodClosingScreen: React.FC = () => {
  const { id: paramPeriodId } = useParams<{ id: string }>();
  const { state, dispatch, notify, getUser, getGenre } = useApp();
  const navigate = useNavigate();

  // Chọn kỳ: ưu tiên paramPeriodId hoặc kỳ đang mở/chốt
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(
    paramPeriodId || state.royaltyPeriods.find(p => p.status === 'OPEN' || p.status === 'DANG_CHAM')?.id || state.royaltyPeriods[0]?.id || ''
  );

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [closeNote, setCloseNote] = useState('');

  const currentPeriod = state.royaltyPeriods.find(p => p.id === selectedPeriodId);

  // Lấy các bài xuất bản trong tháng của kỳ này
  const publishedArticlesInMonth = useMemo(() => {
    if (!currentPeriod) return [];
    return state.articles.filter(a => {
      if (a.status !== 'PUBLISHED' || !a.published_at) return false;
      const pubDate = new Date(a.published_at.replace(' ', 'T'));
      return pubDate.getMonth() + 1 === currentPeriod.month && pubDate.getFullYear() === currentPeriod.year;
    });
  }, [state.articles, currentPeriod]);

  // Lấy các dòng nhuận bút thuộc kỳ này
  const linesInPeriod = useMemo(() => {
    return state.royaltyLines.filter(l => l.period_id === selectedPeriodId);
  }, [state.royaltyLines, selectedPeriodId]);

  // Các bài đã có ít nhất 1 dòng nhuận bút trong kỳ
  const gradedArticleIds = useMemo(() => {
    return new Set(linesInPeriod.map(l => l.article_id));
  }, [linesInPeriod]);

  // Bài xuất bản trong tháng nhưng chưa được chấm
  const unGradedArticles = useMemo(() => {
    return publishedArticlesInMonth.filter(a => !gradedArticleIds.has(a.id));
  }, [publishedArticlesInMonth, gradedArticleIds]);

  // Tổng hợp tiền
  const totalAmount = linesInPeriod.reduce((sum, l) => sum + l.amount, 0);
  const articleAmount = linesInPeriod.filter(l => l.line_type === 'ARTICLE').reduce((sum, l) => sum + l.amount, 0);
  const mediaAmount = linesInPeriod.filter(l => l.line_type === 'MEDIA').reduce((sum, l) => sum + l.amount, 0);
  const adjustmentAmount = linesInPeriod.filter(l => l.line_type === 'ADJUSTMENT').reduce((sum, l) => sum + l.amount, 0);

  const isClosed = currentPeriod?.status === 'CLOSED';
  const isLocked = currentPeriod?.status === 'LOCKED';
  const isPaid = currentPeriod?.status === 'PAID' || currentPeriod?.status === 'DA_CHI';
  const isOpen = currentPeriod?.status === 'OPEN' || currentPeriod?.status === 'DANG_CHAM';

  // Điều kiện chốt: Phải có ít nhất 1 bài, không còn bài nào chưa chấm, và kỳ đang OPEN
  const canClose = isOpen && unGradedArticles.length === 0 && linesInPeriod.length > 0;

  const handleClosePeriod = () => {
    if (!currentPeriod || !canClose) return;

    dispatch({
      type: 'CLOSE_PERIOD',
      payload: { periodId: currentPeriod.id, note: closeNote }
    });

    notify(`Đã chốt kỳ nhuận bút tháng ${currentPeriod.month}/${currentPeriod.year} và gửi cho Kế toán thẩm định!`, 'success');
    setConfirmModalOpen(false);
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
            title={`Bảng chấm & chốt kỳ nhuận bút: Tháng ${String(currentPeriod?.month || 0).padStart(2, '0')}/${currentPeriod?.year || 2026}`}
            subtitle="Thư ký tòa soạn tổng hợp toàn bộ các dòng nhuận bút và chốt kỳ chuyển Kế toán"
            icon={FileSpreadsheet}
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
                navigate(`/secretary/royalty-periods/${e.target.value}`);
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

          {/* Nút chốt kỳ */}
          {isOpen && (
            <button
              onClick={() => setConfirmModalOpen(true)}
              disabled={!canClose}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm shadow-sm transition ${
                canClose
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
              title={
                unGradedArticles.length > 0
                  ? `Còn ${unGradedArticles.length} bài đã đăng chưa được chấm nhuận bút!`
                  : linesInPeriod.length === 0
                  ? 'Kỳ chưa có dòng nhuận bút nào'
                  : 'Chốt kỳ gửi Kế toán thẩm định'
              }
            >
              <CheckCircle2 className="w-4 h-4" />
              Chốt kỳ nhuận bút gửi Kế toán
            </button>
          )}

          {isClosed && (
            <span className="px-3 py-1.5 rounded-lg font-semibold text-xs bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600" />
              Đã chốt – Đang chờ Kế toán khóa
            </span>
          )}

          {isLocked && (
            <span className="px-3 py-1.5 rounded-lg font-semibold text-xs bg-indigo-100 text-indigo-900 border border-indigo-300 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-indigo-600" />
              Kế toán đã khóa – Đã lập phiếu chi
            </span>
          )}

          {isPaid && (
            <span className="px-3 py-1.5 rounded-lg font-semibold text-xs bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Đã hoàn tất chi trả
            </span>
          )}
        </div>
      </div>

      {/* Cảnh báo chưa chấm hết bài */}
      {unGradedArticles.length > 0 && isOpen && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl shadow-sm flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-bold text-amber-900">
                Chưa thể chốt kỳ: Còn {unGradedArticles.length} bài viết đã xuất bản trong tháng chưa được chấm nhuận bút!
              </div>
              <div className="text-xs text-amber-700 mt-1">
                Theo quy chế tòa soạn, Thư ký chỉ được phép chốt kỳ nhuận bút khi 100% các bài xuất bản trong kỳ đã hoàn tất chấm thù lao bài và ảnh/video.
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {unGradedArticles.map(a => (
                  <button
                    key={a.id}
                    onClick={() => navigate(`/secretary/royalty-form/${a.id}`)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white border border-amber-300 text-xs font-medium text-amber-900 hover:bg-amber-100"
                  >
                    <span>{a.title}</span>
                    <ArrowRight className="w-3 h-3 text-amber-600" />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate('/secretary/royalty-queue')}
            className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700 flex-shrink-0"
          >
            Đến Hàng chờ chấm
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng kinh phí kỳ</div>
          <div className="text-2xl font-black text-indigo-700 mt-1">{formatMoney(totalAmount)}</div>
          <div className="text-xs text-slate-400 mt-1">{linesInPeriod.length} dòng thù lao</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-sky-600 uppercase tracking-wider">Nhuận bút bài viết</div>
          <div className="text-xl font-bold text-sky-900 mt-1">{formatMoney(articleAmount)}</div>
          <div className="text-xs text-slate-400 mt-1">Tác giả & đồng tác giả</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Thù lao Media</div>
          <div className="text-xl font-bold text-purple-900 mt-1">{formatMoney(mediaAmount)}</div>
          <div className="text-xs text-slate-400 mt-1">Ảnh, video tự sản xuất</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Điều chỉnh khiếu nại</div>
          <div className="text-xl font-bold text-amber-900 mt-1">{formatMoney(adjustmentAmount)}</div>
          <div className="text-xs text-slate-400 mt-1">Tự động sau phúc khảo</div>
        </div>
      </div>

      {/* Bảng các dòng nhuận bút của kỳ */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Coins className="w-4 h-4 text-indigo-600" />
            Chi tiết các dòng nhuận bút trong kỳ (Royalty Lines)
          </div>
          <span className="text-xs text-slate-500">
            Dòng nền vàng nhạt là <strong>Dòng điều chỉnh</strong> tự động sau khiếu nại chất lượng.
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-100 text-slate-700 text-xs uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5 text-center w-12">STT</th>
                <th className="px-4 py-3.5">Bài viết</th>
                <th className="px-4 py-3.5">Người nhận / Tác giả</th>
                <th className="px-4 py-3.5 text-center">Loại thù lao</th>
                <th className="px-4 py-3.5 text-center">Hệ số</th>
                <th className="px-4 py-3.5 text-right">Đơn giá</th>
                <th className="px-4 py-3.5 text-right">Thành tiền (VNĐ)</th>
                <th className="px-4 py-3.5">Ghi chú & Căn cứ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {linesInPeriod.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    Chưa có dòng nhuận bút nào được chấm trong kỳ này.
                  </td>
                </tr>
              ) : (
                linesInPeriod.map((line, idx) => {
                  const art = state.articles.find(a => a.id === line.article_id);
                  const user = getUser(line.recipient_id);
                  const isAdjustment = line.is_adjustment || line.line_type === 'ADJUSTMENT';

                  return (
                    <tr
                      key={line.id}
                      className={
                        isAdjustment
                          ? 'bg-amber-50/70 hover:bg-amber-100/60 border-l-4 border-l-amber-500 transition'
                          : 'hover:bg-slate-50/80 transition'
                      }
                    >
                      <td className="px-4 py-3.5 text-center text-slate-500 text-xs font-mono font-medium">
                        {idx + 1}
                      </td>

                      <td className="px-4 py-3.5 max-w-xs">
                        <div className="font-semibold text-slate-900 line-clamp-1">
                          {art?.title || 'Bài viết'}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Mã: <span className="font-mono">{line.article_id}</span>
                          {art?.published_at && ` · Đăng: ${art.published_at.split(' ')[0]}`}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-800">
                          {user?.full_name || 'Phóng viên'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {user?.department || 'Tòa soạn'}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        {isAdjustment ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-200 text-amber-900 border border-amber-300">
                            Điều chỉnh
                          </span>
                        ) : line.line_type === 'ARTICLE' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-sky-100 text-sky-800">
                            Bài viết
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            Ảnh / Media
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-center font-bold text-slate-700">
                        {line.factor}
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono text-xs text-slate-600">
                        {formatMoney(line.unit_price)}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div
                          className={`font-black text-sm ${
                            isAdjustment
                              ? 'text-amber-800'
                              : 'text-indigo-700'
                          }`}
                        >
                          {isAdjustment && line.amount > 0 ? `+${formatMoney(line.amount)}` : formatMoney(line.amount)}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-xs text-slate-600">
                        <div>{line.note || '—'}</div>
                        {isAdjustment && line.original_period_id && (
                          <div className="mt-1 font-semibold text-indigo-700 flex items-center gap-1">
                            <span>↳ dòng gốc {line.original_period_name || line.original_period_id}</span>
                            <span className="text-[10px] text-slate-400">({line.original_line_id})</span>
                          </div>
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

      {/* Modal xác nhận chốt kỳ */}
      <Modal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="Xác nhận chốt kỳ nhuận bút gửi Kế toán"
      >
        <div className="space-y-4">
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-sm text-amber-900 space-y-2">
            <div className="font-bold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-amber-600" />
              Chốt kỳ tháng {currentPeriod?.month}/{currentPeriod?.year}
            </div>
            <p className="text-xs text-amber-800">
              Tổng kinh phí dự kiến: <strong>{formatMoney(totalAmount)} VNĐ</strong> ({linesInPeriod.length} dòng thù lao).
            </p>
            <p className="text-xs text-amber-700">
              Sau khi chốt, kỳ chuyển sang trạng thái <strong>CLOSED</strong> để Kế toán kiểm tra, đối soát và khóa kỳ lập phiếu chi. Thư ký sẽ không được chỉnh sửa trừ khi Kế toán trả về.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ghi chú gửi Kế toán (tùy chọn)
            </label>
            <textarea
              value={closeNote}
              onChange={e => setCloseNote(e.target.value)}
              placeholder="VD: Đã hoàn tất chấm toàn bộ bài xuất bản, các dòng điều chỉnh khiếu nại đã đối soát xong..."
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              onClick={() => setConfirmModalOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              onClick={handleClosePeriod}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-semibold shadow-sm"
            >
              Xác nhận chốt kỳ
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
