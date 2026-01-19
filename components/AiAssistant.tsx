
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { askBusinessAssistantStream } from '../services/gemini';
import { Laptop, Transaction, UserRole } from '../types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AiAssistantProps {
  inventory: Laptop[];
  transactions: Transaction[];
  userRole: UserRole;
}

const AiAssistant: React.FC<AiAssistantProps> = ({ inventory, transactions, userRole }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [needsKey, setNeedsKey] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const assistantInfo = useMemo(() => ({
    emoji: userRole === UserRole.ADMIN ? '👩‍💼' : '👨‍💼',
    name: userRole === UserRole.ADMIN ? 'Siska' : 'Budi',
    color: userRole === UserRole.ADMIN ? 'bg-rose-100' : 'bg-blue-100'
  }), [userRole]);

  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: `Halo! Saya ${assistantInfo.name}. Ada yang bisa saya bantu analisis hari ini?` }
  ]);

  // Cek apakah API Key sudah tersedia saat komponen dimuat
  useEffect(() => {
    const checkKey = async () => {
      if (typeof window !== 'undefined' && (window as any).aistudio) {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        if (!hasKey && !process.env.API_KEY) {
          setNeedsKey(true);
        }
      } else if (!process.env.API_KEY) {
        setNeedsKey(true);
      }
    };
    checkKey();
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading, isOpen]);

  const handleOpenKeyDialog = async () => {
    if (typeof window !== 'undefined' && (window as any).aistudio) {
      await (window as any).aistudio.openSelectKey();
      setNeedsKey(false);
      // Refresh pesan pembuka
      setMessages([{ role: 'assistant', content: "Terima kasih! API Key berhasil terhubung. Apa yang ingin Anda tanyakan?" }]);
    } else {
      alert("Fitur pemilihan kunci otomatis tidak tersedia di browser ini. Mohon pastikan API_KEY sudah diatur di Vercel.");
    }
  };

  const handleSend = async (customPrompt?: string) => {
    const userPrompt = customPrompt || input;
    if (!userPrompt.trim() || isLoading) return;

    if (needsKey && !process.env.API_KEY) {
      setMessages(prev => [...prev, 
        { role: 'user', content: userPrompt },
        { role: 'assistant', content: "Maaf, Anda perlu menghubungkan API Key terlebih dahulu melalui tombol di bawah." }
      ]);
      return;
    }

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userPrompt }, { role: 'assistant', content: '' }]);
    setIsLoading(true);

    try {
      const stream = askBusinessAssistantStream(userPrompt, inventory, transactions, userRole);
      let fullContent = '';
      let hasChunk = false;
      
      for await (const chunk of stream) {
        hasChunk = true;
        fullContent += chunk;
        setMessages(prev => {
          const newMsg = [...prev];
          newMsg[newMsg.length - 1].content = fullContent;
          return newMsg;
        });
      }

      if (!hasChunk && !fullContent) {
        throw new Error("Empty response");
      }

    } catch (e: any) {
      console.error(e);
      setMessages(prev => {
        const newMsg = [...prev];
        newMsg[newMsg.length - 1].content = "Terjadi gangguan koneksi. Mohon pastikan API Key Anda valid dan kuota mencukupi.";
        return newMsg;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] no-print font-sans">
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-[90vw] sm:w-[450px] h-[550px] bg-white rounded-[2rem] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          <header className="bg-slate-900 p-5 text-white flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-2xl ${assistantInfo.color} flex items-center justify-center text-xl shadow-inner`}>
                {assistantInfo.emoji}
              </div>
              <div>
                <h3 className="font-bold text-xs tracking-tight uppercase">{assistantInfo.name} <span className="text-indigo-400">| ANALYST AI</span></h3>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  <span className={`w-2 h-2 rounded-full ${isLoading ? 'bg-amber-400 animate-pulse' : (needsKey ? 'bg-rose-500' : 'bg-emerald-500')}`}></span>
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
                    {isLoading ? 'Processing' : (needsKey ? 'Disconnected' : 'Online')}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400">✕</button>
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed shadow-sm ${
                  m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                }`}>
                  <div className="prose prose-sm max-w-none break-words whitespace-pre-wrap">
                    {m.content || (isLoading && i === messages.length - 1 ? '...' : '')}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-white border-t border-slate-100">
            {needsKey && !process.env.API_KEY ? (
              <div className="mb-4 p-4 bg-rose-50 rounded-2xl border border-rose-100 flex flex-col items-center">
                <p className="text-[10px] text-rose-600 font-bold mb-3 text-center">Layanan AI memerlukan API Key Aktif</p>
                <button 
                  onClick={handleOpenKeyDialog}
                  className="w-full py-3 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-100"
                >
                  Hubungkan API Key
                </button>
                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-[9px] text-slate-400 mt-2 underline">Panduan Billing API</a>
              </div>
            ) : (
              <>
                {!isLoading && (
                  <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
                    {(userRole === UserRole.ADMIN ? ["Cek stok", "Laptop Apple"] : ["Analisis Profit", "Saran Restock"]).map(s => (
                      <button key={s} onClick={() => handleSend(s)} className="px-3 py-1.5 bg-slate-100 text-[10px] font-bold rounded-lg border border-slate-200 text-slate-600 hover:bg-indigo-600 hover:text-white transition-all">
                        {s}
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex space-x-2 bg-slate-50 p-2 rounded-2xl border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500">
                  <input 
                    className="flex-1 px-2 py-1 outline-none text-xs bg-transparent"
                    placeholder="Tanyakan analisis stok..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    disabled={isLoading}
                  />
                  <button 
                    onClick={() => handleSend()}
                    disabled={isLoading || !input.trim()}
                    className="p-2 bg-indigo-600 text-white rounded-xl disabled:opacity-50"
                  >
                    {isLoading ? '...' : '➤'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center text-3xl shadow-2xl transition-all transform hover:scale-110 ${
          isOpen ? 'bg-slate-900 text-white' : (needsKey && !process.env.API_KEY ? 'bg-rose-600 text-white animate-bounce' : 'bg-indigo-600 text-white')
        }`}
      >
        {isOpen ? '✕' : (needsKey && !process.env.API_KEY ? '⚠️' : assistantInfo.emoji)}
      </button>
    </div>
  );
};

export default AiAssistant;
