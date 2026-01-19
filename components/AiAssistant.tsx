
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
  const scrollRef = useRef<HTMLDivElement>(null);

  const assistantInfo = useMemo(() => {
    const profiles = [
      { type: 'female', emoji: '👩‍💼', color: 'bg-rose-100', name: 'Siska' },
      { type: 'male', emoji: '👨‍💼', color: 'bg-blue-100', name: 'Budi' }
    ];
    return profiles[userRole === UserRole.ADMIN ? 0 : 1];
  }, [userRole]);

  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: `Halo! Saya ${assistantInfo.name}, analis sistem Anda. Saya melihat data ${inventory.length} laptop dan ${transactions.length} transaksi. Ada yang perlu saya bantu analisis?` 
    }
  ]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen, isLoading]);

  const handleSend = async (customPrompt?: string) => {
    const userPrompt = customPrompt || input;
    if (!userPrompt.trim() || isLoading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userPrompt }]);
    setIsLoading(true);

    // Placeholder for incoming stream
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      const stream = askBusinessAssistantStream(userPrompt, inventory, transactions, userRole);
      let fullContent = '';
      let hasReceivedData = false;

      for await (const chunk of stream) {
        hasReceivedData = true;
        fullContent += chunk;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].content = fullContent;
          return [...newMessages];
        });
      }

      if (!hasReceivedData) {
        throw new Error("No data received from stream");
      }

    } catch (error) {
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1].content = 'Maaf, sistem AI sedang mengalami gangguan koneksi. Mohon pastikan API Key sudah terpasang di Vercel Dashboard.';
        return [...newMessages];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const suggestions = useMemo(() => {
    if (userRole === UserRole.OWNER || userRole === UserRole.SUPER_ADMIN) {
      return ["Tampilkan tabel laba rugi", "Laptop paling untung?", "Ringkasan stok kritis"];
    }
    return ["List stok laptop ASUS", "Penjualan hari ini", "Cek stok menipis"];
  }, [userRole]);

  return (
    <div className="fixed bottom-6 right-6 z-[100] no-print">
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-[380px] sm:w-[500px] h-[600px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          <header className="bg-slate-900 p-4 text-white flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-full ${assistantInfo.color} flex items-center justify-center text-xl shadow-inner`}>
                {assistantInfo.emoji}
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-tight">{assistantInfo.name} <span className="text-indigo-400 font-normal">| {userRole.replace('_', ' ')} AI</span></h3>
                <div className="flex items-center space-x-1.5">
                  <span className={`w-2 h-2 rounded-full ${isLoading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`}></span>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{isLoading ? 'Menganalisis...' : 'Aktif'}</span>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in duration-300`}>
                <div className={`max-w-[90%] p-4 rounded-2xl text-sm shadow-sm transition-all ${
                  m.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                }`}>
                  <div className="prose prose-sm max-w-none prose-slate">
                    <p className="whitespace-pre-wrap leading-relaxed font-medium">
                      {m.content || (isLoading && i === messages.length - 1 ? 'Memanggil database analis...' : '')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {!isLoading && (
            <div className="px-4 py-2 bg-white flex gap-2 overflow-x-auto no-scrollbar">
               {suggestions.map(q => (
                <button 
                  key={q}
                  onClick={() => handleSend(q)}
                  className="whitespace-nowrap px-3 py-1.5 bg-slate-100 border border-slate-200 text-[11px] text-slate-600 font-bold rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <div className="p-4 bg-white border-t border-slate-100">
            <div className="flex space-x-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
              <input 
                className="flex-1 px-3 py-2 outline-none text-sm bg-transparent text-slate-900 placeholder:text-slate-400"
                placeholder="Tanyakan analisis stok atau profit..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                disabled={isLoading}
              />
              <button 
                onClick={() => handleSend()}
                disabled={isLoading || !input.trim()}
                className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 active:scale-95 transition-all"
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center text-3xl shadow-2xl transition-all transform hover:scale-110 active:scale-95 ${
          isOpen ? 'bg-slate-900 text-white rotate-90' : 'bg-indigo-600 text-white'
        }`}
      >
        {isOpen ? <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg> : assistantInfo.emoji}
      </button>
    </div>
  );
};

export default AiAssistant;
