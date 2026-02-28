import React, { useState, useEffect, useMemo } from 'react';
import { Activity, AlertTriangle, TrendingUp, DollarSign, Clock, Globe, Search, Newspaper, LineChart, Info, MessageCircle, Star, Plus, Menu, X, ExternalLink, FileText, Sparkles, Loader2, ShieldAlert, Zap, Crosshair } from 'lucide-react';

// Tooltip 共用組件
const Tooltip = ({ children, text }) => (
  <div className="group relative flex items-center cursor-help z-50">
    {children}
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-56 p-2 bg-slate-700 text-xs text-slate-100 border border-slate-500 rounded shadow-2xl z-[100] whitespace-normal leading-relaxed text-left">
      {text}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-700"></div>
    </div>
  </div>
);

// 產生假資料的雜湊函數
const hashString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash);
};

// Gemini API 呼叫設定
const apiKey = ""; 

const callGeminiAPI = async (prompt, retries = 5) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: "你是一個專業的華爾街量化分析師與資深操盤手，請用繁體中文回答，語氣專業、簡潔、客觀。不超過150字。" }] }
  };

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "無法生成內容。";
    } catch (error) {
      if (i === retries - 1) return "API 呼叫失敗，請稍後再試。";
      await new Promise(res => setTimeout(res, Math.pow(2, i) * 1000));
    }
  }
};

const App = () => {
  // 核心狀態
  const [market, setMarket] = useState('US');
  const [tickerInput, setTickerInput] = useState('');
  const [currentStock, setCurrentStock] = useState('AAPL');
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [activeIndicator, setActiveIndicator] = useState('KD'); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [appData, setAppData] = useState(null);

  const [isAnalyzingNews, setIsAnalyzingNews] = useState(false);
  const [aiNewsInsight, setAiNewsInsight] = useState('');
  const [isDeepDiving, setIsDeepDiving] = useState(false);
  const [aiDeepDiveResult, setAiDeepDiveResult] = useState('');

  const [watchlists, setWatchlists] = useState({
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
      // 自動判斷並切換市場標籤
      if (/^\d+$/.test(ticker)) setMarket('TW');
      else setMarket('US');
      setTickerInput('');
    }
  };

  const toggleWatchlist = (ticker) => {
    setWatchlists(prev => {
      const currentList = prev[market];
      if (currentList.includes(ticker)) return { ...prev, [market]: currentList.filter(t => t !== ticker) };
      return { ...prev, [market]: [...currentList, ticker] };
    });
  };

  const isInWatchlist = watchlists[market].includes(currentStock);

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      setIsLoading(true);
      setAiNewsInsight('');
      setAiDeepDiveResult('');
      setSelectedStrategy(null);

      const hash = hashString(currentStock);
      const isPositive = ((hash % 100) - 50) >= 0;
      
      const macroFallback = {
        indices: {
          sp500: { value: 5123.45 + (hash%50), change: '+0.85%' },
          taiex: { value: 20156.78 - (hash%100), change: '-0.32%' },
          usdtwd: { value: 31.85 + (hash%10)/100, change: '+0.05' }
        },
        fearGreedIndex: 22 + (hash % 10),
        cpiYoy: 3.1,
        nfp: 275,
        vix: 15 + (hash % 20),
        nlpSentiment: ((hash % 200) - 100),
        newsVolume: 1000 + (hash % 5000),
        socialMentions: 3000 + (hash % 10000),
        news: [
          { source: 'Reuters', text: `$${currentStock} 供應鏈傳出調整，機構預期Q3營收受影響...`, sentiment: isPositive ? 'positive' : 'negative', url: '#' },
          { source: 'Twitter (X)', text: `$${currentStock} 技術面突破！選擇權大量買盤湧入。`, sentiment: 'positive', url: '#' },
          { source: 'WSJ', text: `聯準會最新利率決策影響，對板塊估值產生壓力。`, sentiment: 'negative', url: '#' }
        ]
      };

      try {
        const response = await fetch(`http://localhost:8000/api/stock/${currentStock}`);
        if (!response.ok) throw new Error('API 尚未啟動或發生錯誤');
        
        const realData = await response.json();
        
        if (isMounted) {
          setAppData({
            macro: macroFallback,
            stock: realData.stock,
            tech: realData.tech,
            isReal: true
          });
          setIsLoading(false);
        }
      } catch (error) {
        console.warn("無法連線至本地 Python 伺服器，已切換至模擬數據模式。");
        const basePrice = 50 + (hash % 500) + (hash % 100) / 100;
        const changePercent = ((hash % 100) - 50) / 10;
        const isSuitableForDCA = (hash % 2 === 0);
        
        // 模擬台股籌碼 Fallback
        const isTW = /^\d+$/.test(currentStock);
        const f_buy = isTW ? (hash % 10000) - 3000 : 0;
        const t_buy = isTW ? (hash % 3000) - 1000 : 0;
        const d_buy = isTW ? (hash % 2000) - 1000 : 0;
        const m_rate = isTW ? 128.5 + (hash % 50) : 160;

        if (isMounted) {
          setAppData({
            macro: macroFallback,
            stock: {
              price: basePrice,
              change: changePercent.toFixed(2),
              pe: 8 + (hash % 30) + (hash % 10)/10,
              roe: 5 + (hash % 30) + (hash % 10)/10,
              institutionalHoldings: 40 + (hash % 50),
              analystTarget: (hash % 4 !== 0) ? (basePrice * (1 + (hash%30)/100)).toFixed(2) : 'N/A',
              isSuitableForDCA: isSuitableForDCA,
              dcaReason: isSuitableForDCA ? "具備高市佔率與穩定現金流，且處於產業S型曲線成長期，適合微笑曲線建倉。" : "該標的屬於高波動/週期性產業，受景氣循環影響劇烈，長期盲目扣款易造成資金運用無效率。"
            },
            tech: {
              kd: { k: 10 + (hash % 80), d: 15 + (hash % 70) },
              rsi: 20 + (hash % 60), 
              macd: isPositive ? '由負轉正' : '高檔死亡交叉',
              volumeBreakout: (hash % 10) > 5, 
              marginRate: m_rate,
              chipData: {
                isTWSE: isTW,
                foreignInvestor: f_buy,
                investmentTrust: t_buy,
                dealer: d_buy,
                totalNetBuy: f_buy + t_buy + d_buy
              }
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

  if (isLoading || !appData) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-blue-400">
        <Activity className="w-12 h-12 mb-4 animate-bounce" />
        <h2 className="text-xl font-bold tracking-widest mb-2">QUANT NANA AI</h2>
        <div className="flex items-center text-sm text-slate-400">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> 正在匯入 {currentStock} 即時行情與計量因子...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans selection:bg-blue-500/30 overflow-x-hidden flex flex-col">
      {/* ================= 頂部導覽列 ================= */}
      <header className="bg-slate-900 border-b border-slate-800 p-3 lg:p-4 sticky top-0 z-50 shadow-md">
        <div className="max-w-[1800px] mx-auto flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center space-x-3">
            <button className="lg:hidden text-slate-400 hover:text-white" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <Activity className="text-blue-500 w-6 h-6 lg:w-7 lg:h-7" />
            <h1 className="text-lg lg:text-xl font-bold text-white tracking-wider hidden sm:block">QUANT <span className="text-blue-500">NANA</span></h1>
            {appData.isReal ? 
              <span className="bg-green-500/10 text-green-400 text-[10px] px-2 py-0.5 rounded border border-green-500/20 flex items-center"><span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse"></span> 真實數據連線中</span> :
              <span className="bg-orange-500/10 text-orange-400 text-[10px] px-2 py-0.5 rounded border border-orange-500/20">預覽模式 (模擬數據)</span>
            }
          </div>
          
          <div className="flex-1 max-w-2xl mx-2 flex items-center space-x-2">
            <form onSubmit={handleSearch} className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text" 
                value={tickerInput}
                onChange={(e) => setTickerInput(e.target.value)}
                placeholder="搜尋代碼 (例: AAPL, 2330)..." 
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg pl-9 pr-4 py-1.5 lg:py-2 text-sm focus:outline-none focus:border-blue-500 transition-all uppercase"
              />
            </form>
            <div className="hidden sm:flex items-center bg-slate-800 rounded-lg px-3 py-1.5 lg:py-2 border border-slate-700">
              <span className="font-bold text-white mr-2">{currentStock}</span>
              <button onClick={() => toggleWatchlist(currentStock)} className={`transition-colors ${isInWatchlist ? 'text-yellow-400' : 'text-slate-500 hover:text-slate-300'}`}>
                <Star className={`w-4 h-4 ${isInWatchlist ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2 lg:space-x-4">
            <div className="flex bg-slate-800 rounded-lg p-1">
              <button onClick={() => {setMarket('US'); setCurrentStock('AAPL');}} className={`px-2 lg:px-3 py-1 rounded text-xs font-medium transition-colors ${market === 'US' ? 'bg-blue-600 text-white shadow' : 'text-slate-400'}`}>US</button>
              <button onClick={() => {setMarket('TW'); setCurrentStock('2330');}} className={`px-2 lg:px-3 py-1 rounded text-xs font-medium transition-colors ${market === 'TW' ? 'bg-blue-600 text-white shadow' : 'text-slate-400'}`}>TW</button>
            </div>
            <div className="hidden md:flex items-center text-xs text-slate-400 font-mono bg-slate-950 px-2 py-1.5 rounded border border-slate-800">
              <Clock className="w-3 h-3 mr-1" /> {currentTime}
            </div>
          </div>
        </div>
      </header>

      {/* 手機版橫向自選股快捷列 */}
      <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-3 py-2 flex items-center overflow-x-auto hide-scrollbar">
        <span className="text-xs font-bold text-slate-400 mr-3 whitespace-nowrap flex items-center"><Star className="w-3 h-3 mr-1"/>自選</span>
        <div className="flex space-x-2">
          {watchlists[market].map(ticker => (
            <button key={ticker} onClick={() => setCurrentStock(ticker)} className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-mono border transition-all ${currentStock === ticker ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
              {ticker}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 p-3 lg:p-4 max-w-[1800px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
        
        <aside className="hidden lg:flex lg:col-span-2 flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg h-[calc(100vh-100px)] sticky top-[80px]">
          <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
            <h2 className="text-white font-bold text-sm flex items-center">
              <Star className="w-4 h-4 mr-1.5 text-yellow-400 fill-current" /> 我的自選 ({market})
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
            {watchlists[market].map(ticker => {
              const isSelected = currentStock === ticker;
              return (
                <div key={ticker} onClick={() => setCurrentStock(ticker)} className={`flex justify-between items-center p-2 rounded cursor-pointer transition-all border ${isSelected ? 'bg-blue-900/30 border-blue-500/50' : 'border-transparent hover:bg-slate-800'}`}>
                  <span className={`font-mono font-bold text-sm ${isSelected ? 'text-white' : 'text-slate-300'}`}>{ticker}</span>
                </div>
              );
            })}
          </div>
        </aside>

        <div className="lg:col-span-10 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
          
          <div className="lg:col-span-4 space-y-4 lg:space-y-5 flex flex-col">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 lg:p-5 shadow-lg flex-1">
              <h2 className="text-white font-bold mb-4 flex items-center text-sm lg:text-base border-b border-slate-800 pb-2">
                <Globe className="w-4 h-4 mr-2 text-purple-400" /> 模組一：總經與 NLP 情緒
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2 text-center text-[10px] lg:text-xs">
                  <div className="bg-slate-950/80 p-1.5 rounded border border-slate-800"><span className="text-slate-500 block mb-0.5">S&P 500</span><span className="text-green-400 font-mono font-bold">{appData.macro.indices.sp500.value.toFixed(2)}</span></div>
                  <div className="bg-slate-950/80 p-1.5 rounded border border-slate-800"><span className="text-slate-500 block mb-0.5">加權指數</span><span className="text-red-400 font-mono font-bold">{appData.macro.indices.taiex.value.toFixed(2)}</span></div>
                  <div className="bg-slate-950/80 p-1.5 rounded border border-slate-800"><span className="text-slate-500 block mb-0.5">USD/TWD</span><span className="text-slate-300 font-mono font-bold">{appData.macro.indices.usdtwd.value.toFixed(3)}</span></div>
                </div>

                <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800/80">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-400">恐懼與貪婪指數</span>
                    <span className="font-bold text-red-400">{appData.macro.fearGreedIndex} (極度恐懼)</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 mb-3 shadow-inner">
                    <div className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-2 rounded-full transition-all" style={{ width: `${appData.macro.fearGreedIndex}%` }}></div>
                  </div>
                </div>

                <div className="bg-purple-950/10 border border-purple-500/20 p-3 rounded-lg flex-1 flex flex-col max-h-[300px]">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-purple-300 flex items-center"><Newspaper className="w-3 h-3 mr-1"/> NLP 文本解析</span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-slate-800 text-slate-300">綜合分數: {appData.macro.nlpSentiment}</span>
                  </div>
                  <div className="mb-2">
                    {!aiNewsInsight && !isAnalyzingNews && (
                      <button onClick={async () => {
                          setIsAnalyzingNews(true);
                          const prompt = `請綜合以下關於 ${currentStock} 的新聞，給出一段簡短總結：\n${appData.macro.news.map(n => n.text).join('\n')}`;
                          const result = await callGeminiAPI(prompt);
                          setAiNewsInsight(result);
                          setIsAnalyzingNews(false);
                        }} className="w-full bg-purple-900/40 text-purple-300 border border-purple-500/30 text-[10px] py-1.5 rounded flex items-center justify-center">
                        <Sparkles className="w-3 h-3 mr-1 text-purple-400" /> ✨ 請求 Gemini 彙整新聞
                      </button>
                    )}
                    {isAnalyzingNews && <div className="text-purple-400 text-[10px] text-center"><Loader2 className="w-3 h-3 inline animate-spin" /> 正在分析...</div>}
                    {aiNewsInsight && <div className="bg-purple-900/30 border border-purple-500/40 p-2 rounded text-[10px] text-purple-200">{aiNewsInsight}</div>}
                  </div>
                  <div className="space-y-2 overflow-y-auto custom-scrollbar pr-1 flex-1">
                    {appData.macro.news.map((item, idx) => (
                      <div key={idx} className="bg-slate-950/80 p-2 rounded border border-slate-800 text-[10px] lg:text-xs">
                        <span className="text-slate-400 font-bold block mb-0.5">{item.source}</span>
                        <p className="text-slate-300">{item.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 lg:p-5 shadow-lg">
              <h2 className="text-white font-bold mb-3 flex items-center text-sm lg:text-base border-b border-slate-800 pb-2">
                <ShieldAlert className="w-4 h-4 mr-2 text-emerald-400" /> 模組二：價值護城河
              </h2>
              <div className="grid grid-cols-2 gap-3 text-xs lg:text-sm">
                <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800">
                  <span className="text-slate-500 mb-1 block">P/E 本益比</span>
                  <span className={`text-xl font-mono font-bold ${appData.stock.pe < 15 ? 'text-emerald-400' : 'text-white'}`}>{appData.stock.pe}</span>
                </div>
                <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800">
                  <span className="text-slate-500 mb-1 block">ROE 股東權益報酬率</span>
                  <span className={`text-xl font-mono font-bold ${appData.stock.roe > 15 ? 'text-emerald-400' : 'text-white'}`}>{appData.stock.roe}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-4 lg:space-y-5 flex flex-col">
            
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 lg:p-5 shadow-lg flex flex-col min-h-[400px]">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-3">
                <h2 className="text-white font-bold flex items-center text-sm lg:text-base">
                  <LineChart className="w-4 h-4 mr-2 text-cyan-400" /> 模組三：技術與籌碼雷達
                </h2>
                <div className="text-right flex items-baseline">
                  <span className="text-2xl lg:text-3xl font-bold text-white font-mono">${Number(appData.stock.price).toFixed(2)}</span>
                  <span className={`text-sm lg:text-base ml-2 font-bold ${appData.stock.change >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {appData.stock.change >= 0 ? '+' : ''}{appData.stock.change}%
                  </span>
                </div>
              </div>

              {/* 主圖區 */}
              <div className="flex-1 bg-slate-950 border border-slate-800 rounded-lg relative overflow-hidden flex flex-col mb-4">
                <div className="flex-1 w-full p-2 lg:p-4 flex items-end relative border-b border-slate-800">
                   <div className="absolute top-2 left-2 flex space-x-2 text-[10px] z-20">
                     <span className="bg-slate-800/80 px-2 py-1 rounded text-white shadow">日線 (D)</span>
                     <span className="bg-slate-800/80 px-2 py-1 rounded text-cyan-400 shadow">MA20</span>
                     <span className="bg-slate-800/80 px-2 py-1 rounded text-purple-400 shadow">MA60</span>
                   </div>
                   <svg className="w-full h-full relative z-10" preserveAspectRatio="none" viewBox="0 0 100 100">
                    <line x1="0" y1="45" x2="100" y2="45" stroke="#3b82f6" strokeWidth="0.5" strokeDasharray="2,2" className="opacity-80" />
                    <path d="M0,80 Q25,70 50,75 T100,50" fill="none" stroke="#a855f7" strokeWidth="1.5" className="opacity-80"/>
                    <path d="M0,90 Q20,60 40,80 T100,30" fill="none" stroke="#22d3ee" strokeWidth="1.5" className="opacity-80"/>
                    
                    {[...Array(20)].map((_, i) => {
                       const isUp = (i + hashString(currentStock)) % 2 === 0;
                       const x = 5 + i * 4.7;
                       const y = 20 + ((i * hashString(currentStock)) % 60);
                       const h = 5 + (hashString(currentStock + i) % 20);
                       return (
                         <g key={i}>
                           <line x1={x+0.75} y1={y-10} x2={x+0.75} y2={y+h+10} stroke={isUp ? '#ef4444' : '#22c55e'} strokeWidth="0.5" opacity="0.8" />
                           <rect x={x} y={y} width="1.5" height={h} fill={isUp ? '#ef4444' : '#22c55e'} />
                         </g>
                       );
                    })}
                  </svg>
                </div>

                {/* 副圖區 */}
                <div className="h-32 p-2 relative flex flex-col bg-slate-900/50">
                  <div className="flex space-x-1 absolute top-2 left-2 z-20">
                    {['Volume', 'MACD', 'KD', 'RSI'].map(ind => (
                      <button 
                        key={ind} onClick={() => setActiveIndicator(ind)} 
                        className={`text-[10px] px-2 py-0.5 rounded transition-colors border font-bold ${activeIndicator === ind ? 'bg-blue-600 border-blue-500 text-white shadow-md' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                      >
                        {ind}
                      </button>
                    ))}
                  </div>
                  
                  <div className="flex-1 mt-6 w-full h-full relative opacity-90">
                    {activeIndicator === 'KD' && (
                      <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                        <line x1="0" y1="20" x2="100" y2="20" stroke="#ef4444" strokeWidth="0.5" strokeDasharray="2,2" />
                        <line x1="0" y1="80" x2="100" y2="80" stroke="#22c55e" strokeWidth="0.5" strokeDasharray="2,2" />
                        <path d={`M0,70 Q10,85 20,60 T40,30 T60,15 T80,40 T100,${100 - appData.tech.kd.k}`} fill="none" stroke="#f59e0b" strokeWidth="1.5" />
                        <path d={`M0,65 Q10,75 20,65 T40,40 T60,25 T80,35 T100,${100 - appData.tech.kd.d}`} fill="none" stroke="#3b82f6" strokeWidth="1.5" />
                      </svg>
                    )}
                    {activeIndicator === 'RSI' && (
                      <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                        <line x1="0" y1="30" x2="100" y2="30" stroke="#ef4444" strokeWidth="0.5" strokeDasharray="2,2" />
                        <line x1="0" y1="70" x2="100" y2="70" stroke="#22c55e" strokeWidth="0.5" strokeDasharray="2,2" />
                        <path d={`M0,60 L20,40 L40,75 L60,35 L80,45 L100,${100 - appData.tech.rsi}`} fill="none" stroke="#a855f7" strokeWidth="1.5" />
                      </svg>
                    )}
                    {activeIndicator === 'MACD' && (
                      <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 -50 100 100">
                        <line x1="0" y1="0" x2="100" y2="0" stroke="#475569" strokeWidth="0.5" strokeDasharray="2,2"/>
                        <rect x="10" y="0" width="4" height="20" fill="#ef4444" opacity="0.6" />
                        <rect x="30" y="0" width="4" height="10" fill="#ef4444" opacity="0.6" />
                        <rect x="50" y="-15" width="4" height="15" fill="#22c55e" opacity="0.6" />
                        <rect x="70" y="-30" width="4" height="30" fill="#22c55e" opacity="0.6" />
                        <rect x="90" y="-40" width="4" height="40" fill="#22c55e" opacity="0.9" />
                        <path d="M0,20 Q20,10 40,0 T80,-30 T100,-40" fill="none" stroke="#f59e0b" strokeWidth="1.5" />
                        <path d="M0,15 Q20,15 40,5 T80,-15 T100,-25" fill="none" stroke="#3b82f6" strokeWidth="1.5" />
                      </svg>
                    )}
                    {activeIndicator === 'Volume' && (
                      <div className="w-full h-full flex items-end justify-between px-2 pb-1 opacity-70">
                         {[...Array(30)].map((_, i) => (
                            <div key={i} className={`w-[2%] mx-[0.5%] bg-slate-600 ${i===28 && appData.tech.volumeBreakout ? 'bg-cyan-400 h-full' : ''}`} style={{ height: `${20 + (Math.sin(i + hashString(currentStock)) * 15 + 15)}%` }}></div>
                         ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 台股專屬籌碼區塊 與 斷頭警示 */}
              {appData.tech.chipData?.isTWSE && (
                <div className="mb-4 grid grid-cols-3 gap-2 bg-blue-950/20 border border-blue-900/50 p-3 rounded-lg text-xs">
                  <div className="col-span-3 text-blue-400 font-bold mb-1 flex items-center border-b border-blue-900/50 pb-1">
                    <Activity className="w-3 h-3 mr-1" /> 台股三大法人買賣超 (張)
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-500">外資</span>
                    <span className={`font-mono font-bold ${appData.tech.chipData.foreignInvestor >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {appData.tech.chipData.foreignInvestor > 0 ? '+' : ''}{appData.tech.chipData.foreignInvestor}
                    </span>
                  </div>
                  <div className="flex flex-col border-l border-r border-blue-900/50 px-2">
                    <span className="text-slate-500">投信</span>
                    <span className={`font-mono font-bold ${appData.tech.chipData.investmentTrust >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {appData.tech.chipData.investmentTrust > 0 ? '+' : ''}{appData.tech.chipData.investmentTrust}
                    </span>
                  </div>
                  <div className="flex flex-col pl-2">
                    <span className="text-slate-500">自營商</span>
                    <span className={`font-mono font-bold ${appData.tech.chipData.dealer >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {appData.tech.chipData.dealer > 0 ? '+' : ''}{appData.tech.chipData.dealer}
                    </span>
                  </div>
                </div>
              )}

              {/* 斷頭警告 (融資維持率 < 130) */}
              {appData.tech.marginRate < 130 && (
                <div className="mb-4 bg-red-950/40 border border-red-500/50 rounded-lg p-2 text-xs flex items-center animate-pulse">
                  <AlertTriangle className="w-4 h-4 text-red-500 mr-2 flex-shrink-0" />
                  <span className="text-red-300">
                    <strong className="text-red-400">融資斷頭警戒：</strong> 
                    目前融資維持率跌至 {appData.tech.marginRate}% (低於130%)，請嚴防多殺多賣壓出籠。
                  </span>
                </div>
              )}

              {/* 常規指標數值 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                 <div className="bg-slate-950 p-2 rounded border border-slate-800">
                   <Tooltip text="隨機指標，由兩條線(K線與D線)組成。">
                     <span className="text-slate-500 block mb-0.5 cursor-help border-b border-dashed border-slate-600">KD 曲線 (9,3,3)</span>
                   </Tooltip>
                   <span className="text-cyan-400 font-mono font-bold">K:{appData.tech.kd.k} D:{appData.tech.kd.d}</span>
                 </div>
                 <div className="bg-slate-950 p-2 rounded border border-slate-800">
                   <span className="text-slate-500 block mb-0.5">RSI (14)</span>
                   <span className={`${appData.tech.rsi < 30 ? 'text-emerald-400' : 'text-slate-300'} font-mono font-bold`}>{appData.tech.rsi}</span>
                 </div>
                 <div className="bg-slate-950 p-2 rounded border border-slate-800">
                   <span className="text-slate-500 block mb-0.5">MACD</span>
                   <span className={`${appData.stock.change >= 0 ? 'text-red-400' : 'text-green-400'} font-bold`}>{appData.tech.macd}</span>
                 </div>
                 <div className="bg-slate-950 p-2 rounded border border-slate-800">
                   <span className="text-slate-500 block mb-0.5">量能</span>
                   <span className="text-cyan-400 font-bold">{appData.tech.volumeBreakout ? '爆量突破' : '量縮整理'}</span>
                 </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 lg:p-5 shadow-lg flex-1">
              <h2 className="text-white font-bold mb-4 flex items-center text-sm lg:text-base border-b border-slate-800 pb-2">
                <Zap className="w-4 h-4 mr-2 text-yellow-400" /> 模組四：AI 戰略圖卡
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* 戰略卡片 1：長線 */}
                <div onClick={() => setSelectedStrategy({title: '長期價值投資戰略', type: '持倉', color: 'emerald', logic: `P/E ${appData.stock.pe} < 15`, details: '依據 Fama-French 模型，估值落入歷史低位...', target: (appData.stock.price * 1.3).toFixed(2), stopLoss: 'N/A' })} className="bg-slate-950/80 border border-emerald-500/30 rounded-xl p-4 flex flex-col justify-between hover:bg-slate-900 cursor-pointer transition-all">
                  <div>
                    <h3 className="font-bold text-white text-sm flex items-center mb-2"><DollarSign className="w-4 h-4 mr-1 text-emerald-400" /> 長期價值投資</h3>
                    <p className="text-[10px] text-slate-400 mb-3 bg-slate-900 p-2 rounded">P/E {appData.stock.pe} &lt; 15</p>
                  </div>
                  <div className="border-t border-slate-800 pt-3 flex justify-between items-end">
                    <span className="text-emerald-400 font-mono text-sm">${(appData.stock.price * 1.3).toFixed(2)}</span>
                  </div>
                </div>

                {/* 戰略卡片 2：波段 */}
                <div onClick={() => setSelectedStrategy({title: '短線波段作多戰略', type: '觀察', color: 'purple', logic: `RSI=${appData.tech.rsi}`, details: '技術指標顯示背離，建議右側交易...', target: (appData.stock.price * 1.15).toFixed(2), stopLoss: (appData.stock.price * 0.92).toFixed(2) })} className="bg-slate-950/80 border border-purple-500/30 rounded-xl p-4 flex flex-col justify-between hover:bg-slate-900 cursor-pointer transition-all">
                  <div>
                    <h3 className="font-bold text-white text-sm flex items-center mb-2"><TrendingUp className="w-4 h-4 mr-1 text-purple-400" /> 短線波段作多</h3>
                    <p className="text-[10px] text-slate-400 mb-3 bg-slate-900 p-2 rounded">RSI={appData.tech.rsi}</p>
                  </div>
                  <div className="border-t border-slate-800 pt-3 flex justify-between items-end">
                    <span className="text-purple-400 font-mono text-sm">${(appData.stock.price * 1.15).toFixed(2)}</span>
                  </div>
                </div>

                {/* 戰略卡片 3：DCA */}
                <div onClick={() => setSelectedStrategy({title: '定期定額 (DCA) 戰略', type: appData.stock.isSuitableForDCA ? '推薦' : '不建議', color: 'blue', logic: 'Beta波動度評估', details: appData.stock.dcaReason, target: '無', stopLoss: '無' })} className="bg-slate-950/80 border border-blue-500/30 rounded-xl p-4 flex flex-col justify-between hover:bg-slate-900 cursor-pointer transition-all">
                  <div>
                    <h3 className="font-bold text-white text-sm flex items-center mb-2"><Clock className="w-4 h-4 mr-1 text-blue-400" /> 定期定額 (DCA)</h3>
                    <p className="text-[10px] text-slate-400 mb-3 bg-slate-900 p-2 rounded line-clamp-2">{appData.stock.dcaReason}</p>
                  </div>
                  <div className="border-t border-slate-800 pt-3 flex justify-between items-end">
                    <span className="text-blue-400 text-xs">{appData.stock.isSuitableForDCA ? '推薦持續扣款' : '不建議'}</span>
                  </div>
                </div>

                {/* 戰略卡片 4：當沖高風險警告 (橫跨全版) */}
                <div onClick={() => setSelectedStrategy({title: '當沖交易 (Day Trading) 警告', type: '極高風險', color: 'red', logic: `VIX 偏高 (${appData.macro.vix})`, details: '日內趨勢與宏觀情緒呈現背離。根據凱利公式試算，當沖突破期望值為負。建議嚴格限制資金於 2% 內打突破，紀律要求：收盤前絕對平倉，絕不凹單留倉。', target: (appData.stock.price * 1.01).toFixed(2) + ' (微幅突破)', stopLoss: (appData.stock.price * 0.99).toFixed(2) + ' (日內緊縮)' })} className="md:col-span-2 lg:col-span-3 bg-red-950/20 border border-red-900/50 rounded-xl p-3 lg:p-4 flex items-center hover:bg-red-900/30 cursor-pointer transition-colors group">
                  <div className="bg-red-500/20 p-2 rounded-full mr-3 lg:mr-4 group-hover:scale-110 transition-transform">
                    <AlertTriangle className="w-5 h-5 lg:w-6 lg:h-6 text-red-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-red-400 font-bold text-xs lg:text-sm mb-1 flex items-center">
                      當沖/短線極高風險警告 <FileText className="w-3 h-3 ml-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"/>
                    </h3>
                    <p className="text-[10px] lg:text-xs text-red-200/70">
                      VIX 波動率偏高。根據凱利公式試算期望值偏低，建議嚴格限制資金於 2% 內，<strong className="text-red-300 border-b border-red-500/50 pb-0.5">收盤前必須絕對平倉。</strong>
                    </p>
                  </div>
                  <div className="ml-2 text-right hidden sm:block">
                    <span className="text-[10px] text-red-300/50 block group-hover:text-red-300 transition-colors">點擊查看停損規劃 &rarr;</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal 報告區塊 (包含 Gemini 深度推演) */}
      {selectedStrategy && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => { setSelectedStrategy(null); setAiDeepDiveResult(''); }}></div>
          <div className={`relative bg-slate-900 border border-${selectedStrategy.color}-500/50 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200`}>
            <div className={`bg-${selectedStrategy.color}-900/30 border-b border-${selectedStrategy.color}-500/30 p-4 flex justify-between items-center`}>
              <h2 className={`text-lg font-bold text-${selectedStrategy.color}-400 flex items-center`}><Activity className="w-5 h-5 mr-2" />{selectedStrategy.title}</h2>
              <button onClick={() => { setSelectedStrategy(null); setAiDeepDiveResult(''); }} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                <p className="text-sm text-slate-300">{selectedStrategy.details}</p>
              </div>

              {/* ✨ Gemini 深度推演 */}
              <div className="bg-blue-950/20 p-4 rounded-lg border border-blue-900/50">
                <h4 className="text-sm font-bold text-blue-400 mb-2 flex items-center justify-between">
                  <span><Sparkles className="w-4 h-4 mr-1 inline"/> Gemini 即時深度推演</span>
                  {!aiDeepDiveResult && !isDeepDiving && (
                    <button onClick={async () => {
                        setIsDeepDiving(true);
                        const prompt = `為股票 ${currentStock} 撰寫一份具體的執行計畫。\n策略：${selectedStrategy.title}\n當前價位：${appData.stock.price}\nP/E：${appData.stock.pe}\n著重於資金控管與盤中紀律。`;
                        const result = await callGeminiAPI(prompt);
                        setAiDeepDiveResult(result);
                        setIsDeepDiving(false);
                      }} className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1 rounded">
                      啟動推演
                    </button>
                  )}
                </h4>
                {isDeepDiving && <div className="text-blue-300 text-sm py-2 text-center"><Loader2 className="w-5 h-5 inline animate-spin mr-2" /> 推演中...</div>}
                {aiDeepDiveResult && <div className="text-sm text-blue-100/80 mt-2 whitespace-pre-line">{aiDeepDiveResult}</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
      `}} />
    </div>
  );
};

export default App;
