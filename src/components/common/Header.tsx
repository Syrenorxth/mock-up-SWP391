import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Bell, Check, ChevronRight, Newspaper, Clock, UserCheck, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { RoleCode } from '../../types';

interface BreadcrumbItem {
  label: string;
  link?: string;
}

interface PageHeaderProps {
  breadcrumbs?: BreadcrumbItem[];
  title: string;
  description?: string;
  subtitle?: string;
  icon?: React.ElementType;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  breadcrumbs,
  title,
  description,
  subtitle,
  icon: Icon,
  actions
}) => {
  const navigate = useNavigate();
  const desc = description || subtitle;

  return (
    <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200/80 pb-5">
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center space-x-1.5 text-xs text-slate-500 mb-2">
            {breadcrumbs.map((b, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                {b.link ? (
                  <button
                    onClick={() => navigate(b.link!)}
                    className="hover:text-blue-900 font-medium transition-colors cursor-pointer"
                  >
                    {b.label}
                  </button>
                ) : (
                  <span className="text-slate-900 font-semibold">{b.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}
        <h1 className="text-2xl font-black text-slate-900 font-editorial flex items-center gap-2.5">
          {Icon && <Icon className="w-6 h-6 text-blue-900 shrink-0" />}
          <span>{title}</span>
        </h1>
        {desc && (
          <p className="mt-1 text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
            {desc}
          </p>
        )}
      </div>

      {actions && <div className="flex items-center gap-2.5 shrink-0 flex-wrap">{actions}</div>}
    </div>
  );
};

export const getFirstRouteForRole = (role: RoleCode): string => {
  switch (role) {
    case 'PHONG_VIEN':
      return '/reporter/articles';
    case 'TRUONG_BAN':
      return '/editor-lead/queue';
    case 'BIEN_TAP_VIEN':
      return '/editor/queue';
    case 'THU_KY':
      return '/secretary/royalty-queue';
    case 'KE_TOAN':
      return '/royalty/periods';
    case 'ADMIN':
      return '/admin/parameters';
    default:
      return '/reporter/articles';
  }
};

export const TopNavbar: React.FC = () => {
  const { state, dispatch, notify } = useApp();
  const navigate = useNavigate();
  const [showNotifs, setShowNotifs] = useState(false);

  const unreadCount = state.notifications.filter(n => n.user_id === state.currentUser.id && !n.is_read).length;
  const userNotifs = state.notifications.filter(n => n.user_id === state.currentUser.id);

  const roleDisplayNames: Record<RoleCode, string> = {
    PHONG_VIEN: 'Phóng viên',
    TRUONG_BAN: 'Trưởng ban',
    BIEN_TAP_VIEN: 'Biên tập viên',
    THU_KY: 'Thư ký tòa soạn',
    KE_TOAN: 'Kế toán',
    ADMIN: 'Quản trị viên'
  };

  const handleRoleChange = (newRole: RoleCode) => {
    dispatch({ type: 'SWITCH_ROLE', payload: newRole });
    const targetRoute = getFirstRouteForRole(newRole);
    navigate(targetRoute);
    notify(`Đã chuyển vai trò sang: ${roleDisplayNames[newRole]}`, 'info');
  };

  const handleUserChange = (userId: string) => {
    const selectedUser = state.users.find(u => u.id === userId);
    if (!selectedUser) return;
    const oldRole = state.currentRole;
    dispatch({ type: 'SWITCH_USER', payload: userId });
    notify(`Đã đổi người dùng: ${selectedUser.full_name} (${roleDisplayNames[selectedUser.role_code]})`, 'success');
    if (selectedUser.role_code !== oldRole) {
      navigate(getFirstRouteForRole(selectedUser.role_code));
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/90 bg-white/95 backdrop-blur-md px-4 sm:px-6 shadow-xs">
      {/* Brand & System Masthead */}
      <div className="flex items-center gap-3.5 cursor-pointer" onClick={() => navigate('/login')}>
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-amber-400 font-black shadow-md border border-amber-400/30">
          <Newspaper className="w-5 h-5 text-amber-400" />
          <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border border-white"></span>
          </span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-xs">
              TÒA SOẠN BÁO ĐIỆN TỬ
            </span>
            <span className="hidden xl:flex items-center gap-1 text-[11px] text-slate-500 font-medium">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>SWP391 • Kỳ NB: 09/2026</span>
            </span>
          </div>
          <div className="text-sm font-black text-slate-900 font-editorial">
            Hệ thống Đánh giá Chất lượng & Quản lý Nhuận bút
          </div>
        </div>
      </div>

      {/* Right controls: Role switcher, Fast user switcher & User Avatar */}
      <div className="flex items-center gap-2.5 sm:gap-3.5">
        {/* Quick User Switcher dropdown */}
        <div className="flex items-center gap-1.5 bg-blue-50/70 border border-blue-200 rounded-xl px-2.5 py-1 shadow-2xs">
          <Users className="w-3.5 h-3.5 text-blue-700 shrink-0" />
          <label htmlFor="user-select" className="hidden lg:inline text-xs font-semibold text-blue-900 whitespace-nowrap">
            Người dùng:
          </label>
          <select
            id="user-select"
            value={state.currentUser.id}
            onChange={(e) => handleUserChange(e.target.value)}
            className="text-xs font-bold text-blue-950 bg-white border border-blue-300 rounded-lg px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer shadow-2xs max-w-[170px] sm:max-w-[210px] truncate"
            title="Đổi nhanh người dùng để thử nghiệm phân quyền và đồng tác giả"
          >
            <optgroup label="— Phóng viên (Ban Xã hội) —">
              <option value="u-an">Nguyễn Văn An (Tác giả chính)</option>
              <option value="u-binh">Trần Thị Bình (Đồng tác giả)</option>
              <option value="u-nam">Lê Hoàng Nam</option>
              <option value="u-tuan">Phạm Minh Tuấn</option>
            </optgroup>
            <optgroup label="— Biên tập viên —">
              <option value="u-cuong-btv">Đỗ Mạnh Cường (Ban Xã hội)</option>
              <option value="u-dung">Hoàng Văn Dũng (Ban Xã hội)</option>
              <option value="u-ha">Vũ Thu Hà (Ban Xã hội)</option>
              <option value="u-quocanh">Bùi Quốc Anh (Ban Kinh tế)</option>
            </optgroup>
            <optgroup label="— Lãnh đạo & Nghiệp vụ —">
              <option value="u-long">Phan Hải Long (Trưởng ban XH)</option>
              <option value="u-toan">Vũ Đình Toàn (Thư ký tòa soạn)</option>
              <option value="u-ngoc">Nguyễn Bích Ngọc (Kế toán)</option>
              <option value="u-admin">Đặng Quốc Cường (Quản trị viên)</option>
            </optgroup>
          </select>
        </div>

        {/* Role Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/90 rounded-xl px-2.5 py-1 shadow-2xs">
          <label htmlFor="role-select" className="hidden sm:inline text-xs font-semibold text-slate-600 whitespace-nowrap">
            Vai trò:
          </label>
          <select
            id="role-select"
            value={state.currentRole}
            onChange={(e) => handleRoleChange(e.target.value as RoleCode)}
            className="text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer shadow-2xs"
          >
            {state.roles.map(r => (
              <option key={r.id} value={r.code}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        {/* User Avatar with Profile Details */}
        <div className="flex items-center gap-2 pl-1 border-l border-slate-200 text-xs">
          <div className="relative shrink-0">
            {state.currentUser.avatar_url ? (
              <img
                src={state.currentUser.avatar_url}
                alt={state.currentUser.full_name}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-900/20 shadow-xs"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-900 to-indigo-700 text-white font-black flex items-center justify-center shadow-xs">
                {state.currentUser.full_name.charAt(0)}
              </div>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
          </div>

          <div className="hidden xl:block text-left">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 text-xs">{state.currentUser.full_name}</span>
              <span className="text-[10px] font-bold text-blue-800 bg-blue-50 px-1.5 py-0.2 rounded-xs border border-blue-200">
                {roleDisplayNames[state.currentRole]}
              </span>
            </div>
          </div>
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
            title="Thông báo hệ thống"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-black text-white shadow-xs">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotifs && (
            <div className="absolute right-0 mt-2 w-80 md:w-96 rounded-2xl border border-slate-200 bg-white shadow-2xl z-50 overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50">
                <div className="font-bold text-sm text-slate-900">
                  Thông báo tòa soạn {unreadCount > 0 && `(${unreadCount} mới)`}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => dispatch({ type: 'MARK_ALL_NOTIFS_READ' })}
                    className="text-xs text-blue-800 hover:text-blue-900 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Đã đọc tất cả
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {userNotifs.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500">
                    Không có thông báo mới nào
                  </div>
                ) : (
                  userNotifs.map(notif => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        dispatch({ type: 'MARK_NOTIF_READ', payload: notif.id });
                        if (notif.link) {
                          navigate(notif.link);
                          setShowNotifs(false);
                        }
                      }}
                      className={`p-3.5 text-xs cursor-pointer transition-colors hover:bg-slate-50 ${
                        !notif.is_read ? 'bg-blue-50/60 font-medium' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                        <span className="font-semibold text-blue-900">Nghiệp vụ</span>
                        <span>{notif.created_at}</span>
                      </div>
                      <p className="text-slate-800">{notif.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
