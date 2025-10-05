import React, { useEffect, useRef, memo } from 'react';

interface TradingViewWidgetProps {
  symbol: string;
  exchange?: string;
  name?: string;
}

function TradingViewWidget({ symbol, exchange = 'NASDAQ', name }: TradingViewWidgetProps) {
  const container = useRef<HTMLDivElement>(null);

  // Map exchanges to TradingView format
  const exchangeMap: { [key: string]: string } = {
    'XNSE': 'NSE',
    'XBSE': 'BSE', 
    'NASDAQ': 'NASDAQ',
    'NYSE': 'NYSE',
    'AMEX': 'AMEX',
    'OTC': 'OTC',
    'BATS': 'BATS',
    'ARCA': 'ARCA',
    'IEX': 'IEX',
    'TSX': 'TSX',
    'LSE': 'LSE',
    'XETRA': 'XETRA',
    'ASX': 'ASX'
  };

  // Map exchange-specific symbol formatting rules
  const symbolFormatMap: { [key: string]: (symbol: string) => string } = {
    'XNSE': (symbol: string) => symbol.replace(/\.NS$/, ''), // Remove .NS suffix for NSE
    'XBSE': (symbol: string) => symbol.replace(/\.BO$/, ''), // Remove .BO suffix for BSE
    'NASDAQ': (symbol: string) => symbol,
    'NYSE': (symbol: string) => symbol,
    'AMEX': (symbol: string) => symbol,
    'OTC': (symbol: string) => symbol,
    'BATS': (symbol: string) => symbol,
    'ARCA': (symbol: string) => symbol,
    'IEX': (symbol: string) => symbol,
    'TSX': (symbol: string) => symbol.replace(/\.TO$/, ''), // Remove .TO suffix for TSX
    'LSE': (symbol: string) => symbol.replace(/\.L$/, ''), // Remove .L suffix for LSE
    'XETRA': (symbol: string) => symbol.replace(/\.DE$/, ''), // Remove .DE suffix for XETRA
    'ASX': (symbol: string) => symbol.replace(/\.AX$/, '') // Remove .AX suffix for ASX
  };

  const tradingViewExchange = exchangeMap[exchange?.toUpperCase()] || exchange || 'NASDAQ';
  const formatSymbol = symbolFormatMap[exchange?.toUpperCase()] || ((symbol: string) => symbol);
  const formattedSymbol = `${tradingViewExchange}:${formatSymbol(symbol)}`;

  useEffect(() => {
    if (!container.current) return;

    // Clean up any existing script
    const existingScript = container.current.querySelector('script');
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-single-quote.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbol: formattedSymbol,
      colorTheme: "light",
      isTransparent: false,
      locale: "en",
      width: "100%",
      height: 200
    });
    
    container.current.appendChild(script);

    // Cleanup function
    return () => {
      if (container.current) {
        const scriptElement = container.current.querySelector('script');
        if (scriptElement) {
          scriptElement.remove();
        }
      }
    };
  }, [formattedSymbol]);

  return (
    <div className="w-full h-full">
      <div ref={container} className="w-full"></div>
      <div className="mt-2 text-xs text-gray-500 text-center">
        <a 
          href={`https://www.tradingview.com/symbols/${tradingViewExchange}-${formatSymbol(symbol)}/`} 
          rel="noopener nofollow" 
          target="_blank"
          className="text-blue-600 hover:text-blue-800"
        >
          {name || symbol} stock price
        </a>
        <span> by TradingView</span>
      </div>
    </div>
  );
}

export default memo(TradingViewWidget);