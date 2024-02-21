const express = require('express');
const router = express.Router();
const pool = require('../db'); // Assuming you've refactored your DB connection to `src/db/websocket.js`

// Route to fetch chats
router.get('/', async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT m.id, m.client_id, m.message, m.from_consultant, m.created_at, c.user_id, c.first_name, c.username, c.language_code, c.profile_image_id
            FROM messages m
            JOIN clients c ON m.client_id = c.id
            ORDER BY m.client_id, m.created_at;
        `);

        const chats = rows.reduce((acc, message) => {
            if (!acc[message.client_id]) {
                acc[message.client_id] = {
                    clientId: message.client_id,
                    userInfo: {
                        userId: message.user_id,
                        firstName: message.first_name,
                        username: message.username,
                        languageCode: message.language_code,
                        profileImageId: message.profile_image_id,
                    },
                    messages: [],
                };
            }

            acc[message.client_id].messages.push({
                messageId: message.id,
                message: message.message,
                fromConsultant: message.from_consultant,
                createdAt: message.created_at,
            });

            return acc;
        }, {});

        res.json(Object.values(chats));
    } catch (err) {
        console.error('Error fetching chats:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
