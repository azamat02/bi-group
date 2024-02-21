require('dotenv').config();
const express = require('express');
const { bot } = require('./src/bot');
const routes = require('./src/routes');
const cors = require("cors");
const bodyParser = require("body-parser");
const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

require('./src/webhooks/websocket')

// Initialize routes
routes(app,bot);

// Start the Telegram bot
bot.launch().then(() => {
    console.log('Bot is running...');
});

// Start the Express server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});