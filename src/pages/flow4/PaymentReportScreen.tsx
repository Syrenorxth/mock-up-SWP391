import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/common/Header';
import { formatMoney } from '../../types';
import {
  BarChart3,
  Download,
  Calendar,
  Building,
  Layers,
  Users,
  Coins,
  ArrowUpRight,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';

export const PaymentReportScreen: React.FC = () => {
  const { state, getUser, getGenre, getSection, notify } = useApp();

  const [selectedSectionId, setSelectedSectionId] = useState<string>('ALL');
  const [selectedGenreId, setSelectedGenreId] = useState<string>('ALL');
  const [selectedPeriodRange, setSelectedPeriodRange] = useState<string>('ALL');

  // Lọc các dòng nhuận bút
  const filteredLines = useMemo(() => {
    return state.royaltyLines.filter(line => {
      const art = state.articles.find(a => a.id === line.article_id);

      if (selectedPeriodRange !== 'ALL' && line.period_id !== selectedPeriodRange) {
        return false;
      }
      if (selectedSectionId !== 'ALL' && art && art.section_id !== selectedSectionId) {
        return false;
      }
      if (selectedGenreId !== 'ALL' && art && (art.category_id || art.genre_id) !== selectedGenreId) {
        return false;
      }
      return true;
    });
  }, [state.royaltyLines, state.articles, selectedPeriodRange, selectedSectionId, selectedGenreId]);

  // Tổng hợp chỉ số
  const totalAmount = filteredLines.reduce((sum, l) => sum + l.amount, 0);
  const articleAmount = filteredLines.filter(l => l.line_type === 'ARTICLE').reduce((sum, l) => sum + l.amount, 0);
  const mediaAmount = filteredLines.filter(l => l.line_type === 'MEDIA').reduce((sum, l) => sum + l.amount, 0);
  const adjustmentAmount = filteredLines.filter(l => l.line_type === 'ADJUSTMENT').reduce((sum, l) => sum + l.amount, 0);

  // Thống kê theo tháng / kỳ cho biểu đồ
  const monthlyStats = useMemo(() => {
    return state.royaltyPeriods.map(p => {
      const lines = state.royaltyLines.filter(l => l.period_id === p.id);
      const artAmt = lines.filter(l => l.line_type === 'ARTICLE').reduce((sum, l) => sum + l.amount, 0);
      const medAmt = lines.filter(l => l.line_type === 'MEDIA').reduce((sum, l) => sum + l.amount, 0);
      const adjAmt = lines.filter(l => l.line_type === 'ADJUSTMENT').reduce((sum, l) => sum + l.amount, 0);
      const total = artAmt + medAmt + adjAmt;

      return {
        periodId: p.id,
        label: `Tháng ${String(p.month).padStart(2, '0')}/${p.year}`,
        code: p.code,
        articleAmount: artAmt,
        mediaAmount: medAmt,
        adjustmentAmount: adjAmt,
        total,
        status: p.status
      };
    });
  }, [state.royaltyPeriods, state.royaltyLines]);

  const maxMonthTotal = Math.max(...monthlyStats.map(m => m.total), 1);

  // Thống kê theo Ban chuyên môn
  const sectionStats = useMemo(() => {
    const map: Record<string, { name: string; articleAmt: number; mediaAmt: number; adjAmt: number; total: number; count: number }> = {};
    state.sections.forEach(s => {
      map[s.id] = { name: s.name, articleAmt: 0, mediaAmt: 0, adjAmt: 0, total: 0, count: 0 };
    });

    filteredLines.forEach(l => {
      const art = state.articles.find(a => a.id === l.article_id);
      const secId = art?.section_id || 'sec-xahoi';
      if (!map[secId]) {
        map[secId] = { name: 'Khác', articleAmt: 0, mediaAmt: 0, adjAmt: 0, total: 0, count: 0 };
      }
      if (l.line_type === 'ARTICLE') map[secId].articleAmt += l.amount;
      else if (l.line_type === 'MEDIA') map[secId].mediaAmt += l.amount;
      else if (l.line_type === 'ADJUSTMENT') map[secId].adjAmt += l.amount;
      map[secId].total += l.amount;
      map[secId].count += 1;
    });

    return Object.entries(map).filter(([_, s]) => s.total > 0);
  }, [filteredLines, state.sections, state.articles]);

  // Thống kê theo Thể loại
  const genreStats = useMemo(() => {
    const map: Record<string, { name: string; total: number; count: number }> = {};
    state.genres.forEach(g => {
      map[g.id] = { name: g.name, total: 0, count: 0 };
    });

    filteredLines.forEach(l => {
      const art = state.articles.find(a => a.id === l.article_id);
      const genreId = art?.category_id || art?.genre_id || 'cat-tin';
      if (!map[genreId]) {
        map[genreId] = { name: 'Khác', total: 0, count: 0 };
      }
      map[genreId].total += l.amount;
      map[genreId].count += 1;
    });

    return Object.entries(map).filter(([_, g]) => g.total > 0);
  }, [filteredLines, state.genres, state.articles]);

  // Thống kê theo Người nhận (Top recipients)
  const recipientStats = useMemo(() => {
    const map: Record<string, { userId: string; articleAmt: number; mediaAmt: number; adjAmt: number; total: number }> = {};

    filteredLines.forEach(l => {
      if (!map[l.recipient_id]) {
        map[l.recipient_id] = {
          userId: l.recipient_id,
          articleAmt: 0,
          mediaAmt: 0,
          adjAmt: 0,
          total: 0
        };
      }
      if (l.line_type === 'ARTICLE') map[l.recipient_id].articleAmt += l.amount;
      else if (l.line_type === 'MEDIA') map[l.recipient_id].mediaAmt += l.amount;
      else if (l.line_type === 'ADJUSTMENT') map[l.recipient_id].adjAmt += l.amount;
      map[l.recipient_id].total += l.amount;
    });

    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [filteredLines]);

  // Xuất CSV với UTF-8 BOM
  const handleExportCSV = () => {
    const headers = [
      'Kỳ nhuận bút',
      'Mã bài viết',
      'Tiêu đề bài',
      'Người nhận',
      'Ban chuyên môn',
      'Thể loại',
      'Loại thù lao',
      'Hệ số',
      'Đơn giá',
      'Thành tiền (VNĐ)',
      'Ghi chú'
    ];

    const rows = filteredLines.map(l => {
      const art = state.articles.find(a => a.id === l.article_id);
      const user = getUser(l.recipient_id);
      const sec = art ? getSection(art.section_id) : null;
      const genre = art ? getGenre(art.category_id || art.genre_id) : null;
      const p = state.royaltyPeriods.find(period => period.id === l.period_id);

      return [
        `"Tháng ${p ? `${p.month}/${p.year}` : ''}"`,
        `"${l.article_id}"`,
        `"${art?.title ? art.title.replace(/"/g, '""') : '—'}"`,
        `"${user?.full_name || 'Phóng viên'}"`,
        `"${sec?.name || '—'}"`,
        `"${genre?.name || '—'}"`,
        `"${l.line_type === 'ARTICLE' ? 'Bài viết' : l.line_type === 'MEDIA' ? 'Media' : 'Điều chỉnh'}"`,
        l.factor,
        l.unit_price,
        l.amount,
        `"${l.note ? l.note.replace(/"/g, '""') : ''}"`
      ].join(',');
    });

    // UTF-8 BOM \uFEFF để Excel mở tiếng Việt không bị lỗi font
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Bao_cao_chi_nhuan_but_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    notify('Đã tải xuống file báo cáo chi nhuận bút CSV (UTF-8 BOM)!', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="Báo cáo chi trả nhuận bút"
          subtitle="Thống kê tổng chi thù lao theo kỳ, ban chuyên môn, thể loại và người thụ hưởng (Kế toán)"
          icon={BarChart3}
        />

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition"
        >
          <Download className="w-4 h-4" />
          Xuất báo cáo CSV (Excel)
        </button>
      </div>

      {/* Bộ lọc đa chiều */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-500">Kỳ nhuận bút:</span>
          <select
            value={selectedPeriodRange}
            onChange={e => setSelectedPeriodRange(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">Toàn bộ các kỳ (Lũy kế)</option>
            {state.royaltyPeriods.map(p => (
              <option key={p.id} value={p.id}>
                Tháng {String(p.month).padStart(2, '0')}/{p.year} ({p.status})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Building className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-500">Ban chuyên môn:</span>
          <select
            value={selectedSectionId}
            onChange={e => setSelectedSectionId(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">Tất cả các ban</option>
            {state.sections.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-500">Thể loại:</span>
          <select
            value={selectedGenreId}
            onChange={e => setSelectedGenreId(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">Tất cả thể loại</option>
            {state.genres.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng ngân sách chi</div>
          <div className="text-2xl font-black text-indigo-700 mt-1">{formatMoney(totalAmount)}</div>
          <div className="text-xs text-slate-400 mt-1">{filteredLines.length} dòng thù lao</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-sky-600 uppercase tracking-wider">Chi bài viết</div>
          <div className="text-xl font-bold text-sky-900 mt-1">{formatMoney(articleAmount)}</div>
          <div className="text-xs text-slate-400 mt-1">Chiếm {totalAmount > 0 ? Math.round((articleAmount / totalAmount) * 100) : 0}%</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Chi Media (Ảnh/Video)</div>
          <div className="text-xl font-bold text-purple-900 mt-1">{formatMoney(mediaAmount)}</div>
          <div className="text-xs text-slate-400 mt-1">Chiếm {totalAmount > 0 ? Math.round((mediaAmount / totalAmount) * 100) : 0}%</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Chi điều chỉnh khiếu nại</div>
          <div className="text-xl font-bold text-amber-900 mt-1">{formatMoney(adjustmentAmount)}</div>
          <div className="text-xs text-slate-400 mt-1">Chênh lệch sau phúc khảo</div>
        </div>
      </div>

      {/* Biểu đồ cột theo tháng */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              Diễn biến chi trả nhuận bút theo tháng
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Phân tách cơ cấu chi: Bài viết (Xanh dương), Media (Tím), Điều chỉnh (Hổ phách)
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-sky-500"></span> Tiền bài
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-purple-500"></span> Media
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-amber-500"></span> Điều chỉnh
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-end pt-4 pb-2">
          {monthlyStats.map(m => {
            const heightPercent = Math.max(15, Math.round((m.total / maxMonthTotal) * 100));
            return (
              <div key={m.periodId} className="flex flex-col items-center">
                <div className="text-xs font-bold text-slate-800 mb-2 font-mono">
                  {formatMoney(m.total)} đ
                </div>

                <div className="w-full max-w-[80px] bg-slate-100 rounded-t-lg overflow-hidden flex flex-col-reverse" style={{ height: '180px' }}>
                  <div
                    className="w-full flex flex-col justify-end"
                    style={{ height: `${heightPercent}%` }}
                  >
                    {m.adjustmentAmount > 0 && (
                      <div
                        style={{ height: `${(m.adjustmentAmount / m.total) * 100}%` }}
                        className="w-full bg-amber-500"
                        title={`Điều chỉnh: ${formatMoney(m.adjustmentAmount)}`}
                      ></div>
                    )}
                    {m.mediaAmount > 0 && (
                      <div
                        style={{ height: `${(m.mediaAmount / m.total) * 100}%` }}
                        className="w-full bg-purple-500"
                        title={`Media: ${formatMoney(m.mediaAmount)}`}
                      ></div>
                    )}
                    {m.articleAmount > 0 && (
                      <div
                        style={{ height: `${(m.articleAmount / m.total) * 100}%` }}
                        className="w-full bg-sky-500"
                        title={`Bài viết: ${formatMoney(m.articleAmount)}`}
                      ></div>
                    )}
                  </div>
                </div>

                <div className="mt-3 text-center">
                  <div className="text-xs font-bold text-slate-800">{m.label}</div>
                  <span
                    className={`mt-1 inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                      m.status === 'PAID'
                        ? 'bg-emerald-100 text-emerald-800'
                        : m.status === 'CLOSED'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-sky-100 text-sky-800'
                    }`}
                  >
                    {m.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2 Bảng phân tích: Ban chuyên môn & Top Người thụ hưởng */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Theo ban chuyên môn */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Building className="w-4 h-4 text-indigo-600" />
            Chi trả theo Ban chuyên môn
          </h4>

          <div className="space-y-3">
            {sectionStats.map(([secId, s]) => {
              const percent = totalAmount > 0 ? Math.round((s.total / totalAmount) * 100) : 0;
              return (
                <div key={secId} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                  <div className="flex justify-between items-center text-sm font-semibold">
                    <span className="text-slate-800">{s.name}</span>
                    <span className="font-bold text-indigo-700">{formatMoney(s.total)} đ</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                    <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${percent}%` }}></div>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                    <span>{s.count} dòng thù lao</span>
                    <span>{percent}% tổng chi</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top người thụ hưởng */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            Top người thụ hưởng thù lao cao nhất
          </h4>

          <div className="space-y-3">
            {recipientStats.slice(0, 5).map((rec, idx) => {
              const user = getUser(rec.userId);
              return (
                <div key={rec.userId} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{user?.full_name}</div>
                      <div className="text-xs text-slate-500">{user?.department || 'Ban Xã hội'}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-indigo-700 text-sm">{formatMoney(rec.total)} đ</div>
                    <div className="text-[10px] text-slate-400">
                      Bài: {formatMoney(rec.articleAmt)} · Ảnh: {formatMoney(rec.mediaAmt)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
