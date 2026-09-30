/**
 * Hàm tính nhuận bút chuẩn dùng chung cho toàn bộ hệ thống
 * Tuân thủ quy chuẩn nghiệp vụ Luồng 04 (LỆNH 7):
 * ① Bậc điểm theo ĐIỂM HIỆU LỰC: ≥ 90 → 1,0 | 70–89 → 0,8 | < 70 → 0,6
 * ② Hệ số gợi ý = base_factor của thể loại áp dụng × ①
 * ③ Hệ số áp dụng = Thư ký giữ ②, hoặc nâng tới tối đa max_factor (bắt buộc ghi lý do)
 * ④ Sau bão hòa = ③ × mức đã khóa khi nộp (100% / 80% / 60%); miễn (100%) nếu điểm hiệu lực ≥ 90
 * ⑤ Sau tính chất = ④ × Sáng tác 100% | Dịch 70% | Tổng hợp 50% | Đăng lại 30% (tính chất ÁP DỤNG do Thư ký chọn, mặc định = khai báo)
 * ⑥ Hệ số cuối = max(1, ⑤)
 * ⑦ Tiền bài = ⑥ × đơn giá có hiệu lực tại NGÀY ĐĂNG
 * ⑧ Chia: mỗi đồng tác giả = ⑦ × tỷ lệ, làm tròn XUỐNG 1.000đ; tác giả chính nhận phần còn lại
 * Ảnh/video = hệ số cố định theo loại × đơn giá, trả cho tác giả ảnh/video; không nhân bậc điểm, không chịu bão hòa, không chia tỷ lệ. Tái sử dụng / nguồn ngoài = 0đ.
 */

import { ArticleAttachment, DeclaredNature, MediaKind, RoyaltyRate } from '../types';

export interface AuthorShareItem {
  userId: string;
  isMain: boolean;
  sharePercent: number;
  rawAmount: number;
  roundedAmount: number; // Đã làm tròn xuống 1.000 đ đối với đồng tác giả, tác giả chính nhận phần còn lại
  mediaAmount: number;   // Tiền ảnh/video của riêng tác giả này
  totalAmount: number;   // roundedAmount + mediaAmount
}

export interface MediaCalculationItem {
  id: string;
  mediaType: 'IMAGE' | 'VIDEO';
  mediaKind?: MediaKind;
  caption?: string;
  originalName?: string;
  authorId: string;
  hashCheck?: string;
  factor: number;
  unitPrice: number;
  amount: number;
  isEligible: boolean;
  ineligibleReason?: string;
}

export interface RoyaltyCalculationResult {
  // ① Bậc điểm
  effectiveScore: number;
  qualityTierMultiplier: number; // 1.0 | 0.8 | 0.6
  qualityTierLabel: string;      // 'Xuất sắc (≥90)' | 'Khá (70–89)' | 'Đạt (<70)'

  // ② Hệ số gợi ý
  baseFactor: number;
  maxFactor: number;
  suggestedFactor: number; // base_factor * qualityTierMultiplier

  // ③ Hệ số áp dụng
  appliedFactor: number;
  isAdjustedBySecretary: boolean;
  adjustmentReason?: string;

  // ④ Sau bão hòa
  saturationRate: number; // 100 | 80 | 60
  isSaturationExempt: boolean; // Miễn nếu điểm >= 90
  effectiveSaturationRate: number; // 1.0 | 0.8 | 0.6
  afterSaturationFactor: number;

  // ⑤ Sau tính chất
  nature: DeclaredNature;
  natureMultiplier: number; // 1.0 | 0.7 | 0.5 | 0.3
  natureLabel: string;
  afterNatureFactor: number;

  // ⑥ Hệ số cuối
  finalFactor: number; // max(1, ⑤)
  isFlooredToOne: boolean;

  // ⑦ Tiền bài viết
  publishedDate: string;
  unitPrice: number; // Đơn giá tại ngày đăng
  articleAmount: number; // finalFactor * unitPrice (số nguyên VND)

  // ⑧ Phân chia nhuận bút bài viết
  authorShares: AuthorShareItem[];

  // Media (Ảnh / Video)
  mediaItems: MediaCalculationItem[];
  totalMediaAmount: number;

  // Tổng cộng toàn bài viết
  totalPayout: number; // articleAmount + totalMediaAmount
}

export const NATURE_CONFIG: Record<
  DeclaredNature,
  { label: string; multiplier: number; percent: number }
> = {
  SANG_TAC: { label: 'Sáng tác', multiplier: 1.0, percent: 100 },
  DICH: { label: 'Dịch', multiplier: 0.7, percent: 70 },
  TONG_HOP: { label: 'Tổng hợp', multiplier: 0.5, percent: 50 },
  DANG_LAI: { label: 'Đăng lại', multiplier: 0.3, percent: 30 }
};

export const DEFAULT_MEDIA_FACTORS: Record<MediaKind, number> = {
  ANH_TU_CHUP: 3,
  TRANH_TU_VE: 3,
  VIDEO_TU_QUAY: 10,
  NGUON_NGOAI: 0
};

/**
 * Lấy đơn giá theo ngày hiệu lực
 */
export function getUnitPriceAtDate(
  rates: RoyaltyRate[],
  dateStr?: string
): number {
  if (!rates || rates.length === 0) return 234000;
  const d = dateStr ? dateStr.split(' ')[0] : new Date().toISOString().split('T')[0];

  const matched = rates.find(r => {
    const fromOk = !r.effective_from || r.effective_from <= d;
    const toOk = !r.effective_to || r.effective_to >= d;
    return fromOk && toOk;
  });

  return matched ? matched.unit_rate : rates[rates.length - 1].unit_rate;
}

export interface CalculateRoyaltyParams {
  effectiveScore: number;
  baseFactor: number;
  maxFactor: number;
  appliedFactor?: number;
  adjustmentReason?: string;
  saturationRate?: number; // 100 | 80 | 60 (mặc định 100)
  nature?: DeclaredNature; // Mặc định 'SANG_TAC'
  publishedDate?: string;
  unitPrice?: number;
  authors: { userId: string; isMain: boolean; sharePercent: number }[];
  attachments?: ArticleAttachment[];
  mediaFactorConfig?: Record<MediaKind, number>;
}

/**
 * Hàm tính nhuận bút chính thức
 */
export function calculateRoyalty(params: CalculateRoyaltyParams): RoyaltyCalculationResult {
  const {
    effectiveScore,
    baseFactor,
    maxFactor,
    saturationRate = 100,
    nature = 'SANG_TAC',
    publishedDate = '2026-06-29',
    unitPrice = 234000,
    authors,
    attachments = [],
    mediaFactorConfig = DEFAULT_MEDIA_FACTORS
  } = params;

  // ① Bậc điểm theo ĐIỂM HIỆU LỰC: ≥ 90 → 1,0 | 70–89 → 0,8 | < 70 → 0,6
  let qualityTierMultiplier = 0.6;
  let qualityTierLabel = '< 70 điểm → 0,6';
  if (effectiveScore >= 90) {
    qualityTierMultiplier = 1.0;
    qualityTierLabel = '≥ 90 điểm → 1,0';
  } else if (effectiveScore >= 70) {
    qualityTierMultiplier = 0.8;
    qualityTierLabel = '70–89 điểm → 0,8';
  }

  // ② Hệ số gợi ý = base_factor của thể loại áp dụng × ①
  const suggestedFactor = Math.round(baseFactor * qualityTierMultiplier * 100) / 100;

  // ③ Hệ số áp dụng = Thư ký giữ ②, hoặc nâng tới tối đa max_factor (bắt buộc ghi lý do)
  const appliedFactor = params.appliedFactor !== undefined ? params.appliedFactor : suggestedFactor;
  const isAdjustedBySecretary = appliedFactor !== suggestedFactor;
  const adjustmentReason = params.adjustmentReason;

  // ④ Sau bão hòa = ③ × mức đã khóa khi nộp (100% / 80% / 60%); miễn (100%) nếu điểm hiệu lực ≥ 90
  const isSaturationExempt = effectiveScore >= 90;
  const effectiveSaturationRate = isSaturationExempt ? 1.0 : (saturationRate || 100) / 100;
  const afterSaturationFactor = Math.round(appliedFactor * effectiveSaturationRate * 100) / 100;

  // ⑤ Sau tính chất = ④ × Sáng tác 100% | Dịch 70% | Tổng hợp 50% | Đăng lại 30%
  const natureInfo = NATURE_CONFIG[nature] || NATURE_CONFIG.SANG_TAC;
  const afterNatureFactor = Math.round(afterSaturationFactor * natureInfo.multiplier * 100) / 100;

  // ⑥ Hệ số cuối = max(1, ⑤)
  const finalFactor = Math.max(1, afterNatureFactor);
  const isFlooredToOne = afterNatureFactor < 1;

  // ⑦ Tiền bài = ⑥ × đơn giá có hiệu lực tại NGÀY ĐĂNG
  // Làm tròn thành số nguyên tiền VND
  const articleAmount = Math.round(finalFactor * unitPrice);

  // ⑧ Chia: mỗi đồng tác giả = ⑦ × tỷ lệ, làm tròn XUỐNG 1.000đ; tác giả chính nhận phần còn lại
  // Xử lý media trước để cộng dồn vào từng tác giả
  const mediaItems: MediaCalculationItem[] = attachments.map(att => {
    const isImage = att.media_type === 'IMAGE';
    const isVideo = att.media_type === 'VIDEO';
    const isMoi = att.hash_check === 'MOI';
    const isNguonNgoai = att.media_kind === 'NGUON_NGOAI' || att.hash_check === 'NGUON_NGOAI';

    let factor = 0;
    let isEligible = false;
    let ineligibleReason: string | undefined = undefined;

    if (isNguonNgoai) {
      factor = 0;
      isEligible = false;
      ineligibleReason = 'Nguồn ngoài / tư liệu không hưởng thù lao';
    } else if (att.hash_check === 'TAI_SU_DUNG') {
      factor = 0;
      isEligible = false;
      ineligibleReason = 'Ảnh/video tái sử dụng từ kho dữ liệu (0 đ)';
    } else if (isImage) {
      if (att.media_kind === 'ANH_TU_CHUP' && isMoi) {
        factor = mediaFactorConfig.ANH_TU_CHUP ?? 3;
        isEligible = true;
      } else if (att.media_kind === 'TRANH_TU_VE' && isMoi) {
        factor = mediaFactorConfig.TRANH_TU_VE ?? 3;
        isEligible = true;
      } else {
        factor = 0;
        ineligibleReason = 'Không đủ điều kiện định mức ảnh';
      }
    } else if (isVideo) {
      if (att.media_kind === 'VIDEO_TU_QUAY' && isMoi) {
        factor = mediaFactorConfig.VIDEO_TU_QUAY ?? 10;
        isEligible = true;
      } else {
        factor = 0;
        ineligibleReason = 'Không đủ điều kiện định mức video';
      }
    }

    const amount = factor * unitPrice;

    return {
      id: att.id,
      mediaType: att.media_type || 'IMAGE',
      mediaKind: att.media_kind,
      caption: att.caption,
      originalName: att.original_name,
      authorId: att.media_author_id || authors.find(a => a.isMain)?.userId || '',
      hashCheck: att.hash_check,
      factor,
      unitPrice,
      amount,
      isEligible,
      ineligibleReason
    };
  });

  const totalMediaAmount = mediaItems.reduce((sum, item) => sum + item.amount, 0);

  // Phân chia tác giả
  const coAuthors = authors.filter(a => !a.isMain);
  const mainAuthor = authors.find(a => a.isMain) || authors[0];

  let sumCoAuthorRounded = 0;
  const authorShares: AuthorShareItem[] = [];

  // Tính trước cho các đồng tác giả
  coAuthors.forEach(co => {
    const raw = (articleAmount * co.sharePercent) / 100;
    // Làm tròn XUỐNG 1.000đ: Math.floor(raw / 1000) * 1000
    const rounded = Math.floor(raw / 1000) * 1000;
    sumCoAuthorRounded += rounded;

    // Tính media do đồng tác giả này thực hiện
    const myMedia = mediaItems
      .filter(m => m.authorId === co.userId)
      .reduce((s, m) => s + m.amount, 0);

    authorShares.push({
      userId: co.userId,
      isMain: false,
      sharePercent: co.sharePercent,
      rawAmount: raw,
      roundedAmount: rounded,
      mediaAmount: myMedia,
      totalAmount: rounded + myMedia
    });
  });

  // Tác giả chính nhận phần còn lại
  if (mainAuthor) {
    const mainArticleShare = articleAmount - sumCoAuthorRounded;
    const mainMedia = mediaItems
      .filter(m => m.authorId === mainAuthor.userId)
      .reduce((s, m) => s + m.amount, 0);

    authorShares.unshift({
      userId: mainAuthor.userId,
      isMain: true,
      sharePercent: mainAuthor.sharePercent,
      rawAmount: (articleAmount * mainAuthor.sharePercent) / 100,
      roundedAmount: mainArticleShare,
      mediaAmount: mainMedia,
      totalAmount: mainArticleShare + mainMedia
    });
  }

  const totalPayout = articleAmount + totalMediaAmount;

  return {
    effectiveScore,
    qualityTierMultiplier,
    qualityTierLabel,
    baseFactor,
    maxFactor,
    suggestedFactor,
    appliedFactor,
    isAdjustedBySecretary,
    adjustmentReason,
    saturationRate,
    isSaturationExempt,
    effectiveSaturationRate,
    afterSaturationFactor,
    nature,
    natureMultiplier: natureInfo.multiplier,
    natureLabel: natureInfo.label,
    afterNatureFactor,
    finalFactor,
    isFlooredToOne,
    publishedDate,
    unitPrice,
    articleAmount,
    authorShares,
    mediaItems,
    totalMediaAmount,
    totalPayout
  };
}
