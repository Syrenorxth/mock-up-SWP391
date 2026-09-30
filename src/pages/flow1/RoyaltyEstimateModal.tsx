import React, { useState, useMemo } from 'react';
import { Modal } from '../../components/common/Modal';
import { useApp } from '../../context/AppContext';
import { Article, ArticleAuthor, ArticleAttachment } from '../../types';
import {
  Coins,
  Calculator,
  Sparkles,
  CheckCircle2,
  Info,
  Users,
  Image as ImageIcon,
  Video,
  Layers,
  HelpCircle,
  FileText
} from 'lucide-react';

interface RoyaltyEstimateModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: Article;
  authors?: ArticleAuthor[];
  attachments?: ArticleAttachment[];
}

type ScenarioKey = 'EXCELLENT' | 'GOOD' | 'AVERAGE';

export const RoyaltyEstimateModal: React.FC<RoyaltyEstimateModalProps> = ({
  isOpen,
  onClose,
  article,
  authors: propAuthors,
  attachments: propAttachments
}) => {
  const { state, getGenre, getUser, getArticleAuthors, getArticleAttachments, getEvent, getActiveRoyaltyRate } = useApp();

  const [activeScenario, setActiveScenario] = useState<ScenarioKey>('EXCELLENT');

  // Authors & Attachments
  const authors = useMemo(() => {
    if (propAuthors && propAuthors.length > 0) return propAuthors;
    return getArticleAuthors(article.id);
  }, [propAuthors, article.id, getArticleAuthors]);

  const attachments = useMemo(() => {
    if (propAttachments && propAttachments.length > 0) return propAttachments;
    return getArticleAttachments(article.id);
  }, [propAttachments, article.id, getArticleAttachments]);

  // Thể loại & đơn giá
  const categoryId = article.category_id || article.declared_category_id || article.genre_id;
  const genre = getGenre(categoryId) || state.genres[0];
  const activeRate = getActiveRoyaltyRate();
  const unitRate = activeRate?.unit_rate || 234000; // 10% lương cơ sở

  // Sự kiện & Hệ số bão hòa đã tính/khóa
  const event = getEvent(article.event_id);
  const baseSaturationRate = article.saturation_rate ?? 100;

  // Tính toán media hợp lệ hưởng nhuận bút
  // Quy tắc: Nguồn ngoài = 0đ; Tái sử dụng (hash_check === 'TAI_SU_DUNG') = 0đ
  const mediaCalculation = useMemo(() => {
    let eligiblePhotos = 0;
    let reusedPhotos = 0;
    let externalPhotos = 0;
    let eligibleVideos = 0;
    let externalVideos = 0;

    // Hệ số media từ NĐ 18/2014
    const photoFactor = state.mediaFactors.find(m => m.kind === 'ANH_TU_CHUP')?.factor_per_item ?? 0.3;
    const videoFactor = state.mediaFactors.find(m => m.kind === 'VIDEO_TU_QUAY')?.factor_per_item ?? 1.0;

    attachments.forEach(att => {
      if (att.media_type === 'IMAGE' || !att.media_type) {
        if (att.media_kind === 'NGUON_NGOAI' || att.hash_check === 'NGUON_NGOAI') {
          externalPhotos++;
        } else if (att.hash_check === 'TAI_SU_DUNG') {
          reusedPhotos++;
        } else {
          eligiblePhotos++;
        }
      } else if (att.media_type === 'VIDEO') {
        if (att.media_kind === 'NGUON_NGOAI') {
          externalVideos++;
        } else {
          eligibleVideos++;
        }
      }
    });

    const photoRoyalty = eligiblePhotos * photoFactor * unitRate;
    const videoRoyalty = eligibleVideos * videoFactor * unitRate;
    const totalMediaRoyalty = photoRoyalty + videoRoyalty;

    return {
      eligiblePhotos,
      reusedPhotos,
      externalPhotos,
      eligibleVideos,
      externalVideos,
      photoFactor,
      videoFactor,
      photoRoyalty,
      videoRoyalty,
      totalMediaRoyalty
    };
  }, [attachments, state.mediaFactors, unitRate]);

  // Cấu hình 3 kịch bản
  const scenarios = useMemo(() => {
    // 1. Xuất sắc: Điểm >= 90 => k_cl = 1.0; MIỄN GIẢM bão hòa (k_bh = 1.0)
    // 2. Khá / Đạt chuẩn: Điểm 70-89 => k_cl = 0.8; Áp dụng bão hòa đã tính (k_bh)
    // 3. Trung bình: Điểm < 70 => k_cl = 0.6; Áp dụng bão hòa đã tính (k_bh)
    const genreFactor = genre?.base_factor || 10;

    const calcForScenario = (k_cl: number, isExemptSaturation: boolean) => {
      const k_bh = isExemptSaturation ? 1.0 : (baseSaturationRate / 100);
      const textRoyalty = Math.round(genreFactor * unitRate * k_cl * k_bh);
      const totalRoyalty = textRoyalty + mediaCalculation.totalMediaRoyalty;
      return {
        k_cl,
        k_bh,
        isExemptSaturation,
        textRoyalty,
        totalRoyalty
      };
    };

    return {
      EXCELLENT: {
        key: 'EXCELLENT' as const,
        label: 'Xuất sắc (Điểm ≥ 90)',
        scoreRange: '90 – 100 điểm',
        description: 'Bài viết xuất sắc, được miễn trừ giảm trừ bão hòa chuyên đề (k_bh = 1.0).',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        ...calcForScenario(1.0, true)
      },
      GOOD: {
        key: 'GOOD' as const,
        label: 'Khá / Đạt chuẩn (70 – 89)',
        scoreRange: '70 – 89 điểm',
        description: 'Bài viết đạt yêu cầu chất lượng chuyên môn thông thường của tòa soạn.',
        badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
        ...calcForScenario(0.8, false)
      },
      AVERAGE: {
        key: 'AVERAGE' as const,
        label: 'Trung bình (< 70)',
        scoreRange: '50 – 69 điểm',
        description: 'Bài viết đạt mức trung bình, có thể cần biên tập thêm nhiều chi tiết.',
        badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
        ...calcForScenario(0.6, false)
      }
    };
  }, [genre, unitRate, baseSaturationRate, mediaCalculation.totalMediaRoyalty]);

  const currentCalc = scenarios[activeScenario];

  // Phân chia theo tác giả theo kịch bản đang chọn
  const authorBreakdown = useMemo(() => {
    if (!authors || authors.length === 0) {
      return [
        {
          userId: article.author_id,
          name: getUser(article.author_id)?.full_name || 'Tác giả chính',
          isMain: true,
          sharePercent: 100,
          textAmount: currentCalc.textRoyalty,
          mediaAmount: mediaCalculation.totalMediaRoyalty,
          totalAmount: currentCalc.totalRoyalty,
          userMediaCount: 0
        }
      ];
    }

    return authors.map(au => {
      const u = getUser(au.user_id);
      const share = au.share_percent || 0;
      // Chia phần bài viết theo %
      const textAmount = Math.round((currentCalc.textRoyalty * share) / 100);

      // Media do ai tác nghiệp:
      const userMediaCount = attachments.filter(
        att => att.media_author_id === au.user_id && att.media_kind !== 'NGUON_NGOAI' && att.hash_check !== 'TAI_SU_DUNG'
      ).length;

      // Nếu có tác giả media cụ thể thì tính cho người đó, nếu không phân bổ theo share_percent
      let mediaAmount = 0;
      if (attachments.some(a => a.media_author_id)) {
        const myPhotos = attachments.filter(
          a => a.media_author_id === au.user_id && a.media_type === 'IMAGE' && a.media_kind !== 'NGUON_NGOAI' && a.hash_check !== 'TAI_SU_DUNG'
        ).length;
        const myVideos = attachments.filter(
          a => a.media_author_id === au.user_id && a.media_type === 'VIDEO' && a.media_kind !== 'NGUON_NGOAI'
        ).length;
        mediaAmount = Math.round(
          myPhotos * mediaCalculation.photoFactor * unitRate +
          myVideos * mediaCalculation.videoFactor * unitRate
        );
      } else {
        mediaAmount = Math.round((mediaCalculation.totalMediaRoyalty * share) / 100);
      }

      return {
        userId: au.user_id,
        name: u?.full_name || 'Phóng viên',
        isMain: au.is_main,
        sharePercent: share,
        textAmount,
        mediaAmount,
        totalAmount: textAmount + mediaAmount,
        userMediaCount
      };
    });
  }, [authors, article.author_id, currentCalc, mediaCalculation, attachments, getUser, unitRate]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bảng ước tính nhuận bút tham khảo"
      maxWidth="3xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-[11px] text-slate-500 italic flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-blue-700 shrink-0" />
            <span>Căn cứ pháp lý: Nghị định 18/2014/NĐ-CP & Quy chế nhuận bút tòa soạn</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Đóng bảng tính
          </button>
        </div>
      }
    >
      <div className="space-y-5 text-slate-800">
        {/* Header thông tin tác phẩm */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Tác phẩm</div>
              <h4 className="text-sm font-bold text-slate-900 mt-0.5 line-clamp-1">{article.title}</h4>
            </div>
            <div className="text-right shrink-0">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-900 border border-blue-200">
                <FileText className="w-3.5 h-3.5 text-blue-700" />
                {genre?.name} (Hệ số: {genre?.base_factor})
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Đơn giá cơ sở:</span>
              <span className="font-semibold text-slate-800">{unitRate.toLocaleString('vi-VN')} đ</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Sự kiện liên quan:</span>
              <span className="font-semibold text-slate-800 truncate block">
                {event ? event.name : 'Không gán'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Mức bão hòa đề tài:</span>
              <span className="font-semibold text-slate-800">
                {event ? `${baseSaturationRate}%` : '100% (Không áp dụng)'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Tác giả tham gia:</span>
              <span className="font-semibold text-slate-800">{authors.length || 1} người</span>
            </div>
          </div>
        </div>

        {/* 3 Tabs Kịch bản chấm điểm */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-blue-900" />
              Chọn kịch bản chất lượng để ước tính
            </span>
            <span className="text-[11px] text-slate-400 italic">Do bài chưa có điểm chấm chính thức</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(scenarios) as ScenarioKey[]).map(key => {
              const sc = scenarios[key];
              const isSelected = activeScenario === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveScenario(key)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-blue-900 bg-blue-50/70 ring-2 ring-blue-900/10 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{sc.label}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-900" />}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">k_cl = {sc.k_cl} • k_bh = {sc.k_bh}</div>
                  <div className="text-sm font-extrabold text-blue-900 mt-2">
                    {sc.totalRoyalty.toLocaleString('vi-VN')} đ
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Công thức tính toán chi tiết của kịch bản đang chọn */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-bold text-slate-900">
                Chi tiết tính toán: {currentCalc.label}
              </span>
            </div>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${currentCalc.badgeColor}`}>
              {currentCalc.scoreRange}
            </span>
          </div>

          {/* Công thức toán học */}
          <div className="p-3 rounded-xl bg-slate-50 font-mono text-xs text-slate-800 space-y-1.5 border border-slate-200/70">
            <div className="text-slate-500 text-[11px]">Công thức quy định NĐ 18/2014 & Quy chế:</div>
            <div className="font-semibold text-slate-900">
              Nhuận bút = [Hệ số ({genre?.base_factor}) × Đơn giá ({unitRate.toLocaleString('vi-VN')} đ) × k_cl ({currentCalc.k_cl}) × k_bh ({currentCalc.k_bh})] + Media ({mediaCalculation.totalMediaRoyalty.toLocaleString('vi-VN')} đ)
            </div>
            <div className="text-blue-900 font-bold pt-1">
              = {currentCalc.textRoyalty.toLocaleString('vi-VN')} đ (bài viết) + {mediaCalculation.totalMediaRoyalty.toLocaleString('vi-VN')} đ (ảnh/video) = {currentCalc.totalRoyalty.toLocaleString('vi-VN')} đ
            </div>
          </div>

          {/* Ghi chú về điều kiện bão hòa */}
          {event && (
            <div className="text-xs p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                {currentCalc.isExemptSaturation ? (
                  <span>
                    <strong>Miễn giảm bão hòa:</strong> Theo quy định, tác phẩm đạt điểm xuất sắc (≥ 90 điểm) được miễn giảm trừ bão hòa (giữ nguyên k_bh = 1.0 thay vì {baseSaturationRate}%).
                  </span>
                ) : (
                  <span>
                    <strong>Áp dụng giảm trừ bão hòa:</strong> Đề tài "{event.name}" đang có mức bão hòa {baseSaturationRate}% nên áp dụng k_bh = {currentCalc.k_bh}.
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Chi tiết phần media */}
          <div className="text-xs space-y-1.5 pt-1">
            <div className="font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-slate-600" />
                Cấu phần nhuận bút Media đính kèm:
              </span>
              <span className="font-bold text-slate-900">
                +{mediaCalculation.totalMediaRoyalty.toLocaleString('vi-VN')} đ
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-600 pl-5">
              <div>
                • Ảnh tự chụp mới: <strong>{mediaCalculation.eligiblePhotos} ảnh</strong> (+{mediaCalculation.photoRoyalty.toLocaleString('vi-VN')} đ)
              </div>
              <div>
                • Ảnh tái sử dụng / kho: <strong>{mediaCalculation.reusedPhotos} ảnh</strong> (0 đ)
              </div>
              <div>
                • Ảnh nguồn ngoài: <strong>{mediaCalculation.externalPhotos} ảnh</strong> (0 đ)
              </div>
              {mediaCalculation.eligibleVideos > 0 && (
                <div>
                  • Video tự quay: <strong>{mediaCalculation.eligibleVideos} clip</strong> (+{mediaCalculation.videoRoyalty.toLocaleString('vi-VN')} đ)
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bảng phân chia theo từng tác giả */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-900" />
              Dự kiến phân bổ nhuận bút cho từng tác giả
            </span>
            <span className="text-[11px] text-slate-500">
              Tổng tỷ lệ: 100%
            </span>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Tác giả</th>
                  <th className="py-2.5 px-3 font-semibold">Vai trò</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Tỷ lệ %</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Nhuận bút chữ</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Nhuận bút Media</th>
                  <th className="py-2.5 px-3 font-semibold text-right text-blue-900">Tổng nhận</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {authorBreakdown.map((item, idx) => (
                  <tr key={item.userId || idx} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      {item.name}
                    </td>
                    <td className="py-2.5 px-3">
                      {item.isMain ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                          Tác giả chính
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                          Đồng tác giả
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                      {item.sharePercent}%
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600">
                      {item.textAmount.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600">
                      {item.mediaAmount > 0 ? `+${item.mediaAmount.toLocaleString('vi-VN')} đ` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-extrabold text-blue-900 text-sm">
                      {item.totalAmount.toLocaleString('vi-VN')} đ
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cảnh báo ghi chú tòa soạn */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-[11px] leading-relaxed">
          <p className="font-semibold text-slate-700 mb-0.5">Lưu ý quan trọng của Tòa soạn:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Bảng ước tính trên chỉ mang tính chất tham khảo dựa trên khai báo ban đầu của phóng viên.</li>
            <li>Nhuận bút chính thức sẽ được Ban Thư ký Tòa soạn xác định sau khi bài viết được thẩm định chất lượng, biên tập hoàn thiện và xuất bản chính thức.</li>
            <li>Trường hợp Ban Biên tập điều chỉnh thể loại áp dụng, hệ số thể loại sẽ được tính theo thể loại chính thức.</li>
          </ul>
        </div>
      </div>
    </Modal>
  );
};
