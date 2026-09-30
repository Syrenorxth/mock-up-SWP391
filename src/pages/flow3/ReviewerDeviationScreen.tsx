import React, { useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/common/Header';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  User,
  Scale,
  ArrowRight,
  ShieldAlert,
  BarChart3,
  HelpCircle,
  Eye
} from 'lucide-react';

export const ReviewerDeviationScreen: React.FC = () => {
  const { state } = useApp();
  const navigate = useNavigate();

  const reviewerStats = state.reviewerStats;

  // Thống kê toàn tòa soạn
  const totalGraded = reviewerStats.reduce((acc, curr) => acc + curr.total_graded, 0);
  const highDeviationCount = reviewerStats.filter(r => r.is_high_deviation).length;
  const avgAppealRate = (
    reviewerStats.reduce((acc, curr) => acc + curr.appeal_rate, 0) /
    (reviewerStats.length || 1)
  ).toFixed(1);

  // Chuẩn bị dữ liệu cho biểu đồ Recharts
  const chartData = useMemo(() => {
    return reviewerStats.map(r => ({
      name: r.editor_name,
      deviation: r.avg_deviation,
      avgScore: r.avg_score,
      appealCount: r.appeal_count,
      isHigh: r.is_high_deviation
    }));
  }, [reviewerStats]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <PageHeader
        breadcrumbs={[
          { label: 'Trang chủ', link: '/editor-lead/queue' },
          { label: 'Luồng 03 · Kiểm soát chất lượng' },
          { label: 'Báo cáo độ lệch người chấm' }
        ]}
        title="Báo cáo phân tích độ lệch người chấm (Reviewer Deviation)"
        description="Đo lường độ lệch chuẩn điểm số giữa các BTV so với điểm chấm lại mù và các đợt chấm chéo nhằm phát hiện xu hướng chấm rộng tay (+) hoặc chấm chặt tay (−)."
      />

      {/* Thẻ thống kê 4 ô */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Tổng lượt bài thẩm định
          </div>
          <div className="text-2xl font-black text-slate-900">{totalGraded}</div>
          <div className="text-[11px] text-slate-400">Trên toàn tòa soạn</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Số BTV bị gắn cờ "Lệch cao"
          </div>
          <div className="text-2xl font-black text-rose-600 flex items-center gap-2">
            <span>{highDeviationCount}</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
              |Δ| &gt; 5 điểm
            </span>
          </div>
          <div className="text-[11px] text-slate-400">Cần hiệu chuẩn chấm điểm</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Tỷ lệ khiếu nại trung bình
          </div>
          <div className="text-2xl font-black text-amber-600">{avgAppealRate}%</div>
          <div className="text-[11px] text-slate-400">Tỷ lệ bài viết bị phóng viên khiếu nại</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Ngưỡng dung sai hệ thống
          </div>
          <div className="text-2xl font-black text-blue-900">±5.0 đ</div>
          <div className="text-[11px] text-slate-400">Sai số chấm cho phép trước khi kích hoạt BTV 3</div>
        </div>
      </div>

      {/* BIỂU ĐỒ RECHARTS PHÂN TÍCH ĐỘ LỆCH */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-900" />
              <h3 className="font-bold text-slate-900 text-base">
                Biểu đồ độ lệch trung bình theo từng Biên tập viên (Điểm chênh lệch)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Độ lệch dương (+) phản ánh xu hướng chấm rộng tay; Độ lệch âm (−) phản ánh xu hướng chấm chặt tay, khắt khe.
            </p>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-semibold flex-wrap">
            <span className="flex items-center gap-1.5 text-amber-700">
              <span className="w-3 h-3 rounded-md bg-amber-500 inline-block" />
              <span>Chấm rộng tay (&gt; +5đ)</span>
            </span>
            <span className="flex items-center gap-1.5 text-blue-900">
              <span className="w-3 h-3 rounded-md bg-blue-800 inline-block" />
              <span>Trong chuẩn (±5đ)</span>
            </span>
            <span className="flex items-center gap-1.5 text-rose-700">
              <span className="w-3 h-3 rounded-md bg-rose-600 inline-block" />
              <span>Chấm chặt tay (&lt; -5đ)</span>
            </span>
          </div>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} />
              <YAxis
                domain={[-10, 10]}
                ticks={[-10, -5, 0, 5, 10]}
                tick={{ fontSize: 11, fill: '#475569' }}
                unit="đ"
              />
              <Tooltip
                formatter={(val: any) => [`${val > 0 ? `+${val}` : val} điểm`, 'Độ lệch trung bình']}
                labelFormatter={(label) => `BTV: ${label}`}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  fontSize: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <ReferenceLine y={0} stroke="#94a3b8" />
              <ReferenceLine y={5} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: '+5 Ngưỡng rộng tay', position: 'insideTopRight', fontSize: 10, fill: '#d97706' }} />
              <ReferenceLine y={-5} stroke="#e11d48" strokeDasharray="4 4" label={{ value: '-5 Ngưỡng chặt tay', position: 'insideBottomRight', fontSize: 10, fill: '#be123c' }} />
              <Bar dataKey="deviation" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, index) => {
                  let fill = '#1e3a8a'; // Blue within tolerance
                  if (entry.deviation > 5) fill = '#f59e0b'; // Amber rộng tay
                  if (entry.deviation < -5) fill = '#e11d48'; // Rose chặt tay
                  return <Cell key={`cell-${index}`} fill={fill} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* BẢNG TỔNG HỢP CHI TIẾT BTV */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-200">
          <h3 className="font-bold text-slate-900 text-sm">
            Bảng chỉ số đánh giá thiên lệch nhận thức theo Biên tập viên
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Nhấn vào từng BTV để xem chi tiết lịch sử chấm điểm, tỷ lệ bị khiếu nại và độ lệch theo từng tháng.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Biên tập viên & Ban</th>
                <th className="py-3 px-4 w-32 text-center">Số bài đã chấm</th>
                <th className="py-3 px-4 w-32 text-center">Điểm trung bình</th>
                <th className="py-3 px-4 w-44 text-center">Độ lệch trung bình (Δ)</th>
                <th className="py-3 px-4 w-36 text-center">Số bài khiếu nại</th>
                <th className="py-3 px-4 w-36 text-center">Tỷ lệ khiếu nại</th>
                <th className="py-3 px-4 w-40">Cảnh báo "Lệch cao"</th>
                <th className="py-3 px-4 w-36 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reviewerStats.map(stat => (
                <tr key={stat.editor_id} className="hover:bg-slate-50/70 transition-colors">
                  {/* BTV & Ban */}
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 text-xs">
                      {stat.editor_name}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {stat.department || 'Ban Xã hội'}
                    </div>
                  </td>

                  {/* Số bài đã chấm */}
                  <td className="py-3.5 px-4 text-center font-bold text-slate-900">
                    {stat.total_graded} bài
                  </td>

                  {/* Điểm trung bình */}
                  <td className="py-3.5 px-4 text-center">
                    <span className="font-black text-slate-900 text-xs">
                      {stat.avg_score}
                    </span>
                    <span className="text-[10px] text-slate-400">/100</span>
                  </td>

                  {/* Độ lệch trung bình */}
                  <td className="py-3.5 px-4 text-center">
                    <div
                      className={`inline-flex items-center gap-1 font-black text-xs px-2.5 py-1 rounded-full ${
                        stat.avg_deviation > 5
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : stat.avg_deviation < -5
                          ? 'bg-rose-100 text-rose-900 border border-rose-300'
                          : 'bg-blue-50 text-blue-900 border border-blue-200'
                      }`}
                    >
                      {stat.avg_deviation > 0 ? (
                        <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
                      ) : stat.avg_deviation < 0 ? (
                        <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-700" />
                      )}
                      <span>
                        {stat.avg_deviation > 0 ? `+${stat.avg_deviation}` : stat.avg_deviation} đ
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {stat.avg_deviation > 0
                        ? 'Chấm rộng tay'
                        : stat.avg_deviation < 0
                        ? 'Chấm chặt tay'
                        : 'Chuẩn hóa'}
                    </div>
                  </td>

                  {/* Số khiếu nại */}
                  <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                    {stat.appeal_count} vụ
                  </td>

                  {/* Tỷ lệ khiếu nại */}
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`font-black text-xs ${
                        stat.appeal_rate > 20
                          ? 'text-rose-600'
                          : stat.appeal_rate > 10
                          ? 'text-amber-600'
                          : 'text-slate-800'
                      }`}
                    >
                      {stat.appeal_rate}%
                    </span>
                  </td>

                  {/* Cờ lệch cao */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {stat.is_high_deviation ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-rose-100 text-rose-900 border border-rose-300">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        <span>CỜ LỆCH CAO</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Đạt chuẩn</span>
                      </span>
                    )}
                  </td>

                  {/* Chi tiết */}
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => navigate(`/editor-lead/reviewers/${stat.editor_id}`)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
                    >
                      <span>Xem hồ sơ</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
