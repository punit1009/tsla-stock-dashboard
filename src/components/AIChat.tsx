import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, RefreshCw, AlertCircle } from 'lucide-react';
import { analyzeStockData, generateTradingInsights, getTechnicalIndicators } from '../services/aiService';
import { fetchStockData } from '../services/dataService';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  type?: 'analysis' | 'insight' | 'indicator' | 'error';
}

interface StockData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  direction?: 'LONG' | 'SHORT' | 'NEUTRAL';
}

const SAMPLE_QUESTIONS = [
  "What's the current trend for TSLA?",
  "Show me key support and resistance levels",
  "Analyze the recent price action",
  "What do the technical indicators suggest?",
  "Generate trading insights for the next week"
];



const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi! I\'m your AI Trading Analyst. Ask me to analyze stock data, provide trading insights, or explain technical indicators.',
      type: 'analysis'
    }
  ]);
  
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [stockData, setStockData] = useState<StockData[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Load initial stock data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const data = await fetchStockData();
        // Convert string values to numbers and normalize direction values
        const processedData = data.map(item => ({
          date: item.date,
          open: parseFloat(String(item.open)),
          high: parseFloat(String(item.high)),
          low: parseFloat(String(item.low)),
          close: parseFloat(String(item.close)),
          volume: parseFloat(String(item.volume)),
          direction: item.direction === 'None' ? 'NEUTRAL' : 
                    (item.direction as 'LONG' | 'SHORT' | 'NEUTRAL')
        }));
        setStockData(processedData);
      } catch (error) {
        console.error('Error loading stock data:', error);
        setMessages(prev => [...prev, {
          id: 'error-1',
          role: 'system',
          content: 'Failed to load stock data. Please try again later.',
          type: 'error'
        }]);
      }
    };
    
    loadInitialData();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Generate a data summary for AI context
  const generateDataSummary = (data: StockData[]) => {
    if (!data || data.length === 0) return '';
    
    const first = data[0];
    const last = data[data.length - 1];
    
    return `Tesla (TSLA) Stock Data Summary:

- Date Range: ${first.date} to ${last.date}
- Latest Close: $${last.close.toFixed(2)}
- Price Range: $${Math.min(...data.map(d => d.low)).toFixed(2)} to $${Math.max(...data.map(d => d.high)).toFixed(2)}
- Volume Range: ${Math.min(...data.map(d => d.volume)).toLocaleString()} to ${Math.max(...data.map(d => d.volume)).toLocaleString()}
- Days Analyzed: ${data.length}`;
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    
    // Add user message
    const userMessage: Message = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: input 
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    
    try {
      if (!stockData.length) {
        throw new Error('No stock data available');
      }
      
      // Get recent data for context (last 30 days)
      const recentData = stockData.slice(-30);
      const dataSummary = generateDataSummary(stockData);
      
      // Determine which analysis function to use based on query
      const query = input.trim().toLowerCase();
      let response: string;
      
      if (query.includes('insight') || query.includes('overview') || query.includes('summary')) {
        response = await generateTradingInsights(stockData, 'TSLA');
        setMessages(prev => [...prev, { 
          id: Date.now().toString(), 
          role: 'assistant', 
          content: response,
          type: 'insight'
        }]);
      } 
      else if (query.includes('indicator') || query.includes('technical')) {
        response = await getTechnicalIndicators(recentData);
        setMessages(prev => [...prev, { 
          id: Date.now().toString(), 
          role: 'assistant', 
          content: response,
          type: 'indicator'
        }]);
      } 
      else {
        // Use the main analysis function for detailed questions
        response = await analyzeStockData({
          dataSummary,
          recentData,
          symbol: 'TSLA',
          timeFrame: `${new Date(recentData[0].date).toLocaleDateString()} - ${new Date(recentData[recentData.length-1].date).toLocaleDateString()}`,
          query: input
        });
        setMessages(prev => [...prev, { 
          id: Date.now().toString(), 
          role: 'assistant', 
          content: response,
          type: 'analysis'
        }]);
      }
    } catch (error) {
      console.error('Error processing query:', error);
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'assistant', 
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessageContent = (message: Message) => {
    const { content, type, role } = message;
    
    // Add appropriate icon based on message type
    const renderIcon = () => {
      if (role === 'user') {
        return <User size={16} className="mr-1" />;
      }
      
      switch (type) {
        case 'error':
          return <AlertCircle size={16} className="mr-1 text-red-400" />;
        case 'indicator':
          return <RefreshCw size={16} className="mr-1" />;
        default:
          return <Bot size={16} className="mr-1" />;
      }
    };

    return (
      <div className="flex items-start gap-2">
        {renderIcon()}
        <div>{content}</div>
      </div>
    );
  };

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: 'Hi! I\'m your AI Trading Analyst. Ask me about stock trends, technical indicators, or trading strategies for TSLA.',
        type: 'analysis'
      }
    ]);
  };

  const handleSampleQuestion = (question: string) => {
    setInput(question);
    sendMessage();
  };

  return (
    <div className="bg-[#23243a] rounded-2xl shadow-2xl p-6 border border-[#23243a] min-h-[400px] flex flex-col max-h-[600px]">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-white">AI Trading Analyst</h2>
        <button
          onClick={clearChat}
          className="text-sm text-gray-400 hover:text-white transition-colors"
          disabled={loading}
        >
          Clear Chat
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-4 py-2 rounded-xl shadow-md text-sm whitespace-pre-line
              ${msg.role === 'user' 
                ? 'bg-blue-600 text-white' 
                : msg.type === 'error' 
                  ? 'bg-red-800 text-red-100' 
                  : 'bg-[#181926] text-blue-100'}`}
            >
              {renderMessageContent(msg)}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="max-w-[70%] px-4 py-2 rounded-xl shadow-md text-sm bg-[#181926] text-blue-400 flex items-center gap-2 animate-pulse">
              <Bot size={16} className="mr-1" />
              <span>Analyzing TSLA data...</span>
              <RefreshCw size={14} className="animate-spin ml-1" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Sample questions */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {SAMPLE_QUESTIONS.map((question, index) => (
          <button 
            key={index}
            onClick={() => handleSampleQuestion(question)}
            className="text-xs text-left px-2 py-1 rounded bg-[#181926] hover:bg-blue-700 text-gray-300 hover:text-white transition-colors truncate"
            disabled={loading}
          >
            {question}
          </button>
        ))}
      </div>
      
      <div className="flex items-center gap-2 mt-2">
        <input
          className="flex-1 px-4 py-2 rounded-lg bg-[#181926] border border-[#23243a] text-gray-100 focus:outline-none focus:border-blue-400 shadow"
          type="text"
          placeholder="Ask about TSLA stock..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
          disabled={loading}
        />
        <button
          className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow transition-colors disabled:opacity-50"
          onClick={sendMessage}
          disabled={loading || !input.trim()}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

export default AIChat;