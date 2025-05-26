const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

// Enable detailed error logging
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

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
    console.log('=== /api/stock-data endpoint hit ===');
    try {
        const { startDate, endDate } = req.query;
        console.log('Query parameters:', { startDate, endDate });
        
        // Helper function to find file in parent directories
        const findFileInParents = (filename, startDir = __dirname) => {
          const fullPath = path.join(startDir, filename);
          if (fs.existsSync(fullPath)) return fullPath;
          
          const parentDir = path.dirname(startDir);
          if (parentDir === startDir) return null;
          
          return findFileInParents(filename, parentDir);
        };

        // Try multiple possible locations for the data file
        const possibleDataFilePaths = [
          path.join(__dirname, 'data/stock-data.json'),  // Production path
          path.join(__dirname, '../data/stock-data.json'),  // Alternative production path
          path.join(process.cwd(), 'data/stock-data.json'),  // Relative to CWD
          findFileInParents('data/stock-data.json'),  // Search in parent directories
          findFileInParents('backend/data/stock-data.json')  // Search for backend/data in parents
        ].filter(Boolean);

        let dataFilePath = null;
        for (const filePath of possibleDataFilePaths) {
          if (fs.existsSync(filePath)) {
            dataFilePath = filePath;
            break;
          }
        }

        console.log('Current working directory:', process.cwd());
        console.log('Possible data file paths:', possibleDataFilePaths);
        console.log('Using data file path:', dataFilePath);
        console.log('File exists:', dataFilePath && fs.existsSync(dataFilePath) ? 'Yes' : 'No');
        
        if (dataFilePath) {
          console.log('Directory contents:', fs.readdirSync(path.dirname(dataFilePath)));
        }
        
        // Check if file exists
        if (!fs.existsSync(dataFilePath)) {
            const errorMsg = `Data file not found at: ${dataFilePath}`;
            console.error(errorMsg);
            return res.status(500).json({ error: 'Data file not found', path: dataFilePath });
        }
        
        // Read and parse the data file
        console.log('Reading data file...');
        const fileContent = fs.readFileSync(dataFilePath, 'utf8');
        console.log('File content length:', fileContent.length, 'characters');
        
        let rawData;
        try {
            rawData = JSON.parse(fileContent);
            console.log('Successfully parsed JSON data');
        } catch (parseError) {
            console.error('Error parsing JSON data:', parseError);
            return res.status(500).json({ 
                error: 'Failed to parse stock data',
                message: parseError.message 
            });
        }
        
        // Transform the data to match the expected format
        console.log('Transforming data...');
        const processedData = rawData.map(item => {
            // Parse support and resistance if they are strings
            const support = typeof item.Support === 'string' ? JSON.parse(item.Support) : [];
            const resistance = typeof item.Resistance === 'string' ? JSON.parse(item.Resistance) : [];
            
            return {
                date: new Date((item.timestamp - 25569) * 86400 * 1000).toISOString().split('T')[0],
                open: item.open,
                high: item.high,
                low: item.low,
                close: item.close,
                volume: item.volume,
                support: support,
                resistance: resistance,
                direction: item.direction || 'None'
            };
        });
        
        // Filter data by date range if provided
        let filteredData = [...processedData];
        
        if (startDate || endDate) {
            const start = startDate ? new Date(startDate) : new Date('2022-08-25');
            const end = endDate ? new Date(endDate) : new Date();
            
            console.log('Filtering data between:', { start, end });
            
            filteredData = filteredData.filter(item => {
                try {
                    const itemDate = new Date(item.date);
                    return itemDate >= start && itemDate <= end;
                } catch (e) {
                    console.error('Error processing date:', item.date, e);
                    return false;
                }
            });
        }
        
        // Sort by date
        filteredData.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        console.log(`Returning ${filteredData.length} records`);
        res.json(filteredData);
        
    } catch (error) {
        console.error('Error in /api/stock-data:', error);
        res.status(500).json({ 
            error: 'Failed to fetch stock data',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
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
const PORT = process.env.PORT || 3000; // Use 3000 for local development
const HOST = '0.0.0.0';

// Add basic route for testing
app.get('/test', (req, res) => {
    res.json({ status: 'ok', message: 'Test endpoint works!' });
});

// Start the server
const server = app.listen(PORT, HOST, () => {
    console.log('='.repeat(60));
    console.log(`Server started successfully!`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Server URL: http://${HOST}:${PORT}`);
    console.log(`API Endpoint: http://${HOST}:${PORT}/api/stock-data`);
    console.log(`Test Endpoint: http://${HOST}:${PORT}/test`);
    console.log('='.repeat(60));
    
    // Log environment variables (excluding sensitive ones)
    console.log('Environment Variables:');
    Object.keys(process.env).filter(key => 
        key.startsWith('NODE_') || 
        key.startsWith('PORT') ||
        key.startsWith('HOST')
    ).forEach(key => {
        console.log(`  ${key}=${process.env[key]}`);
    });
    console.log('='.repeat(60));
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