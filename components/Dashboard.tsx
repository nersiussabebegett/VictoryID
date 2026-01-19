
import React, { useMemo } from 'react';
import { AppState, UserRole } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface DashboardProps {
  state: AppState;
}

const Dashboard: React.FC<DashboardProps> = ({ state }) => {
  const { inventory, transactions, currentUser } = state;

  const stats = useMemo(() => {
    const totalStok = inventory.reduce((acc, curr) => acc + curr.stock, 0);
    const totalPenjualan = transactions.reduce((acc, curr) => acc + curr.total, 0);
    const totalTransaksi = transactions.length;
    
    const totalCost = transactions.reduce((acc, tx) => {
      const itemCosts = tx.items.reduce((itemAcc, item) => {
        const laptop = inventory.find(l => l.id === item.laptopId);
        return itemAcc + (laptop ? laptop.buyPrice * item.quantity : 0);
      }, 0);
      return acc + itemCosts;
    }, 0);
    const profit = totalPenjualan - totalCost;

    return { totalStok, totalPenjualan, totalTransaksi, profit };
  }, [inventory, transactions]);

  const salesData = useMemo(() => {
    return transactions.slice(-10).map(t => ({
      name: t.invoiceNumber.split('-').pop(),
      total: t.total / 1000000
    }));
  }, [transactions]);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const brandData = useMemo(() => {
    const brands: Record<string, number> = {};
    inventory.forEach(l => {
      brands[l.brand] = (brands[l.brand] || 0) + l.stock;
    });
    return Object.entries(brands).map(([name, value]) => ({ name, value }));
  }, [inventory]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Analytics Dashboard</h2>
          <p className="text-slate-500">Pantau performa bisnis VICTORY-ID Anda secara real-time.</p>
        </div>
        <div className="flex gap-2">
           <button 
            onClick={() => window.print()} 
            className="px-4 py-2 bg-slate-900 text-white rounded-lg shadow-sm hover:bg-slate-800 transition-all flex items-center space-x-2"
          >
            <span>🖨️</span>
            <span>Cetak Dashboard</span>
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Stok" value={stats.totalStok.toString()} icon="📦" color="indigo" />
        <StatCard title="Total Penjualan" value={`Rp ${stats.totalPenjualan.toLocaleString('id-ID')}`} icon="💰" color="emerald" />
        <StatCard title="Total Transaksi" value={stats.totalTransaksi.toString()} icon="📄" color="amber" />
        {(currentUser.role === UserRole.OWNER || currentUser.role === UserRole.SUPER_ADMIN) && (
          <StatCard title="Estimasi Laba" value={`Rp ${stats.profit.toLocaleString('id-ID')}`} icon="📈" color="violet" />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bar Sales Chart */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800">Performa Penjualan (Juta Rp)</h3>
            <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full font-bold">10 Transaksi Terakhir</span>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [`Rp ${Number(value).toFixed(2)}jt`, 'Nominal']}
                />
                <Bar dataKey="total" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={35} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribution Chart */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold mb-6 text-slate-800">Komposisi Stok per Brand</h3>
          <div className="h-80 flex flex-col md:flex-row items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={brandData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {brandData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: string; icon: string; color: string }> = ({ title, value, icon, color }) => {
  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    violet: 'bg-violet-50 text-violet-600',
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center space-x-4 hover:shadow-md transition-all">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${colorMap[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</p>
        <p className="text-xl font-extrabold text-slate-900">{value}</p>
      </div>
    </div>
  );
};

export default Dashboard;
