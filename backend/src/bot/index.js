const { Telegraf, Scenes, session, Markup} = require('telegraf');
const setupScenes = require('./scenes');
const bot = new Telegraf(process.env.BOT_TOKEN);
const stage = new Scenes.Stage([]);
setupScenes(stage);

bot.use(session());
bot.use(stage.middleware());

bot.start((ctx) => {
    const name = ctx.from.first_name || "Гость";
    const welcomeMessage = `Привет, ${name}! 👋\nДобро пожаловать в официального бота BI Group. Чем мы можем помочь?`;

    ctx.reply(welcomeMessage, Markup.keyboard([
        ['ℹ️ Информация о компании'],
        ['🏘 Посмотреть доступные ЖК'],
        ['💬 Чат с консультантом'],
        ['🗺 Карта точек ОП'],
        ['🤳 Наши социальные сети'],
        ['❓ Часто задаваемые вопросы'],
        ['💡 Ваши предложения по улучшению бота'],
        ['📞 Позвонить в колл-центр'],
    ]).resize());
});

bot.hears('🏘 Посмотреть доступные ЖК', (ctx) => {
    const webAppUrl = 'http://localhost:5173'; // Replace with your actual web app URL

    // Send the message with the link to the web app
    ctx.reply('', Markup.button.webApp('App', webAppUrl));
});

bot.hears('🗺 Карта точек ОП', (ctx) => {
    // Первая локация
    const location1 = {
        latitude: 41.348122,
        longitude: 69.338873,
        text: 'Отдел продаж\nАдрес: ул. Шахриабад 11',
        yandexMapUrl: 'https://yandex.ru/maps/-/CDBN5Jms',
        twoGisMapUrl: 'https://2gis.uz/tashkent/search/bi%20group/firm/70000001082948223/69.338341%2C41.348295?m=69.279857%2C41.31118%2F11'
    };

    // Вторая локация
    const location2 = {
        latitude: 41.284310,
        longitude: 69.266639,
        text: 'Центральный отдел продаж\nАдрес: ул. Нукус 91/1',
        yandexMapUrl: 'https://yandex.ru/maps/-/CDBN5JMJ',
        twoGisMapUrl: 'https://2gis.uz/tashkent/search/bi%20group/firm/70000001082526516/69.266838%2C41.284268?m=69.279857%2C41.31118%2F11'
    };

    // Отправка информации о первой локации
    ctx.replyWithLocation(location1.latitude, location1.longitude).then(() => {
        ctx.reply(location1.text, Markup.inlineKeyboard([
            [Markup.button.url('Ссылка на Яндекс Карты 🗺', location1.yandexMapUrl)],
            [Markup.button.url('Ссылка на карту 2GIS 🗺', location1.twoGisMapUrl)]
        ]));

        // Отправка информации о второй локации
        ctx.replyWithLocation(location2.latitude, location2.longitude).then(() => {
            ctx.reply(location2.text, Markup.inlineKeyboard([
                [Markup.button.url('Ссылка на Яндекс Карты 🗺', location2.yandexMapUrl)],
                [Markup.button.url('Ссылка на карту 2GIS 🗺', location2.twoGisMapUrl)]
            ]));
        });
    });
});

bot.hears('ℹ️ Информация о компании', (ctx) => {
    const message = `
*BI Group* - международный инновационный девелоперский холдинг, лидер на рынке недвижимости Казахстана.
- 28 лет на рынке
- +400 тыс жителей
- Топ 3 в СНГ по объему реализуемой недвижимости
- 8 городов
- +110 текущих проектов
    `;
    ctx.replyWithMarkdown(message);
});

bot.hears('📞 Позвонить в колл-центр', (ctx) => {
    ctx.reply('Вы можете позвонить в наш колл-центр по номеру: *1360*\nПожалуйста, скопируйте номер и вставьте его в ваше приложение для звонков.', { parse_mode: 'Markdown' });
});
bot.hears('💡 Ваши предложения по улучшению бота', (ctx) => ctx.scene.enter('suggestionScene'));

bot.hears('💬 Чат с консультантом', (ctx) => ctx.scene.enter('chatScene'));

bot.hears('🤳 Наши социальные сети', (ctx) => ctx.reply('Наши социальные сети 👇', Markup.inlineKeyboard([
    [Markup.button.url('Инстаграм', 'https://www.instagram.com/bi.group.tashkent?igsh=engzOHVyaWllZW1q')],
    [Markup.button.url('Телеграм', 'https://t.me/BIGROUPUZBEKISTAN')]
])));

// Export the bot, it can be started from server.js
module.exports = { bot };
