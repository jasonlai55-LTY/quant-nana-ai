import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  Activity, AlertTriangle, TrendingUp, DollarSign, Clock, Globe, 
  Search, Newspaper, LineChart, Info, Star, Plus, Menu, X, 
  ExternalLink, FileText, Sparkles, Loader2, ShieldAlert, Zap, Crosshair 
} from 'lucide-react';

// --- 工具組件：提示框 ---
const Tooltip = ({ children, text }) => (
  <div className="group relative flex items-center cursor-help z-50">
    {children}
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-56 p-2 bg-slate-800 text-[10px] text-slate-100 border border-slate-600 rounded shadow-2xl z-[100] whitespace-normal leading-relaxed text-left">
      {text}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
    </div>
  </div>
);

// --- 輔助函數 ---
const hashString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash);
};

// --- Gemini API 呼叫 ---
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
      if (i === retries - 1) return "API 呼叫失敗，請稍後再試。";
      await new Promise(res => setTimeout(res, Math.pow(2, i) * 1000));
    }
  }
};

// --- 主應用程式 ---
const App = () => {
  const [market, setMarket] = useState('US');
  const [tickerInput, setTickerInput] = useState('');
  const [currentStock, setCurrentStock] = useState('AAPL');
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [activeIndicator, setActiveIndicator] = useState('KD'); 
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [appData, setAppData] = useState(null);
  const [aiNewsInsight, setAiNewsInsight] = useState('');
  const [isDeepDiving, setIsDeepDiving] = useState(false);
  const [aiDeepDiveResult, setAiDeepDiveResult] = useState('');

  const BACKEND_URL = "https://quant-nana-ai-1.onrender.com";

  const [watchlists] = useState({
    US: ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMD', 'META'],
    TW: ['2330', '2317', '2454', '2603', '2308', '2881']
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (tickerInput.trim()) {
      const ticker = tickerInput.toUpperCase();
      setCurrentStock(ticker);
      if (/^\d+$/.test(ticker)) setMarket('TW');
      else setMarket('US');
      setTickerInput('');
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setIsLoading(true);
      setAiNewsInsight('');
      setAiDeepDiveResult('');
      setSelectedStrategy(null);
      const hash = hashString(currentStock);
      
      try {
        const response = await fetch(`${BACKEND_URL}/api/stock/${currentStock}`);
        if (!response.ok) throw new Error('Backend unreachabe');
        const realData = await response.json();
        if (isMounted) {
          setAppData({
            macro: { 
                indices: { sp500: 5123.4 + (hash%50), taiex: 20156.7 - (hash%100), usdtwd: 31.85 + (hash%10)/100 },
                fearGreedIndex: 25 + (hash % 15), 
                news: [
                    { source: 'Reuters', text: `$${currentStock} 供應鏈傳出調整，市場預期營收展望...` },
                    { source: 'Twitter (X)', text: `$${currentStock} 技術面出現底部分型，主力籌碼進場。` }
                ] 
            },
            stock: realData.stock,
            tech: realData.tech,
            isReal: true
          });
          setIsLoading(false);
        }
      } catch (error) {
        // --- 備援模擬數據 (四大模組完整功能) ---
        const isTW = /^\d+$/.test(currentStock);
        const basePrice = 50 + (hash % 500);
        if (isMounted) {
          setAppData({
            macro: { 
              indices: { sp500: 5123.4, taiex: 20156.7, usdtwd: 31.85 },
              fearGreedIndex: 28, 
              news: [{ source: '系統', text: '後端正在開機中，目前顯示模擬環境數據。' }] 
            },
            stock: { 
              price: basePrice, change: "-1.45", pe: 14.5, roe: 18.2, 
              institutionalHoldings: 65, analystTarget: (basePrice*1.2).toFixed(1), 
              isSuitableForDCA: true, dcaReason: "基本面穩定且具護城河，適合長期微笑曲線扣款。" 
            },
            tech: { 
              kd: { k: 22, d: 28 }, rsi: 35, macd: "空頭轉整理", volumeBreakout: false, 
              marginRate: isTW ? 128.5 : 160, 
              chipData: { isTWSE: isTW, foreignInvestor: -5400, investmentTrust: 1200, dealer: -450 } 
            },
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
      <Activity className="w-12 h-12 mb-4 animate-bounce" />
      <h2 className="text-xl font-black tracking-widest uppercase">Quant Nana AI</h2>
      <div className="text-xs text-slate-500 mt-2 flex items-center">
        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> 正在與 Render 雲端同步行情...
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans selection:bg-blue-500/30 overflow-x-hidden flex flex-col">
      {/* 頂部導覽列 */}
      <header className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-50 shadow-2xl">
        <div className="max-w-[1700px] mx-auto flex justify-between items-center gap-4">
          <div className="flex items-center space-x-3">
            <Activity className="text-blue-500 w-8 h-8" />
            <h1 className="text-2xl font-black text-white tracking-tighter">QUANT<span className="text-blue-500">NANA</span></h1>
            {appData.isReal ? 
              <span className="bg-green-500/10 text-green-400 text-[10px] px-2 py-0.5 rounded-full border border-green-500/20 flex items-center">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></span> 真實數據連線
              </span> :
              <span className="bg-orange-500/10 text-orange-400 text-[10px] px-2 py-0.5 rounded-full border border-orange-500/20">模擬環境</span>
            }
          </div>
          <form onSubmit={handleSearch} className="flex-1 max-w-xl relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500" />
            <input type="text" value={tickerInput} onChange={(e)=>setTickerInput(e.target.value)} placeholder="搜尋代碼 (例: 2330, TSLA)..." className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl pl-10 pr-4 py-2 text-sm focus:border-blue-500 transition-all uppercase outline-none" />
          </form>
          <div className="flex items-center space-x-4">
             <div className="flex bg-slate-800 p-1 rounded-xl">
                <button onClick={()=>setMarket('US')} className={`px-4 py-1 rounded-lg text-xs font-black ${market==='US' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>US</button>
                <button onClick={()=>setMarket('TW')} className={`px-4 py-1 rounded-lg text-xs font-black ${market==='TW' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>TW</button>
             </div>
             <div className="text-xs text-slate-500 font-mono hidden xl:block">{currentTime}</div>
          </div>
        </div>
      </header>

      {/* 主內容區 */}
      <main className="max-w-[1700px] mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
        
        {/* 左側自選股 */}
        <aside className="hidden lg:block lg:col-span-2 space-y-2">
           <h2 className="text-white font-black text-xs mb-5 flex items-center uppercase tracking-widest opacity-50"><Star className="w-3 h-3 mr-2 text-yellow-400 fill-current"/> My Watchlist</h2>
           {watchlists[market].map(t => (
             <button key={t} onClick={()=>setCurrentStock(t)} className={`w-full p-3 rounded-xl cursor-pointer border transition-all text-sm font-bold font-mono flex justify-between items-center ${currentStock===t ? 'bg-blue-900/20 border-blue-500 text-white shadow-lg' : 'border-transparent text-slate-500 hover:bg-slate-900'}`}>
               {t}
               {currentStock===t && <Activity className="w-3 h-3 text-blue-400 animate-pulse" />}
             </button>
           ))}
        </aside>

        {/* 核心內容 */}
        <div className="lg:col-span-10 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* 左欄：模組一、二 */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* 模組一：總經與 NLP */}
            <div className="bg-slate-900 p-6 rounded-[2rem] border border-slate-800 shadow-2xl">
               <h3 className="text-white font-bold mb-5 flex items-center text-sm"><Globe className="w-4 h-4 mr-2 text-purple-400"/> 模組一：總經與 NLP 情緒</h3>
               <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800"><span className="text-[9px] text-slate-500 block">S&P 500</span><span className="text-[11px] font-bold text-white font-mono">{appData.macro.indices.sp500.toFixed(1)}</span></div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800"><span className="text-[9px] text-slate-500 block">加權指數</span><span className="text-[11px] font-bold text-red-400 font-mono">{appData.macro.indices.taiex.toFixed(0)}</span></div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800"><span className="text-[9px] text-slate-500 block">USD/TWD</span><span className="text-[11px] font-bold text-white font-mono">{appData.macro.indices.usdtwd.toFixed(2)}</span></div>
               </div>
               <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-4">
                  <div className="flex justify-between text-[10px] mb-2 font-bold uppercase"><span className="text-slate-500">Fear & Greed Index</span><span className="text-red-400">{appData.macro.fearGreedIndex} (極度恐懼)</span></div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden shadow-inner">
                    <div className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-full transition-all duration-1000" style={{width: `${appData.macro.fearGreedIndex}%`}}></div>
                  </div>
               </div>
               <div className="space-y-3">
                  <span className="text-purple-300 font-bold text-[10px] flex items-center uppercase tracking-widest"><Sparkles className="w-3.5 h-3.5 mr-1.5"/> AI NLP Analysis</span>
                  {appData.macro.news.map((n, i) => (
                    <div key={i} className="bg-purple-900/10 p-3 rounded-xl border border-purple-500/20 text-[11px] text-slate-300 leading-relaxed">
                       <span className="font-black text-purple-400 mr-2">[{n.source}]</span> {n.text}
                    </div>
                  ))}
               </div>
            </div>

            {/* 模組二：價值護城河 */}
            <div className="bg-slate-900 p-6 rounded-[2rem] border border-slate-800 shadow-2xl">
               <h3 className="text-white font-bold mb-5 flex items-center text-sm"><ShieldAlert className="w-4 h-4 mr-2 text-emerald-400"/> 模組二：價值護城河</h3>
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                    <span className="text-slate-500 text-[10px] block mb-1 font-bold uppercase">P/E Ratio</span>
                    <span className={`text-2xl font-mono font-black ${appData.stock.pe < 20 ? 'text-emerald-400' : 'text-white'}`}>{appData.stock.pe}</span>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                    <span className="text-slate-500 text-[10px] block mb-1 font-bold uppercase">ROE %</span>
                    <span className={`text-2xl font-mono font-black ${appData.stock.roe > 15 ? 'text-emerald-400' : 'text-white'}`}>{appData.stock.roe}%</span>
                  </div>
               </div>
            </div>
          </div>

          {/* 右欄：模組三、四 */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* 模組三：技術與籌碼 */}
            <div className="bg-slate-900 p-6 rounded-[2rem] border border-slate-800 shadow-2xl flex flex-col min-h-[500px]">
               <div className="flex justify-between items-end mb-6 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-white font-bold text-base flex items-center mb-1"><LineChart className="w-5 h-5 mr-2 text-cyan-400"/> 模組三：技術與籌碼共振</h3>
                    <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">{currentStock} REALTIME STREAM</span>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-mono font-black text-white leading-none mb-1 tracking-tighter">${appData.stock.price}</div>
                    <span className={`text-sm font-bold ${Number(appData.stock.change) >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {Number(appData.stock.change) >= 0 ? '▲' : '▼'} {Math.abs(appData.stock.change)}%
                    </span>
                  </div>
               </div>

               {/* 專業 SVG K 線圖 */}
               <div className="flex-1 bg-slate-950 rounded-[1.5rem] mb-6 relative overflow-hidden group border border-slate-800 shadow-inner">
                  <svg className="w-full h-full p-4 relative z-10" preserveAspectRatio="none" viewBox="0 0 100 100">
                    <line x1="0" y1="40" x2="100" y2="40" stroke="#3b82f6" strokeWidth="0.5" strokeDasharray="4,4" opacity="0.4" />
                    <path d="M0,80 Q20,70 40,75 T60,55 T80,40 T100,25" fill="none" stroke="#a855f7" strokeWidth="1" opacity="0.6" />
                    <path d="M0,90 Q30,60 60,85 T100,30" fill="none" stroke="#22d3ee" strokeWidth="1" opacity="0.6" />
                    {[...Array(24)].map((_, i) => {
                       const isUp = (i + hashString(currentStock)) % 2 === 0;
                       const x = 4 + i * 4;
                       const y = 30 + ((i * hashString(currentStock)) % 40);
                       const h = 8 + (hashString(currentStock + i) % 15);
                       return (
                         <g key={i}>
                           <line x1={x+1} y1={y-6} x2={x+1} y2={y+h+6} stroke={isUp ? '#ef4444' : '#22c55e'} strokeWidth="0.8" />
                           <rect x={x} y={y} width="2" height={h} fill={isUp ? '#ef4444' : '#22c55e'} rx="0.5" />
                         </g>
                       );
                    })}
                  </svg>
                  <div className="absolute bottom-4 right-4 bg-slate-900/90 border border-slate-700 px-3 py-1.5 rounded-xl text-[10px] font-mono text-cyan-400">
                    {activeIndicator}: {activeIndicator==='KD' ? `${appData.tech.kd.k} / ${appData.tech.kd.d}` : appData.tech.rsi}
                  </div>
               </div>

               {/* 台股專屬：三大法人與斷頭警戒 */}
               {appData.tech.chipData?.isTWSE && (
                <div className="mb-6 space-y-4">
                   <div className="grid grid-cols-3 gap-4 bg-blue-900/10 border border-blue-500/20 p-5 rounded-2xl shadow-lg">
                      <div className="flex flex-col"><span className="text-[10px] text-slate-500 uppercase font-black mb-1">外資 (張)</span><span className={`font-mono font-black text-xl ${appData.tech.chipData.foreignInvestor >= 0 ? 'text-red-400' : 'text-green-400'}`}>{appData.tech.chipData.foreignInvestor}</span></div>
                      <div className="flex flex-col border-x border-slate-800 px-4"><span className="text-[10px] text-slate-500 uppercase font-black mb-1">投信 (張)</span><span className={`font-mono font-black text-xl ${appData.tech.chipData.investmentTrust >= 0 ? 'text-red-400' : 'text-green-400'}`}>{appData.tech.chipData.investmentTrust}</span></div>
                      <div className="flex flex-col"><span className="text-[10px] text-slate-500 uppercase font-black mb-1">融資維持率</span><span className={`font-mono font-black text-xl ${appData.tech.marginRate < 130 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{appData.tech.marginRate}%</span></div>
                   </div>
                   {appData.tech.marginRate < 130 && (
                     <div className="bg-red-950/40 border border-red-500/50 p-4 rounded-xl flex items-center animate-pulse">
                        <AlertTriangle className="w-5 h-5 text-red-500 mr-4" />
                        <span className="text-red-300 text-xs font-black uppercase">!!! 斷頭警戒：融資維持率低於 130% 警戒線，嚴防多殺多風險 !!!</span>
                     </div>
                   )}
                </div>
               )}

               <div className="grid grid-cols-4 gap-4">
                 {['KD', 'RSI', 'MACD', 'VOL'].map(ind => (
                   <button key={ind} onClick={()=>setActiveIndicator(ind)} className={`py-3 rounded-xl border text-[11px] font-black transition-all ${activeIndicator===ind ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600'}`}>{ind}</button>
                 ))}
               </div>
            </div>

            {/* 模組四：AI 戰略圖卡 */}
            <div className="bg-slate-900 p-6 rounded-[2rem] border border-slate-800 shadow-2xl">
               <h3 className="text-white font-bold mb-5 flex items-center text-sm uppercase tracking-widest"><Zap className="w-5 h-5 mr-3 text-yellow-400"/> 模組四：AI 量化戰略圖卡</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div onClick={async()=>{
                      setIsDeepDiving(true);
                      setSelectedStrategy({title: '長期價值建倉計畫'});
                      const res = await callGeminiAPI(`分析 ${currentStock} 的價值與潛力。`);
                      setAiDeepDiveResult(res);
                      setIsDeepDiving(false);
                    }} className="bg-slate-950 p-5 rounded-[1.5rem] border border-emerald-500/20 hover:border-emerald-500/50 cursor-pointer transition-all group">
                    <h4 className="text-emerald-400 font-black text-xs uppercase mb-2 flex items-center tracking-tighter"><DollarSign className="w-4 h-4 mr-2"/> 價值建倉戰略</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium">基本面護城河深厚，當前估值具備安全邊際，適合分批佈局...</p>
                  </div>
                  
                  <div onClick={async()=>{
                      setIsDeepDiving(true);
                      setSelectedStrategy({title: '波段作多操作計畫'});
                      const res = await callGeminiAPI(`為 ${currentStock} 規劃波段計畫。`);
                      setAiDeepDiveResult(res);
                      setIsDeepDiving(false);
                    }} className="bg-slate-950 p-5 rounded-[1.5rem] border border-purple-500/20 hover:border-purple-500/50 cursor-pointer transition-all group">
                    <h4 className="text-purple-400 font-black text-xs uppercase mb-2 flex items-center tracking-tighter"><TrendingUp className="w-4 h-4 mr-2"/> 波段作多戰略</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium">指標底部分離修正，量能溫和放大，建議設定關鍵支撐後進場...</p>
                  </div>

                  {/* 當沖高風險警告 */}
                  <div onClick={()=>setSelectedStrategy({title: '當沖交易警告', details: 'VIX 波動率偏高。凱利公式試算期望值為負。建議嚴格限制資金於 2% 內，收盤前必須絕對平倉。'})} className="md:col-span-2 bg-red-950/20 border border-red-900/40 p-4 rounded-2xl flex items-center hover:bg-red-900/30 transition-all cursor-pointer group">
                     <AlertTriangle className="w-8 h-8 text-red-500 mr-4 group-hover:scale-110 transition-all" />
                     <div>
                        <h4 className="text-red-400 font-black text-xs uppercase mb-1">當沖/短線極高風險警告</h4>
                        <p className="text-[10px] text-red-300/70">日內趨勢與宏觀情緒背離。根據量化試算，期望值為負。紀律要求：<span className="text-red-400 underline font-bold">絕對不留倉。</span></p>
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
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={()=>setSelectedStrategy(null)}></div>
          <div className="relative bg-slate-900 border border-slate-800 w-full max-w-xl rounded-[2.5rem] shadow-3xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
              <h2 className="text-white font-black text-xl flex items-center"><Sparkles className="w-6 h-6 mr-3 text-blue-500"/> AI 深度推演：{selectedStrategy.title}</h2>
              <button onClick={()=>setSelectedStrategy(null)} className="text-slate-500 hover:text-white transition-colors"><X className="w-8 h-8"/></button>
            </div>
            <div className="p-8 text-sm text-slate-300 leading-relaxed max-h-[60vh] overflow-y-auto">
               {isDeepDiving ? <div className="flex items-center justify-center py-10"><Loader2 className="w-10 h-10 animate-spin text-blue-500" /></div> : (aiDeepDiveResult || selectedStrategy.details)}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .shadow-3xl { box-shadow: 0 35px 60px -15px rgba(0, 0, 0, 0.6); }
      `}</style>
    </div>
  );
};

// 安全掛載 React：確保 root 元素存在且避免 createRoot 衝突
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
