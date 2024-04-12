const { Scenes, Markup } = require('telegraf');
const {saveMessage} = require("../db/models");
const {broadcast} = require("../webhooks/websocket");
const pool = require("../db");
const {translations} = require("./index");

function setupScenes(stage) {
    const chatScene = new Scenes.BaseScene('chatScene');
    const suggestionScene = new Scenes.BaseScene('suggestionScene');

    suggestionScene.enter((ctx) => {
        const language = ctx.session.language || 'ru';
        ctx.reply(translations[language].suggestionPrompt);
    });
    suggestionScene.on('text', async (ctx) => {
        const suggestion = ctx.message.text;
        const userId = ctx.from.id;
        const { username, first_name, last_name } = ctx.from;

        // Save the suggestion in the database
        await pool.query('INSERT INTO suggestions(user_id, username, first_name, last_name, suggestion) VALUES($1, $2, $3, $4, $5)', [userId, username, first_name, last_name, suggestion]);

        const language = ctx.session.language || 'ru';
        ctx.reply(translations[language].suggestionThanks);
        ctx.scene.leave();
    });
    chatScene.enter((ctx) => {
        const language = ctx.session.language || 'ru';
        ctx.reply(translations[language].chatWelcome, Markup.keyboard([
            [translations[language].chatExit]
        ]).resize());
    });
    chatScene.on('text', async (ctx) => {
        const text = ctx.message.text;
        const language = ctx.session.language || 'ru';
        if (text === '/exit' || text === translations[language].chatExit) {
            ctx.reply(translations[language].chatExit);
            ctx.reply(translations[language].chooseOption, Markup.keyboard([
                [translations[language].companyInfo],
                [translations[language].addresses],
                [translations[language].call],
                [translations[language].chatWithConsultant],
                [translations[language].socialMedia],
                [translations[language].suggestions],
            ]).resize());
            ctx.scene.leave();
            return;
        }

        const photos = await ctx.telegram.getUserProfilePhotos(ctx.from.id);
        let file_id='default'
        if (photos && photos.total_count > 0) {
            file_id = photos.photos[0][0].file_id; // Getting the file ID of the latest photo
        }

        // User details
        const userDetails = {
            userId: ctx.from.id, // User's Telegram ID
            firstName: ctx.from.first_name, // User's first name
            lastName: ctx.from.last_name, // User's last name (might be undefined)
            username: ctx.from.username, // User's Telegram username (might be undefined)
            languageCode: ctx.from.language_code, // User's Telegram client's language
            profileImageId: file_id
        };

        try {
            const {rows} = await saveMessage(userDetails, text, false);
            broadcast({messageId: rows[0].id ,message: text, userData: userDetails, fromConsultant: false}); // Broadcast the message to all connected WebSocket clients
        } catch (error) {
            console.error('Error in webhook route:', error);
        }
    });
    chatScene.on('message', (ctx) => {
        const language = ctx.session.language || 'ru';
        ctx.reply(translations[language].textOnly);
    });

    stage.register(chatScene);
    stage.register(suggestionScene);
}

module.exports = setupScenes;