📊 Quant Nana AI 台美股即時投資戰情室

這是一個結合總經、基本面、技術籌碼與 AI 情緒分析的量化投資戰情室。
本專案採用前後端分離架構，專為高頻即時數據與大語言模型（LLM）分析所設計。

📁 專案資料夾打包結構 (請在你的電腦上建立這樣的資料夾)

請在你的電腦桌面上建立一個名為 quant-nana-ai 的資料夾，並將我們寫好的檔案照以下結構放好：

quant-nana-ai/                 <-- 你的專案主資料夾
│
├── .gitignore                 <-- 剛剛新增的 Git 忽略清單
├── README.md                  <-- 也就是這份說明文件
│
├── frontend/                  <-- 前端 React 資料夾 (準備給 Vercel)
│   ├── package.json           <-- 剛剛新增的前端套件清單
│   └── src/
│       └── App.jsx            <-- 我們寫好的戰情室超美介面
│
└── backend/                   <-- 後端 Python 資料夾 (準備給 Render)
    ├── requirements.txt       <-- 剛剛新增的後端套件清單
    └── main.py                <-- 我們寫好的台美股爬蟲與大腦


🚀 給非工程師的 GitHub 超簡單上傳步驟

因為你不需要寫指令，我們直接用 GitHub 的網頁版來上傳：

登入 GitHub：打開瀏覽器，登入你的 GitHub 帳號。

建立新專案：點擊右上角的 + 號，選擇 New repository。

命名專案：在 Repository name 填入 quant-nana-ai，設定為 Public 或 Private 都可以，然後點擊最下方的 Create repository。

上傳檔案：

進入你剛建好的專案頁面，點擊畫面中間的 "uploading an existing file" (上傳現有檔案) 的連結。

把你電腦桌面上 quant-nana-ai 資料夾裡面的所有檔案和資料夾，直接「拖曳」進瀏覽器畫面裡。

等檔案跑完後，點擊綠色的 "Commit changes" 按鈕。

🎉 恭喜！你的程式碼金庫已經打造完成了！