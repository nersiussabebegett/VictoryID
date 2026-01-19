
import React, { useState } from 'react';
import { User, UserRole } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

const MOCK_USERS: Record<string, User & { password: string }> = {
  'superadmin': { id: 'sa-1', name: 'System Admin', role: UserRole.SUPER_ADMIN, email: 'superadmin@victory.id', password: '123' },
  'owner': { id: 'ow-1', name: 'Budi Santoso', role: UserRole.OWNER, email: 'owner@victory.id', password: '123' },
  'admin': { id: 'ad-1', name: 'Siti Aminah', role: UserRole.ADMIN, email: 'admin@victory.id', password: '123' },
};

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      const user = MOCK_USERS[username.toLowerCase()];
      if (user && user.password === password) {
        onLogin({ id: user.id, name: user.name, role: user.role, email: user.email });
      } else {
        setError('Username atau password salah. Contoh: admin / 123');
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">💻</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">VICTORY-ID</h1>
          <p className="text-slate-500 font-medium">Inventory Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-sm rounded-xl animate-bounce">
              {error}
            </div>
          )}
          
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700 ml-1">Username</label>
            <input 
              type="text" 
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
              placeholder="Username (admin/owner/superadmin)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700 ml-1">Password</label>
            <input 
              type="password" 
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
              placeholder="Password (123)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-70 flex items-center justify-center"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : 'Masuk ke Sistem'}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100">
          <p className="text-center text-xs text-slate-400 font-medium mb-3 uppercase tracking-wider">Demo Quick Login</p>
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => { setUsername('superadmin'); setPassword('123'); }} className="text-[10px] bg-slate-50 hover:bg-slate-100 p-2 rounded-lg text-slate-600 font-bold">Super Admin</button>
            <button onClick={() => { setUsername('owner'); setPassword('123'); }} className="text-[10px] bg-slate-50 hover:bg-slate-100 p-2 rounded-lg text-slate-600 font-bold">Owner</button>
            <button onClick={() => { setUsername('admin'); setPassword('123'); }} className="text-[10px] bg-slate-50 hover:bg-slate-100 p-2 rounded-lg text-slate-600 font-bold">Admin</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
