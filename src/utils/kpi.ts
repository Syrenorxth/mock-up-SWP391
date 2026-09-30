/**
 * LUỒNG 05 – KPI & BÁO CÁO: các hàm tính dùng chung
 *
 * Quy tắc (theo bản Tổng hợp 5 luồng):
 * - KPI chỉ có 2 kết quả: ĐẠT / CHƯA ĐẠT (không xếp loại).
 * - Bài đồng tác giả tính theo tỷ lệ: 60/40 → 0,6 bài và 0,4 bài ("bài quy đổi").
 * - Bài được tính vào tháng theo NGÀY ĐĂNG.
 * - Điểm dùng là ĐIỂM HIỆU LỰC (điểm cuối sau khiếu nại nếu có).
 * - Dữ liệu độc giả KHÔNG tính vào KPI.
 * - Chốt tháng → lưu snapshot, về sau điểm có đổi thì KPI đã chốt vẫn giữ nguyên.
 */
import {
  Appeal,
  Article,
  ArticleAuthor,
  DEMO_TODAY,
  KpiArticleItem,
  KpiSnapshot,
  KpiTarget,
  QualityScore,
  ScoringAttempt
} from '../types';

export interface KpiDataSource {
  articles: Article[];
  articleAuthors: ArticleAuthor[];
  appeals: Appeal[];
  scoringAttempts: ScoringAttempt[];
  qualityScores: QualityScore[];
}

/** Điểm hiệu lực của bài: khiếu nại đã giải quyết → lần chấm hiệu lực → điểm đã duyệt */
export function effectiveScoreOf(
  ds: KpiDataSource,
  articleId: string
): { score?: number; changedByAppeal: boolean; original?: number } {
  const appeal = ds.appeals.find(
    ap => ap.article_id === articleId && ap.status === 'RESOLVED' && ap.final_effective_score !== undefined
  );
  if (appeal && appeal.final_effective_score !== undefined) {
    return {
      score: appeal.final_effective_score,
      changedByAppeal: appeal.final_effective_score !== appeal.original_score,
      original: appeal.original_score
    };
  }
  const attempt = ds.scoringAttempts.find(sa => sa.article_id === articleId && sa.is_effective);
  if (attempt) return { score: attempt.total_score, changedByAppeal: false };
  const qs = ds.qualityScores.find(q => q.article_id === articleId);
  if (qs) return { score: qs.total_score, changedByAppeal: false };
  return { score: undefined, changedByAppeal: false };
}

/** Danh sách tác giả + tỷ lệ của bài (bài 1 tác giả → 100% cho tác giả chính) */
export function authorSharesOf(ds: KpiDataSource, article: Article) {
  const list = ds.articleAuthors.filter(
    a => a.article_id === article.id && (a.is_main || a.confirm_status === 'ACCEPTED')
  );
  if (list.length > 0) {
    return list.map(a => ({ userId: a.user_id, isMain: a.is_main, sharePercent: a.share_percent }));
  }
  return [{ userId: article.author_id, isMain: true, sharePercent: 100 }];
}

const monthOf = (dateStr?: string) => {
  if (!dateStr) return null;
  const d = dateStr.split(' ')[0];
  const [y, m] = d.split('-').map(Number);
  return { y, m };
};

/** Các bài được tính KPI của 1 phóng viên trong tháng (theo ngày đăng) */
export function kpiItemsFor(ds: KpiDataSource, userId: string, month: number, year: number): KpiArticleItem[] {
  const items: KpiArticleItem[] = [];
  ds.articles
    .filter(a => a.status === 'PUBLISHED')
    .forEach(a => {
      const pm = monthOf(a.published_at);
      if (!pm || pm.m !== month || pm.y !== year) return;
      const me = authorSharesOf(ds, a).find(s => s.userId === userId);
      if (!me) return;
      const eff = effectiveScoreOf(ds, a.id);
      items.push({
        article_id: a.id,
        title: a.title,
        category_id: a.category_id,
        published_at: a.published_at || '',
        is_main: me.isMain,
        share_percent: me.sharePercent,
        converted: Math.round(me.sharePercent) / 100,
        effective_score: eff.score,
        score_changed_by_appeal: eff.changedByAppeal,
        original_score: eff.original
      });
    });
  return items.sort((x, y) => x.published_at.localeCompare(y.published_at));
}

export interface KpiSummary {
  converted: number;
  avgScore: number | null;
  articleOk: boolean;
  qualityOk: boolean;
  result: 'DAT' | 'CHUA_DAT';
  completionPct: number;
}

/** Tổng hợp: bài quy đổi, điểm TB (bình quân gia quyền theo tỷ lệ), kết quả */
export function summarizeKpi(items: KpiArticleItem[], target?: { target_articles: number; target_quality: number }): KpiSummary {
  const converted = Math.round(items.reduce((s, i) => s + i.converted, 0) * 100) / 100;
  const scored = items.filter(i => i.effective_score !== undefined);
  const w = scored.reduce((s, i) => s + i.converted, 0);
  const avgScore = w > 0
    ? Math.round((scored.reduce((s, i) => s + (i.effective_score as number) * i.converted, 0) / w) * 10) / 10
    : null;
  const ta = target?.target_articles ?? 0;
  const tq = target?.target_quality ?? 0;
  const articleOk = !!target && converted >= ta;
  const qualityOk = !!target && (tq <= 0 || (avgScore !== null && avgScore >= tq));
  return {
    converted,
    avgScore,
    articleOk,
    qualityOk,
    result: articleOk && qualityOk ? 'DAT' : 'CHUA_DAT',
    completionPct: ta > 0 ? Math.min(999, Math.round((converted / ta) * 100)) : 0
  };
}

/** Dự báo cho tháng đang chạy (dựa trên tốc độ hiện tại) */
export function forecastKpi(summary: KpiSummary, target: KpiTarget | undefined, month: number, year: number) {
  if (!target) return { label: 'Chưa giao chỉ tiêu', tone: 'slate' as const };
  if (summary.result === 'DAT') return { label: 'Đã đạt chỉ tiêu', tone: 'emerald' as const };
  const today = new Date(DEMO_TODAY);
  const daysInMonth = new Date(year, month, 0).getDate();
  const isCurrent = today.getFullYear() === year && today.getMonth() + 1 === month;
  const elapsed = isCurrent ? today.getDate() : daysInMonth;
  const projected = elapsed > 0 ? (summary.converted / elapsed) * daysInMonth : summary.converted;
  if (!summary.qualityOk && summary.avgScore !== null) {
    return { label: 'Nguy cơ chưa đạt (điểm TB thấp)', tone: 'rose' as const };
  }
  if (projected >= target.target_articles) return { label: 'Có khả năng đạt', tone: 'blue' as const };
  return { label: 'Nguy cơ chưa đạt (thiếu bài)', tone: 'amber' as const };
}

/** Tạo snapshot KPI khi chốt tháng */
export function buildKpiSnapshot(
  ds: KpiDataSource,
  userId: string,
  sectionId: string,
  month: number,
  year: number,
  target: KpiTarget | undefined,
  finalizedBy: string,
  finalizedAt: string,
  comment?: string
): KpiSnapshot {
  const items = kpiItemsFor(ds, userId, month, year);
  const sum = summarizeKpi(items, target);
  return {
    id: `ks-${year}-${String(month).padStart(2, '0')}-${userId}`,
    user_id: userId,
    section_id: sectionId,
    month,
    year,
    target_articles: target?.target_articles ?? 0,
    target_quality: target?.target_quality ?? 0,
    converted_articles: sum.converted,
    avg_score: sum.avgScore,
    result: target ? sum.result : 'CHUA_DAT',
    comment,
    items,
    finalized_at: finalizedAt,
    finalized_by: finalizedBy
  };
}

/** Định dạng số bài quy đổi kiểu Việt Nam: 0,6 · 2,3 · 5 */
export function fmtConverted(n: number): string {
  return (Math.round(n * 100) / 100).toLocaleString('vi-VN', { maximumFractionDigits: 2 });
}

export function fmtScore(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  return (Math.round(n * 10) / 10).toLocaleString('vi-VN', { maximumFractionDigits: 1 });
}

export const MONTH_OPTIONS = [
  { month: 6, year: 2026, label: 'Tháng 06/2026' },
  { month: 7, year: 2026, label: 'Tháng 07/2026' },
  { month: 8, year: 2026, label: 'Tháng 08/2026' },
  { month: 9, year: 2026, label: 'Tháng 09/2026' },
  { month: 10, year: 2026, label: 'Tháng 10/2026' }
];

export const monthKey = (month: number, year: number) => `${year}-${String(month).padStart(2, '0')}`;
export const monthLabel = (month: number, year: number) => `Tháng ${String(month).padStart(2, '0')}/${year}`;
