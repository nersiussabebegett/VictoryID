
import React, { useState } from 'react';
import { UserRole, User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, activeTab, setActiveTab }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', roles: [UserRole.SUPER_ADMIN, UserRole.OWNER] },
    { id: 'inventory', label: 'Inventory', icon: '📦', roles: [UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.ADMIN] },
    { id: 'transactions', label: 'Transaksi', icon: '💰', roles: [UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.ADMIN] },
    { id: 'reports', label: 'Laporan', icon: '📑', roles: [UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.ADMIN] },
    { id: 'users', label: 'User Admin', icon: '👥', roles: [UserRole.SUPER_ADMIN, UserRole.OWNER] },
    { id: 'settings', label: 'Database', icon: '⚙️', roles: [UserRole.SUPER_ADMIN, UserRole.OWNER] },
  ];

  const visibleNavItems = navItems.filter(item => item.roles.includes(user.role));

  return (
    <div className="min-h-screen flex flex-col md:flex-row relative">
      <header className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center no-print">
        <h1 className="font-black text-xl italic tracking-tighter">VICTORY-ID</h1>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-2xl">{isSidebarOpen ? '✕' : '☰'}</button>
      </header>

      <aside className={`
        ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'} 
        md:translate-x-0 fixed md:relative z-50 w-64 h-screen bg-slate-900 text-white transition-transform duration-300 ease-in-out no-print flex flex-col border-r border-slate-800
      `}>
        <div className="p-8">
          <h1 className="text-3xl font-black italic tracking-tighter text-indigo-400 mb-10 hidden md:block">VICTORY.</h1>
          <nav className="space-y-1">
            {visibleNavItems.map(item => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
                className={`w-full flex items-center space-x-4 px-5 py-3.5 rounded-2xl transition-all duration-200 ${
                  activeTab === item.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-900/40' : 'text-slate-500 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-bold text-sm tracking-wide">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6 space-y-4 border-t border-slate-800/50">
          <div className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-800/30">
            <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center font-black text-white shadow-lg">{user.name.charAt(0)}</div>
            <div className="overflow-hidden">
              <p className="text-sm font-black truncate">{user.name}</p>
              <p className="text-[9px] text-indigo-400 font-black uppercase tracking-widest">{user.role}</p>
            </div>
          </div>
          <button onClick={onLogout} className="w-full flex items-center justify-center space-x-2 text-xs font-black uppercase tracking-widest py-4 bg-rose-500/10 text-rose-500 rounded-2xl border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all">Keluar Sesi</button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 md:p-10 bg-slate-50">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>

      {isSidebarOpen && <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsSidebarOpen(false)} />}
    </div>
  );
};

export default Layout;
