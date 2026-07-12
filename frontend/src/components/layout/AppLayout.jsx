import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { Menu } from 'lucide-react';

export default function AppLayout() {
  const { currentUser } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!currentUser) return <Navigate to="/login" replace />;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden relative">
      {/* Mobile sidebar backdrop overlay */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar - fixed sliding drawer on mobile, static on desktop */}
      <aside className={`fixed inset-y-0 left-0 z-50 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:h-auto transition-transform duration-200 ease-in-out`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* Main content body */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Mobile Bar */}
        <header className="lg:hidden h-14 bg-white border-b border-slate-100 flex items-center justify-between px-4 flex-shrink-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-50 transition-colors"
            title="Open menu"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">AF</span>
            </div>
            <span className="font-semibold text-slate-900 text-sm">AssetFlow</span>
          </div>
          <div className="w-8 h-8" /> {/* Balance spacer */}
        </header>

        <main className="flex-grow overflow-y-auto">
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
