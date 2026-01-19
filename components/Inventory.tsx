
import React, { useState } from 'react';
import { Laptop, LaptopCondition, LaptopStatus, UserRole } from '../types';
import { BRANDS } from '../constants';
// @ts-ignore
import Barcode from 'react-barcode';

interface InventoryProps {
  inventory: Laptop[];
  onAdd: (laptop: Laptop) => void;
  onUpdate: (laptop: Laptop) => void;
  onDelete: (id: string) => void;
  role: UserRole;
  onPrint: () => void;
}

const Inventory: React.FC<InventoryProps> = ({ inventory, onAdd, onUpdate, onDelete, role, onPrint }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLaptop, setEditingLaptop] = useState<Laptop | null>(null);

  const filteredInventory = inventory.filter(l => {
    const matchesSearch = l.model.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         l.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         l.barcode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBrand = brandFilter === 'All' || l.brand === brandFilter;
    return matchesSearch && matchesBrand;
  });

  const generateBarcode = () => {
    // Menghasilkan kode unik berbasis Victory ID: VIC + 9 digit angka acak
    return `VIC${Math.floor(100000000 + Math.random() * 900000000)}`;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const newLaptop: Laptop = {
      id: editingLaptop?.id || Math.random().toString(36).substr(2, 9),
      barcode: editingLaptop?.barcode || generateBarcode(),
      brand: formData.get('brand') as string,
      model: formData.get('model') as string,
      specs: {
        cpu: formData.get('cpu') as string,
        ram: formData.get('ram') as string,
        storage: formData.get('storage') as string,
        gpu: formData.get('gpu') as string,
      },
      condition: formData.get('condition') as LaptopCondition,
      buyPrice: Number(formData.get('buyPrice')),
      sellPrice: Number(formData.get('sellPrice')),
      stock: Number(formData.get('stock')),
      status: Number(formData.get('stock')) > 0 ? LaptopStatus.READY : LaptopStatus.SOLD,
      createdAt: editingLaptop?.createdAt || new Date().toISOString(),
    };

    if (editingLaptop) {
      onUpdate(newLaptop);
    } else {
      onAdd(newLaptop);
    }
    setIsModalOpen(false);
    setEditingLaptop(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Inventory Laptop</h2>
          <p className="text-slate-500 font-medium">Kelola stok barang, barcode, dan spesifikasi unit.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={onPrint}
            className="flex items-center space-x-2 px-5 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl shadow-sm hover:bg-slate-50 transition-all font-bold text-sm"
          >
            <span>🖨️</span>
            <span>Cetak PDF</span>
          </button>
          <button 
            onClick={() => { setEditingLaptop(null); setIsModalOpen(true); }}
            className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all transform hover:-translate-y-0.5"
          >
            <span className="text-xl">+</span>
            <span className="font-bold uppercase tracking-wide text-xs">Tambah Unit</span>
          </button>
        </div>
      </header>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex-1 relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input 
            type="text" 
            placeholder="Cari brand, model, atau barcode..." 
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all placeholder:text-slate-400 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 outline-none text-sm font-semibold"
          value={brandFilter}
          onChange={(e) => setBrandFilter(e.target.value)}
        >
          <option value="All">Semua Brand</option>
          {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Laptop & Barcode</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Specs</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Harga Jual</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Stok</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredInventory.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-lg">
                          {item.brand.charAt(0)}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 text-sm leading-tight">{item.brand} {item.model}</p>
                          <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider mt-1">{item.condition === 'NEW' ? 'BARU' : 'BEKAS'}</p>
                        </div>
                      </div>
                      <div className="scale-75 origin-left -ml-4">
                        <Barcode value={item.barcode} height={30} width={1} fontSize={10} background="#f8fafc" />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-[10px] space-y-0.5 font-medium">
                      <p><span className="text-slate-400">CPU:</span> {item.specs.cpu}</p>
                      <p><span className="text-slate-400">RAM:</span> {item.specs.ram}</p>
                      <p><span className="text-slate-400">STR:</span> {item.specs.storage}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-black text-slate-900">
                    Rp {item.sellPrice.toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase ${item.stock <= 2 ? 'bg-rose-50 text-rose-600 animate-pulse' : 'bg-slate-100 text-slate-600'}`}>
                      {item.stock} Unit
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center space-x-2">
                      <button 
                        onClick={() => { setEditingLaptop(item); setIsModalOpen(true); }}
                        className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                      >
                        ✏️
                      </button>
                      {role === UserRole.OWNER && (
                        <button 
                          onClick={() => onDelete(item.id)}
                          className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-2xl font-black text-slate-900">{editingLaptop ? 'Update Data Laptop' : 'Pendaftaran Laptop Baru'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 rounded-full transition-all text-slate-400">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-10 space-y-8 max-h-[70vh] overflow-y-auto">
              {editingLaptop && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Barcode Terdaftar</p>
                  <Barcode value={editingLaptop.barcode} height={50} />
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Brand Laptop</label>
                  <select name="brand" className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-900 font-bold outline-none focus:ring-2 focus:ring-indigo-500" defaultValue={editingLaptop?.brand || 'ASUS'}>
                    {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Nama Model</label>
                  <input name="model" required className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-900 font-bold outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Contoh: Zenbook Pro 14" defaultValue={editingLaptop?.model} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Processor (CPU)</label>
                  <input name="cpu" required className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Contoh: Intel i7-12700H" defaultValue={editingLaptop?.specs.cpu} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Kapasitas RAM</label>
                  <input name="ram" required className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Contoh: 16GB LPDDR5" defaultValue={editingLaptop?.specs.ram} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Penyimpanan</label>
                  <input name="storage" required className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Contoh: 1TB NVMe SSD" defaultValue={editingLaptop?.specs.storage} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Kartu Grafis (GPU)</label>
                  <input name="gpu" required className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Contoh: RTX 3050 Ti" defaultValue={editingLaptop?.specs.gpu} />
                </div>
                <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
                  <div className="sm:col-span-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Kondisi</label>
                    <select name="condition" className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-900 font-bold outline-none" defaultValue={editingLaptop?.condition || LaptopCondition.NEW}>
                      <option value={LaptopCondition.NEW}>Baru</option>
                      <option value={LaptopCondition.USED}>Bekas</option>
                    </select>
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Sisa Stok</label>
                    <input name="stock" type="number" required className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-900 font-bold outline-none" defaultValue={editingLaptop?.stock || 1} />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Harga Beli</label>
                    <input name="buyPrice" type="number" required className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-emerald-600 font-black outline-none" defaultValue={editingLaptop?.buyPrice} />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Harga Jual</label>
                    <input name="sellPrice" type="number" required className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-indigo-600 font-black outline-none" defaultValue={editingLaptop?.sellPrice} />
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-6 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition-all">Batalkan</button>
                <button type="submit" className="px-10 py-3 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">Simpan Database</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
