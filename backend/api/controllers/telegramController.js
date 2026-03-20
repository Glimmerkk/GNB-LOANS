const axios = require('axios');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.ADMIN_CHAT_ID;

exports.sendMessage = async (req, res) => {
    try {
        const { message } = req.body;
        
        const response = await axios.post(
            `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
            {
                chat_id: CHAT_ID,
                text: message,
                parse_mode: 'Markdown'
            }
        );
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getUpdates = async (req, res) => {
    try {
        const { offset = 0 } = req.params;
        
        const response = await axios.get(
            `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates`,
            { params: { offset, timeout: 30 } }
        );
        
        res.json({ success: true, data: response.data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};