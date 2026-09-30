import React, { useEffect, useMemo, useState } from 'react';
import { Target, Copy, Save, Users, Lock, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/common/Header';
import { Modal } from '../../components/common/Modal';
import { KpiTarget } from '../../types';
import { monthLabel } from '../../utils/kpi';
import { CURRENT_MONTH, KpiRulesNote, MonthSelect } from './kpiShared';

interface DraftRow {
  userId: string;
  articles: string;
  quality: string;
}

/**
 * LUỒNG 05 – Đặt chỉ tiêu (use case Set Monthly Targets)
 * Trưởng ban giao cho từng phóng viên: số bài quy đổi tối thiểu + điểm chất lượng TB tối thiểu (thang 100).
 */
export const KpiTargetSettingScreen: React.FC = () => {
  const { state, dispatch, notify } = useApp();
  const sectionId = state.currentUser.section_id;
  const section = state.sections.find(s => s.id === sectionId);
  const reporters = state.users.filter(u => u.role_code === 'PHONG_VIEN' && u.section_id === sectionId);

  const [period, setPeriod] = useState({ month: CURRENT_MONTH.month + 1, year: CURRENT_MONTH.year });
  const [drafts, setDrafts] = useState<DraftRow[]>([]);
  const [bulk, setBulk] = useState({ articles: '5', quality: '80' });
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isClosed = state.kpiMonthCloses.some(
    c => c.section_id === sectionId && c.month === period.month && c.year === period.year
  );
  const closedKeys = state.kpiMonthCloses.filter(c => c.section_id === sectionId).map(c => `${c.year}-${c.month}`);

  const existing = useMemo(
    () => state.kpiTargets.filter(t => t.section_id === sectionId && t.month === period.month && t.year === period.year),
    [state.kpiTargets, sectionId, period]
  );

  useEffect(() => {
    setDrafts(
      reporters.map(u => {
        const t = existing.find(x => x.user_id === u.id);
        return {
          userId: u.id,
          articles: t ? String(t.target_articles).replace('.', ',') : '',
          quality: t ? String(t.target_quality) : ''
        };
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing, period.month, period.year]);

  const prev = period.month === 1 ? { month: 12, year: period.year - 1 } : { month: period.month - 1, year: period.year };
  const prevTargets = state.kpiTargets.filter(t => t.section_id === sectionId && t.month === prev.month && t.year === prev.year);

  const parse = (v: string) => Number(v.replace(',', '.'));
  const rowError = (d: DraftRow): string | null => {
    if (d.articles === '' && d.quality === '') return null;
    const a = parse(d.articles);
    const q = parse(d.quality);
    if (!(a > 0)) return 'Số bài quy đổi phải > 0';
    if (!(q >= 0 && q <= 100)) return 'Điểm chuẩn phải trong 0–100';
    return null;
  };
  const errors = drafts.map(rowError);
  const hasError = errors.some(Boolean);
  const filledCount = drafts.filter(d => d.articles !== '' && d.quality !== '').length;

  const update = (userId: string, field: 'articles' | 'quality', value: string) =>
    setDrafts(ds => ds.map(d => (d.userId === userId ? { ...d, [field]: value } : d)));

  const applyBulk = () => {
    setDrafts(ds => ds.map(d => ({ ...d, articles: bulk.articles, quality: bulk.quality })));
    notify(`Đã áp dụng ${bulk.articles} bài quy đổi · ${bulk.quality} điểm cho cả ban (chưa lưu)`, 'info');
  };

  const copyPrev = () => {
    if (prevTargets.length === 0) {
      notify(`${monthLabel(prev.month, prev.year)} chưa có chỉ tiêu để sao chép`, 'warning');
      return;
    }
    setDrafts(ds =>
      ds.map(d => {
        const t = prevTargets.find(x => x.user_id === d.userId);
        return t ? { ...d, articles: String(t.target_articles).replace('.', ','), quality: String(t.target_quality) } : d;
      })
    );
    notify(`Đã sao chép chỉ tiêu ${monthLabel(prev.month, prev.year)} (chưa lưu)`, 'info');
  };

  const save = () => {
    const targets: KpiTarget[] = drafts
      .filter(d => d.articles !== '' && d.quality !== '')
      .map(d => ({
        id: `kt-${period.year}-${String(period.month).padStart(2, '0')}-${d.userId}`,
        section_id: sectionId,
        user_id: d.userId,
        month: period.month,
        year: period.year,
        target_articles: parse(d.articles),
        target_quality: parse(d.quality),
        created_by: state.currentUser.id,
        created_at: new Date().toISOString().slice(0, 16).replace('T', ' ')
      }));
    dispatch({ type: 'SET_KPI_TARGETS', payload: { targets } });
    setConfirmOpen(false);
    notify(`Đã lưu chỉ tiêu ${monthLabel(period.month, period.year)} cho ${targets.length} phóng viên`, 'success');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: 'Đặt chỉ tiêu' }]}
        title="Đặt chỉ tiêu KPI tháng"
        description={`Trưởng ban giao chỉ tiêu cho từng phóng viên ${section?.name || ''}: số bài quy đổi tối thiểu và điểm chất lượng trung bình tối thiểu (thang 100). Tháng đã chốt KPI thì chỉ tiêu bị khóa.`}
        actions={<MonthSelect value={period} onChange={setPeriod} includeFuture closedKeys={closedKeys} />}
      />

      <KpiRulesNote />

      {isClosed && (
        <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 text-xs text-slate-700">
          <Lock className="w-4 h-4 text-slate-500" />
          {monthLabel(period.month, period.year)} đã chốt KPI – chỉ tiêu bị khóa, chỉ xem.
        </div>
      )}

      {!isClosed && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Users className="w-4 h-4 text-blue-800" /> Áp dụng cho cả ban
            </div>
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <label className="text-xs text-slate-600">
                Bài quy đổi / tháng
                <input
                  value={bulk.articles}
                  onChange={e => setBulk({ ...bulk, articles: e.target.value })}
                  className="mt-1 block w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold"
                />
              </label>
              <label className="text-xs text-slate-600">
                Điểm TB tối thiểu
                <input
                  value={bulk.quality}
                  onChange={e => setBulk({ ...bulk, quality: e.target.value })}
                  className="mt-1 block w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold"
                />
              </label>
              <button
                onClick={applyBulk}
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700"
              >
                Áp dụng cho {reporters.length} phóng viên
              </button>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Copy className="w-4 h-4 text-blue-800" /> Sao chép từ tháng trước
            </div>
            <p className="mt-2 text-xs text-slate-600">
              {monthLabel(prev.month, prev.year)}: {prevTargets.length > 0 ? `${prevTargets.length} phóng viên đã có chỉ tiêu` : 'chưa có chỉ tiêu'}.
            </p>
            <button
              onClick={copyPrev}
              className="mt-3 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50"
            >
              Sao chép chỉ tiêu {monthLabel(prev.month, prev.year)}
            </button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Target className="w-4 h-4 text-blue-800" /> Chỉ tiêu {monthLabel(period.month, period.year)}
          </div>
          <span className="text-xs text-slate-500">
            {existing.length > 0 ? `Đã giao ${existing.length}/${reporters.length} phóng viên` : 'Chưa giao chỉ tiêu tháng này'}
          </span>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-[11px] uppercase text-slate-500">
            <tr>
              <th className="px-5 py-3 text-left font-bold">Phóng viên</th>
              <th className="px-5 py-3 text-left font-bold">Bài quy đổi tối thiểu</th>
              <th className="px-5 py-3 text-left font-bold">Điểm chất lượng TB tối thiểu (/100)</th>
              <th className="px-5 py-3 text-left font-bold">Chỉ tiêu tháng trước</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {reporters.map((u, i) => {
              const d = drafts.find(x => x.userId === u.id) || { userId: u.id, articles: '', quality: '' };
              const p = prevTargets.find(x => x.user_id === u.id);
              return (
                <tr key={u.id} className="align-top">
                  <td className="px-5 py-3">
                    <div className="font-semibold text-slate-900">{u.full_name}</div>
                    <div className="text-xs text-slate-500">{u.job_title}</div>
                  </td>
                  <td className="px-5 py-3">
                    <input
                      disabled={isClosed}
                      value={d.articles}
                      placeholder="VD: 5"
                      onChange={e => update(u.id, 'articles', e.target.value)}
                      className="w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold disabled:bg-slate-100"
                    />
                    <span className="ml-2 text-xs text-slate-500">bài</span>
                  </td>
                  <td className="px-5 py-3">
                    <input
                      disabled={isClosed}
                      value={d.quality}
                      placeholder="VD: 80"
                      onChange={e => update(u.id, 'quality', e.target.value)}
                      className="w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold disabled:bg-slate-100"
                    />
                    <span className="ml-2 text-xs text-slate-500">điểm</span>
                    {errors[i] && (
                      <div className="mt-1 flex items-center gap-1 text-xs text-rose-600">
                        <AlertCircle className="w-3.5 h-3.5" /> {errors[i]}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-600">
                    {p ? `${String(p.target_articles).replace('.', ',')} bài · ${p.target_quality} điểm` : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!isClosed && (
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-5 py-3">
            <span className="text-xs text-slate-500">
              Đã nhập {filledCount}/{reporters.length} phóng viên. Có thể nhập số lẻ, ví dụ 0,5 bài.
            </span>
            <button
              disabled={hasError || filledCount === 0}
              onClick={() => setConfirmOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-900 px-4 py-2 text-xs font-bold text-white hover:bg-blue-800 disabled:opacity-40"
            >
              <Save className="w-4 h-4" /> Lưu chỉ tiêu
            </button>
          </div>
        )}
      </div>

      <Modal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={`Lưu chỉ tiêu ${monthLabel(period.month, period.year)}?`}
        footer={
          <>
            <button onClick={() => setConfirmOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold">
              Hủy
            </button>
            <button onClick={save} className="rounded-lg bg-blue-900 px-4 py-2 text-xs font-bold text-white">
              Xác nhận lưu
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-700">
          Chỉ tiêu của {filledCount} phóng viên sẽ được ghi nhận. Phóng viên thấy chỉ tiêu ngay trong màn "KPI cá nhân".
        </p>
      </Modal>
    </div>
  );
};
