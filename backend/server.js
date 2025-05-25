const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
require('dotenv').config();

// Enable CORS with proper configuration for both development and production
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? [process.env.FRONTEND_URL || 'https://tsla-stock-dashboard.netlify.app'] 
        : 'http://localhost:5173',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    credentials: true
}));

app.use(express.json());

// Root route
app.get('/', (req, res) => {
    res.status(200).json({ 
        status: 'ok', 
        message: 'TSLA Stock Dashboard Backend',
        timestamp: new Date().toISOString() 
    });
});

// Health check endpoint for monitoring
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'ok', 
        timestamp: new Date().toISOString() 
    });
});

// Gemini API configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-1.5-flash'; // Using Gemini 1.5 Flash which has more generous free quotas
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// List available models on startup for debugging
axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`)
  .then(response => {
    console.log('Available models:', response.data.models);
  })
  .catch(error => {
    console.error('Error listing models:', error.response?.data?.error?.message);
  });

// Gemini API endpoint
app.post('/api/gemini', async (req, res) => {
  try {
    // Add a timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await axios.post(
      `${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: req.body.prompt
          }]
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      }
    );
    
    clearTimeout(timeoutId);
    
    // Return the response in the format your frontend expects
    res.json({
      response: response.data.candidates[0].content.parts[0].text
    });
    
  } catch (error) {
    console.error('Gemini API Error:', {
      url: error.config?.url?.replace(GEMINI_API_KEY, 'REDACTED'),
      status: error.response?.status,
      data: error.response?.data
    });
    res.status(500).json({ 
      error: 'Gemini API request failed',
      details: error.response?.data?.error?.message || error.message
    });
  }
});

app.post('/api/trading-assistant', async (req, res) => {
  try {
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: await createTradingPrompt(req.body.query, req.user.id)
          }]
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    res.json(parseTradingResponse(response.data));
    
  } catch (error) {
    console.error('API Error:', {
      url: error.config?.url?.replace(process.env.GEMINI_API_KEY, 'REDACTED'),
      status: error.response?.status,
      data: error.response?.data
    });
    res.status(500).json({ 
      error: 'Trading analysis failed',
      details: error.response?.data?.error?.message || error.message
    });
  }
});
// In production, serve the static files from the frontend build
if (process.env.NODE_ENV === 'production') {
    const path = require('path');
    const distPath = path.join(__dirname, '../dist');
    
    // Serve static files
    app.use(express.static(distPath));
    
    // For any other request, send index.html (for SPA routing)
    app.get('*', (req, res) => {
        // Skip API routes
        if (req.path.startsWith('/api/')) {
            return res.status(404).json({ error: 'API endpoint not found' });
        }
        res.sendFile(path.join(distPath, 'index.html'));
    });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('Gemini API proxy ready');
    console.log(`Make sure your GEMINI_API_KEY is ${GEMINI_API_KEY ? 'set' : 'NOT SET!'}`);
});