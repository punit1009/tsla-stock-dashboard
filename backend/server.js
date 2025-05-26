const express = require('express');
const path = require('path');
const app = express();

// Basic middleware
app.use(express.json());

// Simple CORS for all routes
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Debug middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'TSLA Stock Dashboard API',
        timestamp: new Date().toISOString() 
    });
});

// Stock data endpoint
app.get('/api/stock-data', (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const data = require('../data/tsla-stock-data.json');
        
        // Filter data by date range if provided
        let filteredData = [...data];
        
        if (startDate || endDate) {
            const start = startDate ? new Date(startDate) : new Date('2022-08-25');
            const end = endDate ? new Date(endDate) : new Date();
            
            filteredData = filteredData.filter(item => {
                const itemDate = new Date(item.date);
                return itemDate >= start && itemDate <= end;
            });
        }
        
        // Sort by date
        filteredData.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        res.json(filteredData);
    } catch (error) {
        console.error('Error fetching stock data:', error);
        res.status(500).json({ error: 'Failed to fetch stock data' });
    }
});

// Serve static files from the dist directory in production
if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(__dirname, '../dist');
    
    // Serve static files with cache control
    app.use(express.static(distPath, {
        etag: true,
        maxAge: '1y',
        immutable: true
    }));
    
    // Handle SPA routing - serve index.html for all non-API routes
    app.get('*', (req, res, next) => {
        // Skip API routes
        if (req.path.startsWith('/api/')) {
            return next();
        }
        
        // Serve index.html for all other routes
        res.sendFile('index.html', {
            root: distPath,
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        }, (err) => {
            if (err) {
                console.error('Error sending file:', err);
                res.status(500).send('Error loading application');
            }
        });
    });
}

// Error handling
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
const PORT = process.env.PORT || 10000; // Match the port in render.yaml
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Server URL: http://0.0.0.0:${PORT}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Handle process termination
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
    });
});