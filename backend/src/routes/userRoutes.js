const express = require('express');
const axios = require('axios');
const pool = require("../db");
const router = express.Router();

const userRoutes = (bot) => {
    router.get('/user-image/:fileId', async (req, res) => {
        const fileId = req.params.fileId;
        try {
            const file = await bot.telegram.getFile(fileId);
            const filePath = file.file_path;
            const downloadUrl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${filePath}`;

            const response = await axios({
                method: 'GET',
                url: downloadUrl,
                responseType: 'arraybuffer'
            });

            res.writeHead(200, {
                'Content-Type': 'image/jpeg', // Adjust based on the actual image type
                'Content-Length': response.data.length
            });
            res.end(response.data);
        } catch (error) {
            console.error('Failed to fetch image:', error);
            res.status(500).send('Failed to fetch image');
        }
    });

    // Маршрут для получения всех предложений
    router.get('/suggestions', async (req, res) => {
        try {
            const client = await pool.connect();
            const result = await client.query('SELECT * FROM suggestions');
            const suggestions = result.rows;
            client.release();
            res.json(suggestions);
        } catch (error) {
            console.error('Error fetching suggestions:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });
    return router;
};

module.exports = userRoutes;
