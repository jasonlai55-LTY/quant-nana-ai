import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { Activity, AlertTriangle, TrendingUp, DollarSign, Clock, Globe, Search, Newspaper, LineChart, Info, Star, Plus, Menu, X, ExternalLink, FileText, Sparkles, Loader2, ShieldAlert, Zap } from 'lucide-react';

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

  // 【重要】你的 Render 後端網址
  const BACKEND_URL = "https://quant-nana-ai-1.onrender.com";

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
          { source: 'Reuters', text: `$${currentStock} 供應鏈傳出調整...`, sentiment: isPositive ? 'positive' : 'negative', url: '#' },
          { source: 'Twitter (X)', text: `$${currentStock} 技術面突破！`, sentiment: 'positive', url: '#' },
          { source: 'WSJ', text: `聯準會利率決策影響...`, sentiment: 'negative', url: '#' }
        ]
      };

      try {
        const response = await fetch(`${BACKEND_URL}/api/stock/${currentStock}`);
        if (!response.ok) throw new Error('API 無法連線');
        const realData = await response.json();
        if (isMounted) {
          setAppData({ macro: macroFallback, stock: realData.stock, tech: realData.tech, isReal: true });
          setIsLoading(false);
        }
      } catch (error) {
        console.warn("後端連線失敗，切換至模擬數據。錯誤原因：", error.message);
        const basePrice = 50 + (hash % 500);
        if (isMounted) {
          setAppData({
            macro: macroFallback,
            stock: { price: basePrice, change: "1.23", pe: 15.5, roe: 18.2, institutionalHoldings: 65, analystTarget: 180, isSuitableForDCA: true, dcaReason: "具備高市佔率與穩定現金流，適合長期佈局。" },
            tech: { kd: { k: 45, d: 42 }, rsi: 55, macd: "由負轉正", volumeBreakout: false, marginRate: 160, chipData: { isTWSE: /^\d+$/.test(currentStock) } },
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
      <Activity className="w-12 h-12 mb-4 animate-bounce" />
      <h2 className="text-xl font-bold tracking-widest">QUANT NANA AI</h2>
      <div className="text-sm text-slate-400 mt-2">正在載入 {currentStock} 雲端數據...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans selection:bg-blue-500/30 flex flex-col">
      <header className="bg-slate-900 border-b border-slate-800 p-3 sticky top-0 z-50 shadow-md">
        <div className="max-w-[1800px] mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Activity className="text-blue-500 w-6 h-6" />
            <h1 className="text-lg font-bold text-white tracking-wider">QUANT <span className="text-blue-500">NANA</span></h1>
            {appData.isReal ? 
              <span className="bg-green-500/10 text-green-400 text-[10px] px-2 py-0.5 rounded border border-green-500/20">● 真實雲端數據</span> :
              <span className="bg-orange-500/10 text-orange-400 text-[10px] px-2 py-0.5 rounded border border-orange-500/20">預覽模式 (模擬)</span>
            }
          </div>
          <form onSubmit={handleSearch} className="flex-1 max-w-md mx-4">
             <input type="text" value={tickerInput} onChange={(e)=>setTickerInput(e.target.value)} placeholder="輸入代碼 (例: 2330)..." className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-1 text-sm focus:outline-none focus:border-blue-500 uppercase" />
          </form>
          <div className="text-xs text-slate-500 hidden sm:block font-mono">{currentTime}</div>
        </div>
      </header>

      <main className="flex-1 p-4 max-w-[1800px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-5">
        <aside className="hidden lg:block lg:col-span-2 space-y-2">
           <h2 className="text-white font-bold text-xs flex items-center mb-4"><Star className="w-3 h-3 mr-1 text-yellow-400 fill-current"/> 快速自選</h2>
           {watchlists[market].map(t => (
             <div key={t} onClick={()=>setCurrentStock(t)} className={`p-2 rounded cursor-pointer border text-sm font-mono ${currentStock===t ? 'bg-blue-900/30 border-blue-500/50 text-white' : 'border-transparent hover:bg-slate-800'}`}>{t}</div>
           ))}
        </aside>

        <div className="lg:col-span-10 grid grid-cols-1 lg:grid-cols-3 gap-5">
           <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
              <h3 className="text-white font-bold mb-3 flex items-center text-sm"><Globe className="w-4 h-4 mr-2 text-purple-400"/> 總經情緒</h3>
              <div className="space-y-4">
                <div className="bg-slate-950 p-3 rounded border border-slate-800 text-xs flex justify-between">
                  <span className="text-slate-400">恐懼貪婪指數</span>
                  <span className="text-red-400 font-bold">{appData.macro.fearGreedIndex}</span>
                </div>
                <div className="bg-purple-900/10 p-3 rounded border border-purple-500/20 text-[10px]">
                   <span className="text-purple-300 font-bold block mb-1">✨ Gemini 新聞摘要</span>
                   {aiNewsInsight || "點擊下方按鈕生成分析..."}
                </div>
              </div>
           </div>

           <div className="lg:col-span-2 bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col">
              <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2">
                 <h3 className="text-white font-bold text-sm flex items-center"><LineChart className="w-4 h-4 mr-2 text-cyan-400"/> 技術與籌碼共振</h3>
                 <div className="text-right"><span className="text-2xl font-mono font-bold text-white">${appData.stock.price}</span></div>
              </div>
              <div className="flex-1 bg-slate-950 rounded-lg mb-4 flex items-center justify-center text-slate-700 italic text-sm border border-slate-800">
                 <div className="text-center space-y-2">
                   <Activity className="w-8 h-8 mx-auto text-blue-900 animate-pulse" />
                   <p>[雲端連線成功，正在接收來自 Render 的 K 線串流資料...]</p>
                 </div>
              </div>
              <div className="grid grid-cols-4 gap-2 text-[10px]">
                 <div className="bg-slate-950 p-2 rounded border border-slate-800 text-center">RSI: <span className="text-white font-bold">{appData.tech.rsi}</span></div>
                 <div className="bg-slate-950 p-2 rounded border border-slate-800 text-center">KD: <span className="text-white font-bold">{appData.tech.kd.k}/{appData.tech.kd.d}</span></div>
                 <div className="bg-slate-950 p-2 rounded border border-slate-800 text-center">MACD: <span className="text-white font-bold">{appData.tech.macd}</span></div>
                 <div className="bg-slate-950 p-2 rounded border border-slate-800 text-center">維持率: <span className="text-red-400 font-bold">{appData.tech.marginRate}%</span></div>
              </div>
           </div>
        </div>
      </main>

      {/* 簡易 CSS 樣式修正 */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
      `}</style>
    </div>
  );
};

// 進入點渲染
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
