
import React, { useState } from 'react';
import { User, UserRole } from '../types';

interface UserManagementProps {
  users: User[];
  onAction: (user: User, action: 'ADD' | 'UPDATE' | 'DELETE') => void;
  currentUserRole: UserRole;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, onAction, currentUserRole }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  if (currentUserRole !== UserRole.SUPER_ADMIN && currentUserRole !== UserRole.OWNER) {
    return <div className="p-20 text-center"><h2 className="text-2xl font-bold text-slate-400 italic">Akses Dibatasi - Khusus Owner & Super Admin</h2></div>;
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const user: User = {
      id: editingUser?.id || `user-${Date.now()}`,
      name: fd.get('name') as string,
      email: fd.get('email') as string,
      role: fd.get('role') as UserRole,
      password: (fd.get('password') as string) || '123'
    };
    onAction(user, editingUser ? 'UPDATE' : 'ADD');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div><h2 className="text-3xl font-black text-slate-900">Manajemen Pengguna</h2><p className="text-slate-500">Kelola hak akses admin dan staff toko.</p></div>
        {currentUserRole === UserRole.SUPER_ADMIN && (
          <button onClick={() => { setEditingUser(null); setIsModalOpen(true); }} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100">+ User Baru</button>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {users.map(u => (
          <div key={u.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-xl">👤</div>
              <div><h4 className="font-bold text-slate-900">{u.name}</h4><p className="text-xs text-indigo-600 font-bold uppercase tracking-widest">{u.role}</p></div>
            </div>
            <div className="space-y-2 mb-6">
              <p className="text-xs text-slate-400">Email: <span className="text-slate-800 font-medium">{u.email}</span></p>
              <p className="text-xs text-slate-400">Sandi: <span className="text-slate-800 font-medium">********</span></p>
            </div>
            {currentUserRole === UserRole.SUPER_ADMIN && (
              <div className="flex gap-2">
                <button onClick={() => { setEditingUser(u); setIsModalOpen(true); }} className="flex-1 py-2 text-xs font-bold bg-slate-50 text-slate-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all">Edit</button>
                <button onClick={() => onAction(u, 'DELETE')} className="p-2 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all text-xs">🗑️</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 space-y-6">
            <h3 className="text-2xl font-black mb-4">{editingUser ? 'Update User' : 'User Baru'}</h3>
            <div className="space-y-4">
              <div><label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Nama Lengkap</label><input name="name" required defaultValue={editingUser?.name} className="w-full px-4 py-3 rounded-xl border border-slate-200" /></div>
              <div><label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Email</label><input name="email" type="email" required defaultValue={editingUser?.email} className="w-full px-4 py-3 rounded-xl border border-slate-200" /></div>
              <div><label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Password</label><input name="password" type="password" placeholder="Biarkan kosong untuk tetap '123'" className="w-full px-4 py-3 rounded-xl border border-slate-200" /></div>
              <div><label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Role Hak Akses</label>
                <select name="role" defaultValue={editingUser?.role || UserRole.ADMIN} className="w-full px-4 py-3 rounded-xl border border-slate-200">
                  <option value={UserRole.ADMIN}>ADMIN (Operational)</option>
                  <option value={UserRole.OWNER}>OWNER (Strategic)</option>
                  <option value={UserRole.SUPER_ADMIN}>SUPER ADMIN (Full Control)</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-50 rounded-xl">Batal</button>
              <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-100">Simpan Akun</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
