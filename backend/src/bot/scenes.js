const { Scenes, Markup } = require('telegraf');
const {saveMessage} = require("../db/models");
const {broadcast} = require("../webhooks/websocket");
const pool = require("../db");

function setupScenes(stage) {
    const chatScene = new Scenes.BaseScene('chatScene');
    const suggestionScene = new Scenes.BaseScene('suggestionScene');

    suggestionScene.enter((ctx) => ctx.reply('Напишите любые предложения по улучшению работы бота:'));
    suggestionScene.on('text', async (ctx) => {
        const suggestion = ctx.message.text;
        const userId = ctx.from.id;
        const { username, first_name, last_name } = ctx.from;

        // Сохранение предложения в базе данных
        await pool.query('INSERT INTO suggestions(user_id, username, first_name, last_name, suggestion) VALUES($1, $2, $3, $4, $5)', [userId, username, first_name, last_name, suggestion]);

        ctx.reply('Спасибо за ваше предложение!');
        ctx.scene.leave();
    });
    chatScene.enter((ctx) => ctx.reply('Добро пожаловать в чат поддержки! Чтобы мы могли вам помочь, пожалуйста, сначала напишите ваше сообщение или опишите вопрос. Сразу после того, как мы получим ваше обращение, наш консультант свяжется с вами! Введите /exit для выхода. ', Markup.keyboard([
        ['Выход с чата']
    ])));
    chatScene.on('text', async (ctx) => {
        const text = ctx.message.text;
        if (text === '/exit' || text === 'Выход с чата') {
            ctx.reply('Вы вышли из чата с консультантом.');
            ctx.reply('Выберите действие:', Markup.keyboard([
                ['ℹ️ Информация о компании'],
                ['🗺 Карта точек ОП'],
                ['🤳 Наши социальные сети'],
                ['❓ Часто задаваемые вопросы'],
                ['💡 Ваши предложения по улучшению бота'],
                ['📞 Позвонить в колл-центр'],
                ['💬 Чат с консультантом'],
                ['🏘 Посмотреть доступные ЖК']
            ]).resize());
            return ctx.scene.leave();
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
    chatScene.on('message', (ctx) => ctx.reply('Пожалуйста, отправляйте только текстовые сообщения.'));

    stage.register(chatScene);
    stage.register(suggestionScene);
}

module.exports = setupScenes;