import React, { useMemo, useRef, useState } from 'react';
import { Upload, Download, FileSpreadsheet, CheckCircle2, RefreshCw, XCircle, History, Database } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/common/Header';
import { Modal } from '../../components/common/Modal';
import { DEMO_TODAY, ReaderDaily, formatDate, formatDateTime } from '../../types';
import { latestReaderDate } from '../../utils/readerReports';
import { StatCard } from './kpiShared';

const HEADER = 'ma_bai,ngay,luot_xem,so_luot_rating,tong_diem_rating';

const DEMO_CSV = [
  HEADER,
  'art-ev-hh-22,2026-09-29,1840,12,55',
  'art-ev-hh-23,2026-09-29,2310,15,63',
  'art-ev-hh-21,2026-09-29,960,6,25',
  'art-ev-hh-20,2026-09-29,720,4,17',
  'art-pub-5,2026-09-29,410,3,14',
  'art-ev-hh-22,2026-09-28,2950,19,86',
  'art-ev-hh-19,2026-09-28,880,6,24',
  'art-khong-ton-tai,2026-09-29,500,2,9',
  'art-ev-hh-18,2026-09-29,-40,0,0',
  'art-ev-hh-17,2026-13-01,300,1,4',
  'art-ev-hh-16,2026-09-29,300,2,15'
].join('\n');

type RowStatus = 'MOI' | 'GHI_DE' | 'LOI';
interface ParsedRow {
  line: number;
  raw: string[];
  status: RowStatus;
  error?: string;
  data?: ReaderDaily;
}

/**
 * LUỒNG 05 – Nhập số liệu độc giả (CSV) (use case Import Reader Data)
 * Nhập lại cùng bài + cùng ngày thì GHI ĐÈ. Số liệu CHỈ dùng cho báo cáo, không tính KPI.
 */
export const ReaderImportScreen: React.FC = () => {
  const { state, dispatch, notify, getUser } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [csv, setCsv] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const existingKeys = useMemo(() => new Set(state.readerDaily.map(r => `${r.article_id}|${r.date}`)), [state.readerDaily]);

  const parsed: ParsedRow[] = useMemo(() => {
    if (!csv.trim()) return [];
    const lines = csv.replace(/\r/g, '').split('\n').filter(l => l.trim() !== '');
    const body = lines[0].toLowerCase().startsWith('ma_bai') ? lines.slice(1) : lines;
    const seen = new Set<string>();
    return body.map((l, idx) => {
      const raw = l.split(',').map(x => x.trim());
      const line = idx + 2;
      const [artId, date, v, rc, rs] = raw;
      const art = state.articles.find(a => a.id === artId);
      const fail = (error: string): ParsedRow => ({ line, raw, status: 'LOI', error });
      if (raw.length < 5) return fail('Thiếu cột (cần 5 cột)');
      if (!art) return fail('Mã bài không tồn tại');
      if (art.status !== 'PUBLISHED') return fail('Bài chưa đăng');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(new Date(date + 'T00:00:00').getTime()) || Number(date.slice(5, 7)) > 12) {
        return fail('Ngày không hợp lệ (yyyy-mm-dd)');
      }
      if (date > DEMO_TODAY) return fail('Ngày ở tương lai');
      if (art.published_at && date < art.published_at.slice(0, 10)) return fail('Ngày trước ngày đăng bài');
      const views = Number(v);
      const ratingCount = Number(rc);
      const ratingSum = Number(rs);
      if (!Number.isInteger(views) || views < 0) return fail('Lượt xem phải là số nguyên ≥ 0');
      if (!Number.isInteger(ratingCount) || ratingCount < 0) return fail('Số lượt rating phải ≥ 0');
      if (!(ratingSum >= 0) || ratingSum > ratingCount * 5) return fail('Tổng điểm rating vượt 5 × số lượt');
      const key = `${artId}|${date}`;
      if (seen.has(key)) return fail('Trùng dòng trong cùng file');
      seen.add(key);
      return {
        line,
        raw,
        status: existingKeys.has(key) ? 'GHI_DE' : 'MOI',
        data: { id: `rd-${artId}-${date}`, article_id: artId, date, view_count: views, rating_count: ratingCount, rating_sum: ratingSum }
      };
    });
  }, [csv, state.articles, existingKeys]);

  const counts = {
    MOI: parsed.filter(p => p.status === 'MOI').length,
    GHI_DE: parsed.filter(p => p.status === 'GHI_DE').length,
    LOI: parsed.filter(p => p.status === 'LOI').length
  };
  const validRows = parsed.filter(p => p.data).map(p => p.data!);

  const onFile = (f?: File) => {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCsv(String(reader.result || ''));
      setFileName(f.name);
    };
    reader.readAsText(f, 'utf-8');
  };

  const downloadTemplate = () => {
    const blob = new Blob(['﻿' + HEADER + '\nart-nuocsach,2026-09-29,120,1,5\n'], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mau_so_lieu_doc_gia.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const doImport = () => {
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    dispatch({
      type: 'IMPORT_READER_DATA',
      payload: {
        rows: validRows,
        log: {
          id: 'ril-' + Date.now(),
          file_name: fileName || 'du_lieu.csv',
          imported_at: now,
          imported_by: state.currentUser.id,
          total_rows: parsed.length,
          new_rows: counts.MOI,
          overwritten_rows: counts.GHI_DE,
          error_rows: counts.LOI
        }
      }
    });
    setConfirmOpen(false);
    notify(`Đã nhập ${counts.MOI} dòng mới, ghi đè ${counts.GHI_DE} dòng, bỏ qua ${counts.LOI} dòng lỗi`, 'success');
    setCsv('');
    setFileName('');
  };

  const totalViews = state.readerDaily.reduce((s, r) => s + r.view_count, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: 'Nhập số liệu độc giả' }]}
        title="Nhập số liệu độc giả (CSV)"
        description="Admin nhập số liệu theo ngày cho từng bài: lượt xem, số lượt rating, tổng điểm rating. Nhập lại cùng bài + cùng ngày thì ghi đè. Số liệu chỉ dùng cho báo cáo, KHÔNG tính vào KPI."
        actions={
          <button
            onClick={downloadTemplate}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Download className="w-4 h-4" /> Tải file mẫu
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Số dòng dữ liệu" value={state.readerDaily.length.toLocaleString('vi-VN')} icon={<Database className="w-4 h-4" />} hint="Mỗi dòng = 1 bài × 1 ngày" />
        <StatCard label="Dữ liệu mới nhất" value={formatDate(latestReaderDate(state.readerDaily))} tone="blue" hint="Báo cáo tính đến ngày này" />
        <StatCard label="Tổng lượt xem" value={totalViews.toLocaleString('vi-VN')} hint="Cộng dồn các bài đã đăng" />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={e => onFile(e.target.files?.[0])} />
          <button
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-900 px-4 py-2 text-xs font-bold text-white hover:bg-blue-800"
          >
            <Upload className="w-4 h-4" /> Chọn file CSV
          </button>
          <button
            onClick={() => {
              setCsv(DEMO_CSV);
              setFileName('so_lieu_doc_gia_2026-09-29.csv');
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50"
          >
            <FileSpreadsheet className="w-4 h-4" /> Dùng file mẫu demo (29/09/2026)
          </button>
          {fileName && <span className="text-xs text-slate-600">Đã chọn: <b>{fileName}</b></span>}
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Định dạng cột: <code className="rounded bg-slate-100 px-1.5 py-0.5">{HEADER}</code> · ngày dạng yyyy-mm-dd · điểm rating thang 5.
        </p>
      </div>

      {parsed.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
            <div className="text-sm font-bold text-slate-900">Xem trước {parsed.length} dòng</div>
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700"><CheckCircle2 className="w-3.5 h-3.5" /> Mới: {counts.MOI}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-amber-800"><RefreshCw className="w-3.5 h-3.5" /> Ghi đè: {counts.GHI_DE}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-rose-700"><XCircle className="w-3.5 h-3.5" /> Lỗi: {counts.LOI}</span>
            </div>
          </div>
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-[11px] uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2 text-left">Dòng</th>
                <th className="px-4 py-2 text-left">Mã bài</th>
                <th className="px-4 py-2 text-left">Ngày</th>
                <th className="px-4 py-2 text-right">Lượt xem</th>
                <th className="px-4 py-2 text-right">Lượt rating</th>
                <th className="px-4 py-2 text-right">Tổng điểm rating</th>
                <th className="px-4 py-2 text-left">Kết quả</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {parsed.map(p => (
                <tr key={p.line} className={p.status === 'LOI' ? 'bg-rose-50/40' : ''}>
                  <td className="px-4 py-2 text-slate-500">{p.line}</td>
                  <td className="px-4 py-2 font-mono">{p.raw[0]}</td>
                  <td className="px-4 py-2">{p.raw[1]}</td>
                  <td className="px-4 py-2 text-right">{p.raw[2]}</td>
                  <td className="px-4 py-2 text-right">{p.raw[3]}</td>
                  <td className="px-4 py-2 text-right">{p.raw[4]}</td>
                  <td className="px-4 py-2">
                    {p.status === 'MOI' && <span className="font-semibold text-emerald-700">Mới</span>}
                    {p.status === 'GHI_DE' && <span className="font-semibold text-amber-800">Ghi đè số liệu cũ</span>}
                    {p.status === 'LOI' && <span className="font-semibold text-rose-700">Lỗi: {p.error}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-5 py-3">
            <span className="text-xs text-slate-500">Dòng lỗi sẽ bị bỏ qua, các dòng hợp lệ vẫn được nhập.</span>
            <button
              disabled={validRows.length === 0}
              onClick={() => setConfirmOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-900 px-4 py-2 text-xs font-bold text-white disabled:opacity-40"
            >
              <Upload className="w-4 h-4" /> Nhập {validRows.length} dòng hợp lệ
            </button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3 text-sm font-bold text-slate-900">
          <History className="w-4 h-4 text-blue-800" /> Lịch sử các lần nhập
        </div>
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-[11px] uppercase text-slate-500">
            <tr>
              <th className="px-5 py-2 text-left">Thời điểm</th>
              <th className="px-4 py-2 text-left">Tên file</th>
              <th className="px-4 py-2 text-left">Người nhập</th>
              <th className="px-4 py-2 text-right">Tổng dòng</th>
              <th className="px-4 py-2 text-right">Mới</th>
              <th className="px-4 py-2 text-right">Ghi đè</th>
              <th className="px-4 py-2 text-right">Lỗi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {state.readerImportLogs.map(l => (
              <tr key={l.id}>
                <td className="px-5 py-2">{formatDateTime(l.imported_at)}</td>
                <td className="px-4 py-2 font-mono">{l.file_name}</td>
                <td className="px-4 py-2">{getUser(l.imported_by)?.full_name}</td>
                <td className="px-4 py-2 text-right">{l.total_rows}</td>
                <td className="px-4 py-2 text-right text-emerald-700">{l.new_rows}</td>
                <td className="px-4 py-2 text-right text-amber-800">{l.overwritten_rows}</td>
                <td className="px-4 py-2 text-right text-rose-700">{l.error_rows}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Xác nhận nhập số liệu độc giả"
        footer={
          <>
            <button onClick={() => setConfirmOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold">Hủy</button>
            <button onClick={doImport} className="rounded-lg bg-blue-900 px-4 py-2 text-xs font-bold text-white">Nhập dữ liệu</button>
          </>
        }
      >
        <p className="text-sm text-slate-700">
          Sẽ thêm <b>{counts.MOI}</b> dòng mới và <b>ghi đè {counts.GHI_DE}</b> dòng đã có (cùng bài, cùng ngày). {counts.LOI} dòng lỗi bị bỏ qua.
        </p>
      </Modal>
    </div>
  );
};
