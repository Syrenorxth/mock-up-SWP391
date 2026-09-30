import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { TopNavbar } from '../common/Header';
import { GuidedDemoBar } from '../common/GuidedDemoBar';
import { ToastContainer } from '../common/ToastContainer';
import {
  FileText,
  PenSquare,
  ListTodo,
  CheckSquare,
  Globe,
  Coins,
  Receipt,
  FileSpreadsheet,
  Target,
  BarChart3,
  UserCheck,
  FolderTree,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Layers,
  Sliders,
  Scale,
  Shuffle,
  TrendingUp,
  Calendar,
  Image as ImageIcon,
  Wallet,
  Lock,
  PieChart,
  Flame,
  ClipboardCheck,
  Upload
} from 'lucide-react';
import { RoleCode } from '../../types';

interface MenuItem {
  label: string;
  route: string;
  icon: React.ReactNode;
  badgeCount?: number;
  iter3?: boolean;
}

/** Nhãn luồng hiển thị ở đầu mỗi màn (route → luồng, có đánh dấu Iter 3) */
const FLOW_NAMES: Record<string, string> = {
  '01': 'Tiếp nhận tác phẩm & kiểm chứng khai báo',
  '02': 'Chấm chất lượng',
  '03': 'Kiểm soát chất lượng chấm',
  '04': 'Tính & chi nhuận bút',
  '05': 'KPI & Báo cáo',
  AD: 'Danh mục & tham số (Admin)',
  TK: 'Tham khảo chung'
};
const ROUTE_FLOW: { re: RegExp; flow: string; iter3?: boolean }[] = [
  { re: /^\/reporter\/articles\/[^/]+\/score/, flow: '02' },
  { re: /^\/reporter\/(articles|confirmations)/, flow: '01' },
  { re: /^\/articles\//, flow: '01' },
  { re: /^\/reporter\/appeals/, flow: '03' },
  { re: /^\/reporter\/royalties/, flow: '04' },
  { re: /^\/editor-lead\/(queue|assign|score-approval|publish-queue)/, flow: '02' },
  { re: /^\/editor\/(queue|score)/, flow: '02' },
  { re: /^\/editor\/rescore/, flow: '03' },
  { re: /^\/editor-lead\/appeals\/[^/]+\/compare/, flow: '03', iter3: true },
  { re: /^\/editor-lead\/appeals/, flow: '03' },
  { re: /^\/editor-lead\/(cross-review|reviewer-deviation|reviewers)/, flow: '03', iter3: true },
  { re: /^\/(secretary|accounting|royalty)\//, flow: '04' },
  { re: /^\/kpi\//, flow: '05' },
  { re: /^\/reports\//, flow: '05', iter3: true },
  { re: /^\/admin\/reader-import/, flow: '05' },
  { re: /^\/admin\/criteria-sets/, flow: '02' },
  { re: /^\/admin\/(genres|media-factors|unit-prices)/, flow: '04' },
  { re: /^\/admin\//, flow: 'AD' },
  { re: /^\/published/, flow: 'TK' }
];

interface MenuGroup {
  groupName: string;
  items: MenuItem[];
}

export const AppLayout: React.FC = () => {
  const { state } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const routeFlow = ROUTE_FLOW.find(r => r.re.test(location.pathname));
  const [collapsed, setCollapsed] = useState(false);

  // Tính số lượng badge theo các trạng thái chuẩn
  const pendingAssignCount = state.articles.filter(a => a.status === 'SUBMITTED').length;
  const pendingScoreApprovalCount = state.articles.filter(a => a.status === 'PENDING_APPROVAL').length;
  const pendingPublishCount = state.articles.filter(a => a.status === 'SCORE_PUBLISHED').length;
  const pendingRoyaltyCount = state.articles.filter(
    a => a.status === 'PUBLISHED' && !state.royaltyItems.some(r => r.article_id === a.id)
  ).length;
  const pendingCoAuthorConfirmCount = state.articleAuthors.filter(
    au => au.user_id === state.currentUser.id && !au.is_main && au.confirm_status === 'PENDING'
  ).length;
  const myAssignedCount = state.articles.filter(
    a => a.editor_id === state.currentUser.id && a.status === 'ASSIGNED'
  ).length;

  const pendingAppealRescoreCount = state.appeals.filter(
    ap =>
      (ap.rescore_editor_id === state.currentUser.id && ap.status === 'IN_RESCORE') ||
      (ap.third_editor_id === state.currentUser.id && ap.status === 'IN_THIRD_REVIEW')
  ).length;
  const closedPeriodCount = state.royaltyPeriods.filter(p => p.status === 'CLOSED').length;
  const unpaidVoucherCount = state.paymentVouchers.filter(v => !v.is_paid).length;
  const ic = 'w-4 h-4';

  const getMenuGroupsForRole = (role: RoleCode): MenuGroup[] => {
    switch (role) {
      case 'PHONG_VIEN':
        return [
          {
            groupName: 'Luồng 01 · Tiếp nhận tác phẩm',
            items: [
              { label: 'Tác phẩm của tôi', route: '/reporter/articles', icon: <FileText className={ic} /> },
              { label: 'Soạn bài mới', route: '/reporter/articles/new', icon: <PenSquare className={ic} /> },
              { label: 'Xác nhận đồng tác giả', route: '/reporter/confirmations', icon: <UserCheck className={ic} />, badgeCount: pendingCoAuthorConfirmCount }
            ]
          },
          {
            groupName: 'Luồng 03 · Kiểm soát chất lượng chấm',
            items: [{ label: 'Khiếu nại chất lượng', route: '/reporter/appeals', icon: <Scale className={ic} /> }]
          },
          {
            groupName: 'Luồng 04 · Nhuận bút',
            items: [{ label: 'Nhuận bút của tôi', route: '/reporter/royalties', icon: <Wallet className={ic} /> }]
          },
          {
            groupName: 'Luồng 05 · KPI & Báo cáo',
            items: [{ label: 'KPI cá nhân', route: '/kpi/personal', icon: <Target className={ic} /> }]
          },
          {
            groupName: 'Tham khảo',
            items: [{ label: 'Bài đã đăng', route: '/published', icon: <Globe className={ic} /> }]
          }
        ];

      case 'TRUONG_BAN':
        return [
          {
            groupName: 'Luồng 02 · Chấm chất lượng',
            items: [
              { label: 'Hàng chờ phân công', route: '/editor-lead/queue', icon: <ListTodo className={ic} />, badgeCount: pendingAssignCount },
              { label: 'Duyệt điểm', route: '/editor-lead/score-approval', icon: <CheckSquare className={ic} />, badgeCount: pendingScoreApprovalCount },
              { label: 'Duyệt đăng', route: '/editor-lead/publish-queue', icon: <Globe className={ic} />, badgeCount: pendingPublishCount }
            ]
          },
          {
            groupName: 'Luồng 03 · Kiểm soát chất lượng chấm',
            items: [
              { label: 'Danh sách khiếu nại', route: '/editor-lead/appeals', icon: <Scale className={ic} /> },
              { label: 'Chấm chéo', route: '/editor-lead/cross-review', icon: <Shuffle className={ic} />, iter3: true },
              { label: 'Độ lệch người chấm', route: '/editor-lead/reviewer-deviation', icon: <TrendingUp className={ic} />, iter3: true }
            ]
          },
          {
            groupName: 'Luồng 05 · KPI & Báo cáo',
            items: [
              { label: 'Đặt chỉ tiêu', route: '/kpi/targets', icon: <Target className={ic} /> },
              { label: 'Bảng KPI của ban', route: '/kpi/section', icon: <BarChart3 className={ic} /> },
              { label: 'Chốt KPI tháng', route: '/kpi/finalize', icon: <Lock className={ic} /> },
              { label: 'Báo cáo thể loại', route: '/reports/genres', icon: <PieChart className={ic} />, iter3: true },
              { label: 'Sự kiện đang nổi', route: '/reports/trending', icon: <Flame className={ic} />, iter3: true }
            ]
          },
          {
            groupName: 'Tham khảo',
            items: [{ label: 'Bài đã đăng', route: '/published', icon: <Globe className={ic} /> }]
          }
        ];

      case 'BIEN_TAP_VIEN':
        return [
          {
            groupName: 'Luồng 02 · Chấm chất lượng',
            items: [
              { label: 'Hàng việc của tôi', route: '/editor/queue', icon: <ListTodo className={ic} />, badgeCount: myAssignedCount + pendingAppealRescoreCount }
            ]
          },
          {
            groupName: 'Tham khảo',
            items: [{ label: 'Bài đã đăng', route: '/published', icon: <Globe className={ic} /> }]
          }
        ];

      case 'THU_KY':
        return [
          {
            groupName: 'Luồng 04 · Tính & chi nhuận bút',
            items: [
              { label: 'Hàng chờ chấm nhuận bút', route: '/secretary/royalty-queue', icon: <Coins className={ic} />, badgeCount: pendingRoyaltyCount },
              { label: 'Bảng chấm & chốt kỳ', route: '/secretary/royalty-periods', icon: <Receipt className={ic} /> },
              { label: 'Danh sách kỳ', route: '/royalty/periods', icon: <Calendar className={ic} /> },
              { label: 'Quản lý sự kiện', route: '/secretary/events', icon: <Flame className={ic} /> }
            ]
          },
          {
            groupName: 'Danh mục (tham chiếu)',
            items: [
              { label: 'Thể loại & khung hệ số', route: '/admin/genres', icon: <FolderTree className={ic} /> },
              { label: 'Hệ số ảnh / video', route: '/admin/media-factors', icon: <ImageIcon className={ic} /> },
              { label: 'Đơn giá theo hiệu lực', route: '/admin/unit-prices', icon: <DollarSign className={ic} /> }
            ]
          },
          {
            groupName: 'Tham khảo',
            items: [{ label: 'Bài đã đăng', route: '/published', icon: <Globe className={ic} /> }]
          }
        ];

      case 'KE_TOAN':
        return [
          {
            groupName: 'Luồng 04 · Tính & chi nhuận bút',
            items: [
              { label: 'Danh sách kỳ', route: '/royalty/periods', icon: <Calendar className={ic} /> },
              { label: 'Kiểm tra kỳ', route: '/accounting/periods', icon: <ClipboardCheck className={ic} />, badgeCount: closedPeriodCount },
              { label: 'Phiếu chi & đã chi', route: '/accounting/vouchers', icon: <Receipt className={ic} />, badgeCount: unpaidVoucherCount },
              { label: 'Báo cáo chi', route: '/accounting/report', icon: <FileSpreadsheet className={ic} /> },
              { label: 'Đơn giá theo hiệu lực', route: '/admin/unit-prices', icon: <DollarSign className={ic} /> }
            ]
          },
          {
            groupName: 'Tham khảo',
            items: [{ label: 'Bài đã đăng', route: '/published', icon: <Globe className={ic} /> }]
          }
        ];

      case 'ADMIN':
        return [
          {
            groupName: 'Danh mục & tham số',
            items: [
              { label: 'Tham số hệ thống', route: '/admin/parameters', icon: <Sliders className={ic} /> },
              { label: 'Bộ tiêu chí theo thể loại', route: '/admin/criteria-sets', icon: <CheckSquare className={ic} /> },
              { label: 'Thể loại & khung hệ số', route: '/admin/genres', icon: <FolderTree className={ic} /> },
              { label: 'Hệ số ảnh / video', route: '/admin/media-factors', icon: <ImageIcon className={ic} /> },
              { label: 'Đơn giá theo hiệu lực', route: '/admin/unit-prices', icon: <DollarSign className={ic} /> }
            ]
          },
          {
            groupName: 'Luồng 05 · KPI & Báo cáo',
            items: [
              { label: 'Nhập số liệu độc giả', route: '/admin/reader-import', icon: <Upload className={ic} /> },
              { label: 'Bảng KPI (xem)', route: '/kpi/section', icon: <BarChart3 className={ic} /> }
            ]
          },
          {
            groupName: 'Giám sát',
            items: [
              { label: 'Hàng chờ phân công', route: '/editor-lead/queue', icon: <ListTodo className={ic} /> },
              { label: 'Danh sách kỳ nhuận bút', route: '/royalty/periods', icon: <Receipt className={ic} /> },
              { label: 'Bài đã đăng', route: '/published', icon: <Globe className={ic} /> }
            ]
          }
        ];
    }
  };

  const menuGroups = getMenuGroupsForRole(state.currentRole);

  return (
    <div className="min-h-screen bg-slate-50/60 newsprint-pattern text-slate-900 flex flex-col antialiased font-sans-ui">
      {/* Top Navbar */}
      <TopNavbar />

      {/* Main Body with Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside
          className={`shrink-0 border-r border-slate-200/90 bg-white/95 backdrop-blur-sm transition-all duration-200 flex flex-col justify-between shadow-xs ${
            collapsed ? 'w-16' : 'w-64'
          }`}
        >
          {/* Active Press Profile Card inside Sidebar */}
          {!collapsed && (
            <div className="p-3.5 mx-3 mt-3 rounded-xl bg-gradient-to-br from-slate-900 to-blue-950 text-white border border-blue-800/40 shadow-sm space-y-2">
              <div className="flex items-center gap-2.5">
                <img
                  src={state.currentUser.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
                  alt={state.currentUser.full_name}
                  className="w-9 h-9 rounded-lg object-cover ring-2 ring-amber-400/40"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">
                    {state.currentUser.full_name}
                  </div>
                  <div className="text-[10px] text-amber-300 font-mono font-semibold truncate">
                    {state.currentUser.press_id || 'HNB-2026'}
                  </div>
                </div>
              </div>
              <div className="pt-1.5 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-300">
                <span className="truncate">{state.currentUser.job_title || 'Tác nghiệp'}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
              </div>
            </div>
          )}

          {/* Navigation Items grouped by Flow */}
          <div className="py-3 px-3 space-y-5 overflow-y-auto flex-1">
            {menuGroups.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1">
                {!collapsed && (
                  <div className="px-3 text-[10px] font-extrabold uppercase text-slate-400 mb-1.5 flex items-center gap-1.5">
                    <Layers className="w-3 h-3 text-slate-400" />
                    <span className="truncate">{group.groupName}</span>
                  </div>
                )}
                {group.items.map((item) => (
                  <NavLink
                    key={item.route}
                    to={item.route}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-blue-900 text-white shadow-sm ring-1 ring-blue-950'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`
                    }
                    title={collapsed ? item.label : undefined}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="shrink-0">{item.icon}</span>
                      {!collapsed && <span className="truncate">{item.label}</span>}
                      {!collapsed && item.iter3 && (
                        <span className="shrink-0 rounded px-1 text-[9px] font-bold border border-current opacity-60">Iter 3</span>
                      )}
                    </div>

                    {!collapsed && item.badgeCount !== undefined && item.badgeCount > 0 && (
                      <span className="ml-2 rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-[10px] font-bold">
                        {item.badgeCount}
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            ))}
          </div>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-slate-200/80 space-y-1 bg-slate-50/50">
            <button
              onClick={() => navigate('/login')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-blue-900 hover:bg-white border border-transparent hover:border-slate-200 transition-all cursor-pointer ${
                collapsed ? 'justify-center' : ''
              }`}
              title="Đổi vai trò / Đăng nhập"
            >
              <LogOut className="w-4 h-4 text-slate-400" />
              {!collapsed && <span>Đăng nhập demo</span>}
            </button>

            <button
              onClick={() => setCollapsed(!collapsed)}
              className="w-full flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white transition-colors cursor-pointer"
              title={collapsed ? 'Mở rộng thanh menu' : 'Thu gọn thanh menu'}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 pb-40">
          <div className="mx-auto max-w-7xl">
            {routeFlow && (
              <div className="mb-3 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-900">
                  <Layers className="w-3 h-3" />
                  {/^\d/.test(routeFlow.flow) ? `Luồng ${routeFlow.flow} · ` : ''}{FLOW_NAMES[routeFlow.flow]}
                </span>
                {routeFlow.iter3 && (
                  <span className="rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600">Iter 3</span>
                )}
              </div>
            )}
            <Outlet />
          </div>
        </main>
      </div>

      {/* Fixed Guided Demo Bar at bottom */}
      <GuidedDemoBar />

      {/* Global Toast Container */}
      <ToastContainer />
    </div>
  );
};
