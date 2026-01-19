
import React, { useState, useMemo } from 'react';
import { AppState, Laptop, LaptopStatus, PaymentMethod, Transaction, TransactionItem } from '../types';
// @ts-ignore
import Barcode from 'react-barcode';

interface TransactionsProps {
  state: AppState;
  onAddTransaction: (tx: Transaction) => void;
  onUpdateStock: (laptopId: string, quantity: number) => void;
  onPrint: () => void;
  onPrintInvoice: (tx: Transaction) => void;
}

const Transactions: React.FC<TransactionsProps> = ({ state, onAddTransaction, onUpdateStock, onPrint, onPrintInvoice }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cart, setCart] = useState<TransactionItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [selectedLaptopId, setSelectedLaptopId] = useState('');
  const [activeInvoice, setActiveInvoice] = useState<Transaction | null>(null);

  const readyLaptops = useMemo(() => 
    state.inventory.filter(l => l.status === LaptopStatus.READY && l.stock > 0), 
  [state.inventory]);

  const subtotal = useMemo(() => cart.reduce((acc, item) => acc + (item.price * item.quantity), 0), [cart]);
  const tax = subtotal * 0.11; // 11% tax
  const total = subtotal + tax - discount;

  const addToCart = () => {
    const laptop = state.inventory.find(l => l.id === selectedLaptopId);
    if (!laptop) return;

    const existing = cart.find(i => i.laptopId === laptop.id);
    if (existing) {
      if (existing.quantity >= laptop.stock) {
        alert("Stok tidak mencukupi!");
        return;
      }
      setCart(cart.map(i => i.laptopId === laptop.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, { 
        laptopId: laptop.id, 
        brand: laptop.brand, 
        model: laptop.model, 
        quantity: 1, 
        price: laptop.sellPrice 
      }]);
    }
    setSelectedLaptopId('');
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(i => i.laptopId !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0 || !customerName) return;

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      invoiceNumber: `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 1000)}`,
      customerName,
      items: cart,
      subtotal,
      discount,
      tax,
      total,
      paymentMethod,
      date: new Date().toISOString(),
      createdBy: state.currentUser?.name || 'System'
    };

    onAddTransaction(newTx);
    cart.forEach(item => onUpdateStock(item.laptopId, -item.quantity));
    
    // Reset state
    setCart([]);
    setCustomerName('');
    setDiscount(0);
    setIsModalOpen(false);
    
    // Auto show invoice for printing
    setActiveInvoice(newTx);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Transaksi Penjualan</h2>
          <p className="text-slate-500 font-medium">Monitoring arus kas dan riwayat order pelanggan.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={onPrint}
            className="flex items-center space-x-2 px-5 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl shadow-sm hover:bg-slate-50 transition-all font-bold text-sm"
          >
            <span>📊</span>
            <span>Cetak Rekap Sales</span>
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all transform hover:-translate-y-0.5 active:scale-95"
          >
            <span className="text-xl">+</span>
            <span className="font-black uppercase tracking-widest text-xs">Buat Invoice</span>
          </button>
        </div>
      </header>

      {/* Transaction History */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">No. Invoice</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pelanggan</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Bayar</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Metode</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {state.transactions.map(tx => (
                <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 font-black text-indigo-600 text-sm tracking-tighter">{tx.invoiceNumber}</td>
                  <td className="px-6 py-4 text-slate-700 font-bold text-sm">{tx.customerName}</td>
                  <td className="px-6 py-4 font-black text-slate-900">Rp {tx.total.toLocaleString('id-ID')}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-slate-100 text-[9px] font-black text-slate-500 rounded uppercase tracking-widest">
                      {tx.paymentMethod}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => setActiveInvoice(tx)}
                      className="px-4 py-2 bg-slate-50 text-slate-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest shadow-sm"
                    >
                      Buka Invoice
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Modal Preview */}
      {activeInvoice && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-8 duration-500">
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <span className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center font-black">V</span>
                <h3 className="font-black uppercase tracking-widest text-xs">Preview Tagihan Resmi</h3>
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={() => { onPrintInvoice(activeInvoice); setActiveInvoice(null); }} 
                  className="bg-indigo-600 hover:bg-indigo-700 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg"
                >
                  Download PDF
                </button>
                <button onClick={() => setActiveInvoice(null)} className="p-2 hover:bg-white/10 rounded-full transition-all">✕</button>
              </div>
            </div>
            
            <div className="p-12 flex-1 overflow-y-auto bg-white text-slate-900">
              <div className="flex justify-between items-start mb-12">
                <div>
                  <h1 className="text-4xl font-black text-indigo-600 italic leading-none mb-1">VICTORY-ID</h1>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Authorized Tech Partner</p>
                </div>
                <div className="text-right">
                  <h2 className="text-2xl font-black uppercase text-slate-800 tracking-tighter">Tagihan Penjualan</h2>
                  <p className="text-xs font-black text-indigo-600 mt-1">{activeInvoice.invoiceNumber}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-12 mb-12">
                <div className="text-sm">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">Ditagihkan Ke:</p>
                  <p className="font-black text-slate-900 text-lg leading-none mb-1">{activeInvoice.customerName}</p>
                  <p className="text-[10px] text-slate-500 font-bold">Pelanggan Umum</p>
                </div>
                <div className="text-right text-sm">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">Informasi Pembayaran</p>
                  <p className="text-[11px] font-bold text-slate-900 mb-1">Metode: <span className="uppercase">{activeInvoice.paymentMethod}</span></p>
                  <p className="text-[11px] font-bold text-slate-900">Admin: {activeInvoice.createdBy}</p>
                </div>
              </div>

              <table className="w-full text-sm mb-12 border-b-2 border-slate-100">
                <thead>
                  <tr className="border-b-2 border-slate-900 text-left">
                    <th className="py-4 font-black text-slate-400 uppercase text-[9px] tracking-widest">Detail Item</th>
                    <th className="py-4 font-black text-slate-400 uppercase text-[9px] tracking-widest text-center">Qty</th>
                    <th className="py-4 font-black text-slate-400 uppercase text-[9px] tracking-widest text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeInvoice.items.map((item, idx) => {
                    const laptop = state.inventory.find(l => l.id === item.laptopId);
                    return (
                      <tr key={idx}>
                        <td className="py-5">
                          <p className="font-black text-slate-900 text-sm uppercase">{item.brand} {item.model}</p>
                          {laptop && (
                            <div className="mt-2 scale-[0.5] origin-left -mb-1">
                                <Barcode value={laptop.barcode} height={30} width={1.5} fontSize={10} />
                            </div>
                          )}
                          <p className="text-[10px] text-slate-400 font-bold mt-1">Garansi Tercover VICTORY-ID 12 Bln</p>
                        </td>
                        <td className="py-5 text-center font-black text-slate-900">{item.quantity}</td>
                        <td className="py-5 text-right font-black text-indigo-600 text-sm">Rp {(item.price * item.quantity).toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="flex justify-end">
                <div className="w-64">
                   <div className="flex flex-col items-end">
                      <p className="text-[12px] font-black text-slate-900 tracking-tighter">TOTAL <span className="text-indigo-600 text-3xl ml-1">Rp {activeInvoice.total.toLocaleString()}</span></p>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Kasir Pintar Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[90vh] animate-in zoom-in duration-300">
            <div className="flex-1 p-10 overflow-y-auto border-r border-slate-100 bg-white">
              <h3 className="text-2xl font-black mb-8 text-slate-900">Keranjang Belanja</h3>
              <div className="flex gap-3 mb-8">
                <select 
                  className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                  value={selectedLaptopId}
                  onChange={(e) => setSelectedLaptopId(e.target.value)}
                >
                  <option value="">Cari unit...</option>
                  {readyLaptops.map(l => (
                    <option key={l.id} value={l.id}>{l.brand} {l.model} (Stok: {l.stock})</option>
                  ))}
                </select>
                <button onClick={addToCart} className="px-8 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-indigo-100">Tambah</button>
              </div>
              <div className="space-y-4">
                {cart.length === 0 && <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-3xl text-slate-300 font-bold">Belum ada item terpilih</div>}
                {cart.map(item => (
                  <div key={item.laptopId} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 group">
                    <div>
                      <p className="font-black text-slate-900 text-sm leading-tight">{item.brand} {item.model}</p>
                      <p className="text-[10px] text-indigo-600 font-bold mt-1">Rp {item.price.toLocaleString()} x {item.quantity}</p>
                    </div>
                    <button onClick={() => removeFromCart(item.laptopId)} className="w-10 h-10 flex items-center justify-center text-rose-500 hover:bg-rose-100 rounded-full transition-all">✕</button>
                  </div>
                ))}
              </div>
            </div>
            <div className="w-full md:w-96 p-10 bg-slate-900 text-white flex flex-col justify-between">
              <div>
                <h3 className="text-2xl font-black mb-10 text-indigo-400">Kasir Pintar</h3>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3">Nama Pembeli</label>
                    <input required className="w-full px-5 py-4 rounded-2xl bg-slate-800 text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all border-none" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nama Customer" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3">Metode Bayar</label>
                    <select className="w-full px-5 py-4 rounded-2xl bg-slate-800 text-white font-bold outline-none border-none" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}>
                      <option value={PaymentMethod.CASH}>Cash (Tunai)</option>
                      <option value={PaymentMethod.TRANSFER}>Transfer Bank</option>
                      <option value={PaymentMethod.EWALLET}>QRIS / E-Wallet</option>
                    </select>
                  </div>
                  <div className="pt-10 border-t border-slate-800 space-y-4 mt-10">
                    <div className="flex justify-between text-xs font-bold text-slate-400 italic"><span>Subtotal Unit</span><span>Rp {subtotal.toLocaleString()}</span></div>
                    <div className="flex justify-between text-3xl font-black pt-4 text-white tracking-tighter"><span>TOTAL</span><span className="text-indigo-400">Rp {total.toLocaleString()}</span></div>
                  </div>
                </form>
              </div>
              <div className="flex gap-3 mt-10">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all">Batal</button>
                <button onClick={handleSubmit} disabled={cart.length === 0} className="flex-[2] py-4 bg-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-900/40 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50">Proses Order</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
