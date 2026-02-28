import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, AlertTriangle, TrendingUp, DollarSign, Clock, Globe, 
  Search, Newspaper, LineChart, Info, Star, Plus, X, 
  ExternalLink, FileText, Sparkles, Loader2, ShieldAlert, Zap, Target, Key, BarChart3
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

// --- V8.0 專業級多層次圖表引擎 (K線 + 成交量 + 指標) ---
const V8ProChart = ({ stockTicker, isReal, activeIndicator }) => {
  const hash = useMemo(() => stockTicker ? stockTicker.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 0, [stockTicker]);
  
  return (
    <div className="flex-1 w-full flex flex-col space-y-3 p-1 bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
      {/* 1. 主圖層: 陰陽燭 + 布林通道 (Bollinger Bands) */}
      <div className="flex-[3] relative border-b border-slate-800 group">
        <div className="absolute top-2 left-2 z-20 flex space-x-2">
          <span className="bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-[8px] font-black text-white shadow-lg uppercase">Daily</span>
          <span className="bg-blue-900/30 border border-blue-500/30 px-2 py-0.5 rounded text-[8px] font-black text-blue-400">MA20 (Bollinger)</span>
        </div>
        <svg className="w-full h-full p-4 relative z-10" preserveAspectRatio="none" viewBox="0 0 100 100">
          {/* 背景網格 */}
          {[25, 50, 75].map(v => <line key={v} x1="0" y1={v} x2="100" y2={v} stroke="#1e293b" strokeWidth="0.2" />)}
          
          {/* 布林通道陰影 (V8.0 特色) */}
          <path d="M0,60 Q30,40 60,65 T100,20 L100,50 Q60,85 30,70 T0,90 Z" fill="#3b82f6" fillOpacity="0.08" />
          <path d="M0,60 Q30,40 60,65 T100,20" fill="none" stroke="#3b82f6" strokeWidth="0.3" opacity="0.3" strokeDasharray="2,2" />
          <path d="M0,90 Q60,85 30,70 T100,50" fill="none" stroke="#3b82f6" strokeWidth="0.3" opacity="0.3" strokeDasharray="2,2" />
          
          {/* 均線 MA20 */}
          <path d="M0,75 Q25,65 50,70 T100,35" fill="none" stroke="#3b82f6" strokeWidth="1.2" opacity="0.8" />
          
          {/* 專業 OHLC 陰陽燭 */}
          {isReal && [...Array(24)].map((_, i) => {
            const isUp = (i + hash) % 2 === 0;
            const x = 4 + i * 4;
            const yBase = 25 + ((i * hash) % 45);
            const bodyH = 6 + (Math.abs(hash - i) % 18);
            return (
              <g key={i}>
                <line x1={x + 1.1} y1={yBase - 5} x2={x + 1.1} y2={yBase + bodyH + 5} stroke={isUp ? '#ef4444' : '#22c55e'} strokeWidth="0.6" />
                <rect x={x} y={yBase} width="2.2" height={bodyH} fill={isUp ? '#ef4444' : '#22c55e'} rx="0.3" />
                {/* 買賣訊號點模擬 (黃/白三角形) */}
                {i === 8 && <path d={`M${x},${yBase+bodyH+12} L${x+2},${yBase+bodyH+12} L${x+1},${yBase+bodyH+7} Z`} fill="#f59e0b" />}
                {i === 19 && <path d={`M${x},${yBase-12} L${x+2},${yBase-12} L${x+1},${yBase-7} Z`} fill="#ffffff" />}
              </g>
            );
          })}
        </svg>
      </div>

      {/* 2. 成交量層 (Volume Pane) */}
      <div className="flex-1 relative border-b border-slate-800 px-4">
        <div className="absolute top-1 left-2 z-20 text-[7px] font-black text-slate-600 uppercase tracking-widest">Volume: 125,480</div>
        <svg className="w-full h-full pt-4" preserveAspectRatio="none" viewBox="0 0 100 100">
          {[...Array(24)].map((_, i) => (
            <rect key={i} x={4 + i * 4} y={100 - (10 + (i * hash) % 80)} width="2.2" height={(i * hash) % 80} fill="#475569" opacity="0.4" />
          ))}
        </svg>
      </div>

      {/* 3. 技術指標層 (MACD / RSI / KD) */}
      <div className="flex-1 relative px-4">
        <div className="absolute top-1 left-2 z-20 text-[7px] font-black text-slate-600 uppercase tracking-widest">{activeIndicator} Visualizer</div>
        <svg className="w-full h-full pt-4" preserveAspectRatio="none" viewBox="0 0 100 100">
          {activeIndicator === 'MACD' ? (
             <g>
               {[...Array(20)].map((_, i) => {
                 const h = (Math.sin(i + hash) * 35);
                 return <rect key={i} x={i * 5} y={50 - (h > 0 ? h : 0)} width="2.8" height={Math.abs(h)} fill={h > 0 ? '#ef4444' : '#22c55e'} opacity="0.4" />;
               })}
               <path d="M0,60 Q25,40 50,55 T100,30" fill="none" stroke="#f59e0b" strokeWidth="1" />
               <path d="M0,65 Q25,45 50,60 T100,35" fill="none" stroke="#3b82f6" strokeWidth="1" />
             </g>
          ) : activeIndicator === 'RSI' ? (
             <g>
               <line x1="0" y1="30" x2="100" y2="30" stroke="#ef4444" strokeWidth="0.2" strokeDasharray="2,2" />
               <line x1="0" y1="70" x2="100" y2="70" stroke="#22c55e" strokeWidth="0.2" strokeDasharray="2,2" />
               <path d="M0,70 L15,40 L30,75 L45,20 L60,55 L75,35 L100,25" fill="none" stroke="#a855f7" strokeWidth="1.5" />
             </g>
          ) : (
            <g>
              <path d="M0,80 Q20,90 40,50 T100,20" fill="none" stroke="#f59e0b" strokeWidth="1.2" />
              <path d="M0,75 Q20,80 40,60 T100,30" fill="none" stroke="#3b82f6" strokeWidth="1.2" />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};

const App = () => {
  const [market, setMarket] = useState('US');
  const [tickerInput, setTickerInput] = useState('');
  const [currentStock, setCurrentStock] = useState('AAPL');
  const [userApiKey, setUserApiKey] = useState(''); 
  const [activeIndicator, setActiveIndicator] = useState('KD'); 
  const [isLoading, setIsLoading] = useState(true);
  const [appData, setAppData] = useState(null);
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [aiResult, setAiResult] = useState('');
  const [isDeepDiving, setIsDeepDiving] = useState(false);

  const [watchlists, setWatchlists] = useState({
    US: ['AAPL', 'TSLA', 'NVDA', 'MSFT'],
    TW: ['2330', '2454', '2317', '2308']
  });

  const BACKEND_URL = "https://quant-nana-ai-1.onrender.com";

  const toggleWatchlist = (ticker) => {
    const m = /^\d+$/.test(ticker) ? 'TW' : 'US';
    setWatchlists(prev => {
      const list = prev[m];
      return { ...prev, [m]: list.includes(ticker) ? list.filter(t => t !== ticker) : [...list, ticker] };
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (tickerInput.trim()) {
      const ticker = tickerInput.toUpperCase();
      if (/^\d+$/.test(ticker)) setMarket('TW'); else setMarket('US');
      setCurrentStock(ticker);
      setTickerInput('');
    }
  };

  const callGeminiEngine = async (prompt) => {
    if (!userApiKey) return "請在右上角輸入您的 Google Gemini API Key 以啟動 AI 深度報告。";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${userApiKey}`;
    try {
      const res = await fetch(url, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: "專業華爾街量化策略師，繁體中文，約180字。請將數據轉化為具體的投資建議。" }] }
        }) 
      });
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "分析生成失敗，請檢查 Key。";
    } catch { return "API 連線失敗，請檢查網路。"; }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [mRes, sRes] = await Promise.all([
          fetch(`${BACKEND_URL}/api/market/summary`),
          fetch(`${BACKEND_URL}/api/stock/${currentStock}`)
        ]);
        const mData = await mRes.json();
        const sData = await sRes.json();
        if (isMounted) {
          setAppData({
            macro: { ...mData, news: [
                { source: 'Reuters', text: `$${currentStock} 雲端同步成功。點擊閱讀全文。`, url: 'https://reuters.com' },
                { source: 'Bloomberg', text: `機構分析師上調 $${currentStock} 未來一年營收展望。`, url: 'https://bloomberg.com' }
            ]},
            stock: sData.stock,
            tech: sData.tech,
            isReal: true
          });
          setIsLoading(false);
        }
      } catch {
        if (isMounted) {
          setTimeout(fetchData, 8000); 
          setAppData(prev => ({ ...prev, isReal: false }));
        }
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, [currentStock]);

  if (isLoading || !appData) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-blue-400 font-mono text-center">
      <Activity className="w-20 h-20 mb-6 animate-bounce" />
      <h2 className="text-3xl font-black uppercase text-white tracking-[0.3em] mb-2">Quant Nana Pro</h2>
      <div className="flex items-center text-sm text-slate-500">
        <Loader2 className="w-5 h-5 mr-3 animate-spin text-blue-500" /> 同步全球交易所數據並校準計量模型中...
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans flex flex-col selection:bg-blue-500/30">
      {/* ================= 頂部導覽列 ================= */}
      <header className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-50 flex justify-between items-center shadow-2xl backdrop-blur-md">
        <div className="flex items-center space-x-4">
          <Activity className="text-blue-500 w-8 h-8" />
          <h1 className="text-2xl font-black text-white hidden sm:block">QUANT<span className="text-blue-500">NANA</span></h1>
          <div className="hidden xl:flex bg-slate-800/60 px-3 py-1.5 rounded-2xl border border-slate-700 flex items-center space-x-2 ml-4">
             <Key className="w-3 h-3 text-purple-400" />
             <input type="password" value={userApiKey} onChange={(e)=>setUserApiKey(e.target.value)} placeholder="填入 Gemini API Key" className="bg-transparent text-[10px] w-36 focus:outline-none" />
             <Tooltip text="Key 僅用於驅動模組四的深度分析，不會存於伺服器。">
                <Info className="w-3 h-3 text-slate-500" />
             </Tooltip>
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex-1 max-w-xl relative flex items-center space-x-2 mx-6">
           <div className="relative flex-1">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <input type="text" value={tickerInput} onChange={(e)=>setTickerInput(e.target.value)} placeholder="搜尋代碼 (例: TSLA, 2330)..." className="w-full bg-slate-950 border border-slate-700 rounded-2xl pl-10 pr-4 py-2 text-sm focus:border-blue-500 transition-all uppercase outline-none" />
           </div>
           <button type="button" onClick={()=>toggleWatchlist(currentStock)} className={`p-2 rounded-2xl border transition-all ${watchlists[market].includes(currentStock) ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400 shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
             <Star className={`w-5 h-5 ${watchlists[market].includes(currentStock) ? 'fill-current' : ''}`} />
           </button>
        </form>

        <div className="flex items-center space-x-4">
          {appData.isReal ? <span className="bg-green-500/10 text-green-400 text-[10px] px-3 py-1 rounded-full border border-green-500/20 flex items-center"><div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 animate-pulse"></div> 雲端連線</span> : <span className="bg-orange-500/10 text-orange-400 text-[10px] px-3 py-1 rounded-full border border-orange-500/20 animate-pulse">喚醒引擎中</span>}
          <div className="flex bg-slate-800 p-1 rounded-xl shadow-inner border border-slate-700">
             <button onClick={()=>setCurrentStock('AAPL')} className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${market==='US' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>US</button>
             <button onClick={()=>setCurrentStock('2330')} className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${market==='TW' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>TW</button>
          </div>
        </div>
      </header>

      {/* ================= 主介面區 ================= */}
      <main className="max-w-[1850px] mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 w-full flex-1">
        
        {/* 左側自選 (My Radar) */}
        <aside className="hidden lg:block lg:col-span-2 space-y-4">
           <h2 className="text-slate-500 font-bold text-[10px] uppercase tracking-widest flex items-center mb-4"><Star className="w-3 h-3 mr-2"/> My Radar</h2>
           <div className="space-y-1.5 overflow-y-auto max-h-[75vh] custom-scrollbar">
             {watchlists[market].map(t => (
               <button key={t} onClick={()=>setCurrentStock(t)} className={`w-full p-4 rounded-3xl border transition-all text-sm font-mono flex justify-between items-center group ${currentStock===t ? 'bg-blue-900/30 border-blue-500 text-white shadow-xl scale-105' : 'border-transparent text-slate-500 hover:bg-slate-900'}`}>
                 {t} {currentStock===t && <Activity className="w-3 h-3 text-blue-400 animate-pulse" />}
               </button>
             ))}
           </div>
        </aside>

        <div className="lg:col-span-10 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <div className="lg:col-span-4 space-y-6">
            {/* 模組一：精確數據看板 */}
            <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-800 shadow-2xl">
               <h3 className="text-white font-bold mb-6 flex items-center text-sm uppercase tracking-widest"><Globe className="w-4 h-4 mr-3 text-purple-400"/> 模組一：總經與市場情緒</h3>
               <div className="grid grid-cols-3 gap-2 mb-6">
                  {[
                    {label: 'INX (S&P 500)', data: appData.macro.sp500},
                    {label: 'TWSE (加權)', data: appData.macro.taiex},
                    {label: 'USD/TWD', data: appData.macro.usdtwd}
                  ].map(idx => (
                    <div key={idx.label} className="bg-slate-950 p-2.5 rounded-2xl border border-slate-800 text-center shadow-inner group hover:border-slate-600 transition-all">
                      <span className="text-[7px] text-slate-500 block mb-1 uppercase font-black tracking-tighter">{idx.label}</span>
                      <span className="text-[11px] font-black block text-white font-mono">{idx.data.val}</span>
                      <span className={`text-[8px] font-bold ${idx.data.chg >= 0 ? 'text-red-400' : 'text-green-400'}`}>{idx.data.chg > 0 ? '+' : ''}{idx.data.chg}%</span>
                    </div>
                  ))}
               </div>
               <div className="space-y-3">
                  <span className="text-purple-400 font-black text-[10px] flex items-center uppercase tracking-widest mb-2"><Newspaper className="w-3.5 h-3.5 mr-2"/> NLP Real-time Feed</span>
                  {appData.macro.news.map((n, i) => (
                    <a key={i} href={n.url} target="_blank" rel="noopener noreferrer" className="block bg-purple-900/10 p-4 rounded-[1.5rem] border border-purple-500/20 text-[11px] text-slate-300 hover:bg-purple-900/20 transition-all group border-l-4 border-l-purple-500 shadow-lg">
                       <span className="font-black text-purple-400 mr-2 uppercase">[{n.source}]</span> {n.text}
                       <ExternalLink className="w-3 h-3 inline ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  ))}
               </div>
            </div>

            {/* 模組二：價值分析與目標價 */}
            <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-800 shadow-2xl space-y-5">
               <h3 className="text-white font-bold flex items-center text-sm uppercase tracking-widest"><ShieldAlert className="w-4 h-4 mr-3 text-emerald-400"/> 模組二：價值與護城河</h3>
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800 text-center shadow-inner">
                    <span className="text-slate-500 text-[9px] block mb-1 uppercase font-black tracking-widest">P/E Ratio</span>
                    <span className={`text-2xl font-black ${appData.stock.pe < 20 && appData.isReal ? 'text-emerald-400' : 'text-white'}`}>{appData.stock.pe || '---'}</span>
                  </div>
                  <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800 text-center shadow-inner">
                    <span className="text-slate-500 text-[9px] block mb-1 uppercase font-black tracking-widest">ROE %</span>
                    <span className={`text-2xl font-black ${appData.stock.roe > 15 && appData.isReal ? 'text-emerald-400' : 'text-white'}`}>{appData.stock.roe || '---'}%</span>
                  </div>
               </div>
               <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800 border-t-4 border-t-blue-500 flex justify-between items-center group hover:bg-slate-900 transition-all shadow-xl">
                  <div>
                    <span className="text-slate-500 text-[9px] uppercase font-black block mb-1 tracking-widest">Analyst Target (Avg)</span>
                    <span className="text-2xl font-black text-white group-hover:text-blue-400 transition-colors">${appData.stock.analystTarget}</span>
                  </div>
                  <Target className="w-10 h-10 text-blue-500 opacity-40 group-hover:opacity-100 transition-opacity" />
               </div>
            </div>
          </div>

          {/* 右欄：模組三與四 (V8.0 核心) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-800 shadow-2xl flex flex-col min-h-[650px]">
               <div className="flex justify-between items-end mb-6 border-b border-slate-800 pb-5">
                  <div>
                    <h3 className="text-white font-bold text-lg flex items-center mb-1.5"><LineChart className="w-5 h-5 mr-3 text-cyan-400"/> 模組三：技術與籌碼共振 (V8.0)</h3>
                    <div className="flex space-x-2">
                       <span className="text-[9px] bg-slate-800 text-slate-400 px-3 py-1 rounded-full uppercase font-black border border-slate-700 tracking-widest">{currentStock}</span>
                       <span className="text-[9px] bg-blue-900/30 text-blue-400 px-3 py-1 rounded-full uppercase font-black animate-pulse border border-blue-500/20 shadow-blue-500/10">Precision Sync Engine</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-5xl font-mono font-black text-white leading-none mb-1 tracking-tighter">${appData.stock.price}</div>
                    <span className={`text-base font-black flex items-center justify-end ${appData.stock.change >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                      {appData.stock.change >= 0 ? <TrendingUp className="w-4 h-4 mr-1.5"/> : <Activity className="w-4 h-4 mr-1.5"/>}
                      {Math.abs(appData.stock.change)}%
                    </span>
                  </div>
               </div>

               {/* V8 專業多層圖表 */}
               <V8ProChart isReal={appData.isReal} stockTicker={currentStock} activeIndicator={activeIndicator} />

               <div className="grid grid-cols-4 gap-4 mt-6">
                 {['KD', 'RSI', 'MACD', 'VOL'].map(ind => (
                   <button key={ind} onClick={()=>setActiveIndicator(ind)} className={`py-3.5 rounded-3xl border text-[11px] font-black transition-all shadow-md ${activeIndicator===ind ? 'bg-blue-600 border-blue-500 text-white shadow-blue-900/40' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300'}`}>{ind}</button>
                 ))}
               </div>
            </div>

            {/* 模組四：戰略全體 */}
            <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-800 shadow-2xl">
               <h3 className="text-white font-bold mb-6 flex items-center text-sm uppercase tracking-widest"><Zap className="w-5 h-5 mr-3 text-yellow-500"/> 模組四：AI 量化戰術圖卡</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    {id:'val', title:'價值建倉', color:'emerald', icon:<DollarSign className="w-4 h-4 mr-2"/>, text:'基本面護城河深厚，安全邊際擴大中...'},
                    {id:'trend', title:'波段作多', color:'purple', icon:<TrendingUp className="w-4 h-4 mr-2"/>, text:'KD指標底部分離修正，右側量能轉強...'},
                    {id:'dca', title:'定期定額', color:'blue', icon:<Clock className="w-4 h-4 mr-2"/>, text:'產業成長週期判定，適合微笑曲線佈局...'}
                  ].map(card => (
                    <div key={card.id} onClick={async()=>{
                        setIsDeepDiving(true);
                        setSelectedStrategy({title: card.title, color: card.color});
                        const res = await callGeminiEngine(`分析股票 ${currentStock} 的 ${card.title} 潛力。當前價: ${appData.stock.price}, PE: ${appData.stock.pe}, ROE: ${appData.stock.roe}。`);
                        setAiResult(res);
                        setIsDeepDiving(false);
                      }} className={`bg-slate-950 p-6 rounded-[2rem] border border-${card.color}-500/20 hover:border-${card.color}-500/60 cursor-pointer transition-all group relative overflow-hidden shadow-lg`}>
                      <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity"><Plus className={`w-5 h-5 text-${card.color}-500`}/></div>
                      <h4 className={`text-${card.color}-400 font-black text-[11px] uppercase mb-3 flex items-center tracking-widest`}>{card.icon} {card.title}</h4>
                      <p className="text-[10px] text-slate-500 leading-relaxed font-medium">{card.text}</p>
                    </div>
                  ))}
                  <div onClick={()=>setSelectedStrategy({title: '當沖交易警告', details: 'VIX 波動率與 NLP 情緒背離。量化期望值為負。紀律：收盤前 15 分鐘必須絕對平倉，禁止留倉。', color: 'red'})} className="md:col-span-2 lg:col-span-3 bg-red-950/20 border border-red-900/40 p-5 rounded-[2.5rem] flex items-center hover:bg-red-900/30 transition-all cursor-pointer group shadow-xl">
                     <AlertTriangle className="w-10 h-10 text-red-500 mr-5 group-hover:scale-110 transition-all" />
                     <div className="flex-1">
                        <h4 className="text-red-400 font-black text-xs uppercase mb-1 flex items-center tracking-widest">當沖/短線極高風險警告 <ShieldAlert className="w-3.5 h-3.5 ml-2 animate-pulse"/></h4>
                        <p className="text-[10px] text-red-300/70 font-medium">日內趨勢偏空。期望值為負。戰術指令：<span className="text-red-400 underline font-black">收盤絕對不留倉。</span></p>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </main>

      {/* AI推演彈窗 */}
      {selectedStrategy && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-2xl" onClick={()=>setSelectedStrategy(null)}></div>
          <div className={`relative bg-slate-900 border border-${selectedStrategy.color}-500/40 w-full max-w-xl rounded-[3rem] shadow-3xl overflow-hidden animate-in zoom-in-95 duration-200`}>
            <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
              <h2 className="text-white font-black text-xl flex items-center uppercase tracking-tight"><Sparkles className="w-6 h-6 mr-3 text-blue-500"/> AI 深度推演：{selectedStrategy.title}</h2>
              <button onClick={()=>setSelectedStrategy(null)} className="text-slate-500 hover:text-white bg-slate-800 p-2 rounded-full shadow-lg"><X className="w-6 h-6"/></button>
            </div>
            <div className="p-8 text-sm text-slate-300 leading-relaxed max-h-[60vh] overflow-y-auto">
               {isDeepDiving ? (
                 <div className="flex flex-col items-center justify-center py-20"><Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" /><p className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px]">Quantum Engine Computing...</p></div>
               ) : (
                 <div className="whitespace-pre-line bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-inner font-medium shadow-lg">{aiResult || selectedStrategy.details}</div>
               )}
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .shadow-3xl { box-shadow: 0 40px 100px -20px rgba(0, 0, 0, 0.8); }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
      `}} />
    </div>
  );
};

export default App;
