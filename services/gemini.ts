
import { GoogleGenAI } from "@google/genai";
import { Laptop, Transaction, UserRole } from "../types";

export async function* askBusinessAssistantStream(
  prompt: string,
  inventory: Laptop[],
  transactions: Transaction[],
  userRole: UserRole
) {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    yield "Sistem AI belum siap: API_KEY tidak ditemukan dalam konfigurasi server. Mohon hubungi teknisi untuk memeriksa Environment Variables.";
    return;
  }

  const ai = new GoogleGenAI({ apiKey });
  
  // Filter data berdasarkan role untuk keamanan tingkat tinggi
  const filteredInventory = inventory.map(l => ({
    brand: l.brand,
    model: l.model,
    specs: `${l.specs.cpu}, ${l.specs.ram}, ${l.specs.storage}`,
    stock: l.stock,
    condition: l.condition,
    sellPrice: l.sellPrice,
    // Harga beli HANYA untuk Owner/SuperAdmin
    ...(userRole === UserRole.OWNER || userRole === UserRole.SUPER_ADMIN ? { buyPrice: l.buyPrice } : {})
  }));

  const lowStockItems = inventory.filter(l => l.stock <= 2).map(l => `${l.brand} ${l.model} (${l.stock} sisa)`);
  const recentTransactions = transactions.slice(-5).reverse();

  const context = `
    IDENTITAS: Anda adalah "VICTORY-ID AI", asisten analis bisnis profesional.
    ROLE USER SAAT INI: ${userRole}.
    WAKTU SEKARANG: ${new Date().toLocaleString('id-ID')}.

    DATA REAL-TIME (Snapshot Database):
    - Inventory: ${JSON.stringify(filteredInventory)}
    - Transaksi Terakhir: ${JSON.stringify(recentTransactions.map(t => ({ id: t.invoiceNumber, buyer: t.customerName, total: t.total, date: t.date })))}
    - Alert Stok Kritis: ${lowStockItems.length > 0 ? lowStockItems.join(', ') : 'Semua stok aman.'}

    PROSEDUR JAWABAN BERDASARKAN ROLE:
    1. OWNER / SUPER_ADMIN:
       - Berikan analisis Laba/Rugi yang mendalam.
       - Berikan insight mengenai ROI (Return on Investment).
       - Boleh menyebutkan modal/harga beli.
       - Contoh: "Profit bersih bulan ini meningkat 15%."

    2. ADMIN:
       - JANGAN PERNAH menyebutkan Harga Beli (buyPrice) atau Laba Bersih.
       - Fokus pada: Stok yang harus diisi ulang, melayani pelanggan, dan omzet penjualan.
       - Contoh: "Laptop ASUS Zephyrus paling laku, sisa 1 unit lagi. Segera kabari Owner untuk restock."

    INSTRUKSI TEKNIS:
    - Gunakan Bahasa Indonesia yang sopan namun lugas.
    - Jika user meminta data (misal: "tampilkan laptop ASUS"), WAJIB gunakan format Tabel Markdown.
    - JANGAN BERPROSES/MENJAWAB di luar data yang disediakan. Jika tidak tahu, katakan: "Maaf, data tersebut tidak tersedia di sistem saat ini."
  `;

  try {
    const result = await ai.models.generateContentStream({
      model: 'gemini-3-pro-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction: context,
        temperature: 0.2,
      },
    });

    for await (const chunk of result) {
      const text = chunk.text;
      if (text) {
        yield text;
      }
    }
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    if (error?.message?.includes('API_KEY_INVALID') || error?.message?.includes('403')) {
      yield "Kesalahan Otorisasi: API Key tidak valid atau tidak diizinkan. Periksa konfigurasi API di Vercel Dashboard.";
    } else if (error?.message?.includes('quota')) {
      yield "Batas Kuota Tercapai: Sistem sedang sibuk, mohon coba lagi dalam beberapa saat.";
    } else {
      yield "Koneksi ke sistem AI terputus. Pastikan koneksi internet stabil atau hubungi admin untuk memeriksa status layanan.";
    }
  }
}
