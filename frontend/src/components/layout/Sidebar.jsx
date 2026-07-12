import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Package, ArrowLeftRight,
  CalendarDays, Wrench, ClipboardList, BarChart3,
  Bell, LogOut, ChevronRight, X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import { ROLES } from '../../data/mockData';

const navItems = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/org',          icon: Building2,       label: 'Organization',  adminOnly: true },
  { to: '/assets',       icon: Package,         label: 'Assets' },
  { to: '/allocation',   icon: ArrowLeftRight,  label: 'Allocation & Transfer' },
  { to: '/bookings',     icon: CalendarDays,    label: 'Resource Booking' },
  { to: '/maintenance',  icon: Wrench,          label: 'Maintenance' },
  { to: '/audit',        icon: ClipboardList,   label: 'Audit' },
  { to: '/reports',      icon: BarChart3,       label: 'Reports' },
  { to: '/notifications',icon: Bell,            label: 'Notifications' },
];

export default function Sidebar({ onClose }) {
  const { currentUser, logout } = useAuth();
  const { notifications } = useAppData();
  const navigate = useNavigate();
  const unread = notifications.filter(n => n.userId === currentUser?.id && !n.read).length;

  const handleLogout = () => { logout(); navigate('/login'); if (onClose) onClose(); };

  const visibleItems = navItems.filter(item => {
    if (item.adminOnly) return currentUser?.role === ROLES.ADMIN;
    return true;
  });

  return (
    <aside className="h-full w-64 bg-white border-r border-slate-100 flex flex-col shadow-sm">
      {/* Brand */}
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-sm">AF</span>
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-sm leading-tight">AssetFlow</p>
            <p className="text-xs text-slate-400">Enterprise Asset Manager</p>
          </div>
        </div>
        {onClose && (
          <button 
            onClick={onClose} 
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
            title="Close menu"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-0.5">
          {visibleItems.map(({ to, icon: Icon, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group
                  ${isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={18} className={isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'} />
                    <span className="flex-1">{label}</span>
                    {label === 'Notifications' && unread > 0 && (
                      <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User */}
      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-50 cursor-pointer">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-blue-700 text-xs font-semibold">{currentUser?.avatar}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{currentUser?.name}</p>
            <p className="text-xs text-slate-400 truncate">{currentUser?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
