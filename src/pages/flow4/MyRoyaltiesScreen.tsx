import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/common/Header';
import { Modal } from '../../components/common/Modal';
import { formatMoney, formatDate, RoyaltyLine } from '../../types';
import {
  Wallet,
  Calendar,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  ExternalLink,
  Info,
  Building,
  Coins,
  ArrowRight,
  TrendingUp,
  Camera,
  FileText
} from 'lucide-react';

export const MyRoyaltiesScreen: React.FC = () => {
  const { state, currentUser, getUser, getGenre, getEffectiveScoreForArticle } = useApp();

  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('ALL');
  const [selectedAuditLine, setSelectedAuditLine] = useState<RoyaltyLine | null>(null);

  // Lấy các dòng nhuận bút của người dùng hiện tại
  const myLines = useMemo(() => {
    return state.royaltyLines.filter(l => l.recipient_id === currentUser.id);
  }, [state.royaltyLines, currentUser.id]);

  // Lọc theo kỳ
  const displayedLines = useMemo(() => {
    if (selectedPeriodId === 'ALL') return myLines;
    return myLines.filter(l => l.period_id === selectedPeriodId);
  }, [myLines, selectedPeriodId]);

  // Thống kê tổng quan
  const totalIncome = displayedLines.reduce((sum, l) => sum + l.amount, 0);
  const totalArticleAmt = displayedLines.filter(l => l.line_type === 'ARTICLE').reduce((sum, l) => sum + l.amount, 0);
  const totalMediaAmt = displayedLines.filter(l => l.line_type === 'MEDIA').reduce((sum, l) => sum + l.amount, 0);
  const totalAdjustmentAmt = displayedLines.filter(l => l.line_type === 'ADJUSTMENT').reduce((sum, l) => sum + l.amount, 0);

  // Kiểm tra trạng thái đã chi (qua phiếu chi của kỳ đó)
  const isLinePaid = (line: RoyaltyLine) => {
    const voucher = state.paymentVouchers.find(
      v => v.period_id === line.period_id && (v.recipient_id === line.recipient_id || v.user_id === line.recipient_id)
    );
    const period = state.royaltyPeriods.find(p => p.id === line.period_id);
    return voucher?.is_paid || voucher?.status === 'DA_CHI' || period?.status === 'PAID';
  };

  const paidAmount = displayedLines.filter(l => isLinePaid(l)).reduce((sum, l) => sum + l.amount, 0);
  const pendingAmount = totalIncome - paidAmount;

  // Lấy chi tiết bài viết và tác giả để hiển thị đối soát
  const getArticleDetails = (articleId: string) => {
    const art = state.articles.find(a => a.id === articleId);
    const authors = state.articleAuthors.filter(au => au.article_id === articleId);
    const myAuthorRecord = authors.find(au => au.user_id === currentUser.id);
    const effectiveScore = art ? getEffectiveScoreForArticle(art.id) : 78;
    const genre = art ? getGenre(art.category_id || art.genre_id) : null;
    return { art, authors, myAuthorRecord, effectiveScore, genre };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="Nhuận bút của tôi – Đối soát minh bạch"
          subtitle={`Thống kê chi tiết thù lao bài viết, phụ cấp ảnh/video và các khoản điều chỉnh (Phóng viên: ${currentUser.full_name})`}
          icon={Wallet}
        />

        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-300 shadow-sm text-sm">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">Chọn kỳ:</span>
          <select
            value={selectedPeriodId}
            onChange={e => setSelectedPeriodId(e.target.value)}
            className="bg-transparent font-semibold text-slate-800 text-sm focus:outline-none"
          >
            <option value="ALL">Tất cả các kỳ (Lũy kế)</option>
            {state.royaltyPeriods.map(p => (
              <option key={p.id} value={p.id}>
                Tháng {String(p.month).padStart(2, '0')}/{p.year} ({p.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng thu nhập nhuận bút</div>
          <div className="text-2xl font-black text-indigo-700 mt-1">{formatMoney(totalIncome)}</div>
          <div className="text-xs text-slate-400 mt-1">{displayedLines.length} dòng thù lao ghi nhận</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-sky-600 uppercase tracking-wider">Tiền bài viết (theo tỷ lệ)</div>
          <div className="text-xl font-bold text-sky-900 mt-1">{formatMoney(totalArticleAmt)}</div>
          <div className="text-xs text-slate-400 mt-1">Làm tròn xuống 1.000 đ</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Thù lao Media tự chụp/quay</div>
          <div className="text-xl font-bold text-purple-900 mt-1">{formatMoney(totalMediaAmt)}</div>
          <div className="text-xs text-slate-400 mt-1">Ảnh/video mới 100%</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Thực nhận đã giải ngân</div>
          <div className="text-xl font-bold text-emerald-800 mt-1">{formatMoney(paidAmount)}</div>
          <div className="text-xs text-slate-500 mt-1">
            {pendingAmount > 0 ? `Còn chờ chi: ${formatMoney(pendingAmount)} đ` : 'Đã thanh toán đủ'}
          </div>
        </div>
      </div>

      {/* Đối soát mẫu cho phóng viên */}
      <div className="bg-gradient-to-r from-indigo-50 to-sky-50 p-4 rounded-xl border border-indigo-200 text-xs text-indigo-950 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-indigo-600 flex-shrink-0" />
          <span>
            <strong>Bảo vệ quyền lợi tác giả:</strong> Bấm vào nút <strong>"Đối soát ①-⑧"</strong> tại bất kỳ dòng nào để xem công thức tính toán 8 bước chi tiết và minh bạch theo đúng quy chuẩn tòa soạn.
          </span>
        </div>
      </div>

      {/* Bảng danh sách thù lao của tôi */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">Kỳ nhuận bút</th>
                <th className="px-4 py-3.5">Bài viết</th>
                <th className="px-4 py-3.5 text-center">Vai trò & Tỷ lệ</th>
                <th className="px-4 py-3.5 text-center">Loại thù lao</th>
                <th className="px-4 py-3.5 text-center">Hệ số</th>
                <th className="px-4 py-3.5 text-right">Đơn giá</th>
                <th className="px-4 py-3.5 text-right">Tiền thực nhận (VNĐ)</th>
                <th className="px-4 py-3.5 text-center">Trạng thái chi</th>
                <th className="px-4 py-3.5 text-center">Đối soát</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {displayedLines.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    Chưa có dòng thù lao nào được ghi nhận cho phóng viên trong kỳ đã chọn.
                  </td>
                </tr>
              ) : (
                displayedLines.map(line => {
                  const { art, myAuthorRecord, genre } = getArticleDetails(line.article_id);
                  const period = state.royaltyPeriods.find(p => p.id === line.period_id);
                  const isPaid = isLinePaid(line);
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
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900 text-xs">
                          Tháng {period ? `${String(period.month).padStart(2, '0')}/${period.year}` : '—'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">{period?.code}</div>
                      </td>

                      <td className="px-4 py-3.5 max-w-xs">
                        <div className="font-semibold text-slate-900 line-clamp-1">{art?.title || 'Bài viết'}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {genre?.name || 'Thể loại'}
                          {art?.published_at && ` · Đăng: ${art.published_at.split(' ')[0]}`}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-center text-xs">
                        {line.line_type === 'MEDIA' ? (
                          <span className="font-medium text-purple-700">Tác giả Media 100%</span>
                        ) : myAuthorRecord ? (
                          <div>
                            <span className="font-bold text-slate-800">{myAuthorRecord.is_main ? 'Tác giả chính' : 'Đồng tác giả'}</span>
                            <span className="ml-1 text-slate-500 font-mono">({myAuthorRecord.share_percent}%)</span>
                          </div>
                        ) : isAdjustment ? (
                          <span className="font-medium text-amber-800">Điều chỉnh khiếu nại</span>
                        ) : (
                          <span className="text-slate-500">Tác giả</span>
                        )}
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

                      <td className="px-4 py-3.5 text-right">
                        <div className="font-black text-indigo-700 text-sm">
                          {isAdjustment && line.amount > 0 ? `+${formatMoney(line.amount)}` : formatMoney(line.amount)}
                        </div>
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
                            Chờ chi
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => setSelectedAuditLine(line)}
                          className="px-2.5 py-1.5 rounded-lg border border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold text-xs transition flex items-center gap-1 shadow-sm mx-auto"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          Đối soát ①-⑧
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Đối soát chi tiết 8 bước */}
      <Modal
        isOpen={!!selectedAuditLine}
        onClose={() => setSelectedAuditLine(null)}
        title="Đối soát minh bạch công thức nhuận bút (8 bước chuẩn)"
      >
        {selectedAuditLine && (() => {
          const { art, authors, myAuthorRecord, effectiveScore, genre } = getArticleDetails(selectedAuditLine.article_id);
          const isAdj = selectedAuditLine.is_adjustment || selectedAuditLine.line_type === 'ADJUSTMENT';

          return (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm">
                <div className="font-bold text-slate-900 text-base">{art?.title || 'Bài viết'}</div>
                <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-4">
                  <span>Mã bài: <strong className="font-mono text-slate-700">{selectedAuditLine.article_id}</strong></span>
                  <span>Thể loại: <strong className="text-slate-700">{genre?.name || 'Phóng sự'}</strong></span>
                  <span>Ngày đăng: <strong className="text-slate-700">{art?.published_at?.split(' ')[0] || '29/06/2026'}</strong></span>
                  <span>Điểm hiệu lực: <strong className="text-indigo-700 font-bold">{effectiveScore}/100 đ</strong></span>
                </div>
              </div>

              {/* Bảng diễn giải 8 bước */}
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-lg border border-slate-200 bg-white flex justify-between items-center">
                  <div>
                    <span className="font-bold text-indigo-700">① Bậc điểm:</span>
                    <span className="ml-2 text-slate-600">
                      {effectiveScore >= 90 ? 'Điểm ≥ 90 → Bậc 1,0 (Xuất sắc)' : effectiveScore >= 70 ? 'Điểm 70–89 → Bậc 0,8 (Khá)' : 'Điểm < 70 → Bậc 0,6 (Đạt)'}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-slate-800">
                    {effectiveScore >= 90 ? '1,0' : effectiveScore >= 70 ? '0,8' : '0,6'}
                  </span>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 bg-white flex justify-between items-center">
                  <div>
                    <span className="font-bold text-indigo-700">② Hệ số gợi ý:</span>
                    <span className="ml-2 text-slate-600">
                      Hệ số chuẩn thể loại ({genre?.base_factor ?? 15}) × ①
                    </span>
                  </div>
                  <span className="font-mono font-bold text-slate-800">
                    {((genre?.base_factor ?? 15) * (effectiveScore >= 90 ? 1.0 : effectiveScore >= 70 ? 0.8 : 0.6)).toFixed(1)}
                  </span>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 bg-white flex justify-between items-center">
                  <div>
                    <span className="font-bold text-indigo-700">③ Hệ số áp dụng:</span>
                    <span className="ml-2 text-slate-600">Thư ký giữ nguyên gợi ý (hoặc nâng tối đa {genre?.max_factor ?? 30})</span>
                  </div>
                  <span className="font-mono font-bold text-slate-800">{selectedAuditLine.factor}</span>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 bg-white flex justify-between items-center">
                  <div>
                    <span className="font-bold text-indigo-700">④ Sau bão hòa sự kiện:</span>
                    <span className="ml-2 text-slate-600">
                      {effectiveScore >= 90
                        ? 'Miễn bão hòa (100%) do điểm hiệu lực ≥ 90'
                        : 'Nhân mức bão hòa đã khóa khi nộp (80%)'}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-slate-800">
                    {effectiveScore >= 90 ? '100% (Miễn)' : '80%'}
                  </span>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 bg-white flex justify-between items-center">
                  <div>
                    <span className="font-bold text-indigo-700">⑤ Sau tính chất tác phẩm:</span>
                    <span className="ml-2 text-slate-600">Sáng tác (100%) | Dịch (70%) | Tổng hợp (50%)</span>
                  </div>
                  <span className="font-mono font-bold text-slate-800">100%</span>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 bg-white flex justify-between items-center">
                  <div>
                    <span className="font-bold text-indigo-700">⑥ Hệ số cuối:</span>
                    <span className="ml-2 text-slate-600">Hệ số tính toán cuối cùng (tối thiểu 1,0)</span>
                  </div>
                  <span className="font-mono font-bold text-indigo-700">{selectedAuditLine.factor}</span>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 bg-white flex justify-between items-center">
                  <div>
                    <span className="font-bold text-indigo-700">⑦ Tiền bài:</span>
                    <span className="ml-2 text-slate-600">Hệ số cuối × Đơn giá hiệu lực tại ngày đăng ({formatMoney(selectedAuditLine.unit_price)} đ)</span>
                  </div>
                  <span className="font-mono font-bold text-slate-800">
                    {formatMoney(Math.round(selectedAuditLine.factor * selectedAuditLine.unit_price))} đ
                  </span>
                </div>

                <div className="p-3 rounded-lg border border-indigo-200 bg-indigo-50/70 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-indigo-800">⑧ Phân chia theo tỷ lệ của bạn:</span>
                    <span className="ml-2 text-indigo-900 font-semibold">
                      {isAdj
                        ? `Điều chỉnh chênh lệch: ${selectedAuditLine.note}`
                        : selectedAuditLine.line_type === 'MEDIA'
                        ? 'Thù lao Media tự chụp 100%'
                        : `${myAuthorRecord?.share_percent ?? 60}% (làm tròn xuống 1.000 đ)`}
                    </span>
                  </div>
                  <span className="font-mono font-black text-indigo-900 text-sm">
                    {formatMoney(selectedAuditLine.amount)} VNĐ
                  </span>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-200">
                <button
                  onClick={() => setSelectedAuditLine(null)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700"
                >
                  Đã hiểu
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
};
