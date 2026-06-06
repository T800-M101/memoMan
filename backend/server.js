import express from 'express';
import cors from 'cors';
import axios from 'axios';


const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Global error handler for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  // Don't exit immediately, let the server finish current requests
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
});

// Proxy endpoint
app.post('/proxy', async (req, res) => {
  const targetUrl = req.query.url;
  const start = Date.now();

  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing URL parameter' });
  }

  console.log(`[${new Date().toISOString()}] ${req.body.method || 'GET'} ${targetUrl}`);

  try {
    const response = await axios({
      method: req.body.method || 'GET',
      url: targetUrl,
      headers: req.body.headers || {},
      data: req.body.body || null,
      validateStatus: () => true,
      timeout: 30000 // 30 second timeout
    });

    const duration = Date.now() - start;

    res.json({
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      duration: `${duration}ms`,
      body: response.data,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error(`Proxy error: ${err.message}`);
    res.status(500).json({
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.post('/parse-curl', async (req, res) => {
  const { curl } = req.body;

  if (!curl) {
    return res.status(400).json({ error: 'Missing curl field in body' });
  }

  try {
    const { toJsonObject } = await import('curlconverter');
    const parsed = toJsonObject(curl);
    res.json(parsed);
  } catch (err) {
    res.status(400).json({ error: `Invalid cURL command: ${err.message}` });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Memoman Proxy Backend',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      proxy: 'POST /proxy?url={target_url}',
      health: 'GET /health'
    }
  });
});

// Start server with error handling
const server = app.listen(PORT, () => {
  console.log(`\n🚀 Memoman Proxy Server`);
  console.log(`📍 Running at http://localhost:${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 Proxy endpoint: POST http://localhost:${PORT}/proxy?url=YOUR_URL`);
  console.log(`\n✅ Server is ready! Press Ctrl+C to stop.\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
