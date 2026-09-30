/**
 * LUỒNG 05 – Báo cáo từ số liệu độc giả (KHÔNG dùng để tính KPI)
 * - Báo cáo ưa chuộng theo thể loại: lượt xem TB/bài + trung vị, rating Bayes,
 *   chi nhuận bút trên 1.000 lượt xem, điểm chất lượng TB; thể loại < k bài → "Không đủ dữ liệu".
 * - Sự kiện đang nổi: lượt xem 7 ngày gần nhất / TB 7 ngày của 4 tuần trước > 2.
 */
import { Article, Event, Genre, ReaderDaily, RoyaltyLine } from '../types';
import { effectiveScoreOf, KpiDataSource } from './kpi';

export const BAYES_PRIOR_WEIGHT = 20; // C: số lượt rating "giả định" kéo về trung bình toàn hệ thống
export const MIN_ARTICLES_K = 5;      // k: thể loại ít hơn k bài → không đủ dữ liệu
export const TRENDING_RATIO = 2;      // Ngưỡng "đang nổi"

const addDays = (ymd: string, n: number) => {
  const d = new Date(ymd + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const latestReaderDate = (rows: ReaderDaily[]) =>
  rows.reduce((m, r) => (r.date > m ? r.date : m), '0000-00-00');

export const median = (arr: number[]) => {
  if (arr.length === 0) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
};

export interface ArticleReaderTotal {
  views: number;
  ratingCount: number;
  ratingSum: number;
}

export const totalsByArticle = (rows: ReaderDaily[]) => {
  const map = new Map<string, ArticleReaderTotal>();
  rows.forEach(r => {
    const t = map.get(r.article_id) || { views: 0, ratingCount: 0, ratingSum: 0 };
    t.views += r.view_count;
    t.ratingCount += r.rating_count;
    t.ratingSum += r.rating_sum;
    map.set(r.article_id, t);
  });
  return map;
};

export interface GenreReportRow {
  genre: Genre;
  articleCount: number;
  enough: boolean;
  avgViews: number;
  medianViews: number;
  bayesRating: number | null;
  rawRating: number | null;
  ratingCount: number;
  costPer1000: number | null;
  costArticles: number;
  avgQuality: number | null;
  rank?: number;
  articles: {
    article: Article;
    views: number;
    rating: number | null;
    royalty: number | null;
    costPer1000: number | null;
    score?: number;
  }[];
}

/** Báo cáo ưa chuộng theo thể loại cho các bài ĐÃ ĐĂNG trong khoảng tháng [fromYm, toYm] */
export function buildGenreReport(
  ds: KpiDataSource,
  genres: Genre[],
  readerRows: ReaderDaily[],
  royaltyLines: RoyaltyLine[],
  fromYm: string,
  toYm: string
): { rows: GenreReportRow[]; globalMean: number } {
  const totals = totalsByArticle(readerRows);
  const allRatingCount = readerRows.reduce((s, r) => s + r.rating_count, 0);
  const allRatingSum = readerRows.reduce((s, r) => s + r.rating_sum, 0);
  const globalMean = allRatingCount > 0 ? allRatingSum / allRatingCount : 0;

  const inRange = ds.articles.filter(a => {
    if (a.status !== 'PUBLISHED' || !a.published_at) return false;
    const ym = a.published_at.slice(0, 7);
    return ym >= fromYm && ym <= toYm;
  });

  const rows: GenreReportRow[] = genres
    .filter(g => g.is_active)
    .map(g => {
      const arts = inRange.filter(a => a.category_id === g.id);
      const details = arts.map(a => {
        const t = totals.get(a.id) || { views: 0, ratingCount: 0, ratingSum: 0 };
        const lines = royaltyLines.filter(l => l.article_id === a.id);
        const royalty = lines.length > 0 ? lines.reduce((s, l) => s + l.amount, 0) : null;
        return {
          article: a,
          views: t.views,
          rating: t.ratingCount > 0 ? t.ratingSum / t.ratingCount : null,
          ratingCount: t.ratingCount,
          ratingSum: t.ratingSum,
          royalty,
          costPer1000: royalty !== null && t.views > 0 ? royalty / (t.views / 1000) : null,
          score: effectiveScoreOf(ds, a.id).score
        };
      });
      const views = details.map(d => d.views);
      const rc = details.reduce((s, d) => s + d.ratingCount, 0);
      const rs = details.reduce((s, d) => s + d.ratingSum, 0);
      const costed = details.filter(d => d.royalty !== null && d.views > 0);
      const costSum = costed.reduce((s, d) => s + (d.royalty as number), 0);
      const costViews = costed.reduce((s, d) => s + d.views, 0);
      const scored = details.filter(d => d.score !== undefined);
      return {
        genre: g,
        articleCount: arts.length,
        enough: arts.length >= MIN_ARTICLES_K,
        avgViews: arts.length ? Math.round(views.reduce((s, v) => s + v, 0) / arts.length) : 0,
        medianViews: median(views),
        bayesRating: rc + BAYES_PRIOR_WEIGHT > 0 && arts.length
          ? (BAYES_PRIOR_WEIGHT * globalMean + rs) / (BAYES_PRIOR_WEIGHT + rc)
          : null,
        rawRating: rc > 0 ? rs / rc : null,
        ratingCount: rc,
        costPer1000: costViews > 0 ? costSum / (costViews / 1000) : null,
        costArticles: costed.length,
        avgQuality: scored.length ? scored.reduce((s, d) => s + (d.score as number), 0) / scored.length : null,
        articles: details.map(d => ({
          article: d.article,
          views: d.views,
          rating: d.rating,
          royalty: d.royalty,
          costPer1000: d.costPer1000,
          score: d.score
        }))
      };
    })
    .filter(r => r.articleCount > 0);

  // Xếp hạng theo lượt xem trung bình (chỉ các thể loại đủ dữ liệu)
  const ranked = rows.filter(r => r.enough).sort((a, b) => b.avgViews - a.avgViews);
  ranked.forEach((r, i) => (r.rank = i + 1));
  const sorted = [...ranked, ...rows.filter(r => !r.enough).sort((a, b) => b.avgViews - a.avgViews)];
  return { rows: sorted, globalMean };
}

export interface TrendingRow {
  event: Event;
  articleCount: number;
  last7: number;
  prevWeeklyAvg: number;
  ratio: number | null;
  status: 'DANG_NOI' | 'BINH_THUONG' | 'DANG_GIAM' | 'CHUA_DU_DU_LIEU';
  daily: { date: string; views: number }[];
}

/** Sự kiện đang nổi: 7 ngày gần nhất so với trung bình 7 ngày của 4 tuần trước đó */
export function buildTrendingReport(
  articles: Article[],
  events: Event[],
  readerRows: ReaderDaily[]
): { rows: TrendingRow[]; windowEnd: string; windowStart: string; baseStart: string; baseEnd: string } {
  const end = latestReaderDate(readerRows);
  const windowStart = addDays(end, -6);
  const baseEnd = addDays(end, -7);
  const baseStart = addDays(end, -34);
  const chartStart = addDays(end, -34);

  const rows: TrendingRow[] = events.map(ev => {
    const artIds = new Set(articles.filter(a => a.event_id === ev.id && a.status === 'PUBLISHED').map(a => a.id));
    const evRows = readerRows.filter(r => artIds.has(r.article_id));
    const last7 = evRows.filter(r => r.date >= windowStart && r.date <= end).reduce((s, r) => s + r.view_count, 0);
    const base = evRows.filter(r => r.date >= baseStart && r.date <= baseEnd).reduce((s, r) => s + r.view_count, 0);
    const prevWeeklyAvg = Math.round(base / 4);
    const ratio = prevWeeklyAvg > 0 ? last7 / prevWeeklyAvg : null;
    let status: TrendingRow['status'] = 'CHUA_DU_DU_LIEU';
    if (artIds.size === 0 || (last7 === 0 && base === 0)) status = 'CHUA_DU_DU_LIEU';
    else if (ratio === null) status = last7 > 0 ? 'DANG_NOI' : 'CHUA_DU_DU_LIEU';
    else if (ratio > TRENDING_RATIO) status = 'DANG_NOI';
    else if (ratio < 0.8) status = 'DANG_GIAM';
    else status = 'BINH_THUONG';

    const daily: { date: string; views: number }[] = [];
    for (let d = chartStart; d <= end; d = addDays(d, 1)) {
      daily.push({ date: d, views: evRows.filter(r => r.date === d).reduce((s, r) => s + r.view_count, 0) });
    }
    return { event: ev, articleCount: artIds.size, last7, prevWeeklyAvg, ratio, status, daily };
  });

  rows.sort((a, b) => (b.ratio ?? -1) - (a.ratio ?? -1));
  return { rows, windowEnd: end, windowStart, baseStart, baseEnd };
}
