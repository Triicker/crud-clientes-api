const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const emailController = require('../controller/emailController');

// POST /api/email/send - Enfileira envio de e-mail (com anexos opcionais)
router.post('/send', upload.array('attachments'), emailController.enqueueEmail);

module.exports = router;
