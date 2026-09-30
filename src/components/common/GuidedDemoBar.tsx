import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ChevronDown, ChevronUp, Compass, RotateCcw } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface DemoStep {
  flow: '01' | '02' | '03' | '04' | '05';
  userId: string;
  label: string;
  route: string;
  description: string;
}

/**
 * Kịch bản demo theo đúng ví dụ bài "Nước sạch ở xóm chài ven sông" đi hết 5 luồng
 * (mục 8 của bản Tổng hợp 5 luồng). Mỗi bước tự đổi đúng NGƯỜI DÙNG và mở đúng màn.
 */
const DEMO_STEPS: DemoStep[] = [
  {
    flow: '01', userId: 'u-an', label: 'An khai báo tác phẩm', route: '/articles/art-nuocsach',
    description: 'Phóng sự · Sáng tác · An 60% / Bình 40% · 3 ảnh · gắn sự kiện "Hạn hán miền Tây". Khai báo bị khóa sau khi nộp. (Muốn nộp trực tiếp: mở bài nháp "Chợ nổi Cái Răng…" trong Tác phẩm của tôi.)'
  },
  {
    flow: '01', userId: 'u-an', label: 'Kết quả kiểm tra trùng', route: '/reporter/articles/art-nuocsach/duplication-check',
    description: 'Trùng nội dung 12% → bình thường. Ảnh 2 tái sử dụng (lệch 3 bit), Ảnh 3 nguồn ngoài → 0 đ. Bài thứ 14 của sự kiện trong 7 ngày → bão hòa 80%, khóa khi nộp.'
  },
  {
    flow: '01', userId: 'u-binh', label: 'Bình xác nhận đồng tác giả', route: '/reporter/confirmations',
    description: 'Bình xác nhận tỷ lệ 40% (19/06) → bài chuyển "Đã nộp". Màn này liệt kê các bài đang chờ Bình xác nhận, có nút giả lập quá hạn 3 ngày.'
  },
  {
    flow: '02', userId: 'u-long', label: 'Trưởng ban phân công', route: '/editor-lead/queue',
    description: 'Hệ thống gợi ý BTV đang chấm ít bài nhất, ưu tiên người đã chấm thể loại đó (BTV Cường). Trưởng ban chọn và xác nhận.'
  },
  {
    flow: '02', userId: 'u-cuong-btv', label: 'BTV Cường chấm lần 1', route: '/editor/score/art-nuocsach',
    description: 'Lần 1 (21/06): 70/40/70/80/70 = 64 điểm; tiêu chí 2 = 40 < 50 bắt buộc nhận xét "Thiếu nguồn đối chứng" → Trả về. Xem ở "Lịch sử các lần chấm".'
  },
  {
    flow: '01', userId: 'u-an', label: 'An sửa và nộp lại', route: '/reporter/articles',
    description: 'Chỉ sửa nội dung, không đổi tỷ lệ → nộp thẳng, quay về đúng BTV cũ; kiểm tra trùng lại vẫn 12%. Mở tab "Trả về" để thử với bài đang bị trả về.'
  },
  {
    flow: '02', userId: 'u-cuong-btv', label: 'BTV chấm lại → Nhận', route: '/editor/queue',
    description: 'Lần 2 (24/06): 80/80/75/80/75 = 78 điểm → Nhận & gửi duyệt điểm. Cả hai lần chấm đều được lưu.'
  },
  {
    flow: '02', userId: 'u-long', label: 'Duyệt điểm & duyệt đăng', route: '/editor-lead/score-approval',
    description: 'Trưởng ban duyệt → công bố 78 điểm (25/06), hạn khiếu nại đến 02/07. Duyệt đăng 29/06/2026 → ngày đăng quyết định đơn giá ở luồng 04.'
  },
  {
    flow: '04', userId: 'u-toan', label: 'Thư ký chấm nhuận bút kỳ 06', route: '/secretary/royalty-periods/per-2026-06',
    description: '78 → 0,8; 15 × 0,8 = 12; bão hòa 80% = 9,6; × 234.000 = 2.246.400 đ → Bình 898.000 đ, An 1.348.400 đ; Ảnh 1: 702.000 đ cho Bình.'
  },
  {
    flow: '04', userId: 'u-ngoc', label: 'Kế toán kiểm tra & khóa kỳ', route: '/accounting/periods/per-2026-08',
    description: 'Kỳ 08/2026 đang chờ Kế toán: trả về Thư ký (bắt buộc lý do) hoặc khóa kỳ → tạo phiếu chi từng người → ghi nhận đã chi. Phiếu chi không bao giờ âm.'
  },
  {
    flow: '03', userId: 'u-an', label: 'An gửi khiếu nại', route: '/reporter/appeals',
    description: '01/07: An khiếu nại tiêu chí 3 – còn hạn, chưa khiếu nại lần nào. Hệ thống tự giao BTV khác chấm mù, không qua Trưởng ban.'
  },
  {
    flow: '03', userId: 'u-dung', label: 'BTV Dũng chấm lại mù', route: '/editor/rescore/app-ns',
    description: '03/07: Dũng chấm 90/90/95/90/95 = 92 ≥ 78 → áp dụng 92. (Nếu thấp hơn quá 5 điểm → BTV thứ ba chấm, lấy trung vị.)'
  },
  {
    flow: '04', userId: 'u-toan', label: 'Dòng điều chỉnh kỳ 07', route: '/secretary/royalty-periods/per-2026-07',
    description: '92 → bậc 1,0, miễn bão hòa: 15 × 234.000 = 3.510.000 đ (vẫn đơn giá theo ngày đăng). Điều chỉnh: An +757.600 đ, Bình +506.000 đ, tổng +1.263.600 đ.'
  },
  {
    flow: '05', userId: 'u-long', label: 'KPI & báo cáo', route: '/kpi/reporters/u-an?month=6&year=2026',
    description: 'KPI tháng 6 (chốt 05/07, dùng điểm 92): An 0,6 bài, Bình 0,4 bài. Báo cáo thể loại: chi / 1.000 lượt xem ≈ 339.700 đ với 12.400 lượt xem.'
  }
];

const FLOW_TONE: Record<DemoStep['flow'], string> = {
  '01': 'bg-blue-600',
  '02': 'bg-indigo-500',
  '03': 'bg-rose-500',
  '04': 'bg-amber-500',
  '05': 'bg-emerald-600'
};

export const GuidedDemoBar: React.FC = () => {
  const { state, dispatch, notify } = useApp();
  const navigate = useNavigate();
  const [idx, setIdx] = useState(0);
  const [collapsed, setCollapsed] = useState(false);

  const goTo = (i: number) => {
    const step = DEMO_STEPS[i];
    setIdx(i);
    dispatch({ type: 'SWITCH_USER', payload: step.userId });
    navigate(step.route);
  };

  const reset = () => {
    dispatch({ type: 'RESET_DEMO' });
    setIdx(0);
    navigate(DEMO_STEPS[0].route);
    notify('Đã khôi phục toàn bộ dữ liệu demo về ban đầu', 'info');
  };

  const step = DEMO_STEPS[idx];
  const user = state.users.find(u => u.id === step.userId);

  return (
    <aside aria-label="Kịch bản demo" className="fixed bottom-0 left-0 right-0 z-40 border-t border-blue-950 bg-slate-900 text-white shadow-2xl">
      <div className="mx-auto max-w-7xl px-4 py-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600">
              <Compass className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
                <span className="uppercase tracking-wider text-blue-300">Kịch bản demo</span>
                <span className="rounded bg-slate-700 px-1.5 py-0.5 text-[10px] text-slate-200">Bước {idx + 1}/{DEMO_STEPS.length}</span>
                <span className={`rounded px-1.5 py-0.5 text-[10px] text-white ${FLOW_TONE[step.flow]}`}>Luồng {step.flow}</span>
                <span className="text-white">{step.label}</span>
                <span className="text-slate-400">· {user?.full_name}</span>
              </div>
              {!collapsed && <p className="mt-0.5 text-xs text-slate-300 line-clamp-2">{step.description}</p>}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              onClick={() => goTo(Math.max(0, idx - 1))}
              disabled={idx === 0}
              className="flex items-center gap-1 rounded-lg bg-slate-700 px-2.5 py-1.5 text-xs font-semibold hover:bg-slate-600 disabled:opacity-40"
            >
              <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Bước trước</span>
            </button>
            <button
              onClick={() => goTo((idx + 1) % DEMO_STEPS.length)}
              className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold hover:bg-emerald-500"
            >
              <span>Bước tiếp theo</span> <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={reset}
              title="Khôi phục dữ liệu demo"
              className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              <RotateCcw className="w-4 h-4" /> <span className="hidden xl:inline">Khôi phục dữ liệu</span>
            </button>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              title={collapsed ? 'Mở rộng' : 'Thu gọn'}
            >
              {collapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {!collapsed && (
          <div className="mt-2 hidden items-center gap-1 overflow-x-auto md:flex">
            {DEMO_STEPS.map((s, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                title={`Luồng ${s.flow} · ${s.label}`}
                className={`flex items-center gap-1 whitespace-nowrap rounded px-2 py-0.5 text-[11px] transition ${
                  i === idx ? 'bg-white text-slate-900 font-bold' : i < idx ? 'bg-slate-800 text-emerald-300' : 'bg-slate-800/70 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${FLOW_TONE[s.flow]}`} />
                {i + 1}. {s.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};
