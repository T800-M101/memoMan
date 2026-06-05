const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.post('/proxy', async (req, res) => {
    const targetUrl = req.query.url;
    const start = Date.now();

    if (!targetUrl) {
        return res.status(400).json({ error: 'Missing URL' });
    }

    try {
        const response = await axios({
            method: req.body.method || 'GET',
            url: targetUrl,
            headers: req.body.headers || {},
            data: req.body.body || null,
            validateStatus: () => true
        });

        const duration = Date.now() - start;

        res.json({
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            duration: `${duration}ms`,
            body: response.data
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => console.log(`Active proxy server at http://localhost:${PORT}`));
