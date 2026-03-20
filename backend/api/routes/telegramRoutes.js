const express = require('express');
const router = express.Router();
const telegramController = require('../controllers/telegramController');

router.post('/send-message', telegramController.sendMessage);
router.get('/get-updates/:offset?', telegramController.getUpdates);

module.exports = router;