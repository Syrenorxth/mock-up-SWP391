import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/common/Header';
import { StatusBadge } from '../../components/common/Badge';
import {
  calculateRoyalty,
  getUnitPriceAtDate,
  NATURE_CONFIG,
  DEFAULT_MEDIA_FACTORS
} from '../../utils/royalty';
import {
  DeclaredNature,
  RoyaltyLine,
  RoyaltyItem,
  formatMoney,
  formatDate
} from '../../types';
import {
  Coins,
  Save,
  ArrowLeft,
  Calendar,
  User,
  Sliders,
  Sparkles,
  Image as ImageIcon,
  Video,
  CheckCircle2,
  AlertTriangle,
  Info,
  Scale,
  FileText,
  Calculator,
  ShieldCheck,
  CheckCheck,
  Percent
} from 'lucide-react';

export const RoyaltyFormScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const {
    state,
    dispatch,
    notify,
    getGenre,
    getSection,
    getUser,
    getArticleQualityScore,
    getArticleRoyaltyItem,
    getArticleAttachments,
    getArticleAuthors,
    getEffectiveScoreForArticle
  } = useApp();
  const navigate = useNavigate();

  const article = state.articles.find(a => a.id === id);
  const existingRoyalty = article ? getArticleRoyaltyItem(article.id) : null;
  const genre = article ? getGenre(article.category_id || article.genre_id) : null;
  const rawAttachments = article ? getArticleAttachments(article.id) : [];
  const rawAuthors = article ? getArticleAuthors(article.id) : [];

  // Điểm hiệu lực (tính cả khiếu nại đã giải quyết ở Luồng 03)
  const effectiveScore = article ? getEffectiveScoreForArticle(article.id) : 75;

  // Lấy đơn giá theo ngày đăng bài
  const publishedDate = article?.published_at ? article.published_at.split(' ')[0] : '2026-06-29';
  const unitPrice = useMemo(() => {
    return getUnitPriceAtDate(state.royaltyRates, publishedDate);
  }, [state.royaltyRates, publishedDate]);

  // Chuẩn hóa danh sách tác giả
  const authorsList = useMemo(() => {
    if (!article) return [];
    if (rawAuthors.length > 0) {
      return rawAuthors.map(a => ({
        userId: a.user_id,
        isMain: a.is_main,
        sharePercent: a.share_percent
      }));
    }
    return [{ userId: article.author_id, isMain: true, sharePercent: 100 }];
  }, [article, rawAuthors]);

  // Khung hệ số của thể loại
  const baseFactor = genre?.base_factor ?? genre?.min_factor ?? 10;
  const maxFactor = genre?.max_factor ?? 15;

  // ① Bậc điểm gợi ý: >= 90 -> 1.0; 70-89 -> 0.8; < 70 -> 0.6
  const qualityTierMultiplier = effectiveScore >= 90 ? 1.0 : effectiveScore >= 70 ? 0.8 : 0.6;
  const suggestedFactor = Math.round(baseFactor * qualityTierMultiplier * 100) / 100;

  // State Thư ký điều chỉnh:
  // ③ Hệ số áp dụng (mặc định = hệ số gợi ý, cho nâng tới max_factor)
  const [appliedFactor, setAppliedFactor] = useState<number>(suggestedFactor);
  const [factorAdjustmentReason, setFactorAdjustmentReason] = useState<string>('');

  // ⑤ Tính chất áp dụng (mặc định = tính chất PV khai, Thư ký được đổi)
  const declaredNature: DeclaredNature = article?.declared_nature || 'SANG_TAC';
  const [appliedNature, setAppliedNature] = useState<DeclaredNature>(declaredNature);
  const [natureChangeReason, setNatureChangeReason] = useState<string>('');

  // Khởi tạo giá trị khi có dữ liệu
  useEffect(() => {
    if (existingRoyalty) {
      setAppliedFactor(existingRoyalty.genre_factor ?? suggestedFactor);
      setFactorAdjustmentReason(existingRoyalty.note || '');
    } else {
      setAppliedFactor(suggestedFactor);
    }
  }, [suggestedFactor, existingRoyalty]);

  // Tính toán toàn bộ 8 bước theo hàm chuẩn calculateRoyalty
  const calcResult = useMemo(() => {
    return calculateRoyalty({
      effectiveScore,
      baseFactor,
      maxFactor,
      appliedFactor,
      adjustmentReason: factorAdjustmentReason,
      saturationRate: article?.saturation_rate ?? 100,
      nature: appliedNature,
      publishedDate,
      unitPrice,
      authors: authorsList,
      attachments: rawAttachments
    });
  }, [
    effectiveScore,
    baseFactor,
    maxFactor,
    appliedFactor,
    factorAdjustmentReason,
    article?.saturation_rate,
    appliedNature,
    publishedDate,
    unitPrice,
    authorsList,
    rawAttachments
  ]);

  if (!article) {
    return (
      <div className="py-16 text-center space-y-3">
        <h2 className="text-base font-bold text-slate-800">Không tìm thấy bài viết xuất bản</h2>
        <button
          type="button"
          onClick={() => navigate('/secretary/royalty-queue')}
          className="px-4 py-2 bg-blue-900 text-white rounded-xl text-xs font-semibold"
        >
          Quay lại hàng chờ
        </button>
      </div>
    );
  }

  const author = getUser(article.author_id);
  const section = getSection(article.section_id);

  // Lưu phiếu chấm nhuận bút
  const handleSaveRoyalty = () => {
    // 1. Kiểm tra nâng hệ số
    const isFactorAdjusted = Math.abs(appliedFactor - suggestedFactor) > 0.001;
    if (isFactorAdjusted && !factorAdjustmentReason.trim()) {
      notify('Hệ số áp dụng khác hệ số gợi ý. Bắt buộc nhập lý do điều chỉnh hệ số!', 'error');
      return;
    }
    if (appliedFactor > maxFactor) {
      notify(`Hệ số áp dụng (${appliedFactor}) không được vượt quá Hệ số tối đa (${maxFactor}) của thể loại!`, 'error');
      return;
    }
    if (appliedFactor < 0) {
      notify('Hệ số áp dụng không hợp lệ.', 'error');
      return;
    }

    // 2. Kiểm tra đổi tính chất
    const isNatureChanged = appliedNature !== declaredNature;
    if (isNatureChanged && !natureChangeReason.trim()) {
      notify('Tính chất áp dụng khác tính chất phóng viên khai báo. Bắt buộc nhập lý do thay đổi!', 'error');
      return;
    }

    // 3. Tìm kỳ đang mở (DANG_CHAM) của tháng hiện tại
    const openPeriod =
      state.royaltyPeriods.find(p => p.status === 'DANG_CHAM') ||
      state.royaltyPeriods[state.royaltyPeriods.length - 1];

    const periodId = openPeriod?.id || 'per-2026-09';

    // Tạo royaltyItem (để tương thích ngược)
    const royaltyItem: RoyaltyItem = {
      id: existingRoyalty?.id || `ri-${Date.now()}`,
      article_id: article.id,
      period_id: periodId,
      base_price: unitPrice,
      base_unit_price: unitPrice,
      genre_factor: appliedFactor,
      quality_factor: qualityTierMultiplier,
      media_bonus: calcResult.totalMediaAmount,
      photo_count: rawAttachments.filter(a => a.media_type === 'IMAGE').length,
      video_count: rawAttachments.filter(a => a.media_type === 'VIDEO').length,
      amount: calcResult.totalPayout,
      total_royalty: calcResult.totalPayout,
      status: 'CHO_CHOT',
      note: factorAdjustmentReason || natureChangeReason || 'Thư ký hoàn tất thẩm định nhuận bút'
    };

    // Tạo các dòng royalty_lines theo chuẩn LỆNH 7
    const royaltyLines: RoyaltyLine[] = [];

    // Dòng nhuận bút bài viết cho từng tác giả
    calcResult.authorShares.forEach(share => {
      royaltyLines.push({
        id: `rl-art-${article.id}-${share.userId}`,
        article_id: article.id,
        period_id: periodId,
        recipient_id: share.userId,
        line_type: 'ARTICLE',
        factor: calcResult.finalFactor,
        unit_price: unitPrice,
        amount: share.roundedAmount,
        note: `Nhuận bút bài viết: ${share.isMain ? 'Tác giả chính' : 'Đồng tác giả'} (${share.sharePercent}%)`
      });
    });

    // Dòng media cho từng tệp hợp lệ
    calcResult.mediaItems
      .filter(item => item.isEligible && item.amount > 0)
      .forEach(item => {
        royaltyLines.push({
          id: `rl-med-${article.id}-${item.id}`,
          article_id: article.id,
          period_id: periodId,
          recipient_id: item.authorId,
          line_type: 'MEDIA',
          factor: item.factor,
          unit_price: unitPrice,
          amount: item.amount,
          note: `Thù lao media: ${item.caption || item.originalName || item.mediaKind} (${item.factor} hệ số)`
        });
      });

    dispatch({
      type: 'SAVE_ROYALTY_CALCULATION',
      payload: {
        royaltyItem,
        royaltyLines
      }
    });

    notify(
      `Đã chấm nhuận bút bài "${article.title}": Tổng chi trả ${formatMoney(calcResult.totalPayout)} vào kỳ ${openPeriod?.code || 'hiện tại'}!`,
      'success'
    );

    navigate('/secretary/royalty-queue');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      {/* Top Header */}
      <PageHeader
        breadcrumbs={[
          { label: 'Thư ký tòa soạn', link: '/secretary/royalty-queue' },
          { label: 'Hàng chờ chấm', link: '/secretary/royalty-queue' },
          { label: 'Phiếu chấm nhuận bút' }
        ]}
        title="Phiếu Thẩm định & Chấm Nhuận bút Bài viết"
        description="Mô hình bảng tính 8 bước chuẩn nghiệp vụ tòa soạn theo Nghị định 18/2014/NĐ-CP. Tính toán trực tiếp từng bước, phân chia tác giả và phụ cấp đa phương tiện."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/secretary/royalty-queue')}
              className="flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Hàng chờ</span>
            </button>
            <button
              type="button"
              onClick={handleSaveRoyalty}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-900 text-white text-xs font-bold hover:bg-blue-800 transition-colors shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Lưu phiếu chấm nhuận bút</span>
            </button>
          </div>
        }
      />

      {/* Article Info Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-900">
                {section?.name || 'Ban chuyên môn'}
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                {genre?.name || 'Thể loại'}
              </span>
              <StatusBadge status={article.status} />
            </div>

            <h2 className="text-lg font-black text-slate-900 leading-snug">
              {article.title}
            </h2>

            <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>Tác giả chính: <strong className="text-slate-800">{author?.full_name || 'Phóng viên'}</strong></span>
              <span>•</span>
              <span>Ngày đăng: <strong>{formatDate(publishedDate)}</strong></span>
              <span>•</span>
              <span>Đơn giá ngày đăng: <strong className="text-blue-900">{formatMoney(unitPrice)}</strong>/hệ số</span>
            </div>
          </div>

          <div className="shrink-0 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-right">
            <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
              Tổng tiền nhuận bút & media
            </div>
            <div className="text-2xl font-black text-emerald-700 mt-1">
              {formatMoney(calcResult.totalPayout)}
            </div>
            <div className="text-[10px] text-emerald-600 mt-0.5">
              Bài: {formatMoney(calcResult.articleAmount)} • Media: {formatMoney(calcResult.totalMediaAmount)}
            </div>
          </div>
        </div>
      </div>

      {/* Spreadsheet: 8 Steps of Royalty Calculation */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="font-black text-sm text-slate-900 flex items-center gap-2">
            <Calculator className="w-4 h-4 text-blue-900" />
            <span>Quy trình tính toán Nhuận bút Bài viết (8 Bước chuẩn)</span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Tự động cập nhật trực tiếp theo dữ liệu thẩm định
          </span>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {/* Bước ①: Bậc điểm */}
          <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
            <div className="space-y-0.5 max-w-xl">
              <div className="font-bold text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-900 font-black text-[11px] flex items-center justify-center">1</span>
                <span>Bậc điểm theo ĐIỂM HIỆU LỰC</span>
              </div>
              <div className="text-slate-500 text-[11px]">
                Quy tắc bậc điểm: ≥ 90 điểm → 1,0 | 70–89 điểm → 0,8 | &lt; 70 điểm → 0,6.
                (Điểm hiệu lực của bài: <strong>{effectiveScore} điểm</strong>).
              </div>
            </div>

            <div className="text-right whitespace-nowrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-blue-50 text-blue-900 border border-blue-200">
                <Sparkles className="w-3.5 h-3.5 text-blue-700" />
                <span>{calcResult.qualityTierLabel} (Hệ số nhân: {calcResult.qualityTierMultiplier.toFixed(1)})</span>
              </span>
            </div>
          </div>

          {/* Bước ②: Hệ số gợi ý */}
          <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
            <div className="space-y-0.5 max-w-xl">
              <div className="font-bold text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-900 font-black text-[11px] flex items-center justify-center">2</span>
                <span>Hệ số gợi ý khởi điểm</span>
              </div>
              <div className="text-slate-500 text-[11px]">
                Công thức: <code>Hệ số chuẩn thể loại (base_factor = {baseFactor}) × Bậc điểm ({calcResult.qualityTierMultiplier.toFixed(1)})</code>
              </div>
            </div>

            <div className="text-right whitespace-nowrap">
              <span className="font-mono font-black text-sm text-slate-900 px-3 py-1 bg-slate-100 rounded-xl">
                {calcResult.suggestedFactor.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Bước ③: Hệ số áp dụng (Thư ký điều chỉnh) */}
          <div className="p-4 bg-amber-50/20 space-y-3">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
              <div className="space-y-0.5 max-w-xl">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-900 font-black text-[11px] flex items-center justify-center">3</span>
                  <span>Hệ số áp dụng (Thư ký quyết định)</span>
                  <span className="text-[10px] font-bold text-amber-700 px-2 py-0.5 bg-amber-100 rounded-full">
                    Thư ký có quyền nâng
                  </span>
                </div>
                <div className="text-slate-500 text-[11px]">
                  Mặc định giữ Hệ số gợi ý ({calcResult.suggestedFactor.toFixed(2)}), cho phép nâng tối đa tới Hệ số trần NĐ 18 (max_factor = <strong>{maxFactor}</strong>). Nếu nâng khác gợi ý, bắt buộc phải giải trình lý do.
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-auto">
                <span className="text-slate-600 font-medium">Hệ số:</span>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max={maxFactor}
                  value={appliedFactor}
                  onChange={e => setAppliedFactor(Number(e.target.value))}
                  className="w-24 px-3 py-1.5 text-xs font-black text-blue-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 text-right shadow-2xs"
                />
              </div>
            </div>

            {/* Ô nhập lý do nếu khác hệ số gợi ý */}
            {Math.abs(appliedFactor - suggestedFactor) > 0.001 && (
              <div className="p-3 bg-white rounded-xl border border-amber-300 space-y-1">
                <label className="block text-[11px] font-bold text-amber-900">
                  Lý do điều chỉnh hệ số áp dụng (Bắt buộc theo quy chế):
                </label>
                <input
                  type="text"
                  value={factorAdjustmentReason}
                  onChange={e => setFactorAdjustmentReason(e.target.value)}
                  placeholder="Ví dụ: Đề tài điều tra độc quyền nguy hiểm, tác nghiệp hiện trường công phu..."
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            )}
          </div>

          {/* Bước ④: Sau bão hòa đề tài */}
          <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
            <div className="space-y-0.5 max-w-xl">
              <div className="font-bold text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-900 font-black text-[11px] flex items-center justify-center">4</span>
                <span>Sau bão hòa đề tài</span>
              </div>
              <div className="text-slate-500 text-[11px]">
                {article.saturation_rank ? (
                  <>
                    Bài thứ #{article.saturation_rank} trong sự kiện, mức đã khóa khi nộp: <strong>{article.saturation_rate ?? 100}%</strong>.
                    {effectiveScore >= 90 ? (
                      <span className="text-emerald-700 font-bold ml-1">
                        (Được MIỄN BÃO HÒA vì điểm hiệu lực {effectiveScore} ≥ 90 → Áp dụng 100%).
                      </span>
                    ) : (
                      <span className="text-slate-600 ml-1">
                        (Áp dụng mức {article.saturation_rate ?? 100}%).
                      </span>
                    )}
                  </>
                ) : (
                  <span>Bài không thuộc sự kiện chuyên đề bão hòa (Áp dụng 100%).</span>
                )}
              </div>
            </div>

            <div className="text-right whitespace-nowrap">
              <div className="font-mono font-black text-sm text-slate-900">
                {calcResult.afterSaturationFactor.toFixed(2)}
              </div>
              <div className="text-[10px] text-slate-400">
                ({appliedFactor.toFixed(2)} × {calcResult.effectiveSaturationRate * 100}%)
              </div>
            </div>
          </div>

          {/* Bước ⑤: Sau tính chất bài viết */}
          <div className="p-4 bg-slate-50/40 space-y-3">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
              <div className="space-y-0.5 max-w-xl">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-900 font-black text-[11px] flex items-center justify-center">5</span>
                  <span>Sau tính chất bài viết</span>
                </div>
                <div className="text-slate-500 text-[11px]">
                  Tỷ lệ theo tính chất: Sáng tác 100% | Dịch 70% | Tổng hợp 50% | Đăng lại 30%.
                  (PV khai: <strong>{NATURE_CONFIG[declaredNature]?.label}</strong>).
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-auto">
                <span className="text-slate-600 font-medium">Tính chất áp dụng:</span>
                <select
                  value={appliedNature}
                  onChange={e => setAppliedNature(e.target.value as DeclaredNature)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 shadow-2xs"
                >
                  <option value="SANG_TAC">Sáng tác (100%)</option>
                  <option value="DICH">Dịch (70%)</option>
                  <option value="TONG_HOP">Tổng hợp (50%)</option>
                  <option value="DANG_LAI">Đăng lại (30%)</option>
                </select>
              </div>
            </div>

            {appliedNature !== declaredNature && (
              <div className="p-3 bg-white rounded-xl border border-blue-300 space-y-1">
                <label className="block text-[11px] font-bold text-blue-900">
                  Lý do thay đổi tính chất bài viết so với phóng viên khai báo:
                </label>
                <input
                  type="text"
                  value={natureChangeReason}
                  onChange={e => setNatureChangeReason(e.target.value)}
                  placeholder="Ví dụ: Rà soát phát hiện bài viết tổng hợp lại từ các thông cáo báo chí..."
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          {/* Bước ⑥: Hệ số cuối */}
          <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
            <div className="space-y-0.5 max-w-xl">
              <div className="font-bold text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-900 font-black text-[11px] flex items-center justify-center">6</span>
                <span>Hệ số cuối (final_factor)</span>
              </div>
              <div className="text-slate-500 text-[11px]">
                Quy định sàn tối thiểu NĐ 18: <code>max(1, Hệ số sau tính chất)</code>.
                {calcResult.isFlooredToOne && (
                  <span className="text-amber-700 font-bold ml-1">
                    (Được nâng lên 1.0 vì hệ số tính toán &lt; 1).
                  </span>
                )}
              </div>
            </div>

            <div className="text-right whitespace-nowrap">
              <span className="font-mono font-black text-base text-blue-950 px-3 py-1 bg-blue-50 border border-blue-200 rounded-xl">
                {calcResult.finalFactor.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Bước ⑦: Tiền bài viết */}
          <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-emerald-50/30">
            <div className="space-y-0.5 max-w-xl">
              <div className="font-bold text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-900 font-black text-[11px] flex items-center justify-center">7</span>
                <span>Tiền bài viết (trước khi phân chia)</span>
              </div>
              <div className="text-slate-500 text-[11px]">
                Công thức: <code>Hệ số cuối ({calcResult.finalFactor.toFixed(2)}) × Đơn giá hiệu lực ngày đăng ({formatMoney(unitPrice)})</code>
              </div>
            </div>

            <div className="text-right whitespace-nowrap">
              <div className="font-black text-lg text-emerald-800">
                {formatMoney(calcResult.articleAmount)}
              </div>
              <div className="text-[10px] text-slate-400">Số nguyên tiền VNĐ</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bảng Media (Ảnh / Video) */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-blue-900" />
            <span>Phụ cấp & Thù lao Media (Ảnh & Video đính kèm)</span>
          </div>
          <span className="text-xs font-bold text-emerald-700">
            Tổng media: {formatMoney(calcResult.totalMediaAmount)}
          </span>
        </div>

        {calcResult.mediaItems.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            Bài viết không đính kèm tệp media nào.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Tên tệp & Chú thích</th>
                  <th className="py-3 px-3">Loại media</th>
                  <th className="py-3 px-3">Tác giả media</th>
                  <th className="py-3 px-3 text-center">Kiểm tra Hash dHash</th>
                  <th className="py-3 px-3 text-center">Hệ số NĐ 18</th>
                  <th className="py-3 px-4 text-right">Thành tiền (VNĐ)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {calcResult.mediaItems.map(item => {
                  const mediaAuthor = getUser(item.authorId);

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-bold text-slate-900 line-clamp-1">{item.caption || item.originalName}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{item.originalName}</div>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap text-slate-700">
                        {item.mediaKind === 'ANH_TU_CHUP' ? 'Ảnh tự chụp' :
                         item.mediaKind === 'TRANH_TU_VE' ? 'Tranh tự vẽ' :
                         item.mediaKind === 'VIDEO_TU_QUAY' ? 'Video tự quay' : 'Nguồn ngoài'}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-800">
                        {mediaAuthor?.full_name || 'Tác giả chính'}
                      </td>

                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {item.hashCheck === 'MOI' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCheck className="w-3 h-3" />
                            Mới 100%
                          </span>
                        ) : item.hashCheck === 'TAI_SU_DUNG' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            Tái sử dụng (0đ)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            Nguồn ngoài (0đ)
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center whitespace-nowrap font-mono font-bold text-slate-900">
                        {item.factor > 0 ? `+${item.factor}` : '0'}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap font-bold text-slate-900">
                        {item.amount > 0 ? (
                          <span className="text-emerald-700 font-black">{formatMoney(item.amount)}</span>
                        ) : (
                          <span className="text-slate-400">0 đ</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bước ⑧: Bảng phân chia nhuận bút tác giả */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Percent className="w-4 h-4 text-blue-900" />
            <span>Bước ⑧: Phân chia Nhuận bút & Thù lao theo tỷ lệ tác giả</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Quy tắc: Đồng tác giả làm tròn XUỐNG 1.000 đ, Tác giả chính nhận phần còn lại
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Tác giả thụ hưởng</th>
                <th className="py-3 px-3 text-center w-24">Vai trò</th>
                <th className="py-3 px-3 text-center w-24">Tỷ lệ %</th>
                <th className="py-3 px-4 text-right w-40">Tiền bài viết (VNĐ)</th>
                <th className="py-3 px-4 text-right w-36">Tiền Media (VNĐ)</th>
                <th className="py-3 px-4 text-right w-44 font-black">Tổng nhận (VNĐ)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {calcResult.authorShares.map(share => {
                const u = getUser(share.userId);

                return (
                  <tr key={share.userId} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {u?.full_name || 'Phóng viên'}
                      <div className="text-[10px] text-slate-400 font-normal">{u?.email}</div>
                    </td>

                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      {share.isMain ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900">
                          Tác giả chính
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          Đồng tác giả
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-3 text-center whitespace-nowrap font-black text-slate-800">
                      {share.sharePercent}%
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap font-bold text-slate-900">
                      {formatMoney(share.roundedAmount)}
                      {!share.isMain && (
                        <div className="text-[9px] text-slate-400 font-normal">Đã làm tròn xuống</div>
                      )}
                      {share.isMain && (
                        <div className="text-[9px] text-blue-600 font-normal">Nhận phần còn lại</div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap font-bold text-slate-700">
                      {share.mediaAmount > 0 ? formatMoney(share.mediaAmount) : '—'}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap font-black text-emerald-700 text-sm">
                      {formatMoney(share.totalAmount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-black text-slate-900">
              <tr>
                <td colSpan={3} className="py-3 px-4 uppercase text-[11px]">
                  Tổng cộng toàn bài viết:
                </td>
                <td className="py-3 px-4 text-right font-black">
                  {formatMoney(calcResult.articleAmount)}
                </td>
                <td className="py-3 px-4 text-right font-black">
                  {formatMoney(calcResult.totalMediaAmount)}
                </td>
                <td className="py-3 px-4 text-right text-base text-emerald-800">
                  {formatMoney(calcResult.totalPayout)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="text-xs text-slate-500">
          Sau khi lưu, phiếu chấm sẽ được ghi vào <strong>kỳ nhuận bút đang mở</strong> và chuyển sang trạng thái <strong>Chờ chốt kỳ</strong>.
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/secretary/royalty-queue')}
            className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleSaveRoyalty}
            className="flex items-center gap-1.5 px-5 py-2 bg-blue-900 text-white text-xs font-bold rounded-xl hover:bg-blue-800 transition-colors shadow-xs cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Lưu phiếu chấm nhuận bút</span>
          </button>
        </div>
      </div>
    </div>
  );
};
