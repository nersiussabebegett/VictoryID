
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Transactions from './components/Transactions';
import AiAssistant from './components/AiAssistant';
import Login from './components/Login';
import UserManagement from './components/UserManagement';
import { AppState, Laptop, Transaction, UserRole, User } from './types';
import { INITIAL_INVENTORY, INITIAL_TRANSACTIONS, INITIAL_USERS } from './constants';
// @ts-ignore
import Barcode from 'react-barcode';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [printType, setPrintType] = useState<'NONE' | 'INVENTORY' | 'SALES' | 'INVOICE'>('NONE');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('victoryid_v4_prod');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...parsed, isAuthenticated: !!parsed.currentUser };
    }
    return {
      inventory: INITIAL_INVENTORY,
      transactions: INITIAL_TRANSACTIONS,
      users: INITIAL_USERS,
      currentUser: null,
      isAuthenticated: false
    };
  });

  useEffect(() => {
    localStorage.setItem('victoryid_v4_prod', JSON.stringify(state));
  }, [state]);

  const onLogin = (user: User) => setState(prev => ({ ...prev, currentUser: user, isAuthenticated: true }));
  const onLogout = () => { 
    setState(prev => ({ ...prev, currentUser: null, isAuthenticated: false })); 
    setActiveTab('dashboard'); 
    localStorage.removeItem('victoryid_v4_prod');
  };

  const onAddLaptop = (laptop: Laptop) => setState(prev => ({ ...prev, inventory: [...prev.inventory, laptop] }));
  const onUpdateLaptop = (laptop: Laptop) => setState(prev => ({ ...prev, inventory: prev.inventory.map(l => l.id === laptop.id ? laptop : l) }));
  const onDeleteLaptop = (id: string) => setState(prev => ({ ...prev, inventory: prev.inventory.filter(l => l.id !== id) }));
  const onAddTransaction = (tx: Transaction) => setState(prev => ({ ...prev, transactions: [...prev.transactions, tx] }));
  const onUpdateStock = (laptopId: string, quantity: number) => {
    setState(prev => ({
      ...prev,
      inventory: prev.inventory.map(l => l.id === laptopId ? { ...l, stock: l.stock + quantity } : l)
    }));
  };

  const onUserAction = (user: User, action: 'ADD' | 'UPDATE' | 'DELETE') => {
    setState(prev => {
      let newUsers = [...prev.users];
      if (action === 'ADD') newUsers.push(user);
      else if (action === 'UPDATE') newUsers = newUsers.map(u => u.id === user.id ? user : u);
      else if (action === 'DELETE') newUsers = newUsers.filter(u => u.id !== user.id);
      return { ...prev, users: newUsers };
    });
  };

  const handlePrint = (type: 'INVENTORY' | 'SALES' | 'INVOICE', tx?: Transaction) => {
    setPrintType(type);
    if (tx) setSelectedTx(tx);
    window.scrollTo({ top: 0, behavior: 'instant' });
    setTimeout(() => {
        window.print();
        setTimeout(() => {
            setPrintType('NONE');
            setSelectedTx(null);
        }, 800);
    }, 1200);
  };

  if (!state.isAuthenticated || !state.currentUser) return <Login onLogin={onLogin} />;

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard state={state} />;
      case 'inventory': return <Inventory inventory={state.inventory} onAdd={onAddLaptop} onUpdate={onUpdateLaptop} onDelete={onDeleteLaptop} role={state.currentUser!.role} onPrint={() => handlePrint('INVENTORY')} />;
      case 'transactions': return <Transactions state={state} onAddTransaction={onAddTransaction} onUpdateStock={onUpdateStock} onPrint={() => handlePrint('SALES')} onPrintInvoice={(tx) => handlePrint('INVOICE', tx)} />;
      case 'users': return <UserManagement users={state.users} onAction={onUserAction} currentUserRole={state.currentUser!.role} />;
      case 'reports': return (
        <div className="space-y-10 no-print animate-in duration-700 px-2">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Export Laporan Digital</h2>
              <p className="text-slate-500 font-medium text-lg mt-1">Dokumen terenkripsi dengan Barcode validasi sistem.</p>
            </div>
            <div className="hidden md:flex items-center space-x-3 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-2xl border border-emerald-100 font-black text-[10px] uppercase tracking-widest">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                <span>Database Synced</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <ReportCard 
              title="Audit Stok Unit" 
              desc="Laporan lengkap ketersediaan unit, spesifikasi detail, dan barcode fisik untuk keperluan logistik & stock opname." 
              icon="🏢" 
              onPdf={() => handlePrint('INVENTORY')} 
            />
            <ReportCard 
              title="Rekapitulasi Omzet" 
              desc="Analisis data transaksi bulanan, rincian metode pembayaran, dan verifikasi admin yang bertanggung jawab." 
              icon="📈" 
              onPdf={() => handlePrint('SALES')} 
            />
          </div>
        </div>
      );
      case 'settings': return (
        <div className="space-y-8 no-print animate-in">
          <header>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Konfigurasi Sistem</h2>
            <p className="text-slate-500">Kelola database lokal dan sinkronisasi cloud Vercel.</p>
          </header>
          <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-6">
              <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center text-2xl">💾</div>
              <div>
                <h3 className="text-xl font-bold">Snapshot Database (JSON)</h3>
                <p className="text-slate-400 text-sm">Download semua data inventory & transaksi untuk backup manual.</p>
              </div>
            </div>
            <button 
              onClick={() => {
                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
                const dl = document.createElement('a'); 
                dl.setAttribute("href", dataStr); 
                dl.setAttribute("download", `victory_id_backup_${new Date().toISOString().split('T')[0]}.json`); 
                dl.click();
              }} 
              className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95"
            >
              Ekspor Semua Data
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-white p-6 rounded-3xl border border-slate-100 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status Deploy</p>
                <p className="text-emerald-600 font-black">VERCEL LIVE</p>
             </div>
             <div className="bg-white p-6 rounded-3xl border border-slate-100 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">AI Engine</p>
                <p className="text-indigo-600 font-black">GEMINI FLASH 2.5</p>
             </div>
             <div className="bg-white p-6 rounded-3xl border border-slate-100 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Versi Sistem</p>
                <p className="text-slate-900 font-black">v4.0 PRO</p>
             </div>
          </div>
        </div>
      );
      default: return <Dashboard state={state} />;
    }
  };

  return (
    <>
      <div className="no-print">
        <Layout user={state.currentUser} onLogout={onLogout} activeTab={activeTab} setActiveTab={setActiveTab}>
            {renderContent()}
        </Layout>
      </div>
      
      {/* HIDDEN PRINT ENGINE (PDF TEMPLATE) */}
      {printType !== 'NONE' && (
        <div className="print-only p-14 bg-white text-slate-900 min-h-screen">
          {/* HEADER: KOP SURAT PROFESIONAL */}
          <div className="flex justify-between items-center mb-16 border-b-[12px] border-indigo-600 pb-12">
              <div className="space-y-4">
                  <h1 className="text-8xl font-black italic tracking-tighter text-indigo-600 leading-none">VICTORY-ID</h1>
                  <p className="text-[12px] font-black uppercase tracking-[0.6em] text-slate-400">AUTHORIZED TECH & INVENTORY PARTNER</p>
                  <div className="mt-10 text-[13px] text-slate-600 font-bold space-y-1.5">
                    <p>🚩 SCBD Finance Tower, Lt. 12, Jakarta Selatan</p>
                    <p>🌐 www.victory.id | 📧 finance@victory.id | 📞 021-9988-7766</p>
                  </div>
              </div>
              <div className="text-right border-l-[6px] border-slate-50 pl-20">
                  <h2 className="text-3xl font-black uppercase text-white bg-slate-900 px-10 py-4 inline-block mb-6 tracking-tighter">
                      {printType === 'INVENTORY' ? 'REPORT: ASSET AUDIT' : 
                       printType === 'SALES' ? 'REPORT: SALES ANALYSIS' : 
                       'DOCUMENT: TAX INVOICE'}
                  </h2>
                  <div className="space-y-2.5 text-[12px] font-black text-slate-400">
                    <p>SERIAL NO: <span className="text-indigo-600 uppercase tracking-widest">VID-{printType.charAt(0)}-{Date.now()}</span></p>
                    <p>OFFICER: <span className="text-slate-900 uppercase">{state.currentUser.name}</span></p>
                    <p>DATE: <span className="text-slate-900">{new Date().toLocaleString('id-ID')}</span></p>
                  </div>
              </div>
          </div>

          <div className="min-h-[700px]">
            {/* RENDER LOGIC: PDF CONTENT */}
            {printType === 'INVENTORY' && (
              <div className="animate-in">
                <h3 className="text-2xl font-black text-slate-900 mb-10 border-l-[10px] border-indigo-600 pl-6 uppercase tracking-tighter">Current Inventory & Logistics Status</h3>
                <table className="w-full border-collapse">
                    <thead className="bg-slate-900 text-white text-[11px] font-black uppercase tracking-[0.3em]">
                        <tr>
                            <th className="p-5 border-r border-slate-700">NO</th>
                            <th className="p-5 border-r border-slate-700">UNIT MODEL & BARCODE GARANSI</th>
                            <th className="p-5 border-r border-slate-700">SPECS</th>
                            <th className="p-5 border-r border-slate-700 text-right">SELL PRICE</th>
                            <th className="p-5 text-center">STOK</th>
                        </tr>
                    </thead>
                    <tbody className="text-[13px]">
                        {state.inventory.map((item, idx) => (
                            <tr key={item.id} className="border-b border-slate-200">
                                <td className="p-5 text-center font-black text-indigo-600">{idx + 1}</td>
                                <td className="p-5">
                                  <p className="font-black text-slate-900 text-lg uppercase mb-2 tracking-tighter">{item.brand} {item.model}</p>
                                  <div className="scale-[0.6] origin-left -ml-2 mb-2">
                                    <Barcode value={item.barcode} height={40} width={1.5} fontSize={12} />
                                  </div>
                                </td>
                                <td className="p-5 text-slate-500 font-bold italic leading-relaxed">
                                  {item.specs.cpu}, {item.specs.ram}, {item.specs.storage}
                                </td>
                                <td className="p-5 text-right font-black text-xl">Rp {item.sellPrice.toLocaleString()}</td>
                                <td className="p-5 text-center font-black bg-slate-50 text-xl">{item.stock} Unit</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
              </div>
            )}

            {printType === 'INVOICE' && selectedTx && (
              <div className="space-y-20 animate-in">
                <div className="grid grid-cols-2 gap-24">
                  <div className="bg-slate-900 text-white p-14 rounded-[4rem] shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full -mr-16 -mt-16"></div>
                    <p className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-6">Customer Information:</p>
                    <p className="text-6xl font-black uppercase tracking-tighter leading-[0.9]">{selectedTx.customerName}</p>
                    <p className="text-xs font-bold text-slate-400 mt-6 tracking-widest">VERIFIED PURCHASE • {selectedTx.paymentMethod}</p>
                  </div>
                  <div className="text-right flex flex-col justify-center">
                    <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest mb-2">Invoice Code:</p>
                    <p className="text-4xl font-black text-indigo-600 tracking-tighter mb-8">{selectedTx.invoiceNumber}</p>
                    <div className="inline-block px-8 py-3 bg-emerald-100 text-emerald-700 rounded-full font-black text-sm self-end">
                      STATUS: LUNAS / PAID
                    </div>
                  </div>
                </div>

                <table className="w-full border-b-[6px] border-slate-900">
                    <thead className="border-b-4 border-slate-900 text-[12px] font-black uppercase tracking-[0.4em] text-slate-400">
                        <tr>
                            <th className="p-6 text-left">PRODUCT DESCRIPTION</th>
                            <th className="p-6 text-center">QTY</th>
                            <th className="p-6 text-right">UNIT PRICE</th>
                            <th className="p-6 text-right">SUBTOTAL</th>
                        </tr>
                    </thead>
                    <tbody className="text-[16px]">
                        {selectedTx.items.map((item, idx) => {
                            const laptop = state.inventory.find(l => l.id === item.laptopId);
                            return (
                                <tr key={idx} className="border-b border-slate-100">
                                    <td className="p-8">
                                        <p className="font-black text-slate-900 text-3xl uppercase tracking-tighter mb-4">{item.brand} {item.model}</p>
                                        <div className="scale-[0.75] origin-left mb-6">
                                            <Barcode value={laptop?.barcode || 'N/A'} height={45} width={1.8} fontSize={14} />
                                        </div>
                                        <div className="flex items-center space-x-3 text-[12px] font-black text-indigo-500 uppercase tracking-widest">
                                            <span className="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center">✓</span>
                                            <span>Full Warranty Coverage Authorized by VICTORY-ID</span>
                                        </div>
                                    </td>
                                    <td className="p-8 text-center font-black text-4xl">{item.quantity}</td>
                                    <td className="p-8 text-right font-bold">Rp {item.price.toLocaleString()}</td>
                                    <td className="p-8 text-right font-black text-indigo-600 text-4xl">Rp {(item.price * item.quantity).toLocaleString()}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                <div className="flex justify-end mt-16">
                    <div className="w-[500px] bg-slate-900 text-white p-16 rounded-[5rem] shadow-2xl space-y-10">
                        <div className="flex justify-between items-center text-slate-500 font-bold uppercase tracking-widest border-b border-slate-800 pb-8">
                            <span>Item Subtotal</span>
                            <span>Rp {selectedTx.subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <div className="space-y-1">
                                <p className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.6em]">Invoice</p>
                                <p className="text-3xl font-black">TOTAL</p>
                            </div>
                            <p className="text-6xl font-black tracking-tighter">Rp {selectedTx.total.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
              </div>
            )}

            {printType === 'SALES' && (
              <div className="animate-in">
                <h3 className="text-2xl font-black text-slate-900 mb-10 border-l-[10px] border-indigo-600 pl-6 uppercase tracking-tighter">Summary of Sales Performance</h3>
                <table className="w-full border-collapse border border-slate-200 shadow-sm">
                    <thead className="bg-slate-100 text-[10px] font-black uppercase tracking-[0.3em] border-b-2 border-slate-900">
                        <tr>
                            <th className="p-5 border text-center">NO</th>
                            <th className="p-5 border text-left">INVOICE NO</th>
                            <th className="p-5 border text-left">CUSTOMER</th>
                            <th className="p-5 border text-center">DATE</th>
                            <th className="p-5 border text-right">TOTAL (RP)</th>
                            <th className="p-5 border text-center">METHOD</th>
                        </tr>
                    </thead>
                    <tbody className="text-[13px]">
                        {state.transactions.map((tx, idx) => (
                            <tr key={tx.id} className="border-b border-slate-100 font-medium">
                                <td className="p-5 border text-center text-slate-400">{idx + 1}</td>
                                <td className="p-5 border font-black text-indigo-600">{tx.invoiceNumber}</td>
                                <td className="p-5 border font-bold uppercase">{tx.customerName}</td>
                                <td className="p-5 border text-center">{new Date(tx.date).toLocaleDateString('id-ID')}</td>
                                <td className="p-5 border text-right font-black">Rp {tx.total.toLocaleString()}</td>
                                <td className="p-5 border text-center font-black uppercase text-[10px] tracking-widest">{tx.paymentMethod}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-slate-900 text-white font-black">
                        <tr>
                            <td colSpan={4} className="p-8 text-right uppercase tracking-[0.4em] text-xs">Accumulated Net Revenue</td>
                            <td colSpan={2} className="p-8 text-left text-4xl text-indigo-400 font-black tracking-tighter underline underline-offset-8 decoration-indigo-600 decoration-[6px]">
                                Rp {state.transactions.reduce((acc, curr) => acc + curr.total, 0).toLocaleString()}
                            </td>
                        </tr>
                    </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* FOOTER: SECURITY CHECK & SIGNATURE */}
          <div className="mt-32 flex justify-between items-end border-t-[3px] border-slate-100 pt-20">
              <div className="max-w-lg space-y-8">
                <div className="space-y-4">
                  <p className="font-black text-slate-900 uppercase tracking-[0.3em] text-[15px]">Audit Compliance:</p>
                  <p className="text-[12px] text-slate-500 font-medium leading-relaxed italic">
                    Dokumen ini adalah salinan resmi yang dikeluarkan oleh sistem VICTORY-ID. Seluruh transaksi telah divalidasi dan tercatat dalam database cloud. Barcode unit berfungsi sebagai aktivasi garansi hardware resmi selama 12 bulan sejak tanggal penerbitan.
                  </p>
                </div>
                <div className="bg-slate-900 text-indigo-400 p-8 rounded-[3rem] border-l-[15px] border-indigo-600 font-mono text-[10px] uppercase tracking-widest flex items-center justify-between">
                   <div>
                     <p className="text-white opacity-50 mb-1">Validation ID:</p>
                     <p className="font-black">VID-HASH-{state.currentUser.id}-{Date.now()}-PRO</p>
                   </div>
                   <div className="text-right text-white">
                      [ AUTHENTIC DOCUMENT ]
                   </div>
                </div>
              </div>
              
              <div className="text-center w-[350px]">
                  <p className="text-[15px] font-black text-slate-900 mb-32 uppercase tracking-[0.6em]">Authorized By,</p>
                  <div className="border-t-[10px] border-indigo-600 pt-10">
                    <p className="font-black text-slate-900 text-5xl uppercase tracking-tighter mb-2">{state.currentUser.name}</p>
                    <p className="text-[13px] text-indigo-600 font-black uppercase tracking-[0.5em]">{state.currentUser.role} OF VICTORY-ID</p>
                  </div>
              </div>
          </div>
          
          <div className="mt-28 text-center text-[11px] text-slate-200 font-black uppercase tracking-[2em] border-t border-slate-50 pt-10">
            © 2025 VICTORY-ID ENTERPRISE • CLOUD OPTIMIZED PDF ENGINE
          </div>
        </div>
      )}

      <AiAssistant inventory={state.inventory} transactions={state.transactions} userRole={state.currentUser.role} />
    </>
  );
};

const ReportCard: React.FC<{title: string, desc: string, icon: string, onPdf: () => void}> = ({ title, desc, icon, onPdf }) => (
  <div className="bg-white p-16 rounded-[4rem] border border-slate-100 shadow-sm flex flex-col justify-between space-y-14 hover:shadow-2xl transition-all group overflow-hidden relative">
    <div className="absolute -top-16 -right-16 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none transform group-hover:rotate-12 duration-700">
        <span className="text-[300px] leading-none">{icon}</span>
    </div>
    <div className="flex items-start space-x-12 relative z-10">
        <div className="w-28 h-28 bg-indigo-50 rounded-[3rem] flex items-center justify-center text-6xl group-hover:bg-indigo-600 group-hover:text-white transition-all duration-700 shadow-inner group-hover:scale-110 group-hover:-rotate-6">{icon}</div>
        <div className="flex-1">
          <h3 className="font-black text-4xl text-slate-900 tracking-tighter mb-5 leading-none">{title}</h3>
          <p className="text-xl text-slate-400 leading-relaxed font-medium pr-10">{desc}</p>
        </div>
    </div>
    <div className="relative z-10 pt-4">
        <button onClick={onPdf} className="w-full py-8 bg-slate-900 text-white rounded-[2.5rem] text-[15px] font-black uppercase tracking-[0.5em] hover:bg-indigo-600 transition-all shadow-2xl active:scale-95 flex items-center justify-center space-x-6">
          <span className="text-3xl">🖨️</span>
          <span>Generate Laporan</span>
        </button>
    </div>
  </div>
);

export default App;
