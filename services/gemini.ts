
import { GoogleGenAI } from "@google/genai";
import { Laptop, Transaction, UserRole } from "../types";

export async function* askBusinessAssistantStream(
  prompt: string,
  inventory: Laptop[],
  transactions: Transaction[],
  userRole: UserRole
) {
  // Selalu ambil API_KEY terbaru dari environment saat fungsi dipanggil
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    yield "❌ **API Key Belum Terdeteksi**\n\nSistem tidak dapat menemukan kunci akses. Mohon klik tombol **'Hubungkan AI'** di pojok kanan bawah untuk mengaktifkan layanan.";
    return;
  }

  // Buat instance baru tepat sebelum pemanggilan untuk memastikan penggunaan key terbaru
  const ai = new GoogleGenAI({ apiKey });
  
  const filteredInventory = inventory.map(l => ({
    brand: l.brand,
    model: l.model,
    specs: `${l.specs.cpu}, ${l.specs.ram}, ${l.specs.storage}`,
    stock: l.stock,
    condition: l.condition,
    sellPrice: l.sellPrice,
    ...(userRole === UserRole.OWNER || userRole === UserRole.SUPER_ADMIN ? { buyPrice: l.buyPrice } : {})
  }));

  const context = `
    IDENTITAS: "VICTORY-ID AI", analis bisnis profesional.
    ROLE USER: ${userRole}.
    WAKTU: ${new Date().toLocaleString('id-ID')}.
    DATA: Inventory(${inventory.length} unit), Transaksi(${transactions.length}).
    
    INSTRUKSI:
    - Gunakan Bahasa Indonesia yang sangat sopan dan profesional.
    - OWNER/SUPER_ADMIN: Berikan data profit dan harga beli jika ditanyakan.
    - ADMIN: JANGAN PERNAH menampilkan harga beli atau laba bersih. Fokus pada stok.
    - Gunakan Tabel Markdown untuk list data agar rapi.
  `;

  try {
    const result = await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction: context,
        temperature: 0.2,
      },
    });

    let hasOutput = false;
    for await (const chunk of result) {
      const text = chunk.text;
      if (text) {
        hasOutput = true;
        yield text;
      }
    }

    if (!hasOutput) {
      yield "Maaf, sistem tidak memberikan respon. Mohon coba tanyakan dengan kalimat lain.";
    }

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    // Penanganan error spesifik untuk Vercel/Environment
    if (error?.message?.includes('entity was not found') || error?.message?.includes('404')) {
      yield "⚠️ **Kesalahan Konfigurasi**: Proyek API tidak ditemukan. Pastikan Anda telah memilih API Key dari project GCP yang memiliki billing aktif.";
    } else if (error?.message?.includes('API_KEY_INVALID') || error?.message?.includes('403')) {
      yield "❌ **Kunci API Tidak Valid**: Kunci yang terpasang di Vercel salah atau sudah kadaluarsa.";
    } else {
      yield `⚠️ **Gagal Terhubung**: ${error?.message || "Terjadi gangguan jaringan. Mohon coba lagi."}`;
    }
  }
}
