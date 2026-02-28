from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
import pandas as pd
import numpy as np
import re

app = FastAPI(title="Quant Nana AI 戰術中心 API", version="1.2")

# 解決跨域問題，讓 Vercel 的網頁能連上 Render 的伺服器
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def format_ticker(ticker: str) -> str:
    """自動判定台美股代碼"""
    ticker = ticker.upper().strip()
    if re.match(r'^\d+$', ticker):
        # 數字代碼預設為台股
        return f"{ticker}.TW"
    return ticker

def calculate_technical_indicators(df: pd.DataFrame):
    """計算精確的量化指標"""
    if len(df) < 60:
         raise ValueError("數據長度不足以運算 MA60")

    # RSI (14)
    delta = df['Close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss
    df['RSI'] = 100 - (100 / (1 + rs))

    # KD (9,3,3)
    low_min = df['Low'].rolling(window=9).min()
    high_max = df['High'].rolling(window=9).max()
    df['RSV'] = 100 * ((df['Close'] - low_min) / (high_max - low_min))
    df['K'] = df['RSV'].rolling(window=3).mean()
    df['D'] = df['K'].rolling(window=3).mean()

    # MACD
    exp1 = df['Close'].ewm(span=12, adjust=False).mean()
    exp2 = df['Close'].ewm(span=26, adjust=False).mean()
    df['MACD'] = exp1 - exp2
    df['Signal'] = df['MACD'].ewm(span=9, adjust=False).mean()
    df['Hist'] = df['MACD'] - df['Signal']

    df['Vol_MA'] = df['Volume'].rolling(window=20).mean()
    
    latest = df.iloc[-1]
    prev = df.iloc[-2]
    
    return {
        "price": round(latest['Close'], 2),
        "change_percent": round((latest['Close'] - prev['Close']) / prev['Close'] * 100, 2),
        "rsi": round(latest['RSI'], 1) if not pd.isna(latest['RSI']) else 50,
        "kd": {
            "k": round(latest['K'], 1) if not pd.isna(latest['K']) else 50,
            "d": round(latest['D'], 1) if not pd.isna(latest['D']) else 50
        },
        "macd_status": "多頭" if latest['Hist'] > 0 else "空頭",
        "volume_breakout": bool(latest['Volume'] > latest['Vol_MA'] * 1.5)
    }

@app.get("/api/stock/{ticker}")
async def get_stock_data(ticker: str):
    try:
        yf_ticker = format_ticker(ticker)
        stock = yf.Ticker(yf_ticker)
        # 抓取 6 個月的數據確保 MA60 運算
        hist = stock.history(period="6mo")
        
        # 若台股上市抓不到，嘗試上櫃 (.TWO)
        if hist.empty and yf_ticker.endswith(".TW"):
            yf_ticker = yf_ticker.replace(".TW", ".TWO")
            stock = yf.Ticker(yf_ticker)
            hist = stock.history(period="6mo")

        if hist.empty:
            raise HTTPException(status_code=404, detail=f"找不到該標的: {ticker}")

        tech_data = calculate_technical_indicators(hist)
        info = stock.info
        
        # 返回精確的真實數據
        return {
            "ticker": ticker.upper(),
            "stock": {
                "price": tech_data["price"],
                "change": tech_data["change_percent"],
                "pe": round(info.get("forwardPE", info.get("trailingPE", 0)), 1),
                "roe": round(info.get("returnOnEquity", 0) * 100, 1),
                "institutionalHoldings": round(info.get("institutionsPercentHeld", 0) * 100, 1),
                "analystTarget": info.get("targetMeanPrice", "N/A")
            },
            "tech": {
                "kd": tech_data["kd"],
                "rsi": tech_data["rsi"],
                "macd": tech_data["macd_status"],
                "volumeBreakout": tech_data["volume_breakout"],
                "marginRate": 160 if not yf_ticker.endswith(".TW") else 128.5 # 模擬台股特定維持率
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
