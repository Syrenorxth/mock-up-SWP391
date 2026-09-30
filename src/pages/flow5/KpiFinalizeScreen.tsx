import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/common/Header';
import { KpiBadge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { formatDateTime } from '../../types';
import { buildKpiSnapshot, fmtConverted, fmtScore, monthLabel } from '../../utils/kpi';
import { CURRENT_MONTH, FinalizedBanner, KpiRulesNote, MonthSelect, useKpiDataSource, useSectionKpi } from './kpiShared';

/**
 * LUỒNG 05 – Chốt KPI tháng (*) (use case Finalize Monthly KPI)
 * Chốt → hệ thống đánh giá Đạt / Chưa đạt và lưu SNAPSHOT bất biến.
 */
export const KpiFinalizeScreen: React.FC = () => {
  const { state, dispatch, notify, getUser } = useApp();
  const navigate = useNavigate();
  const ds = useKpiDataSource();
  const sectionId = state.currentUser.role_code === 'TRUONG_BAN' ? state.currentUser.section_id : 'sec-xahoi';
  const section = state.sections.find(s => s.id === sectionId);
  const [period, setPeriod] = useState(CURRENT_MONTH);
  const { rows, monthClose } = useSectionKpi(sectionId, period.month, period.year);
  const [comments, setComments] = useState<Record<string, string>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const closedKeys = state.kpiMonthCloses.filter(c => c.section_id === sectionId).map(c => `${c.year}-${c.month}`);

  useEffect(() => setComments({}), [period.month, period.year]);

  const missingTargets = rows.filter(r => !r.target);
  const passCount = rows.filter(r => r.target && r.summary.result === 'DAT').length;

  const finalize = () => {
    const at = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const snapshots = rows.map(r =>
      buildKpiSnapshot(ds, r.user.id, sectionId, period.month, period.year, r.target, state.currentUser.id, at, comments[r.user.id] || '')
    );
    dispatch({ type: 'FINALIZE_KPI_MONTH', payload: { sectionId, month: period.month, year: period.year, snapshots } });
    setConfirmOpen(false);
    notify(`Đã chốt KPI ${monthLabel(period.month, period.year)}: ${passCount}/${rows.length} phóng viên đạt. Đã lưu snapshot và gửi thông báo.`, 'success');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: 'Chốt KPI tháng' }]}
        title="Chốt KPI tháng"
        description={`Trưởng ban ${section?.name || ''} xem bảng tổng hợp, ghi nhận xét cho từng phóng viên và chốt tháng. Sau khi chốt, kết quả Đạt/Chưa đạt được lưu snapshot – điểm thay đổi về sau không làm đổi KPI đã chốt.`}
        actions={<MonthSelect value={period} onChange={setPeriod} closedKeys={closedKeys} />}
      />

      {monthClose ? (
        <FinalizedBanner at={formatDateTime(monthClose.finalized_at)} by={getUser(monthClose.finalized_by)?.full_name} />
      ) : (
        missingTargets.length > 0 && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4" />
            {missingTargets.length} phóng viên chưa có chỉ tiêu tháng này ({missingTargets.map(r => r.user.full_name).join(', ')}) – sẽ ghi nhận "Chưa đạt".
            <button onClick={() => navigate('/kpi/targets')} className="ml-auto font-bold underline">Đặt chỉ tiêu</button>
          </div>
        )
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-[11px] uppercase text-slate-500">
            <tr>
              <th className="px-5 py-3 text-left font-bold">Phóng viên</th>
              <th className="px-4 py-3 text-right font-bold">Chỉ tiêu</th>
              <th className="px-4 py-3 text-right font-bold">Bài quy đổi</th>
              <th className="px-4 py-3 text-right font-bold">Điểm TB / chuẩn</th>
              <th className="px-4 py-3 text-left font-bold">Kết quả {monthClose ? 'chính thức' : 'sẽ ghi nhận'}</th>
              <th className="px-4 py-3 text-left font-bold w-[32%]">Nhận xét của Trưởng ban</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(r => {
              const ta = r.snapshot ? r.snapshot.target_articles : r.target?.target_articles;
              const tq = r.snapshot ? r.snapshot.target_quality : r.target?.target_quality;
              return (
                <tr key={r.user.id} className="align-top">
                  <td className="px-5 py-3">
                    <div className="font-semibold text-slate-900">{r.user.full_name}</div>
                    <div className="text-xs text-slate-500">{r.items.length} bài được tính</div>
                  </td>
                  <td className="px-4 py-3 text-right">{ta !== undefined ? fmtConverted(ta) : '—'}</td>
                  <td className="px-4 py-3 text-right font-bold">{fmtConverted(r.summary.converted)}</td>
                  <td className="px-4 py-3 text-right text-xs">
                    <b className={r.summary.qualityOk ? 'text-slate-900' : 'text-rose-700'}>{fmtScore(r.summary.avgScore)}</b> / {tq ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <KpiBadge result={ta === undefined ? 'CHUA_DAT' : r.summary.result} />
                    {!monthClose && ta !== undefined && r.summary.result !== 'DAT' && (
                      <div className="mt-1 text-[11px] text-slate-500">
                        {!r.summary.articleOk && 'Thiếu bài quy đổi. '}
                        {!r.summary.qualityOk && 'Điểm TB dưới chuẩn.'}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {monthClose ? (
                      <span className="text-xs text-slate-600">{r.snapshot?.comment || '—'}</span>
                    ) : (
                      <textarea
                        rows={2}
                        value={comments[r.user.id] || ''}
                        onChange={e => setComments({ ...comments, [r.user.id]: e.target.value })}
                        placeholder="Nhận xét gửi phóng viên (không bắt buộc)"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!monthClose && (
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-5 py-3">
            <span className="text-xs text-slate-500">
              Dự kiến: <b>{passCount}/{rows.length}</b> phóng viên Đạt. Sau khi chốt không thể chỉnh sửa.
            </span>
            <button
              onClick={() => setConfirmOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-900 px-4 py-2 text-xs font-bold text-white hover:bg-blue-800"
            >
              <Lock className="w-4 h-4" /> Chốt KPI {monthLabel(period.month, period.year)}
            </button>
          </div>
        )}
      </div>

      <KpiRulesNote />

      <Modal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={`Chốt KPI ${monthLabel(period.month, period.year)}?`}
        footer={
          <>
            <button onClick={() => setConfirmOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold">Hủy</button>
            <button onClick={finalize} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-900 px-4 py-2 text-xs font-bold text-white">
              <ShieldCheck className="w-4 h-4" /> Xác nhận chốt
            </button>
          </>
        }
      >
        <div className="space-y-2 text-sm text-slate-700">
          <p>Hệ thống sẽ đánh giá Đạt/Chưa đạt cho {rows.length} phóng viên và lưu snapshot bất biến.</p>
          <p className="text-xs text-slate-500">
            Nếu sau này điểm của bài thay đổi (ví dụ do khiếu nại), KPI đã chốt vẫn giữ nguyên. Chỉ tiêu tháng này cũng bị khóa.
          </p>
        </div>
      </Modal>
    </div>
  );
};
