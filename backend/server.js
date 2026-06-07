import express from 'express';
import cors from 'cors';
import axios from 'axios';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';


const app = express();
const PORT = process.env.PORT || 3001;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'data', 'collections.json');

if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'));
}

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
    // Importación dinámica como tenías
    const { toJsonObject } = await import('curlconverter');

    // Limpieza crítica para que el parser no falle por saltos de línea
    const cleanCurl = curl.replace(/\\\n/g, ' ').replace(/\s+/g, ' ');

    const rawParsed = toJsonObject(cleanCurl);

    // Transformamos el resultado crudo al formato que tu frontend entiende
    const formattedResponse = transformToFrontendFormat(rawParsed);

    res.json(formattedResponse);
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

app.get('/api/collections', (req, res) => {
  if (!fs.existsSync(DATA_FILE)) {
    return res.json([]);
  }

  const data = fs.readFileSync(DATA_FILE, 'utf-8');

  if (!data || data.trim().length === 0) {
    return res.json([]);
  }

  try {
    res.json(JSON.parse(data));
  } catch (error) {
    console.error("Error al parsear el JSON:", error);
    res.status(500).json({ error: "Archivo JSON corrupto" });
  }
});

app.post('/api/collections', (req, res) => {
  const collections = req.body;
  fs.writeFileSync(DATA_FILE, JSON.stringify(collections, null, 2));
  res.status(200).json({ message: 'Saved successfully' });
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


function transformToFrontendFormat(data) {
  // Manejo de Headers (curlconverter los devuelve como un objeto plano, está bien)
  const headers = data.headers || {};

  // Manejo del Body (si viene como string JSON, lo parseamos a objeto)
  let bodyContent = data.data || '';
  try {
    if (typeof bodyContent === 'string') {
      bodyContent = JSON.parse(bodyContent);
    }
  } catch { /* si no es JSON, lo dejamos como string o vacío */ }

  return {
    method: data.method?.toUpperCase() || 'GET',
    name: 'Imported Request',
    url: data.url || '',
    params: {}, // curlconverter suele ponerlos en la URL, requeriría lógica extra para extraerlos
    headers: Object.entries(headers).map(([key, value]) => ({ key, value, description: '' })),
    body: {
      type: bodyContent ? 'json' : 'none',
      jsonContent: typeof bodyContent === 'object' ? JSON.stringify(bodyContent, null, 2) : bodyContent
    },
    auth: {
      type: data.auth ? 'basic' : (headers['authorization'] ? 'bearer' : 'none'),
      bearerToken: headers['authorization']?.replace('Bearer ', '') || '',
      basicUsername: data.auth?.username || '',
      basicPassword: data.auth?.password || ''
    },
    response: null
  };
}
