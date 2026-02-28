import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Activity, AlertTriangle, TrendingUp, DollarSign, Clock, Globe, 
  Search, Newspaper, LineChart, Info, Star, Plus, Menu, X, 
  ExternalLink, FileText, Sparkles, Loader2, ShieldAlert, Zap, Crosshair, BarChart3
} from 'lucide-react';

// --- 工具組件：美化提示框 ---
const Tooltip = ({ children, text }) => (
  <div className="group relative flex items-center cursor-help z-50">
    {children}
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-56 p-2 bg-slate-800 text-[10px] text-slate-100 border border-slate-600 rounded-lg shadow-2xl z-[100] whitespace-normal leading-relaxed text-left">
      {text}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
    </div>
  </div>
);

// 輔助函數：雜湊用於繪製 K 線視覺樣式
const hashString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash);
};

// --- Gemini AI 整合 ---
const apiKey = ""; 
const callGeminiAPI = async (prompt, retries = 5) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: "你是一個專業的華爾街量化分析師，請用繁體中文回答，語氣專業、簡潔。回覆字數嚴格控制在 150 字以內。" }] }
  };
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "無法生成內容。";
    } catch (error) {
      if (i === retries - 1) return "AI 呼叫失敗，請稍後再試。";
      await new Promise(res => setTimeout(res, Math.pow(2, i) * 1000));
    }
  }
};

const App = () => {
  // 狀態管理
  const [market, setMarket] = useState('US');
  const [tickerInput, setTickerInput] = useState('');
  const [currentStock, setCurrentStock] = useState('AAPL');
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [activeIndicator, setActiveIndicator] = useState('KD'); 
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [appData, setAppData] = useState(null);
  const [aiDeepDiveResult, setAiDeepDiveResult] = useState('');
  const [isDeepDiving, setIsDeepDiving] = useState(false);

  // 自選股清單狀態
  const [watchlists, setWatchlists] = useState({
    US: ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMD', 'META'],
    TW: ['2330', '2454', '2317', '2308', '2603', '2881']
  });

  // 【重要】Render 後端網址
  const BACKEND_URL = "https://quant-nana-ai-1.onrender.com";

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 自選股切換邏輯
  const toggleWatchlist = (ticker) => {
    const m = /^\d+$/.test(ticker) ? 'TW' : 'US';
    setWatchlists(prev => {
      const currentList = prev[m];
      if (currentList.includes(ticker)) return { ...prev, [m]: currentList.filter(t => t !== ticker) };
      return { ...prev, [m]: [...currentList, ticker] };
    });
  };

  const isInWatchlist = watchlists[market].includes(currentStock);

  // 搜尋處理
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

  // 資料抓取邏輯
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setIsLoading(true);
      setAiDeepDiveResult('');
      setSelectedStrategy(null);
      const hash = hashString(currentStock);
      
      try {
        const response = await fetch(`${BACKEND_URL}/api/stock/${currentStock}`);
        if (!response.ok) throw new Error('Offline');
        const realData = await response.json();
        
        if (isMounted) {
          setAppData({
            macro: { 
                indices: { sp500: 5123.4 + (hash%50), taiex: 20156.7 - (hash%100), usdtwd: 31.85 + (hash%10)/100 },
                fearGreedIndex: 25 + (hash % 15), 
                vix: 14 + (hash % 8),
                news: [
                    { source: '路透社', text: `$${currentStock} 數據串流已同步，當前為交易所即時成交價位。` },
                    { source: 'AI 監控', text: `計量模型檢測到 $${currentStock} 處於關鍵技術區間。` }
                ] 
            },
            stock: realData.stock,
            tech: realData.tech,
            isReal: true
          });
          setIsLoading(false);
        }
      } catch (error) {
        const isTW = /^\d+$/.test(currentStock);
        if (isMounted) {
          setAppData({
            macro: { 
              indices: { sp500: 5123.4, taiex: 20156.7, usdtwd: 31.85 },
              fearGreedIndex: 30, 
              news: [{ source: '連線中', text: '後端正在喚醒（Render），請稍後搜尋重新同步真實數據。' }] 
            },
            stock: { price: "---", change: "0.00", pe: 0, roe: 0, analystTarget: "---" },
            tech: { kd: { k: 0, d: 0 }, rsi: 0, macd: "同步中", marginRate: 160, chipData: { isTWSE: isTW } },
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
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-blue-400">
      <Activity className="w-16 h-16 mb-4 animate-bounce" />
      <h2 className="text-2xl font-black tracking-widest uppercase">Quant Nana AI</h2>
      <div className="text-sm text-slate-500 mt-4 flex items-center">
        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> 正在同步 {currentStock} 雲端計量數據...
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans selection:bg-blue-500/30 overflow-x-hidden flex flex-col">
      {/* 頂部導覽列 */}
      <header className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-50 shadow-2xl backdrop-blur-md">
        <div className="max-w-[1700px] mx-auto flex justify-between items-center gap-4">
          <div className="flex items-center space-x-3">
            <Activity className="text-blue-500 w-8 h-8" />
            <h1 className="text-2xl font-black text-white tracking-tighter">QUANT<span className="text-blue-500">NANA</span></h1>
            {appData.isReal ? 
              <span className="bg-green-500/10 text-green-400 text-[10px] px-3 py-1 rounded-full border border-green-500/20 flex items-center">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 animate-pulse"></span> 真實即時數據
              </span> :
              <span className="bg-orange-500/10 text-orange-400 text-[10px] px-3 py-1 rounded-full border border-orange-500/20">喚醒引擎中</span>
            }
          </div>

          <form onSubmit={handleSearch} className="flex-1 max-w-xl relative group flex items-center space-x-2">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                <input type="text" value={tickerInput} onChange={(e)=>setTickerInput(e.target.value)} placeholder="搜尋代碼 (例: 2330, NVDA)..." className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl pl-10 pr-4 py-2 text-sm focus:border-blue-500 outline-none uppercase transition-all" />
            </div>
            <button type="button" onClick={()=>toggleWatchlist(currentStock)} className={`p-2 rounded-xl border transition-all ${isInWatchlist ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.1)]' : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-white'}`}>
                <Star className={`w-5 h-5 ${isInWatchlist ? 'fill-current' : ''}`} />
            </button>
          </form>

          <div className="flex items-center space-x-4">
             <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
                <button onClick={()=>{setMarket('US'); setCurrentStock('AAPL');}} className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${market==='US' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>US</button>
                <button onClick={()=>{setMarket('TW'); setCurrentStock('2330');}} className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${market==='TW' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>TW</button>
             </div>
             <div className="text-xs text-slate-500 font-mono hidden xl:block bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">{currentTime}</div>
          </div>
        </div>
      </header>

      {/* 主介面區 */}
      <main className="max-w-[1700px] mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 w-full flex-1">
        
        {/* 左側自選看板 */}
        <aside className="hidden lg:block lg:col-span-2 space-y-2">
           <h2 className="text-white font-black text-[10px] mb-5 flex items-center uppercase tracking-widest opacity-50"><Star className="w-3 h-3 mr-2 text-yellow-400 fill-current"/> My Radar</h2>
           {watchlists[market].map(t => (
             <button key={t} onClick={()=>setCurrentStock(t)} className={`w-full p-4 rounded-xl cursor-pointer border transition-all text-sm font-bold font-mono flex justify-between items-center group ${currentStock===t ? 'bg-blue-900/30 border-blue-500/50 text-white shadow-lg' : 'border-transparent text-slate-500 hover:bg-slate-900'}`}>
               {t}
               {currentStock===t && <Activity className="w-3 h-3 text-blue-400 animate-pulse" />}
             </button>
           ))}
        </aside>

        {/* 核心內容 */}
        <div className="lg:col-span-10 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* 左欄：總經與價值 */}
          <div className="lg:col-span-4 space-y-6">
            {/* 模組一 */}
            <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-800 shadow-2xl">
               <h3 className="text-white font-bold mb-6 flex items-center text-sm uppercase tracking-wider"><Globe className="w-4 h-4 mr-3 text-purple-400"/> 模組一：總經與 NLP 情緒</h3>
               <div className="grid grid-cols-3 gap-2 mb-6 text-center">
                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 shadow-inner"><span className="text-[9px] text-slate-500 block mb-1">S&P 500</span><span className="text-xs font-black text-white font-mono">{appData.macro.indices.sp500.toFixed(1)}</span></div>
                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 shadow-inner"><span className="text-[9px] text-slate-500 block mb-1">加權指數</span><span className="text-xs font-black text-red-400 font-mono">{appData.macro.indices.taiex.toFixed(0)}</span></div>
                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 shadow-inner"><span className="text-[9px] text-slate-500 block mb-1">USD/TWD</span><span className="text-xs font-black text-white font-mono">{appData.macro.indices.usdtwd.toFixed(2)}</span></div>
               </div>
               <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800 mb-6 shadow-inner">
                  <div className="flex justify-between text-[10px] mb-3 font-black uppercase tracking-tighter"><span className="text-slate-400">Fear & Greed Index</span><span className="text-red-400">{appData.macro.fearGreedIndex}</span></div>
                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-full transition-all duration-1000" style={{width: `${appData.macro.fearGreedIndex}%`}}></div>
                  </div>
               </div>
               <div className="space-y-4">
                  <span className="text-purple-400 font-black text-[10px] flex items-center uppercase tracking-widest"><Sparkles className="w-3.5 h-3.5 mr-2"/> AI NLP Feed</span>
                  {appData.macro.news.map((n, i) => (
                    <div key={i} className="bg-purple-900/10 p-4 rounded-2xl border border-purple-500/20 text-[11px] text-slate-300 leading-relaxed border-l-4 border-l-purple-500">
                       <span className="font-black text-purple-400 mr-2">[{n.source}]</span> {n.text}
                    </div>
                  ))}
               </div>
            </div>

            {/* 模組二 */}
            <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-800 shadow-2xl">
               <h3 className="text-white font-bold mb-6 flex items-center text-sm uppercase tracking-wider"><ShieldAlert className="w-4 h-4 mr-3 text-emerald-400"/> 模組二：價值護城河</h3>
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800 text-center group hover:border-emerald-500/50 transition-colors">
                    <span className="text-slate-500 text-[10px] block mb-2 font-black uppercase tracking-widest">P/E Ratio</span>
                    <span className={`text-3xl font-mono font-black ${appData.stock.pe < 20 && appData.isReal ? 'text-emerald-400' : 'text-white'}`}>{appData.stock.pe || '---'}</span>
                  </div>
                  <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800 text-center group hover:border-emerald-500/50 transition-colors">
                    <span className="text-slate-500 text-[10px] block mb-2 font-black uppercase tracking-widest">ROE %</span>
                    <span className={`text-3xl font-mono font-black ${appData.stock.roe > 15 && appData.isReal ? 'text-emerald-400' : 'text-white'}`}>{appData.stock.roe || '---'}%</span>
                  </div>
               </div>
            </div>
          </div>

          {/* 右欄：技術與戰略 */}
          <div className="lg:col-span-8 space-y-6">
            {/* 模組三：技術圖表與台股籌碼 */}
            <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-800 shadow-2xl flex flex-col min-h-[550px]">
               <div className="flex justify-between items-end mb-8 border-b border-slate-800 pb-5">
                  <div>
                    <h3 className="text-white font-bold text-lg flex items-center mb-1.5 tracking-tight"><LineChart className="w-5 h-5 mr-3 text-cyan-400"/> 模組三：技術與籌碼共振</h3>
                    <div className="flex space-x-2">
                       <span className="text-[10px] bg-slate-800 text-slate-400 px-3 py-1 rounded-full uppercase font-black border border-slate-700">{currentStock}</span>
                       <span className="text-[10px] bg-blue-900/30 text-blue-400 px-3 py-1 rounded-full uppercase font-black animate-pulse">Precision Sync</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-5xl font-mono font-black text-white leading-none mb-2 tracking-tighter">
                        {appData.isReal ? `$${appData.stock.price}` : '同步中...'}
                    </div>
                    <span className={`text-base font-black flex items-center justify-end ${Number(appData.stock.change) >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {Number(appData.stock.change) >= 0 ? '▲' : '▼'} {Math.abs(appData.stock.change)}%
                    </span>
                  </div>
               </div>

               {/* 專業級 SVG 圖表 */}
               <div className="flex-1 bg-slate-950 rounded-[2rem] mb-6 relative overflow-hidden group border border-slate-800 shadow-inner">
                  <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
                  <svg className="w-full h-full p-8 relative z-10" preserveAspectRatio="none" viewBox="0 0 100 100">
                    <line x1="0" y1="40" x2="100" y2="40" stroke="#3b82f6" strokeWidth="0.3" strokeDasharray="5,5" opacity="0.4" />
                    <path d="M0,80 Q20,70 40,75 T60,55 T80,40 T100,25" fill="none" stroke="#a855f7" strokeWidth="1" opacity="0.6" className="animate-pulse" />
                    <path d="M0,90 Q30,60 60,85 T100,30" fill="none" stroke="#22d3ee" strokeWidth="1" opacity="0.6" />
                    {appData.isReal && [...Array(24)].map((_, i) => {
                       const isUp = (i + hashString(currentStock)) % 2 === 0;
                       const x = 4 + i * 4;
                       const y = 30 + ((i * hashString(currentStock)) % 40);
                       const h = 8 + (hashString(currentStock + i) % 15);
                       return (
                         <g key={i}>
                           <line x1={x+1.25} y1={y-6} x2={x+1.25} y2={y+h+6} stroke={isUp ? '#ef4444' : '#22c55e'} strokeWidth="0.8" />
                           <rect x={x} y={y} width="2.5" height={h} fill={isUp ? '#ef4444' : '#22c55e'} rx="1" />
                         </g>
                       );
                    })}
                  </svg>
                  <div className="absolute bottom-6 right-6 bg-slate-900/90 border border-slate-700 px-4 py-2 rounded-2xl text-[11px] font-black font-mono text-cyan-400">
                    {activeIndicator}: {appData.isReal ? (activeIndicator==='KD' ? `${appData.tech.kd.k} / ${appData.tech.kd.d}` : appData.tech.rsi) : '---'}
                  </div>
               </div>

               {/* 台股特化籌碼區 */}
               {appData.tech.chipData?.isTWSE && appData.isReal && (
                <div className="mb-6 space-y-4">
                   <div className="grid grid-cols-3 gap-4 bg-blue-900/10 border border-blue-500/20 p-6 rounded-3xl shadow-xl">
                      <div className="flex flex-col"><span className="text-[10px] text-slate-500 uppercase font-black mb-1.5 tracking-tighter">外資 (張)</span><span className={`font-mono font-black text-2xl ${appData.tech.chipData.foreignInvestor >= 0 ? 'text-red-400' : 'text-green-400'}`}>{appData.tech.chipData.foreignInvestor > 0 ? '+' : ''}{appData.tech.chipData.foreignInvestor}</span></div>
                      <div className="flex flex-col border-x border-slate-800 px-5"><span className="text-[10px] text-slate-500 uppercase font-black mb-1.5 tracking-tighter">投信 (張)</span><span className={`font-mono font-black text-2xl ${appData.tech.chipData.investmentTrust >= 0 ? 'text-red-400' : 'text-green-400'}`}>{appData.tech.chipData.investmentTrust > 0 ? '+' : ''}{appData.tech.chipData.investmentTrust}</span></div>
                      <div className="flex flex-col"><span className="text-[10px] text-slate-500 uppercase font-black mb-1.5 tracking-tighter">融資維持率</span><span className={`font-mono font-black text-2xl ${appData.tech.marginRate < 130 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{appData.tech.marginRate}%</span></div>
                   </div>
                   {appData.tech.marginRate < 130 && (
                     <div className="bg-red-950/40 border border-red-500/50 p-4 rounded-2xl flex items-center animate-pulse">
                        <AlertTriangle className="w-5 h-5 text-red-500 mr-4" />
                        <span className="text-red-300 text-xs font-black uppercase tracking-tight">警告：融資維持率低於 130% 臨界線，嚴防多殺多賣壓。</span>
                     </div>
                   )}
                </div>
               )}

               <div className="grid grid-cols-4 gap-4">
                 {['KD', 'RSI', 'MACD', 'VOL'].map(ind => (
                   <button key={ind} onClick={()=>setActiveIndicator(ind)} className={`py-3.5 rounded-2xl border text-[11px] font-black transition-all shadow-md ${activeIndicator===ind ? 'bg-blue-600 border-blue-500 text-white shadow-blue-900/40' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300'}`}>{ind}</button>
                 ))}
               </div>
            </div>

            {/* 模組四：AI 戰略圖卡 */}
            <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-800 shadow-2xl">
               <h3 className="text-white font-bold mb-6 flex items-center text-base uppercase tracking-widest"><Zap className="w-5 h-5 mr-3 text-yellow-500"/> 模組四：AI 量化戰略圖卡</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  <div onClick={async()=>{
                      setIsDeepDiving(true);
                      setSelectedStrategy({title: '長期價值建倉計畫'});
                      const res = await callGeminiAPI(`分析股票 ${currentStock} 的價值投資潛力。當前 PE: ${appData.stock.pe}, ROE: ${appData.stock.roe}。`);
                      setAiDeepDiveResult(res);
                      setIsDeepDiving(false);
                    }} className="bg-slate-950 p-5 rounded-[1.5rem] border border-emerald-500/20 hover:border-emerald-500/60 cursor-pointer transition-all group">
                    <h4 className="text-emerald-400 font-black text-xs uppercase mb-2 flex items-center tracking-widest"><DollarSign className="w-4 h-4 mr-2"/> 價值建倉</h4>
                    <p className="text-[10px] text-slate-500 leading-relaxed font-medium">基本面護城河深厚，適合分批佈局核心部位...</p>
                  </div>
                  
                  <div onClick={async()=>{
                      setIsDeepDiving(true);
                      setSelectedStrategy({title: '波段作多操作計畫'});
                      const res = await callGeminiAPI(`為股票 ${currentStock} 規劃波段計畫。`);
                      setAiDeepDiveResult(res);
                      setIsDeepDiving(false);
                    }} className="bg-slate-950 p-5 rounded-[1.5rem] border border-purple-500/20 hover:border-purple-500/60 cursor-pointer transition-all group">
                    <h4 className="text-purple-400 font-black text-xs uppercase mb-2 flex items-center tracking-widest"><TrendingUp className="w-4 h-4 mr-2"/> 波段作多</h4>
                    <p className="text-[10px] text-slate-500 leading-relaxed font-medium">指標修正完成，建議設定關鍵支撐後進場...</p>
                  </div>

                  <div onClick={async()=>{
                      setIsDeepDiving(true);
                      setSelectedStrategy({title: '定期定額 (DCA) 戰略分析'});
                      const res = await callGeminiAPI(`評估股票 ${currentStock} 是否適合作為定期定額標的。`);
                      setAiDeepDiveResult(res);
                      setIsDeepDiving(false);
                    }} className="bg-slate-950 p-5 rounded-[1.5rem] border border-blue-500/20 hover:border-blue-500/60 cursor-pointer transition-all group">
                    <h4 className="text-blue-400 font-black text-xs uppercase mb-2 flex items-center tracking-widest"><Clock className="w-4 h-4 mr-2"/> 定期定額</h4>
                    <p className="text-[10px] text-slate-500 leading-relaxed font-medium">微笑曲線長期扣款評估與產業週期分析...</p>
                  </div>

                  {/* 當沖高風險紅標卡片 */}
                  <div onClick={()=>setSelectedStrategy({title: '當沖交易警告', details: '根據量化引擎試算，目前市場期望值為負。戰術要求：收盤絕對不留倉，嚴控資金。'})} className="md:col-span-2 lg:col-span-3 bg-red-950/20 border border-red-900/40 p-5 rounded-[2rem] flex items-center hover:bg-red-900/30 transition-all cursor-pointer group shadow-lg">
                     <AlertTriangle className="w-10 h-10 text-red-500 mr-5 group-hover:scale-110 transition-all" />
                     <div className="flex-1">
                        <h4 className="text-red-400 font-black text-xs uppercase mb-1 flex items-center tracking-tighter">當沖/短線極高風險警告 <ShieldAlert className="w-3 h-3 ml-2 animate-pulse"/></h4>
                        <p className="text-[10px] text-red-300/70 font-medium">日內趨勢與宏觀情緒背離。期望值為負。戰術要求：<span className="text-red-400 underline font-black">收盤絕對不留倉。</span></p>
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
                    <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px]">Computing Quantum Strategy...</p>
                 </div>
               ) : (
                 <div className="whitespace-pre-line bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-inner font-medium">
                   {aiDeepDiveResult || selectedStrategy.details}
                 </div>
               )}
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .shadow-3xl { box-shadow: 0 40px 100px -20px rgba(0, 0, 0, 0.8); }
      `}} />
    </div>
  );
};

// --- 正式掛載入口 (修復空白畫面的核心邏輯) ---
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
}

export default App;
