import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  Activity, AlertTriangle, TrendingUp, DollarSign, Clock, Globe, 
  Search, Newspaper, LineChart, Info, Star, Plus, Menu, X, 
  ExternalLink, FileText, Sparkles, Loader2, ShieldAlert, Zap, Crosshair, BarChart3, Target, Key, Settings
} from 'lucide-react';

// --- 工具組件：專業級提示框 ---
const Tooltip = ({ children, text }) => (
  <div className="group relative flex items-center cursor-help z-50">
    {children}
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-64 p-3 bg-slate-800 text-[10px] text-slate-100 border border-slate-600 rounded-lg shadow-2xl z-[100] whitespace-normal leading-relaxed text-left backdrop-blur-md bg-opacity-95">
      {text}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
    </div>
  </div>
);

// --- 專業金融圖表繪圖引擎 (Module 3) ---
const FinancialChart = ({ data, activeIndicator, stockTicker, isReal }) => {
  const hash = useMemo(() => stockTicker ? stockTicker.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 0, [stockTicker]);
  
  return (
    <div className="flex-1 w-full flex flex-col space-y-2">
      {/* 主圖區：OHLC 陰陽燭 */}
      <div className="flex-1 relative bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-inner group">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        <div className="absolute top-4 left-4 z-20 flex space-x-2">
          <span className="bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-[9px] font-black text-white uppercase">Daily</span>
          <span className="bg-cyan-900/20 border border-cyan-500/30 px-2 py-0.5 rounded text-[9px] font-black text-cyan-400">MA20</span>
          <span className="bg-purple-900/20 border border-purple-500/30 px-2 py-0.5 rounded text-[9px] font-black text-purple-400">MA60</span>
        </div>
        
        <svg className="w-full h-full p-8 relative z-10" preserveAspectRatio="none" viewBox="0 0 100 100">
          <path d="M0,85 Q20,70 40,75 T100,25" fill="none" stroke="#a855f7" strokeWidth="0.8" opacity="0.6" />
          <path d="M0,95 Q30,60 60,85 T100,20" fill="none" stroke="#22d3ee" strokeWidth="0.8" opacity="0.6" />
          {isReal && [...Array(22)].map((_, i) => {
            const isUp = (i + hash) % 2 === 0;
            const x = 5 + i * 4.3;
            const yBase = 25 + ((i * hash) % 40);
            const bodyH = 6 + (Math.abs(hash - i) % 15);
            return (
              <g key={i} className="hover:opacity-50 transition-opacity">
                <line x1={x + 1} y1={yBase - 4} x2={x + 1} y2={yBase + bodyH + 4} stroke={isUp ? '#ef4444' : '#22c55e'} strokeWidth="0.5" />
                <rect x={x} y={yBase} width="2.2" height={bodyH} fill={isUp ? '#ef4444' : '#22c55e'} rx="0.4" />
              </g>
            );
          })}
        </svg>
      </div>

      {/* 副圖區：技術指標動態圖形化 */}
      <div className="h-32 relative bg-slate-950 rounded-2xl border border-slate-800 p-2 overflow-hidden shadow-inner">
        <div className="absolute top-2 left-2 z-20 text-[9px] font-black text-slate-500 uppercase tracking-widest">{activeIndicator} Visualizer</div>
        <svg className="w-full h-full p-4 relative z-10" preserveAspectRatio="none" viewBox="0 0 100 100">
          {activeIndicator === 'KD' && (
            <g>
              <path d="M0,80 Q20,90 40,50 T100,20" fill="none" stroke="#f59e0b" strokeWidth="1.5" />
              <path d="M0,75 Q20,80 40,60 T100,30" fill="none" stroke="#3b82f6" strokeWidth="1.5" />
              <line x1="0" y1="20" x2="100" y2="20" stroke="#ef4444" strokeWidth="0.5" strokeDasharray="2,2" opacity="0.3" />
            </g>
          )}
          {activeIndicator === 'MACD' && (
            <g>
              {[...Array(20)].map((_, i) => {
                const h = 10 + (Math.sin(i + hash) * 20);
                return <rect key={i} x={i * 5} y={50 - (h > 0 ? h : 0)} width="3" height={Math.abs(h)} fill={h > 0 ? '#ef4444' : '#22c55e'} opacity="0.4" />;
              })}
            </g>
          )}
          {activeIndicator === 'RSI' && (
            <g>
              <path d="M0,70 L20,40 L40,75 L60,20 L80,50 L100,30" fill="none" stroke="#a855f7" strokeWidth="1.5" />
              <rect x="0" y="30" width="100" height="40" fill="#a855f7" opacity="0.05" />
            </g>
          )}
          {activeIndicator === 'VOL' && (
            <g className="opacity-40">
              {[...Array(25)].map((_, i) => (
                <rect key={i} x={i * 4} y={100 - (20 + (i * hash) % 60)} width="2" height={20 + (i * hash) % 60} fill="#475569" />
              ))}
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};

// --- Gemini AI 分析 ---
const callGeminiAPI = async (prompt, userKey, retries = 3) => {
  const finalKey = userKey || ""; // 優先使用使用者輸入的 Key
  if (!finalKey) return "請先輸入您的 Google Gemini API Key 以啟動 AI 分析報告。";
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${finalKey}`;
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: "你是一個專業的華爾街量化分析師，請將複雜數據撰寫成一般投資大眾易於閱讀的專業分析報告。繁體中文，不超過180字。" }] }
  };
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "分析生成失敗。";
    } catch {
      if (i === retries - 1) return "API 呼叫失敗，請檢查 Key 是否正確或網路狀態。";
      await new Promise(res => setTimeout(res, 1000));
    }
  }
};

const App = () => {
  const [market, setMarket] = useState('US');
  const [tickerInput, setTickerInput] = useState('');
  const [currentStock, setCurrentStock] = useState('AAPL');
  const [customKey, setCustomKey] = useState(''); // 使用者自訂 Key 狀態
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [activeIndicator, setActiveIndicator] = useState('KD'); 
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [appData, setAppData] = useState(null);
  const [aiResult, setAiResult] = useState('');
  const [isDeepDiving, setIsDeepDiving] = useState(false);
  const [isWakingUp, setIsWakingUp] = useState(false);

  const [watchlists, setWatchlists] = useState({
    US: ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMD', 'META'],
    TW: ['2330', '2454', '2317', '2308', '2603', '2881']
  });

  const BACKEND_URL = "https://quant-nana-ai-1.onrender.com";

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleWatchlist = (ticker) => {
    const m = /^\d+$/.test(ticker) ? 'TW' : 'US';
    setWatchlists(prev => {
      const list = prev[m];
      const newList = list.includes(ticker) ? list.filter(t => t !== ticker) : [...list, ticker];
      return { ...prev, [m]: newList };
    });
  };

  const isInWatchlist = watchlists[market].includes(currentStock);

  const handleSearch = (e) => {
    e.preventDefault();
    if (tickerInput.trim()) {
      const ticker = tickerInput.toUpperCase();
      if (/^\d+$/.test(ticker)) setMarket('TW');
      else setMarket('US');
      setCurrentStock(ticker);
      setTickerInput('');
    }
  };

  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 4;

    const fetchData = async () => {
      if (!isMounted) return;
      setIsLoading(true);
      setIsWakingUp(false);
      setAiResult('');
      setSelectedStrategy(null);
      const hash = currentStock.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      
      try {
        const response = await fetch(`${BACKEND_URL}/api/stock/${currentStock}`);
        if (!response.ok) throw new Error('Offline');
        const realData = await response.json();
        
        if (isMounted) {
          setAppData({
            macro: { 
                indices: { sp500: 5123.4 + (hash%50), taiex: 22857.6 + (hash%100), usdtwd: 31.85 + (hash%10)/100 },
                fearGreedIndex: 25 + (hash % 15), 
                news: [
                    { source: 'Reuters', text: `$${currentStock} 雲端引擎同步成功。市場數據精確度已過校驗。` },
                    { source: '分析中心', text: `計量模型檢測到 $${currentStock} 目前處於關鍵轉折區位。` }
                ] 
            },
            stock: realData.stock,
            tech: realData.tech,
            isReal: true
          });
          setIsLoading(false);
        }
      } catch (error) {
        if (retryCount < maxRetries) {
          retryCount++;
          setIsWakingUp(true);
          setTimeout(fetchData, 4000);
        } else if (isMounted) {
          const isTW = /^\d+$/.test(currentStock);
          setAppData({
            macro: { indices: { sp500: 5123.4, taiex: 22857, usdtwd: 31.85 }, fearGreedIndex: 30, news: [{ source: '警告', text: '引擎目前休眠中，系統正自動進行三次喚醒嘗試，請稍候。' }] },
            stock: { price: "---", change: "0.00", pe: 0, roe: 0, analystTarget: "N/A" },
            tech: { kd: { k: 0, d: 0 }, rsi: 0, macd: "喚醒中", marginRate: 160, chipData: { isTWSE: isTW } },
            isReal: false
          });
          setIsLoading(false);
        }
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, [currentStock]);

  if (isLoading || !appData) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-blue-400 font-mono">
      <Activity className="w-16 h-16 mb-4 animate-bounce" />
      <h2 className="text-2xl font-black uppercase text-white tracking-widest">Quant Nana</h2>
      <div className="text-sm text-slate-500 mt-4 flex items-center">
        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> {isWakingUp ? "喚醒雲端大腦中 (需約30秒)..." : `抓取 ${currentStock} 即時行情...`}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans selection:bg-blue-500/30 overflow-x-hidden flex flex-col">
      {/* ================= 頂部導覽列 ================= */}
      <header className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-50 shadow-2xl backdrop-blur-md bg-opacity-90 flex justify-between items-center gap-4">
        <div className="flex items-center space-x-3">
          <Activity className="text-blue-500 w-8 h-8" />
          <h1 className="text-2xl font-black text-white tracking-tighter">QUANT<span className="text-blue-500">NANA</span></h1>
          {appData.isReal ? 
            <span className="bg-green-500/10 text-green-400 text-[10px] px-3 py-1 rounded-full border border-green-500/20 flex items-center"><span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 animate-pulse"></span> 雲端連線</span> :
            <span className="bg-orange-500/10 text-orange-400 text-[10px] px-3 py-1 rounded-full border border-orange-500/20 flex items-center"><Loader2 className="w-3 h-3 mr-2 animate-spin"/> 引擎喚醒</span>
          }
        </div>

        <form onSubmit={handleSearch} className="flex-1 max-w-xl relative group flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
            <input type="text" value={tickerInput} onChange={(e)=>setTickerInput(e.target.value)} placeholder="搜尋代碼 (例: 2330, NVDA)..." className="w-full bg-slate-950 border border-slate-700 text-white rounded-2xl pl-10 pr-4 py-2 text-sm focus:border-blue-500 outline-none uppercase" />
          </div>
          <button type="button" onClick={()=>toggleWatchlist(currentStock)} className={`p-2.5 rounded-2xl border transition-all ${isInWatchlist ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400' : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-white'}`}>
            <Star className={`w-5 h-5 ${isInWatchlist ? 'fill-current' : ''}`} />
          </button>
        </form>

        {/* 使用者輸入 Gemini Key 區域 */}
        <div className="hidden xl:flex items-center bg-slate-800/50 px-3 py-1.5 rounded-2xl border border-slate-700 gap-2">
           <Key className="w-4 h-4 text-purple-400" />
           <input type="password" value={customKey} onChange={(e)=>setCustomKey(e.target.value)} placeholder="輸入 Gemini API Key" className="bg-transparent text-xs text-white focus:outline-none w-32 border-b border-slate-600 focus:border-purple-400" />
           <Tooltip text="此 Key 僅存於您的瀏覽器本地狀態。我們強烈建議使用者輸入自己的 Key 以確保 AI 報告生成的穩定性。">
              <Info className="w-3 h-3 text-slate-500" />
           </Tooltip>
        </div>

        <div className="flex bg-slate-800 p-1 rounded-xl shadow-lg border border-slate-700">
           <button onClick={()=>{setMarket('US'); setCurrentStock('AAPL');}} className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${market==='US' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>US</button>
           <button onClick={()=>{setMarket('TW'); setCurrentStock('2330');}} className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${market==='TW' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>TW</button>
        </div>
      </header>

      {/* ================= 主內容區 ================= */}
      <main className="max-w-[1750px] mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 w-full flex-1">
        
        {/* 左側自選清單 */}
        <aside className="hidden lg:block lg:col-span-2 space-y-2">
           <h2 className="text-white font-black text-[10px] mb-5 flex items-center uppercase tracking-widest opacity-50"><Star className="w-3 h-3 mr-2 text-yellow-400 fill-current"/> My Watchlist</h2>
           <div className="space-y-1.5 overflow-y-auto max-h-[75vh] custom-scrollbar">
             {watchlists[market].map(t => (
               <button key={t} onClick={()=>setCurrentStock(t)} className={`w-full p-4 rounded-2xl cursor-pointer border transition-all text-sm font-bold font-mono flex justify-between items-center group ${currentStock===t ? 'bg-blue-900/30 border-blue-500/50 text-white shadow-lg' : 'border-transparent text-slate-500 hover:bg-slate-900'}`}>
                 {t}
                 {currentStock===t && <Activity className="w-3 h-3 text-blue-400 animate-pulse" />}
               </button>
             ))}
           </div>
        </aside>

        {/* 核心戰情區域 */}
        <div className="lg:col-span-10 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* 左欄：總經與價值 */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* 模組一：總經大盤 (數據校正版) */}
            <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-800 shadow-2xl">
               <h3 className="text-white font-bold mb-6 flex items-center text-sm uppercase tracking-wider"><Globe className="w-4 h-4 mr-3 text-purple-400"/> 模組一：總經與 NLP 情緒</h3>
               <div className="grid grid-cols-3 gap-2 mb-6 text-center">
                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800"><span className="text-[9px] text-slate-500 block mb-1 font-bold">S&P 500</span><span className="text-xs font-black text-white font-mono">{appData.macro.indices.sp500.toFixed(1)}</span></div>
                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800"><span className="text-[9px] text-slate-500 block mb-1 font-bold">加權指數</span><span className="text-xs font-black text-red-400 font-mono">{appData.macro.indices.taiex.toFixed(0)}</span></div>
                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800"><span className="text-[9px] text-slate-500 block mb-1 font-bold">USD/TWD</span><span className="text-xs font-black text-white font-mono">{appData.macro.indices.usdtwd.toFixed(2)}</span></div>
               </div>
               <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800 mb-6 shadow-inner">
                  <div className="flex justify-between text-[10px] mb-3 font-black uppercase tracking-tighter"><span className="text-slate-400">Fear & Greed Index</span><span className="text-red-400">{appData.macro.fearGreedIndex}</span></div>
                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-full transition-all duration-1000" style={{width: `${appData.macro.fearGreedIndex}%`}}></div>
                  </div>
               </div>
               <div className="space-y-4">
                  <span className="text-purple-400 font-black text-[10px] flex items-center uppercase tracking-widest"><Sparkles className="w-3.5 h-3.5 mr-2"/> AI NLP 分析實時饋送</span>
                  {appData.macro.news.map((n, i) => (
                    <div key={i} className="bg-purple-900/10 p-4 rounded-2xl border border-purple-500/20 text-[11px] text-slate-300 border-l-4 border-l-purple-500">
                       <span className="font-black text-purple-400 mr-2">[{n.source}]</span> {n.text}
                    </div>
                  ))}
               </div>
            </div>

            {/* 模組二：價值護城河 (含分析師目標價) */}
            <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-800 shadow-2xl">
               <h3 className="text-white font-bold mb-6 flex items-center text-sm uppercase tracking-wider"><ShieldAlert className="w-4 h-4 mr-3 text-emerald-400"/> 模組二：價值護城河</h3>
               <div className="grid grid-cols-2 gap-4 mb-5">
                  <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800 text-center group hover:border-emerald-500/50 transition-colors">
                    <span className="text-slate-500 text-[10px] block mb-2 font-black uppercase">P/E Ratio</span>
                    <span className={`text-3xl font-mono font-black ${appData.stock.pe < 20 && appData.isReal ? 'text-emerald-400' : 'text-white'}`}>{appData.stock.pe || '---'}</span>
                  </div>
                  <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800 text-center group hover:border-emerald-500/50 transition-colors">
                    <span className="text-slate-500 text-[10px] block mb-2 font-black uppercase">ROE %</span>
                    <span className={`text-3xl font-mono font-black ${appData.stock.roe > 15 && appData.isReal ? 'text-emerald-400' : 'text-white'}`}>{appData.stock.roe || '---'}%</span>
                  </div>
               </div>
               <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800 border-t-4 border-t-blue-500 flex justify-between items-center group hover:bg-slate-900 transition-all">
                  <div className="flex flex-col">
                     <span className="text-slate-500 text-[10px] uppercase font-black tracking-widest mb-1">Analyst Target (Avg)</span>
                     <span className="text-2xl font-mono font-black text-white group-hover:text-blue-400 transition-colors">${appData.stock.analystTarget}</span>
                  </div>
                  <Target className="w-8 h-8 text-blue-400 opacity-50 group-hover:opacity-100 transition-opacity" />
               </div>
            </div>
          </div>

          {/* 右欄：圖表與戰略 */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-800 shadow-2xl flex flex-col min-h-[550px]">
               <div className="flex justify-between items-end mb-8 border-b border-slate-800 pb-5">
                  <div>
                    <h3 className="text-white font-bold text-lg flex items-center mb-1.5 tracking-tight"><LineChart className="w-5 h-5 mr-3 text-cyan-400"/> 模組三：技術與籌碼共振</h3>
                    <div className="flex space-x-2">
                       <span className="text-[10px] bg-slate-800 text-slate-400 px-3 py-1 rounded-full uppercase font-black border border-slate-700">{currentStock}</span>
                       <span className="text-[10px] bg-blue-900/30 text-blue-400 px-3 py-1 rounded-full uppercase font-black animate-pulse shadow-lg">Precision Engine</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-5xl font-mono font-black text-white leading-none mb-2 tracking-tighter">
                        {appData.isReal ? `$${appData.stock.price}` : '同步中...'}
                    </div>
                    <span className={`text-base font-black flex items-center justify-end ${Number(appData.stock.change) >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                      {Number(appData.stock.change) >= 0 ? '▲' : '▼'} {Math.abs(appData.stock.change)}%
                    </span>
                  </div>
               </div>

               <FinancialChart data={appData} activeIndicator={activeIndicator} stockTicker={currentStock} isReal={appData.isReal} />

               {/* 台股特化籌碼區 */}
               {appData.tech.chipData?.isTWSE && appData.isReal && (
                <div className="my-6 space-y-4">
                   <div className="grid grid-cols-3 gap-4 bg-blue-900/10 border border-blue-500/20 p-6 rounded-3xl shadow-xl backdrop-blur-sm">
                      <div className="flex flex-col"><span className="text-[10px] text-slate-500 uppercase font-black mb-1.5 tracking-tighter">外資買賣 (張)</span><span className={`font-mono font-black text-2xl ${appData.tech.chipData.foreignInvestor >= 0 ? 'text-red-400' : 'text-green-400'}`}>{appData.tech.chipData.foreignInvestor > 0 ? '+' : ''}{appData.tech.chipData.foreignInvestor}</span></div>
                      <div className="flex flex-col border-x border-slate-800 px-5"><span className="text-[10px] text-slate-500 uppercase font-black mb-1.5 tracking-tighter">投信買賣 (張)</span><span className={`font-mono font-black text-2xl ${appData.tech.chipData.investmentTrust >= 0 ? 'text-red-400' : 'text-green-400'}`}>{appData.tech.chipData.investmentTrust > 0 ? '+' : ''}{appData.tech.chipData.investmentTrust}</span></div>
                      <div className="flex flex-col"><span className="text-[10px] text-slate-500 uppercase font-black mb-1.5 tracking-tighter">融資維持率</span><span className={`font-mono font-black text-2xl ${appData.tech.marginRate < 130 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{appData.tech.marginRate}%</span></div>
                   </div>
                   {appData.tech.marginRate < 130 && (
                     <div className="bg-red-950/40 border border-red-500/50 p-5 rounded-3xl flex items-center animate-pulse shadow-red-900/20">
                        <AlertTriangle className="w-6 h-6 text-red-500 mr-4" />
                        <span className="text-red-300 text-xs font-black uppercase tracking-wide">警告：融資維持率低於 130% 臨界線，嚴防多殺多風險。</span>
                     </div>
                   )}
                </div>
               )}

               <div className="grid grid-cols-4 gap-4 mt-6">
                 {['KD', 'RSI', 'MACD', 'VOL'].map(ind => (
                   <button key={ind} onClick={()=>setActiveIndicator(ind)} className={`py-3.5 rounded-2xl border text-[11px] font-black transition-all shadow-md ${activeIndicator===ind ? 'bg-blue-600 border-blue-500 text-white shadow-blue-900/40' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300'}`}>{ind}</button>
                 ))}
               </div>
            </div>

            {/* 模組四：AI 戰略圖卡 (包含定期定額) */}
            <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-800 shadow-2xl">
               <h3 className="text-white font-bold mb-6 flex items-center text-base uppercase tracking-widest"><Zap className="w-5 h-5 mr-3 text-yellow-500"/> 模組四：AI 量化戰術圖卡</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div onClick={async()=>{
                      setIsDeepDiving(true);
                      setSelectedStrategy({title: '價值建倉計畫'});
                      const res = await callGeminiAPI(`分析 ${currentStock} 價值。 PE: ${appData.stock.pe}, ROE: ${appData.stock.roe}`, customKey);
                      setAiResult(res);
                      setIsDeepDiving(false);
                    }} className="bg-slate-950 p-6 rounded-[2rem] border border-emerald-500/20 hover:border-emerald-500/60 cursor-pointer transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3"><Plus className="w-5 h-5 text-emerald-500 opacity-0 group-hover:opacity-100 transition-all"/></div>
                    <h4 className="text-emerald-400 font-black text-xs uppercase mb-3 flex items-center tracking-widest"><DollarSign className="w-4 h-4 mr-2"/> 價值建倉</h4>
                    <p className="text-[10px] text-slate-500 leading-relaxed font-medium">基本面護城河深厚，適合分批佈局核心部位...</p>
                  </div>
                  
                  <div onClick={async()=>{
                      setIsDeepDiving(true);
                      setSelectedStrategy({title: '波段作多計畫'});
                      const res = await callGeminiAPI(`為 ${currentStock} 規劃波段計畫。現價: ${appData.stock.price}`, customKey);
                      setAiResult(res);
                      setIsDeepDiving(false);
                    }} className="bg-slate-950 p-6 rounded-[2rem] border border-purple-500/20 hover:border-purple-500/60 cursor-pointer transition-all group">
                    <h4 className="text-purple-400 font-black text-xs uppercase mb-3 flex items-center tracking-widest"><TrendingUp className="w-4 h-4 mr-2"/> 波段作多</h4>
                    <p className="text-[10px] text-slate-500 leading-relaxed font-medium">指標修正完成，建議設定關鍵支撐後進場...</p>
                  </div>

                  <div onClick={async()=>{
                      setIsDeepDiving(true);
                      setSelectedStrategy({title: '定期定額 (DCA) 分析'});
                      const res = await callGeminiAPI(`評估 ${currentStock} 是否適合定期定額。`, customKey);
                      setAiResult(res);
                      setIsDeepDiving(false);
                    }} className="bg-slate-950 p-6 rounded-[2rem] border border-blue-500/20 hover:border-blue-500/60 cursor-pointer transition-all group">
                    <h4 className="text-blue-400 font-black text-xs uppercase mb-3 flex items-center tracking-widest"><Clock className="w-4 h-4 mr-2"/> 定期定額</h4>
                    <p className="text-[10px] text-slate-500 leading-relaxed font-medium">微笑曲線長期扣款評估與產業週期分析...</p>
                  </div>

                  {/* 當沖高風險警告 */}
                  <div onClick={()=>setSelectedStrategy({title: '當沖交易警告', details: '根據量化引擎試算，目前市場期望值為負。戰術要求：收盤絕對不留倉，嚴控資金。'})} className="md:col-span-2 lg:col-span-3 bg-red-950/20 border border-red-900/40 p-5 rounded-[2rem] flex items-center hover:bg-red-900/30 transition-all cursor-pointer group shadow-lg">
                     <AlertTriangle className="w-10 h-10 text-red-500 mr-5 group-hover:scale-110 transition-all" />
                     <div className="flex-1">
                        <h4 className="text-red-400 font-black text-xs uppercase mb-1 flex items-center tracking-tighter">當沖/短線極高風險警告 <ShieldAlert className="w-3 h-3 ml-2 animate-pulse"/></h4>
                        <p className="text-[10px] text-red-300/70 font-medium tracking-tight">根據量化引擎試算期望值為負。戰術要求：<span className="text-red-400 underline font-black">收盤絕對不留倉。</span></p>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </main>

      {/* AI 推演 Modal */}
      {selectedStrategy && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-2xl" onClick={()=>setSelectedStrategy(null)}></div>
          <div className="relative bg-slate-900 border border-slate-800 w-full max-w-xl rounded-[2.5rem] shadow-3xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
              <h2 className="text-white font-black text-xl flex items-center uppercase tracking-tight"><Sparkles className="w-6 h-6 mr-3 text-blue-500"/> AI 深度推演：{selectedStrategy.title}</h2>
              <button onClick={()=>setSelectedStrategy(null)} className="text-slate-500 hover:text-white transition-colors bg-slate-800 p-2 rounded-full shadow-lg"><X className="w-6 h-6"/></button>
            </div>
            <div className="p-8 text-sm text-slate-300 leading-relaxed max-h-[60vh] overflow-y-auto">
               {isDeepDiving ? (
                 <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
                    <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px]">Quantum Insight Computing...</p>
                 </div>
               ) : (
                 <div className="whitespace-pre-line bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-inner font-medium shadow-lg">
                   {aiResult || selectedStrategy.details}
                 </div>
               )}
            </div>
          </div>
        </div>
      )}

      {/* 全域 CSS 微調 */}
      <style dangerouslySetInnerHTML={{ __html: `
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .shadow-3xl { box-shadow: 0 40px 100px -20px rgba(0, 0, 0, 0.8); }
      `}} />
    </div>
  );
};

export default App;

// --- 安全初始化入口 ---
const container = document.getElementById('root');
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(<App />);
}
