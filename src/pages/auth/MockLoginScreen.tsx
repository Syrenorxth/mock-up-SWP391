import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Newspaper, PenTool, Users2, CheckSquare, Coins, Wallet, ShieldCheck, Workflow } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { RoleCode, ROLE_INFO } from '../../types';
import { getFirstRouteForRole } from '../../components/common/Header';

const ROLE_ORDER: RoleCode[] = ['PHONG_VIEN', 'TRUONG_BAN', 'BIEN_TAP_VIEN', 'THU_KY', 'KE_TOAN', 'ADMIN'];

const ROLE_META: Record<RoleCode, { flows: string; does: string; icon: React.ReactNode; tone: string }> = {
  PHONG_VIEN: {
    flows: 'Luồng 01, 03, 04, 05',
    does: 'Nộp tác phẩm, khai báo đồng tác giả, xác nhận đồng tác giả, khiếu nại điểm, xem nhuận bút và KPI cá nhân.',
    icon: <PenTool className="w-4 h-4" />,
    tone: 'text-blue-800 bg-blue-50 border-blue-200'
  },
  TRUONG_BAN: {
    flows: 'Luồng 02, 03, 05',
    does: 'Phân công BTV, duyệt điểm, duyệt đăng, theo dõi khiếu nại, đặt chỉ tiêu và chốt KPI tháng.',
    icon: <Users2 className="w-4 h-4" />,
    tone: 'text-indigo-800 bg-indigo-50 border-indigo-200'
  },
  BIEN_TAP_VIEN: {
    flows: 'Luồng 02, 03',
    does: 'Chấm chất lượng theo bộ tiêu chí, trả về / từ chối bài, chấm lại mù khi có khiếu nại.',
    icon: <CheckSquare className="w-4 h-4" />,
    tone: 'text-teal-800 bg-teal-50 border-teal-200'
  },
  THU_KY: {
    flows: 'Luồng 04',
    does: 'Chấm nhuận bút theo công thức ①–⑧, quản lý sự kiện bão hòa, chốt kỳ gửi Kế toán.',
    icon: <Coins className="w-4 h-4" />,
    tone: 'text-amber-800 bg-amber-50 border-amber-200'
  },
  KE_TOAN: {
    flows: 'Luồng 04',
    does: 'Kiểm tra kỳ, trả về hoặc khóa kỳ, lập phiếu chi, ghi nhận đã chi, báo cáo chi, đơn giá.',
    icon: <Wallet className="w-4 h-4" />,
    tone: 'text-emerald-800 bg-emerald-50 border-emerald-200'
  },
  ADMIN: {
    flows: 'Danh mục · Luồng 02, 05',
    does: 'Thể loại & khung hệ số, bộ tiêu chí, tham số hệ thống, nhập số liệu độc giả (CSV).',
    icon: <ShieldCheck className="w-4 h-4" />,
    tone: 'text-slate-800 bg-slate-50 border-slate-300'
  }
};

const FLOWS = [
  { no: '01', name: 'Tiếp nhận tác phẩm & kiểm chứng khai báo', actors: 'Phóng viên' },
  { no: '02', name: 'Chấm chất lượng', actors: 'Trưởng ban, BTV, Admin' },
  { no: '03', name: 'Kiểm soát chất lượng chấm', actors: 'Phóng viên, BTV, Trưởng ban' },
  { no: '04', name: 'Tính & chi nhuận bút', actors: 'Thư ký, Kế toán' },
  { no: '05', name: 'KPI & Báo cáo', actors: 'Trưởng ban, Phóng viên, Admin' }
];

export const MockLoginScreen: React.FC = () => {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();

  const login = (userId: string, role: RoleCode) => {
    dispatch({ type: 'SWITCH_USER', payload: userId });
    navigate(getFirstRouteForRole(role));
  };

  return (
    <div className="min-h-screen bg-slate-50 newsprint-pattern font-sans-ui text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-900 text-white">
            <Newspaper className="w-6 h-6" />
          </span>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-blue-800">SWP391 · Bài toán 3 · Mockup demo</div>
            <h1 className="text-2xl font-black font-editorial">Hệ thống Đánh giá Chất lượng và Quản lý Nhuận bút</h1>
          </div>
        </div>
        <p className="mt-3 max-w-3xl text-sm text-slate-600">
          Chọn một người dùng để đăng nhập nhanh. Mỗi thẻ ghi rõ vai trò làm gì và tham gia những luồng nào. Dữ liệu là dữ liệu mẫu, lưu trong bộ nhớ trình duyệt và
          khôi phục khi tải lại trang.
        </p>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Workflow className="w-4 h-4 text-blue-800" /> 5 luồng nghiệp vụ
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {FLOWS.map(f => (
              <div key={f.no} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                <div className="text-[11px] font-black text-blue-800">LUỒNG {f.no}</div>
                <div className="mt-0.5 text-xs font-bold text-slate-900 leading-snug">{f.name}</div>
                <div className="mt-1 text-[11px] text-slate-500">{f.actors}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 space-y-7">
          {ROLE_ORDER.map(role => {
            const users = state.users.filter(u => u.role_code === role);
            const meta = ROLE_META[role];
            return (
              <section key={role}>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${meta.tone}`}>
                    {meta.icon} {ROLE_INFO[role].label}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">{meta.flows}</span>
                  <span className="text-xs text-slate-500">· {meta.does}</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {users.map(u => (
                    <button
                      key={u.id}
                      onClick={() => login(u.id, role)}
                      className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-xs transition hover:border-blue-700 hover:ring-2 hover:ring-blue-100"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-bold text-slate-900">{u.full_name}</div>
                        <div className="truncate text-xs text-slate-500">{u.job_title}</div>
                        <div className="mt-1 text-[11px] text-slate-400">{['PHONG_VIEN', 'BIEN_TAP_VIEN', 'TRUONG_BAN'].includes(role) ? state.sections.find(s => s.id === u.section_id)?.name : u.department}</div>
                      </div>
                      <ArrowRight className="w-4 h-4 shrink-0 text-slate-300 group-hover:text-blue-800" />
                    </button>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
};
