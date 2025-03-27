const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Record user consent
router.post('/', async (req, res) => {
    try {
        const { consent, consent_text } = req.body;
        
        if (!consent) {
            return res.status(400).json({ success: false, message: 'Consent is required' });
        }

        const ip_address = req.ip;
        const user_agent = req.headers['user-agent'];

        const query = `
            INSERT INTO user_consent (ip_address, user_agent, consent_text, consent_status)
            VALUES (?, ?, ?, ?)
        `;

        await db.query(query, [ip_address, user_agent, consent_text, consent]);

        res.json({ success: true, message: 'Consent recorded successfully' });
    } catch (error) {
        console.error('Error recording consent:', error);
        res.status(500).json({ success: false, message: 'Error recording consent' });
    }
});

module.exports = router; 