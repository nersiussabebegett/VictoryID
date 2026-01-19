
import { GoogleGenAI } from "@google/genai";
import { Laptop, Transaction, UserRole } from "../types";

export async function* askBusinessAssistantStream(
  prompt: string,
  inventory: Laptop[],
  transactions: Transaction[],
  userRole: UserRole
) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
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
    - Jika user bertanya tentang "data baru", rujuklah pada Transaksi Terakhir atau perubahan stok terbaru.
    - JANGAN BERPROSES/MENJAWAB di luar data yang disediakan. Jika tidak tahu, katakan: "Maaf, data tersebut tidak tersedia di sistem saat ini."
  `;

  try {
    const result = await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: context,
        temperature: 0.2, // Lebih rendah agar lebih faktual dan tidak berhalusinasi
      },
    });

    for await (const chunk of result) {
      const text = chunk.text;
      if (text) {
        yield text;
      }
    }
  } catch (error) {
    console.error("AI Error:", error);
    yield "Koneksi ke sistem AI terputus. Silakan coba lagi.";
  }
}
